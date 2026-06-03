const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const apiCall = async (path, options = {}) => {
  const token = sessionStorage.getItem("cf_token");
  const csrfToken = sessionStorage.getItem("cf_csrf");

  // Construct headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Inject CSRF token for state-changing HTTP requests
  const method = options.method ? options.method.toUpperCase() : "GET";
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method) && csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      method,
      headers,
    });

    if (response.status === 401) {
      // Clear credentials if token expires or is invalid
      sessionStorage.removeItem("cf_token");
      sessionStorage.removeItem("cf_csrf");
      sessionStorage.removeItem("cf_user");
      window.dispatchEvent(new Event("auth_expired"));
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let msg = "An error occurred on the server.";
      const detail = errorData.detail;
      if (detail) {
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : "";
            return `${field ? field + ": " : ""}${err.msg}`;
          }).join("; ");
        } else if (typeof detail === "object") {
          msg = JSON.stringify(detail);
        } else {
          msg = String(detail);
        }
      }
      throw new Error(msg);
    }

    if (response.status === 204) {
      return true;
    }
    
    return await response.json();
  } catch (error) {
    logger.error("API Call failed:", error);
    throw error;
  }
};

// Logger fallback to avoid compilation reference issues
const logger = {
  error: (...args) => console.error("[API_ERROR]", ...args),
};
