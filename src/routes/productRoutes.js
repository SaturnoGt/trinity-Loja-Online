const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const productController = require("../controllers/productController");

// Rotas públicas
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// Rotas protegidas
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