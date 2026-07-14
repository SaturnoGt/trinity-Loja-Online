const {
  MercadoPagoConfig,
  Preference,
} = require("mercadopago");

const accessToken =
  process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error(
    "ERRO: MERCADO_PAGO_ACCESS_TOKEN não foi configurado."
  );
}

const client = new MercadoPagoConfig({
  accessToken,
});

const preference = new Preference(client);

function normalizeUrl(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

function isValidHttpUrl(value) {
  try {
    const parsedUrl = new URL(value);

    return (
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:"
    );
  } catch {
    return false;
  }
}

const createPreference = async (req, res) => {
  try {
    const { orderId, items } = req.body;

    if (!accessToken) {
      return res.status(500).json({
        message:
          "O Access Token do Mercado Pago não foi configurado.",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        message: "O ID do pedido é obrigatório.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Carrinho vazio ou inválido.",
      });
    }

    const validItems = items.map((item) => ({
      id: String(item.id),
      title: String(
        item.title || "Produto Trinity"
      ).trim(),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      currency_id: "BRL",
    }));

    const hasInvalidItem = validItems.some(
      (item) =>
        !item.id ||
        !item.title ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unit_price) ||
        item.unit_price <= 0
    );

    if (hasInvalidItem) {
      return res.status(400).json({
        message:
          "Um ou mais produtos possuem dados inválidos.",
      });
    }

    const frontendUrl = normalizeUrl(
      process.env.FRONTEND_URL ||
        "http://localhost:3000"
    );

    if (!isValidHttpUrl(frontendUrl)) {
      return res.status(500).json({
        message:
          "A variável FRONTEND_URL não contém uma URL válida.",
      });
    }

    const successUrl = `${frontendUrl}/pagamento/sucesso`;
    const failureUrl = `${frontendUrl}/pagamento/falha`;
    const pendingUrl = `${frontendUrl}/pagamento/pendente`;

    const isLocalhost =
      frontendUrl.includes("localhost") ||
      frontendUrl.includes("127.0.0.1");

    const preferenceBody = {
      external_reference: String(orderId),

      items: validItems,

      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },

      statement_descriptor: "TRINITY",
    };

    /*
     * Em localhost, não usamos auto_return.
     * Em produção, ele retorna automaticamente
     * para /pagamento/sucesso após aprovação.
     */
    if (!isLocalhost) {
      preferenceBody.auto_return = "approved";
    }

    const webhookUrl = normalizeUrl(
      process.env.WEBHOOK_URL
    );

    if (
      webhookUrl &&
      isValidHttpUrl(webhookUrl) &&
      !webhookUrl.includes("localhost")
    ) {
      preferenceBody.notification_url =
        webhookUrl;
    }

    console.log("Criando preferência:", {
      orderId,
      frontendUrl,
      successUrl,
      failureUrl,
      pendingUrl,
      autoReturn: preferenceBody.auto_return || false,
      items: validItems.length,
    });

    const result = await preference.create({
      body: preferenceBody,
    });

    const checkoutUrl =
      result.init_point ||
      result.sandbox_init_point;

    console.log("Preferência criada:", {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint:
        result.sandbox_init_point,
    });

    if (!checkoutUrl) {
      return res.status(500).json({
        message:
          "O Mercado Pago criou a preferência, mas não retornou uma URL de pagamento.",
      });
    }

    return res.status(201).json({
      id: result.id,
      init_point: checkoutUrl,
      sandbox_init_point:
        result.sandbox_init_point || null,
    });
  } catch (error) {
    console.error(
      "ERRO MERCADO PAGO:",
      error?.message || error
    );

    if (error?.cause) {
      console.error(
        "DETALHES MERCADO PAGO:",
        JSON.stringify(error.cause, null, 2)
      );
    }

    return res.status(500).json({
      message: "Erro ao criar preferência.",
      error:
        error?.message ||
        "Erro desconhecido do Mercado Pago.",
    });
  }
};

module.exports = {
  createPreference,
};