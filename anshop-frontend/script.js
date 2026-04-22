const API = window.ANSHOP_API || {
  ORIGIN: window.location.origin,
  api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
};

function getImageSrc(imagePath) {
  if (API.resolveImage) {
    return API.resolveImage(imagePath, "https://via.placeholder.com/250?text=Product");
  }

  if (!imagePath) {
    return "https://via.placeholder.com/250?text=Product";
  }

  return `${API.ORIGIN}/images/${imagePath}`;
}

const WISHLIST_API = API.api("wishlist");
const CART_ADD_API = API.api("cart/add");
let wishlistIds = new Set();

function updateCartBadge(count) {
  const badges = [
    document.getElementById("cartCountBadge"),
    document.getElementById("bottomCartCountBadge")
  ];

  badges.forEach(badge => {
    if (badge) {
      badge.textContent = String(count);
    }
  });
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

function getCurrentUserId() {
  return localStorage.getItem("userId");
}

function initHomePromoButtons() {
  const collectionBtn = document.getElementById("collectionBtn");
  const learnMoreBtn = document.getElementById("learnMoreBtn");
  const faqSoonLink = document.getElementById("faqSoonLink");
  const returnsSoonLink = document.getElementById("returnsSoonLink");
  const linkedinSoonLink = document.getElementById("linkedinSoonLink");
  const githubSoonLink = document.getElementById("githubSoonLink");

  if (collectionBtn) {
    collectionBtn.addEventListener("click", () => {
      window.location.href = "shop.html";
    });
  }

  if (learnMoreBtn) {
    learnMoreBtn.addEventListener("click", () => {
      showToast("Coming Soon", "info");
    });
  }

  [faqSoonLink, returnsSoonLink, linkedinSoonLink, githubSoonLink].forEach(link => {
    if (!link) {
      return;
    }

    link.addEventListener("click", event => {
      event.preventDefault();
      showToast("Coming Soon", "info");
    });
  });
}

function isProductAdded(productId) {
  if (!getCurrentUserId()) {
    return false;
  }

  return localStorage.getItem(productId) === "added";
}

function setButtonToGoToCart(button) {
  button.textContent = "Go to Cart";
  button.classList.add("home-go-cart-btn");
}

function setButtonToAdd(button) {
  button.textContent = "Add to Cart";
  button.classList.remove("home-go-cart-btn");
}

async function syncHomeButtonsFromBackend(products) {
  const userId = getCurrentUserId();

  if (!userId) {
    updateCartBadge(0);
    return;
  }

  try {
    // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
    const response = await window.ANSHOP_API.fetchWithAuth(`${API.api("cart")}/${userId}`);
    if (!response.ok) return;

    const cartData = await response.json();
    const cartItems = cartData.items || [];
    const backendIds = new Set(
      cartItems
        .map(item => {
          if (!item.productId) return "";
          return item.productId._id ? item.productId._id.toString() : item.productId.toString();
        })
        .filter(Boolean)
    );

    products.forEach(product => {
      const id = product._id.toString();
      if (backendIds.has(id)) {
        localStorage.setItem(id, "added");
      } else {
        localStorage.removeItem(id);
      }
    });

    const cartCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    updateCartBadge(cartCount);
  } catch (error) {
    // Keep page functional even if cart sync fails.
  }
}

function bindHomeButtons() {
  document.querySelectorAll(".home-add-cart-btn").forEach(button => {
    const productId = button.dataset.id;

    if (isProductAdded(productId)) {
      setButtonToGoToCart(button);
    } else {
      setButtonToAdd(button);
    }

    button.addEventListener("click", async () => {
      if (button.textContent.trim() === "Go to Cart") {
        window.location.href = "cart.html";
        return;
      }

      await addToCart(productId, button);
    });
  });
}

function getHeartIcon(isActive) {
  return isActive ? "♥" : "♡";
}

function openProductDetails(productId) {
  if (!productId) {
    return;
  }
  window.location.href = `product-details.html?id=${productId}`;
}

async function syncWishlistFromBackend() {
  const userId = getCurrentUserId();
  wishlistIds = new Set();

  if (!userId) {
    return;
  }

  try {
    // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
    const response = await window.ANSHOP_API.fetchWithAuth(`${WISHLIST_API}/${userId}`);
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    items.forEach(item => {
      if (!item || !item.productId) return;
      const id = item.productId._id ? item.productId._id.toString() : item.productId.toString();
      wishlistIds.add(id);
    });
  } catch (error) {
    // Keep homepage working if wishlist API fails.
  }
}

function bindHomeWishlistButtons() {
  document.querySelectorAll(".home-wishlist-btn").forEach(button => {
    const productId = button.dataset.id;
    button.classList.toggle("active", wishlistIds.has(productId));
    button.textContent = getHeartIcon(wishlistIds.has(productId));

    button.addEventListener("click", async event => {
      event.preventDefault();
      const userId = getCurrentUserId();
      if (!userId) {
        showToast("Please login to use wishlist", "info");
        window.location.href = "login.html";
        return;
      }

      button.disabled = true;
      try {
        // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
        const response = await window.ANSHOP_API.fetchWithAuth(`${WISHLIST_API}/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ userId, productId })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Wishlist update failed");
        }

        if (data.added) {
          wishlistIds.add(productId);
          showToast("Added to wishlist", "success");
        } else {
          wishlistIds.delete(productId);
          showToast("Removed from wishlist", "info");
        }

        button.classList.toggle("active", wishlistIds.has(productId));
        button.textContent = getHeartIcon(wishlistIds.has(productId));
      } catch (error) {
        showToast("Unable to update wishlist", "error");
      }

      button.disabled = false;
    });
  });
}

async function loadHomeProducts() {
  try {
    const response = await fetch(API.api("products"));
    const data = await response.json();
    const products = Array.isArray(data.products) ? data.products : [];
    const featuredContainer = document.getElementById("products");
    const newArrivalsContainer = document.getElementById("newProducts");
    const productsByNewest = [...products].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // Keep New Arrivals as a rolling latest-4 list.
    const newArrivals = productsByNewest.slice(0, 4);
    const newArrivalIds = new Set(newArrivals.map(product => String(product._id)));

    // Featured gets older products (excluding current New Arrivals).
    const featuredProducts = productsByNewest
      .filter(product => !newArrivalIds.has(String(product._id)))
      .slice(0, 8);

    await Promise.all([
      syncWishlistFromBackend(),
      syncHomeButtonsFromBackend([...featuredProducts, ...newArrivals])
    ]);

    function createHomeProductCardHtml(p) {
      const safeImage = getImageSrc(p.image);
      const safeName = p.name || "Product";
      const safeCategory = p.category || "General";
      const safePrice = Number(p.price) || 0;
      const safeMrp = Math.round(safePrice * 1.2);
      const safeDiscount = Math.max(Math.round(((safeMrp - safePrice) / safeMrp) * 100), 0);

      return `
        <div class="pro" data-id="${p._id}">
          <div class="home-pro-image-wrap">
            <img src="${safeImage}" alt="${safeName}" loading="lazy" decoding="async">
            <button class="home-wishlist-btn" data-id="${p._id}" type="button" aria-label="Add to wishlist">${getHeartIcon(wishlistIds.has(p._id.toString()))}</button>
          </div>
          <div class="des">
            <span class="pro-category">${safeCategory}</span>
            <h5>${safeName}</h5>
            <div class="price-row-home">
              <h4>₹${safePrice}</h4>
              <p class="home-mrp">₹${safeMrp}</p>
              <p class="home-discount">${safeDiscount}% off</p>
            </div>
            <p class="home-trust-note">Fast delivery • Easy returns</p>
          </div>
          <button class="home-add-cart-btn" data-id="${p._id}" type="button">
            Add to Cart
          </button>
        </div>
      `;
    }

    if (featuredContainer) {
      featuredContainer.innerHTML = featuredProducts.map(createHomeProductCardHtml).join("");
    }

    if (newArrivalsContainer) {
      newArrivalsContainer.innerHTML = newArrivals.map(createHomeProductCardHtml).join("");
    }

    if (newArrivalsContainer && newArrivals.length === 0) {
      newArrivalsContainer.innerHTML = '<p class="home-trust-note">New arrivals will appear here when more products are added.</p>';
    }

    if (featuredContainer && featuredProducts.length === 0) {
      featuredContainer.innerHTML = '<p class="home-trust-note">Featured products will appear here soon.</p>';
    }

    bindHomeButtons();
    bindHomeWishlistButtons();

    document.querySelectorAll(".pro[data-id]").forEach(card => {
      card.style.cursor = "pointer";
      card.addEventListener("click", event => {
        if (event.target.closest(".home-add-cart-btn") || event.target.closest(".home-wishlist-btn")) {
          return;
        }
        openProductDetails(card.dataset.id);
      });
    });
  } catch (error) {
    const featuredContainer = document.getElementById("products");
    const newArrivalsContainer = document.getElementById("newProducts");

    if (featuredContainer) {
      featuredContainer.innerHTML = '<p class="home-trust-note">Unable to load products right now.</p>';
    }
    if (newArrivalsContainer) {
      newArrivalsContainer.innerHTML = '<p class="home-trust-note">Unable to load products right now.</p>';
    }
  }
}

async function addToCart(productId, button) {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    showToast("Please login first", "info");
    window.location.href = "login.html";
    return;
  }

  button.disabled = true;
  button.textContent = "Adding...";

  // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
  window.ANSHOP_API.fetchWithAuth(CART_ADD_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId,
      productId: productId
    })
  })
    .then(res => res.json())
    .then(() => {
      showToast("Product added to cart", "success");
      localStorage.setItem(productId, "added");
      setButtonToGoToCart(button);
      updateCartBadge(Number(document.getElementById("cartCountBadge")?.textContent || 0) + 1);
      button.disabled = false;
    })
    .catch(() => {
      setButtonToAdd(button);
      button.disabled = false;
      showToast("Unable to add product right now.", "error");
    });
}

initHomePromoButtons();
loadHomeProducts();