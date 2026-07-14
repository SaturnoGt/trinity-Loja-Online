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

// Rotas públicas
router.get(
  "/",
  productController.getAllProducts
);

router.get(
  "/:id",
  productController.getProductById
);

// Rotas administrativas
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  productController.createProduct
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  productController.deleteProduct
);

module.exports = router;