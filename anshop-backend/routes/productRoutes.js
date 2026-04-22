const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

// routes
router.post("/", authenticateToken, requireAdmin, addProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", authenticateToken, requireAdmin, updateProduct);
router.delete("/:id", authenticateToken, requireAdmin, deleteProduct);

module.exports = router;