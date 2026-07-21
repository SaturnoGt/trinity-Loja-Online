const prisma = require("../config/prisma");

const {
  createPaymentPreference,
} = require(
  "../services/mercadoPagoService"
);

const createPreference = async (
  req,
  res
) => {
  try {
    const { orderId } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        message:
          "O ID do pedido é obrigatório.",
      });
    }

    const order =
      await prisma.order.findFirst({
        where: {
          id: String(orderId),
          userId: req.user.id,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          items: true,
        },
      });

    if (!order) {
      return res.status(404).json({
        message:
          "Pedido não encontrado ou não pertence ao usuário autenticado.",
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Somente pedidos pendentes podem iniciar um pagamento.",
      });
    }

    if (
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {
      return res.status(400).json({
        message:
          "O pedido não possui itens para pagamento.",
      });
    }

    const calculatedTotal =
      order.items.reduce(
        (total, item) =>
          total +
          Number(item.unitPrice) *
            Number(item.quantity),
        0
      );

    const orderTotal = Number(order.total);

    const totalsMatch =
      Math.abs(
        calculatedTotal - orderTotal
      ) < 0.01;

    if (!totalsMatch) {
      console.error(
        "Total divergente no pedido:",
        {
          orderId: order.id,
          storedTotal: orderTotal,
          calculatedTotal,
        }
      );

      return res.status(409).json({
        message:
          "O valor do pedido está inconsistente. Entre em contato com o suporte.",
      });
    }

    const preference =
      await createPaymentPreference({
        order,
      });

    await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        preferenceId:
          preference.preferenceId,
      },
    });

    return res.status(201).json({
      orderId: order.id,
      preferenceId:
        preference.preferenceId,
      checkoutUrl:
        preference.checkoutUrl,
      initPoint:
        preference.initPoint,
      sandboxInitPoint:
        preference.sandboxInitPoint,
    });
  } catch (error) {
    console.error(
      "Erro ao criar preferência do Mercado Pago:",
      error
    );

    if (error?.cause) {
      console.error(
        "Detalhes do Mercado Pago:",
        JSON.stringify(
          error.cause,
          null,
          2
        )
      );
    }

    return res.status(500).json({
      message:
        error.message ||
        "Erro ao criar preferência de pagamento.",
    });
  }
};

module.exports = {
  createPreference,
};