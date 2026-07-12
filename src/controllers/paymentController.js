const { MercadoPagoConfig, Preference } = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

const preference = new Preference(client);

const createPreference = async (req, res) => {
  try {
    const { orderId, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Carrinho vazio ou inválido",
      });
    }

    const result = await preference.create({
      body: {
        external_reference: orderId,

        items: items.map((item) => ({
          id: String(item.id),
          title: item.title,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          currency_id: "BRL",
        })),
      },
    });

    return res.json({
      id: result.id,
      init_point: result.init_point,
    });
  } catch (error) {
    console.log("ERRO MERCADO PAGO:", error);

    return res.status(500).json({
      message: "Erro ao criar preferência",
      error: error.message,
    });
  }
};

module.exports = {
  createPreference,
};