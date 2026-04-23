const API = window.ANSHOP_API || {
  ORIGIN: window.location.origin,
  api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
};
const PRODUCTS_API = API.api("products");
const ADD_TO_CART_API = API.api("cart/add");
const WISHLIST_API = API.api("wishlist");

let allProducts = [];
let activeDepartment = "All";
let activeType = "All";
let searchQuery = "";
let wishlistIds = new Set();

const productsGrid = document.getElementById("productsGrid");
const statusMessage = document.getElementById("statusMessage");
const yearEl = document.getElementById("year");
const cartCountBadge = document.getElementById("cartCountBadge");
const typeFiltersRow = document.getElementById("typeFiltersRow");
const searchInput = document.getElementById("searchInput");
const autocompleteDropdown = document.getElementById("autocompleteDropdown");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

function getImageSrc(imagePath) {
  if (API.resolveImage) {
    return API.resolveImage(imagePath, "https://via.placeholder.com/400?text=No+Image");
  }

  if (!imagePath) {
    return "https://via.placeholder.com/400?text=No+Image";
  }

  return `${API.ORIGIN}/images/${imagePath}`;
}

function getHeartIcon(isActive) {
  return isActive ? "♥" : "♡";
}

function isProductAdded(productId) {
  if (!localStorage.getItem("userId")) {
    return false;
  }
  return localStorage.getItem(productId) === "added";
}

function setButtonToGoToCart(button) {
  button.textContent = "Go to Cart";
  button.classList.add("go-cart-btn");
}

function setButtonToAdd(button) {
  button.textContent = "Add to Cart";
  button.classList.remove("go-cart-btn");
}

