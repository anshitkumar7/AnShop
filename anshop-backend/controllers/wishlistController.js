const Wishlist = require("../models/Wishlist");

function getProductIdString(value) {
  if (!value) return "";
  if (value._id) return value._id.toString();
  return value.toString();
}

exports.toggleWishlistItem = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required" });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
    }

    const existingIndex = wishlist.items.findIndex(item => getProductIdString(item.productId) === productId.toString());

    let added = false;
    if (existingIndex >= 0) {
      wishlist.items.splice(existingIndex, 1);
    } else {
      wishlist.items.push({ productId });
      added = true;
    }

    await wishlist.save();

    return res.json({
      success: true,
      added,
      count: wishlist.items.length,
      message: added ? "Added to wishlist" : "Removed from wishlist"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const wishlist = await Wishlist.findOne({ userId }).populate("items.productId").lean();

    if (!wishlist) {
      return res.json({ items: [] });
    }

    return res.json({ items: wishlist.items || [] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
