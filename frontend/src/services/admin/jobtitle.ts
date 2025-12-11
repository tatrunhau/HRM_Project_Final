import api from "@/lib/axios";

export interface JobTitle {
  jobtitleid: number;
  jobtitlecode?: string;
  name: string;
  description?: string;
  // Lưu ý: Model jobtitle.js không có trường status, nên ta bỏ status khỏi interface
}

export interface JobTitlePayload {
  jobtitlecode?: string;
  name: string;
  description?: string;
}

/**
 * Lấy danh sách tất cả chức danh
 * Endpoint: GET /api/jobtitles
 */
export const getJobTitles = async () => {
  try {
    const response = await api.get<JobTitle[]>("/jobtitles");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy DS chức vụ:", error.response?.data || error.message);
    return [];
  }
};

/**
 * Tạo mới chức danh
 * Endpoint: POST /api/jobtitles
 */
export const createJobTitle = async (data: JobTitlePayload) => {
  try {
    const response = await api.post("/jobtitles", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo chức danh:", error);
    throw error;
  }
};

/**
 * Cập nhật chức danh
 * Endpoint: PUT /api/jobtitles/:id
 */
export const updateJobTitle = async (id: number, data: JobTitlePayload) => {
  try {
    const response = await api.put(`/jobtitles/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật chức danh:", error);
    throw error;
  }
};

/**
 * Xóa chức danh
 * Endpoint: DELETE /api/jobtitles/:id
 */
export const deleteJobTitle = async (id: number) => {
  try {
    const response = await api.delete(`/jobtitles/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa chức danh:", error);
    throw error;
  }
};

/**
 * Xuất file Excel danh sách chức danh
 * Endpoint: GET /api/jobtitles/export
 */
export const exportJobTitles = async () => {
  try {
    const response = await api.get("/jobtitles/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DanhSachChucDanh_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi xuất Excel:", error);
    throw error;
  }
};