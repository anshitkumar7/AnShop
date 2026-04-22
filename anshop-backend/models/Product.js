const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  image: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  category: {
    type: String
  },

  department: {
    type: String,
    enum: ["Men", "Women", "Unisex"],
    default: "Unisex"
  },

  productType: {
    type: String,
    default: "Other"
  },

  stock: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);