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
      return isLocal ? "http://localhost:5000/api" : "/api";
    }
  } catch {}
  return "http://localhost:5000/api";
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({ 
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (e) {
    console.error("Error in request interceptor:", e);
  }
  return config;
});

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ---- Authentication API ----
export const authApi = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  changePassword: (data) => api.post("/auth/change-password", data),
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
  escalate: (id) => api.patch(`/disputes/${id}`, { status: 'escalated' }),
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
    }),
  list: (params = {}) => api.get("/forms", { params }),
  get: (id) => api.get(`/forms/${id}`),
  update: (id, data) => api.patch(`/forms/${id}`, data),
  remove: (id) => api.delete(`/forms/${id}`),
};

// ---- Upload API ----
export const uploadApi = {
  single: (formData) =>
    api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  multiple: (formData) =>
    api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: (nextCursor) =>
    api.get("/upload/list", { params: nextCursor ? { nextCursor } : {} }),
};

// ---- Health Check API ----
export const healthApi = {
  basic: () => api.get("/health"),
  detailed: () => api.get("/health/detailed"),
};

export default api;