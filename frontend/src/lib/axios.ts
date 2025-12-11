import axios from "axios";

const api = axios.create({
  // Đảm bảo URL này đúng với backend của bạn (chú ý http vs https, IP vs localhost)
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: Gắn token vào header
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") { // Kiểm tra để tránh lỗi khi render phía server (nếu có)
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 2. Response Interceptor: Xử lý khi Token hết hạn (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("🔒 Token hết hạn hoặc không hợp lệ. Đăng xuất...");
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        window.location.href = "/Login"; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;