import api from "@/lib/axios";

// ----------------------------------------------------------------------
// --- INTERFACES (Định nghĩa kiểu dữ liệu trả về) ---
// ----------------------------------------------------------------------

// Kiểu dữ liệu cho các thẻ có so sánh tăng trưởng (Nhân viên, Lương, Giữ chân)
export interface GrowthMetric {
  value: number;
  growth: number;
  trend: 'increase' | 'decrease';
}

// Kiểu dữ liệu riêng cho thẻ Ứng viên (Candidate)
export interface CandidateMetric {
  value: number;
  processing: number;
}

// Tổng hợp toàn bộ dữ liệu Dashboard
export interface DashboardSummary {
  employees: GrowthMetric;
  candidates: CandidateMetric;
  salary: GrowthMetric;
  retention: GrowthMetric;
}

// ----------------------------------------------------------------------
// --- SERVICE FUNCTIONS ---
// ----------------------------------------------------------------------

/**
 * Lấy số liệu thống kê tổng quan cho Dashboard
 * Endpoint: GET /api/dashboard/summary
 */
export const getDashboardStats = async (): Promise<DashboardSummary | null> => {
  try {
    // Gọi API (Lưu ý: api instance đã được cấu hình baseURL trong lib/axios)
    const response = await api.get<DashboardSummary>("/dashboard/summary");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy dữ liệu Dashboard:", error.response?.data || error.message);
    return null; // Trả về null để frontend xử lý loading hoặc hiển thị mặc định
  }
};