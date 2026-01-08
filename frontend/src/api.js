import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: { Accept: "application/json" },
});

export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    config.headers = config.headers || {};
    config.headers.Accept = "application/json";

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // مهم: ما تفرضش Content-Type فـ FormData
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // غير إلا /auth/me رجعات 401 => token ما صالحش
    if (status === 401 && url.includes("/auth/me")) {
      clearToken();
    }

    // ما تديرش redirect هنا نهائياً
    return Promise.reject(error);
  }
);

export default api;
