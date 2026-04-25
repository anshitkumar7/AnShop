(function () {
  const STORAGE_KEY = "anshopTheme";

  function getSavedTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
    document.body.classList.toggle("dark-mode", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);

    const toggle = document.getElementById("themeToggleBtn");
    if (toggle) {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      toggle.textContent = isMobile
        ? (theme === "dark" ? "\u2600" : "\u263E")
        : (theme === "dark" ? "Light Mode \u2600" : "Dark Mode \u263E");
      toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      toggle.setAttribute("title", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  function toggleTheme() {
    const isDark = document.body.classList.contains("dark-mode");
    setTheme(isDark ? "light" : "dark");
  }

  function applyHomeHeroImageWithFallback() {
    const isMobile = window.matchMedia("(max-width: 799px)").matches;
    const candidates = isMobile
      ? ["image/hero4.2.png", "image/hero4.png"]
      : ["image/hero4.2.png", "image/hero4.png"];
    let index = 0;

    function tryNextImage() {
      if (index >= candidates.length) {
        return;
      }

      const src = candidates[index];
      index += 1;

      const image = new Image();
      image.onload = function () {
        document.documentElement.style.setProperty("--hero-dark-image", `url("${src}")`);
      };
      image.onerror = tryNextImage;
      image.src = src;
    }

    tryNextImage();
  }

  function injectDarkModeStyles() {
    if (document.getElementById("darkModeGlobalStyles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "darkModeGlobalStyles";
    style.textContent = `
      .nav-theme-item {
        padding-left: 6px !important;
        padding-right: 6px !important;
      }

      #themeToggleBtn.nav-theme-toggle {
        border: 1px solid color-mix(in srgb, var(--accent) 34%, transparent);
        background: color-mix(in srgb, var(--surface-soft) 86%, #ffffff);
        color: color-mix(in srgb, var(--accent-dark) 84%, #000000);
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 800;
        line-height: 1;
        letter-spacing: 0.01em;
        cursor: pointer;
        box-shadow: 0 8px 16px color-mix(in srgb, var(--accent-dark) 16%, transparent);
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }

      #themeToggleBtn.nav-theme-toggle:hover {
        transform: translateY(-1px);
        background: color-mix(in srgb, var(--surface-soft) 94%, #ffffff);
        box-shadow: 0 10px 20px color-mix(in srgb, var(--accent-dark) 22%, transparent);
      }

      #themeToggleBtn.floating-theme-toggle {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 99999;
        border: 1px solid color-mix(in srgb, var(--accent) 34%, transparent);
        background: color-mix(in srgb, var(--surface-soft) 86%, #ffffff);
        color: color-mix(in srgb, var(--accent-dark) 84%, #000000);
        border-radius: 999px;
        padding: 9px 14px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      }

      html.dark-mode,
      body.dark-mode {
        --dm-bg: #0a0a0a;
        --dm-surface: #121212;
        --dm-surface-2: #161616;
        --dm-border: rgba(255, 80, 120, 0.2);
        --dm-border-soft: rgba(255, 80, 120, 0.14);
        --dm-text-strong: #ffffff;
        --dm-text-main: #f2f2f2;
        --dm-text-muted: #aaaaaa;
        --dm-text-soft: #919191;
        --dm-accent-deep: #5a0f1c;
        --dm-accent-crimson: #8a1c2b;
        --dm-accent-pink: #d65a7a;
        --dm-accent-soft-pink: #f08aa3;
        --dm-link: #f08aa3;
        --dm-link-hover: #ffd2df;
        --dm-discount: #7dffb0;
        --dm-radius-sm: 10px;
        --dm-radius-md: 14px;
        --dm-radius-lg: 18px;
        --dm-shadow-soft: 0 10px 24px rgba(0, 0, 0, 0.34);
        --dm-shadow-pink: 0 0 20px rgba(214, 90, 122, 0.18);
        color-scheme: dark;
        background: var(--dm-bg) !important;
        color: var(--dm-text-main) !important;
        background-image: radial-gradient(circle at 20% 30%, rgba(90, 15, 28, 0.55) 0%, rgba(10, 10, 10, 0.08) 56%), radial-gradient(circle at 86% 78%, rgba(214, 90, 122, 0.34) 0%, rgba(10, 10, 10, 0.04) 42%), linear-gradient(135deg, #0a0a0a 0%, #130d10 44%, #1b1115 72%, #0a0a0a 100%) !important;
      }

      body.dark-mode::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: -1;
        background: radial-gradient(circle at 10% 14%, rgba(138, 28, 43, 0.2) 0%, transparent 34%), radial-gradient(circle at 90% 86%, rgba(240, 138, 163, 0.16) 0%, transparent 35%);
        filter: blur(24px);
      }

      body.dark-mode::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: -1;
        background: radial-gradient(circle at 76% 12%, rgba(90, 15, 28, 0.12) 0%, transparent 30%);
        filter: blur(20px);
      }

      body.dark-mode .section-m1 {
        margin: 22px 0 !important;
      }

      body.dark-mode .section-p1 {
        padding-top: 30px !important;
        padding-bottom: 30px !important;
      }

      body.dark-mode,
      body.dark-mode p,
      body.dark-mode h1,
      body.dark-mode h2,
      body.dark-mode h3,
      body.dark-mode h4,
      body.dark-mode h5,
      body.dark-mode h6,
      body.dark-mode span,
      body.dark-mode li,
      body.dark-mode label,
      body.dark-mode small,
      body.dark-mode strong,
      body.dark-mode td,
      body.dark-mode th,
      body.dark-mode blockquote,
      body.dark-mode cite {
        color: var(--dm-text-main) !important;
      }

      body.dark-mode a,
      body.dark-mode button,
      body.dark-mode .product-card,
      body.dark-mode .pro,
      body.dark-mode .fe-box,
      body.dark-mode .order-card,
      body.dark-mode .shop-more-strip {
        transition: all 0.28s ease;
      }

      body.dark-mode h1,
      body.dark-mode h2,
      body.dark-mode h3,
      body.dark-mode h4,
      body.dark-mode h5,
      body.dark-mode h6,
      body.dark-mode .summary-title,
      body.dark-mode .form-section-title,
      body.dark-mode .payment-option-name,
      body.dark-mode .summary-item-name,
      body.dark-mode .order-number,
      body.dark-mode .order-total,
      body.dark-mode .confirmation-title,
      body.dark-mode .detail-row .value,
      body.dark-mode .table-top h3,
      body.dark-mode .admin-hero h1,
      body.dark-mode .stat-card h2 {
        color: var(--dm-text-strong) !important;
        letter-spacing: -0.2px;
      }

      body.dark-mode .filter-label,
      body.dark-mode .delivery-note,
      body.dark-mode .product-category,
      body.dark-mode .secure-note,
      body.dark-mode .status-text,
      body.dark-mode .auth-status,
      body.dark-mode .auth-link,
      body.dark-mode .order-address,
      body.dark-mode .summary-row,
      body.dark-mode .summary-item-qty,
      body.dark-mode .payment-option-desc,
      body.dark-mode .payment-note,
      body.dark-mode .confirmation-subtitle,
      body.dark-mode .detail-row .label,
      body.dark-mode .table-scroll small,
      body.dark-mode .shop-more-strip p,
      body.dark-mode .cart-item-category,
      body.dark-mode .home-mrp,
      body.dark-mode .home-trust-note,
      body.dark-mode .stat-card p,
      body.dark-mode .admin-modal-body p,
      body.dark-mode .close-btn,
      body.dark-mode .orders-hero p {
        color: var(--dm-text-muted) !important;
      }

      body.dark-mode .qty-count,
      body.dark-mode .home-discount,
      body.dark-mode .product-discount,
      body.dark-mode .summary-item-price,
      body.dark-mode .cart-item-price,
      body.dark-mode .price,
      body.dark-mode .pro-price,
      body.dark-mode .total-price {
        color: var(--dm-accent-pink) !important;
      }

      body.dark-mode .home-discount,
      body.dark-mode .product-discount {
        color: var(--dm-discount) !important;
        background: rgba(125, 255, 176, 0.12) !important;
        border: 1px solid rgba(125, 255, 176, 0.24) !important;
        padding: 2px 8px;
        border-radius: 999px;
        font-weight: 700;
      }

      body.dark-mode .status-message,
      body.dark-mode .product-category,
      body.dark-mode .delivery-note,
      body.dark-mode .autocomplete-item-details {
        color: var(--dm-text-muted) !important;
      }

      body.dark-mode .delivery-card small,
      body.dark-mode td small,
      body.dark-mode .table-scroll small {
        color: var(--dm-text-soft) !important;
      }

      body.dark-mode .delivery-card strong,
      body.dark-mode td strong,
      body.dark-mode th {
        color: var(--dm-text-strong) !important;
      }

      body.dark-mode .auth-page,
      body.dark-mode .orders-container,
      body.dark-mode .checkout-container,
      body.dark-mode #cart.cart-layout,
      body.dark-mode .admin-wrapper,
      body.dark-mode #product1,
      body.dark-mode #product2,
      body.dark-mode #feature,
      body.dark-mode .shop-container {
        background-color: var(--dm-surface) !important;
        border-color: var(--dm-border-soft) !important;
      }

      body.dark-mode #banner,
      body.dark-mode #sm-banner .banner-box,
      body.dark-mode #newsletter {
        border-color: var(--dm-border-soft) !important;
      }

      body.dark-mode #header,
      body.dark-mode .navbar,
      body.dark-mode .table-block,
      body.dark-mode .form-block,
      body.dark-mode .stat-card,
      body.dark-mode .cart-summary,
      body.dark-mode .cart-item-card,
      body.dark-mode .orders-filter-bar,
      body.dark-mode .order-card,
      body.dark-mode .checkout-form-section,
      body.dark-mode .order-summary,
      body.dark-mode .auth-card,
      body.dark-mode .about,
      body.dark-mode .contact-info,
      body.dark-mode .contact-form,
      body.dark-mode .map,
      body.dark-mode .modal-content {
        background: linear-gradient(145deg, rgba(22, 22, 22, 0.98) 0%, rgba(33, 20, 24, 0.98) 100%) !important;
        border-color: var(--dm-border) !important;
        color: var(--dm-text-main) !important;
        box-shadow: 0 16px 34px rgba(0, 0, 0, 0.46), 0 0 34px rgba(138, 28, 43, 0.14) !important;
        border-radius: var(--dm-radius-md) !important;
      }

      body.dark-mode #header {
        background: rgba(10, 10, 10, 0.8) !important;
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 80, 120, 0.28) !important;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.38), 0 1px 0 rgba(214, 90, 122, 0.28) !important;
      }

      body.dark-mode .pro,
      body.dark-mode .fe-box,
      body.dark-mode .product-card,
      body.dark-mode .shop-box,
      body.dark-mode .cart-item-card,
      body.dark-mode .stat-card,
      body.dark-mode .order-card,
      body.dark-mode .orders-empty,
      body.dark-mode .cart-empty,
      body.dark-mode .shop-more-strip {
        background: var(--dm-surface-2) !important;
        border-color: var(--dm-border) !important;
        border-radius: var(--dm-radius-md) !important;
      }

      body.dark-mode .product-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        box-shadow: var(--dm-shadow-soft), 0 0 0 rgba(214, 90, 122, 0) !important;
      }

      body.dark-mode .product-card:hover {
        transform: translateY(-4px);
        border-color: rgba(255, 128, 160, 0.34) !important;
        box-shadow: 0 18px 34px rgba(0, 0, 0, 0.42), var(--dm-shadow-pink) !important;
      }

      body.dark-mode .empty-state,
      body.dark-mode .confirmation-card,
      body.dark-mode .order-details,
      body.dark-mode .order-summary-sidebar {
        background: var(--dm-surface-2) !important;
        border-color: var(--dm-border) !important;
        color: var(--dm-text-main) !important;
      }

      body.dark-mode .product-name,
      body.dark-mode .autocomplete-item,
      body.dark-mode .search-icon {
        color: var(--dm-text-strong) !important;
      }

      body.dark-mode .product-price,
      body.dark-mode #product1 .pro .des h4,
      body.dark-mode #product2 .pro .des h4 {
        color: var(--dm-accent-soft-pink) !important;
      }

      body.dark-mode .product-image-wrap,
      body.dark-mode #product1 .pro img,
      body.dark-mode #product2 .pro img,
      body.dark-mode .product-image,
      body.dark-mode .cart-item-image,
      body.dark-mode td img {
        background: #000000 !important;
      }

      body.dark-mode .product-image-wrap {
        border-color: #2f434b !important;
      }

      body.dark-mode .pro img,
      body.dark-mode .product-image,
      body.dark-mode .cart-item-image,
      body.dark-mode #product1 img,
      body.dark-mode #product2 img,
      body.dark-mode .cart-item-image img {
        background: #1a1a1a !important;
        padding: 8px !important;
        border-radius: 4px !important;
      }

      body.dark-mode table,
      body.dark-mode thead,
      body.dark-mode tbody,
      body.dark-mode tr,
      body.dark-mode th,
      body.dark-mode td {
        background: transparent !important;
        border-color: var(--dm-border-soft) !important;
      }

      body.dark-mode input,
      body.dark-mode textarea,
      body.dark-mode select,
      body.dark-mode button,
      body.dark-mode .order-btn,
      body.dark-mode .orders-filter-btn,
      body.dark-mode .shop-more-btn,
      body.dark-mode .payment-option {
        background: #1b1b1b !important;
        color: var(--dm-text-main) !important;
        border-color: var(--dm-border) !important;
      }

      body.dark-mode .home-wishlist-btn,
      body.dark-mode .wishlist-btn {
        background: rgba(22, 22, 22, 0.65) !important;
        color: #ffffff !important;
        border-color: rgba(255, 255, 255, 0.7) !important;
      }

      body.dark-mode .home-wishlist-btn.active,
      body.dark-mode .wishlist-btn.active {
        background: rgba(255, 244, 248, 0.96) !important;
        color: #ff2f5d !important;
        border-color: rgba(255, 82, 120, 0.72) !important;
      }

      body.dark-mode .search-input-wrapper,
      body.dark-mode .autocomplete-dropdown {
        background: var(--dm-surface-2) !important;
        border-color: var(--dm-border) !important;
        box-shadow: 0 16px 30px rgba(0, 0, 0, 0.42), 0 0 22px rgba(214, 90, 122, 0.1) !important;
      }

      body.dark-mode .search-input,
      body.dark-mode .autocomplete-item {
        background: transparent !important;
        color: var(--dm-text-main) !important;
      }

      body.dark-mode .autocomplete-item:hover,
      body.dark-mode .autocomplete-item.highlighted {
        background: #28161c !important;
      }

      body.dark-mode input::placeholder,
      body.dark-mode textarea::placeholder {
        color: #98afb6 !important;
      }

      body.dark-mode input:focus,
      body.dark-mode textarea:focus,
      body.dark-mode select:focus {
        outline: 2px solid var(--dm-accent-pink) !important;
        outline-offset: 2px;
      }

      body.dark-mode .form-label,
      body.dark-mode label,
      body.dark-mode .input-label {
        color: var(--dm-text-main) !important;
      }

      body.dark-mode .checkout-btn,
      body.dark-mode .admin-btn-primary,
      body.dark-mode .save-btn,
      body.dark-mode .edit-btn,
      body.dark-mode .empty-shop-btn,
      body.dark-mode .add-cart-btn,
      body.dark-mode .go-cart-btn {
        background: linear-gradient(135deg, var(--dm-accent-crimson) 0%, var(--dm-accent-pink) 100%) !important;
        color: #ffffff !important;
        border-color: var(--dm-accent-crimson) !important;
        transition: all 0.3s ease;
        border-radius: var(--dm-radius-sm) !important;
      }

      body.dark-mode .checkout-btn:hover,
      body.dark-mode .admin-btn-primary:hover,
      body.dark-mode .save-btn:hover,
      body.dark-mode .edit-btn:hover,
      body.dark-mode .empty-shop-btn:hover,
      body.dark-mode .add-cart-btn:hover,
      body.dark-mode .go-cart-btn:hover,
      body.dark-mode .place-order-btn:hover,
      body.dark-mode .home-add-cart-btn:hover {
        background: linear-gradient(135deg, #a32537 0%, var(--dm-accent-soft-pink) 100%) !important;
        box-shadow: 0 10px 22px rgba(214, 90, 122, 0.26) !important;
      }

      body.dark-mode .add-cart-btn,
      body.dark-mode .home-add-cart-btn {
        background: linear-gradient(135deg, #4b2b58 0%, #7b4f8f 100%) !important;
        border-color: #6a417d !important;
      }

      body.dark-mode .add-cart-btn:hover,
      body.dark-mode .home-add-cart-btn:hover {
        background: linear-gradient(135deg, #5a3368 0%, #9460aa 100%) !important;
        box-shadow: 0 10px 22px rgba(90, 51, 104, 0.3) !important;
      }

      body.dark-mode .go-cart-btn,
      body.dark-mode .home-go-cart-btn {
        background: linear-gradient(135deg, var(--dm-accent-crimson) 0%, var(--dm-accent-pink) 100%) !important;
        border-color: var(--dm-accent-crimson) !important;
      }

      body.dark-mode .go-cart-btn:hover,
      body.dark-mode .home-go-cart-btn:hover {
        background: linear-gradient(135deg, #a32537 0%, var(--dm-accent-soft-pink) 100%) !important;
        box-shadow: 0 10px 22px rgba(214, 90, 122, 0.26) !important;
      }

      /* Keep product details page CTAs vivid in dark mode. */
      body.dark-mode .action-btn.primary {
        background: linear-gradient(135deg, #4b2b58 0%, #7b4f8f 100%) !important;
        color: #ffffff !important;
        border-color: #6a417d !important;
      }

      body.dark-mode .action-btn.primary:hover {
        background: linear-gradient(135deg, #5a3368 0%, #9460aa 100%) !important;
        box-shadow: 0 10px 22px rgba(90, 51, 104, 0.3) !important;
      }

      body.dark-mode .action-btn.secondary {
        background: linear-gradient(135deg, var(--dm-accent-crimson) 0%, var(--dm-accent-pink) 100%) !important;
        color: #ffffff !important;
        border-color: var(--dm-accent-crimson) !important;
      }

      body.dark-mode .action-btn.secondary:hover {
        background: linear-gradient(135deg, #a32537 0%, var(--dm-accent-soft-pink) 100%) !important;
        box-shadow: 0 10px 22px rgba(214, 90, 122, 0.26) !important;
      }

      body.dark-mode .remove-btn,
      body.dark-mode .delete-btn {
        background: #c24b57 !important;
        color: #ffffff !important;
        border-color: #c24b57 !important;
      }

      body.dark-mode #navbar li a,
      body.dark-mode .navbar a,
      body.dark-mode a {
        color: var(--dm-link) !important;
      }

      body.dark-mode #navbar .mobile-cart-item .cart-link-text {
        color: inherit !important;
      }

      body.dark-mode .more-menu-toggle {
        background: #1b1b1b !important;
        color: var(--dm-text-main) !important;
        border-color: var(--dm-border) !important;
      }

      body.dark-mode .more-menu-toggle:hover {
        background: #28161c !important;
        border-color: var(--dm-accent-crimson) !important;
      }

      body.dark-mode .more-menu-dropdown {
        background: var(--dm-surface-2) !important;
        border-color: var(--dm-border) !important;
        box-shadow: 0 16px 30px rgba(0, 0, 0, 0.5), 0 0 24px rgba(214, 90, 122, 0.13) !important;
      }

      body.dark-mode .more-menu-dropdown a {
        color: var(--dm-text-main) !important;
      }

      body.dark-mode .more-menu-dropdown a:hover {
        background: #28161c !important;
        color: #ffd8e3 !important;
      }

      body.dark-mode .shop-hero {
        background: linear-gradient(135deg, #140d10 0%, #1b1115 56%, #220f15 100%) !important;
        border-bottom-color: var(--dm-border-soft) !important;
      }

      body.dark-mode .shop-container {
        background: linear-gradient(180deg, #131315 0%, #181116 100%) !important;
        border-color: var(--dm-border-soft) !important;
      }

      body.dark-mode .open-filter-btn {
        background: #1a1a1a !important;
        color: var(--dm-text-main) !important;
        border-color: var(--dm-border) !important;
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.34) !important;
      }

      body.dark-mode .open-filter-btn:hover {
        background: #24151b !important;
      }

      body.dark-mode .filter-overlay {
        background: rgba(2, 2, 4, 0.6) !important;
      }

      body.dark-mode .filter-panel {
        background: linear-gradient(180deg, #111114 0%, #191118 100%) !important;
        border-color: var(--dm-border) !important;
        box-shadow: -18px 0 34px rgba(0, 0, 0, 0.52), 0 0 24px rgba(214, 90, 122, 0.12) !important;
      }

      body.dark-mode .filter-panel-header,
      body.dark-mode .filter-panel-actions {
        background: #121216 !important;
        border-color: var(--dm-border-soft) !important;
      }

      body.dark-mode .filter-panel-title,
      body.dark-mode .filter-group-title {
        color: var(--dm-text-strong) !important;
      }

      body.dark-mode .filter-close-btn,
      body.dark-mode .panel-action-btn.clear-btn {
        background: #1c1c21 !important;
        color: var(--dm-text-main) !important;
        border-color: var(--dm-border) !important;
      }

      body.dark-mode .filter-panel .filter-btn {
        background: #1a1a1f !important;
        color: var(--dm-text-main) !important;
        border-color: var(--dm-border) !important;
      }

      body.dark-mode .filter-panel .filter-btn.active,
      body.dark-mode .panel-action-btn.apply-btn {
        background: linear-gradient(135deg, var(--dm-accent-crimson) 0%, var(--dm-accent-pink) 100%) !important;
        color: #ffffff !important;
        border-color: var(--dm-accent-crimson) !important;
      }

      @media (max-width: 980px) {
        body.dark-mode .filter-panel {
          box-shadow: 0 -18px 34px rgba(0, 0, 0, 0.52), 0 0 24px rgba(214, 90, 122, 0.12) !important;
        }
      }

      @media (max-width: 768px) {
        body.filter-panel-open .mobile-bottom-nav {
          opacity: 0;
          pointer-events: none;
          transform: translateY(120%);
          transition: transform 0.22s ease, opacity 0.18s ease;
        }
      }

      body.dark-mode .more-menu-auth {
        border-bottom-color: var(--dm-border-soft) !important;
      }

      body.dark-mode .user-pill {
        background: #26151b !important;
        color: #ffdce6 !important;
        border: 1px solid var(--dm-border) !important;
      }

      body.dark-mode #logoutBtn {
        color: #ffc5d5 !important;
        font-weight: 700;
      }

      body.dark-mode #navbar li a.active,
      body.dark-mode #navbar li a:hover,
      body.dark-mode .navbar a:hover {
        color: var(--dm-link-hover) !important;
      }

      body.dark-mode #navbar li a.active::after,
      body.dark-mode #navbar li a:hover::after {
        background: linear-gradient(90deg, var(--dm-accent-crimson), var(--dm-accent-pink)) !important;
        box-shadow: 0 0 10px rgba(214, 90, 122, 0.48);
      }

      body.dark-mode .orders-hero,
      body.dark-mode .checkout-hero,
      body.dark-mode .admin-hero,
      body.dark-mode header,
      body.dark-mode .auth-page {
        background: linear-gradient(135deg, rgba(10, 10, 10, 0.98) 0%, rgba(90, 15, 28, 0.44) 52%, rgba(214, 90, 122, 0.2) 100%) !important;
        border-color: var(--dm-border) !important;
      }

      body.dark-mode #hero {
        background-color: var(--dm-bg) !important;
        background-image: radial-gradient(circle at 14% 24%, rgba(138, 28, 43, 0.5) 0%, rgba(10, 10, 10, 0) 40%), radial-gradient(circle at 66% 78%, rgba(214, 90, 122, 0.36) 0%, rgba(10, 10, 10, 0) 36%), var(--hero-dark-image, url("image/hero4.2.png")) !important;
        background-size: cover !important;
        background-position: top 25% right 0 !important;
        background-repeat: no-repeat !important;
        border-top: 1px solid rgba(255, 80, 120, 0.2);
        border-bottom: 1px solid rgba(255, 80, 120, 0.15);
      }

      body.dark-mode #feature,
      body.dark-mode #product1,
      body.dark-mode #product2,
      body.dark-mode .shop-container,
      body.dark-mode .orders-container,
      body.dark-mode .checkout-container,
      body.dark-mode #cart.cart-layout,
      body.dark-mode .admin-wrapper {
        background-image: linear-gradient(140deg, rgba(90, 15, 28, 0.18) 0%, rgba(18, 18, 18, 0.96) 42%, rgba(214, 90, 122, 0.12) 100%) !important;
        border: 1px solid var(--dm-border-soft) !important;
        border-radius: var(--dm-radius-lg) !important;
        box-shadow: var(--dm-shadow-soft) !important;
      }

      body.dark-mode #feature,
      body.dark-mode #banner,
      body.dark-mode #product1,
      body.dark-mode #product2,
      body.dark-mode #sm-banner,
      body.dark-mode #newsletter {
        margin: 18px 0 !important;
      }

      body.dark-mode #feature {
        background-image: linear-gradient(140deg, rgba(90, 15, 28, 0.2) 0%, rgba(18, 18, 18, 0.95) 55%, rgba(214, 90, 122, 0.1) 100%) !important;
      }

      body.dark-mode #product1 {
        background-image: linear-gradient(130deg, rgba(18, 18, 18, 0.96) 0%, rgba(90, 15, 28, 0.16) 54%, rgba(18, 18, 18, 0.96) 100%) !important;
      }

      body.dark-mode #product2 {
        background-image: linear-gradient(130deg, rgba(90, 15, 28, 0.16) 0%, rgba(18, 18, 18, 0.96) 50%, rgba(214, 90, 122, 0.12) 100%) !important;
      }

      body.dark-mode #product1 h2,
      body.dark-mode #product2 h2,
      body.dark-mode #feature h2,
      body.dark-mode #banner h2,
      body.dark-mode #newsletter h4 {
        color: var(--dm-text-strong) !important;
      }

      body.dark-mode #product1 > p,
      body.dark-mode #product2 > p,
      body.dark-mode #banner h4,
      body.dark-mode #newsletter p {
        color: var(--dm-text-muted) !important;
      }

      body.dark-mode #hero h4,
      body.dark-mode #hero h2,
      body.dark-mode #hero p {
        color: var(--dm-text-strong) !important;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.32);
      }

      body.dark-mode #hero p {
        color: var(--dm-text-muted) !important;
      }

      body.dark-mode #hero h1 {
        background: linear-gradient(135deg, var(--dm-accent-pink), var(--dm-accent-soft-pink));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent !important;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.32);
        letter-spacing: -0.3px;
      }

      body.dark-mode #hero button {
        background: linear-gradient(135deg, var(--dm-accent-crimson), var(--dm-accent-pink)) !important;
        color: #fff !important;
        border-radius: var(--dm-radius-sm) !important;
        box-shadow: 0 8px 18px rgba(214, 90, 122, 0.2) !important;
        border: 1px solid rgba(240, 138, 163, 0.2) !important;
      }

      body.dark-mode #hero button:hover {
        background: linear-gradient(135deg, #a32537, var(--dm-accent-soft-pink)) !important;
        box-shadow: 0 10px 22px rgba(214, 90, 122, 0.26) !important;
        transform: translateY(-1px);
      }

      body.dark-mode #banner,
      body.dark-mode #newsletter {
        background-image: linear-gradient(135deg, rgba(10, 10, 10, 0.92) 0%, rgba(90, 15, 28, 0.42) 52%, rgba(214, 90, 122, 0.24) 100%) !important;
        background-color: #111 !important;
        border: 1px solid var(--dm-border) !important;
        border-radius: var(--dm-radius-lg) !important;
        box-shadow: var(--dm-shadow-soft), 0 0 24px rgba(214, 90, 122, 0.14) !important;
      }

      body.dark-mode #banner::before {
        content: "";
        position: absolute;
        inset: 16px;
        border-radius: 14px;
        background: radial-gradient(circle at center, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0.5) 100%);
        z-index: 0;
      }

      body.dark-mode #banner > * {
        position: relative;
        z-index: 1;
      }

      body.dark-mode #banner h2 {
        text-shadow: 0 4px 18px rgba(0, 0, 0, 0.38) !important;
      }

      body.dark-mode #banner h2 span {
        color: var(--dm-accent-soft-pink) !important;
      }

      body.dark-mode #banner {
        background-image: linear-gradient(135deg, rgba(8, 10, 12, 0.93) 0%, rgba(20, 24, 28, 0.72) 56%, rgba(10, 12, 14, 0.58) 100%), url("image/banner/b2.jpg") !important;
        border-color: rgba(210, 220, 235, 0.2) !important;
      }

      body.dark-mode #banner h2 span {
        color: #ffe3a0 !important;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.42) !important;
      }

      body.dark-mode #banner .normal,
      body.dark-mode #newsletter button,
      body.dark-mode #sm-banner .white {
        background: linear-gradient(135deg, var(--dm-accent-crimson), var(--dm-accent-pink)) !important;
        color: #fff !important;
        border: 1px solid rgba(240, 138, 163, 0.3) !important;
        border-radius: var(--dm-radius-sm) !important;
      }

      body.dark-mode #banner .normal {
        background: linear-gradient(135deg, #e9eef4, #f8fbff) !important;
        color: #1e252d !important;
        border: 1px solid rgba(255, 255, 255, 0.35) !important;
      }

      body.dark-mode #banner .normal:hover,
      body.dark-mode #newsletter button:hover,
      body.dark-mode #sm-banner .white:hover {
        background: linear-gradient(135deg, #a32537, var(--dm-accent-soft-pink)) !important;
        box-shadow: 0 10px 22px rgba(214, 90, 122, 0.24) !important;
      }

      body.dark-mode #banner .normal:hover {
        background: #ffffff !important;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28) !important;
      }

      body.dark-mode #sm-banner .banner-box,
      body.dark-mode #sm-banner .banner-box2 {
        background-image: linear-gradient(135deg, rgba(10, 10, 10, 0.74) 0%, rgba(90, 15, 28, 0.34) 58%, rgba(214, 90, 122, 0.2) 100%), url("image/banner/b18.jpg") !important;
        border: 1px solid var(--dm-border-soft) !important;
        box-shadow: var(--dm-shadow-soft) !important;
        background-size: cover !important;
        background-position: center !important;
      }

      body.dark-mode #sm-banner .banner-box2 {
        background-image: linear-gradient(135deg, rgba(10, 10, 10, 0.74) 0%, rgba(90, 15, 28, 0.34) 58%, rgba(214, 90, 122, 0.2) 100%), url("image/banner/b7.jpg") !important;
      }

      body.dark-mode #feature .fe-box h6 {
        color: #ffd6e1 !important;
        background: rgba(214, 90, 122, 0.16) !important;
        border: 1px solid rgba(240, 138, 163, 0.24) !important;
        text-shadow: none !important;
        font-weight: 700;
      }

      body.dark-mode section,
      body.dark-mode main,
      body.dark-mode article,
      body.dark-mode aside {
        background-color: transparent !important;
        background-image: none !important;
      }

      body.dark-mode .footer {
        background: #0a0a0a !important;
        border-top-color: transparent !important;
        position: relative;
      }

      body.dark-mode .footer::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, rgba(90, 15, 28, 0), rgba(214, 90, 122, 0.75), rgba(90, 15, 28, 0));
      }

      body.dark-mode .footer-rich {
        background: radial-gradient(circle at 10% 14%, rgba(214, 90, 122, 0.18), transparent 36%), linear-gradient(130deg, rgba(10, 10, 10, 0.98) 0%, rgba(35, 16, 22, 0.98) 52%, rgba(90, 15, 28, 0.95) 100%) !important;
        border: 1px solid rgba(214, 90, 122, 0.34) !important;
        box-shadow: 0 18px 34px rgba(0, 0, 0, 0.45), 0 0 30px rgba(214, 90, 122, 0.18) !important;
      }

      body.dark-mode .footer-rich h3,
      body.dark-mode .footer-rich h4 {
        color: #ffffff !important;
      }

      body.dark-mode .footer-rich p,
      body.dark-mode .footer-rich a,
      body.dark-mode .footer-bottom-line p,
      body.dark-mode .developer-note {
        color: #f1d9e2 !important;
      }

      body.dark-mode .footer-tags span,
      body.dark-mode .developer-socials .social-link {
        background: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(214, 90, 122, 0.36) !important;
        color: #ffe5ed !important;
      }

      body.dark-mode .developer-socials .social-link:hover {
        background: rgba(214, 90, 122, 0.2) !important;
        border-color: rgba(240, 138, 163, 0.68) !important;
      }

      body.dark-mode .developer-socials .social-icon {
        background: rgba(255, 255, 255, 0.16) !important;
        color: #ffeef3 !important;
      }

      body.dark-mode .footer-bottom-line {
        border-top-color: rgba(214, 90, 122, 0.34) !important;
      }

      body.dark-mode .order-meta span,
      body.dark-mode .order-items-preview,
      body.dark-mode .payment-option:hover {
        background: #201317 !important;
        border-color: var(--dm-border) !important;
      }

      body.dark-mode .pro-category {
        background: #241218 !important;
        color: #ffd3de !important;
        border: 1px solid var(--dm-border) !important;
      }

      body.dark-mode .stock-badge {
        border: 1px solid transparent !important;
        font-weight: 700 !important;
        letter-spacing: 0.1px;
      }

      body.dark-mode .stock-ok {
        background: #3c1e26 !important;
        color: #ffd9e3 !important;
        border-color: #6c2d3c !important;
      }

      body.dark-mode .stock-low {
        background: #4f1f2a !important;
        color: #ffd7a8 !important;
        border-color: #7b3343 !important;
      }

      body.dark-mode .stock-out {
        background: #5f1424 !important;
        color: #ffd3dc !important;
        border-color: #8e2940 !important;
      }

      body.dark-mode .order-view-btn,
      body.dark-mode .orders-filter-btn,
      body.dark-mode .filter-btn,
      body.dark-mode .shop-more-btn,
      body.dark-mode .btn-secondary,
      body.dark-mode .ghost-btn,
      body.dark-mode .admin-btn-secondary {
        background: transparent !important;
        color: var(--dm-text-main) !important;
        border-color: var(--dm-border) !important;
      }

      body.dark-mode .order-view-btn:hover,
      body.dark-mode .orders-filter-btn:hover,
      body.dark-mode .filter-btn:hover,
      body.dark-mode .shop-more-btn:hover,
      body.dark-mode .btn-secondary:hover,
      body.dark-mode .ghost-btn:hover,
      body.dark-mode .admin-btn-secondary:hover {
        background: rgba(214, 90, 122, 0.12) !important;
        border-color: rgba(240, 138, 163, 0.5) !important;
      }

      body.dark-mode .order-view-btn.active,
      body.dark-mode .orders-filter-btn.active,
      body.dark-mode .filter-btn.active,
      body.dark-mode .btn-primary,
      body.dark-mode .place-order-btn,
      body.dark-mode .home-add-cart-btn {
        color: #ffffff !important;
      }

      body.dark-mode .tab-count-badge,
      body.dark-mode .filter-count,
      body.dark-mode .coming-soon-pill {
        color: #ffd8e2 !important;
        background: #4a1f2c !important;
        border-color: #6f3043 !important;
      }

      body.dark-mode .error-message,
      body.dark-mode .admin-error-message {
        color: #ffd5db !important;
        background: #4f1826 !important;
        border-color: #922d45 !important;
      }

      body.dark-mode .status-pending {
        background: #4a1f2c !important;
        color: #ffd4df !important;
      }

      body.dark-mode .status-confirmed,
      body.dark-mode .status-shipped,
      body.dark-mode .status-delivered {
        background: #4b1e2a !important;
        color: #ffd8e4 !important;
      }

      body.dark-mode .status-cancelled {
        background: #5a2430 !important;
        color: #ffc5cd !important;
      }

      body.dark-mode .confirmation-card.is-success .confirmation-title {
        color: #86efac !important;
      }

      body.dark-mode .confirmation-card.is-cancelled .confirmation-title {
        color: #fda4af !important;
      }

      body.dark-mode .success-icon.icon-success {
        color: #86efac !important;
        text-shadow: 0 6px 16px rgba(134, 239, 172, 0.2) !important;
      }

      body.dark-mode .success-icon.icon-cancelled {
        color: #fda4af !important;
        text-shadow: 0 6px 16px rgba(253, 164, 175, 0.2) !important;
      }

      body.dark-mode .success-icon.icon-neutral {
        color: #aeb8c8 !important;
        text-shadow: none !important;
      }

      body.dark-mode .confirmation-card.is-cancelled .order-details {
        background: #151012 !important;
        border-color: rgba(253, 164, 175, 0.34) !important;
      }

      /* High-readability layer for information-heavy pages */
      body.dark-mode .orders-container,
      body.dark-mode .checkout-container,
      body.dark-mode .confirmation-container,
      body.dark-mode .wishlist-page,
      body.dark-mode .admin-wrapper {
        background-image: linear-gradient(145deg, rgba(12, 14, 18, 0.98) 0%, rgba(16, 18, 24, 0.98) 100%) !important;
      }

      body.dark-mode .orders-hero,
      body.dark-mode .checkout-hero,
      body.dark-mode .wishlist-hero,
      body.dark-mode .admin-hero {
        background: linear-gradient(135deg, rgba(10, 12, 18, 0.98) 0%, rgba(18, 21, 28, 0.98) 100%) !important;
        border-color: rgba(130, 150, 180, 0.24) !important;
      }

      body.dark-mode .orders-filter-bar,
      body.dark-mode .order-card,
      body.dark-mode .checkout-form-section,
      body.dark-mode .order-summary-sidebar,
      body.dark-mode .confirmation-card,
      body.dark-mode .order-details,
      body.dark-mode .table-block,
      body.dark-mode .form-block,
      body.dark-mode .stat-card,
      body.dark-mode .wishlist-card,
      body.dark-mode .wishlist-empty {
        background: #141922 !important;
        border-color: rgba(140, 162, 196, 0.3) !important;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35) !important;
      }

      body.dark-mode .wishlist-grid {
        align-items: stretch !important;
        grid-auto-rows: 1fr !important;
      }

      body.dark-mode .wishlist-card {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
        transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease !important;
      }

      body.dark-mode .wishlist-card:hover {
        transform: translateY(-3px) !important;
        border-color: rgba(240, 168, 192, 0.55) !important;
        box-shadow: 0 16px 30px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(240, 138, 163, 0.18) !important;
      }

      body.dark-mode .wishlist-image-wrap {
        background: #101522 !important;
        border-color: rgba(140, 162, 196, 0.28) !important;
      }

      body.dark-mode .wishlist-card img {
        height: 100% !important;
        object-fit: cover !important;
        object-position: center !important;
        background: transparent !important;
        padding: 0 !important;
      }

      body.dark-mode .wishlist-card-body {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        flex: 1 !important;
      }

      body.dark-mode .wishlist-card-body h3 {
        min-height: 44px !important;
        line-clamp: 2;
        display: -webkit-box !important;
        -webkit-line-clamp: 2 !important;
        -webkit-box-orient: vertical !important;
        overflow: hidden !important;
      }

      body.dark-mode .wishlist-card-body p {
        min-height: 20px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      body.dark-mode .wishlist-actions {
        margin-top: auto !important;
        padding-top: 4px !important;
      }

      body.dark-mode .wishlist-actions .move-cart-btn {
        background: linear-gradient(135deg, #8a1c2b 0%, #d65a7a 100%) !important;
        color: #ffffff !important;
        border: none !important;
      }

      body.dark-mode .wishlist-actions .move-cart-btn:hover {
        background: linear-gradient(135deg, #a92d45 0%, #f08aa3 100%) !important;
        box-shadow: 0 10px 20px rgba(214, 90, 122, 0.26) !important;
      }

      body.dark-mode .wishlist-actions .remove-wishlist-btn {
        background: #1b2230 !important;
        color: #f3d6df !important;
        border: 1px solid rgba(240, 138, 163, 0.4) !important;
      }

      body.dark-mode .wishlist-actions .remove-wishlist-btn:hover {
        background: #2a2230 !important;
        color: #ffdce6 !important;
      }

      body.dark-mode .orders-list {
        gap: 30px !important;
      }

      body.dark-mode .orders-container {
        background-image: linear-gradient(145deg, rgba(12, 10, 12, 0.98) 0%, rgba(28, 14, 18, 0.98) 56%, rgba(18, 12, 16, 0.98) 100%) !important;
      }

      body.dark-mode .orders-hero {
        background: linear-gradient(135deg, rgba(10, 10, 12, 0.98) 0%, rgba(58, 16, 27, 0.72) 58%, rgba(214, 90, 122, 0.24) 100%) !important;
        border-color: rgba(240, 138, 163, 0.24) !important;
      }

      body.dark-mode .orders-filter-bar {
        background: #111214 !important;
        border-color: rgba(255, 255, 255, 0.16) !important;
      }

      body.dark-mode .order-card {
        padding: 20px !important;
        background: #0f0f10 !important;
        border-color: rgba(255, 255, 255, 0.24) !important;
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06) !important;
      }

      body.dark-mode .order-header {
        margin-bottom: 14px !important;
        padding-bottom: 12px !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
      }

      body.dark-mode .order-meta {
        margin-bottom: 12px !important;
      }

      body.dark-mode .order-address {
        margin-bottom: 12px !important;
      }

      body.dark-mode .order-items-preview {
        background: #24161c !important;
        border-color: rgba(240, 138, 163, 0.28) !important;
        margin-bottom: 12px !important;
      }

      body.dark-mode .order-footer {
        padding-top: 12px !important;
        border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
      }

      body.dark-mode .order-actions {
        gap: 10px !important;
      }

      body.dark-mode .order-card::before {
        display: none !important;
      }

      body.dark-mode .orders-container .order-meta span,
      body.dark-mode .orders-container .orders-filter-btn,
      body.dark-mode .orders-container .order-btn {
        background: #111214 !important;
        border-color: rgba(255, 255, 255, 0.16) !important;
        color: #ececec !important;
      }

      body.dark-mode .orders-container .orders-filter-btn:hover,
      body.dark-mode .orders-container .order-btn:hover {
        background: #1a1b1f !important;
        border-color: rgba(255, 255, 255, 0.24) !important;
      }

      body.dark-mode .orders-container .status-pending {
        background: rgba(207, 141, 22, 0.24) !important;
        color: #ffe3aa !important;
      }

      body.dark-mode .orders-container .status-confirmed {
        background: rgba(214, 90, 122, 0.26) !important;
        color: #ffd8e3 !important;
      }

      body.dark-mode .orders-container .status-shipped {
        background: rgba(130, 96, 204, 0.26) !important;
        color: #e3d6ff !important;
      }

      body.dark-mode .orders-container .status-delivered {
        background: rgba(60, 186, 124, 0.24) !important;
        color: #c6f9de !important;
      }

      body.dark-mode .orders-container .status-cancelled {
        background: rgba(201, 72, 103, 0.26) !important;
        color: #ffd4df !important;
      }

      body.dark-mode .orders-container .order-items-preview {
        background: #0b0b0c !important;
        border: none !important;
        border-left: 3px solid #343438 !important;
        color: #f2f2f2 !important;
        box-shadow: none !important;
      }

      body.dark-mode .orders-container .order-meta span {
        background: #111214 !important;
        border-color: rgba(255, 255, 255, 0.14) !important;
        color: #e6e6e6 !important;
        box-shadow: none !important;
      }

      body.dark-mode .orders-container .order-address,
      body.dark-mode .orders-container .order-meta {
        color: #c9c9cc !important;
      }

      body.dark-mode .order-meta span,
      body.dark-mode .order-items-preview,
      body.dark-mode .payment-note,
      body.dark-mode .payment-option,
      body.dark-mode .wishlist-shop-link,
      body.dark-mode .remove-wishlist-btn,
      body.dark-mode .order-view-btn,
      body.dark-mode .orders-filter-btn,
      body.dark-mode .order-btn,
      body.dark-mode .coming-soon-pill,
      body.dark-mode .tab-count-badge,
      body.dark-mode .filter-count {
        background: #1b2230 !important;
        border-color: rgba(140, 162, 196, 0.34) !important;
        color: #dbe7f8 !important;
      }

      body.dark-mode .order-address,
      body.dark-mode .order-meta,
      body.dark-mode .payment-option-desc,
      body.dark-mode .summary-item-qty,
      body.dark-mode .summary-row,
      body.dark-mode .confirmation-subtitle,
      body.dark-mode .detail-row .label,
      body.dark-mode .wishlist-hero p,
      body.dark-mode .wishlist-card-body p,
      body.dark-mode .status-text,
      body.dark-mode .table-scroll small,
      body.dark-mode td small {
        color: #b8c6dc !important;
      }

      body.dark-mode .order-number,
      body.dark-mode .order-total,
      body.dark-mode .summary-title,
      body.dark-mode .form-section-title,
      body.dark-mode .payment-option-name,
      body.dark-mode .summary-row.total,
      body.dark-mode .detail-row .value,
      body.dark-mode .wishlist-card-body h3,
      body.dark-mode .wishlist-price,
      body.dark-mode th,
      body.dark-mode td strong {
        color: #f5f9ff !important;
      }

      body.dark-mode thead {
        background: #1b2230 !important;
      }

      body.dark-mode th,
      body.dark-mode td {
        border-color: rgba(140, 162, 196, 0.28) !important;
      }

      body.dark-mode tbody tr:nth-child(even) {
        background: rgba(22, 29, 40, 0.62) !important;
      }

      body.dark-mode tbody tr:hover {
        background: rgba(30, 39, 54, 0.82) !important;
      }

      body.dark-mode .status-pending {
        background: rgba(245, 186, 44, 0.18) !important;
        color: #ffe39a !important;
      }

      body.dark-mode .status-confirmed {
        background: rgba(167, 139, 250, 0.22) !important;
        color: #ddd0ff !important;
      }

      body.dark-mode .status-shipped {
        background: rgba(56, 189, 248, 0.2) !important;
        color: #bce9ff !important;
      }

      body.dark-mode .status-delivered {
        background: rgba(74, 222, 128, 0.18) !important;
        color: #b8ffd4 !important;
      }

      body.dark-mode .status-cancelled {
        background: rgba(248, 113, 113, 0.2) !important;
        color: #ffd3d3 !important;
      }


      body.dark-mode img {
        opacity: 1;
        filter: brightness(0.95) contrast(1.05);
      }

      body.dark-mode .pro img,
      body.dark-mode .product-image,
      body.dark-mode .product-list img,
      body.dark-mode .cart-item-image img {
        filter: brightness(1) contrast(1.1);
      }

      body.dark-mode #themeToggleBtn.nav-theme-toggle,
      body.dark-mode #themeToggleBtn.floating-theme-toggle {
        background: linear-gradient(135deg, rgba(90, 15, 28, 0.58), rgba(214, 90, 122, 0.28));
        color: #ffe5ec;
        border-color: rgba(214, 90, 122, 0.42);
      }

      body.dark-mode #themeToggleBtn.nav-theme-toggle:hover,
      body.dark-mode #themeToggleBtn.floating-theme-toggle:hover {
        background: #2b171f;
      }

      @media (max-width: 640px) {
        #themeToggleBtn.floating-theme-toggle {
          right: 12px;
          bottom: 12px;
          padding: 8px 12px;
          font-size: 11px;
        }

        #themeToggleBtn.nav-theme-toggle {
          padding: 6px 10px;
          font-size: 11px;
        }
      }

      @media (max-width: 767px) {
        body.dark-mode.home-page #header {
          border-radius: 0 !important;
          background: #0a0a0a !important;
          box-shadow: none !important;
        }

        body.dark-mode.home-page #hero {
          background-image: radial-gradient(circle at 50% 96%, rgba(216, 57, 101, 0.18) 0%, rgba(10, 10, 10, 0.08) 40%), linear-gradient(180deg, #0a0a0a 0%, #0d0608 56%, #1a0a10 100%) !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
        }

        body.dark-mode.home-page #hero .hero-text {
          z-index: 2 !important;
        }

        body.dark-mode.home-page #hero .hero-model-wrap {
          z-index: 1 !important;
        }

        body.dark-mode.home-page .mobile-cart-item a,
        body.dark-mode.home-page .more-menu-toggle,
        body.dark-mode.home-page .mobile-bottom-nav .bottom-nav-item {
          color: #ffffff !important;
        }

        body.dark-mode.home-page .mobile-bottom-nav .bottom-nav-item.active,
        body.dark-mode.home-page .mobile-bottom-nav .bottom-nav-item:hover {
          color: #ff5f91 !important;
        }

        body.dark-mode.home-page #hero h4 {
          color: #d7d7d7 !important;
          text-shadow: none !important;
        }

        body.dark-mode.home-page #hero h2 {
          color: #ffffff !important;
          text-shadow: none !important;
        }

        body.dark-mode.home-page #hero h1 {
          background: none !important;
          color: #cb5a78 !important;
          text-shadow: none !important;
        }

        body.dark-mode.home-page #hero p {
          color: #a9a9a9 !important;
          text-shadow: none !important;
        }

        body.dark-mode.home-page #hero button {
          border-radius: 999px !important;
          border: none !important;
          box-shadow: 0 6px 16px rgba(230, 76, 116, 0.3) !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureToggleButton() {
    let button = document.getElementById("themeToggleBtn");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.id = "themeToggleBtn";
      button.setAttribute("aria-label", "Toggle dark mode");
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", toggleTheme);
    }

    const navbar = document.getElementById("navbar");
    const moreMenuItem = navbar ? navbar.querySelector(".more-menu-item") : null;

    if (navbar) {
      let navThemeItem = navbar.querySelector(".nav-theme-item");
      if (!navThemeItem) {
        navThemeItem = document.createElement("li");
        navThemeItem.className = "nav-theme-item";
      }

      button.classList.remove("floating-theme-toggle");
      button.classList.add("nav-theme-toggle");
      navThemeItem.appendChild(button);

      if (moreMenuItem) {
        navbar.insertBefore(navThemeItem, moreMenuItem);
      } else {
        navbar.appendChild(navThemeItem);
      }
      return;
    }

    button.classList.remove("nav-theme-toggle");
    button.classList.add("floating-theme-toggle");
    document.body.appendChild(button);
  }

  function initTheme() {
    injectDarkModeStyles();
    applyHomeHeroImageWithFallback();
    ensureToggleButton();
    setTheme(getSavedTheme());
    window.addEventListener("resize", ensureToggleButton);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }
})();
