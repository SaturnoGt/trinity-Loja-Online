const {
  MercadoPagoConfig,
  Preference,
  Payment,
} = require("mercadopago");

const accessToken =
  process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.error(
    "ERRO: MERCADO_PAGO_ACCESS_TOKEN não foi configurado."
  );
}

const mercadoPagoClient = new MercadoPagoConfig({
  accessToken,
});

const preferenceClient = new Preference(
  mercadoPagoClient
);

const paymentClient = new Payment(
  mercadoPagoClient
);

function ensureAccessToken() {
  if (!accessToken) {
    throw new Error(
      "O Access Token do Mercado Pago não foi configurado."
    );
  }
}

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

function getFrontendUrl() {
  const frontendUrl = normalizeUrl(
    process.env.FRONTEND_URL ||
      "http://localhost:3000"
  );

  if (!isValidHttpUrl(frontendUrl)) {
    throw new Error(
      "A variável FRONTEND_URL não contém uma URL válida."
    );
  }

  return frontendUrl;
}

function getWebhookUrl() {
  const webhookUrl = normalizeUrl(
    process.env.WEBHOOK_URL
  );

  if (!webhookUrl) {
    return null;
  }

  if (!isValidHttpUrl(webhookUrl)) {
    console.warn(
      "WEBHOOK_URL ignorada porque não contém uma URL válida."
    );

    return null;
  }

  if (
    webhookUrl.includes("localhost") ||
    webhookUrl.includes("127.0.0.1")
  ) {
    console.warn(
      "WEBHOOK_URL ignorada porque o Mercado Pago não consegue acessar localhost."
    );

    return null;
  }

  return webhookUrl;
}

function normalizePreferenceItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "O pedido não possui itens para pagamento."
    );
  }

  return items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new Error(
        `Quantidade inválida no item ${item.productName}.`
      );
    }

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0
    ) {
      throw new Error(
        `Preço inválido no item ${item.productName}.`
      );
    }

    return {
      id: String(item.productId),
      title: String(
        item.productName || "Produto Trinity"
      ).trim(),
      description: [
        item.size
          ? `Tamanho: ${item.size}`
          : null,

        item.color
          ? `Cor: ${item.color}`
          : null,
      ]
        .filter(Boolean)
        .join(" | "),
      quantity,
      unit_price: unitPrice,
      currency_id: "BRL",
    };
  });
}

async function createPaymentPreference({
  order,
}) {
  ensureAccessToken();

  if (!order?.id) {
    throw new Error(
      "Pedido inválido para criação da preferência."
    );
  }

  const frontendUrl = getFrontendUrl();
  const webhookUrl = getWebhookUrl();

  const isLocalhost =
    frontendUrl.includes("localhost") ||
    frontendUrl.includes("127.0.0.1");

  const items = normalizePreferenceItems(
    order.items
  );

  const preferenceBody = {
    external_reference: String(order.id),

    items,

    payer: {
      email: order.user?.email || undefined,
      name: order.user?.name || undefined,
    },

    back_urls: {
      success: `${frontendUrl}/pagamento/sucesso`,
      failure: `${frontendUrl}/pagamento/falha`,
      pending: `${frontendUrl}/pagamento/pendente`,
    },

    statement_descriptor: "TRINITY",

    metadata: {
      order_id: String(order.id),
      user_id: String(order.userId),
    },
  };

  if (!isLocalhost) {
    preferenceBody.auto_return = "approved";
  }

  if (webhookUrl) {
    preferenceBody.notification_url =
      webhookUrl;
  }

  const result =
    await preferenceClient.create({
      body: preferenceBody,
    });

  const checkoutUrl =
    result.init_point ||
    result.sandbox_init_point;

  if (!result.id) {
    throw new Error(
      "O Mercado Pago não retornou o ID da preferência."
    );
  }

  if (!checkoutUrl) {
    throw new Error(
      "O Mercado Pago não retornou a URL de pagamento."
    );
  }

  return {
    preferenceId: String(result.id),
    checkoutUrl,
    initPoint: result.init_point || null,
    sandboxInitPoint:
      result.sandbox_init_point || null,
  };
}

async function getPaymentById(paymentId) {
  ensureAccessToken();

  const normalizedPaymentId = String(
    paymentId || ""
  ).trim();

  if (!normalizedPaymentId) {
    throw new Error(
      "O ID do pagamento é obrigatório."
    );
  }

  return paymentClient.get({
    id: normalizedPaymentId,
  });
}

module.exports = {
  createPaymentPreference,
  getPaymentById,
};