function getNormalizedWords(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function classifyDepartment(product) {
  const savedDepartment = (product.department || "").trim();
  if (["Men", "Women", "Unisex"].includes(savedDepartment)) {
    return savedDepartment;
  }

  const words = [
    ...getNormalizedWords(product.name),
    ...getNormalizedWords(product.category),
    ...getNormalizedWords(product.description)
  ];

  const womenWords = ["women", "womens", "woman", "ladies", "lady", "female", "girl", "girls"];
  const menWords = ["men", "mens", "man", "gents", "male", "boy", "boys"];

  const hasWomen = womenWords.some(word => words.includes(word));
  const hasMen = menWords.some(word => words.includes(word));

  if (hasWomen && !hasMen) return "Women";
  if (hasMen && !hasWomen) return "Men";
  return "Unisex";
}

function classifyType(product) {
  const savedType = (product.productType || "").trim();
  if (savedType) {
    return savedType;
  }

  const text = `${product.name || ""} ${product.category || ""} ${product.description || ""}`.toLowerCase();

  if (text.includes("t-shirt") || text.includes("tshirt") || text.includes("tee")) return "T-Shirt";
  if (text.includes("shirt")) return "Shirt";
  if (text.includes("trouser") || text.includes("pant") || text.includes("jean")) return "Trouser";
  if (text.includes("kurti")) return "Kurti";
  if (text.includes("dress")) return "Dress";
  if (text.includes("saree") || text.includes("sari")) return "Saree";
  if (text.includes("jacket")) return "Jacket";
  if (text.includes("hoodie")) return "Hoodie";
  if (text.includes("shoe") || text.includes("sneaker")) return "Shoes";

  const rawCategory = (product.category || "").trim();
  if (!rawCategory) return "Other";

  return rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
}

function enrichProducts(products) {
  return products.map(product => ({
    ...product,
    department: classifyDepartment(product),
    productType: classifyType(product)
  }));
}

function getRatingText(product) {
  const price = Number(product.price) || 100;
  const rating = 4 + ((price % 9) / 10);
  return rating.toFixed(1);
}

function getMrpAndDiscount(price) {
  const mrp = Math.round(price * 1.2);
  const discount = Math.round(((mrp - price) / mrp) * 100);
  return { mrp, discount };
}

function updateCartBadge(itemCount) {
  if (!cartCountBadge) return;
  cartCountBadge.textContent = itemCount;
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

function openProductDetails(productId) {
  if (!productId) {
    return;
  }
  window.location.href = `product-details.html?id=${productId}`;
}

function getAutocompleSuggestions(query) {
  if (!query.trim()) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();
  const suggestionSet = new Map(); // Map to avoid duplicates

  allProducts.forEach(product => {
    const name = (product.name || "").toLowerCase();
    const type = (product.productType || "").toLowerCase();
    const department = (product.department || "").toLowerCase();

    // Check if query matches product name
    if (name.includes(queryLower)) {
      const key = `${product.name}|${product.productType}`;
      if (!suggestionSet.has(key)) {
        suggestionSet.set(key, {
          type: "product",
          name: product.name,
          category: product.productType,
          department: product.department,
          productId: product._id
        });
      }
    }

    // Check if query matches product type
    if (type.includes(queryLower) && queryLower.length >= 2) {
      const key = `type|${product.productType}`;
      if (!suggestionSet.has(key)) {
        suggestionSet.set(key, {
          type: "type",
          name: product.productType,
          department: department
        });
      }
    }

    // Check if query matches department
    if (department.includes(queryLower) && queryLower.length >= 2) {
      const key = `dept|${product.department}`;
      if (!suggestionSet.has(key)) {
        suggestionSet.set(key, {
          type: "department",
          name: product.department
        });
      }
    }
  });

  return Array.from(suggestionSet.values()).slice(0, 8); // Limit to 8 suggestions
}

function renderAutocompleteSuggestions(suggestions) {
  autocompleteDropdown.innerHTML = "";

  if (suggestions.length === 0) {
    autocompleteDropdown.classList.remove("show");
    return;
  }

  suggestions.forEach((suggestion, index) => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";

    if (suggestion.type === "product") {
      item.innerHTML = `
        <div class="autocomplete-item-name">${suggestion.name}</div>
        <div class="autocomplete-item-details">${suggestion.category} • ${suggestion.department}</div>
      `;
      item.addEventListener("click", () => {
        searchInput.value = suggestion.name;
        searchQuery = suggestion.name;
        autocompleteDropdown.classList.remove("show");
        applyFilters();
      });
    } else if (suggestion.type === "type") {
      item.innerHTML = `
        <div class="autocomplete-item-name">${suggestion.name}</div>
        <div class="autocomplete-item-details">Product Type</div>
      `;
      item.addEventListener("click", () => {
        searchInput.value = suggestion.name;
        searchQuery = suggestion.name;
        autocompleteDropdown.classList.remove("show");
        applyFilters();
      });
    } else if (suggestion.type === "department") {
      item.innerHTML = `
        <div class="autocomplete-item-name">${suggestion.name}</div>
        <div class="autocomplete-item-details">Department</div>
      `;
      item.addEventListener("click", () => {
        searchInput.value = suggestion.name;
        searchQuery = suggestion.name;
        autocompleteDropdown.classList.remove("show");
        applyFilters();
      });
    }

    autocompleteDropdown.appendChild(item);
  });

  autocompleteDropdown.classList.add("show");
}

function initializeSearch() {
  if (!searchInput) return;

  // Some browsers/password managers autofill email/user fields into the first input.
  // Keep search input clean by aggressively clearing likely autofill values.
  const clearIfLooksLikeAutofill = () => {
    const value = (searchInput.value || "").trim();
    const userName = (localStorage.getItem("userName") || "").trim();
    const looksLikeEmail = value.includes("@");
    const matchesUserName = value && userName && value.toLowerCase() === userName.toLowerCase();

    if (looksLikeEmail || matchesUserName) {
      searchInput.value = "";
      searchQuery = "";
      if (autocompleteDropdown) {
        autocompleteDropdown.classList.remove("show");
      }
      applyFilters();
      return true;
    }

    return false;
  };

  clearIfLooksLikeAutofill();
  setTimeout(clearIfLooksLikeAutofill, 50);
  setTimeout(clearIfLooksLikeAutofill, 300);
  setTimeout(clearIfLooksLikeAutofill, 900);

  // Observe value attribute changes (autofill can happen asynchronously).
  const autofillObserver = new MutationObserver(() => {
    clearIfLooksLikeAutofill();
  });
  autofillObserver.observe(searchInput, {
    attributes: true,
    attributeFilter: ["value"]
  });

  // Additional safety poll for the first few seconds after load.
  const pollId = setInterval(() => {
    clearIfLooksLikeAutofill();
  }, 400);
  setTimeout(() => {
    clearInterval(pollId);
    autofillObserver.disconnect();
  }, 5000);

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value;
    searchQuery = query;

    if (query.trim().length === 0) {
      autocompleteDropdown.classList.remove("show");
      applyFilters();
    } else {
      const suggestions = getAutocompleSuggestions(query);
      renderAutocompleteSuggestions(suggestions);
      applyFilters();
    }
  });

  // Close autocomplete when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      autocompleteDropdown.classList.remove("show");
    }
  });

  // Re-open autocomplete on focus if there's a query
  searchInput.addEventListener("focus", () => {
    clearIfLooksLikeAutofill();
    if (searchInput.value.trim()) {
      const suggestions = getAutocompleSuggestions(searchInput.value);
      renderAutocompleteSuggestions(suggestions);
    }
  });
}

