import api from "@/lib/axios";

/**
 * Gọi API đăng nhập
 * @param usercode - Mã người dùng
 * @param pass - Mật khẩu
 */
export const login = async (usercode: string, pass: string) => {
  try {
    const response = await api.post("/auth/Login", { usercode, pass });
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi đăng nhập:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Gọi API lấy thông tin user (sau khi đăng nhập)
 */
export const getAuthMe = async () => {
  try {
    const response = await api.get("/users/authme");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy thông tin user:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Gọi API xác thực danh tính (Quên mật khẩu - Bước 1)
 * @param usercode - Mã người dùng
 * @param email - Email đăng ký
 */
export const verifyUserIdentity = async (usercode: string, email: string) => {
  try {
    // Lưu ý: Đường dẫn '/auth/verify-identity' phải khớp với route bạn khai báo ở Backend
    const response = await api.post("/auth/verify-identity", { usercode, email });
    return response.data; // Trả về { message, userid }
  } catch (error: any) {
    console.error("❌ Lỗi xác thực:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Gọi API đặt lại mật khẩu (Quên mật khẩu - Bước 2)
 * @param userid - ID tài khoản (nhận được từ bước 1)
 * @param newPass - Mật khẩu mới
 * @param confirmPass - Nhập lại mật khẩu mới
 */
export const resetPassword = async (userid: number | string, newPass: string, confirmPass: string) => {
  try {
    const response = await api.put("/auth/reset-password", { userid, newPass, confirmPass });
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi đặt lại mật khẩu:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};