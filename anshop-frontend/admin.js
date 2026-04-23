const API = window.ANSHOP_API || {
  ORIGIN: window.location.origin,
  api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
};
const API_URL = API.api("products");
const ORDERS_API_URL = API.api("orders");

function decodeTokenPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(normalized));
  } catch (error) {
    return null;
  }
}

function resolveAdminContext() {
  const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
  if (token && !localStorage.getItem("authToken")) {
    localStorage.setItem("authToken", token);
  }

  const payload = decodeTokenPayload(token);
  const tokenRole = String((payload && payload.role) || "").trim().toLowerCase();
  const role = tokenRole === "admin" ? "admin" : "user";

  if (token) {
    localStorage.setItem("userRole", role);
  } else {
    localStorage.removeItem("userRole");
  }

  return {
    token,
    role,
    isAdmin: Boolean(token) && role === "admin"
  };
}

// ===== STEP 5: JWT-based admin role check (no hardcoded password) =====
const CURRENT_USER_ROLE = resolveAdminContext().role;
const CURRENT_USER_NAME = localStorage.getItem("userName") || "User";

const statusText = document.getElementById("statusText");
const tableBody = document.getElementById("productTableBody");
const totalProductsEl = document.getElementById("totalProducts");
const inStockEl = document.getElementById("inStock");
const outOfStockEl = document.getElementById("outOfStock");
const avgPriceEl = document.getElementById("avgPrice");
const refreshBtn = document.getElementById("refreshBtn");
const addProductForm = document.getElementById("addProductForm");
const formStatus = document.getElementById("formStatus");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editingProductIdEl = document.getElementById("editingProductId");
const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");
const ordersStatusText = document.getElementById("ordersStatusText");
const ordersTableBody = document.getElementById("ordersTableBody");
const orderViewButtons = document.querySelectorAll(".order-view-btn");

// Modal elements - not needed, kept for backwards compatibility if HTML exists
const adminPasswordModal = document.getElementById("adminPasswordModal");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const submitPasswordBtn = document.getElementById("submitPassword");
const cancelPasswordBtn = document.getElementById("cancelPassword");
const closePasswordModalBtn = document.getElementById("closePasswordModal");
const passwordErrorMsg = document.getElementById("passwordErrorMsg");

let currentProducts = [];
let inlineEditingProductId = "";
let currentOrders = [];
let activeOrderView = "current";

refreshBtn.addEventListener("click", loadProducts);
addProductForm.addEventListener("submit", handleAddProduct);
tableBody.addEventListener("click", handleTableClick);
cancelEditBtn.addEventListener("click", resetFormToAddMode);  // Remove password modal event listeners
if (refreshOrdersBtn) {
  refreshOrdersBtn.addEventListener("click", loadOrders);
}
if (ordersTableBody) {
  ordersTableBody.addEventListener("click", handleOrdersTableClick);
}
if (orderViewButtons && orderViewButtons.length) {
  orderViewButtons.forEach(button => {
    const defaultLabel = button.textContent.trim();
    button.setAttribute("data-default-label", defaultLabel);
  });

  orderViewButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeOrderView = button.getAttribute("data-order-view") || "current";
      orderViewButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      renderOrders(currentOrders);
    });
  });
}

function showToast(message, type = "info") {
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
  }, 2000);
}

function openPasswordModal() {
  // ===== STEP 5: Password modal removed - using JWT role instead =====
}

function closePasswordModal() {
  // ===== STEP 5: Password modal removed - using JWT role instead =====
}

function handlePasswordSubmit() {
  // ===== STEP 5: Password modal removed - using JWT role instead =====
}

function askForAdminPassword() {
  // ===== STEP 5: Password modal removed - using JWT role instead =====
  return true;
}