async function syncAddedProductsFromBackend() {
  const userId = getCurrentUserId();

  if (!userId) {
    updateCartBadge(0);
    return;
  }

  try {
    // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
    const response = await window.ANSHOP_API.fetchWithAuth(`${API.api("cart")}/${userId}`);
    if (!response.ok) {
      return;
    }

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

    allProducts.forEach(product => {
      const id = product._id.toString();
      if (backendIds.has(id)) {
        localStorage.setItem(id, "added");
      } else {
        localStorage.removeItem(id);
      }
    });

    const count = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    updateCartBadge(count);
  } catch (error) {
    // Ignore sync issues to keep page usable even if backend is temporarily unavailable.
  }
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
    // Keep shop functional if wishlist API fails.
  }
}

function getTypeOptionsByDepartment() {
  const sourceProducts = activeDepartment === "All"
    ? allProducts
    : allProducts.filter(product => product.department === activeDepartment);

  const uniqueTypes = [...new Set(sourceProducts.map(product => product.productType))].filter(Boolean);
  uniqueTypes.sort();
  return ["All", ...uniqueTypes];
}

function renderTypeFilters() {
  const options = getTypeOptionsByDepartment();

  if (!options.includes(activeType)) {
    activeType = "All";
  }

  typeFiltersRow.innerHTML = '<span class="filter-label">Product Type:</span>';

  options.forEach(type => {
    const button = document.createElement("button");
    button.className = `filter-btn ${activeType === type ? "active" : ""}`;
    button.dataset.type = type;
    button.textContent = type;

    button.addEventListener("click", () => {
      activeType = type;
      renderTypeFilters();
      applyFilters();
    });

    typeFiltersRow.appendChild(button);
  });
}

