const Cart = require("../models/cart");

function getProductIdString(productIdValue) {
  if (!productIdValue) return "";

  if (productIdValue._id) {
    return productIdValue._id.toString();
  }

  return productIdValue.toString();
}

function getSizeValue(sizeValue) {
  const normalized = String(sizeValue || "M").trim().toUpperCase();
  return normalized || "M";
}

function getItemKey(productIdValue, sizeValue) {
  return `${getProductIdString(productIdValue)}__${getSizeValue(sizeValue)}`;
}

// ADD TO CART
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, size } = req.body;
    const selectedSize = getSizeValue(size);

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, size: selectedSize, quantity: 1 }]
      });
      await cart.save();
      return res.json({ success: true, message: "Added to cart", cart });
    }

    // Merge any old duplicate entries of same product into one entry.
    const mergedItemsMap = new Map();
    cart.items.forEach(item => {
      const id = getItemKey(item.productId, item.size);
      const qty = Number(item.quantity) || 1;
      mergedItemsMap.set(id, (mergedItemsMap.get(id) || 0) + qty);
    });

    const targetId = getItemKey(productId, selectedSize);
    mergedItemsMap.set(targetId, (mergedItemsMap.get(targetId) || 0) + 1);

    cart.items = Array.from(mergedItemsMap.entries()).map(([key, quantity]) => {
      const [productIdPart, sizePart] = key.split("__");
      return {
        productId: productIdPart,
        size: getSizeValue(sizePart),
        quantity
      };
    });

    await cart.save();

    res.json({ success: true, message: "Added to cart", cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET CART
exports.getCart = async (req, res) => {
  const { userId } = req.params;

  const cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart) {
    return res.json({ items: [] });
  }

  res.json(cart);
};


exports.updateCartItem = async (req, res) => {
  const { userId, productId, action, size } = req.body;
  const selectedSize = getSizeValue(size);

    try {
        // find cart of user
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // find product inside cart
        const item = cart.items.find(item => {
          const itemProductId = getProductIdString(item.productId);
          const itemSize = getSizeValue(item.size);
          return itemProductId === productId.toString() && itemSize === selectedSize;
        });

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // logic
        if (action === "increase") {
            item.quantity += 1;
        } 
        else if (action === "decrease") {
            item.quantity -= 1;

            // if quantity becomes 0 → remove item
            if (item.quantity <= 0) {
                cart.items = cart.items.filter(
                item => !(getProductIdString(item.productId) === productId.toString() && getSizeValue(item.size) === selectedSize)
                );
            }
        }

        await cart.save();

        res.json(cart);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


    exports.removeCartItem = async (req, res) => {
      const { userId, productId, size } = req.body;
      const selectedSize = getSizeValue(size);

      try {
        const cart = await Cart.findOne({ userId });

        if (!cart) {
          return res.status(404).json({ message: "Cart not found" });
        }

        const initialLength = cart.items.length;

        cart.items = cart.items.filter(item => {
          const itemProductId = getProductIdString(item.productId);
          const itemSize = getSizeValue(item.size);
          return !(itemProductId === productId.toString() && itemSize === selectedSize);
        });

        if (cart.items.length === initialLength) {
          return res.status(404).json({ message: "Item not found" });
        }

        await cart.save();

        res.json({ success: true, message: "Item removed", cart });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    };



