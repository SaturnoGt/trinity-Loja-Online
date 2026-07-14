const express = require("express");

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const {
  requestEmailVerification,
  register,
  login,
  getProfile,
  updateProfile,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// Cadastro e login
router.post(
  "/request-verification",
  requestEmailVerification
);

router.post("/register", register);
router.post("/login", login);

// Recuperação de senha
router.post(
  "/request-password-reset",
  requestPasswordReset
);

router.post(
  "/reset-password",
  resetPassword
);

// Perfil protegido
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