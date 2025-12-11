import api from "@/lib/axios";

// 1. Interface chi tiết cho từng chức vụ kiêm nhiệm (để xử lý logic hiển thị màu sắc)
export interface SubJobDetail {
  id: number;
  name: string;
  status: boolean; // true: Hoạt động, false: Ngừng hoạt động
}

// 2. Interface hiển thị trên bảng (Table Row Data)
export interface ConcurrentEmployee {
  id: number;
  code: string;
  name: string;
  
  deptId: number | null;
  deptName: string;
  
  mainJobId: number | null;
  mainJobName: string; // Tên chức danh chính (Khớp với Controller)

  // Danh sách chi tiết (Dùng để hiển thị Badge trên bảng: Xanh hoặc Xám)
  subJobDetails: SubJobDetail[]; 
  
  // Danh sách ID (Dùng để set default Checked trong Modal)
  subJobIds: number[]; 
}

// 3. Payload gửi lên server khi lưu
export interface UpdateConcurrentPayload {
  employeeId: number;
  positionIds: number[];
}

/**
 * Lấy danh sách nhân viên kèm thông tin kiêm nhiệm để hiển thị bảng
 * Endpoint: GET /api/concurrently
 */
export const getConcurrentEmployees = async () => {
  try {
    const response = await api.get<ConcurrentEmployee[]>("/concurrently");
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi lấy DS nhân viên kiêm nhiệm:", error.response?.data || error.message);
    return [];
  }
};

/**
 * Cập nhật danh sách chức vụ kiêm nhiệm cho 1 nhân viên
 * Endpoint: POST /api/concurrently/update
 */
export const updateConcurrentPositions = async (payload: UpdateConcurrentPayload) => {
  try {
    const response = await api.post("/concurrently/update", payload);
    return response.data;
  } catch (error: any) {
    console.error("❌ Lỗi cập nhật kiêm nhiệm:", error);
    // Ném lỗi ra để component UI bắt được và hiện thông báo (Alert/Toast)
    throw error.response?.data || { message: "Lỗi không xác định" };
  }
};

/**
 * Xuất file Excel danh sách kiêm nhiệm
 * Endpoint: GET /api/concurrently/export
 */
export const exportConcurrentData = async () => {
  try {
    const response = await api.get("/concurrently/export", {
      responseType: "blob", // Quan trọng để nhận file
    });
    
    // Logic tải file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DS_KiemNhiem_${new Date().getTime()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  } catch (error: any) {
    console.error("❌ Lỗi xuất Excel:", error);
    throw error;
  }
};