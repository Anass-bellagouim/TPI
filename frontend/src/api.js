import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

// ✅ أضف Bearer token تلقائياً
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers.Accept = "application/json";
  return config;
});

// ✅ إذا رجع 401: صيفط المستخدم لـ /login (اختياري)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // ما تمسحش التوكن إلا بغيت، ولكن غالباً أحسن
      // localStorage.removeItem("token");
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
