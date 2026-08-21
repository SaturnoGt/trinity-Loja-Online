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

const mercadoPagoClient =
  new MercadoPagoConfig({
    accessToken,
  });

const preferenceClient =
  new Preference(
    mercadoPagoClient
  );

const paymentClient =
  new Payment(
    mercadoPagoClient
  );

// ==========================================
// HELPERS
// ==========================================

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
    const parsedUrl =
      new URL(value);

    return (
      parsedUrl.protocol ===
        "http:" ||
      parsedUrl.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

function normalizeMoney(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(
    number.toFixed(2)
  );
}

function getFrontendUrl() {
  const frontendUrl =
    normalizeUrl(
      process.env.FRONTEND_URL ||
        "http://localhost:3000"
    );

  if (
    !isValidHttpUrl(
      frontendUrl
    )
  ) {
    throw new Error(
      "A variável FRONTEND_URL não contém uma URL válida."
    );
  }

  return frontendUrl;
}

function getWebhookUrl() {
  const webhookUrl =
    normalizeUrl(
      process.env.WEBHOOK_URL
    );

  if (!webhookUrl) {
    return null;
  }

  if (
    !isValidHttpUrl(
      webhookUrl
    )
  ) {
    console.warn(
      "WEBHOOK_URL ignorada porque não contém uma URL válida."
    );

    return null;
  }

  if (
    webhookUrl.includes(
      "localhost"
    ) ||
    webhookUrl.includes(
      "127.0.0.1"
    )
  ) {
    console.warn(
      "WEBHOOK_URL ignorada porque o Mercado Pago não consegue acessar localhost."
    );

    return null;
  }

  return webhookUrl;
}

// ==========================================
// NORMALIZAR PRODUTOS
// ==========================================

function normalizePreferenceItems(
  items
) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      "O pedido não possui itens para pagamento."
    );
  }

  return items.map(
    (item) => {
      const quantity =
        Number(
          item.quantity
        );

      const unitPrice =
        Number(
          item.unitPrice
        );

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        throw new Error(
          `Quantidade inválida no item ${item.productName}.`
        );
      }

      if (
        !Number.isFinite(
          unitPrice
        ) ||
        unitPrice <= 0
      ) {
        throw new Error(
          `Preço inválido no item ${item.productName}.`
        );
      }

      return {
        id:
          String(
            item.productId
          ),

        title:
          String(
            item.productName ||
              "Produto Trinity"
          ).trim(),

        description:
          [
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

        unit_price:
          normalizeMoney(
            unitPrice
          ),

        currency_id:
          "BRL",
      };
    }
  );
}

// ==========================================
// ADICIONAR FRETE COMO ITEM
// ==========================================

function appendShippingItem({
  items,
  order,
}) {
  const shippingPrice =
    normalizeMoney(
      order.shippingPrice
    );

  if (
    shippingPrice <= 0
  ) {
    return items;
  }

  const shippingCompany =
    String(
      order.shippingCompany ||
        ""
    ).trim();

  const shippingService =
    String(
      order.shippingService ||
        ""
    ).trim();

  const shippingDeadline =
    Number(
      order.shippingDeadline
    );

  const descriptionParts = [
    shippingCompany
      ? `Transportadora: ${shippingCompany}`
      : null,

    shippingService
      ? `Serviço: ${shippingService}`
      : null,

    Number.isFinite(
      shippingDeadline
    ) &&
    shippingDeadline > 0
      ? `Prazo estimado: ${shippingDeadline} ${
          shippingDeadline === 1
            ? "dia útil"
            : "dias úteis"
        }`
      : null,
  ].filter(Boolean);

  return [
    ...items,
    {
      id: `shipping-${order.id}`,

      title:
        "Frete",

      description:
        descriptionParts.join(
          " | "
        ) ||
        "Entrega do pedido Trinity",

      quantity: 1,

      unit_price:
        shippingPrice,

      currency_id:
        "BRL",
    },
  ];
}

// ==========================================
// CONFERIR TOTAL DA PREFERÊNCIA
// ==========================================

