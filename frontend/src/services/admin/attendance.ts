import api from "@/lib/axios";

// Interface tham số lọc cho Overtime (Đã bỏ startDate, endDate)
export interface OvertimeParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}

// --- API NGHỈ PHÉP ---
export const getLeaves = async (search = '') => {
    const res = await api.get(`/attendance/leave?search=${search}`);
    return res.data;
};

export const createLeave = async (data: any) => {
    return await api.post('/attendance/leave', data);
};

export const updateLeaveStatus = async (id: number, status: string) => {
    return await api.put(`/attendance/leave/${id}`, { status });
};

export const deleteLeave = async (id: number) => {
    return await api.delete(`/attendance/leave/${id}`);
};

// --- API TĂNG CA ---

// 1. Lấy danh sách tăng ca (Phân trang, Search, Status)
export const getOvertimes = async (params?: OvertimeParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
        Object.keys(params).forEach(key => {
            const value = (params as any)[key];
            if (value !== undefined && value !== '' && value !== null) {
                queryParams.append(key, value.toString());
            }
        });
    }

    // Call API: /attendance/overtime?page=1&limit=10&status=all...
    const res = await api.get(`/attendance/overtime?${queryParams.toString()}`);
    // Backend trả về: { data: [], pagination: {} }
    return res.data;
};

// 2. Xuất Excel (Chỉ Search và Status)
export const exportOvertimeToExcel = async (params?: OvertimeParams) => {
    try {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                // Bỏ page và limit khi export để lấy toàn bộ kết quả lọc
                if (value !== undefined && value !== '' && value !== null && key !== 'page' && key !== 'limit') {
                    queryParams.append(key, value.toString());
                }
            });
        }

        // Call API: /attendance/overtime/export?...
        // Quan trọng: responseType 'blob' để nhận file binary
        const response = await api.get(`/attendance/overtime/export?${queryParams.toString()}`, {
            responseType: 'blob', 
        });

        // Tạo link download ảo
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        link.setAttribute('download', `DS_TangCa_${dateStr}.xlsx`);
        document.body.appendChild(link);
        link.click();
        
        // Dọn dẹp
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Lỗi tải file Excel:", error);
        alert("Không thể xuất file Excel. Vui lòng kiểm tra lại server.");
    }
};

export const createOvertime = async (data: any) => {
    return await api.post('/attendance/overtime', data);
};

export const updateOvertimeStatus = async (id: number, status: string) => {
    return await api.put(`/attendance/overtime/${id}`, { status });
};

export const deleteOvertime = async (id: number) => {
    return await api.delete(`/attendance/overtime/${id}`);
};

// --- API CHẤM CÔNG (MÁY QUÉT) ---

export const checkInByQr = async (token: string) => {
    try {
        const res = await api.post('/attendance/checkin', { token });
        return res.data;
    } catch (error: any) {
        // Nếu Backend trả về lỗi có message (ví dụ lỗi 400 do trễ giờ)
        // Ta ném lỗi đó ra để giao diện hiển thị đúng message thay vì "Lỗi hệ thống"
        if (error.response && error.response.data) {
            throw error.response.data; // Ném object { message: "..." }
        }
        throw new Error("Lỗi kết nối máy chủ");
    }
};

// Hàm lấy danh sách chấm công theo ngày
export const getDailyAttendance = async (date: string) => {
    // Gọi API: /attendance/daily?date=2025-12-07
    const res = await api.get(`/attendance/daily?date=${date}`);
    return res.data;
};

// Cập nhật trạng thái chấm công của 1 nhân viên (ABSENT / ABSENT_PERMISSION)
export const updateAttendanceLog = async (id: number, data: { status: string, checkInTime: string, checkOutTime: string }) => {
    return await api.put(`/attendance/log/${id}`, data);
};

// Lấy giờ làm việc hiện tại
export const getShiftConfig = async () => {
    const res = await api.get('/attendance/shift');
    return res.data;
};

// Cập nhật giờ làm việc
export const updateShiftConfig = async (startTime: string, endTime: string) => {
    return await api.put('/attendance/shift', { startTime, endTime });
};

// [THÊM MỚI] API Khởi tạo chấm công ngày (Tạo 'ABSENT' cho người chưa check-in)
export const initDailyAttendance = async (date: string) => {
    // date format: YYYY-MM-DD
    return await api.post('/attendance/init-daily', { date });
};

// [THÊM MỚI] Hàm xuất Excel chấm công theo ngày
export const exportDailyAttendanceToExcel = async (date: string) => {
    try {
        // Gọi API với responseType là blob để nhận file
        const response = await api.get(`/attendance/daily/export?date=${date}`, {
            responseType: 'blob',
        });

        // Tạo link download ảo và tự động click
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `BangChamCong_${date}.xlsx`); // Tên file tải về
        document.body.appendChild(link);
        link.click();
        
        // Dọn dẹp
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Lỗi tải file Excel:", error);
        alert("Không thể xuất file Excel. Vui lòng thử lại.");
    }
};