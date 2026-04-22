(function (window) {
  var isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  var DEFAULT_ORIGIN = isLocalhost ? "http://localhost:5000" : window.location.origin;
  var configuredOrigin = window.__ANSHOP_API_ORIGIN__ || DEFAULT_ORIGIN;
  var origin = String(configuredOrigin).replace(/\/+$/, "");
  var base = origin + "/api/v1";

  function toPath(segment) {
    return String(segment || "").replace(/^\/+/, "");
  }

  function resolveImage(imageValue, fallback) {
    var imagePath = String(imageValue || "").trim();
    var fallbackPath = fallback || "https://via.placeholder.com/400?text=No+Image";

    if (!imagePath) {
      return fallbackPath;
    }

    if (imagePath.indexOf("http://") === 0 || imagePath.indexOf("https://") === 0 || imagePath.indexOf("data:") === 0) {
      return imagePath;
    }

    if (
      imagePath.indexOf("image/") === 0 ||
      imagePath.indexOf("images/") === 0 ||
      imagePath.indexOf("./image/") === 0 ||
      imagePath.indexOf("./images/") === 0 ||
      imagePath.indexOf("../image/") === 0 ||
      imagePath.indexOf("../images/") === 0
    ) {
      return imagePath;
    }

    if (imagePath.indexOf("/") === 0) {
      if (imagePath.indexOf("/image/") === 0 || imagePath.indexOf("/images/") === 0) {
        return imagePath;
      }
      return origin + imagePath;
    }

    return origin + "/images/" + imagePath;
  }

  // ===== STEP 5: Wrapper function to add JWT token to all requests =====
  function apiWithAuth(path) {
    return base + "/" + toPath(path);
  }

  // Make authenticated fetch requests with automatic token inclusion
  function fetchWithAuth(url, options = {}) {
    var token = localStorage.getItem("authToken") || localStorage.getItem("token");
    var headers = options.headers || {};

    if (token && !localStorage.getItem("authToken")) {
      localStorage.setItem("authToken", token);
    }

    // Add Authorization header if token exists
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }

    // Ensure Content-Type is set
    if (!headers["Content-Type"] && options.body) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(url, Object.assign({}, options, { headers: headers }));
  }

  window.ANSHOP_API = {
    ORIGIN: origin,
    BASE: base,
    api: function (path) {
      return base + "/" + toPath(path);
    },
    // NEW: Use this for requests that need authentication
    fetchWithAuth: fetchWithAuth,
    apiWithAuth: apiWithAuth,
    resolveImage: resolveImage
  };
})(window);
