const express = require("express");
const router = express.Router();

const {
	addToCart,
	getCart,
	updateCartItem,
	removeCartItem
} = require("../controllers/cartController");

router.post("/add", addToCart);
router.get("/:userId", getCart);
router.put("/update", updateCartItem);
router.delete("/remove", removeCartItem);

module.exports = router;