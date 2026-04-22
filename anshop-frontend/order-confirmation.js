const API = window.ANSHOP_API || {
  ORIGIN: window.location.origin,
  api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
};
const ORDER_API = API.api("orders");

function getImageSrc(imagePath) {
  if (API.resolveImage) {
    return API.resolveImage(imagePath, "https://via.placeholder.com/120?text=NA");
  }

  if (!imagePath) {
    return "https://via.placeholder.com/120?text=NA";
  }

  return `${API.ORIGIN}/images/${imagePath}`;
}

function updateCartBadge(itemCount) {
  const badge = document.getElementById("cartCountBadge");
  if (badge) {
    badge.textContent = itemCount;
  }
}

function showError(message) {
  const errorContainer = document.getElementById("errorContainer");
  errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

function applyLoadingState() {
  const iconEl = document.getElementById("successContent");
  const titleEl = document.getElementById("confirmationTitle");
  const subtitleEl = document.getElementById("confirmationSubtitle");
  const cardEl = document.querySelector(".confirmation-card");

  if (!iconEl || !titleEl || !subtitleEl || !cardEl) {
    return;
  }

  cardEl.classList.remove("is-success", "is-cancelled");
  iconEl.classList.remove("icon-success", "icon-cancelled");
  iconEl.classList.add("icon-neutral");
  iconEl.textContent = "•";
  titleEl.textContent = "Loading Order...";
  subtitleEl.textContent = "Please wait while we fetch your order status.";
}

function applyOrderState(status) {
  const normalized = String(status || "pending").toLowerCase();
  const iconEl = document.getElementById("successContent");
  const titleEl = document.getElementById("confirmationTitle");
  const subtitleEl = document.getElementById("confirmationSubtitle");
  const cardEl = document.querySelector(".confirmation-card");

  if (!iconEl || !titleEl || !subtitleEl || !cardEl) {
    return;
  }

  cardEl.classList.remove("is-success", "is-cancelled");
  iconEl.classList.remove("icon-success", "icon-cancelled", "icon-neutral");

  if (normalized === "cancelled") {
    cardEl.classList.add("is-cancelled");
    iconEl.classList.add("icon-cancelled");
    iconEl.textContent = "✕";
    titleEl.textContent = "Order Cancelled";
    subtitleEl.textContent = "This order has been cancelled. If this was a mistake, place a new order anytime.";
    return;
  }

  cardEl.classList.add("is-success");
  iconEl.classList.add("icon-success");
  iconEl.textContent = "✓";
  titleEl.textContent = "Order Confirmed!";
  subtitleEl.textContent = "Your order has been placed successfully. We'll deliver it soon.";
}

function renderOrderedItems(order) {
  const container = document.getElementById("orderedItemsList");
  if (!container) {
    return;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    container.innerHTML = `
      <div class="detail-row">
        <span class="label">No items found for this order.</span>
        <span class="value">-</span>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => {
    const product = item.productId && typeof item.productId === "object" ? item.productId : {};
    const productId = product._id ? String(product._id) : (item.productId ? String(item.productId) : "");
    const title = item.productName || product.name || "Product";
    const size = String(item.size || "M").toUpperCase();
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.price || product.price || 0);
    const linePrice = unitPrice * qty;
    const image = getImageSrc(product.image || item.image || "");
    const clickableClass = productId ? "ordered-item-row clickable" : "ordered-item-row";
    const clickableAttrs = productId
      ? `data-product-id="${productId}" role="button" tabindex="0" aria-label="Open ${title} details"`
      : "";

    return `
      <div class="${clickableClass}" ${clickableAttrs}>
        <img src="${image}" alt="${title}">
        <div>
          <p class="ordered-item-title">${title}</p>
          <p class="ordered-item-meta">Size: ${size} • Qty: ${qty}</p>
        </div>
        <div class="ordered-item-price">₹${linePrice.toLocaleString("en-IN")}</div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".ordered-item-row.clickable").forEach(row => {
    const productId = row.getAttribute("data-product-id");
    if (!productId) return;

    row.addEventListener("click", () => {
      window.location.href = `product-details.html?id=${productId}`;
    });

    row.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = `product-details.html?id=${productId}`;
      }
    });
  });
}

async function loadOrderDetails() {
  applyLoadingState();

  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");

  if (!orderId) {
    showError("Order ID not found. Please contact support.");
    return;
  }

  try {
    const response = await fetch(`${ORDER_API}/${orderId}`);

    if (!response.ok) {
      throw new Error("Order not found");
    }

    const order = await response.json();

    // Display order details
    document.getElementById("orderNumber").textContent = order.orderNumber || orderId;
    document.getElementById("orderTotal").textContent = `₹${order.totalAmount.toLocaleString()}`;
    
    const paymentMethodMap = {
      "cod": "Cash on Delivery (COD)",
      "online": "Online Payment"
    };
    document.getElementById("paymentMethod").textContent = paymentMethodMap[order.paymentMethod] || order.paymentMethod;

    const orderStatus = (order.status || "pending").toLowerCase();
    applyOrderState(orderStatus);
    renderOrderedItems(order);

    if (orderStatus === "cancelled") {
      document.getElementById("estimatedDelivery").textContent = "Cancelled";
    } else {
      // Calculate estimated delivery (5-7 days from now)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 6); // 5-7 business days average
      document.getElementById("estimatedDelivery").textContent = deliveryDate.toLocaleDateString("en-IN");
    }

  } catch (error) {
    console.error("Load order error:", error);
    showError("Failed to load order details. Please contact support.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Load order details
  loadOrderDetails();
});
