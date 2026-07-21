const prisma = require("../config/prisma");

const {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} = require("mercadopago");

const {
  getPaymentById,
} = require("../services/mercadoPagoService");

const ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

const PAYMENT_STATUS_MAP = {
  approved: ORDER_STATUS.PAID,

  pending: ORDER_STATUS.PENDING,
  in_process: ORDER_STATUS.PENDING,
  authorized: ORDER_STATUS.PENDING,

  rejected: ORDER_STATUS.CANCELLED,
  cancelled: ORDER_STATUS.CANCELLED,

  refunded: ORDER_STATUS.REFUNDED,
  charged_back: ORDER_STATUS.REFUNDED,
};

const FULFILLMENT_STATUSES = [
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

class WebhookProcessingError extends Error {
  constructor(message) {
    super(message);

    this.name = "WebhookProcessingError";
  }
}

function getNotificationDataId(req) {
  return String(
    req.query?.["data.id"] ||
      req.body?.data?.id ||
      ""
  ).trim();
}

function getNotificationType(req) {
  return String(
    req.query?.type ||
      req.body?.type ||
      req.body?.topic ||
      ""
  )
    .trim()
    .toLowerCase();
}

function validateWebhookSignature(req) {
  const secret =
    process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    throw new WebhookProcessingError(
      "MERCADO_PAGO_WEBHOOK_SECRET não foi configurado."
    );
  }

  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];
  const dataId = getNotificationDataId(req);

  if (!xSignature || !xRequestId || !dataId) {
    throw new InvalidWebhookSignatureError(
      "Dados obrigatórios da assinatura não foram recebidos."
    );
  }

  WebhookSignatureValidator.validate({
    xSignature,
    xRequestId,
    dataId,
    secret,
  });
}

function amountsMatch(firstValue, secondValue) {
  const first = Number(firstValue);
  const second = Number(secondValue);

  if (
    !Number.isFinite(first) ||
    !Number.isFinite(second)
  ) {
    return false;
  }

  return Math.abs(first - second) < 0.01;
}

function resolveOrderStatus(
  currentStatus,
  incomingStatus
) {
  /*
   * Reembolso é definitivo para o fluxo automático.
   */
  if (
    currentStatus === ORDER_STATUS.REFUNDED
  ) {
    return ORDER_STATUS.REFUNDED;
  }

  /*
   * Um reembolso confirmado pode substituir
   * qualquer status anterior.
   */
  if (
    incomingStatus === ORDER_STATUS.REFUNDED
  ) {
    return ORDER_STATUS.REFUNDED;
  }

  /*
   * Pedidos que já avançaram na operação não
   * devem voltar para PAID, PENDING ou CANCELLED
   * por causa de notificações atrasadas.
   */
  if (
    FULFILLMENT_STATUSES.includes(
      currentStatus
    )
  ) {
    return currentStatus;
  }

  /*
   * Um pedido já pago não pode voltar para
   * pendente ou cancelado por evento atrasado.
   */
  if (
    currentStatus === ORDER_STATUS.PAID &&
    [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CANCELLED,
    ].includes(incomingStatus)
  ) {
    return currentStatus;
  }

  return incomingStatus;
}

