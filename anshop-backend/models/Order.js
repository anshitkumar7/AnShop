const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        productName: String,
        size: {
          type: String,
          default: "M"
        },
        quantity: {
          type: Number,
          default: 1
        },
        price: Number
      }
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      email: String,
      address: String,
      city: String,
      state: String,
      pincode: String
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      default: "cod"
    },
    subtotal: Number,
    discount: {
      type: Number,
      default: 0
    },
    shippingCost: {
      type: Number,
      default: 0
    },
    totalAmount: Number,
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    trackingId: String,
    orderNumber: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Auto-generate order number before saving
orderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
});

module.exports = mongoose.model("Order", orderSchema);
