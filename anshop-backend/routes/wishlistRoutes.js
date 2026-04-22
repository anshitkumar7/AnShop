const express = require("express");
const router = express.Router();

const { toggleWishlistItem, getWishlist } = require("../controllers/wishlistController");

router.post("/toggle", toggleWishlistItem);
router.get("/:userId", getWishlist);

module.exports = router;