async function updateOrderFromPayment(payment) {
  const paymentId = String(
    payment?.id || ""
  ).trim();

  const orderId = String(
    payment?.external_reference ||
      payment?.metadata?.order_id ||
      ""
  ).trim();

  const mercadoPagoStatus = String(
    payment?.status || ""
  )
    .trim()
    .toLowerCase();

  const incomingOrderStatus =
    PAYMENT_STATUS_MAP[mercadoPagoStatus];

  if (!paymentId) {
    throw new WebhookProcessingError(
      "O pagamento não possui um ID válido."
    );
  }

  if (!orderId) {
    throw new WebhookProcessingError(
      "O pagamento não possui referência para um pedido."
    );
  }

  if (!incomingOrderStatus) {
    console.warn(
      "Status do Mercado Pago não mapeado:",
      {
        paymentId,
        mercadoPagoStatus,
      }
    );

    return {
      ignored: true,
      reason: "PAYMENT_STATUS_NOT_MAPPED",
    };
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },

    include: {
      items: true,
    },
  });

  if (!order) {
    throw new WebhookProcessingError(
      `Pedido ${orderId} não encontrado.`
    );
  }

  const currencyId = String(
    payment?.currency_id || ""
  )
    .trim()
    .toUpperCase();

  if (currencyId !== "BRL") {
    throw new WebhookProcessingError(
      `Moeda inválida para o pedido ${order.id}.`
    );
  }

  if (
    !amountsMatch(
      payment?.transaction_amount,
      order.total
    )
  ) {
    console.error(
      "Valor do pagamento diferente do pedido:",
      {
        orderId: order.id,
        paymentId,
        orderTotal: String(order.total),
        paymentTotal:
          payment?.transaction_amount,
      }
    );

    throw new WebhookProcessingError(
      "O valor recebido não corresponde ao valor do pedido."
    );
  }

  /*
   * Um pedido não deve trocar de pagamento depois
   * de já estar associado a outro paymentId.
   */
  if (
    order.paymentId &&
    String(order.paymentId) !== paymentId
  ) {
    throw new WebhookProcessingError(
      "O pedido já está relacionado a outro pagamento."
    );
  }

  /*
   * Também impede que o mesmo pagamento seja
   * associado a dois pedidos diferentes.
   */
  const existingPaymentOrder =
    await prisma.order.findFirst({
      where: {
        paymentId,

        NOT: {
          id: order.id,
        },
      },

      select: {
        id: true,
      },
    });

  if (existingPaymentOrder) {
    throw new WebhookProcessingError(
      "Este pagamento já está relacionado a outro pedido."
    );
  }

  const resolvedOrderStatus =
    resolveOrderStatus(
      order.status,
      incomingOrderStatus
    );

  const shouldReduceStock =
    mercadoPagoStatus === "approved" &&
    !order.stockReducedAt;

  const updatedOrder = await prisma.$transaction(
    async (transaction) => {
      let stockWasClaimed = false;

      /*
       * Somente uma execução consegue preencher
       * stockReducedAt. Isso torna a baixa de estoque
       * idempotente em webhooks repetidos.
       */
      if (shouldReduceStock) {
        const stockClaim =
          await transaction.order.updateMany({
            where: {
              id: order.id,
              stockReducedAt: null,
            },

            data: {
              stockReducedAt: new Date(),
            },
          });

        stockWasClaimed =
          stockClaim.count === 1;
      }

      if (stockWasClaimed) {
        for (const item of order.items) {
          if (!item.variationId) {
            throw new WebhookProcessingError(
              `O item ${item.productName} não possui uma variação válida.`
            );
          }

          const stockUpdate =
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

          if (stockUpdate.count !== 1) {
            throw new WebhookProcessingError(
              `Estoque insuficiente para ${item.productName}, tamanho ${item.size || "não informado"}.`
            );
          }
        }
      }

      return transaction.order.update({
        where: {
          id: order.id,
        },

        data: {
          status: resolvedOrderStatus,
          paymentId,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
        },
      });
    }
  );

  const statusWasPreserved =
    resolvedOrderStatus !==
    incomingOrderStatus;

  return {
    ignored: statusWasPreserved,
    reason: statusWasPreserved
      ? "ORDER_STATUS_PRESERVED"
      : null,
    order: updatedOrder,
  };
}

const mercadoPagoWebhook = async (
  req,
  res
) => {
  try {
    validateWebhookSignature(req);

    const notificationType =
      getNotificationType(req);

    const paymentId =
      getNotificationDataId(req);

    /*
     * Outros tipos de evento podem chegar nesta
     * rota, mas somente pagamentos são processados.
     */
    if (
      notificationType &&
      notificationType !== "payment"
    ) {
      console.log(
        "Webhook ignorado por não ser de pagamento:",
        {
          notificationType,
          dataId: paymentId,
        }
      );

      return res.status(200).json({
        received: true,
        processed: false,
        ignored: true,
      });
    }

    if (!paymentId) {
      return res.status(400).json({
        message:
          "O ID do pagamento não foi informado.",
      });
    }

    /*
     * O corpo do webhook não é usado como fonte
     * de verdade. O pagamento é consultado
     * diretamente no Mercado Pago.
     */
    const payment =
      await getPaymentById(paymentId);

    const result =
      await updateOrderFromPayment(payment);

    console.log(
      "Webhook do Mercado Pago processado:",
      {
        paymentId,
        mercadoPagoStatus: payment.status,

        orderId:
          payment.external_reference ||
          payment.metadata?.order_id,

        ignored: result.ignored,
        reason: result.reason || null,
      }
    );

    return res.status(200).json({
      received: true,
      processed: !result.ignored,
      ignored: result.ignored,
    });
  } catch (error) {
    if (
      error instanceof
      InvalidWebhookSignatureError
    ) {
      console.warn(
        "Webhook com assinatura inválida:",
        error.message
      );

      return res.status(401).json({
        message:
          "Assinatura do webhook inválida.",
      });
    }

    console.error(
      "Erro ao processar webhook do Mercado Pago:",
      error
    );

    return res.status(500).json({
      message:
        "Erro ao processar webhook do Mercado Pago.",
    });
  }
};

module.exports = {
  mercadoPagoWebhook,
};