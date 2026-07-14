const {
  MercadoPagoConfig,
  Payment,
} = require("mercadopago");

const prisma = require("../config/prisma");

const accessToken =
  process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error(
    "MERCADO_PAGO_ACCESS_TOKEN não configurado."
  );
}

const client = new MercadoPagoConfig({
  accessToken,
});

const paymentClient = new Payment(client);

function mapPaymentStatus(mercadoPagoStatus) {
  switch (mercadoPagoStatus) {
    case "approved":
      return "PAID";

    case "cancelled":
    case "rejected":
      return "CANCELLED";

    case "refunded":
    case "charged_back":
      return "REFUNDED";

    case "pending":
    case "in_process":
    case "authorized":
    default:
      return "PENDING";
  }
}

function extractPaymentId(req) {
  return (
    req.body?.data?.id ||
    req.body?.id ||
    req.query?.["data.id"] ||
    req.query?.id ||
    null
  );
}

const handleWebhook = async (req, res) => {
  /*
   * O Mercado Pago recebe o 200 imediatamente.
   * Assim, o simulador não considera a URL quebrada
   * mesmo quando envia um ID fictício.
   */
  res.status(200).json({
    received: true,
  });

  try {
    console.log(
      "WEBHOOK MERCADO PAGO RECEBIDO:",
      JSON.stringify(
        {
          body: req.body,
          query: req.query,
          headers: {
            "x-request-id":
              req.headers["x-request-id"],
            "x-signature":
              req.headers["x-signature"],
          },
        },
        null,
        2
      )
    );

    if (!accessToken) {
      console.error(
        "Webhook não processado: Access Token ausente."
      );
      return;
    }

    const topic =
      req.body?.type ||
      req.body?.topic ||
      req.query?.type ||
      req.query?.topic;

    if (topic && topic !== "payment") {
      console.log(
        `Notificação ignorada. Tipo recebido: ${topic}`
      );
      return;
    }

    const paymentId = extractPaymentId(req);

    if (!paymentId) {
      console.log(
        "Webhook recebido sem ID de pagamento."
      );
      return;
    }

    let paymentData;

    try {
      paymentData = await paymentClient.get({
        id: String(paymentId),
      });
    } catch (paymentError) {
      /*
       * O simulador costuma enviar IDs fictícios,
       * como 123456. Nesse caso apenas registramos.
       */
      console.log(
        `Não foi possível consultar o pagamento ${paymentId}.`
      );

      console.error(
        "Detalhes da consulta:",
        paymentError?.message || paymentError
      );

      return;
    }

    console.log(
      "PAGAMENTO CONSULTADO:",
      JSON.stringify(
        {
          id: paymentData.id,
          status: paymentData.status,
          externalReference:
            paymentData.external_reference,
          transactionAmount:
            paymentData.transaction_amount,
        },
        null,
        2
      )
    );

    const orderId =
      paymentData.external_reference;

    if (!orderId) {
      console.log(
        `Pagamento ${paymentId} sem external_reference.`
      );
      return;
    }

    const existingOrder =
      await prisma.order.findUnique({
        where: {
          id: String(orderId),
        },
        include: {
          items: true,
        },
      });

    if (!existingOrder) {
      console.log(
        `Pedido ${orderId} não encontrado.`
      );
      return;
    }

    const newStatus = mapPaymentStatus(
      paymentData.status
    );

    if (
      existingOrder.status === newStatus &&
      existingOrder.paymentId ===
        String(paymentId)
    ) {
      console.log(
        `Pedido ${orderId} já estava atualizado para ${newStatus}.`
      );
      return;
    }

    const updatedOrder =
      await prisma.order.update({
        where: {
          id: String(orderId),
        },
        data: {
          status: newStatus,
          paymentId: String(paymentId),
        },
      });

    console.log(
      `Pedido ${updatedOrder.id} atualizado para ${updatedOrder.status}.`
    );
  } catch (error) {
    console.error(
      "ERRO AO PROCESSAR WEBHOOK:",
      error?.message || error
    );

    if (error?.cause) {
      console.error(
        "DETALHES:",
        JSON.stringify(
          error.cause,
          null,
          2
        )
      );
    }
  }
};

module.exports = {
  handleWebhook,
};