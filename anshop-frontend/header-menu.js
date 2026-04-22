(function () {
  function enhanceMobileHeaderMarkup() {
    const navbar = document.getElementById("navbar");
    if (!navbar) {
      return;
    }

    const cartLink = navbar.querySelector('a[href$="cart.html"], a[href*="cart.html"]');
    const cartItem = cartLink ? cartLink.closest("li") : null;

    if (cartItem) {
      cartItem.classList.add("mobile-cart-item");
    }

    if (cartLink) {
      const existingBadge = cartLink.querySelector(".cart-count-badge");
      const badgeNode = existingBadge ? existingBadge.cloneNode(true) : null;
      const labelSource = cartLink.cloneNode(true);

      labelSource.querySelectorAll(".cart-count-badge, .mobile-nav-icon, .cart-link-text").forEach(node => node.remove());
      const labelText = labelSource.textContent.replace(/\s+/g, " ").trim() || "My Cart";

      cartLink.textContent = "";

      const textSpan = document.createElement("span");
      textSpan.className = "cart-link-text";
      textSpan.textContent = labelText;
      cartLink.appendChild(textSpan);

      cartLink.insertAdjacentHTML(
        "beforeend",
        '<svg class="mobile-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 4h2l2.2 9.2a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 1.9-1.4L21 7H7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path><circle cx="10" cy="19" r="1.6" fill="currentColor"></circle><circle cx="17" cy="19" r="1.6" fill="currentColor"></circle></svg>'
      );

      if (badgeNode) {
        cartLink.appendChild(badgeNode);
      }
    }

    const toggleBtn = document.getElementById("moreMenuToggle");
    if (toggleBtn && !toggleBtn.querySelector(".more-menu-dots")) {
      const rawText = (toggleBtn.textContent || "").trim();
      if (rawText === "⋮" || rawText === "..." || rawText === "") {
        toggleBtn.textContent = "";

        const dots = document.createElement("span");
        dots.className = "more-menu-dots";
        dots.textContent = "⋮";
        toggleBtn.appendChild(dots);

        for (let index = 0; index < 3; index += 1) {
          toggleBtn.appendChild(document.createElement("span"));
        }
      }
    }
  }

  function initHeaderMenu() {
    enhanceMobileHeaderMarkup();

    const toggleBtn = document.getElementById("moreMenuToggle");
    const dropdown = document.getElementById("moreMenuDropdown");
    const menuItem = toggleBtn ? toggleBtn.closest(".more-menu-item") : null;
    const desktopHoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    let closeTimer = null;

    if (!toggleBtn || !dropdown || !menuItem) {
      return;
    }

    function clearCloseTimer() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function closeMenu() {
      clearCloseTimer();
      dropdown.classList.remove("show");
      toggleBtn.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
      clearCloseTimer();
      dropdown.classList.add("show");
      toggleBtn.setAttribute("aria-expanded", "true");
    }

    function scheduleClose() {
      clearCloseTimer();
      closeTimer = setTimeout(closeMenu, 120);
    }

    toggleBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const isOpen = dropdown.classList.contains("show");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (desktopHoverQuery.matches) {
      menuItem.addEventListener("mouseenter", openMenu);
      menuItem.addEventListener("mouseleave", scheduleClose);

      // Keep menu accessible for keyboard navigation on desktop.
      menuItem.addEventListener("focusin", openMenu);
      menuItem.addEventListener("focusout", function (event) {
        if (!menuItem.contains(event.relatedTarget)) {
          scheduleClose();
        }
      });
    }

    document.addEventListener("click", function (event) {
      if (!dropdown.contains(event.target) && event.target !== toggleBtn) {
        closeMenu();
      }
    });

    dropdown.addEventListener("click", function (event) {
      const clickedLink = event.target.closest("a");
      if (clickedLink) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    desktopHoverQuery.addEventListener("change", closeMenu);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeaderMenu);
  } else {
    initHeaderMenu();
  }
})();
