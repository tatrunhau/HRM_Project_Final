import axios from 'axios';

// Cấu hình URL cơ sở (Thay đổi cổng hoặc domain tuỳ dự án của bạn)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Tạo instance axios có kèm token (giả sử lưu token trong localStorage)
const axiosInstance = axios.create({
    baseURL: `${API_URL}/requests`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor để tự động gắn Token vào mỗi request
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken'); // Hoặc lấy từ Cookie/Context
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- TYPES DEFINITIONS ---

export type RequestStatus = 'pending' | 'approved' | 'rejected';

// Type: Nghỉ phép
export interface LeaveRequest {
    leaverequestid: number;
    employeeid: number;
    leavetype: string;
    startdate: string;
    enddate: string;
    reason: string;
    status: RequestStatus;
    approveddate?: string;
    createddate: string;
    employee?: { employeecode: string; name: string }; // Include từ backend
}

// Type: Tăng ca
export interface OvertimeRequest {
    overtimerequestid: number;
    employeeid: number;
    overtimedate: string;
    starttime: string; // Dạng ISO hoặc HH:mm tuỳ backend trả
    endtime: string;
    overtimehours: number;
    workcontent: string;
    status: RequestStatus;
    createddate: string;
    employee?: { employeecode: string; name: string };
}

// Type: Ứng lương
export interface AdvanceRequest {
    advancerequestid: number;
    employeeid: number;
    advanceamount: number;
    advancemonth: number;
    advanceyear: number;
    reason: string;
    status: RequestStatus;
    createddate: string;
    note?: string; // Ghi chú từ admin (nếu có)
    employee?: { employeecode: string; name: string };
}

// Payload khi tạo/sửa
export interface LeavePayload {
    employeeId: number; // Chỉ cần khi tạo
    type?: string;
    fromDate?: string;
    toDate?: string;
    reason?: string;
}

export interface OvertimePayload {
    employeeId: number;
    date?: string;
    startTime?: string; // HH:mm
    endTime?: string;   // HH:mm
    reason?: string;
}

export interface AdvancePayload {
    employeeId: number;
    date?: string; // Ngày ứng
    amount?: number;
    reason?: string;
}

// --- API FUNCTIONS ---

// 1. NGHỈ PHÉP
export const getLeaves = async (employeeId: number): Promise<LeaveRequest[]> => {
    const res = await axiosInstance.get(`/leave/${employeeId}`);
    return res.data;
};

export const createLeave = async (data: LeavePayload) => {
    const res = await axiosInstance.post('/leave', data);
    return res.data;
};

export const updateLeave = async (id: number, data: Omit<LeavePayload, 'employeeId'>) => {
    const res = await axiosInstance.put(`/leave/${id}`, data);
    return res.data;
};

export const deleteLeave = async (id: number) => {
    const res = await axiosInstance.delete(`/leave/${id}`);
    return res.data;
};

// 2. TĂNG CA
export const getOvertimes = async (employeeId: number): Promise<OvertimeRequest[]> => {
    const res = await axiosInstance.get(`/overtime/${employeeId}`);
    return res.data;
};

export const createOvertime = async (data: OvertimePayload) => {
    const res = await axiosInstance.post('/overtime', data);
    return res.data;
};

export const updateOvertime = async (id: number, data: Omit<OvertimePayload, 'employeeId'>) => {
    const res = await axiosInstance.put(`/overtime/${id}`, data);
    return res.data;
};

export const deleteOvertime = async (id: number) => {
    const res = await axiosInstance.delete(`/overtime/${id}`);
    return res.data;
};

// 3. ỨNG LƯƠNG
export const getAdvances = async (employeeId: number): Promise<AdvanceRequest[]> => {
    const res = await axiosInstance.get(`/advance/${employeeId}`);
    return res.data;
};

export const createAdvance = async (data: AdvancePayload) => {
    const res = await axiosInstance.post('/advance', data);
    return res.data;
};

export const updateAdvance = async (id: number, data: Omit<AdvancePayload, 'employeeId'>) => {
    const res = await axiosInstance.put(`/advance/${id}`, data);
    return res.data;
};

export const deleteAdvance = async (id: number) => {
    const res = await axiosInstance.delete(`/advance/${id}`);
    return res.data;
};