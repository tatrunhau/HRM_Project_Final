import api from "@/lib/axios";

export interface Contract {
  contractid: number;
  contractcode: string;
  name: string;
  description?: string;
  status?: boolean;
}

/**
 * Lấy danh sách hợp đồng
 * Endpoint: GET /api/contracts
 */
export const getContracts = async () => {
  try {
    const response = await api.get<Contract[]>("/contracts");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy DS hợp đồng:", error.response?.data || error.message);
    return [];
  }
};

/**
 * Tạo mới hợp đồng
 * Endpoint: POST /api/contracts
 */
export const createContract = async (data: Partial<Contract>) => {
  try {
    const response = await api.post("/contracts", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo hợp đồng:", error);
    throw error;
  }
};

/**
 * Cập nhật hợp đồng
 * Endpoint: PUT /api/contracts/:id
 */
export const updateContract = async (id: number, data: Partial<Contract>) => {
  try {
    const response = await api.put(`/contracts/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật hợp đồng:", error);
    throw error;
  }
};

/**
 * Xóa hợp đồng
 * Endpoint: DELETE /api/contracts/:id
 */
export const deleteContract = async (id: number) => {
  try {
    const response = await api.delete(`/contracts/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa hợp đồng:", error);
    throw error;
  }
};

/**
 * Xuất danh sách hợp đồng ra file Excel
 * Endpoint: GET /api/contracts/export
 */
export const exportContracts = async () => {
  try {
    const response = await api.get("/contracts/export", {
      responseType: "blob", // Bắt buộc để nhận file binary
    });
    
    // Logic tải file xuống trình duyệt
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DanhSachHopDong_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi xuất file Excel:", error.response?.data || error.message);
    throw error;
  }
};