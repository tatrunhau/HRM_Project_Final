import api from "@/lib/axios";

// --- Interfaces (Models Frontend) ---

export interface AccountPayload {
  employeeid: number;
  jobtitleid: number; 
  role: number;       
}

export interface UserAccount {
  userid: number;
  employeeid: number;
  usercode: string;
  name: string;
  employeecode: string;
  employeename: string;
  jobtitlename: string;
  role: string;   
  roleid: number; 
  status: boolean;
}

// Interface cho payload đổi mật khẩu
export interface ChangePasswordPayload {
  oldPass: string;
  newPass: string;
  confirmPass: string;
}

export interface Employee {
  employeeid: number;
  employeecode: string;
  name: string; 
}

export interface Jobtitle {
  jobtitleid: number;
  name: string;
}

export interface Role {
  roleid: number;
  name: string;
}

// --- API Calls ---

// 1. Lấy danh sách tài khoản
export const getUserAccounts = async (): Promise<UserAccount[]> => {
  try {
    const res = await api.get('/auth/accounts'); 
    return res.data;
  } catch (error: any) {
    console.error("Lỗi lấy danh sách tài khoản:", error);
    return [];
  }
};

// 2. Tạo tài khoản mới
export const createAccount = async (payload: AccountPayload) => {
  try {
    const res = await api.post('/auth/create', payload); 
    return res.data;
  } catch (error: any) {
    throw error;
  }
};

// 3. Lấy dữ liệu Dropdown
export const getFormData = async () => {
  try {
    const res = await api.get('/auth/form-data');
    return res.data; 
  } catch (error: any) {
    console.error("Lỗi lấy dữ liệu form:", error);
    return { employees: [], jobtitles: [], roles: [] }; 
  }
};

// 4. Cập nhật trạng thái/Role
export const updateAccount = async (userid: number, data: { status: boolean, role: number }) => {
  try {
    const res = await api.put(`/auth/update/${userid}`, data);
    return res.data;
  } catch (error: any) {
    throw error;
  }
};

// 5. Xóa tài khoản
export const deleteAccount = async (userid: number) => {
  try {
    const res = await api.delete(`/auth/delete/${userid}`);
    return res.data;
  } catch (error: any) {
    throw error;
  }
};

// 6. Admin Reset Mật Khẩu
export const adminResetPassword = async (userid: number) => {
  try {
    const res = await api.post('/auth/admin-reset-password', { userid });
    return res.data;
  } catch (error: any) {
    throw error;
  }
};

// --- CÁC HÀM MỚI THÊM CHO TRANG SETTINGS ---

// 7. Lấy thông tin người dùng hiện tại (Auth Me)
export const getAuthMe = async () => {
  try {
    // Lưu ý: Route bên user là /authme, nhưng thường prefix là /users
    // Hãy kiểm tra lại file index.js hoặc app.js xem prefix của userRoutes là gì.
    // Giả sử là /api/users/authme
    const res = await api.get('/users/authme'); 
    return res.data;
  } catch (error: any) {
    console.error("Lỗi auth me:", error);
    throw error;
  }
};

// 8. Đổi mật khẩu cá nhân
export const changePassword = async (payload: ChangePasswordPayload) => {
  try {
    const res = await api.put('/auth/change-password', payload);
    return res.data;
  } catch (error: any) {
    console.error("Lỗi đổi mật khẩu:", error);
    throw error;
  }
};

// 9. Đăng xuất
export const signOut = async () => {
  try {
    // withCredentials: true thường được cấu hình sẵn trong api instance (axios)
    // Nếu chưa, bạn cần thêm config { withCredentials: true } vào tham số thứ 3
    const res = await api.post('/auth/signOut');
    return res.data;
  } catch (error: any) {
    console.error("Lỗi đăng xuất:", error);
    throw error;
  }
};