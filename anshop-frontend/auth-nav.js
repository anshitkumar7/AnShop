function renderAuthNav() {
  const API = window.ANSHOP_API || {
    api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
  };
  const authNav = document.getElementById("authNav");
  const authNavMenu = document.getElementById("authNavMenu");
  const adminMenuLinks = document.querySelectorAll('a[href="admin.html"]');
  const wishlistBadges = document.querySelectorAll(".wishlist-count-badge");
  const cartBadges = [
    document.getElementById("cartCountBadge"),
    document.getElementById("bottomCartCountBadge")
  ].filter(Boolean);
  const LOGOUT_TOAST_FLAG = "anshopLogoutSuccess";

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

  function resolveAuthState() {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    const payload = token ? decodeTokenPayload(token) : null;
    const tokenUserId = String((payload && (payload.userId || payload._id || payload.sub)) || "").trim();
    const tokenRoleRaw = String((payload && payload.role) || "").trim().toLowerCase();
    const tokenRole = tokenRoleRaw === "admin" ? "admin" : "user";

    if (token && !localStorage.getItem("authToken")) {
      localStorage.setItem("authToken", token);
    }

    const storedUserId = String(localStorage.getItem("userId") || "").trim();
    const userId = tokenUserId || storedUserId;
    const userName = localStorage.getItem("userName") || "User";
    const isAuthenticated = Boolean(token && userId);

    if (tokenUserId && tokenUserId !== storedUserId) {
      localStorage.setItem("userId", tokenUserId);
    }

    if (isAuthenticated) {
      localStorage.setItem("userRole", tokenRole);
    } else {
      localStorage.removeItem("userRole");
    }

    return {
      token,
      userId,
      userName,
      userRole: isAuthenticated ? tokenRole : "user",
      isAuthenticated
    };
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
    }, 1900);
  }

  function showLogoutSuccessIfNeeded() {
    if (sessionStorage.getItem(LOGOUT_TOAST_FLAG) !== "1") {
      return;
    }
    sessionStorage.removeItem(LOGOUT_TOAST_FLAG);
    showToast("Logged out successfully", "success");
  }

  function showLogoutConfirmModal() {
    return new Promise(resolve => {
      const backdrop = document.createElement("div");
      backdrop.className = "logout-confirm-backdrop";
      backdrop.innerHTML = `
        <div class="logout-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="logoutConfirmTitle">
          <div class="logout-confirm-head">
            <h3 id="logoutConfirmTitle">Logout Now?</h3>
            <p>You can login again anytime to continue shopping.</p>
          </div>
          <div class="logout-confirm-actions">
            <button type="button" class="logout-confirm-btn stay" id="stayLoggedInBtn">Stay Logged In</button>
            <button type="button" class="logout-confirm-btn leave" id="confirmLogoutBtn">Yes, Logout</button>
          </div>
        </div>
      `;

      const closeModal = result => {
        document.removeEventListener("keydown", onEscape);
        backdrop.remove();
        resolve(result);
      };

      const onEscape = event => {
        if (event.key === "Escape") {
          closeModal(false);
        }
      };

      document.body.appendChild(backdrop);
      document.addEventListener("keydown", onEscape);

      const stayBtn = backdrop.querySelector("#stayLoggedInBtn");
      const logoutBtn = backdrop.querySelector("#confirmLogoutBtn");

      stayBtn.addEventListener("click", () => closeModal(false));
      logoutBtn.addEventListener("click", () => closeModal(true));
      backdrop.addEventListener("click", event => {
        if (event.target === backdrop) {
          closeModal(false);
        }
      });
    });
  }

  async function performLogout() {
    const shouldLogout = await showLogoutConfirmModal();
    if (!shouldLogout) {
      return;
    }

    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhotoURL");

    // Clear product markers so next session starts clean.
    Object.keys(localStorage).forEach(key => {
      if (/^[a-f0-9]{24}$/i.test(key)) {
        localStorage.removeItem(key);
      }
    });

    sessionStorage.setItem(LOGOUT_TOAST_FLAG, "1");
    window.location.href = "index.html";
  }

  showLogoutSuccessIfNeeded();

  function setCartBadges(count) {
    cartBadges.forEach(badge => {
      badge.textContent = String(count);
    });
  }

  async function syncWishlistCount() {
    const userId = localStorage.getItem("userId");
    if (!wishlistBadges.length) {
      return;
    }

    if (!userId) {
      wishlistBadges.forEach(badge => {
        badge.textContent = "0";
      });
      return;
    }

    try {
      const response = await fetch(`${API.api("wishlist")}/${userId}`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const count = Array.isArray(data.items) ? data.items.length : 0;

      wishlistBadges.forEach(badge => {
        badge.textContent = String(count);
      });
    } catch (error) {
      // Keep UI functional even if wishlist count fetch fails.
    }
  }

  async function syncCartCount() {
    if (!cartBadges.length) {
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setCartBadges(0);
      return;
    }

    try {
      const response = await fetch(`${API.api("cart")}/${userId}`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const count = Array.isArray(data.items)
        ? data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
        : 0;

      setCartBadges(count);
    } catch (error) {
      // Keep UI usable even if cart badge sync fails.
    }
  }

  if (!authNav && !authNavMenu) {
    syncWishlistCount();
    syncCartCount();
    return;
  }

  const authState = resolveAuthState();
  const userId = authState.userId;
  const userName = authState.userName;
  const userRole = authState.userRole;

  function syncAdminMenuVisibility() {
    const isAdmin = Boolean(userId) && userRole === "admin";
    adminMenuLinks.forEach(link => {
      if (isAdmin) {
        link.hidden = false;
        link.style.display = "";
        link.removeAttribute("aria-hidden");
      } else {
        link.hidden = true;
        link.style.display = "none";
        link.setAttribute("aria-hidden", "true");
      }
    });
  }

  function bindLogoutHandlers() {
    const logoutButtons = document.querySelectorAll(".logoutBtn");
    logoutButtons.forEach(logoutBtn => {
      logoutBtn.addEventListener("click", async event => {
        event.preventDefault();
        await performLogout();
      });
    });
  }

  if (!userId) {
    if (authNav) {
      authNav.innerHTML = `
        <a href="login.html">Login</a> |
        <a href="signup.html">Register</a>
      `;
    }

    if (authNavMenu) {
      authNavMenu.innerHTML = `
        <a href="login.html">Login</a>
        <a href="signup.html">Register</a>
        <a href="wishlist.html">Wishlist</a>
      `;
    }
    syncAdminMenuVisibility();
    syncWishlistCount();
    syncCartCount();
    return;
  }

  if (authNav) {
    authNav.innerHTML = `
      <span class="user-pill">Hi, ${userName}</span>
      <a href="#" class="logoutBtn" id="logoutBtn">Logout</a>
    `;
  }

  if (authNavMenu) {
    authNavMenu.innerHTML = `
      <span class="user-pill">Hi, ${userName}</span>
      <a href="profile.html">Profile</a>
      <a href="wishlist.html">Wishlist</a>
      <a href="#" class="logoutBtn" id="logoutBtnMenu">Logout</a>
    `;
  }

  bindLogoutHandlers();
  syncAdminMenuVisibility();
  syncWishlistCount();
  syncCartCount();
}

document.addEventListener("DOMContentLoaded", renderAuthNav);
