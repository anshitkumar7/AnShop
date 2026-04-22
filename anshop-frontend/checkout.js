const API = window.ANSHOP_API || {
  ORIGIN: window.location.origin,
  api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
};
const CART_API = API.api("cart");
const ORDER_API = API.api("orders");

let cartItems = [];
let userId = null;
let yearEl = null;
let cartCountBadge = null;

function getCurrentUserId() {
  return localStorage.getItem("userId");
}

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

function getImageSrc(imagePath) {
  if (API.resolveImage) {
    return API.resolveImage(imagePath, "https://via.placeholder.com/250?text=Product");
  }

  if (!imagePath) {
    return "https://via.placeholder.com/250?text=Product";
  }

  return `${API.ORIGIN}/images/${imagePath}`;
}

function getMrpAndDiscount(price) {
  const mrp = Math.round(price * 1.2);
  const discount = Math.round(((mrp - price) / mrp) * 100);
  return { mrp, discount };
}

function updateCartBadge(itemCount) {
  const badge = document.getElementById("cartCountBadge");
  if (badge) {
    badge.textContent = itemCount;
  }
}

async function loadCartData() {
  userId = getCurrentUserId();
  if (!userId) {
    showToast("Please login first", "info");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
    return;
  }

  try {
    const response = await fetch(`${CART_API}/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to load cart");
    }

    const cartData = await response.json();
    cartItems = (cartData.items || []).filter(item => item && item.productId && item.productId._id);

    updateCartBadge(cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0));
    renderOrderSummary();
  } catch (error) {
    showToast("Failed to load cart data", "error");
    console.error("Cart load error:", error);
  }
}

function renderOrderSummary() {
  const summaryContainer = document.getElementById("orderSummaryItems");

  if (!cartItems || cartItems.length === 0) {
    summaryContainer.innerHTML = `
      <div class="empty-order">
        <p>Your cart is empty</p>
        <a href="shop.html">Continue Shopping</a>
      </div>
    `;
    updateOrderTotals();
    return;
  }

  summaryContainer.innerHTML = "";

  let subtotal = 0;
  let totalDiscount = 0;

  cartItems.forEach(item => {
    const product = item.productId;
    if (!product) return;

    const price = Number(product.price) || 0;
    const quantity = Number(item.quantity) || 0;
    const itemTotal = price * quantity;
    subtotal += itemTotal;

    const { mrp, discount } = getMrpAndDiscount(price);
    const itemMrpTotal = mrp * quantity;
    const itemDiscountAmount = itemMrpTotal - itemTotal;
    totalDiscount += itemDiscountAmount;

    const itemImage = getImageSrc(product.image);
    const itemName = product.name || "Product";
    const itemSize = String(item.size || "M").toUpperCase();

    const itemDiv = document.createElement("div");
    itemDiv.className = "summary-item";
    itemDiv.innerHTML = `
      <div class="summary-item-image">
        <img src="${itemImage}" alt="${itemName}">
      </div>
      <div class="summary-item-details">
        <div class="summary-item-name" title="${itemName}">${itemName}</div>
        <div class="summary-item-qty">Qty: ${quantity}</div>
        <div class="summary-item-qty">Size: ${itemSize}</div>
      </div>
      <div class="summary-item-price">₹${itemTotal.toLocaleString()}</div>
    `;

    summaryContainer.appendChild(itemDiv);
  });

  // Store values for total calculation
  window.checkoutSubtotal = subtotal;
  window.checkoutDiscount = totalDiscount;

  updateOrderTotals();
}

function updateOrderTotals() {
  const subtotal = window.checkoutSubtotal || 0;
  const discount = window.checkoutDiscount || 0;
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  document.getElementById("subtotal").textContent = `₹${subtotal.toLocaleString()}`;
  document.getElementById("discountAmount").textContent = `-₹${discount.toLocaleString()}`;
  document.getElementById("shippingCost").textContent = "FREE";
  document.getElementById("totalAmount").textContent = `₹${total.toLocaleString()}`;
}

function validateAddressForm() {
  const fullName = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("address").value.trim();
  const city = document.getElementById("city").value.trim();
  const state = document.getElementById("state").value.trim();
  const pincode = document.getElementById("pincode").value.trim();

  if (!fullName) {
    showToast("Please enter full name", "error");
    return false;
  }

  if (!phone || phone.length < 10) {
    showToast("Please enter valid phone number (10 digits)", "error");
    return false;
  }

  if (!email || !email.includes("@")) {
    showToast("Please enter valid email", "error");
    return false;
  }

  if (!address) {
    showToast("Please enter address", "error");
    return false;
  }

  if (!city) {
    showToast("Please enter city", "error");
    return false;
  }

  if (!state) {
    showToast("Please enter state", "error");
    return false;
  }

  if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
    showToast("Please enter valid 6-digit pincode", "error");
    return false;
  }

  return true;
}

function getAddressData() {
  return {
    fullName: document.getElementById("fullName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    address: document.getElementById("address").value.trim(),
    city: document.getElementById("city").value.trim(),
    state: document.getElementById("state").value.trim(),
    pincode: document.getElementById("pincode").value.trim()
  };
}

function getPaymentMethod() {
  const selected = document.querySelector('input[name="paymentMethod"]:checked');
  if (!selected) return "cod";
  if (selected.value !== "cod") {
    showToast("Online payment is coming soon. Please use Cash on Delivery.", "info");
    return "cod";
  }
  return "cod";
}

async function placeOrder() {
  // Validate cart
  if (!cartItems || cartItems.length === 0) {
    showToast("Your cart is empty", "error");
    return;
  }

  // Validate address form
  if (!validateAddressForm()) {
    return;
  }

  const addressData = getAddressData();
  const paymentMethod = getPaymentMethod();
  const validOrderItems = cartItems
    .filter(item => item && item.productId && item.productId._id)
    .map(item => ({
      productId: item.productId._id,
      productName: item.productId.name || "Product",
      size: String(item.size || "M").toUpperCase(),
      quantity: Number(item.quantity) || 1,
      price: Number(item.productId.price) || 0
    }));

  if (validOrderItems.length === 0) {
    showToast("No valid items found in cart. Please refresh cart.", "error");
    return;
  }

  // Disable button during submission
  const btn = document.getElementById("placeOrderBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Processing...";

  try {
    const orderData = {
      userId: userId,
      items: validOrderItems,
      shippingAddress: addressData,
      paymentMethod: paymentMethod,
      subtotal: window.checkoutSubtotal || 0,
      discount: window.checkoutDiscount || 0,
      shippingCost: 0,
      totalAmount: window.checkoutSubtotal || 0,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const response = await fetch(ORDER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      let errMsg = "Failed to place order";
      try {
        const errData = await response.json();
        errMsg = errData.error || errMsg;
      } catch (e) {
        // Ignore JSON parse errors for non-JSON backend responses.
      }
      throw new Error(errMsg);
    }

    const result = await response.json();
    showToast("Order placed successfully!", "success");

    // Clear cart from localStorage
    validOrderItems.forEach(item => {
      localStorage.removeItem(item.productId);
    });

    // Redirect to order confirmation page after 2 seconds
    setTimeout(() => {
      window.location.href = `order-confirmation.html?orderId=${result.orderId || result._id}`;
    }, 1500);
  } catch (error) {
    console.error("Order placement error:", error);
    showToast(error.message || "Failed to place order. Please try again.", "error");
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Payment method selection handling
document.addEventListener("DOMContentLoaded", () => {
  yearEl = document.getElementById("year");
  cartCountBadge = document.getElementById("cartCountBadge");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Payment method toggle styling
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      document.querySelectorAll(".payment-option").forEach(opt => {
        opt.classList.remove("selected");
      });
      if (e.target.disabled) {
        return;
      }
      e.target.closest(".payment-option").classList.add("selected");
    });
  });

  // Load cart data
  loadCartData();
});
