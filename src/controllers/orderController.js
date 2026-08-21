const prisma = require("../config/prisma");

// ==========================================
// STATUS DOS PEDIDOS
// ==========================================

const ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

const VALID_ORDER_STATUSES =
  Object.values(ORDER_STATUS);

const STOCK_REDUCING_STATUSES = [
  ORDER_STATUS.PAID,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

// ==========================================
// CAMPOS OBRIGATÓRIOS DE ENTREGA
// ==========================================

const REQUIRED_SHIPPING_FIELDS = [
  {
    field: "name",
    label: "nome",
  },
  {
    field: "phone",
    label: "telefone",
  },
  {
    field: "zipCode",
    label: "CEP",
  },
  {
    field: "street",
    label: "rua",
  },
  {
    field: "number",
    label: "número",
  },
  {
    field: "neighborhood",
    label: "bairro",
  },
  {
    field: "city",
    label: "cidade",
  },
  {
    field: "state",
    label: "estado",
  },
];

// ==========================================
// ERRO PERSONALIZADO
// ==========================================

class OrderError extends Error {
  constructor(
    message,
    statusCode = 400,
    code = null,
    details = null
  ) {
    super(message);

    this.name = "OrderError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// ==========================================
// RESPOSTA DE ERRO INTERNO
// ==========================================

function sendServerError(
  res,
  message = "Erro interno do servidor."
) {
  return res.status(500).json({
    message,
  });
}

// ==========================================
// HELPERS GERAIS
// ==========================================

function normalizeOrderStatus(status) {
  if (typeof status !== "string") {
    return "";
  }

  return status
    .trim()
    .toUpperCase();
}

function normalizeText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function normalizeZipCode(value) {
  return normalizeText(value)
    .replace(/\D/g, "");
}

function normalizePositiveNumber(
  value,
  fieldName
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    throw new OrderError(
      `${fieldName} inválido.`,
      400,
      "INVALID_SHIPPING_PRODUCT_DATA"
    );
  }

  return number;
}

// ==========================================
// MELHOR ENVIO
// ==========================================

function getMelhorEnvioBaseUrl() {
  const environment =
    normalizeText(
      process.env
        .MELHOR_ENVIO_ENVIRONMENT ||
        "sandbox"
    ).toLowerCase();

  if (
    environment === "production"
  ) {
    return "https://melhorenvio.com.br";
  }

  return "https://sandbox.melhorenvio.com.br";
}

function getMelhorEnvioToken() {
  return normalizeText(
    process.env.MELHOR_ENVIO_TOKEN
  );
}

function getMelhorEnvioUserAgent() {
  return (
    normalizeText(
      process.env
        .MELHOR_ENVIO_USER_AGENT
    ) ||
    "Trinity Corp"
  );
}

function getMelhorEnvioOriginZipCode() {
  return normalizeZipCode(
    process.env
      .MELHOR_ENVIO_ORIGIN_ZIP_CODE
  );
}

function isMelhorEnvioConfigured() {
  const token =
    getMelhorEnvioToken();

  const originZipCode =
    getMelhorEnvioOriginZipCode();

  return (
    Boolean(token) &&
    originZipCode.length === 8
  );
}

// ==========================================
// ENDEREÇO DO CLIENTE
// ==========================================

function getMissingShippingFields(
  user
) {
  return REQUIRED_SHIPPING_FIELDS
    .filter(({ field }) => {
      const value =
        user?.[field];

      return !normalizeText(
        value
      );
    })
    .map(
      ({
        field,
        label,
      }) => ({
        field,
        label,
      })
    );
}

function validateShippingAddress(
  user
) {
  const missingFields =
    getMissingShippingFields(
      user
    );

  if (
    missingFields.length > 0
  ) {
    throw new OrderError(
      "Complete seu endereço de entrega antes de finalizar a compra.",
      400,
      "INCOMPLETE_SHIPPING_ADDRESS",
      {
        missingFields:
          missingFields.map(
            ({ field }) =>
              field
          ),

        missingLabels:
          missingFields.map(
            ({ label }) =>
              label
          ),
      }
    );
  }

  const zipCode =
    normalizeZipCode(
      user.zipCode
    );

  if (
    zipCode.length !== 8
  ) {
    throw new OrderError(
      "O CEP cadastrado é inválido.",
      400,
      "INVALID_SHIPPING_ZIP_CODE",
      {
        field: "zipCode",
      }
    );
  }

  const state =
    normalizeText(
      user.state
    ).toUpperCase();

  if (
    state.length !== 2
  ) {
    throw new OrderError(
      "O estado do endereço deve possuir uma UF válida.",
      400,
      "INVALID_SHIPPING_STATE",
      {
        field: "state",
      }
    );
  }

  return {
    shippingName:
      normalizeText(
        user.name
      ),

    shippingPhone:
      normalizeText(
        user.phone
      ),

    shippingZipCode:
      zipCode,

    shippingStreet:
      normalizeText(
        user.street
      ),

    shippingNumber:
      normalizeText(
        user.number
      ),

    shippingComplement:
      normalizeText(
        user.complement
      ) || null,

    shippingNeighborhood:
      normalizeText(
        user.neighborhood
      ),

    shippingCity:
      normalizeText(
        user.city
      ),

    shippingState:
      state,
  };
}

// ==========================================
// NORMALIZAR ITENS RECEBIDOS
// ==========================================

function normalizeRequestItems(
  items
) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new OrderError(
      "Pedido vazio.",
      400,
      "EMPTY_ORDER"
    );
  }

  const groupedItems =
    new Map();

  for (const item of items) {
    const productId =
      Number(
        item?.productId
      );

    const variationId =
      Number(
        item?.variationId
      );

    const quantity =
      Number(
        item?.quantity
      );

    if (
      !Number.isInteger(
        productId
      ) ||
      productId <= 0 ||
      !Number.isInteger(
        variationId
      ) ||
      variationId <= 0 ||
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      throw new OrderError(
        "Um ou mais itens do pedido são inválidos.",
        400,
        "INVALID_ORDER_ITEM"
      );
    }

    const key =
      `${productId}:${variationId}`;

    const existingItem =
      groupedItems.get(key);

    if (existingItem) {
      existingItem.quantity +=
        quantity;

      continue;
    }

    groupedItems.set(
      key,
      {
        productId,
        variationId,
        quantity,
      }
    );
  }

  return Array.from(
    groupedItems.values()
  );
}

