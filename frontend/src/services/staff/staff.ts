import api from "@/lib/axios";
import { getAuthMe } from "@/services/Login/auth";

// --- INTERFACES ---

export interface Certificate {
  certificateid: number;
  name: string;
}

export interface Department {
  departmentid: number;
  name: string;
  departmentcode: string;
}

export interface JobTitle {
  jobtitleid: number;
  name: string;
  jobtitlecode: string;
}

export interface UserInfo {
  userid: number;
  usercode: string;
  name: string;
  employeeid: number;
  role: number;
  status: boolean;
}

export interface EmployeeDetail {
  employeeid: number;
  employeecode: string;
  name: string;
  dateofbirth: string;
  gender: boolean;
  maritalstatus: boolean;
  religion: boolean;
  email: string;
  phonenumber: string | number;
  cccd: string | number;
  joineddate: string;
  status: string;
  
  // Dữ liệu liên kết để hiển thị (View)
  department?: { name: string; departmentcode?: string };
  jobtitle?: { name: string; jobtitlecode?: string };
  contract?: { name: string };
  educationlevel_certificate?: { name: string };
  
  // ID để bind vào Form (Edit)
  departmentid?: number;
  jobtitleid?: number;
  educationlevel?: number;
  
  cv_file?: string;
}

export interface StaffProfile {
  user: UserInfo;
  employee: EmployeeDetail;
}

export interface UpdateProfilePayload {
  name: string;
  dateofbirth: string;
  gender: boolean;
  maritalstatus: boolean;
  religion: boolean;
  email: string;
  phonenumber: string | number;
  cccd: string | number;
  educationlevel: number | string;
  departmentid?: number | string;
  jobtitleid?: number | string;
}

// ✅ CẬP NHẬT: Interface đúng cho chức năng đổi mật khẩu mới
export interface ChangePasswordPayload {
  oldPass: string;
  newPass: string;
  confirmPass: string;
}

export interface SalaryDetail {
    salaryid: number;
    month: number;
    year: number;
    basicsalary: string | number;
    totalallowance: string | number;
    overtimeamount: string | number;
    insuranceamount: string | number;
    taxamount: string | number;
    penaltyamount: string | number;
    advanceamount: string | number;
    netsalary: string | number;
    status: string;
}

// --- API FUNCTIONS ---

export const getCurrentUser = async (): Promise<StaffProfile> => {
  try {
    const authData = await getAuthMe(); 
    const user = authData.user;

    if (!user || !user.employeeid) {
      throw new Error("Tài khoản chưa liên kết hồ sơ nhân viên.");
    }

    const empResponse = await api.get(`/employees/${user.employeeid}`);

    return {
      user: user,
      employee: empResponse.data,
    };
  } catch (error: any) {
    console.error("❌ Lỗi lấy thông tin cá nhân:", error);
    throw error.response?.data || { message: "Lỗi tải hồ sơ" };
  }
};

export const getCertificates = async (): Promise<Certificate[]> => {
  try {
    const response = await api.get("/certificates");
    return response.data;
  } catch (error) {
    return []; 
  }
};

export const getDepartments = async (): Promise<Department[]> => {
  try {
    const response = await api.get("/departments");
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy DS phòng ban:", error);
    return [];
  }
};

export const getJobTitles = async (): Promise<JobTitle[]> => {
  try {
    const response = await api.get("/jobtitles");
    return response.data;
  } catch (error) {
    console.error("Lỗi lấy DS chức vụ:", error);
    return [];
  }
};

export const updateProfile = async (employeeId: number | string, data: UpdateProfilePayload) => {
  try {
    const response = await api.put(`/employees/${employeeId}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Lỗi cập nhật hồ sơ" };
  }
};

// ✅ CẬP NHẬT: Gọi đúng API đổi mật khẩu có check pass cũ
export const changePassword = async (data: ChangePasswordPayload) => {
  try {
    // Gọi PUT /auth/change-password thay vì POST /auth/reset-password
    const response = await api.put("/auth/change-password", data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Lỗi đổi mật khẩu" };
  }
};

// 👇 MỚI: Thêm hàm xử lý đăng xuất
export const logout = async () => {
  try {
    // 1. Gọi API để Server xóa session/cookie httpOnly
    await api.post("/auth/signOut");
  } catch (error) {
    // Dù lỗi API hay không thì phía Client vẫn phải xóa token để đăng xuất
    console.error("Lỗi gọi API đăng xuất:", error);
  } finally {
    // 2. Xóa dữ liệu Client (Chạy trong mọi trường hợp)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
    }
  }
};

// Hàm lấy lương mới nhất (Ví dụ: gọi API lọc theo tháng hiện tại hoặc lấy bản ghi mới nhất)
export const getLatestSalary = async (employeeId: number): Promise<SalaryDetail | null> => {
    // Giả sử bạn tái sử dụng API getMonthlySalaries với query param
    const date = new Date();
    // Lưu ý: Logic này cần backend hỗ trợ filter, hoặc bạn fetch list về rồi lấy phần tử cuối cùng
    // Đây là code ví dụ gọi API
    try {
        const res = await api.get(`/payroll/salaries?search=&month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
        // Tìm lương của nhân viên này trong list trả về
        const mySalary = res.data.find((s: any) => s.employeeid === employeeId);
        return mySalary || null;
    } catch (error) {
        console.error("Error fetching salary", error);
        return null;
    }
};