const { MercadoPagoConfig, Payment } = require("mercadopago");
const prisma = require("../config/prisma");

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

const payment = new Payment(client);

const handleWebhook = async (req, res) => {
  try {
    console.log(
      "🔔 WEBHOOK RECEBIDO:",
      JSON.stringify(req.body, null, 2)
    );

    const paymentId = req.body?.data?.id;

    if (!paymentId) {
      return res.status(200).send("Sem payment id");
    }

    const paymentData = await payment.get({
      id: paymentId,
    });

    console.log("💳 PAGAMENTO:", paymentData);

    const orderId = paymentData.external_reference;

    if (!orderId) {
      console.log("Pedido não encontrado no pagamento.");
      return res.status(200).send("Sem external_reference");
    }

    let status = "PENDING";

    switch (paymentData.status) {
      case "approved":
        status = "PAID";
        break;

      case "cancelled":
        status = "CANCELLED";
        break;

      case "refunded":
        status = "REFUNDED";
        break;

      default:
        status = "PENDING";
    }

    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
        paymentId: String(paymentId),
      },
    });

    console.log(`✅ Pedido ${orderId} atualizado para ${status}`);

    return res.status(200).send("OK");
  } catch (error) {
    console.log("ERRO WEBHOOK:", error);

    return res.status(500).json({
      message: "Erro webhook",
      error: error.message,
    });
  }
};

module.exports = {
  handleWebhook,
};