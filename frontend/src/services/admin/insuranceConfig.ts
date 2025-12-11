// services/admin/insuranceConfig.ts

import api from "@/lib/axios";

// Interface dữ liệu trả về từ API
export interface InsuranceConfig {
    insuranceconfigid: number;
    insurancetype: string; // Tên loại bảo hiểm
    employeerate: number; // Tỉ lệ đóng của Người lao động
    employerrate: number; // Tỉ lệ đóng của Người sử dụng lao động
    maxsalarybase: number; // Mức lương cơ bản tối đa
    effectivedate: string; // Ngày hiệu lực
    status: boolean;
}

// Payload cho cập nhật (chỉ các trường được phép sửa)
export interface InsuranceConfigPayload {
    employeerate: number | string;
    employerrate: number | string;
    maxsalarybase: number | string;
    effectivedate: string;
}

/**
 * Lấy danh sách tất cả cấu hình BHXH
 */
export const getInsuranceConfigs = async () => {
  try {
    const response = await api.get("/insurance-configs");
    return response.data as InsuranceConfig[];
  } catch (error: any) {
    console.error("❌ Lỗi lấy danh sách cấu hình bảo hiểm:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Cập nhật cấu hình BHXH theo ID
 * @param id - ID của cấu hình cần sửa (insuranceconfigid)
 * @param data - Dữ liệu mới
 */
export const updateInsuranceConfig = async (id: number | string, data: InsuranceConfigPayload) => {
  try {
    const response = await api.put(`/insurance-configs/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật cấu hình bảo hiểm:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};