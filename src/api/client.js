import axios from "axios";

// Centralized API base URL
// Prefer REACT_APP_API_URL, fallback to REACT_APP_API_BASE_URL, then production URL
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "https://vmonie-server.onrender.com/api";

const api = axios.create({ baseURL: API_BASE_URL });

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// ---- Endpoint helpers ----
export const contentApi = {
  list: () => api.get("/content"),
  get: (section) => api.get(`/content/${section}`),
  save: (section, payload) => api.post(`/content/${section}`, payload),
};

export const formsApi = {
  submit: (formData) =>
    api.post("/forms/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: (params = {}) => api.get("/forms", { params }),
  update: (id, data) => api.patch(`/forms/${id}`, data),
  remove: (id) => api.delete(`/forms/${id}`),
};

export const authApi = {
  me: () => api.get("/auth/me"),
};

export const uploadApi = {
  multiple: (formData) =>
    api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  list: (nextCursor) =>
    api.get("/upload/list", { params: nextCursor ? { nextCursor } : {} }),
};

export default api;
