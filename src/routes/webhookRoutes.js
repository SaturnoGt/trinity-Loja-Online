const express = require("express");

const {
  mercadoPagoWebhook,
} = require("../controllers/webhookController");

const router = express.Router();

/*
 * Mercado Pago
 * POST /api/webhook/mercadopago
 */
router.post(
  "/mercadopago",
  mercadoPagoWebhook
);

module.exports = router;