// ==========================================
// NORMALIZAR FRETE ESCOLHIDO NO FRONTEND
// ==========================================

function normalizeRequestedShipping(
  shipping
) {
  if (
    !shipping ||
    typeof shipping !== "object"
  ) {
    return null;
  }

  const serviceId =
    normalizeText(
      shipping.serviceId ??
        shipping.id
    );

  if (!serviceId) {
    return null;
  }

  return {
    serviceId,

    service:
      normalizeText(
        shipping.service
      ) || null,

    company:
      normalizeText(
        shipping.company
      ) || null,

    // Este preço NÃO será considerado
    // confiável pelo backend.
    requestedPrice:
      Number(
        shipping.price
      ),

    deadline:
      Number.isInteger(
        Number(
          shipping.deadline
        )
      )
        ? Number(
            shipping.deadline
          )
        : null,
  };
}

// ==========================================
// INCLUDES PADRÃO DOS PEDIDOS
// ==========================================

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

// ==========================================
// PREPARAR PRODUTOS PARA COTAÇÃO
// ==========================================

function buildShippingProducts(
  normalizedItems,
  variationMap
) {
  return normalizedItems.map(
    (item) => {
      const variation =
        variationMap.get(
          item.variationId
        );

      if (
        !variation ||
        !variation.product
      ) {
        throw new OrderError(
          "Não foi possível preparar um dos produtos para o cálculo do frete.",
          400,
          "INVALID_SHIPPING_PRODUCT"
        );
      }

      const product =
        variation.product;

      const weight =
        normalizePositiveNumber(
          product.weight,
          `Peso do produto ${product.name}`
        );

      const width =
        normalizePositiveNumber(
          product.width,
          `Largura do produto ${product.name}`
        );

      const height =
        normalizePositiveNumber(
          product.height,
          `Altura do produto ${product.name}`
        );

      const length =
        normalizePositiveNumber(
          product.length,
          `Comprimento do produto ${product.name}`
        );

      const price =
        normalizePositiveNumber(
          product.price,
          `Preço do produto ${product.name}`
        );

      return {
        id:
          String(
            product.id
          ),

        width,
        height,
        length,
        weight,

        insurance_value:
          Number(
            price.toFixed(2)
          ),

        quantity:
          item.quantity,
      };
    }
  );
}

