import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000";

/**
 * Axios instance
 */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

/**
 * Token helpers
 */
export const getToken = () => localStorage.getItem("token");
export const setToken = (token) => localStorage.setItem("token", token);
export const clearToken = () => localStorage.removeItem("token");

/**
 * Request interceptor
 * - Adds Bearer token if exists
 * - IMPORTANT: do NOT force Content-Type (FormData uploads)
 */
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    config.headers = config.headers || {};
    config.headers.Accept = "application/json";

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * - ONLY clear token if /auth/me returns 401
 * - NO redirects here (guards handle navigation)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    if (status === 401 && url.includes("/auth/me")) {
      clearToken();
    }

    return Promise.reject(error);
  }
);

export default api;
