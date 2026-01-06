import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// ملاحظة: إذا عندك CORS مشكل، خليه يتصل بـ proxy أو فعّل CORS فـ Laravel.

export default api;

export function storageUrl(filePath) {
  // backend كيعطي file_path بحال: documents/xxxx.pdf
  return `${API_BASE_URL}/storage/${filePath}`;
}