// ==========================================
// NORMALIZAR RESPOSTA DO MELHOR ENVIO
// ==========================================

function normalizeMelhorEnvioOptions(
  data
) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .filter(
      (option) =>
        option &&
        !option.error &&
        option.id !== undefined
    )
    .map(
      (option) => {
        const price =
          Number(
            option.custom_price ??
              option.price
          );

        const deadline =
          Number(
            option.custom_delivery_time ??
              option.delivery_time
          );

        return {
          id:
            String(
              option.id
            ),

          name:
            normalizeText(
              option.name
            ) || null,

          company:
            normalizeText(
              option.company?.name
            ) || null,

          price:
            Number.isFinite(
              price
            )
              ? price
              : null,

          deadline:
            Number.isFinite(
              deadline
            )
              ? deadline
              : null,
        };
      }
    );
}
// ==========================================
// VALIDAR FRETE NO MELHOR ENVIO
// ==========================================

async function validateShippingWithMelhorEnvio({
  requestedShipping,
  shippingZipCode,
  shippingProducts,
}) {
  if (!requestedShipping) {
    throw new OrderError(
      "Selecione uma opção de frete antes de finalizar a compra.",
      400,
      "SHIPPING_REQUIRED"
    );
  }

  const token =
    getMelhorEnvioToken();

  const originZipCode =
    getMelhorEnvioOriginZipCode();

  if (
    !token ||
    originZipCode.length !== 8
  ) {
    throw new OrderError(
      "A integração com o Melhor Envio ainda não está configurada.",
      503,
      "MELHOR_ENVIO_NOT_CONFIGURED"
    );
  }

  const response =
    await fetch(
      `${getMelhorEnvioBaseUrl()}/api/v2/me/shipment/calculate`,
      {
        method: "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,

          "User-Agent":
            getMelhorEnvioUserAgent(),
        },

        body:
          JSON.stringify({
            from: {
              postal_code:
                originZipCode,
            },

            to: {
              postal_code:
                shippingZipCode,
            },

            products:
              shippingProducts,
          }),
      }
    );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    console.error(
      "Erro ao validar frete no Melhor Envio:",
      data
    );

    throw new OrderError(
      data?.message ||
        "Não foi possível validar o frete selecionado.",
      response.status,
      "MELHOR_ENVIO_ERROR",
      data
    );
  }

  const options =
    normalizeMelhorEnvioOptions(
      data
    );

  const selectedOption =
    options.find(
      (option) =>
        String(
          option.id
        ) ===
        String(
          requestedShipping
            .serviceId
        )
    );

  if (!selectedOption) {
    throw new OrderError(
      "A opção de frete selecionada não está mais disponível. Calcule o frete novamente.",
      409,
      "SHIPPING_OPTION_NOT_AVAILABLE"
    );
  }

  if (
    selectedOption.price ===
      null ||
    !Number.isFinite(
      selectedOption.price
    ) ||
    selectedOption.price < 0
  ) {
    throw new OrderError(
      "O Melhor Envio retornou um valor de frete inválido.",
      502,
      "INVALID_SHIPPING_PRICE"
    );
  }

  return {
    shippingServiceId:
      selectedOption.id,

    shippingService:
      selectedOption.name,

    shippingCompany:
      selectedOption.company,

    shippingPrice:
      Number(
        selectedOption.price.toFixed(
          2
        )
      ),

    shippingDeadline:
      selectedOption.deadline,
  };
}

