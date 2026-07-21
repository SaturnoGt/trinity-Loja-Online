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
  getDashboard,
} = require("../controllers/orderController");

const router = express.Router();

// Rotas do cliente
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

// Rotas administrativas
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

router.get(
  "/dashboard",
  authMiddleware,
  adminMiddleware,
  getDashboard
);

module.exports = router;