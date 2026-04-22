const API = window.ANSHOP_API || {
  api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
};
const ORDERS_API = API.api("orders");
let allOrders = [];
let activeFilter = "all";

function updateCartBadge(itemCount) {
  const badge = document.getElementById("cartCountBadge");
  if (badge) {
    badge.textContent = itemCount;
  }
}

function getStatusClass(status) {
  return `status-${status}`;
}

function getStatusDisplay(status) {
  const statusMap = {
    pending: "Pending",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };
  return statusMap[status] || status;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function getFilteredOrders() {
  if (activeFilter === "all") {
    return allOrders;
  }

  if (activeFilter === "active") {
    return allOrders.filter(order => {
      const status = order.status || "pending";
      return status !== "delivered" && status !== "cancelled";
    });
  }

  return allOrders.filter(order => (order.status || "pending") === activeFilter);
}

function updateFilterCounts() {
  const counts = {
    all: allOrders.length,
    active: allOrders.filter(order => {
      const status = order.status || "pending";
      return status !== "delivered" && status !== "cancelled";
    }).length,
    delivered: allOrders.filter(order => (order.status || "pending") === "delivered").length,
    cancelled: allOrders.filter(order => (order.status || "pending") === "cancelled").length
  };

  document.querySelectorAll(".orders-filter-btn").forEach(button => {
    const key = button.dataset.filter || "all";
    const label = button.textContent.split("(")[0].trim();
    button.innerHTML = `${label} <span class="filter-count">${counts[key] || 0}</span>`;
  });
}

function renderOrders(orders) {
  const container = document.getElementById("ordersContent");

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="orders-empty">
        <h2>No Orders Yet</h2>
        <p>You haven't placed any orders yet. Let's change that!</p>
        <a href="shop.html">Start Shopping</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="orders-list"></div>`;
  const ordersList = container.querySelector(".orders-list");

  orders.forEach(order => {
    const orderCard = document.createElement("div");
    orderCard.className = "order-card";

    const safeItems = Array.isArray(order.items) ? order.items : [];
    const safeAddress = order.shippingAddress || {};
    const safeAddressLine = [safeAddress.address, safeAddress.city, safeAddress.state, safeAddress.pincode]
      .filter(Boolean)
      .join(", ") || "Address not available";
    const safeTotal = Number(order.totalAmount) || 0;
    const safeOrderNumber = order.orderNumber || order._id || "-";
    const safeStatus = order.status || "pending";
    const safePayment = order.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery";
    const itemsCount = safeItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    const itemsPreview = safeItems
      .slice(0, 2)
      .map(item => `
        <p>${item.productName || "Product"} (Size: ${String(item.size || "M").toUpperCase()}) x${Number(item.quantity) || 1}</p>
      `)
      .join("");

    const extraItemsCount = Math.max(safeItems.length - 2, 0);
    const safeOrderId = order && order._id ? String(order._id) : "";

    orderCard.innerHTML = `
      <div class="order-header">
        <div class="order-number">#${safeOrderNumber}</div>
        <div class="order-status ${getStatusClass(safeStatus)}">${getStatusDisplay(safeStatus)}</div>
      </div>

      <div class="order-meta">
        <span>${formatDate(order.createdAt)}</span>
        <span>${safePayment}</span>
        <span>${itemsCount} item(s)</span>
        ${order.trackingId ? `<span>Track: ${order.trackingId}</span>` : ""}
      </div>

      <div class="order-address">Delivery: ${safeAddressLine}</div>

      <div class="order-items-preview">
        ${itemsPreview || "<p>Items not available</p>"}
        ${extraItemsCount > 0 ? `<p>+${extraItemsCount} more item(s)</p>` : ""}
      </div>

      <div class="order-footer">
        <div class="order-total">Total: ₹${safeTotal.toLocaleString()}</div>
        <div class="order-actions">
          <button class="order-btn" data-action="view-details" data-order-id="${safeOrderId}">View Details</button>
          ${safeStatus !== "delivered" && safeStatus !== "cancelled" ? `
            <button class="order-btn" data-action="cancel-order" data-order-id="${safeOrderId}">Cancel Order</button>
          ` : ""}
        </div>
      </div>
    `;

    const viewBtn = orderCard.querySelector('[data-action="view-details"]');
    if (viewBtn) {
      viewBtn.addEventListener("click", () => {
        if (!safeOrderId) return;
        viewOrderDetails(safeOrderId);
      });
    }

    const cancelBtn = orderCard.querySelector('[data-action="cancel-order"]');
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (!safeOrderId) return;
        cancelOrder(safeOrderId);
      });
    }

    ordersList.appendChild(orderCard);
  });
}

async function loadOrders() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    document.getElementById("ordersContent").innerHTML = `
      <div class="orders-empty">
        <h2>Please Login</h2>
        <p>You need to login to view your orders.</p>
        <a href="login.html">Go to Login</a>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(`${ORDERS_API}/user/${userId}`);

    if (!response.ok) {
      throw new Error("Failed to load orders");
    }

    const orders = await response.json();
    allOrders = Array.isArray(orders) ? orders : [];
    updateFilterCounts();
    renderOrders(getFilteredOrders());
  } catch (error) {
    console.error("Load orders error:", error);
    document.getElementById("ordersContent").innerHTML = `
      <div class="orders-empty">
        <h2>Error Loading Orders</h2>
        <p>Failed to load your orders. Please try again later.</p>
        <a href="shop.html">Back to Shop</a>
      </div>
    `;
  }
}