// ==========================================
// PREPARAR FRETE DO PEDIDO
// ==========================================

async function prepareOrderShipping({
  requestedShipping,
  shippingAddress,
  normalizedItems,
  variationMap,
}) {
  if (
    !isMelhorEnvioConfigured()
  ) {
    return {
      shippingServiceId:
        null,

      shippingService:
        null,

      shippingCompany:
        null,

      shippingPrice:
        0,

      shippingDeadline:
        null,
    };
  }

  const shippingProducts =
    buildShippingProducts(
      normalizedItems,
      variationMap
    );

  return validateShippingWithMelhorEnvio(
    {
      requestedShipping,

      shippingZipCode:
        shippingAddress
          .shippingZipCode,

      shippingProducts,
    }
  );
}

// ==========================================
// VALIDAR VARIAÇÕES E ESTOQUE
// ==========================================

function buildNormalizedOrderItems({
  requestItems,
  variationMap,
}) {
  return requestItems.map(
    (item) => {
      const variation =
        variationMap.get(
          item.variationId
        );

      if (
        !variation ||
        variation.productId !==
          item.productId
      ) {
        throw new OrderError(
          `Variação não encontrada para o produto ${item.productId}.`,
          404,
          "VARIATION_NOT_FOUND"
        );
      }

      if (
        variation.stock <
        item.quantity
      ) {
        throw new OrderError(
          `Estoque insuficiente para ${variation.product.name}, tamanho ${variation.size}.`,
          409,
          "INSUFFICIENT_STOCK"
        );
      }

      return {
        productId:
          variation.product.id,

        variationId:
          variation.id,

        productName:
          variation.product.name,

        size:
          variation.size,

        color:
          variation.color,

        quantity:
          item.quantity,

        unitPrice:
          Number(
            variation.product.price
          ),
      };
    }
  );
}

// ==========================================
// CALCULAR SUBTOTAL
// ==========================================

function calculateOrderSubtotal(
  normalizedItems
) {
  const calculatedSubtotal =
    normalizedItems.reduce(
      (
        total,
        item
      ) => {
        return (
          total +
          Number(
            item.unitPrice
          ) *
            Number(
              item.quantity
            )
        );
      },
      0
    );

  return Number(
    calculatedSubtotal.toFixed(
      2
    )
  );
}

// ==========================================
// BAIXAR ESTOQUE
// ==========================================

async function reduceOrderStock({
  transaction,
  items,
}) {
  for (const item of items) {
    if (!item.variationId) {
      throw new OrderError(
        `O item ${item.productName} não possui uma variação válida.`,
        409,
        "INVALID_ORDER_VARIATION"
      );
    }

    const updateResult =
      await transaction
        .variation
        .updateMany({
          where: {
            id:
              item.variationId,

            stock: {
              gte:
                item.quantity,
            },
          },

          data: {
            stock: {
              decrement:
                item.quantity,
            },
          },
        });

    if (
      updateResult.count === 0
    ) {
      throw new OrderError(
        `Estoque insuficiente para ${item.productName}, tamanho ${item.size}.`,
        409,
        "INSUFFICIENT_STOCK"
      );
    }
  }
}

// ==========================================
// DEVOLVER ESTOQUE
// ==========================================