// Requirement function: display products in cards.
function displayProducts(products) {
  productsGrid.innerHTML = "";

  if (!products || products.length === 0) {
    productsGrid.innerHTML = '<div class="empty-state">No products found</div>';
    return;
  }

  products.forEach(product => {
    const productId = product._id;
    const productName = product.name || "Product";
    const productCategory = product.productType || product.category || "Uncategorized";
    const productPrice = Number(product.price) || 0;
    const productImage = getImageSrc(product.image);
    const rating = getRatingText(product);
    const { mrp, discount } = getMrpAndDiscount(productPrice);

    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = productId;

    card.innerHTML = `
      <div class="product-image-wrap">
        <img class="product-image" src="${productImage}" alt="${productName}" loading="lazy" decoding="async">
        <button class="wishlist-btn ${wishlistIds.has(productId.toString()) ? "active" : ""}" data-id="${productId}" type="button" aria-label="Toggle wishlist">${getHeartIcon(wishlistIds.has(productId.toString()))}</button>
      </div>
      <h3 class="product-name">${productName}</h3>
      <p class="product-category">Department: ${product.department} | Type: ${productCategory}</p>
      <div class="price-row">
        <p class="product-price">₹${productPrice}</p>
        <p class="product-mrp">₹${mrp}</p>
        <p class="product-discount">${discount}% off</p>
      </div>
      <div class="rating-delivery-row">
        <span class="rating-badge">${rating} ★</span>
        <span class="delivery-note">Free delivery</span>
      </div>
      <button class="add-cart-btn" data-id="${productId}">Add to Cart</button>
    `;

    productsGrid.appendChild(card);
  });

  productsGrid.querySelectorAll(".product-card").forEach(card => {
    card.style.cursor = "pointer";
    card.addEventListener("click", event => {
      if (event.target.closest(".add-cart-btn") || event.target.closest(".wishlist-btn")) {
        return;
      }
      openProductDetails(card.dataset.id);
    });
  });

  const addButtons = document.querySelectorAll(".add-cart-btn");
  addButtons.forEach(button => {
    const productId = button.dataset.id;

    if (isProductAdded(productId)) {
      setButtonToGoToCart(button);
    } else {
      setButtonToAdd(button);
    }

    button.addEventListener("click", async () => {
      const clickedProductId = button.dataset.id;

      if (button.textContent.trim() === "Go to Cart") {
        window.location.href = "cart.html";
        return;
      }

      await addToCart(clickedProductId, button);
    });
  });

  document.querySelectorAll(".wishlist-btn").forEach(button => {
    const productId = button.dataset.id;

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

function applyFilters() {
  let filtered = allProducts;

  if (activeDepartment !== "All") {
    filtered = filtered.filter(product => product.department === activeDepartment);
  }

  if (activeType !== "All") {
    filtered = filtered.filter(product => product.productType === activeType);
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const queryLower = searchQuery.toLowerCase();
    filtered = filtered.filter(product => {
      const name = (product.name || "").toLowerCase();
      const type = (product.productType || "").toLowerCase();
      const department = (product.department || "").toLowerCase();

      return name.includes(queryLower) || type.includes(queryLower) || department.includes(queryLower);
    });
  }

  statusMessage.textContent = `${filtered.length} product(s) found`;
  displayProducts(filtered);
}

async function fetchProducts() {
  try {
    statusMessage.textContent = "Loading products...";

    const response = await fetch(PRODUCTS_API);

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await response.json();

    // Handles both array response and { products: [] } response shapes.
    const products = Array.isArray(data) ? data : (data.products || []);
    allProducts = enrichProducts(products);

    renderTypeFilters();
    initializeSearch();
    applyFilters();

    void Promise.allSettled([syncWishlistFromBackend(), syncAddedProductsFromBackend()]).then(() => {
      applyFilters();
    });
  } catch (error) {
    statusMessage.textContent = "Could not load products. Please check backend server.";
    displayProducts([]);
  }
}

async function addToCart(productId, button) {
  const userId = getCurrentUserId();
  if (!userId) {
    showToast("Please login first", "info");
    window.location.href = "login.html";
    return;
  }

  try {
    button.disabled = true;
    button.textContent = "Adding...";

    // ===== STEP 5: Use fetchWithAuth for authenticated requests =====
    const response = await window.ANSHOP_API.fetchWithAuth(ADD_TO_CART_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        productId: productId
      })
    });

    if (!response.ok) {
      throw new Error("Failed to add product to cart");
    }

    localStorage.setItem(productId, "added");
    setButtonToGoToCart(button);
    updateCartBadge(Number(cartCountBadge?.textContent || 0) + 1);
    showToast("Product added to cart", "success");
    button.disabled = false;
  } catch (error) {
    setButtonToAdd(button);
    button.disabled = false;
    showToast("Unable to add this product right now.", "error");
  }
}

document.querySelectorAll(".filter-btn[data-department]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn[data-department]").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    activeDepartment = button.dataset.department;
    activeType = "All";
    renderTypeFilters();
    applyFilters();
  });
});

fetchProducts();
