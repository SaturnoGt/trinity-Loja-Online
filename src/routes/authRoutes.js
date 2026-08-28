const express = require("express");

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const {
  requestEmailVerification,
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword,
} = require(
  "../controllers/authController"
);

const router = express.Router();

// ==========================================
// CADASTRO E LOGIN
// ==========================================

router.post(
  "/request-email-verification",
  requestEmailVerification
);

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

router.post(
  "/logout",
  logout
);

// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================

router.post(
  "/request-password-reset",
  requestPasswordReset
);

router.post(
  "/reset-password",
  resetPassword
);

// ==========================================
// PERFIL PROTEGIDO
// ==========================================

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

router.put(
  "/profile",
  authMiddleware,
  updateProfile
);

module.exports = router;