function calculatePreferenceTotal(
  items
) {
  return normalizeMoney(
    items.reduce(
      (
        total,
        item
      ) => {
        return (
          total +
          Number(
            item.unit_price
          ) *
            Number(
              item.quantity
            )
        );
      },
      0
    )
  );
}

// ==========================================
// CRIAR PREFERÊNCIA
// ==========================================

async function createPaymentPreference({
  order,
}) {
  ensureAccessToken();

  if (!order?.id) {
    throw new Error(
      "Pedido inválido para criação da preferência."
    );
  }

  if (
    !Array.isArray(
      order.items
    ) ||
    order.items.length === 0
  ) {
    throw new Error(
      "O pedido não possui itens."
    );
  }

  const frontendUrl =
    getFrontendUrl();

  const webhookUrl =
    getWebhookUrl();

  const isLocalhost =
    frontendUrl.includes(
      "localhost"
    ) ||
    frontendUrl.includes(
      "127.0.0.1"
    );

  // ========================================
  // PRODUTOS
  // ========================================

  const productItems =
    normalizePreferenceItems(
      order.items
    );

  // ========================================
  // PRODUTOS + FRETE
  // ========================================

  const items =
    appendShippingItem({
      items:
        productItems,

      order,
    });

  // ========================================
  // SEGURANÇA DO TOTAL
  // ========================================

  const preferenceTotal =
    calculatePreferenceTotal(
      items
    );

  const orderTotal =
    normalizeMoney(
      order.total
    );

  if (
    Math.abs(
      preferenceTotal -
        orderTotal
    ) >= 0.01
  ) {
    console.error(
      "Total da preferência divergente:",
      {
        orderId:
          order.id,

        orderTotal,

        preferenceTotal,

        shippingPrice:
          order.shippingPrice,

        items,
      }
    );

    throw new Error(
      "O valor que seria enviado ao Mercado Pago não corresponde ao total do pedido."
    );
  }

  // ========================================
  // PREFERÊNCIA
  // ========================================

  const preferenceBody = {
    external_reference:
      String(
        order.id
      ),

    items,

    payer: {
      email:
        order.user?.email ||
        undefined,

      name:
        order.user?.name ||
        undefined,
    },

    back_urls: {
      success:
        `${frontendUrl}/pagamento/sucesso`,

      failure:
        `${frontendUrl}/pagamento/falha`,

      pending:
        `${frontendUrl}/pagamento/pendente`,
    },

    statement_descriptor:
      "TRINITY",

    metadata: {
      order_id:
        String(
          order.id
        ),

      user_id:
        String(
          order.userId
        ),

      shipping_price:
        normalizeMoney(
          order.shippingPrice
        ),

      shipping_service_id:
        order.shippingServiceId
          ? String(
              order.shippingServiceId
            )
          : null,

      shipping_service:
        order.shippingService ||
        null,

      shipping_company:
        order.shippingCompany ||
        null,
    },
  };

  if (!isLocalhost) {
    preferenceBody.auto_return =
      "approved";
  }

  if (webhookUrl) {
    preferenceBody.notification_url =
      webhookUrl;
  }

  // ========================================
  // ENVIAR AO MERCADO PAGO
  // ========================================

  const result =
    await preferenceClient.create({
      body:
        preferenceBody,
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
    preferenceId:
      String(
        result.id
      ),

    checkoutUrl,

    initPoint:
      result.init_point ||
      null,

    sandboxInitPoint:
      result.sandbox_init_point ||
      null,
  };
}

// ==========================================
// BUSCAR PAGAMENTO
// ==========================================

async function getPaymentById(
  paymentId
) {
  ensureAccessToken();

  const normalizedPaymentId =
    String(
      paymentId || ""
    ).trim();

  if (!normalizedPaymentId) {
    throw new Error(
      "O ID do pagamento é obrigatório."
    );
  }

  return paymentClient.get({
    id:
      normalizedPaymentId,
  });
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  createPaymentPreference,
  getPaymentById,
};