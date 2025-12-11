import api from "@/lib/axios";

export interface Allowance {
  allowanceid: number;
  allowancecode: string;
  name: string;
  amount: number | string; // Có thể là string khi nhập liệu, number khi hiển thị
  condition?: string;
  status: boolean;
  apply_to_all: boolean;
  effectivedate?: string;
}

export const getAllowances = async () => {
  try {
    const response = await api.get<Allowance[]>("/allowances");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy DS phụ cấp:", error.response?.data || error.message);
    return [];
  }
};

export const createAllowance = async (data: Partial<Allowance>) => {
  try {
    const response = await api.post("/allowances", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo phụ cấp:", error);
    throw error;
  }
};

export const updateAllowance = async (id: number, data: Partial<Allowance>) => {
  try {
    const response = await api.put(`/allowances/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật phụ cấp:", error);
    throw error;
  }
};

export const deleteAllowance = async (id: number) => {
  try {
    const response = await api.delete(`/allowances/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa phụ cấp:", error);
    throw error;
  }
};

export const exportAllowances = async () => {
  try {
    const response = await api.get("/allowances/export", {
      responseType: "blob", // Bắt buộc để nhận file binary
    });
    
    // Logic tải file xuống trình duyệt
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DanhSachPhuCap_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi xuất file Excel:", error.response?.data || error.message);
    throw error;
  }
};