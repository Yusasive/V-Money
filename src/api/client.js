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
      return isLocal ? "http://localhost:5000/api" : "/api"; // same-origin in prod
    }
  } catch {}
  return "http://localhost:5000/api";
}

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({ baseURL: API_BASE_URL });

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("authToken");
    console.log("[DIAGNOSE] localStorage.getItem('authToken'):", raw);
    const token = typeof window !== "undefined" ? raw : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log(
        "[DIAGNOSE] Axios sending Authorization header:",
        config.headers["Authorization"]
      );
    } else {
      console.log(
        "[DIAGNOSE] No token found, not setting Authorization header."
      );
    }
  } catch (e) {
    console.log("[DIAGNOSE] Error in Axios interceptor:", e);
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
  changePassword: (data) => api.post("/auth/change-password", data),
};

// ---- User Management API ----
export const usersApi = {
  list: (params = {}) => api.get("/users", { params }),
  get: (id) => api.get(`/users/${id}`),
  approve: (id) => api.patch(`/users/${id}/approve`),
  reject: (id) => api.patch(`/users/${id}/reject`),
  suspend: (id) => api.patch(`/users/${id}/suspend`),
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

// ---- Content API (existing) ----
export const contentApi = {
  list: () => api.get("/content"),
  get: (section) => api.get(`/content/${section}`),
  save: (section, payload) => api.post(`/content/${section}`, payload),
};

// ---- Forms API (existing) ----
export const formsApi = {
  submit: (formData) =>
    api.post("/forms/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: (params = {}) => api.get("/forms", { params }),
  update: (id, data) => api.patch(`/forms/${id}`, data),
  remove: (id) => api.delete(`/forms/${id}`),
};

// ---- Upload API (existing) ----
export const uploadApi = {
  multiple: (formData) =>
    api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: (nextCursor) =>
    api.get("/upload/list", { params: nextCursor ? { nextCursor } : {} }),
};

export default api;
