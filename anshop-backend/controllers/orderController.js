const Order = require("../models/Order");
const Cart = require("../models/cart");
const mongoose = require("mongoose");
const { recalculateCreditProfile } = require("../services/creditService");

// Place a new order
exports.placeOrder = async (req, res) => {
  try {
    const { userId, items, shippingAddress, paymentMethod, subtotal, discount, shippingCost, totalAmount } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const requiredAddress = ["fullName", "phone", "email", "address", "city", "state", "pincode"];
    const hasMissingAddress = requiredAddress.some(field => !shippingAddress || !String(shippingAddress[field] || "").trim());
    if (hasMissingAddress) {
      return res.status(400).json({ error: "Please fill complete delivery address" });
    }

    const cleanItems = items
      .filter(item => item && item.productId)
      .map(item => ({
        productId: item.productId,
        productName: item.productName || "Product",
        size: String(item.size || "M").trim().toUpperCase() || "M",
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0
      }));

    if (cleanItems.length === 0) {
      return res.status(400).json({ error: "No valid items to place order" });
    }

    if (paymentMethod && paymentMethod !== "cod") {
      return res.status(400).json({ error: "Online payment is coming soon. Please select Cash on Delivery." });
    }

    // Create order
    const order = new Order({
      userId,
      items: cleanItems,
      shippingAddress,
      paymentMethod: "cod",
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      shippingCost: Number(shippingCost) || 0,
      totalAmount: Number(totalAmount) || 0,
      status: "pending",
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending"
    });

    const savedOrder = await order.save();

    // Clear the user's cart after order is placed
    await Cart.findOneAndUpdate(
      { userId: String(userId) },
      { items: [] },
      { new: true }
    );

    // Keep credit profile in sync with latest order activity.
    try {
      await recalculateCreditProfile(String(userId));
    } catch (creditError) {
      console.error("Credit recalculate after placeOrder failed:", creditError.message);
    }

    res.status(201).json({
      message: "Order placed successfully",
      orderId: savedOrder._id,
      orderNumber: savedOrder.orderNumber
    });
  } catch (error) {
    console.error("Order placement error:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId })
      .populate("items.productId", "name image price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("userId", "name email")
      .populate("items.productId", "name image price category");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Fetch order error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.productId", "name image price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Fetch all orders error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus, trackingId } = req.body;

    const existingOrder = await Order.findById(orderId).select("userId status");
    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    const previousStatus = existingOrder.status;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status, paymentStatus, trackingId },
      { new: true, runValidators: true }
    );

    if (["delivered", "cancelled"].includes(status) || ["delivered", "cancelled"].includes(previousStatus)) {
      try {
        await recalculateCreditProfile(String(existingOrder.userId));
      } catch (creditError) {
        console.error("Credit recalculate after updateOrderStatus failed:", creditError.message);
      }
    }

    res.json({
      message: "Order updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({ error: "Cannot cancel this order" });
    }

    order.status = "cancelled";
    await order.save();

    try {
      await recalculateCreditProfile(String(order.userId));
    } catch (creditError) {
      console.error("Credit recalculate after cancelOrder failed:", creditError.message);
    }

    res.json({
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
};
