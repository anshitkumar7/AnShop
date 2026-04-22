(function () {
  const API = window.ANSHOP_API || {
    BASE: `${window.location.origin}/api/v1`,
    api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`,
    fetchWithAuth: (url, options) => fetch(url, options)
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function formatMoney(value) {
    return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function levelText(level) {
    const map = {
      Starter: "Your score foundation is building. Complete more successful deliveries.",
      Growing: "Great progress. Keep cancellations low to reach Prime tier.",
      Prime: "Strong trust profile. You are close to Elite credit capacity.",
      Elite: "Excellent profile. You unlocked top credit trust in AnShop."
    };

    return map[level] || map.Starter;
  }

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

  function resolveAuthContext() {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    let userId = localStorage.getItem("userId") || "";

    if (token && !localStorage.getItem("authToken")) {
      localStorage.setItem("authToken", token);
    }

    if (!userId && token) {
      const payload = decodeTokenPayload(token);
      const tokenUserId = String((payload && (payload.userId || payload._id || payload.sub)) || "").trim();
      if (tokenUserId) {
        userId = tokenUserId;
        localStorage.setItem("userId", tokenUserId);
      }
    }

    return { userId, token };
  }

  function ensureAuth() {
    const { userId, token } = resolveAuthContext();

    if (!userId || !token) {
      const statusEl = byId("creditStatus");
      if (statusEl) {
        statusEl.innerHTML = 'Please login first to view your credit profile. <a href="login.html">Go to Login</a>';
      }
      return null;
    }

    return userId;
  }

  function setScoreRing(score) {
    const ring = byId("scoreRing");
    if (!ring) {
      return;
    }

    const progress = Math.max(0, Math.min(Number(score || 0) / 900, 1));
    const angle = Math.round(progress * 360);
    ring.style.background = `conic-gradient(var(--accent) ${angle}deg, color-mix(in srgb, var(--accent) 20%, transparent) 0deg)`;
  }

  function setCapacity(limit, used) {
    const fill = byId("capacityFill");
    if (!fill) {
      return;
    }

    const safeLimit = Math.max(Number(limit || 0), 0);
    const safeUsed = Math.max(Number(used || 0), 0);
    const percent = safeLimit > 0 ? Math.min((safeUsed / safeLimit) * 100, 100) : 0;
    fill.style.width = `${percent}%`;
  }

  function updateUi(payload) {
    const user = payload.user || {};
    const credit = payload.creditProfile || {};

    byId("profileName").textContent = user.name || "-";
    byId("profileEmail").textContent = user.email || "-";

    byId("scoreValue").textContent = String(Number(credit.score || 600));
    byId("creditLevelBadge").textContent = credit.level || "Starter";
    byId("scoreInsight").textContent = levelText(credit.level || "Starter");
    setScoreRing(credit.score || 600);

    byId("creditLimit").textContent = formatMoney(credit.creditLimit || 0);
    byId("usedAmount").textContent = formatMoney(credit.usedAmount || 0);
    byId("availableAmount").textContent = formatMoney(credit.availableAmount || 0);
    setCapacity(credit.creditLimit || 0, credit.usedAmount || 0);

    byId("totalOrders").textContent = String(Number(credit.totalOrders || 0));
    byId("deliveredOrders").textContent = String(Number(credit.deliveredOrders || 0));
    byId("cancelledOrders").textContent = String(Number(credit.cancelledOrders || 0));
    byId("deliveredSpend").textContent = formatMoney(credit.totalDeliveredSpend || 0);

    byId("lastCalculated").textContent = formatDate(credit.lastCalculatedAt);
  }

  async function loadCreditProfile() {
    const userId = ensureAuth();
    if (!userId) {
      return;
    }

    const statusEl = byId("creditStatus");
    statusEl.textContent = "Loading your credit profile...";

    try {
      const response = await API.fetchWithAuth(API.api(`users/${userId}/credit-profile`));
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          statusEl.innerHTML = 'Your session expired. <a href="login.html">Login again</a>';
          return;
        }
        throw new Error(data.message || "Unable to load credit profile");
      }

      updateUi(data);
      statusEl.textContent = "Credit profile loaded successfully.";
    } catch (error) {
      statusEl.textContent = error.message || "Unable to load credit profile";
    }
  }

  document.addEventListener("DOMContentLoaded", loadCreditProfile);
})();
