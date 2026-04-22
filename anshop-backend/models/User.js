const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    default: "",
    trim: true
  },
  address: {
    address: {
      type: String,
      default: "",
      trim: true
    },
    city: {
      type: String,
      default: "",
      trim: true
    },
    state: {
      type: String,
      default: "",
      trim: true
    },
    pincode: {
      type: String,
      default: "",
      trim: true
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  photoURL: {
    type: String,
    default: ""
  },
  creditProfile: {
    score: {
      type: Number,
      default: 600,
      min: 300,
      max: 900
    },
    level: {
      type: String,
      enum: ["Starter", "Growing", "Prime", "Elite"],
      default: "Starter"
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    usedAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    availableAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveredOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    cancelledOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    totalDeliveredSpend: {
      type: Number,
      default: 0,
      min: 0
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);
