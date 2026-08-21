const express = require("express");

const authMiddleware = require(
  "../middlewares/authMiddleware"
);

const adminMiddleware = require(
  "../middlewares/adminMiddleware"
);

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderTracking,
  getDashboard,
} = require(
  "../controllers/orderController"
);

const router = express.Router();

// ==========================================
// ROTAS DO CLIENTE
// ==========================================

router.post(
  "/",
  authMiddleware,
  createOrder
);

router.get(
  "/my-orders",
  authMiddleware,
  getMyOrders
);

// ==========================================
// ROTAS ADMINISTRATIVAS
// ==========================================

router.get(
  "/admin",
  authMiddleware,
  adminMiddleware,
  getAllOrders
);

router.get(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  getOrderById
);

router.patch(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  updateOrderStatus
);

router.patch(
  "/admin/:id/tracking",
  authMiddleware,
  adminMiddleware,
  updateOrderTracking
);

router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  getDashboard
);

module.exports = router;