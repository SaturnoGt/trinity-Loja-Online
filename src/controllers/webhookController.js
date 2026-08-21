const prisma = require("../config/prisma");

const {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} = require("mercadopago");

const {
  getPaymentById,
} = require(
  "../services/mercadoPagoService"
);

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

// ==========================================
// MAPEAMENTO MERCADO PAGO -> PEDIDO
// ==========================================

const PAYMENT_STATUS_MAP = {
  approved:
    ORDER_STATUS.PAID,

  pending:
    ORDER_STATUS.PENDING,

  in_process:
    ORDER_STATUS.PENDING,

  authorized:
    ORDER_STATUS.PENDING,

  rejected:
    ORDER_STATUS.CANCELLED,

  cancelled:
    ORDER_STATUS.CANCELLED,

  refunded:
    ORDER_STATUS.REFUNDED,

  charged_back:
    ORDER_STATUS.REFUNDED,
};

const FULFILLMENT_STATUSES = [
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

// ==========================================
// ERRO PERSONALIZADO
// ==========================================

class WebhookProcessingError extends Error {
  constructor(message) {
    super(message);

    this.name =
      "WebhookProcessingError";
  }
}

// ==========================================
// PEGAR ID DA NOTIFICAÇÃO
// ==========================================

function getNotificationDataId(
  req
) {
  return String(
    req.query?.["data.id"] ||
      req.body?.data?.id ||
      ""
  ).trim();
}

// ==========================================
// PEGAR TIPO DA NOTIFICAÇÃO
// ==========================================

function getNotificationType(
  req
) {
  return String(
    req.query?.type ||
      req.body?.type ||
      req.body?.topic ||
      ""
  )
    .trim()
    .toLowerCase();
}

// ==========================================
// VALIDAR ASSINATURA DO WEBHOOK
// ==========================================

function validateWebhookSignature(
  req
) {
  const secret =
    process.env
      .MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    throw new WebhookProcessingError(
      "MERCADO_PAGO_WEBHOOK_SECRET não foi configurado."
    );
  }

  const xSignature =
    req.headers[
      "x-signature"
    ];

  const xRequestId =
    req.headers[
      "x-request-id"
    ];

  const dataId =
    getNotificationDataId(
      req
    );

  if (
    !xSignature ||
    !xRequestId ||
    !dataId
  ) {
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

// ==========================================
// COMPARAR VALORES
// ==========================================

function amountsMatch(
  firstValue,
  secondValue
) {
  const first =
    Number(firstValue);

  const second =
    Number(secondValue);

  if (
    !Number.isFinite(first) ||
    !Number.isFinite(second)
  ) {
    return false;
  }

  return (
    Math.abs(
      first - second
    ) < 0.01
  );
}

// ==========================================
// RESOLVER STATUS FINAL DO PEDIDO
// ==========================================

function resolveOrderStatus(
  currentStatus,
  incomingStatus
) {
  // Reembolso é definitivo
  // para o fluxo automático.

  if (
    currentStatus ===
    ORDER_STATUS.REFUNDED
  ) {
    return ORDER_STATUS.REFUNDED;
  }

  // Reembolso confirmado pode
  // substituir qualquer status.

  if (
    incomingStatus ===
    ORDER_STATUS.REFUNDED
  ) {
    return ORDER_STATUS.REFUNDED;
  }

  // Pedido que já avançou na operação
  // não deve regredir por webhook atrasado.

  if (
    FULFILLMENT_STATUSES.includes(
      currentStatus
    )
  ) {
    return currentStatus;
  }

  // Pedido pago não deve voltar para
  // PENDING ou CANCELLED por evento atrasado.

  if (
    currentStatus ===
      ORDER_STATUS.PAID &&
    [
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CANCELLED,
    ].includes(
      incomingStatus
    )
  ) {
    return currentStatus;
  }

  return incomingStatus;
}

// ==========================================
// INCLUDE PADRÃO
// ==========================================

function getOrderInclude() {
  return {
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
  };
}

// ==========================================
// DEVOLVER ESTOQUE
// ==========================================

async function restoreStock({
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
// ATUALIZAR PEDIDO A PARTIR DO PAGAMENTO
// ==========================================

async function updateOrderFromPayment(
  payment
) {
  const paymentId =
    String(
      payment?.id || ""
    ).trim();

  const orderId =
    String(
      payment?.external_reference ||
        payment?.metadata?.order_id ||
        ""
    ).trim();

  const mercadoPagoStatus =
    String(
      payment?.status || ""
    )
      .trim()
      .toLowerCase();

  const incomingOrderStatus =
    PAYMENT_STATUS_MAP[
      mercadoPagoStatus
    ];

  // ========================================
  // VALIDAR IDENTIFICADORES
  // ========================================

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

  // ========================================
  // STATUS NÃO MAPEADO
  // ========================================

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
      reason:
        "PAYMENT_STATUS_NOT_MAPPED",
    };
  }

  // ========================================
  // BUSCAR PEDIDO
  // ========================================

  const order =
    await prisma.order.findUnique({
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

  // ========================================
  // VALIDAR MOEDA
  // ========================================

  const currencyId =
    String(
      payment?.currency_id || ""
    )
      .trim()
      .toUpperCase();

  if (
    currencyId !== "BRL"
  ) {
    throw new WebhookProcessingError(
      `Moeda inválida para o pedido ${order.id}.`
    );
  }

  // ========================================
  // VALIDAR VALOR PAGO
  // ========================================

  if (
    !amountsMatch(
      payment?.transaction_amount,
      order.total
    )
  ) {
    console.error(
      "Valor do pagamento diferente do pedido:",
      {
        orderId:
          order.id,

        paymentId,

        orderTotal:
          String(
            order.total
          ),

        paymentTotal:
          payment
            ?.transaction_amount,
      }
    );

    throw new WebhookProcessingError(
      "O valor recebido não corresponde ao valor do pedido."
    );
  }

  // ========================================
  // VALIDAR PAYMENT ID DO PEDIDO
  // ========================================

  if (
    order.paymentId &&
    String(
      order.paymentId
    ) !== paymentId
  ) {
    throw new WebhookProcessingError(
      "O pedido já está relacionado a outro pagamento."
    );
  }

  // ========================================
  // IMPEDIR MESMO PAGAMENTO EM DOIS PEDIDOS
  // ========================================

  const existingPaymentOrder =
    await prisma.order.findFirst({
      where: {
        paymentId,

        NOT: {
          id:
            order.id,
        },
      },

      select: {
        id: true,
      },
    });

  if (
    existingPaymentOrder
  ) {
    throw new WebhookProcessingError(
      "Este pagamento já está relacionado a outro pedido."
    );
  }

  // ========================================
  // RESOLVER STATUS FINAL
  // ========================================

  const resolvedOrderStatus =
    resolveOrderStatus(
      order.status,
      incomingOrderStatus
    );

  // ========================================
  // REEMBOLSO / CHARGEBACK
  // ========================================

  if (
    incomingOrderStatus ===
    ORDER_STATUS.REFUNDED
  ) {
    const updatedOrder =
      await prisma.$transaction(
        async (
          transaction
        ) => {
          const refundClaim =
            await transaction
              .order
              .updateMany({
                where: {
                  id:
                    order.id,

                  status: {
                    not:
                      ORDER_STATUS
                        .REFUNDED,
                  },
                },

                data: {
                  status:
                    ORDER_STATUS
                      .REFUNDED,

                  paymentId,
                },
              });

          const refundWasClaimed =
            refundClaim.count ===
            1;

          if (
            refundWasClaimed &&
            order.stockReducedAt
          ) {
            await restoreStock({
              transaction,

              items:
                order.items,
            });
          }

          return transaction
            .order
            .findUnique({
              where: {
                id:
                  order.id,
              },

              include:
                getOrderInclude(),
            });
        }
      );

    const alreadyRefunded =
      order.status ===
      ORDER_STATUS.REFUNDED;

    return {
      ignored:
        alreadyRefunded,

      reason:
        alreadyRefunded
          ? "REFUND_ALREADY_PROCESSED"
          : null,

      order:
        updatedOrder,
    };
  }

  // ========================================
  // PAGAMENTO APROVADO
  // ========================================

  const shouldReduceStock =
    mercadoPagoStatus ===
      "approved" &&
    !order.stockReducedAt &&
    order.status !==
      ORDER_STATUS.REFUNDED;

  const updatedOrder =
    await prisma.$transaction(
      async (
        transaction
      ) => {
        let stockWasClaimed =
          false;

        // ====================================
        // RESERVAR BAIXA DE ESTOQUE
        // ====================================

        if (
          shouldReduceStock
        ) {
          const stockClaim =
            await transaction
              .order
              .updateMany({
                where: {
                  id:
                    order.id,

                  stockReducedAt:
                    null,

                  status: {
                    not:
                      ORDER_STATUS
                        .REFUNDED,
                  },
                },

                data: {
                  stockReducedAt:
                    new Date(),
                },
              });

          stockWasClaimed =
            stockClaim.count ===
            1;
        }

        // ====================================
        // BAIXAR ESTOQUE
        // ====================================

        if (
          stockWasClaimed
        ) {
          for (
            const item of
            order.items
          ) {
            if (
              !item.variationId
            ) {
              throw new WebhookProcessingError(
                `O item ${item.productName} não possui uma variação válida.`
              );
            }

            const stockUpdate =
              await transaction
                .variation
                .updateMany({
                  where: {
                    id:
                      item
                        .variationId,

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
              stockUpdate.count !==
              1
            ) {
              throw new WebhookProcessingError(
                `Estoque insuficiente para ${item.productName}, tamanho ${item.size || "não informado"}.`
              );
            }
          }
        }

        // ====================================
        // ATUALIZAR STATUS E PAGAMENTO
        // ====================================

        return transaction
          .order
          .update({
            where: {
              id:
                order.id,
            },

            data: {
              status:
                resolvedOrderStatus,

              paymentId,
            },

            include:
              getOrderInclude(),
          });
      }
    );

  const statusWasPreserved =
    resolvedOrderStatus !==
    incomingOrderStatus;

  return {
    ignored:
      statusWasPreserved,

    reason:
      statusWasPreserved
        ? "ORDER_STATUS_PRESERVED"
        : null,

    order:
      updatedOrder,
  };
}
// ==========================================
// WEBHOOK MERCADO PAGO
// ==========================================

const mercadoPagoWebhook = async (
  req,
  res
) => {
  try {
    // ======================================
    // VALIDAR ASSINATURA
    // ======================================

    validateWebhookSignature(
      req
    );

    const notificationType =
      getNotificationType(
        req
      );

    const paymentId =
      getNotificationDataId(
        req
      );

    // ======================================
    // IGNORAR EVENTOS QUE NÃO SÃO PAGAMENTO
    // ======================================

    if (
      notificationType &&
      notificationType !==
        "payment"
    ) {
      console.log(
        "Webhook ignorado por não ser de pagamento:",
        {
          notificationType,
          dataId:
            paymentId,
        }
      );

      return res
        .status(200)
        .json({
          received: true,
          processed: false,
          ignored: true,
        });
    }

    // ======================================
    // VALIDAR ID DO PAGAMENTO
    // ======================================

    if (!paymentId) {
      return res
        .status(400)
        .json({
          message:
            "O ID do pagamento não foi informado.",
        });
    }

    // ======================================
    // BUSCAR PAGAMENTO DIRETO NO MP
    // ======================================
    //
    // Não confiamos no corpo recebido.
    // ======================================

    const payment =
      await getPaymentById(
        paymentId
      );

    // ======================================
    // PROCESSAR PEDIDO
    // ======================================

    const result =
      await updateOrderFromPayment(
        payment
      );

    console.log(
      "Webhook do Mercado Pago processado:",
      {
        paymentId,

        mercadoPagoStatus:
          payment?.status,

        orderId:
          payment
            ?.external_reference ||
          payment
            ?.metadata
            ?.order_id,

        ignored:
          result.ignored,

        reason:
          result.reason ||
          null,
      }
    );

    // ======================================
    // RESPOSTA
    // ======================================

    return res
      .status(200)
      .json({
        received: true,

        processed:
          !result.ignored,

        ignored:
          result.ignored,

        reason:
          result.reason ||
          null,
      });
  } catch (error) {
    // ======================================
    // ASSINATURA INVÁLIDA
    // ======================================

    if (
      error instanceof
      InvalidWebhookSignatureError
    ) {
      console.warn(
        "Webhook com assinatura inválida:",
        error.message
      );

      return res
        .status(401)
        .json({
          message:
            "Assinatura do webhook inválida.",
        });
    }

    // ======================================
    // OUTRO ERRO
    // ======================================

    console.error(
      "Erro ao processar webhook do Mercado Pago:",
      error
    );

    return res
      .status(500)
      .json({
        message:
          "Erro ao processar webhook do Mercado Pago.",
      });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  mercadoPagoWebhook,
};