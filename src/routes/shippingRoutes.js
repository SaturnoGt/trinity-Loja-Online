const express = require("express");

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const adminMiddleware = require(
  "../middlewares/adminMiddleware"
);

const {
  calculateShipping,
  getMelhorEnvioAuthorizationUrl,
  melhorEnvioOAuthCallback,
  refreshMelhorEnvioToken,
  getMelhorEnvioStatus,
} = require(
  "../controllers/shippingController"
);

const router = express.Router();

// ==========================================
// CALCULAR FRETE
// ==========================================

router.post(
  "/calculate",
  authMiddleware,
  calculateShipping
);

// ==========================================
// STATUS DA INTEGRAÇÃO
// ==========================================

router.get(
  "/oauth/status",
  authMiddleware,
  adminMiddleware,
  getMelhorEnvioStatus
);

// ==========================================
// INICIAR AUTORIZAÇÃO OAUTH
// ==========================================

router.get(
  "/oauth/authorize",
  authMiddleware,
  adminMiddleware,
  getMelhorEnvioAuthorizationUrl
);

// ==========================================
// CALLBACK OAUTH
// ==========================================

router.get(
  "/oauth/callback",
  melhorEnvioOAuthCallback
);

// ==========================================
// RENOVAR TOKEN
// ==========================================

router.post(
  "/oauth/refresh",
  authMiddleware,
  adminMiddleware,
  refreshMelhorEnvioToken
);

module.exports = router;