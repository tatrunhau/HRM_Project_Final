import api from "@/lib/axios";

// =============================================================================
// 1. ĐỊNH NGHĨA INTERFACE (Kiểu dữ liệu)
// =============================================================================

// Dữ liệu cho biểu đồ cột (Phòng ban)
export interface DepartmentStat {
  name: string;      // Tên phòng ban
  employees: number; // Số lượng nhân viên
  salary: number;    // Tổng lương (đơn vị: Triệu)
}

// Dữ liệu cho biểu đồ tròn (Hợp đồng)
export interface ContractStat {
  name: string;      // Tên loại hợp đồng
  value: number;     // Số lượng
}

// Dữ liệu trả về tổng thể cho Dashboard báo cáo
export interface ReportStatsResponse {
  departmentData: DepartmentStat[];
  employeeTypeData: ContractStat[];
}

// Dữ liệu trả về từ AI (Danh sách nhân viên có nguy cơ nghỉ việc)
export interface RiskEmployee {
  id: string;        // Mã nhân viên
  name: string;      // Họ tên
  dept: string;      // Phòng ban
  riskScore: string; // Mức độ rủi ro ('Cao', 'Trung bình')
  probability: number; // Tỷ lệ phần trăm (VD: 85.5)
  reason: string;    // Lý do dự đoán
}

// =============================================================================
// 2. CÁC HÀM GỌI API
// =============================================================================

/**
 * Lấy dữ liệu thống kê tổng hợp cho các biểu đồ
 * GET /api/reports/stats
 */
export const getReportStats = async (): Promise<ReportStatsResponse | null> => {
  try {
    const response = await api.get<ReportStatsResponse>("/reports/stats");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy dữ liệu biểu đồ báo cáo:", error.response?.data || error.message);
    // Trả về null để giao diện biết là có lỗi
    return null;
  }
};

/**
 * Gọi AI để dự đoán danh sách nhân viên có nguy cơ nghỉ việc (Realtime)
 * POST /api/reports/predict-attrition
 */
export const predictAttrition = async (): Promise<RiskEmployee[]> => {
  try {
    // Dùng phương thức POST để bảo mật hơn và phù hợp với việc xử lý dữ liệu lớn
    const response = await api.post<RiskEmployee[]>("/reports/predict-attrition");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi khi gọi mô hình AI dự đoán:", error.response?.data || error.message);
    // Trả về mảng rỗng để không làm crash giao diện
    return [];
  }
};

export const downloadReportPDF = async () => {
  try {
    const response = await api.get("/reports/export-pdf", {
      responseType: 'blob', // Quan trọng: Để nhận file binary
    });

    // Tạo link ảo để tải file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_NhanSu_AI_${new Date().getTime()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi tải PDF:", error);
    return false;
  }
};