async function restoreOrderStock({
  transaction,
  items,
}) {
  for (const item of items) {
    if (!item.variationId) {
      continue;
    }

    await transaction
      .variation
      .update({
        where: {
          id:
            item.variationId,
        },

        data: {
          stock: {
            increment:
              item.quantity,
          },
        },
      });
  }
}

// ==========================================
// VERIFICAR SE STATUS REDUZ ESTOQUE
// ==========================================

function shouldStatusReduceStock(
  status
) {
  return (
    STOCK_REDUCING_STATUSES
      .includes(status)
  );
}

// ==========================================
// VERIFICAR SE STATUS DEVOLVE ESTOQUE
// ==========================================

function shouldStatusRestoreStock({
  previousStatus,
  nextStatus,
  stockReducedAt,
}) {
  const wasReduced =
    Boolean(
      stockReducedAt
    );

  const nextIsCancelled =
    nextStatus ===
      ORDER_STATUS.CANCELLED ||
    nextStatus ===
      ORDER_STATUS.REFUNDED;

  const previousWasFinal =
    previousStatus ===
      ORDER_STATUS.CANCELLED ||
    previousStatus ===
      ORDER_STATUS.REFUNDED;

  return (
    wasReduced &&
    nextIsCancelled &&
    !previousWasFinal
  );
}
// ==========================================
// CRIAR PEDIDO
// ==========================================

const createOrder = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({
          message:
            "Usuário não autenticado.",
        });
    }

    // ======================================
    // BUSCAR USUÁRIO
    // ======================================

    const user =
      await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,

          zipCode: true,
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
        },
      });

    if (!user) {
      throw new OrderError(
        "Usuário não encontrado.",
        404,
        "USER_NOT_FOUND"
      );
    }

    const shippingAddress =
      validateShippingAddress(
        user
      );

    // ======================================
    // VALIDAR ITENS
    // ======================================

    const requestItems =
      normalizeRequestItems(
        req.body?.items
      );

    const variationIds =
      requestItems.map(
        (item) =>
          item.variationId
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

    const variationMap =
      new Map(
        variations.map(
          (variation) => [
            variation.id,
            variation,
          ]
        )
      );

    const normalizedItems =
      buildNormalizedOrderItems({
        requestItems,
        variationMap,
      });

    // ======================================
    // SUBTOTAL
    // ======================================

    const subtotal =
      calculateOrderSubtotal(
        normalizedItems
      );

    // ======================================
    // FRETE SOLICITADO
    // ======================================

    const requestedShipping =
      normalizeRequestedShipping(
        req.body?.shipping
      );

    // ======================================
    // PREPARAR / VALIDAR FRETE
    // ======================================

    const preparedShipping =
      await prepareOrderShipping({
        requestedShipping,
        shippingAddress,
        normalizedItems,
        variationMap,
      });

    const shippingPrice =
      Number(
        preparedShipping
          .shippingPrice || 0
      );

    const total =
      Number(
        (
          subtotal +
          shippingPrice
        ).toFixed(2)
      );

    // ======================================
    // CRIAR PEDIDO
    // ======================================

    const order =
      await prisma.order.create({
        data: {
          userId:
            req.user.id,

          status:
            ORDER_STATUS.PENDING,

          subtotal,

          shippingPrice,

          total,

          // ================================
          // FRETE
          // ================================

          shippingServiceId:
            preparedShipping
              .shippingServiceId,

          shippingService:
            preparedShipping
              .shippingService,

          shippingCompany:
            preparedShipping
              .shippingCompany,

          shippingDeadline:
            preparedShipping
              .shippingDeadline,

          trackingCode:
            null,

          trackingUrl:
            null,

          shippingLabelUrl:
            null,

          // ================================
          // ENDEREÇO CONGELADO
          // ================================

          shippingName:
            shippingAddress
              .shippingName,

          shippingPhone:
            shippingAddress
              .shippingPhone,

          shippingZipCode:
            shippingAddress
              .shippingZipCode,

          shippingStreet:
            shippingAddress
              .shippingStreet,

          shippingNumber:
            shippingAddress
              .shippingNumber,

          shippingComplement:
            shippingAddress
              .shippingComplement,

          shippingNeighborhood:
            shippingAddress
              .shippingNeighborhood,

          shippingCity:
            shippingAddress
              .shippingCity,

          shippingState:
            shippingAddress
              .shippingState,

          // ================================
          // ITENS
          // ================================

          items: {
            create:
              normalizedItems,
          },
        },

        include:
          getOrderInclude({
            includeCpfAndAddress:
              true,
          }),
      });

    return res
      .status(201)
      .json(order);
  } catch (error) {
    if (
      error instanceof
      OrderError
    ) {
      return res
        .status(
          error.statusCode
        )
        .json({
          message:
            error.message,

          ...(error.code
            ? {
                code:
                  error.code,
              }
            : {}),

          ...(error.details
            ? error.details
            : {}),
        });
    }

    console.error(
      "Erro ao criar pedido:",
      error
    );

    return sendServerError(
      res,
      "Erro ao criar pedido."
    );
  }
};

