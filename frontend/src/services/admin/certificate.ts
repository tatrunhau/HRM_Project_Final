import api from "@/lib/axios";

export interface Certificate {
  certificateid: number;
  certificatecode: string;
  name: string;
  status?: boolean;
}

/**
 * Lấy danh sách bằng cấp / chứng chỉ
 * Endpoint: GET /api/certificates
 */
export const getCertificates = async () => {
  try {
    const response = await api.get<Certificate[]>("/certificates");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy DS bằng cấp:", error.response?.data || error.message);
    return [];
  }
};

/**
 * Tạo mới Chứng chỉ
 * Endpoint: POST /api/certificates
 */
export const createCertificate = async (data: Partial<Certificate>) => {
  try {
    const response = await api.post("/certificates", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo chứng chỉ:", error);
    throw error;
  }
};

/**
 * Cập nhật Chứng chỉ
 * Endpoint: PUT /api/certificates/:id
 */
export const updateCertificate = async (id: number, data: Partial<Certificate>) => {
  try {
    const response = await api.put(`/certificates/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật chứng chỉ:", error);
    throw error;
  }
};

/**
 * Xóa Chứng chỉ
 * Endpoint: DELETE /api/certificates/:id
 */
export const deleteCertificate = async (id: number) => {
  try {
    const response = await api.delete(`/certificates/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa chứng chỉ:", error);
    throw error;
  }
};

/**
 * Xuất danh sách Chứng chỉ ra file Excel
 * Endpoint: GET /api/certificates/export
 */
export const exportCertificates = async () => {
  try {
    const response = await api.get("/certificates/export", {
      responseType: "blob", // Bắt buộc để nhận file binary
    });
    
    // Logic tải file xuống trình duyệt
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DanhSachChungChi_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi xuất file Excel:", error.response?.data || error.message);
    throw error;
  }
};