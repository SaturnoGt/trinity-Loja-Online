const prisma = require("../config/prisma");

const ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

const VALID_ORDER_STATUSES = Object.values(
  ORDER_STATUS
);

const STOCK_REDUCING_STATUSES = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

class OrderError extends Error {
  constructor(message, statusCode = 400) {
    super(message);

    this.name = "OrderError";
    this.statusCode = statusCode;
  }
}

function sendServerError(
  res,
  message = "Erro interno do servidor."
) {
  return res.status(500).json({
    message,
  });
}

function normalizeOrderStatus(status) {
  if (typeof status !== "string") {
    return "";
  }

  return status.trim().toUpperCase();
}

function normalizeRequestItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderError("Pedido vazio.", 400);
  }

  const groupedItems = new Map();

  for (const item of items) {
    const productId = Number(item?.productId);
    const variationId = Number(item?.variationId);
    const quantity = Number(item?.quantity);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(variationId) ||
      variationId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new OrderError(
        "Um ou mais itens do pedido são inválidos.",
        400
      );
    }

    const key = `${productId}:${variationId}`;
    const existingItem = groupedItems.get(key);

    if (existingItem) {
      existingItem.quantity += quantity;
      continue;
    }

    groupedItems.set(key, {
      productId,
      variationId,
      quantity,
    });
  }

  return Array.from(groupedItems.values());
}

function getOrderInclude({
  includeCpfAndAddress = false,
} = {}) {
  return {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,

        ...(includeCpfAndAddress
          ? {
              cpf: true,
              zipCode: true,
              street: true,
              number: true,
              complement: true,
              neighborhood: true,
              city: true,
              state: true,
            }
          : {}),
      },
    },

    items: {
      include: {
        product: {
          include: {
            images: true,
          },
        },

        variation: true,
      },
    },
  };
}

// =====================
// CRIAR PEDIDO
// =====================

const createOrder = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const requestItems = normalizeRequestItems(
      req.body?.items
    );

    const variationIds = requestItems.map(
      (item) => item.variationId
    );

    const variations =
      await prisma.variation.findMany({
        where: {
          id: {
            in: variationIds,
          },
        },

        include: {
          product: true,
        },
      });

    const variationMap = new Map(
      variations.map((variation) => [
        variation.id,
        variation,
      ])
    );

    const normalizedItems = requestItems.map(
      (item) => {
        const variation = variationMap.get(
          item.variationId
        );

        if (
          !variation ||
          variation.productId !== item.productId
        ) {
          throw new OrderError(
            `Variação não encontrada para o produto ${item.productId}.`,
            404
          );
        }

        if (variation.stock < item.quantity) {
          throw new OrderError(
            `Estoque insuficiente para ${variation.product.name}, tamanho ${variation.size}.`,
            409
          );
        }

        return {
          productId: variation.product.id,
          variationId: variation.id,
          productName: variation.product.name,
          size: variation.size,
          color: variation.color,
          quantity: item.quantity,
          unitPrice: variation.product.price,
        };
      }
    );

    const calculatedTotal = normalizedItems.reduce(
      (total, item) =>
        total +
        Number(item.unitPrice) * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        total: calculatedTotal,
        status: ORDER_STATUS.PENDING,

        items: {
          create: normalizedItems,
        },
      },

      include: getOrderInclude(),
    });

    return res.status(201).json(order);
  } catch (error) {
    if (error instanceof OrderError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error("Erro ao criar pedido:", error);

    return sendServerError(
      res,
      "Erro ao criar pedido."
    );
  }
};

// =====================
// LISTAR PEDIDOS DO USUÁRIO
// =====================

const getMyOrders = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: req.user.id,
      },

      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },

            variation: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error(
      "Erro ao buscar pedidos do usuário:",
      error
    );

    return sendServerError(
      res,
      "Erro ao buscar pedidos."
    );
  }
};

// =====================
// LISTAR TODOS OS PEDIDOS
// =====================

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: getOrderInclude(),

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error(
      "Erro ao buscar pedidos administrativos:",
      error
    );

    return sendServerError(
      res,
      "Erro ao buscar pedidos."
    );
  }
};

