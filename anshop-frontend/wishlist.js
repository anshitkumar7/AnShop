const API = window.ANSHOP_API || {
  ORIGIN: window.location.origin,
  api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
};
const WISHLIST_API = API.api("wishlist");
const CART_API = API.api("cart/add");

function getImageSrc(imagePath) {
  if (API.resolveImage) {
    return API.resolveImage(imagePath, "https://via.placeholder.com/400?text=No+Image");
  }

  if (!imagePath) {
    return "https://via.placeholder.com/400?text=No+Image";
  }

  return `${API.ORIGIN}/images/${imagePath}`;
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

function openProductDetails(productId) {
  if (!productId) {
    return;
  }
  window.location.href = `product-details.html?id=${productId}`;
}

function renderEmptyState() {
  const grid = document.getElementById("wishlistGrid");
  const summary = document.getElementById("wishlistSummary");
  if (summary) {
    summary.textContent = "0 item(s)";
  }

  if (grid) {
    grid.innerHTML = `
      <div class="wishlist-empty">
        <h3>Your wishlist is empty</h3>
        <p>Tap the heart icon on products to save them here.</p>
        <a href="shop.html">Browse products</a>
      </div>
    `;
  }
}

async function removeFromWishlist(productId) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  const response = await fetch(`${WISHLIST_API}/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userId, productId })
  });

  if (!response.ok) {
    throw new Error("Failed to update wishlist");
  }
}

async function moveToCart(productId) {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  const addResponse = await fetch(CART_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userId, productId })
  });

  if (!addResponse.ok) {
    throw new Error("Failed to add to cart");
  }

  await removeFromWishlist(productId);
}

function renderWishlist(items) {
  const grid = document.getElementById("wishlistGrid");
  const summary = document.getElementById("wishlistSummary");

  if (!grid) {
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    renderEmptyState();
    return;
  }

  if (summary) {
    summary.textContent = `${items.length} item(s)`;
  }

  grid.innerHTML = items.map(item => {
    const product = item.productId && typeof item.productId === "object" ? item.productId : {};
    const productId = product._id || item.productId;
    const name = product.name || "Wishlist Product";
    const image = getImageSrc(product.image);
    const category = product.category || "Saved Item";
    const price = Number(product.price) || 0;

    return `
      <article class="wishlist-card" data-id="${productId}">
        <div class="wishlist-image-wrap">
          <img src="${image}" alt="${name}">
        </div>
        <div class="wishlist-card-body">
          <h3>${name}</h3>
          <p>${category}</p>
          <div class="wishlist-price">₹${price.toLocaleString("en-IN")}</div>
          <div class="wishlist-actions">
            <button class="move-cart-btn" data-action="move" data-id="${productId}">Move to Cart</button>
            <button class="remove-wishlist-btn" data-action="remove" data-id="${productId}">Remove</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".wishlist-card[data-id]").forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", event => {
      if (event.target.closest("button")) {
        return;
      }
      openProductDetails(card.dataset.id);
    });
  });

  grid.querySelectorAll("button[data-action]").forEach(button => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const productId = button.dataset.id;

      button.disabled = true;
      try {
        if (action === "move") {
          await moveToCart(productId);
          showToast("Moved to cart", "success");
        } else {
          await removeFromWishlist(productId);
          showToast("Removed from wishlist", "info");
        }

        await loadWishlist();
      } catch (error) {
        showToast("Action failed. Please try again.", "error");
      }

      button.disabled = false;
    });
  });
}

async function loadWishlist() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${WISHLIST_API}/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to load wishlist");
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    renderWishlist(items);
  } catch (error) {
    renderEmptyState();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  loadWishlist();
});
