import axios from "axios";

// Simple in-memory cache for GET requests
const apiCache = new Map();
const cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Queue for rate limiting
const requestQueue = [];
let processingQueue = false;

// Override XMLHttpRequest to suppress specific network errors in DevTools
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function () {
  const xhr = new originalXHR();
  const originalOpen = xhr.open;
  const originalSend = xhr.send;

  let requestUrl = "";

  xhr.open = function (method, url, ...args) {
    requestUrl = url;
    return originalOpen.apply(this, [method, url, ...args]);
  };

  xhr.send = function (...args) {
    // Check if this is a request we want to silence
    if (requestUrl.includes("/forms/mine/latest")) {
      // Suppress console errors for this specific endpoint
      const originalConsoleError = console.error;
      console.error = function (...errorArgs) {
        const errorString = errorArgs.join(" ");
        if (errorString.includes("404") && errorString.includes(requestUrl)) {
          // Don't log this specific 404 error
          return;
        }
        originalConsoleError.apply(console, errorArgs);
      };

      // Restore console.error after the request completes
      xhr.addEventListener("loadend", () => {
        setTimeout(() => {
          console.error = originalConsoleError;
        }, 100);
      });
    }

    return originalSend.apply(this, args);
  };

  return xhr;
};

// Centralized API base URL with smart defaulting
function resolveApiBaseUrl() {
  const envUrl =
    process.env.REACT_APP_API_URL || "https://vmonie-server.onrender.com/api";
  if (envUrl) return envUrl;

  try {
    if (typeof window !== "undefined") {
      const { hostname } = window.location;
      const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
      // const port = window.location.port; // not used; retained comment for potential future debugging

      if (isLocal) {
        return `https://vmonie-server.onrender.com/api`;
      }

      // For production, use relative path or current origin
      return `${window.location.origin}/api`;
    }
  } catch {}
  return "https://vmonie-server.onrender.com/api";
}

const API_BASE_URL = resolveApiBaseUrl();

// Function to process the request queue (one request at a time with delay)
async function processQueue() {
  if (processingQueue || requestQueue.length === 0) return;

  processingQueue = true;

  try {
    const { config, resolve, reject } = requestQueue.shift();

    // Add a timestamp to the request for cache key generation
    const cacheKey =
      config.method === "get"
        ? `${config.url}${JSON.stringify(config.params || {})}`
        : null;

    // Check cache for GET requests
    if (cacheKey && apiCache.has(cacheKey)) {
      const cachedData = apiCache.get(cacheKey);
      if (Date.now() < cachedData.expiry) {
        console.log("Using cached response for", config.url);
        resolve(cachedData.response);
        processingQueue = false;
        setTimeout(processQueue, 50); // Process next request with minimal delay
        return;
      } else {
        // Cache expired, remove it
        apiCache.delete(cacheKey);
      }
    }

    // Execute the request
    try {
      const response = await axios(config);

      // Cache successful GET responses
      if (cacheKey) {
        apiCache.set(cacheKey, {
          response,
          expiry: Date.now() + cacheTTL,
        });
      }

      resolve(response);
    } catch (error) {
      reject(error);
    }
  } catch (err) {
    console.error("Error processing request queue:", err);
  } finally {
    processingQueue = false;

    // Wait between requests to avoid rate limiting
    setTimeout(() => {
      processQueue();
    }, 500); // 500ms delay between requests
  }
}

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased for production
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  // Retry configuration
  retry: 3,
  retryDelay: 1000,
});

// Create a custom console logger that can be silenced for specific patterns
const customLogger = {
  // List of URL patterns to suppress logging for
  suppressPatterns: ["/forms/mine/latest", "/merchants/me/latest"],

  // Check if a URL should be silenced
  shouldSuppress(url) {
    if (!url) return false;
    return this.suppressPatterns.some((pattern) => url.includes(pattern));
  },

  // Custom log methods that check for suppression
  log(...args) {
    const url = this.extractUrl(args);
    if (url && this.shouldSuppress(url)) return;
    console.log(...args);
  },

  error(...args) {
    const url = this.extractUrl(args);
    if (url && this.shouldSuppress(url)) return;
    console.error(...args);
  },

  // Helper to extract URL from common error logging patterns
  extractUrl(args) {
    if (!args || args.length === 0) return null;

    // Check for URL in API error object format
    if (args[0] === "API Error:" && args[1]?.url) {
      return args[1].url;
    }

    // Check for URL in standard error format
    if (args[0] === "API Error:" && args.length >= 3) {
      return args[2]; // Third argument in standard error format
    }

    return null;
  },
};

// Override axios' request method to use our queue
const originalRequest = api.request;
api.request = function (config) {
  // Skip queuing for authentication requests to prevent login issues
  if (
    config.url?.includes("/auth/") &&
    (config.method === "post" || config.method === "get")
  ) {
    return originalRequest.call(this, config);
  }

  return new Promise((resolve, reject) => {
    // Add to queue
    requestQueue.push({
      config,
      resolve,
      reject,
    });

    // Start processing queue if not already running
    processQueue();
  });
};

