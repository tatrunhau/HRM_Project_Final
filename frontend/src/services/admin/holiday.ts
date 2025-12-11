import api from "@/lib/axios";

export interface Holiday {
  holiday_id: number;
  start_date: string;
  end_date: string;
  holiday_name: string;
  is_annual: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HolidayPayload {
  start_date: string;
  end_date: string;
  holiday_name: string;
  is_annual: boolean;
}

export const getHolidays = async () => {
  try {
    const response = await api.get<Holiday[]>("/holidays");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy DS ngày nghỉ:", error.response?.data || error.message);
    return [];
  }
};

export const createHoliday = async (data: HolidayPayload) => {
  try {
    const response = await api.post("/holidays", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo ngày nghỉ:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

export const updateHoliday = async (id: number, data: HolidayPayload) => {
  try {
    const response = await api.put(`/holidays/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật ngày nghỉ:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

export const deleteHoliday = async (id: number) => {
  try {
    const response = await api.delete(`/holidays/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa ngày nghỉ:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

export const exportHolidays = async () => {
  try {
    const response = await api.get("/holidays/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DanhSachNgayNghi_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch (error: any) {
    throw error.response?.data || { message: "Lỗi xuất file" };
  }
};