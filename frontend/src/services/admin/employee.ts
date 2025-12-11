import api from "@/lib/axios";

// Interface đầy đủ map 1-1 với Model Sequelize (Dùng để hiển thị)
export interface Employee {
  employeeid: number;
  employeecode?: string | null;
  name?: string | null;
  dateofbirth?: string | null;
  gender?: boolean | null;
  maritalstatus?: boolean | null;
  religion?: boolean | null;
  email?: string | null;
  phonenumber?: number | null;
  cccd?: number | null;
  candidateid?: number | null;
  jobtitleid?: number | null;
  joineddate?: string | null;
  departmentid?: number | null;
  contractid?: number | null;
  status?: string | null;
  basicsalary?: number | string | null;
  layoff?: string | null;
  note?: string | null;
  educationlevel?: number | null;
  dependents?: number | null;
  cv_file?: string | null; // Thêm trường này để nhận link file từ API (flattened)
}

// Interface dùng cho Payload (Dữ liệu gửi lên khi Thêm/Sửa)
export interface EmployeePayload {
  name: string;
  dateofbirth?: string;
  gender?: boolean;
  maritalstatus?: boolean;
  religion?: boolean;
  email?: string;
  phonenumber?: string | number;
  cccd?: string | number;
  departmentid?: string | number;
  jobtitleid?: string | number;
  contractid?: string | number;
  educationlevel?: string | number;
  joineddate?: string;
  status?: string;
  basicsalary?: string | number;
  layoff?: string;
  note?: string;
  dependents?: string | number;
  cv_file?: string | null; // Đường dẫn file (URL từ Supabase)
}

/**
 * Lấy danh sách tất cả nhân viên
 * Endpoint: GET /api/employees
 */
export const getEmployees = async () => {
  try {
    const response = await api.get<Employee[]>("/employees");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy DS nhân viên:", error.response?.data || error.message);
    return [];
  }
};

/**
 * Lấy chi tiết một nhân viên
 * Endpoint: GET /api/employees/:id
 */
export const getEmployeeById = async (id: number | string) => {
  try {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy chi tiết nhân viên:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Tạo mới nhân viên
 * Endpoint: POST /api/employees
 */
export const createEmployee = async (data: EmployeePayload) => {
  try {
    const response = await api.post("/employees", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo nhân viên:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Cập nhật thông tin nhân viên
 * Endpoint: PUT /api/employees/:id
 */
export const updateEmployee = async (id: number | string, data: EmployeePayload) => {
  try {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật nhân viên:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Xóa nhân viên
 * Endpoint: DELETE /api/employees/:id
 */
export const deleteEmployee = async (id: number | string) => {
  try {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa nhân viên:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Xuất file Excel danh sách nhân viên
 * Endpoint: GET /api/employees/export
 * Lưu ý: responseType: 'blob' để nhận file binary
 */
export const exportEmployees = async () => {
  try {
    const response = await api.get("/employees/export", {
      responseType: "blob",
    });
    
    // Logic tải file xuống trình duyệt
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DanhSachNhanVien_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi xuất file Excel:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};