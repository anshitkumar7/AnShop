(function () {
  const API = window.ANSHOP_API || {
    ORIGIN: window.location.origin,
    BASE: `${window.location.origin}/api/v1`
  };
  const API_BASE = API.BASE;
  const USERS_API = `${API_BASE}/users`;
  const ORDERS_API = `${API_BASE}/orders`;
  const MODE_KEY = "anshopProfileMode";
  const dashboardState = {
    user: null,
    orders: []
  };

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
    showToast.timer = setTimeout(function () {
      toast.classList.remove("show");
    }, 1800);
  }

  function leftRotate(value, amount) {
    return (value << amount) | (value >>> (32 - amount));
  }

  // Lightweight MD5 for Gravatar email hashing.
  function md5(input) {
    const text = unescape(encodeURIComponent(String(input || "")));
    const bytes = [];
    for (let i = 0; i < text.length; i += 1) {
      bytes.push(text.charCodeAt(i));
    }

    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) {
      bytes.push(0);
    }

    for (let i = 0; i < 8; i += 1) {
      bytes.push((bitLength >>> (8 * i)) & 0xff);
    }

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;

    const s = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];

    const k = [];
    for (let i = 0; i < 64; i += 1) {
      k[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
    }

    for (let i = 0; i < bytes.length; i += 64) {
      const m = [];
      for (let j = 0; j < 16; j += 1) {
        const idx = i + (j * 4);
        m[j] = (bytes[idx]) | (bytes[idx + 1] << 8) | (bytes[idx + 2] << 16) | (bytes[idx + 3] << 24);
      }

      let a = a0;
      let b = b0;
      let c = c0;
      let d = d0;

      for (let j = 0; j < 64; j += 1) {
        let f;
        let g;

        if (j < 16) {
          f = (b & c) | ((~b) & d);
          g = j;
        } else if (j < 32) {
          f = (d & b) | ((~d) & c);
          g = (5 * j + 1) % 16;
        } else if (j < 48) {
          f = b ^ c ^ d;
          g = (3 * j + 5) % 16;
        } else {
          f = c ^ (b | (~d));
          g = (7 * j) % 16;
        }

        const temp = d;
        d = c;
        c = b;
        const sum = (a + f + k[j] + m[g]) >>> 0;
        b = (b + leftRotate(sum, s[j])) >>> 0;
        a = temp;
      }

      a0 = (a0 + a) >>> 0;
      b0 = (b0 + b) >>> 0;
      c0 = (c0 + c) >>> 0;
      d0 = (d0 + d) >>> 0;
    }

    function toHex(value) {
      let hex = "";
      for (let i = 0; i < 4; i += 1) {
        const byte = (value >>> (8 * i)) & 0xff;
        hex += byte.toString(16).padStart(2, "0");
      }
      return hex;
    }

    return `${toHex(a0)}${toHex(b0)}${toHex(c0)}${toHex(d0)}`;
  }

  function getInitials(name) {
    const text = String(name || "User").trim();
    if (!text) {
      return "U";
    }
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
  }

  function buildAvatarUrl(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return "";
    }
    const hash = md5(normalizedEmail);
    return `https://www.gravatar.com/avatar/${hash}?s=240&d=404`;
  }

  function getFallbackAvatar(name) {
    const initials = encodeURIComponent(getInitials(name));
    return `https://ui-avatars.com/api/?name=${initials}&size=240&background=1f2937&color=f8fafc&bold=true`;
  }

  function applyProfileAvatar(email, name) {
    const avatarEl = document.getElementById("profileImage");
    if (!avatarEl) {
      console.error("[applyProfileAvatar] profileImage element not found!");
      return;
    }

    // Check for Google profile photo from localStorage first
    const googlePhotoURL = localStorage.getItem("userPhotoURL");
    console.log("[applyProfileAvatar] Google photo URL from localStorage:", googlePhotoURL);
    
    if (googlePhotoURL && googlePhotoURL.trim() !== "") {
      console.log("[applyProfileAvatar] Found Google photo, loading:", googlePhotoURL);
      avatarEl.src = googlePhotoURL;
      avatarEl.onerror = function () {
        console.log("[applyProfileAvatar] Google photo failed to load, switching to fallback");
        avatarEl.onerror = null;
        avatarEl.src = getFallbackAvatar(name);
      };
      return;
    }

    console.log("[applyProfileAvatar] No Google photo found, using Gravatar fallback");
    const fallback = getFallbackAvatar(name);
    const gravatarUrl = buildAvatarUrl(email);

    if (!gravatarUrl) {
      console.log("[applyProfileAvatar] No Gravatar URL, using fallback avatar");
      avatarEl.src = fallback;
      return;
    }

    avatarEl.onerror = function () {
      console.log("[applyProfileAvatar] Gravatar failed, switching to placeholder");
      avatarEl.onerror = null;
      avatarEl.src = fallback;
    };
    avatarEl.src = gravatarUrl;
  }

  function setFooterYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  function hydrateProfileFromStorage() {
    const name = localStorage.getItem("userName") || "AnShop User";
    const email = localStorage.getItem("userEmail") || `${name.toLowerCase().replace(/\s+/g, ".")}@anshop.com`;
    const phone = localStorage.getItem("userPhone") || "";
    const photoURL = localStorage.getItem("userPhotoURL") || "";

    console.log("[Profile Debug] localStorage photoURL:", photoURL);

    const nameEl = document.getElementById("profileName");
    const emailEl = document.getElementById("profileEmail");
    const phoneEl = document.getElementById("profilePhone");

    if (nameEl) {
      nameEl.textContent = name;
    }
    if (emailEl) {
      emailEl.textContent = email;
    }
    if (phoneEl) {
      phoneEl.textContent = phone ? `Phone: ${phone}` : "Phone: Not added";
    }

    applyProfileAvatar(email, name);
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "N/A";
    }
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  }

  function formatCurrency(amount) {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }

  function statusLabel(status) {
    const map = {
      pending: "Pending",
      confirmed: "Confirmed",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled"
    };
    return map[status] || "Pending";
  }

  function statusProgress(status) {
    const map = {
      pending: 35,
      confirmed: 52,
      shipped: 78,
      delivered: 100,
      cancelled: 22
    };
    return map[status] || 35;
  }

  function resolveImage(imageValue) {
    const fallback = "image/products/f1.jpg";
    if (API.resolveImage) {
      return API.resolveImage(imageValue, fallback);
    }

    if (!imageValue || typeof imageValue !== "string") {
      return fallback;
    }

    return `${API.ORIGIN}/images/${imageValue}`;
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      const data = await response.json().catch(function () {
        return {};
      });
      throw new Error(data.message || data.error || "Request failed");
    }
    return response.json();
  }

  async function parseResponseBody(response) {
    const raw = await response.text();
    if (!raw) {
      return {};
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      return { message: raw };
    }
  }

  function updateProfile(user, orders) {
    console.log("[updateProfile] Called with user:", user);
    
    const nameEl = document.getElementById("profileName");
    const emailEl = document.getElementById("profileEmail");
    const memberSinceEl = document.getElementById("profileMemberSince");
    const phoneEl = document.getElementById("profilePhone");

    if (user) {
      const userName = user.name || "AnShop User";
      const userEmail = user.email || "user@anshop.com";
      const userPhone = user.phone || "";
      const userPhotoURL = user.photoURL || "";
      
      console.log("[updateProfile] PhotoURL from user object:", userPhotoURL);
      
      localStorage.setItem("userName", userName);
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userPhone", userPhone);
      localStorage.setItem("userPhotoURL", userPhotoURL);
      
      console.log("[updateProfile] Saved to localStorage. PhotoURL now:", localStorage.getItem("userPhotoURL"));

      if (nameEl) {
        nameEl.textContent = userName;
      }
      if (emailEl) {
        emailEl.textContent = userEmail;
      }
      if (phoneEl) {
        phoneEl.textContent = userPhone ? `Phone: ${userPhone}` : "Phone: Not added";
      }
      if (memberSinceEl) {
        const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "Jan 2024";
        memberSinceEl.textContent = `Member since ${memberSince}`;
      }

      applyProfileAvatar(userEmail, userName);
    }

    const hasOrders = Array.isArray(orders) && orders.length > 0;
    const hasAddress = Boolean(
      (user && user.address && user.address.address)
      || (hasOrders && orders.find(function (order) {
      return order.shippingAddress && order.shippingAddress.address;
      }))
    );

    const completionParts = [
      Boolean(user && user.name),
      Boolean(user && user.email),
      hasOrders,
      hasAddress
    ];
    const completion = Math.round((completionParts.filter(Boolean).length / completionParts.length) * 100);

    const completionText = document.getElementById("completionText");
    const completionFill = document.getElementById("completionFill");
    if (completionText) {
      completionText.textContent = `${completion}%`;
    }
    if (completionFill) {
      completionFill.style.width = `${completion}%`;
    }
  }

  function setStats(orders) {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce(function (sum, order) {
      return sum + Number(order.totalAmount || 0);
    }, 0);
    const activeOrders = orders.filter(function (order) {
      const status = (order.status || "pending").toLowerCase();
      return status !== "delivered" && status !== "cancelled";
    }).length;
    const rewardPoints = Math.floor(totalSpent * 0.08 + totalOrders * 35);

    const stats = {
      totalOrders,
      totalSpent,
      activeOrders,
      rewardPoints
    };

    const totalOrdersEl = document.getElementById("statTotalOrders");
    const totalSpentEl = document.getElementById("statTotalSpent");
    const activeOrdersEl = document.getElementById("statActiveOrders");
    const rewardsEl = document.getElementById("statRewards");

    if (totalOrdersEl) {
      totalOrdersEl.dataset.target = String(stats.totalOrders);
    }
    if (totalSpentEl) {
      totalSpentEl.dataset.target = String(stats.totalSpent);
    }
    if (activeOrdersEl) {
      activeOrdersEl.dataset.target = String(stats.activeOrders);
    }
    if (rewardsEl) {
      rewardsEl.dataset.target = String(stats.rewardPoints);
    }

    return stats;
  }

  function setLevel(points) {
    const levels = [
      { name: "Bronze Shopper", min: 0, next: 3000 },
      { name: "Silver Shopper", min: 3000, next: 9000 },
      { name: "Gold Shopper", min: 9000, next: 16000 },
      { name: "Platinum Shopper", min: 16000, next: 22000 }
    ];

    let current = levels[0];
    for (let index = 0; index < levels.length; index += 1) {
      if (points >= levels[index].min) {
        current = levels[index];
      }
    }

    const nextTarget = current.next || current.min;
    const range = Math.max(nextTarget - current.min, 1);
    const clamped = Math.max(0, Math.min(points - current.min, range));
    const percent = current.next ? Math.round((clamped / range) * 100) : 100;

    const titleEl = document.getElementById("shopperLevelTitle");
    const subtextEl = document.getElementById("shopperLevelSubtext");
    const fillEl = document.getElementById("shopperLevelFill");
    const currentPointsEl = document.getElementById("levelCurrentPoints");
    const nextPointsEl = document.getElementById("levelNextPoints");

    if (titleEl) {
      titleEl.textContent = current.name;
    }
    if (subtextEl) {
      if (current.next) {
        subtextEl.textContent = `You are ${percent}% of the way to the next level.`;
      } else {
        subtextEl.textContent = "You reached the top level. Keep shopping to maintain your streak.";
      }
    }
    if (fillEl) {
      fillEl.style.width = `${percent}%`;
    }
    if (currentPointsEl) {
      currentPointsEl.textContent = `${points.toLocaleString("en-IN")} pts`;
    }
    if (nextPointsEl) {
      nextPointsEl.textContent = current.next ? `${current.next.toLocaleString("en-IN")} pts` : "MAX LEVEL";
    }
  }

  function renderRecentOrders(orders) {
    const container = document.getElementById("recentOrdersList");
    if (!container) {
      return;
    }

    if (!orders.length) {
      container.innerHTML = '<p class="empty-block">No orders yet. Start shopping to unlock personalized insights.</p>';
      return;
    }

    container.innerHTML = orders.slice(0, 3).map(function (order) {
      const status = order.status || "pending";
      const itemCount = Array.isArray(order.items) ? order.items.reduce(function (sum, item) {
        return sum + Number(item.quantity || 1);
      }, 0) : 0;

      const firstItem = Array.isArray(order.items) && order.items[0] ? order.items[0] : {};
      const product = firstItem.productId && typeof firstItem.productId === "object" ? firstItem.productId : {};
      const image = resolveImage(product.image || firstItem.image);
      const title = firstItem.productName || product.name || "Order item";

      return `
        <div class="order-row">
          <img src="${image}" alt="${title}" class="order-thumb">
          <div class="order-info">
            <h4>${title}</h4>
            <p>Order #${order.orderNumber || order._id || "-"} • ${itemCount} item(s) • ${formatDate(order.createdAt)}</p>
            <span class="status ${status}">${statusLabel(status)}</span>
            <div class="progress-track"><div class="progress-fill ${status}" style="--progress: ${statusProgress(status)}%;"></div></div>
          </div>
          <strong>${formatCurrency(order.totalAmount)}</strong>
        </div>
      `;
    }).join("");
  }

  function renderAddresses(orders, user) {
    const container = document.getElementById("savedAddressesList");
    if (!container) {
      return;
    }

    const uniqueMap = new Map();

    if (user && user.address && user.address.address) {
      const profileAddress = user.address;
      const profileLine = [
        profileAddress.address,
        profileAddress.city,
        profileAddress.state,
        profileAddress.pincode
      ].filter(Boolean).join(", ");

      if (profileLine) {
        uniqueMap.set(profileLine, user.name || "Saved Address");
      }
    }

    orders.forEach(function (order) {
      const address = order.shippingAddress || {};
      const line = [address.address, address.city, address.state, address.pincode].filter(Boolean).join(", ");
      if (!line) {
        return;
      }
      if (!uniqueMap.has(line)) {
        uniqueMap.set(line, address.fullName || "Delivery Address");
      }
    });

    const addresses = Array.from(uniqueMap.entries()).slice(0, 3);
    if (!addresses.length) {
      container.innerHTML = '<p class="empty-block">No saved address yet. Place your first order to store addresses.</p>';
      return;
    }

    container.innerHTML = addresses.map(function (entry, index) {
      const [line, name] = entry;
      const label = index === 0 ? "Primary" : `Address ${index + 1}`;
      return `
        <div class="utility-item">
          <strong>${label} • ${name}</strong>
          <p>${line}</p>
        </div>
      `;
    }).join("");
  }

  function fillEditForm(user) {
    const safeUser = user || {};
    const address = safeUser.address || {};

    const nameInput = document.getElementById("editName");
    const phoneInput = document.getElementById("editPhone");
    const addressInput = document.getElementById("editAddress");
    const cityInput = document.getElementById("editCity");
    const stateInput = document.getElementById("editState");
    const pincodeInput = document.getElementById("editPincode");

    if (nameInput) {
      nameInput.value = safeUser.name || "";
    }
    if (phoneInput) {
      phoneInput.value = safeUser.phone || "";
    }
    if (addressInput) {
      addressInput.value = address.address || "";
    }
    if (cityInput) {
      cityInput.value = address.city || "";
    }
    if (stateInput) {
      stateInput.value = address.state || "";
    }
    if (pincodeInput) {
      pincodeInput.value = address.pincode || "";
    }
  }

  function toggleProfileModal(open) {
    const modal = document.getElementById("profileEditModal");
    if (!modal) {
      return;
    }

    modal.classList.toggle("show", open);
    modal.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function initProfileEdit() {
    const editButton = document.getElementById("editProfileBtn");
    const closeButton = document.getElementById("closeProfileModal");
    const cancelButton = document.getElementById("cancelProfileEdit");
    const modal = document.getElementById("profileEditModal");
    const form = document.getElementById("profileEditForm");
    const saveButton = document.getElementById("saveProfileBtn");

    if (!editButton || !modal || !form) {
      return;
    }

    editButton.addEventListener("click", function () {
      fillEditForm(dashboardState.user);
      toggleProfileModal(true);
    });

    [closeButton, cancelButton].forEach(function (button) {
      if (!button) {
        return;
      }

      button.addEventListener("click", function () {
        toggleProfileModal(false);
      });
    });

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        toggleProfileModal(false);
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const userId = localStorage.getItem("userId");
      if (!userId) {
        window.location.href = "login.html";
        return;
      }

      const name = String(document.getElementById("editName")?.value || "").trim();
      const phone = String(document.getElementById("editPhone")?.value || "").trim();
      const address = String(document.getElementById("editAddress")?.value || "").trim();
      const city = String(document.getElementById("editCity")?.value || "").trim();
      const state = String(document.getElementById("editState")?.value || "").trim();
      const pincode = String(document.getElementById("editPincode")?.value || "").trim();

      if (!name) {
        showToast("Name is required", "error");
        return;
      }

      if (phone && !/^\d{10}$/.test(phone)) {
        showToast("Phone must be 10 digits", "error");
        return;
      }

      if (pincode && !/^\d{6}$/.test(pincode)) {
        showToast("Pincode must be 6 digits", "error");
        return;
      }

      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
      }

      try {
        const payload = {
          name,
          phone,
          address,
          city,
          state,
          pincode
        };

        let response = await fetch(`${USERS_API}/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        let data = await parseResponseBody(response);

        // Compatibility fallback for environments where PUT route is not available.
        if (!response.ok && response.status === 404) {
          response = await fetch(`${USERS_API}/update/${userId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          data = await parseResponseBody(response);
        }

        if (!response.ok) {
          throw new Error(data.message || "Profile update failed");
        }

        dashboardState.user = data.user;
        updateProfile(dashboardState.user, dashboardState.orders);
        renderAddresses(dashboardState.orders, dashboardState.user);
        showToast("Profile updated successfully", "success");
        toggleProfileModal(false);
      } catch (error) {
        if (String(error.message || "").toLowerCase().includes("user not found")) {
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("userPhone");
          showToast("Session expired. Please login again.", "info");
          setTimeout(function () {
            window.location.href = "login.html";
          }, 900);
          return;
        }

        showToast(error.message || "Unable to update profile", "error");
      }

      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
      }
    });
  }

  function initSidebar() {
    const sidebar = document.getElementById("profileSidebar");
    const toggle = document.getElementById("sidebarToggle");
    const navItems = document.querySelectorAll(".profile-nav-item");

    if (toggle && sidebar) {
      toggle.addEventListener("click", function () {
        const open = sidebar.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });

      document.addEventListener("click", function (event) {
        if (!sidebar.contains(event.target) && !toggle.contains(event.target)) {
          sidebar.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    navItems.forEach(function (item) {
      item.addEventListener("click", function () {
        navItems.forEach(function (node) {
          node.classList.remove("active");
        });
        item.classList.add("active");

        const target = item.getAttribute("data-target");
        if (target === "logout") {
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
          localStorage.removeItem("userEmail");
          window.location.href = "index.html";
          return;
        }

        if (target === "credit-redirect") {
          window.location.href = "credit-profile.html";
          return;
        }

        const section = document.getElementById(target);
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        if (sidebar) {
          sidebar.classList.remove("open");
        }
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  function animateCounter(element) {
    const target = Number(element.dataset.target || 0);
    const prefix = element.dataset.prefix || "";
    const duration = 1200;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(target * eased);
      element.textContent = `${prefix}${value.toLocaleString("en-IN")}`;

      if (progress < 1) {
        window.requestAnimationFrame(frame);
      }
    }

    window.requestAnimationFrame(frame);
  }

  function initCountUp() {
    const counters = document.querySelectorAll(".count-up");
    if (!counters.length) {
      return;
    }
    counters.forEach(function (counter) {
      animateCounter(counter);
    });
  }

  function initProgressBars() {
    const bars = document.querySelectorAll(".progress-fill");
    bars.forEach(function (bar) {
      const value = bar.style.getPropertyValue("--progress");
      setTimeout(function () {
        bar.style.width = value || "0%";
      }, 250);
    });
  }

  async function loadDashboardData() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      window.location.href = "login.html";
      return;
    }

    let user = null;
    let orders = [];
    try {
      const [userData, ordersData] = await Promise.all([
        fetchJson(`${USERS_API}/${userId}`).catch(function () {
          return null;
        }),
        fetchJson(`${ORDERS_API}/user/${userId}`).catch(function () {
          return [];
        })
      ]);

      if (userData && userData.user) {
        user = userData.user;
      }
      if (Array.isArray(ordersData)) {
        orders = ordersData;
      }
    } catch (error) {
      console.error("Profile dashboard fetch failed:", error);
    }

    dashboardState.user = user;
    dashboardState.orders = orders;

    updateProfile(user, orders);
    const stats = setStats(orders);
    setLevel(stats.rewardPoints);
    renderRecentOrders(orders);
    renderAddresses(orders, user);
    initProgressBars();
    initCountUp();
  }

  function applyMode(mode) {
    const isLight = mode === "light";
    document.body.classList.toggle("profile-light", isLight);

    const modeBtn = document.getElementById("profileModeToggle");
    if (modeBtn) {
      modeBtn.textContent = isLight ? "Dark Mode" : "Light Mode";
      modeBtn.setAttribute("aria-pressed", isLight ? "false" : "true");
    }
  }

  function initModeToggle() {
    const saved = localStorage.getItem(MODE_KEY) || "dark";
    applyMode(saved);

    const modeBtn = document.getElementById("profileModeToggle");
    if (!modeBtn) {
      return;
    }

    modeBtn.addEventListener("click", function () {
      const next = document.body.classList.contains("profile-light") ? "dark" : "light";
      localStorage.setItem(MODE_KEY, next);
      applyMode(next);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setFooterYear();
    hydrateProfileFromStorage();
    initSidebar();
    initModeToggle();
    initProfileEdit();
    loadDashboardData();
  });
})();