// Request retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Handle rate limiting (429) errors
    if (error.response?.status === 429) {
      console.log("Rate limited. Adding delay before retry.");
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < 3) {
        config.__retryCount++;
        // Exponential backoff with longer delays for rate limiting
        const delay = 1000 * Math.pow(3, config.__retryCount);

        console.log(
          `Rate limit retry (${config.__retryCount}/3) after ${delay}ms`
        );

        return new Promise((resolve) => {
          setTimeout(() => resolve(api(config)), delay);
        });
      }
    }

    // Retry on network errors or 5xx errors
    if (
      config &&
      !config.__isRetryRequest &&
      (error.code === "NETWORK_ERROR" ||
        error.code === "ECONNABORTED" ||
        (error.response?.status >= 500 && error.response?.status < 600))
    ) {
      config.__isRetryRequest = true;
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < (config.retry || 3)) {
        config.__retryCount++;
        const delay = config.retryDelay || 1000;

        console.log(
          `Retrying request (${config.__retryCount}/${config.retry}) after ${delay}ms`
        );

        return new Promise((resolve) => {
          setTimeout(() => resolve(api(config)), delay * config.__retryCount);
        });
      }
    }

    return Promise.reject(error);
  }
);

// Attach token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers = config.headers || {};
        config.headers["Authorization"] = `Bearer ${token}`;

        // Add request timestamp for debugging
        config.headers["X-Request-Time"] = new Date().toISOString();

        // Add client info for security
        config.headers["X-Client-Version"] = "2.0.0";
      }
    } catch (e) {
      console.error("Error in request interceptor:", e);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const config = error.config;

    // Don't redirect on auth endpoints to avoid loops
    const isAuthEndpoint = config?.url?.includes("/auth/");

    if (status === 401) {
      // Clear token for any 401. If token expired, redirect with a reason so UI can show a friendly message
      localStorage.removeItem("authToken");

      if (!isAuthEndpoint) {
        if (message === "Token expired" || message === "Session invalidated") {
          window.location.href = "/login?reason=expired";
        } else {
          window.location.href = "/login";
        }
      }
    }

    // Handle account status errors
    if (status === 403) {
      if (message === "Account suspended") {
        window.location.href = "/login?reason=expired";
      } else if (message === "Account rejected") {
        window.location.href = "/login?reason=rejected";
      } else if (message === "Account not approved") {
        window.location.href = "/login?reason=pending";
      }
    }

    // Log errors for debugging
    if (status >= 400) {
      // Skip logging 404 errors for known endpoints that might legitimately return 404
      const skip404Logging =
        status === 404 &&
        (config?.url?.includes("/forms/mine/latest") ||
          config?.url?.includes("/merchants/me/latest"));

      if (!skip404Logging) {
        customLogger.error("API Error:", {
          status,
          message,
          url: config?.url,
          method: config?.method,
        });
      }
    }

    return Promise.reject(error);
  }
);

// Add request/response logging in development
if (process.env.NODE_ENV === "development") {
  api.interceptors.request.use((request) => {
    // Skip logging requests to endpoints that commonly return 404
    if (!customLogger.shouldSuppress(request.url)) {
      customLogger.log(
        "API Request:",
        request.method?.toUpperCase(),
        request.url
      );
    }
    return request;
  });

  api.interceptors.response.use(
    (response) => {
      // Don't log 404 responses for specific endpoints
      if (!customLogger.shouldSuppress(response.config.url)) {
        customLogger.log("API Response:", response.status, response.config.url);
      }
      return response;
    },
    (error) => {
      // Skip logging 404 errors for known endpoints
      const skip404Logging =
        error.response?.status === 404 &&
        (error.config?.url?.includes("/forms/mine/latest") ||
          error.config?.url?.includes("/merchants/me/latest"));

      if (!skip404Logging) {
        customLogger.error(
          "API Error:",
          error.response?.status,
          error.config?.url,
          error.message
        );
      }
      return Promise.reject(error);
    }
  );
}

// ---- Authentication API ----
export const authApi = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  logoutAll: () => api.post("/auth/logout-all"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  changePassword: (data) => api.post("/auth/change-password", data),
  refreshToken: () => api.post("/auth/refresh"),
  validateToken: (token) => api.post("/auth/validate", { token }),
};

