import api from "@/lib/axios";

// Định nghĩa Interface đầy đủ theo Model (Thêm employeecount)
export interface Department {
  departmentid: number;
  departmentcode?: string;
  name: string;
  description?: string;
  status?: boolean;
  notes?: string;
  employeecount?: number; // BIGINT
}

// Interface dùng cho Payload (Dữ liệu gửi lên khi Thêm/Sửa)
export interface DepartmentPayload {
  departmentcode?: string;
  name: string;
  description?: string;
  status?: boolean;
  notes?: string;
  employeecount?: number;
}

/**
 * Lấy danh sách tất cả phòng ban
 * Endpoint: GET /api/departments
 */
export const getDepartments = async () => {
  try {
    const response = await api.get<Department[]>("/departments");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy DS phòng ban:", error.response?.data || error.message);
    return [];
  }
};

/**
 * Tạo mới phòng ban
 * Endpoint: POST /api/departments
 */
export const createDepartment = async (data: Partial<DepartmentPayload>) => {
  try {
    const response = await api.post("/departments", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo phòng ban:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Cập nhật phòng ban
 * Endpoint: PUT /api/departments/:id
 */
export const updateDepartment = async (id: number | string, data: Partial<DepartmentPayload>) => {
  try {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật phòng ban:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Xóa phòng ban
 * Endpoint: DELETE /api/departments/:id
 */
export const deleteDepartment = async (id: number | string) => {
  try {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa phòng ban:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Xuất file Excel danh sách phòng ban
 * Endpoint: GET /api/departments/export
 */
export const exportDepartments = async () => {
  try {
    const response = await api.get("/departments/export", {
      responseType: "blob",
    });
    
    // Logic tải file xuống trình duyệt
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DanhSachPhongBan_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi xuất file Excel:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};