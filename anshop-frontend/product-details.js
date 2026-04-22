(function () {
  const API = window.ANSHOP_API || {
    ORIGIN: window.location.origin,
    BASE: `${window.location.origin}/api/v1`
  };
  const API_BASE = API.BASE;
  const PRODUCTS_API = `${API_BASE}/products`;
  const ADD_TO_CART_API = `${API_BASE}/cart/add`;

  function isProductAdded(productId) {
    if (!localStorage.getItem("userId")) {
      return false;
    }
    return localStorage.getItem(productId) === "added";
  }

  function setButtonToGoToCart(button) {
    button.textContent = "Go to Cart";
    button.classList.add("details-added-state");
    button.classList.remove("details-inline-qty-btn");
  }

  function setButtonToAdd(button) {
    button.textContent = "Add to Cart";
    button.classList.remove("details-inline-qty-btn", "details-added-state");
  }

  function getImageSrc(imagePath) {
    if (API.resolveImage) {
      return API.resolveImage(imagePath, "https://via.placeholder.com/600?text=No+Image");
    }

    if (!imagePath) {
      return "https://via.placeholder.com/600?text=No+Image";
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

  function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function getPriceMeta(price) {
    const safePrice = Number(price) || 0;
    const mrp = Math.round(safePrice * 1.2);
    const discount = Math.max(Math.round(((mrp - safePrice) / mrp) * 100), 0);
    return { safePrice, mrp, discount };
  }

  function getMaterialDetails(product) {
    const text = `${product.name || ""} ${product.category || ""} ${product.description || ""}`.toLowerCase();

    if (text.includes("cotton")) {
      return ["Material: 100% Cotton", "Fit: Regular Fit", "Care: Machine wash"];
    }

    if (text.includes("denim") || text.includes("jean")) {
      return ["Material: Denim Blend", "Fit: Comfort Fit", "Care: Gentle wash"];
    }

    if (text.includes("jacket") || text.includes("hoodie")) {
      return ["Material: Fleece + Cotton Blend", "Fit: Relaxed Fit", "Care: Mild wash"];
    }

    return ["Material: Premium Fabric Blend", "Fit: Everyday Comfort Fit", "Care: Machine wash cold"];
  }

  function getRating(product) {
    const price = Number(product.price) || 100;
    return (4 + ((price % 9) / 10)).toFixed(1);
  }

  function renderGallery(productImage) {
    const images = [productImage, productImage, productImage];

    return `
      <div>
        <div class="gallery-main">
          <img id="mainGalleryImage" src="${images[0]}" alt="Product image">
        </div>
        <div class="gallery-thumbs">
          ${images.map((img, index) => `
            <button type="button" class="gallery-thumb ${index === 0 ? "active" : ""}" data-img="${img}">
              <img src="${img}" alt="Product view ${index + 1}">
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderDetails(product) {
    const root = document.getElementById("productDetailsRoot");
    if (!root) {
      return;
    }

    const productName = product.name || "Product";
    const productImage = getImageSrc(product.image);
    const category = product.category || "Fashion";
    const description = product.description || "Premium quality product with comfort and style for daily wear.";
    const rating = getRating(product);
    const materialItems = getMaterialDetails(product);
    const { safePrice, mrp, discount } = getPriceMeta(product.price);

    const crumbProductName = document.getElementById("crumbProductName");
    if (crumbProductName) {
      crumbProductName.textContent = productName;
    }

    root.innerHTML = `
      ${renderGallery(productImage)}
      <div>
        <p class="details-brand">AnShop ${category}</p>
        <h1 class="details-title">${productName}</h1>
        <div class="details-rating-row">
          <span class="rating-pill">${rating} ★</span>
          <span class="rating-note">1,274 ratings • 233 reviews</span>
        </div>
        <div class="details-price-row">
          <p class="details-price">₹${safePrice.toLocaleString("en-IN")}</p>
          <p class="details-mrp">₹${mrp.toLocaleString("en-IN")}</p>
          <p class="details-off">${discount}% off</p>
        </div>
        <p class="details-copy">${description}</p>

        <div class="size-section">
          <h4>Select Size</h4>
          <div class="size-options" id="sizeOptions">
            <button class="size-btn active" type="button">S</button>
            <button class="size-btn" type="button">M</button>
            <button class="size-btn" type="button">L</button>
            <button class="size-btn" type="button">XL</button>
          </div>
        </div>

        <div class="material-section">
          <h4>Fabric and Material</h4>
          <ul class="material-list">
            ${materialItems.map(item => `<li>${item}</li>`).join("")}
          </ul>
        </div>

        <div class="action-row">
          <button class="action-btn primary" id="addToCartBtn" data-id="${product._id}" type="button">Add to Cart</button>
          <button class="action-btn secondary" id="buyNowBtn" type="button">Buy Now</button>
        </div>
      </div>
    `;

    root.querySelectorAll(".gallery-thumb").forEach(button => {
      button.addEventListener("click", () => {
        const mainImage = document.getElementById("mainGalleryImage");
        if (mainImage) {
          mainImage.src = button.dataset.img;
        }

        root.querySelectorAll(".gallery-thumb").forEach(node => node.classList.remove("active"));
        button.classList.add("active");
      });
    });

    root.querySelectorAll(".size-btn").forEach(button => {
      button.setAttribute("aria-pressed", button.classList.contains("active") ? "true" : "false");
      button.addEventListener("click", () => {
        root.querySelectorAll(".size-btn").forEach(node => {
          node.classList.remove("active");
          node.setAttribute("aria-pressed", "false");
        });
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
      });
    });

    function getSelectedSize() {
      const activeSizeButton = root.querySelector(".size-btn.active");
      return activeSizeButton ? activeSizeButton.textContent.trim().toUpperCase() : "M";
    }


    async function addSelectedVariantToCart() {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        showToast("Please login first", "info");
        window.location.href = "login.html";
        return false;
      }

      const apiFetch = (window.ANSHOP_API && window.ANSHOP_API.fetchWithAuth)
        ? window.ANSHOP_API.fetchWithAuth
        : fetch;

      const response = await apiFetch(ADD_TO_CART_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          productId: product._id,
          size: getSelectedSize()
        })
      });

      if (!response.ok) {
        throw new Error("Add to cart failed");
      }

      localStorage.setItem(product._id, "added");
      const badge = document.getElementById("cartCountBadge");
      if (badge) {
        badge.textContent = String(Number(badge.textContent || 0) + 1);
      }

      return true;
    }

    const addToCartBtn = document.getElementById("addToCartBtn");
    if (addToCartBtn) {
      if (isProductAdded(product._id.toString())) {
        setButtonToGoToCart(addToCartBtn);
      } else {
        setButtonToAdd(addToCartBtn);
      }

      addToCartBtn.addEventListener("click", async () => {
        if (addToCartBtn.textContent.trim() === "Go to Cart") {
          window.location.href = "cart.html";
          return;
        }

        addToCartBtn.disabled = true;
        addToCartBtn.textContent = "Adding...";

        try {
          await addSelectedVariantToCart();
          showToast("Added to cart", "success");
          setButtonToGoToCart(addToCartBtn);
        } catch (error) {
          setButtonToAdd(addToCartBtn);
          showToast("Unable to add to cart", "error");
        }

        addToCartBtn.disabled = false;
      });
    }

    const buyNowBtn = document.getElementById("buyNowBtn");
    if (buyNowBtn) {
      buyNowBtn.addEventListener("click", async () => {
        buyNowBtn.disabled = true;
        buyNowBtn.textContent = "Preparing...";

        try {
          const added = await addSelectedVariantToCart();
          if (added) {
            showToast("Added to cart. Redirecting to checkout...", "success");
            setTimeout(() => {
              window.location.href = "checkout.html";
            }, 500);
          }
        } catch (error) {
          showToast("Unable to continue to checkout", "error");
        }

        buyNowBtn.disabled = false;
        buyNowBtn.textContent = "Buy Now";
      });
    }
  }

  function renderReviews(product) {
    const reviewsGrid = document.getElementById("reviewsGrid");
    if (!reviewsGrid) {
      return;
    }

    const baseText = product.name || "this product";
    const reviews = [
      {
        user: "Riya S.",
        stars: "★★★★★",
        text: `Loved the quality of ${baseText}. Exact fit and premium feel.`
      },
      {
        user: "Arjun P.",
        stars: "★★★★☆",
        text: "Fabric is comfortable for daily use and delivery was quick."
      },
      {
        user: "Neha K.",
        stars: "★★★★★",
        text: "Looks exactly like photos. Good value for money."
      }
    ];

    reviewsGrid.innerHTML = reviews.map(review => `
      <article class="review-card">
        <p class="review-user">${review.user}</p>
        <p class="review-stars">${review.stars}</p>
        <p class="review-text">${review.text}</p>
      </article>
    `).join("");
  }

  function renderRelatedProducts(currentProduct, allProducts) {
    const relatedGrid = document.getElementById("relatedGrid");
    if (!relatedGrid) {
      return;
    }

    const related = allProducts
      .filter(item => item._id !== currentProduct._id)
      .filter(item => item.category === currentProduct.category || item.department === currentProduct.department)
      .slice(0, 4);

    if (!related.length) {
      relatedGrid.innerHTML = '<p class="details-error">No related products found right now.</p>';
      return;
    }

    relatedGrid.innerHTML = related.map(item => {
      const image = getImageSrc(item.image);
      const name = item.name || "Product";
      const price = Number(item.price) || 0;

      return `
        <article class="related-card" data-id="${item._id}">
          <div class="related-img-wrap">
            <img src="${image}" alt="${name}">
          </div>
          <p class="related-name">${name}</p>
          <p class="related-price">₹${price.toLocaleString("en-IN")}</p>
        </article>
      `;
    }).join("");

    relatedGrid.querySelectorAll(".related-card").forEach(card => {
      card.addEventListener("click", () => {
        window.location.href = `product-details.html?id=${card.dataset.id}`;
      });
    });
  }

  async function loadProductPage() {
    const yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    const productId = getProductIdFromUrl();
    const root = document.getElementById("productDetailsRoot");

    if (!productId) {
      if (root) {
        root.innerHTML = '<div class="details-error">Invalid product link. Please open from shop page.</div>';
      }
      return;
    }

    try {
      const [detailsResponse, allProductsResponse] = await Promise.all([
        fetch(`${PRODUCTS_API}/${productId}`),
        fetch(PRODUCTS_API)
      ]);

      if (!detailsResponse.ok) {
        throw new Error("Failed to load product details");
      }

      const detailsData = await detailsResponse.json();
      const allProductsData = allProductsResponse.ok ? await allProductsResponse.json() : { products: [] };

      const product = detailsData.product;
      const allProducts = Array.isArray(allProductsData.products) ? allProductsData.products : [];

      renderDetails(product);
      renderReviews(product);
      renderRelatedProducts(product, allProducts);
    } catch (error) {
      if (root) {
        root.innerHTML = '<div class="details-error">Unable to load product details right now.</div>';
      }
    }
  }

  document.addEventListener("DOMContentLoaded", loadProductPage);
})();
