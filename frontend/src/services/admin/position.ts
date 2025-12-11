import api from "@/lib/axios";

export interface Position {
  positionid: number;
  positioncode: string;
  name: string;
  status: boolean;
  bonus: number;
}

export const getPositions = async () => {
  try {
    const response = await api.get<Position[]>("/positions");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy DS chức vụ:", error.response?.data || error.message);
    return [];
  }
};

export const createPosition = async (data: Partial<Position>) => {
  try {
    const response = await api.post("/positions", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo chức vụ:", error);
    throw error;
  }
};

export const updatePosition = async (id: number, data: Partial<Position>) => {
  try {
    const response = await api.put(`/positions/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật chức vụ:", error);
    throw error;
  }
};

export const deletePosition = async (id: number) => {
  try {
    const response = await api.delete(`/positions/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa chức vụ:", error);
    throw error;
  }
};

export const exportPositions = async () => {
  try {
    const response = await api.get("/positions/export", { responseType: "blob" });
    // Logic tải file xuống trình duyệt
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DanhSachChucVu_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi xuất Excel:", error);
    throw error;
  }
};