// ==========================================
// LISTAR PEDIDOS DO USUÁRIO
// ==========================================

const getMyOrders = async (
  req,
  res
) => {
  try {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({
          message:
            "Usuário não autenticado.",
        });
    }

    const orders =
      await prisma.order.findMany({
        where: {
          userId:
            req.user.id,
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

    return res
      .status(200)
      .json(orders);
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

// ==========================================
// LISTAR TODOS OS PEDIDOS
// ==========================================

const getAllOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await prisma.order.findMany({
        include:
          getOrderInclude(),

        orderBy: {
          createdAt: "desc",
        },
      });

    return res
      .status(200)
      .json(orders);
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

// ==========================================
// BUSCAR PEDIDO POR ID
// ==========================================

const getOrderById = async (
  req,
  res
) => {
  try {
    const id =
      req.params?.id?.trim();

    if (!id) {
      return res
        .status(400)
        .json({
          message:
            "ID do pedido inválido.",
        });
    }

    const order =
      await prisma.order.findUnique({
        where: {
          id,
        },

        include:
          getOrderInclude({
            includeCpfAndAddress:
              true,
          }),
      });

    if (!order) {
      return res
        .status(404)
        .json({
          message:
            "Pedido não encontrado.",
        });
    }

    return res
      .status(200)
      .json(order);
  } catch (error) {
    console.error(
      "Erro ao buscar pedido:",
      error
    );

    return sendServerError(
      res,
      "Erro ao buscar pedido."
    );
  }
};
// ==========================================
// ATUALIZAR STATUS DO PEDIDO
// ==========================================

const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const id =
      String(
        req.params?.id || ""
      ).trim();

    const status =
      normalizeOrderStatus(
        req.body?.status
      );

    if (!id) {
      return res
        .status(400)
        .json({
          message:
            "ID do pedido inválido.",
        });
    }

    if (
      !VALID_ORDER_STATUSES.includes(
        status
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "Status do pedido inválido.",
          code:
            "INVALID_ORDER_STATUS",
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
      return res
        .status(404)
        .json({
          message:
            "Pedido não encontrado.",
        });
    }

    if (
      existingOrder.status ===
      status
    ) {
      const unchangedOrder =
        await prisma.order.findUnique({
          where: {
            id,
          },

          include:
            getOrderInclude({
              includeCpfAndAddress:
                true,
            }),
        });

      return res
        .status(200)
        .json(
          unchangedOrder
        );
    }

    const shouldReduce =
      shouldStatusReduceStock(
        status
      ) &&
      !existingOrder
        .stockReducedAt;

    const shouldRestore =
      shouldStatusRestoreStock({
        previousStatus:
          existingOrder.status,

        nextStatus:
          status,

        stockReducedAt:
          existingOrder
            .stockReducedAt,
      });

    const updatedOrder =
      await prisma.$transaction(
        async (
          transaction
        ) => {
          if (
            shouldReduce
          ) {
            await reduceOrderStock({
              transaction,

              items:
                existingOrder.items,
            });
          }

          if (
            shouldRestore
          ) {
            await restoreOrderStock({
              transaction,

              items:
                existingOrder.items,
            });
          }

          return transaction
            .order
            .update({
              where: {
                id,
              },

              data: {
                status,

                ...(shouldReduce
                  ? {
                      stockReducedAt:
                        new Date(),
                    }
                  : {}),

                ...(shouldRestore
                  ? {
                      stockReducedAt:
                        null,
                    }
                  : {}),
              },

              include:
                getOrderInclude({
                  includeCpfAndAddress:
                    true,
                }),
            });
        }
      );

    return res
      .status(200)
      .json(
        updatedOrder
      );
  } catch (error) {
    if (
      error instanceof
      OrderError
    ) {
      return res
        .status(
          error.statusCode
        )
        .json({
          message:
            error.message,

          ...(error.code
            ? {
                code:
                  error.code,
              }
            : {}),

          ...(error.details
            ? error.details
            : {}),
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

// ==========================================
// ATUALIZAR RASTREAMENTO DO PEDIDO
// ==========================================

const updateOrderTracking = async (
  req,
  res
) => {
  try {
    const id =
      String(
        req.params?.id || ""
      ).trim();

    if (!id) {
      return res
        .status(400)
        .json({
          message:
            "ID do pedido inválido.",
        });
    }

    const trackingCode =
      normalizeText(
        req.body?.trackingCode
      );

    const trackingUrl =
      normalizeText(
        req.body?.trackingUrl
      );

    if (
      trackingUrl &&
      !/^https?:\/\//i.test(
        trackingUrl
      )
    ) {
      return res
        .status(400)
        .json({
          message:
            "A URL de rastreamento é inválida.",
          code:
            "INVALID_TRACKING_URL",
        });
    }

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    if (!existingOrder) {
      return res
        .status(404)
        .json({
          message:
            "Pedido não encontrado.",
        });
    }

    const updatedOrder =
      await prisma.order.update({
        where: {
          id,
        },

        data: {
          trackingCode:
            trackingCode ||
            null,

          trackingUrl:
            trackingUrl ||
            null,
        },

        include:
          getOrderInclude({
            includeCpfAndAddress:
              true,
          }),
      });

    return res
      .status(200)
      .json(
        updatedOrder
      );
  } catch (error) {
    console.error(
      "Erro ao atualizar rastreamento do pedido:",
      error
    );

    return sendServerError(
      res,
      "Erro ao atualizar rastreamento do pedido."
    );
  }
};

// ==========================================
// DASHBOARD ADMINISTRATIVO
// ==========================================

const getDashboard = async (
  req,
  res
) => {
  try {
    const [
      products,
      users,
      orders,
      revenue,
      pendingOrders,
      productsWithInventory,
    ] =
      await Promise.all([
        prisma.product.count(),

        prisma.user.count(),

        prisma.order.count(),

        prisma.order.aggregate({
          where: {
            status: {
              in:
                STOCK_REDUCING_STATUSES,
            },
          },

          _sum: {
            total: true,
          },
        }),

        prisma.order.count({
          where: {
            status:
              ORDER_STATUS.PENDING,
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
      productsWithInventory
        .filter(
          (product) =>
            product.variations.some(
              (variation) =>
                Number(
                  variation.stock
                ) <= 5
            )
        )
        .length;

    const productsWithoutImage =
      productsWithInventory
        .filter(
          (product) =>
            !Array.isArray(
              product.images
            ) ||
            product.images
              .length === 0
        )
        .length;

    return res
      .status(200)
      .json({
        products,

        users,

        orders,

        revenue:
          Number(
            revenue._sum
              .total || 0
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

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderTracking,
  getDashboard,
};