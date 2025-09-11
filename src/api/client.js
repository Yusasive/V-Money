import axios from "axios";

// Centralized API base URL with smart defaulting
function resolveApiBaseUrl() {
  const envUrl =
    process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL;
  if (envUrl) return envUrl;

  try {
    if (typeof window !== "undefined") {
      const { hostname } = window.location;
      const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
      const port = window.location.port;
      
      if (isLocal) {
        return `http://localhost:5000/api`;
      }
      
      // For production, use relative path or current origin
      return `${window.location.origin}/api`;
    }
  } catch {}
  return "http://localhost:5000/api";
}

const API_BASE_URL = resolveApiBaseUrl();

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
  retryDelay: 1000
});

// Request retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Retry on network errors or 5xx errors
    if (
      config &&
      !config.__isRetryRequest &&
      (error.code === 'NETWORK_ERROR' || 
       error.code === 'ECONNABORTED' ||
       (error.response?.status >= 500 && error.response?.status < 600))
    ) {
      config.__isRetryRequest = true;
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount < (config.retry || 3)) {
        config.__retryCount++;
        const delay = config.retryDelay || 1000;
        
        console.log(`Retrying request (${config.__retryCount}/${config.retry}) after ${delay}ms`);
        
        return new Promise(resolve => {
          setTimeout(() => resolve(api(config)), delay * config.__retryCount);
        });
      }
    }
    
    return Promise.reject(error);
  }
);

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
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
}, (error) => {
  console.error("Request interceptor error:", error);
  return Promise.reject(error);
});

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const config = error.config;
    
    // Don't redirect on auth endpoints to avoid loops
    const isAuthEndpoint = config?.url?.includes('/auth/');
    
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
      console.error('API Error:', {
        status,
        message,
        url: config?.url,
        method: config?.method
      });
    }
    
    return Promise.reject(error);
  }
);

// Add request/response logging in development
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(request => {
    console.log('API Request:', request.method?.toUpperCase(), request.url);
    return request;
  });
  
  api.interceptors.response.use(
    response => {
      console.log('API Response:', response.status, response.config.url);
      return response;
    },
    error => {
      console.log('API Error:', error.response?.status, error.config?.url, error.message);
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
  validateToken: (token) => api.post("/auth/validate", { token })
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
  invalidateSession: (id, sessionId) => api.delete(`/users/${id}/sessions/${sessionId}`)
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
  addTransaction: (id, transactionData) =>
    api.post(`/merchants/${id}/transactions`, transactionData),
  getTransactions: (id, params = {}) =>
    api.get(`/merchants/${id}/transactions`, { params }),
  flagged: () => api.get("/merchants/flagged"),
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
      timeout: 60000 // 60 seconds for file uploads
    }),
  list: (params = {}) => api.get("/forms", { params }),
  get: (id) => api.get(`/forms/${id}`),
  getMine: () => api.get(`/forms/mine/latest`),
  update: (id, data) => api.patch(`/forms/${id}`, data),
  remove: (id) => api.delete(`/forms/${id}`),
};

// ---- Upload API ----
export const uploadApi = {
  single: (formData) =>
    api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000 // 2 minutes for file uploads
    }),
  multiple: (formData) =>
    api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000 // 2 minutes for file uploads
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
  verify2FA: (code) => api.post("/auth/2fa/verify", { code })
};

// Export configured axios instance
export default api;
