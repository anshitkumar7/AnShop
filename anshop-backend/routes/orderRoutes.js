const express = require("express");
const router = express.Router();
const {
  placeOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
} = require("../controllers/orderController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

// Place a new order
router.post("/", placeOrder);

// Get all orders (admin)
router.get("/admin/all", authenticateToken, requireAdmin, getAllOrders);

// Get user's orders
router.get("/user/:userId", getUserOrders);

// Get single order by ID
router.get("/:orderId", getOrderById);

// Update order status (admin)
router.put("/:orderId", authenticateToken, requireAdmin, updateOrderStatus);

// Cancel order
router.delete("/:orderId/cancel", cancelOrder);

module.exports = router;