// =====================
// BUSCAR PEDIDO POR ID
// =====================

const getOrderById = async (req, res) => {
  try {
    const id = req.params?.id?.trim();

    if (!id) {
      return res.status(400).json({
        message: "ID do pedido inválido.",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
      },

      include: getOrderInclude({
        includeCpfAndAddress: true,
      }),
    });

    if (!order) {
      return res.status(404).json({
        message: "Pedido não encontrado.",
      });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);

    return sendServerError(
      res,
      "Erro ao buscar pedido."
    );
  }
};

// =====================
// ATUALIZAR STATUS DO PEDIDO
// =====================

const updateOrderStatus = async (req, res) => {
  try {
    const id = req.params?.id?.trim();
    const status = normalizeOrderStatus(
      req.body?.status
    );

    if (!id) {
      return res.status(400).json({
        message: "ID do pedido inválido.",
      });
    }

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Status de pedido inválido.",
      });
    }

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id,
        },

        include: {
          items: true,
        },
      });

    if (!existingOrder) {
      return res.status(404).json({
        message: "Pedido não encontrado.",
      });
    }

    if (existingOrder.status === status) {
      const unchangedOrder =
        await prisma.order.findUnique({
          where: {
            id,
          },

          include: getOrderInclude(),
        });

      return res.status(200).json(unchangedOrder);
    }

    const shouldReduceStock =
      STOCK_REDUCING_STATUSES.includes(status) &&
      !existingOrder.stockReducedAt;

    const updatedOrder = await prisma.$transaction(
      async (transaction) => {
        if (shouldReduceStock) {
          for (const item of existingOrder.items) {
            if (!item.variationId) {
              throw new OrderError(
                `O item ${item.productName} não possui uma variação válida.`,
                409
              );
            }

            const updateResult =
              await transaction.variation.updateMany({
                where: {
                  id: item.variationId,

                  stock: {
                    gte: item.quantity,
                  },
                },

                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });

            if (updateResult.count === 0) {
              throw new OrderError(
                `Estoque insuficiente para ${item.productName}, tamanho ${item.size}.`,
                409
              );
            }
          }
        }

        return transaction.order.update({
          where: {
            id,
          },

          data: {
            status,

            ...(shouldReduceStock
              ? {
                  stockReducedAt: new Date(),
                }
              : {}),
          },

          include: getOrderInclude(),
        });
      }
    );

    return res.status(200).json(updatedOrder);
  } catch (error) {
    if (error instanceof OrderError) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    console.error(
      "Erro ao atualizar status do pedido:",
      error
    );

    return sendServerError(
      res,
      "Erro ao atualizar status do pedido."
    );
  }
};

// =====================
// DASHBOARD ADMINISTRATIVO
// =====================

const getDashboard = async (req, res) => {
  try {
    const [
      products,
      users,
      orders,
      revenue,
      pendingOrders,
      productsWithInventory,
    ] = await Promise.all([
      prisma.product.count(),

      prisma.user.count(),

      prisma.order.count(),

      prisma.order.aggregate({
        where: {
          status: {
            in: STOCK_REDUCING_STATUSES,
          },
        },

        _sum: {
          total: true,
        },
      }),

      prisma.order.count({
        where: {
          status: ORDER_STATUS.PENDING,
        },
      }),

      prisma.product.findMany({
        select: {
          id: true,

          images: {
            select: {
              id: true,
            },

            take: 1,
          },

          variations: {
            select: {
              stock: true,
            },
          },
        },
      }),
    ]);

    const lowStockProducts =
      productsWithInventory.filter((product) =>
        product.variations.some(
          (variation) =>
            Number(variation.stock) <= 5
        )
      ).length;

    const productsWithoutImage =
      productsWithInventory.filter(
        (product) =>
          !Array.isArray(product.images) ||
          product.images.length === 0
      ).length;

    return res.status(200).json({
      products,
      users,
      orders,
      revenue: Number(
        revenue._sum.total || 0
      ),
      pendingOrders,
      lowStockProducts,
      productsWithoutImage,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar dashboard:",
      error
    );

    return sendServerError(
      res,
      "Erro ao carregar dashboard."
    );
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getDashboard,
};