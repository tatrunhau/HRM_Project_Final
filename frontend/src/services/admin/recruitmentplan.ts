import api from "@/lib/axios";

// Định nghĩa kiểu dữ liệu cho Payload (Dữ liệu gửi lên) để code gợi ý tốt hơn
export interface RecruitmentPlanPayload {
  planNumber: string;
  signer: string;
  department: string;
  issueDate: string;
  effectiveDate: string;
  endDate: string;
  abstract: string;
  location: string;
  file_url?: string | null;
}

/**
 * Lấy danh sách tất cả kế hoạch tuyển dụng
 */
export const getRecruitmentPlans = async () => {
  try {
    const response = await api.get("/recruitment-plans");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy danh sách kế hoạch:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Lấy chi tiết một kế hoạch theo ID
 * @param id - ID của kế hoạch
 */
export const getRecruitmentPlanById = async (id: number | string) => {
  try {
    const response = await api.get(`/recruitment-plans/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy chi tiết kế hoạch:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Tạo mới kế hoạch tuyển dụng
 * @param data - Dữ liệu kế hoạch
 */
export const createRecruitmentPlan = async (data: RecruitmentPlanPayload) => {
  try {
    const response = await api.post("/recruitment-plans", data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi tạo kế hoạch:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Cập nhật kế hoạch tuyển dụng
 * @param id - ID của kế hoạch cần sửa
 * @param data - Dữ liệu mới
 */
export const updateRecruitmentPlan = async (id: number | string, data: RecruitmentPlanPayload) => {
  try {
    const response = await api.put(`/recruitment-plans/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật kế hoạch:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Xóa kế hoạch tuyển dụng
 * @param id - ID của kế hoạch cần xóa
 */
export const deleteRecruitmentPlan = async (id: number | string) => {
  try {
    const response = await api.delete(`/recruitment-plans/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi xóa kế hoạch:", error.response?.data || error.message);
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};