function getImageSrc(imagePath) {
  if (API.resolveImage) {
    return API.resolveImage(imagePath, "https://via.placeholder.com/54?text=NA");
  }

  if (!imagePath) {
    return "https://via.placeholder.com/54?text=NA";
  }

  return `${API.ORIGIN}/images/${imagePath}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

function getStockBadge(stock) {
  if (stock <= 0) {
    return '<span class="stock-badge stock-out">Out</span>';
  }

  if (stock <= 10) {
    return `<span class="stock-badge stock-low">Low (${stock})</span>`;
  }

  return `<span class="stock-badge stock-ok">In (${stock})</span>`;
}

function updateStats(products) {
  const total = products.length;
  const inStock = products.filter(p => Number(p.stock) > 0).length;
  const outOfStock = total - inStock;
  const priceSum = products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const avg = total ? Math.round(priceSum / total) : 0;

  totalProductsEl.textContent = String(total);
  inStockEl.textContent = String(inStock);
  outOfStockEl.textContent = String(outOfStock);
  avgPriceEl.textContent = `₹${avg}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderDepartmentOptions(selectedValue) {
  const departments = ["Unisex", "Men", "Women"];
  return departments
    .map(dep => {
      const selected = dep === selectedValue ? "selected" : "";
      return `<option value="${dep}" ${selected}>${dep}</option>`;
    })
    .join("");
}

function renderEditableRow(product) {
  const safeName = escapeHtml(product.name || "");
  const safeDepartment = escapeHtml(product.department || "Unisex");
  const safeType = escapeHtml(product.productType || "Other");
  const safeCategory = escapeHtml(product.category || "");
  const safeDescription = escapeHtml(product.description || "");
  const safePrice = Number(product.price) || 0;
  const safeStock = Number(product.stock) || 0;
  const safeDate = formatDate(product.createdAt);
  const safeImage = escapeHtml(product.image || "");

  return `
    <tr class="inline-edit-row" data-row-id="${product._id}">
      <td>
        <img src="${getImageSrc(product.image)}" alt="${safeName || "Preview"}">
        <input class="inline-input" data-field="image" type="text" value="${safeImage}" placeholder="Image URL">
      </td>
      <td><input class="inline-input" data-field="name" type="text" value="${safeName}" placeholder="Name"></td>
      <td>
        <select class="inline-input" data-field="department">
          ${renderDepartmentOptions(product.department || "Unisex")}
        </select>
      </td>
      <td><input class="inline-input" data-field="productType" type="text" value="${safeType}" placeholder="Product Type"></td>
      <td><input class="inline-input" data-field="category" type="text" value="${safeCategory}" placeholder="Category"></td>
      <td><input class="inline-input" data-field="price" type="number" min="0" value="${safePrice}"></td>
      <td><input class="inline-input" data-field="stock" type="number" min="0" value="${safeStock}"></td>
      <td><textarea class="inline-input inline-textarea" data-field="description" placeholder="Description">${safeDescription}</textarea></td>
      <td>${safeDate}</td>
      <td>
        <button class="save-btn" data-id="${product._id}" type="button">Save</button>
        <button class="ghost-btn inline-cancel-btn" data-id="${product._id}" type="button">Cancel</button>
      </td>
    </tr>
  `;
}

function renderProducts(products) {
  currentProducts = products;

  if (!products.length) {
    tableBody.innerHTML = "";
    statusText.textContent = "No products found.";
    updateStats(products);
    return;
  }

  tableBody.innerHTML = products
    .map(p => {
      if (inlineEditingProductId === p._id) {
        return renderEditableRow(p);
      }

      const safeName = p.name || "Untitled";
      const safeDepartment = p.department || "Unisex";
      const safeType = p.productType || "Other";
      const safeCategory = p.category || "-";
      const safeDescription = p.description || "-";
      const safePrice = Number(p.price) || 0;
      const safeStock = Number(p.stock) || 0;
      const safeDate = formatDate(p.createdAt);

      return `
        <tr>
          <td><img src="${getImageSrc(p.image)}" alt="${safeName}"></td>
          <td>${safeName}</td>
          <td>${safeDepartment}</td>
          <td>${safeType}</td>
          <td>${safeCategory}</td>
          <td>₹${safePrice}</td>
          <td>${getStockBadge(safeStock)}</td>
          <td>${safeDescription}</td>
          <td>${safeDate}</td>
          <td>
            <button class="edit-btn" data-id="${p._id}" type="button">Edit</button>
            <button class="delete-btn" data-id="${p._id}" type="button">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  statusText.textContent = `Showing ${products.length} products.`;
  updateStats(products);
}

function loadProducts() {
  inlineEditingProductId = "";
  statusText.textContent = "Loading products...";

  // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
  window.ANSHOP_API.fetchWithAuth(API_URL)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const products = Array.isArray(data.products) ? data.products : [];
      renderProducts(products);
    })
    .catch(error => {
      tableBody.innerHTML = "";
      updateStats([]);
      statusText.textContent = `Could not load products. ${error.message}`;
    });
}

function getFormPayload() {
  return {
    name: document.getElementById("name").value.trim(),
    price: Number(document.getElementById("price").value),
    image: document.getElementById("image").value.trim(),
    department: document.getElementById("department").value,
    productType: document.getElementById("productType").value.trim() || "Other",
    category: document.getElementById("category").value.trim(),
    stock: Number(document.getElementById("stock").value) || 0,
    description: document.getElementById("description").value.trim()
  };
}

function resetFormToAddMode() {
  editingProductIdEl.value = "";
  formTitle.textContent = "Add Product";
  submitBtn.textContent = "Add Product";
  cancelEditBtn.style.display = "none";
  addProductForm.reset();
  document.getElementById("stock").value = "0";
  document.getElementById("department").value = "Unisex";
  document.getElementById("productType").value = "Other";
}

function startEditProduct(product) {
  editingProductIdEl.value = product._id;
  formTitle.textContent = "Edit Product";
  submitBtn.textContent = "Update Product";
  cancelEditBtn.style.display = "inline-block";

  document.getElementById("name").value = product.name || "";
  document.getElementById("price").value = Number(product.price) || 0;
  document.getElementById("image").value = product.image || "";
  document.getElementById("department").value = product.department || "Unisex";
  document.getElementById("productType").value = product.productType || "Other";
  document.getElementById("category").value = product.category || "";
  document.getElementById("stock").value = Number(product.stock) || 0;
  document.getElementById("description").value = product.description || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleAddProduct(event) {
  event.preventDefault();

  const payload = getFormPayload();

  if (!payload.name || !payload.image || Number.isNaN(payload.price)) {
    formStatus.textContent = "Please fill name, price, and image.";
    return;
  }

  if (payload.price < 0 || payload.stock < 0) {
    formStatus.textContent = "Price and stock cannot be negative.";
    return;
  }

  const editingProductId = editingProductIdEl.value;
  const isEditMode = Boolean(editingProductId);

  formStatus.textContent = isEditMode ? "Updating product..." : "Adding product...";

  // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
  window.ANSHOP_API.fetchWithAuth(isEditMode ? `${API_URL}/${editingProductId}` : API_URL, {
    method: isEditMode ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    })
    .then(() => {
      formStatus.textContent = isEditMode
        ? "Product updated successfully."
        : "Product added successfully.";
      resetFormToAddMode();
      loadProducts();
    })
    .catch(error => {
      formStatus.textContent = isEditMode
        ? `Could not update product. ${error.message}`
        : `Could not add product. ${error.message}`;
    });
}

function deleteProduct(productId) {
  statusText.textContent = "Deleting product...";

  // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
  window.ANSHOP_API.fetchWithAuth(`${API_URL}/${productId}`, {
    method: "DELETE"
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    })
    .then(() => {
      loadProducts();
    })
    .catch(error => {
      statusText.textContent = `Could not delete product. ${error.message}`;
    });
}

function getPaymentBadge(paymentMethod) {
  if (paymentMethod === "online") {
    return '<span class="stock-badge stock-low">Online</span>';
  }
  return '<span class="stock-badge stock-ok">COD</span>';
}

function getOrderStatusBadge(status) {
  const safeStatus = status || "pending";
  if (safeStatus === "delivered") {
    return '<span class="stock-badge stock-ok">Delivered</span>';
  }
  if (safeStatus === "cancelled") {
    return '<span class="stock-badge stock-out">Cancelled</span>';
  }
  if (safeStatus === "shipped" || safeStatus === "confirmed") {
    return `<span class="stock-badge stock-low">${safeStatus}</span>`;
  }
  return '<span class="stock-badge stock-low">Pending</span>';
}

function renderOrderStatusOptions(selectedValue) {
  const options = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  return options
    .map(status => {
      const selected = status === selectedValue ? "selected" : "";
      return `<option value="${status}" ${selected}>${status}</option>`;
    })
    .join("");
}

function filterOrdersByView(orders, view) {
  if (!Array.isArray(orders)) {
    return [];
  }

  if (view === "delivered") {
    return orders.filter(order => (order.status || "pending") === "delivered");
  }

  if (view === "cancelled") {
    return orders.filter(order => (order.status || "pending") === "cancelled");
  }

  return orders.filter(order => {
    const status = order.status || "pending";
    return status !== "delivered" && status !== "cancelled";
  });
}

function getOrderViewLabel(view) {
  if (view === "delivered") {
    return "delivered";
  }
  if (view === "cancelled") {
    return "cancelled";
  }
  return "current";
}

function updateOrderViewTabCounts(orders) {
  if (!orderViewButtons || !orderViewButtons.length) {
    return;
  }

  const currentCount = filterOrdersByView(orders, "current").length;
  const deliveredCount = filterOrdersByView(orders, "delivered").length;
  const cancelledCount = filterOrdersByView(orders, "cancelled").length;

  orderViewButtons.forEach(button => {
    const view = button.getAttribute("data-order-view") || "current";
    const label = button.getAttribute("data-default-label") || button.textContent.trim();
    let count = 0;

    if (view === "delivered") {
      count = deliveredCount;
    } else if (view === "cancelled") {
      count = cancelledCount;
    } else {
      count = currentCount;
    }

    button.innerHTML = `${label} <span class="tab-count-badge">${count}</span>`;
  });
}

function renderOrders(orders) {
  currentOrders = orders;
  updateOrderViewTabCounts(orders);
  const filteredOrders = filterOrdersByView(orders, activeOrderView);

  if (!ordersTableBody || !ordersStatusText) {
    return;
  }

  if (!filteredOrders.length) {
    ordersTableBody.innerHTML = "";
    ordersStatusText.textContent = `No ${getOrderViewLabel(activeOrderView)} orders found.`;
    return;
  }

  ordersTableBody.innerHTML = filteredOrders
    .map(order => {
      const userName = order.userId?.name || "Unknown";
      const userEmail = order.userId?.email || "-";
      const itemsCount = Array.isArray(order.items) ? order.items.length : 0;
      const shipping = order.shippingAddress || {};
      const shippingName = shipping.fullName || userName;
      const shippingPhone = shipping.phone || "-";
      const shippingEmail = shipping.email || userEmail;
      const addressLine = [
        shipping.address,
        shipping.city,
        shipping.state,
        shipping.pincode
      ]
        .filter(Boolean)
        .join(", ") || "Address not available";
      const itemsPreview = Array.isArray(order.items)
        ? order.items
            .slice(0, 2)
            .map(item => {
              const name = item.productName || item.productId?.name || "Product";
              const qty = Number(item.quantity) || 1;
              return `${name} x${qty}`;
            })
            .join("<br>")
        : "-";
      const sizePreview = Array.isArray(order.items)
        ? order.items
            .slice(0, 2)
            .map(item => `Size: ${String(item.size || "M").toUpperCase()}`)
            .join("<br>")
        : "-";
      const extraItems = itemsCount > 2 ? `<small>+${itemsCount - 2} more item(s)</small>` : "";
      const extraSizes = itemsCount > 2 ? `<small>+${itemsCount - 2} more size(s)</small>` : "";
      const totalAmount = Number(order.totalAmount) || 0;
      const orderDate = formatDate(order.createdAt);
      const orderNumber = order.orderNumber || order._id;
      const status = order.status || "pending";
      const paymentMethod = order.paymentMethod || "cod";

      return `
        <tr>
          <td>${orderNumber}</td>
          <td>
            <strong>${userName}</strong><br>
            <small>${userEmail}</small>
          </td>
          <td>
            <div class="delivery-card">
              <strong>${escapeHtml(shippingName)}</strong><br>
              <small>${escapeHtml(shippingPhone)}</small><br>
              <small>${escapeHtml(shippingEmail)}</small><br>
              <small>${escapeHtml(addressLine)}</small>
            </div>
          </td>
          <td>
            <strong>${itemsCount} item(s)</strong><br>
            <small>${itemsPreview}</small><br>
            ${extraItems}
          </td>
          <td>
            <small>${sizePreview}</small><br>
            ${extraSizes}
          </td>
          <td>₹${totalAmount}</td>
          <td>${getPaymentBadge(paymentMethod)}</td>
          <td>${getOrderStatusBadge(status)}</td>
          <td>${orderDate}</td>
          <td>
            <select class="inline-input" data-order-status-id="${order._id}" style="max-width: 130px; margin: 0 0 8px 0;">
              ${renderOrderStatusOptions(status)}
            </select>
            <button class="save-btn update-order-btn" data-order-id="${order._id}" type="button">Update</button>
          </td>
        </tr>
      `;
    })
    .join("");

  ordersStatusText.textContent = `Showing ${filteredOrders.length} ${getOrderViewLabel(activeOrderView)} order(s).`;
}

function loadOrders() {
  if (!ordersStatusText || !ordersTableBody) {
    return;
  }

  ordersStatusText.textContent = "Loading orders...";

  // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
  window.ANSHOP_API.fetchWithAuth(`${ORDERS_API_URL}/admin/all`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const orders = Array.isArray(data) ? data : (Array.isArray(data.orders) ? data.orders : []);
      renderOrders(orders);
    })
    .catch(error => {
      ordersTableBody.innerHTML = "";
      ordersStatusText.textContent = `Could not load orders. ${error.message}`;
    });
}

function updateOrderStatus(orderId, status) {
  if (!ordersStatusText) {
    return;
  }

  ordersStatusText.textContent = "Updating order status...";

  // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
  window.ANSHOP_API.fetchWithAuth(`${ORDERS_API_URL}/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      return res.json();
    })
    .then(() => {
      ordersStatusText.textContent = "Order status updated successfully.";
      loadOrders();
    })
    .catch(error => {
      ordersStatusText.textContent = `Could not update order. ${error.message}`;
    });
}

function handleOrdersTableClick(event) {
  const updateButton = event.target.closest(".update-order-btn");
  if (!updateButton) {
    return;
  }

  const orderId = updateButton.getAttribute("data-order-id");
  if (!orderId) {
    return;
  }

  const selectEl = document.querySelector(`[data-order-status-id="${orderId}"]`);
  if (!selectEl) {
    return;
  }

  const newStatus = selectEl.value;
  updateOrderStatus(orderId, newStatus);
}

async function saveInlineEdit(productId, rowElement) {
  const payload = {
    image: rowElement.querySelector('[data-field="image"]').value.trim(),
    name: rowElement.querySelector('[data-field="name"]').value.trim(),
    department: rowElement.querySelector('[data-field="department"]').value,
    productType: rowElement.querySelector('[data-field="productType"]').value.trim() || "Other",
    category: rowElement.querySelector('[data-field="category"]').value.trim(),
    price: Number(rowElement.querySelector('[data-field="price"]').value),
    stock: Number(rowElement.querySelector('[data-field="stock"]').value),
    description: rowElement.querySelector('[data-field="description"]').value.trim()
  };

  if (!payload.name || !payload.image || Number.isNaN(payload.price)) {
    statusText.textContent = "Please fill name, image and price before saving.";
    return;
  }

  if (payload.price < 0 || payload.stock < 0) {
    statusText.textContent = "Price and stock cannot be negative.";
    return;
  }

  statusText.textContent = "Saving product changes...";

  try {
    const response = await window.ANSHOP_API.fetchWithAuth(`${API_URL}/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Request failed: 401 (login again as admin)");
      }
      throw new Error(`Request failed: ${response.status}`);
    }

    inlineEditingProductId = "";
    statusText.textContent = "Product updated successfully.";
    loadProducts();
  } catch (error) {
    statusText.textContent = `Could not update product. ${error.message}`;
  }
}

function handleTableClick(event) {
  const editButton = event.target.closest(".edit-btn");
  if (editButton) {
    const productId = editButton.getAttribute("data-id");
    inlineEditingProductId = productId || "";
    renderProducts(currentProducts);
    statusText.textContent = "Inline edit mode enabled. Click Save to update this product.";
    return;
  }

  const inlineCancelButton = event.target.closest(".inline-cancel-btn");
  if (inlineCancelButton) {
    inlineEditingProductId = "";
    renderProducts(currentProducts);
    statusText.textContent = "Inline edit canceled.";
    return;
  }

  const inlineSaveButton = event.target.closest(".save-btn");
  if (inlineSaveButton) {
    const productId = inlineSaveButton.getAttribute("data-id");
    if (!productId) {
      return;
    }

    const rowElement = inlineSaveButton.closest("tr");
    if (!rowElement) {
      return;
    }

    saveInlineEdit(productId, rowElement);
    return;
  }

  const button = event.target.closest(".delete-btn");
  if (!button) {
    return;
  }

  const productId = button.getAttribute("data-id");
  if (!productId) {
    return;
  }

  const shouldDelete = window.confirm("Delete this product?");
  if (!shouldDelete) {
    return;
  }

  deleteProduct(productId);
}

// Initialize admin panel with JWT role check
// ===== STEP 5: Check user role from signed JWT token =====
if (resolveAdminContext().isAdmin) {
  loadProducts();
  loadOrders();
} else {
  showToast("Admin access required. Redirecting to home...", "error");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 2000);
}
