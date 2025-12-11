// services/admin/stateDocument.ts

import api from "@/lib/axios";

// Định nghĩa kiểu dữ liệu cho Payload (Dữ liệu gửi lên) để code gợi ý tốt hơn
export interface StateDocumentPayload {
  documentCode: string; // Số văn bản
  name: string; // Tên/Tiêu đề
  type: string; // Loại văn bản
  description: string; // Mô tả/Trích yếu
  file_url?: string | null; // Đường dẫn file (Sẽ lưu vào trường filepath trong DB)
}

/**
 * Lấy danh sách tất cả Văn bản Nhà nước
 */
export const getStateDocuments = async () => {
  try {
    const response = await api.get("/state-documents");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy danh sách văn bản:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Lấy chi tiết một Văn bản theo ID
 * @param id - ID của văn bản
 */
export const getStateDocumentById = async (id: number | string) => {
  try {
    const response = await api.get(`/state-documents/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy chi tiết văn bản:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Tạo mới Văn bản Nhà nước
 * @param data - Dữ liệu văn bản
 */
export const createStateDocument = async (data: StateDocumentPayload) => {
  try {
    const response = await api.post("/state-documents", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo văn bản:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Cập nhật Văn bản Nhà nước
 * @param id - ID của văn bản cần sửa
 * @param data - Dữ liệu mới
 */
export const updateStateDocument = async (id: number | string, data: StateDocumentPayload) => {
  try {
    const response = await api.put(`/state-documents/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật văn bản:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Xóa Văn bản Nhà nước
 * @param id - ID của văn bản cần xóa
 */
export const deleteStateDocument = async (id: number | string) => {
  try {
    const response = await api.delete(`/state-documents/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa văn bản:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Xuất danh sách Văn bản Nhà nước ra file Excel
 */
export const exportStateDocuments = async () => {
  // Logic này sẽ được gọi từ component frontend (StateDocumentPage.tsx)
  // và sẽ gọi route GET /state-documents/export đã được định nghĩa
  // (Logic thực hiện export nằm ở StateDocumentController.js)
  try {
    const response = await api.get('/state-documents/export', {
      responseType: 'blob', // Quan trọng: Yêu cầu response là file binary
    });
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xuất Excel:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};