// ---- User Management API ----
export const usersApi = {
  list: (params = {}) => api.get("/users", { params }),
  get: (id) => api.get(`/users/${id}`),
  approve: (id) => api.patch(`/users/${id}/approve`),
  reject: (id, reason) => api.patch(`/users/${id}/reject`, { reason }),
  suspend: (id, reason) => api.patch(`/users/${id}/suspend`, { reason }),
  activate: (id) => api.patch(`/users/${id}/activate`),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getSessions: (id) => api.get(`/users/${id}/sessions`),
  invalidateSession: (id, sessionId) =>
    api.delete(`/users/${id}/sessions/${sessionId}`),
};

// ---- Tasks API ----
export const tasksApi = {
  list: (params = {}) => api.get("/tasks", { params }),
  create: (taskData) => api.post("/tasks", taskData),
  get: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  markDone: (id) => api.patch(`/tasks/${id}/done`),
  approve: (id) => api.patch(`/tasks/${id}/approve`),
  reject: (id, reason) => api.patch(`/tasks/${id}/reject`, { reason }),
  delete: (id) => api.delete(`/tasks/${id}`),
  assigned: () => api.get("/tasks/assigned"),
};

// ---- Disputes API ----
export const disputesApi = {
  list: (params = {}) => api.get("/disputes", { params }),
  create: (disputeData) => api.post("/disputes", disputeData),
  get: (id) => api.get(`/disputes/${id}`),
  update: (id, data) => api.patch(`/disputes/${id}`, data),
  respond: (id, response) => api.post(`/disputes/${id}/respond`, { response }),
  close: (id) => api.patch(`/disputes/${id}/close`),
  escalate: (id) => api.patch(`/disputes/${id}`, { status: "escalated" }),
  delete: (id) => api.delete(`/disputes/${id}`),
};

// ---- Merchants API ----
export const merchantsApi = {
  list: (params = {}) => api.get("/merchants", { params }),
  create: (merchantData) => api.post("/merchants", merchantData),
  get: (id) => api.get(`/merchants/${id}`),
  update: (id, data) => api.patch(`/merchants/${id}`, data),
  updateMe: (data) => api.patch("/merchants/me", data),
  delete: (id) => api.delete(`/merchants/${id}`),
  addTransaction: (id, transactionData) =>
    api.post(`/merchants/${id}/transactions`, transactionData),
  updateTransaction: (transactionId, data) =>
    api.patch(`/merchants/transactions/${transactionId}`, data),
  getTransactions: (id, params = {}) =>
    api.get(`/merchants/${id}/transactions`, { params }),
  allTransactions: (params = {}) =>
    api.get(`/merchants/all-transactions`, { params }),
  flagged: (params = {}) => api.get("/merchants/flagged", { params }),
};

// ---- Analytics API ----
export const analyticsApi = {
  overview: () => api.get("/analytics/overview"),
  userStats: () => api.get("/analytics/users"),
  taskStats: () => api.get("/analytics/tasks"),
  disputeStats: () => api.get("/analytics/disputes"),
  merchantStats: () => api.get("/analytics/merchants"),
};

// ---- Content API ----
export const contentApi = {
  list: () => api.get("/content"),
  get: (section) => api.get(`/content/${section}`),
  save: (section, payload) => api.post(`/content/${section}`, payload),
  delete: (section) => api.delete(`/content/${section}`),
};

// ---- Forms API ----
export const formsApi = {
  submit: (formData) =>
    api.post("/forms/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000, // 60 seconds for file uploads
    }),
  list: (params = {}) => api.get("/forms", { params }),
  get: (id) => api.get(`/forms/${id}`),
  getMine: () =>
    api.get(`/forms/mine/latest`, {
      validateStatus: (status) => {
        // Only throw error if status code is not 404 and not 2xx
        return (status >= 200 && status < 300) || status === 404;
      },
      // Silence any console errors from XMLHttpRequest
      silenceConsoleErrors: true,
      headers: {
        "X-Silence-Errors": "true", // Custom header to identify requests we want to silence
      },
    }),
  update: (id, data) => api.patch(`/forms/${id}`, data),
  remove: (id) => api.delete(`/forms/${id}`),
};

// ---- Upload API ----
export const uploadApi = {
  single: (formData) =>
    api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 minutes for file uploads
    }),
  multiple: (formData) =>
    api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 minutes for file uploads
    }),
  list: (nextCursor) =>
    api.get("/upload/list", { params: nextCursor ? { nextCursor } : {} }),
};

// ---- Health Check API ----
export const healthApi = {
  basic: () => api.get("/health"),
  detailed: () => api.get("/health/detailed"),
};

// ---- Security API ----
export const securityApi = {
  getSessions: () => api.get("/auth/sessions"),
  invalidateSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  invalidateAllSessions: () => api.delete("/auth/sessions"),
  changePassword: (data) => api.post("/auth/change-password", data),
  enable2FA: () => api.post("/auth/2fa/enable"),
  disable2FA: (code) => api.post("/auth/2fa/disable", { code }),
  verify2FA: (code) => api.post("/auth/2fa/verify", { code }),
};

// Export configured axios instance
export default api;
