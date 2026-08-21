const express = require("express");

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const adminMiddleware = require(
  "../middlewares/adminMiddleware"
);

const productController = require(
  "../controllers/productController"
);

const router = express.Router();

// =====================
// ROTAS PÚBLICAS
// =====================

router.get(
  "/",
  productController.getAllProducts
);

router.get(
  "/:id",
  productController.getProductById
);

// =====================
// ROTAS ADMINISTRATIVAS
// =====================

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  productController.createProduct
);

// Atualizar estoque de uma variação específica
router.patch(
  "/variations/:variationId/stock",
  authMiddleware,
  adminMiddleware,
  productController.updateVariationStock
);

// Atualizar apenas dados básicos do produto
router.patch(
  "/:id/basic",
  authMiddleware,
  adminMiddleware,
  productController.updateProductBasic
);

// Atualização completa do produto
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.updateProduct
);

// Excluir produto
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.deleteProduct
);

module.exports = router;