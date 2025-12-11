import api from "@/lib/axios";

// Interface khớp với dữ liệu trả về từ Backend (OtConfig Model)
export interface OtConfig {
    ot_config_id: number;
    ot_type: string;  // [SỬA] Khớp DB
    description: string;
    rate: number;     // [SỬA] Khớp DB
    is_active: boolean;
}

// Lấy danh sách cấu hình
export const getOtConfigs = async () => {
    try {
        const response = await api.get<OtConfig[]>("/attendance/ot-config");
        return response.data;
    } catch (error: any) {
        console.error("Lỗi lấy cấu hình OT:", error);
        return [];
    }
};

// Cập nhật cấu hình (Rate & Active)
// [SỬA] Tham số đầu vào dùng 'rate'
export const updateOtConfig = async (id: number, data: { rate: number; is_active: boolean }) => {
    try {
        const response = await api.put(`/attendance/ot-config/${id}`, data);
        return response.data;
    } catch (error: any) {
        console.error("Lỗi cập nhật cấu hình OT:", error);
        throw error;
    }
};