import api from "@/lib/axios";

// --- Interfaces (Models Frontend) ---

export interface TaxConfig {
  taxconfigid: number;
  taxlevel: number;
  minamount: number;
  maxamount: number | null;
  taxrate: number;
  status?: boolean;
}

export interface DeductionConfig {
  deductionconfigid: number;
  deductiontype: string;
  // Trong DB có thể chưa có col 'name', frontend có thể tự map dựa vào type
  deductionname?: string; 
  amount: number;
}

export interface PenaltyConfig {
  penaltyconfigid: number;
  penaltytype: string;
  min_minutes: number;
  max_minutes: number;
  penaltyrate: number;   // %
  fixedamount: number;   // VNĐ
  description: string;
}

// --- 1. API Cấu hình Thuế (Tax) ---

export const getTaxConfigs = async (): Promise<TaxConfig[]> => {
  try {
    const res = await api.get('/payroll/config/tax');
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy config thuế:", error);
    return [];
  }
};

export const createTaxConfig = async (data: { level: number, min: number, max?: number, rate: number }) => {
  const res = await api.post('/payroll/config/tax', data);
  return res.data;
};

export const updateTaxConfig = async (id: number, data: { level: number, min: number, max?: number, rate: number }) => {
  const res = await api.put(`/payroll/config/tax/${id}`, data);
  return res.data;
};

export const deleteTaxConfig = async (id: number) => {
  const res = await api.delete(`/payroll/config/tax/${id}`);
  return res.data;
};

// --- 2. API Cấu hình Giảm trừ (Deduction) ---

export const getDeductionConfigs = async (): Promise<DeductionConfig[]> => {
  try {
    const res = await api.get('/payroll/config/deduction');
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy config giảm trừ:", error);
    return [];
  }
};

// Chỉ cho phép update Amount
export const updateDeductionConfig = async (id: number, amount: number) => {
  const res = await api.put(`/payroll/config/deduction/${id}`, { amount });
  return res.data;
};

// --- 3. API Cấu hình Phạt (Penalty) ---

export const getPenaltyConfigs = async (): Promise<PenaltyConfig[]> => {
  try {
    const res = await api.get('/payroll/config/penalty');
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy config phạt:", error);
    return [];
  }
};

export const createPenaltyConfig = async (data: any) => {
  const res = await api.post('/payroll/config/penalty', data);
  return res.data;
};

export const updatePenaltyConfig = async (id: number, data: any) => {
  const res = await api.put(`/payroll/config/penalty/${id}`, data);
  return res.data;
};

export const deletePenaltyConfig = async (id: number) => {
  const res = await api.delete(`/payroll/config/penalty/${id}`);
  return res.data;
};

// --- API BẢNG LƯƠNG (SALARY) ---

// 1. Tính toán bảng lương (Trigger nút "Tạo Bảng Lương")
export const calculateMonthlyPayroll = async (month: number, year: number) => {
  try {
    const res = await api.post('/payroll/calculate', { month, year });
    return res.data;
  } catch (error: any) {
    console.error("Lỗi tính lương:", error);
    throw error.response?.data?.message || "Lỗi hệ thống";
  }
};

// 2. Lấy danh sách lương tháng (Để hiển thị ra bảng)
// export const getMonthlySalaries = async (month: number, year: number) => {
//     try {
//         const res = await api.get(`/payroll/salaries?month=${month}&year=${year}`);
//         return res.data;
//     } catch (error) {
//         console.error("Lỗi tải bảng lương:", error);
//         return [];
//     }
// };

// 3. Xuất Excel
export const exportPayroll = async (month: number, year: number) => {
    try {
        const response = await api.get(`/payroll/export?month=${month}&year=${year}`, {
            responseType: 'blob', // Quan trọng: Để nhận file binary
        });
        
        // Tạo link tải xuống ảo
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `BangLuong_T${month}_${year}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return true;
    } catch (error) {
        console.error("Lỗi xuất Excel:", error);
        return false;
    }
};

// Cập nhật hàm getMonthlySalaries để hỗ trợ search
export const getMonthlySalaries = async (month: number, year: number, search: string = '') => {
    try {
        const res = await api.get(`/payroll/salaries?month=${month}&year=${year}&search=${search}`);
        return res.data;
    } catch (error) {
        console.error("Lỗi tải bảng lương:", error);
        return [];
    }
};

// --- API ỨNG LƯƠNG (ADVANCE REQUEST) ---

export interface AdvanceRequest {
    advancerequestid: number;
    employee: {
        employeecode: string;
        name: string;
    };
    advanceamount: number;
    createddate: string; // hoặc Date
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
}

// 1. Lấy danh sách ứng lương
export const getAdvanceRequests = async (search: string = '', status: string = '') => {
    try {
        // Có thể thêm tham số month/year nếu cần
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        
        const res = await api.get(`/payroll/advance?${params.toString()}`);
        return res.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách ứng lương:", error);
        return [];
    }
};

// 2. Tạo đơn ứng lương
export const createAdvanceRequest = async (data: { employeeId: string, date: string, amount: number, reason: string }) => {
    try {
        const res = await api.post('/payroll/advance', data);
        return res.data;
    } catch (error: any) {
         throw error.response?.data?.message || "Lỗi tạo đơn ứng";
    }
};

// 3. Cập nhật trạng thái (Duyệt/Từ chối)
export const updateAdvanceStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
        const res = await api.put(`/payroll/advance/${id}`, { status });
        return res.data;
    } catch (error: any) {
        throw error.response?.data?.message || "Lỗi cập nhật trạng thái";
    }
};

// 4. Xóa đơn
export const deleteAdvanceRequest = async (id: number) => {
    try {
        const res = await api.delete(`/payroll/advance/${id}`);
        return res.data;
    } catch (error: any) {
        throw error.response?.data?.message || "Lỗi xóa đơn";
    }
};

// 5. Xuất Excel danh sách ứng lương
export const exportAdvanceRequests = async (search: string = '', status: string = '') => {
    try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        // Nếu muốn lọc theo tháng hiện tại đang chọn ở UI, bạn có thể truyền thêm month, year vào đây

        const response = await api.get(`/payroll/advance/export?${params.toString()}`, {
            responseType: 'blob', // Quan trọng
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `DS_UngLuong_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return true;
    } catch (error) {
        console.error("Lỗi xuất Excel:", error);
        return false;
    }
};
// 6. Lấy danh sách nhân viên cho Dropdown
export const getEmployeesList = async () => {
    try {
        const res = await api.get('/payroll/employees');
        return res.data;
    } catch (error) {
        console.error("Lỗi tải danh sách nhân viên:", error);
        return [];
    }
};
// Thêm hàm này vào cuối file hoặc gần các hàm Advance Request khác
export const updateAdvanceRequest = async (id: number, data: { status: string, admin_comment?: string }) => {
    try {
        // Gọi API PUT để cập nhật trạng thái đơn ứng lương
        const res = await api.put(`/payroll/advance/${id}`, data);
        return res.data;
    } catch (error: any) {
        throw error.response?.data?.message || "Lỗi cập nhật trạng thái đơn ứng lương";
    }
};