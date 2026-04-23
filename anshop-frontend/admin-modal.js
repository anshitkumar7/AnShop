// Professional Admin Password Modal System
// This handles password verification across all pages

function createAdminPasswordModal() {
  // Check if modal already exists
  if (document.getElementById("globalAdminPasswordModal")) {
    return;
  }

  const modalHTML = `
    <div id="globalAdminPasswordModal" class="global-admin-modal-overlay">
      <div class="global-admin-modal-box">
        <div class="global-admin-modal-header">
          <h2>&#128274; Admin Access</h2>
          <button type="button" class="global-admin-modal-close" id="globalClosePasswordModal">&times;</button>
        </div>
        <div class="global-admin-modal-body">
          <p>Enter your admin password to continue</p>
          <input type="password" id="globalAdminPasswordInput" placeholder="Enter password" class="global-admin-password-input">
          <div id="globalPasswordErrorMsg" class="global-admin-error-message"></div>
        </div>
        <div class="global-admin-modal-footer">
          <button type="button" id="globalSubmitPassword" class="global-admin-btn-primary">Verify Password</button>
          <button type="button" id="globalCancelPassword" class="global-admin-btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  `;

  const CSS = `
    .global-admin-modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 18% 14%, rgba(214, 90, 122, 0.2), rgba(0, 0, 0, 0) 42%), rgba(6, 6, 8, 0.72);
      backdrop-filter: blur(10px);
      z-index: 99999;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .global-admin-modal-overlay.active {
      display: flex;
    }

    .global-admin-modal-box {
      background: linear-gradient(180deg, rgba(20, 16, 20, 0.96) 0%, rgba(13, 11, 13, 0.98) 100%);
      border: 1px solid rgba(214, 90, 122, 0.34);
      border-radius: 20px;
      box-shadow: 0 26px 70px rgba(0, 0, 0, 0.62), 0 0 0 1px rgba(214, 90, 122, 0.14) inset;
      max-width: 520px;
      width: 100%;
      overflow: hidden;
      animation: globalSlideUp 0.28s ease-out;
    }

    @keyframes globalSlideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .global-admin-modal-header {
      background: linear-gradient(135deg, #7c182a 0%, #aa2b44 56%, #d65a7a 100%);
      color: #ffffff;
      padding: 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }

    .global-admin-modal-header h2 {
      margin: 0;
      font-size: 38px;
      line-height: 1;
      letter-spacing: 0.2px;
      font-weight: 700;
    }

    .global-admin-modal-close {
      background: rgba(11, 10, 21, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 38px;
      cursor: pointer;
      padding: 0;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
    }

    .global-admin-modal-close:hover {
      background: rgba(11, 10, 21, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 10px 18px rgba(11, 10, 21, 0.24);
    }

    .global-admin-modal-body {
      padding: 24px 22px 16px;
      background: linear-gradient(180deg, rgba(22, 18, 22, 0.98) 0%, rgba(14, 12, 14, 0.98) 100%);
    }

    .global-admin-modal-body p {
      margin: 0 0 14px;
      color: #f0d6de !important;
      font-size: 15px;
      font-weight: 600;
      line-height: 1.5;
    }

    .global-admin-password-input {
      width: 100%;
      padding: 13px 14px;
      border: 1px solid rgba(214, 90, 122, 0.5) !important;
      border-radius: 12px;
      font-size: 17px;
      font-family: inherit;
      transition: all 0.2s;
      box-sizing: border-box;
      background: #151418 !important;
      color: #fff4f8 !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 0 0 3px rgba(214, 90, 122, 0.2);
    }

    .global-admin-password-input::placeholder {
      color: #b8a1aa !important;
      opacity: 1;
    }

    .global-admin-password-input:focus {
      outline: none;
      border-color: #d65a7a !important;
      box-shadow: 0 0 0 4px rgba(214, 90, 122, 0.24), 0 10px 22px rgba(78, 17, 31, 0.24);
      background: #17151a !important;
    }

    .global-admin-error-message {
      margin-top: 12px;
      color: #ffd7e2;
      font-size: 13px;
      display: none;
      padding: 10px 12px;
      background: rgba(208, 42, 86, 0.16);
      border-radius: 10px;
      border: 1px solid rgba(208, 42, 86, 0.3);
    }

    .global-admin-error-message.show {
      display: block;
    }

    .global-admin-modal-footer {
      padding: 18px 22px 22px;
      background: linear-gradient(180deg, rgba(17, 14, 17, 0.98) 0%, rgba(12, 10, 12, 0.98) 100%);
      border-top: 1px solid rgba(214, 90, 122, 0.24);
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .global-admin-btn-primary {
      flex: 1;
      padding: 12px 20px;
      background: linear-gradient(135deg, #7a1829 0%, #a72942 55%, #d65a7a 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(214, 90, 122, 0.4) !important;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      font-size: 15px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .global-admin-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(122, 24, 41, 0.34);
    }

    .global-admin-btn-primary:active {
      transform: translateY(0);
    }

    .global-admin-btn-secondary {
      padding: 12px 24px;
      background: #171419 !important;
      color: #f1d7df !important;
      border: 1px solid rgba(214, 90, 122, 0.34) !important;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      font-size: 15px;
      transition: all 0.2s;
    }

    .global-admin-btn-secondary:hover {
      background: #221a20 !important;
      border-color: rgba(214, 90, 122, 0.5) !important;
    }

    body.dark-mode .global-admin-modal-box {
      background: linear-gradient(180deg, rgba(20, 16, 20, 0.96) 0%, rgba(13, 11, 13, 0.98) 100%);
      border-color: rgba(214, 90, 122, 0.34);
      box-shadow: 0 26px 70px rgba(0, 0, 0, 0.62), 0 0 0 1px rgba(214, 90, 122, 0.15) inset;
    }

    body.dark-mode .global-admin-modal-body {
      background: linear-gradient(180deg, rgba(22, 18, 22, 0.98) 0%, rgba(14, 12, 14, 0.98) 100%);
    }

    body.dark-mode .global-admin-modal-body p {
      color: #f0d6de !important;
    }

    body.dark-mode .global-admin-modal-footer {
      background: linear-gradient(180deg, rgba(17, 14, 17, 0.98) 0%, rgba(12, 10, 12, 0.98) 100%);
      border-top-color: rgba(214, 90, 122, 0.24);
    }

    body.dark-mode .global-admin-password-input {
      background: #151418 !important;
      color: #fff4f8 !important;
      border-color: rgba(214, 90, 122, 0.5) !important;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 0 0 3px rgba(214, 90, 122, 0.2);
    }

    body.dark-mode .global-admin-password-input::placeholder {
      color: #b8a1aa !important;
    }

    body.dark-mode .global-admin-btn-secondary {
      background: #171419 !important;
      color: #f1d7df !important;
      border-color: rgba(214, 90, 122, 0.34) !important;
    }

    @media (max-width: 640px) {
      .global-admin-modal-box {
        max-width: 92vw;
      }

      .global-admin-modal-header {
        padding: 18px;
      }

      .global-admin-modal-header h2 {
        font-size: 32px;
      }

      .global-admin-modal-body,
      .global-admin-modal-footer {
        padding-left: 16px;
        padding-right: 16px;
      }
    }
  `;

  // Add CSS to head
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  // Add Modal HTML to body
  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  // Get elements
  const modal = document.getElementById("globalAdminPasswordModal");
  const passwordInput = document.getElementById("globalAdminPasswordInput");
  const submitBtn = document.getElementById("globalSubmitPassword");
  const cancelBtn = document.getElementById("globalCancelPassword");
  const closeBtn = document.getElementById("globalClosePasswordModal");
  const errorMsg = document.getElementById("globalPasswordErrorMsg");

  // Event listeners
  submitBtn.addEventListener("click", handlePasswordSubmit);
  cancelBtn.addEventListener("click", closePasswordModal);
  closeBtn.addEventListener("click", closePasswordModal);
  passwordInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      handlePasswordSubmit();
    }
  });

  function showPasswordModal() {
    modal.classList.add("active");
    passwordInput.focus();
    passwordInput.value = "";
    errorMsg.classList.remove("show");
    errorMsg.textContent = "";
    submitBtn.disabled = false;
    submitBtn.textContent = "Verify Password";
  }

  function closePasswordModal() {
    modal.classList.remove("active");
    passwordInput.value = "";
    errorMsg.classList.remove("show");
  }

  async function handlePasswordSubmit() {
    const entered = passwordInput.value;
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    const api = window.ANSHOP_API || {
      api: path => `${window.location.origin}/api/v1/${String(path || "").replace(/^\/+/, "")}`
    };

    if (!entered.trim()) {
      errorMsg.textContent = "Please enter admin password.";
      errorMsg.classList.add("show");
      passwordInput.focus();
      return;
    }

    if (!token) {
      errorMsg.textContent = "Session expired. Please login again.";
      errorMsg.classList.add("show");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying...";
    errorMsg.classList.remove("show");

    try {
      const response = await fetch(api.api("users/admin/verify-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: entered })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        errorMsg.textContent = data.message || "Password verification failed.";
        errorMsg.classList.add("show");
        passwordInput.value = "";
        passwordInput.focus();
        return;
      }

      closePasswordModal();
      window.location.href = "admin.html";
    } catch (error) {
      errorMsg.textContent = "Could not verify password. Try again.";
      errorMsg.classList.add("show");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Verify Password";
    }
  }

  // Return public API
  return {
    show: showPasswordModal,
    close: closePasswordModal
  };
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

function resolveRoleFromToken() {
  const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
  if (token && !localStorage.getItem("authToken")) {
    localStorage.setItem("authToken", token);
  }

  const payload = decodeTokenPayload(token);
  const role = String((payload && payload.role) || "").trim().toLowerCase();
  return role === "admin" ? "admin" : "user";
}

function showAdminAccessToast(message) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("toast-success", "toast-error", "toast-info");
  toast.classList.add("toast-error", "show");
  clearTimeout(showAdminAccessToast.timer);
  showAdminAccessToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

// Initialize modal when DOM is ready
let adminModalAPI = null;
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    adminModalAPI = createAdminPasswordModal();
  });
} else {
  adminModalAPI = createAdminPasswordModal();
}

// Replace openAdminPanel function on all pages
function openAdminPanel(event) {
  event.preventDefault();
  const role = resolveRoleFromToken();

  if (role === "admin") {
    if (adminModalAPI) {
      adminModalAPI.show();
    }
    return false;
  }

  showAdminAccessToast("Admin account required.");
  return false;
}