function setActiveFilter(filterValue) {
  activeFilter = filterValue;

  document.querySelectorAll(".orders-filter-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === filterValue);
  });

  renderOrders(getFilteredOrders());
}

function viewOrderDetails(orderId) {
  window.location.href = `order-confirmation.html?orderId=${orderId}`;
}

function showOrdersToast(message, type = "success") {
  let toast = document.getElementById("ordersToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "ordersToast";
    toast.className = "orders-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("error", "success", "show");
  toast.classList.add(type === "error" ? "error" : "success");
  toast.classList.add("show");

  clearTimeout(showOrdersToast.timer);
  showOrdersToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function showCancelOrderModal() {
  return new Promise(resolve => {
    const backdrop = document.createElement("div");
    backdrop.className = "orders-confirm-backdrop";
    backdrop.innerHTML = `
      <div class="orders-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cancelOrderTitle">
        <div class="orders-confirm-head">
          <h3 id="cancelOrderTitle">Cancel This Order?</h3>
          <p>This action cannot be undone after cancellation.</p>
        </div>
        <div class="orders-confirm-actions">
          <button type="button" class="orders-confirm-btn keep" id="keepOrderBtn">Keep Order</button>
          <button type="button" class="orders-confirm-btn cancel" id="cancelOrderBtn">Yes, Cancel</button>
        </div>
      </div>
    `;

    const closeModal = result => {
      document.removeEventListener("keydown", handleEscape);
      backdrop.remove();
      resolve(result);
    };

    const handleEscape = event => {
      if (event.key === "Escape") {
        closeModal(false);
      }
    };

    document.body.appendChild(backdrop);
    document.addEventListener("keydown", handleEscape);

    const keepOrderBtn = backdrop.querySelector("#keepOrderBtn");
    const cancelOrderBtn = backdrop.querySelector("#cancelOrderBtn");

    keepOrderBtn.addEventListener("click", () => closeModal(false));
    cancelOrderBtn.addEventListener("click", () => closeModal(true));
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        closeModal(false);
      }
    });
  });
}

async function cancelOrder(orderId) {
  const shouldCancel = await showCancelOrderModal();
  if (!shouldCancel) {
    return;
  }

  try {
    const response = await fetch(`${ORDERS_API}/${orderId}/cancel`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to cancel order");
    }

    showOrdersToast("Order cancelled successfully", "success");
    // Reload orders
    loadOrders();
  } catch (error) {
    console.error("Cancel order error:", error);
    showOrdersToast("Failed to cancel order. Please try again.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  document.querySelectorAll(".orders-filter-btn").forEach(button => {
    button.addEventListener("click", () => {
      setActiveFilter(button.dataset.filter || "all");
    });
  });

  loadOrders();
});
