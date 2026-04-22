(function () {
  const API = window.ANSHOP_API || {
    api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`,
    fetchWithAuth: (url, options) => fetch(url, options)
  };

  const statusEl = document.getElementById("creditAdminStatus");
  const tableBody = document.getElementById("creditTableBody");
  const refreshBtn = document.getElementById("refreshCreditBtn");
  const searchInput = document.getElementById("creditSearchInput");

  const statProfiles = document.getElementById("statProfiles");
  const statAvgScore = document.getElementById("statAvgScore");
  const statRiskUsers = document.getElementById("statRiskUsers");
  const statExposure = document.getElementById("statExposure");
  const refreshDefaultText = refreshBtn ? refreshBtn.textContent : "Refresh";

  let allUsers = [];

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

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function getRiskBadge(score, cancelledOrders) {
    const safeScore = Number(score || 0);
    const safeCancelled = Number(cancelledOrders || 0);

    if (safeScore < 550 || safeCancelled >= 5) {
      return '<span class="risk-pill high">High</span>';
    }

    if (safeScore < 700 || safeCancelled >= 2) {
      return '<span class="risk-pill medium">Medium</span>';
    }

    return '<span class="risk-pill safe">Low</span>';
  }

  function calculateStats(users) {
    const total = users.length;
    const avgScore = total
      ? Math.round(users.reduce((sum, user) => sum + (Number(user.creditProfile && user.creditProfile.score) || 0), 0) / total)
      : 0;
    const riskUsers = users.filter(user => {
      const score = Number(user.creditProfile && user.creditProfile.score) || 0;
      const cancelled = Number(user.creditProfile && user.creditProfile.cancelledOrders) || 0;
      return score < 550 || cancelled >= 5;
    }).length;
    const exposure = users.reduce((sum, user) => sum + (Number(user.creditProfile && user.creditProfile.usedAmount) || 0), 0);

    statProfiles.textContent = String(total);
    statAvgScore.textContent = String(avgScore);
    statRiskUsers.textContent = String(riskUsers);
    statExposure.textContent = formatMoney(exposure);
  }

  function renderTable(users) {
    if (!users.length) {
      tableBody.innerHTML = "";
      statusEl.textContent = "No credit profiles found.";
      calculateStats(users);
      return;
    }

    tableBody.innerHTML = users
      .map(user => {
        const credit = user.creditProfile || {};
        return `
          <tr>
            <td>
              <strong>${user.name || "-"}</strong><br>
              <small>${user.email || "-"}</small>
            </td>
            <td><span class="score-pill">${Number(credit.score || 600)}</span></td>
            <td><span class="level-pill">${credit.level || "Starter"}</span><br>${getRiskBadge(credit.score, credit.cancelledOrders)}</td>
            <td>${formatMoney(credit.creditLimit || 0)}</td>
            <td>${formatMoney(credit.usedAmount || 0)}</td>
            <td>${formatMoney(credit.availableAmount || 0)}</td>
            <td>${Number(credit.totalOrders || 0)} / Delivered: ${Number(credit.deliveredOrders || 0)}<br><small>Cancelled: ${Number(credit.cancelledOrders || 0)}</small></td>
            <td>${formatMoney(credit.totalDeliveredSpend || 0)}</td>
            <td>${formatDate(credit.lastCalculatedAt)}</td>
            <td><button type="button" class="recalc-btn" data-user-id="${user._id}">Recalculate</button></td>
          </tr>
        `;
      })
      .join("");

    statusEl.textContent = `Showing ${users.length} credit profiles.`;
    calculateStats(users);
  }

  function applySearch() {
    const term = String(searchInput.value || "").trim().toLowerCase();
    if (!term) {
      renderTable(allUsers);
      return;
    }

    const filtered = allUsers.filter(user => {
      const name = String(user.name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });

    renderTable(filtered);
  }

  function setRefreshState(isLoading) {
    if (!refreshBtn) {
      return;
    }

    refreshBtn.disabled = isLoading;
    refreshBtn.textContent = isLoading ? "Refreshing..." : refreshDefaultText;
    refreshBtn.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  async function loadCreditProfiles() {
    statusEl.textContent = "Loading credit profiles...";
    setRefreshState(true);

    try {
      const response = await API.fetchWithAuth(API.api("users/admin/credit-profiles"));
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load credit profiles");
      }

      allUsers = Array.isArray(data.users) ? data.users : [];
      renderTable(allUsers);
    } catch (error) {
      tableBody.innerHTML = "";
      statusEl.textContent = error.message || "Unable to load credit profiles";
      calculateStats([]);
    } finally {
      setRefreshState(false);
    }
  }

  async function recalculateForUser(userId, triggerButton) {
    statusEl.textContent = "Recalculating user credit profile...";

    if (triggerButton) {
      triggerButton.disabled = true;
      triggerButton.textContent = "Recalculating...";
      triggerButton.setAttribute("aria-busy", "true");
    }

    try {
      const response = await API.fetchWithAuth(API.api(`users/${userId}/credit-profile/recalculate`), {
        method: "POST"
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to recalculate profile");
      }

      await loadCreditProfiles();
      statusEl.textContent = "Credit profile recalculated successfully.";
    } catch (error) {
      statusEl.textContent = error.message || "Unable to recalculate profile";
      if (triggerButton) {
        triggerButton.disabled = false;
        triggerButton.textContent = "Recalculate";
        triggerButton.setAttribute("aria-busy", "false");
      }
    }
  }

  function enforceAdminAuth() {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "admin") {
      window.location.href = "index.html";
      return false;
    }

    return true;
  }

  function init() {
    if (!enforceAdminAuth()) {
      return;
    }

    refreshBtn.addEventListener("click", loadCreditProfiles);
    searchInput.addEventListener("input", applySearch);
    tableBody.addEventListener("click", function (event) {
      const button = event.target.closest(".recalc-btn");
      if (!button) {
        return;
      }

      const userId = button.getAttribute("data-user-id");
      if (!userId) {
        return;
      }

      recalculateForUser(userId, button);
    });

    loadCreditProfiles();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
