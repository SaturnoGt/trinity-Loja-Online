const prisma = require("../config/prisma");

const {
  createPaymentPreference,
} = require(
  "../services/mercadoPagoService"
);

// ==========================================
// CONSTANTES
// ==========================================

const PAYMENT_CREATING_PREFIX =
  "CREATING:";

// ==========================================
// HELPERS
// ==========================================

function normalizeMoney(value) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return 0;
  }

  return Number(
    number.toFixed(2)
  );
}

function createPreferenceClaim() {
  return (
    PAYMENT_CREATING_PREFIX +
    Date.now() +
    ":" +
    Math.random()
      .toString(36)
      .slice(2)
  );
}

function isCreatingPreference(
  preferenceId
) {
  return String(
    preferenceId || ""
  ).startsWith(
    PAYMENT_CREATING_PREFIX
  );
}

async function releasePreferenceClaim({
  orderId,
  claim,
}) {
  try {
    await prisma.order.updateMany({
      where: {
        id:
          orderId,

        preferenceId:
          claim,
      },

      data: {
        preferenceId:
          null,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao liberar reserva da preferência:",
      error
    );
  }
}

// ==========================================
// CRIAR PREFERÊNCIA DE PAGAMENTO
// ==========================================

const createPreference = async (
  req,
  res
) => {
  let preferenceClaim =
    null;

  let claimedOrderId =
    null;

  try {
    const {
      orderId,
    } = req.body;

    // ======================================
    // AUTENTICAÇÃO
    // ======================================

    if (!req.user?.id) {
      return res
        .status(401)
        .json({
          message:
            "Usuário não autenticado.",
        });
    }

    if (!orderId) {
      return res
        .status(400)
        .json({
          message:
            "O ID do pedido é obrigatório.",
        });
    }

    // ======================================
    // BUSCAR PEDIDO DO USUÁRIO
    // ======================================

    const order =
      await prisma.order.findFirst({
        where: {
          id:
            String(orderId),

          userId:
            req.user.id,
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
      return res
        .status(404)
        .json({
          message:
            "Pedido não encontrado ou não pertence ao usuário autenticado.",
        });
    }

    // ======================================
    // STATUS DO PEDIDO
    // ======================================

    if (
      order.status !==
      "PENDING"
    ) {
      return res
        .status(400)
        .json({
          message:
            "Somente pedidos pendentes podem iniciar um pagamento.",
        });
    }

    // ======================================
    // EVITAR PREFERÊNCIA DUPLICADA
    // ======================================

    if (
      order.preferenceId
    ) {
      if (
        isCreatingPreference(
          order.preferenceId
        )
      ) {
        return res
          .status(409)
          .json({
            message:
              "O pagamento deste pedido já está sendo preparado. Aguarde alguns segundos.",
            code:
              "PAYMENT_PREFERENCE_CREATING",
          });
      }

      return res
        .status(409)
        .json({
          message:
            "Este pedido já possui uma preferência de pagamento.",
          code:
            "PAYMENT_PREFERENCE_ALREADY_EXISTS",

          preferenceId:
            order.preferenceId,
        });
    }

    // ======================================
    // VALIDAR ITENS
    // ======================================

    if (
      !Array.isArray(
        order.items
      ) ||
      order.items.length ===
        0
    ) {
      return res
        .status(400)
        .json({
          message:
            "O pedido não possui itens para pagamento.",
        });
    }

    // ======================================
    // CALCULAR SUBTOTAL PELOS ITENS
    // ======================================

    const calculatedSubtotal =
      normalizeMoney(
        order.items.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.unitPrice
            ) *
              Number(
                item.quantity
              ),
          0
        )
      );

    // ======================================
    // VALIDAR SUBTOTAL SALVO
    // ======================================

    const storedSubtotal =
      normalizeMoney(
        order.subtotal ??
          calculatedSubtotal
      );

    const subtotalMatches =
      Math.abs(
        calculatedSubtotal -
          storedSubtotal
      ) < 0.01;

    if (!subtotalMatches) {
      console.error(
        "Subtotal divergente no pedido:",
        {
          orderId:
            order.id,

          storedSubtotal,

          calculatedSubtotal,
        }
      );

      return res
        .status(409)
        .json({
          message:
            "O subtotal do pedido está inconsistente. Entre em contato com o suporte.",
        });
    }

    // ======================================
    // FRETE
    // ======================================

    const shippingPrice =
      normalizeMoney(
        order.shippingPrice ||
          0
      );

    if (
      shippingPrice < 0
    ) {
      return res
        .status(409)
        .json({
          message:
            "O valor do frete do pedido é inválido.",
        });
    }

    // ======================================
    // TOTAL ESPERADO
    // ======================================

    const calculatedTotal =
      normalizeMoney(
        calculatedSubtotal +
          shippingPrice
      );

    const storedTotal =
      normalizeMoney(
        order.total
      );

    const totalsMatch =
      Math.abs(
        calculatedTotal -
          storedTotal
      ) < 0.01;

    if (!totalsMatch) {
      console.error(
        "Total divergente no pedido:",
        {
          orderId:
            order.id,

          storedTotal,

          calculatedSubtotal,

          shippingPrice,

          calculatedTotal,
        }
      );

      return res
        .status(409)
        .json({
          message:
            "O valor total do pedido está inconsistente. Entre em contato com o suporte.",
        });
    }

    // ======================================
    // VALIDAR VALOR FINAL
    // ======================================

    if (
      !Number.isFinite(
        storedTotal
      ) ||
      storedTotal <= 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "O pedido possui um valor inválido para pagamento.",
        });
    }

    // ======================================
    // RESERVAR CRIAÇÃO DA PREFERÊNCIA
    // ======================================
    //
    // Somente UMA requisição consegue
    // trocar preferenceId de null para
    // o nosso claim temporário.
    // ======================================

    preferenceClaim =
      createPreferenceClaim();

    claimedOrderId =
      order.id;

    const claimResult =
      await prisma.order.updateMany({
        where: {
          id:
            order.id,

          userId:
            req.user.id,

          status:
            "PENDING",

          preferenceId:
            null,
        },

        data: {
          preferenceId:
            preferenceClaim,
        },
      });

    // Outra requisição chegou primeiro.

    if (
      claimResult.count !==
      1
    ) {
      const currentOrder =
        await prisma.order.findUnique({
          where: {
            id:
              order.id,
          },

          select: {
            preferenceId:
              true,
          },
        });

      if (
        isCreatingPreference(
          currentOrder
            ?.preferenceId
        )
      ) {
        return res
          .status(409)
          .json({
            message:
              "O pagamento deste pedido já está sendo preparado. Aguarde alguns segundos.",
            code:
              "PAYMENT_PREFERENCE_CREATING",
          });
      }

      return res
        .status(409)
        .json({
          message:
            "Este pedido já possui uma preferência de pagamento.",
          code:
            "PAYMENT_PREFERENCE_ALREADY_EXISTS",

          preferenceId:
            currentOrder
              ?.preferenceId ||
            null,
        });
    }

    // ======================================
    // CRIAR PREFERÊNCIA NO MERCADO PAGO
    // ======================================

    const preference =
      await createPaymentPreference({
        order,
      });

    if (
      !preference
        ?.preferenceId
    ) {
      throw new Error(
        "O Mercado Pago não retornou um identificador de preferência válido."
      );
    }

    if (
      !preference
        ?.checkoutUrl
    ) {
      throw new Error(
        "O Mercado Pago não retornou uma URL de pagamento válida."
      );
    }

    // ======================================
    // SUBSTITUIR CLAIM PELO ID REAL
    // ======================================

    const saveResult =
      await prisma.order.updateMany({
        where: {
          id:
            order.id,

          preferenceId:
            preferenceClaim,
        },

        data: {
          preferenceId:
            preference
              .preferenceId,
        },
      });

    if (
      saveResult.count !==
      1
    ) {
      throw new Error(
        "Não foi possível registrar a preferência de pagamento no pedido."
      );
    }

    // A partir daqui não queremos que
    // o catch remova o ID verdadeiro.

    preferenceClaim =
      null;

    claimedOrderId =
      null;

    // ======================================
    // RESPOSTA
    // ======================================

    return res
      .status(201)
      .json({
        orderId:
          order.id,

        preferenceId:
          preference
            .preferenceId,

        checkoutUrl:
          preference
            .checkoutUrl,

        initPoint:
          preference
            .initPoint,

        sandboxInitPoint:
          preference
            .sandboxInitPoint,
      });
  } catch (error) {
    // ======================================
    // LIBERAR RESERVA EM CASO DE ERRO
    // ======================================

    if (
      preferenceClaim &&
      claimedOrderId
    ) {
      await releasePreferenceClaim({
        orderId:
          claimedOrderId,

        claim:
          preferenceClaim,
      });
    }

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

    return res
      .status(500)
      .json({
        message:
          error.message ||
          "Erro ao criar preferência de pagamento.",
      });
  }
};

module.exports = {
  createPreference,
};