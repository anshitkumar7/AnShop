const API = window.ANSHOP_API || {
  ORIGIN: window.location.origin,
  api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
};

function getImageSrc(imagePath) {
  if (API.resolveImage) {
    return API.resolveImage(imagePath, "https://via.placeholder.com/120?text=NA");
  }

  if (!imagePath) {
    return "https://via.placeholder.com/120?text=NA";
  }

  return `${API.ORIGIN}/images/${imagePath}`;
}

const USER_ID = localStorage.getItem("userId");
const AVAILABLE_SIZES = ["S", "M", "L", "XL"];
const CART_PRODUCT_LOOKUP = new Map();

function showToast(message, type = "success") {
  let toast = document.getElementById("appToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("toast-success", "toast-error", "toast-info");
  toast.classList.add(`toast-${type}`);
  toast.classList.add("show");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function askSizePremium(defaultSize = "M", productMeta = {}) {
  const initialSize = AVAILABLE_SIZES.includes(String(defaultSize || "").toUpperCase())
    ? String(defaultSize).toUpperCase()
    : "M";
  const productName = (productMeta && productMeta.name ? String(productMeta.name) : "This product").trim();
  const productImage = productMeta && productMeta.image ? String(productMeta.image) : "";
  const previewHtml = productImage
    ? `<img class="size-picker-preview-image" src="${productImage}" alt="${productName}">`
    : `<div class="size-picker-preview-image placeholder">${productName.charAt(0).toUpperCase()}</div>`;

  return new Promise(resolve => {
    const backdrop = document.createElement("div");
    backdrop.className = "size-picker-backdrop";
    backdrop.innerHTML = `
      <div class="size-picker-modal" role="dialog" aria-modal="true" aria-labelledby="sizePickerTitle">
        <div class="size-picker-product-preview">
          ${previewHtml}
          <div class="size-picker-preview-copy">
            <h4>${productName}</h4>
            <span>Size guide: pick your usual fit for best comfort.</span>
          </div>
        </div>
        <h3 id="sizePickerTitle">Choose Size</h3>
        <p>Add this product in your selected size.</p>
        <div class="size-chip-grid" id="sizeChipGrid">
          ${AVAILABLE_SIZES.map(sz => `<button type="button" class="size-chip" data-size="${sz}">${sz}</button>`).join("")}
        </div>
        <div class="size-picker-actions">
          <button type="button" class="size-picker-cancel" id="sizePickerCancel">Cancel</button>
          <button type="button" class="size-picker-confirm" id="sizePickerConfirm">Add to Cart</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const chipGrid = backdrop.querySelector("#sizeChipGrid");
    const cancelBtn = backdrop.querySelector("#sizePickerCancel");
    const confirmBtn = backdrop.querySelector("#sizePickerConfirm");
    const chips = Array.from(backdrop.querySelectorAll(".size-chip"));
    let selectedSize = initialSize;

    const closeModal = value => {
      document.removeEventListener("keydown", handleEscape);
      backdrop.remove();
      resolve(value);
    };

    const setSelectedChip = sizeValue => {
      selectedSize = sizeValue;
      chips.forEach(chip => {
        chip.classList.toggle("active", chip.dataset.size === selectedSize);
      });
      confirmBtn.textContent = `Add Size ${selectedSize}`;
    };

    const handleEscape = event => {
      if (event.key === "Escape") {
        closeModal(null);
      }
    };

    chipGrid.addEventListener("click", event => {
      const chip = event.target.closest(".size-chip[data-size]");
      if (!chip) return;
      setSelectedChip(chip.dataset.size);
    });

    cancelBtn.addEventListener("click", () => closeModal(null));
    confirmBtn.addEventListener("click", () => closeModal(selectedSize));
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        closeModal(null);
      }
    });

    document.addEventListener("keydown", handleEscape);
    setSelectedChip(initialSize);
  });
}

if (!USER_ID) {
  showToast("Please login first", "info");
  window.location.href = "login.html";
}

function updateCartBadge(count) {
  const badge = document.getElementById("cartCountBadge");
  if (badge) {
    badge.textContent = count;
  }
}

function openProductDetailsFromCart(productId) {
  if (!productId) return;
  window.location.href = `product-details.html?id=${productId}`;
}

const cartItemsContainer = document.getElementById("cartItems");
if (cartItemsContainer) {
  cartItemsContainer.addEventListener("click", event => {
    if (event.target.closest("button") || event.target.closest(".qty-control")) {
      return;
    }

    const card = event.target.closest(".cart-item-card[data-product-id]");
    if (!card) {
      return;
    }

    openProductDetailsFromCart(card.getAttribute("data-product-id"));
  });
}

function syncShopStorageWithCartItems(items) {
  const productIdsInCart = new Set(
    (items || [])
      .map(item => {
        if (!item.productId) return "";
        return item.productId._id ? item.productId._id.toString() : item.productId.toString();
      })
      .filter(Boolean)
  );

  productIdsInCart.forEach(id => localStorage.setItem(id, "added"));
}

if (USER_ID) {
// ===== STEP 5: Use fetchWithAuth for authenticated requests =====
window.ANSHOP_API.fetchWithAuth(`${API.api("cart")}/${USER_ID}`)
  .then(res => res.json())
  .then(data => {

    const container = document.getElementById("cartItems");
    const totalItems = document.getElementById("totalItems");
    const totalPrice = document.getElementById("totalPrice");
    const subTotalPrice = document.getElementById("subTotalPrice");
    const deliveryCharge = document.getElementById("deliveryCharge");
    const youSave = document.getElementById("youSave");

    const setSummaryValue = (rowElement, value) => {
      if (!rowElement) return;
      const valueNode = rowElement.querySelector(".summary-value");
      if (valueNode) {
        valueNode.textContent = value;
      }
    };

    const setTotalValue = value => {
      if (!totalPrice) return;
      const totalValueNode = totalPrice.querySelector(".total-value");
      if (totalValueNode) {
        totalValueNode.textContent = value;
      }
    };

    container.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      container.innerHTML = '<div class="cart-empty"><h3>Your cart is empty</h3><p>Add products from the shop to continue.</p><a class="empty-shop-btn" href="shop.html">Shop Now</a></div>';
      setSummaryValue(totalItems, "0");
      setSummaryValue(subTotalPrice, "Rs 0");
      setSummaryValue(deliveryCharge, "Free");
      setSummaryValue(youSave, "Rs 0");
      setTotalValue("Rs 0");
      updateCartBadge(0);
      return;
    }

    let total = 0;
    let count = 0;
    let totalMrp = 0;

    syncShopStorageWithCartItems(data.items);

    data.items.forEach(item => {
      const p = item.productId;

      // Skip items where product was deleted or not found
      if (!p || !p.price) {
        return;
      }

      total += p.price * item.quantity;
      count += item.quantity;
      totalMrp += Math.round((Number(p.price) || 0) * 1.2) * item.quantity;

      const safeImage = getImageSrc(p.image);
      const safeName = p.name || "Product";
      const safeCategory = p.category || "-";
      const safePrice = Number(p.price) || 0;
      const safeSize = (item.size || "M").toString().toUpperCase();
      const safeProductId = p._id ? p._id.toString() : "";

      if (safeProductId) {
        CART_PRODUCT_LOOKUP.set(safeProductId, {
          name: safeName,
          image: safeImage
        });
      }

      container.innerHTML += `
        <div class="cart-item-card" data-product-id="${safeProductId}" role="button" tabindex="0" aria-label="Open ${safeName} details">
          <img class="cart-item-image" src="${safeImage}" alt="${safeName}">

          <div class="cart-item-info">
            <h4>${safeName}</h4>
            <p class="cart-item-category">${safeCategory}</p>
            <p class="cart-item-category">Size: ${safeSize}</p>
            <h3 class="cart-item-price">₹${safePrice}</h3>
            <div class="qty-control">
              <button class="qty-btn" onclick="updateQuantity('${p._id}', '${safeSize}', 'decrease')" aria-label="Decrease quantity">-</button>
              <span class="qty-count">${item.quantity}</span>
              <button class="qty-btn" onclick="updateQuantity('${p._id}', '${safeSize}', 'increase')" aria-label="Increase quantity">+</button>
            </div>

            <button class="remove-btn" onclick="removeItem('${p._id}', '${safeSize}')">
              Remove
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML += `
      <div class="shop-more-strip">
        <p>Want to add something else?</p>
        <a href="shop.html" class="shop-more-btn">Shop More</a>
      </div>
    `;

    setSummaryValue(totalItems, String(count));
    setSummaryValue(subTotalPrice, "Rs " + total);
    setSummaryValue(deliveryCharge, "Free");
    setSummaryValue(youSave, "Rs " + Math.max(totalMrp - total, 0));
    setTotalValue("Rs " + total);
    updateCartBadge(count);

  })
  .catch(() => {
    const container = document.getElementById("cartItems");
    container.innerHTML = '<div class="cart-empty"><h3>Unable to load cart</h3><p>Please check if backend is running on port 5000.</p></div>';
  });
}



  // update quantity of an item in cart

  async function updateQuantity(productId, size, action) {
    if (action === "increase") {
      const productMeta = CART_PRODUCT_LOOKUP.get(productId) || {};
      const selectedSize = await askSizePremium(size, productMeta);
      if (!selectedSize) {
        return;
      }

      const addRes = await window.ANSHOP_API.fetchWithAuth(API.api("cart/add"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: USER_ID,
          productId,
          size: selectedSize
        })
      });

      if (!addRes.ok) {
        showToast("Failed to add selected size.", "error");
        return;
      }

      localStorage.setItem(productId, "added");
      showToast(`Added size ${selectedSize}`, "success");
      setTimeout(() => {
        location.reload();
      }, 450);
      return;
    }

    // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
    const res = await window.ANSHOP_API.fetchWithAuth(API.api("cart/update"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: USER_ID,
      productId,
      size,
      action
    })
  });

  if (!res.ok) {
    showToast("Failed to update quantity.", "error");
    return;
  }

  const cart = await res.json();
  const stillExists = (cart.items || []).some(item => {
    if (!item.productId) return false;
    const id = item.productId._id ? item.productId._id.toString() : item.productId.toString();
    const itemSize = (item.size || "M").toString().toUpperCase();
    return id === productId && itemSize === String(size || "M").toUpperCase();
  });

  if (!stillExists) {
    localStorage.removeItem(productId);
  }

  showToast("Quantity updated", "success");
  setTimeout(() => {
    location.reload();
  }, 450);
}

function goToCheckout() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    showToast("Please login first", "info");
    window.location.href = "login.html";
    return;
  }
  window.location.href = "checkout.html";
}



//remove item from cart

async function removeItem(productId, size) {
  // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
  const res = await window.ANSHOP_API.fetchWithAuth(API.api("cart/remove"), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: USER_ID,
      productId,
      size
    })
  });

  if (!res.ok) {
    showToast("Failed to remove item.", "error");
    return;
  }

  localStorage.removeItem(productId);
  showToast("Item removed from cart", "success");

  setTimeout(() => {
    location.reload();
  }, 450);
}

