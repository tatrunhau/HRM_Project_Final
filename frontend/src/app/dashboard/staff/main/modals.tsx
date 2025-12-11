'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faAddressCard, faGraduationCap, faEnvelope, faPhone, 
  faFloppyDisk
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { Certificate, EmployeeDetail, UpdateProfilePayload, SalaryDetail } from '@/services/staff/staff';

// ==========================================
// 1. MODAL CẬP NHẬT THÔNG TIN (EmployeeUpdateProfileModal)
// ==========================================

interface UpdateModalProps {
  showModal: boolean; 
  setShowModal: (v: boolean) => void;
  initialData: EmployeeDetail | null; 
  certificates: Certificate[]; 
  onSave: (data: UpdateProfilePayload) => void;
  isSaving: boolean; 
}

// Helper: Chuyển ngày từ ISO sang YYYY-MM-DD cho input date
const formatDateInput = (d: string | null | undefined) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toISOString().split('T')[0];
};

export default function EmployeeUpdateProfileModal({
    showModal, 
    setShowModal, 
    initialData, 
    certificates, 
    onSave,
    isSaving
}: UpdateModalProps) {
    
    // State quản lý dữ liệu form
    const [formData, setFormData] = useState<UpdateProfilePayload>({
        name: '', 
        dateofbirth: '', 
        gender: false, 
        cccd: '', 
        phonenumber: '', 
        email: '', 
        maritalstatus: false, 
        religion: false, 
        educationlevel: ''
    });

    // Load dữ liệu ban đầu
    useEffect(() => {
        if (initialData && showModal) {
            setFormData({
                name: initialData.name || '',
                dateofbirth: formatDateInput(initialData.dateofbirth),
                gender: initialData.gender ?? false, 
                cccd: initialData.cccd?.toString() || '',
                phonenumber: initialData.phonenumber?.toString() || '',
                email: initialData.email || '',
                maritalstatus: initialData.maritalstatus ?? false,
                religion: initialData.religion ?? false,
                educationlevel: initialData.educationlevel?.toString() || '',
            });
        }
    }, [initialData, showModal]);

    const handleInputChange = (field: keyof UpdateProfilePayload, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSelectChange = (field: keyof UpdateProfilePayload, value: string) => {
        if (field === 'gender' || field === 'maritalstatus' || field === 'religion') {
             setFormData(prev => ({ ...prev, [field]: value === 'true' }));
        } else {
             setFormData(prev => ({ ...prev, [field]: value }));
        }
    };
    
    const handleSave = () => {
        if (!formData.name || !formData.cccd || !formData.phonenumber) {
            alert("Vui lòng nhập đầy đủ các trường bắt buộc (*)");
            return;
        }
        onSave(formData);
    };

    return (
        <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-2 rounded-md">
                           <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-slate-800">
                                Cập Nhật Thông Tin Cá Nhân
                            </DialogTitle>
                            <DialogDescription>Chỉnh sửa các thông tin cơ bản và liên hệ của bạn.</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CỘT 1: THÔNG TIN CƠ BẢN & LIÊN HỆ */}
                    <div className="space-y-4 border-r pr-0 md:pr-6 border-slate-100">
                        <h4 className="text-sm font-bold text-blue-700 uppercase flex items-center gap-2">
                            <FontAwesomeIcon icon={faAddressCard}/> Thông Tin Cá Nhân
                        </h4>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600">Họ và tên <span className="text-red-500">*</span></label>
                            <Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Ngày sinh</label>
                                <Input type="date" value={formData.dateofbirth} onChange={(e) => handleInputChange('dateofbirth', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Giới tính</label>
                                <Select value={formData.gender ? 'true' : 'false'} onValueChange={(val) => handleSelectChange('gender', val)}>
                                    <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Nam</SelectItem>
                                        <SelectItem value="false">Nữ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600">CCCD / CMND <span className="text-red-500">*</span></label>
                            <Input 
                                type="number" 
                                value={formData.cccd} 
                                onChange={(e) => handleInputChange('cccd', e.target.value)} 
                            />
                        </div>
                        
                        <h4 className="text-sm font-bold text-blue-700 uppercase flex items-center gap-2 pt-4 border-t border-slate-100">
                            <FontAwesomeIcon icon={faEnvelope}/> Thông Tin Liên Hệ
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">SĐT <span className="text-red-500">*</span></label>
                                <Input type="number" value={formData.phonenumber} onChange={(e) => handleInputChange('phonenumber', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Email <span className="text-red-500">*</span></label>
                                <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* CỘT 2: THÔNG TIN KHÁC */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-purple-600 uppercase flex items-center gap-2">
                            <FontAwesomeIcon icon={faGraduationCap}/> Thông Tin Khác
                        </h4>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-600">Trình độ học vấn</label>
                            <Select 
                                value={formData.educationlevel ? formData.educationlevel.toString() : ''} 
                                onValueChange={(val) => handleInputChange('educationlevel', val)}
                            >
                                <SelectTrigger><SelectValue placeholder="Chọn trình độ" /></SelectTrigger>
                                <SelectContent>
                                    {certificates.map((c) => (
                                        <SelectItem key={c.certificateid} value={c.certificateid.toString()}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Tình trạng Hôn nhân</label>
                                <Select value={formData.maritalstatus ? 'true' : 'false'} onValueChange={(val) => handleSelectChange('maritalstatus', val)}>
                                    <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="false">Độc thân</SelectItem>
                                        <SelectItem value="true">Đã kết hôn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Tôn giáo</label>
                                <Select value={formData.religion ? 'true' : 'false'} onValueChange={(val) => handleSelectChange('religion', val)}>
                                    <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="false">Không</SelectItem>
                                        <SelectItem value="true">Có</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                    <Button variant="ghost" onClick={() => setShowModal(false)} disabled={isSaving}>Hủy bỏ</Button>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSave} disabled={isSaving}>
                        <FontAwesomeIcon icon={faFloppyDisk} className="mr-2"/> 
                        {isSaving ? 'Đang lưu...' : 'Lưu Thông Tin'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==========================================
// 2. MODAL XEM CHI TIẾT LƯƠNG (SalaryDetailModal)
// ==========================================
// Thêm phần này vào cuối file modals.tsx

interface SalaryModalProps {
    showModal: boolean;
    setShowModal: (v: boolean) => void;
    data: SalaryDetail | null;
    employeeName: string;
}

// Helper format tiền tệ VND
const formatCurrency = (amount: string | number | undefined) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
};

export function SalaryDetailModal({ showModal, setShowModal, data, employeeName }: SalaryModalProps) {
    if (!data) return null;

    // Tính toán tổng (DB có thể lưu sẵn hoặc không, ta tính lại cho chắc chắn)
    const totalIncome = Number(data.basicsalary) + Number(data.totalallowance) + Number(data.overtimeamount);
    const totalDeduction = Number(data.insuranceamount) + Number(data.taxamount) + Number(data.penaltyamount) + Number(data.advanceamount);

    return (
        <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white rounded-xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <DialogHeader className="p-4 border-b text-center bg-white sticky top-0 z-10 shrink-0">
                    <DialogTitle className="text-lg md:text-2xl font-bold text-blue-700 uppercase">
                        Phiếu Lương Tháng {data.month}/{data.year}
                    </DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        Nhân viên: <span className="font-semibold text-gray-800">{employeeName}</span>
                    </p>
                </DialogHeader>

                {/* Body - Có thanh cuộn nếu nội dung dài */}
                <div className="p-4 md:p-6 space-y-6 overflow-y-auto">
                    
                    {/* PHẦN I: THU NHẬP (MÀU XANH LÁ) */}
                    <div className="border border-green-200 rounded-lg overflow-hidden">
                        <div className="bg-green-100/50 px-4 py-2 border-b border-green-200">
                            <h3 className="font-bold text-green-700 text-sm md:text-base">I. THU NHẬP</h3>
                        </div>
                        <div className="p-4 bg-green-50/20">
                            {/* Grid 1 cột trên mobile, 2 cột trên PC */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                                <SalaryRow label="Lương cơ bản" value={data.basicsalary} />
                                <SalaryRow label="Phụ cấp" value={data.totalallowance} />
                                <SalaryRow label="Lương OT" value={data.overtimeamount} />
                            </div>
                            <div className="mt-4 pt-3 border-t border-green-200 flex justify-between items-center">
                                <span className="font-bold text-green-800 text-sm md:text-base">Tổng thu nhập:</span>
                                <span className="font-bold text-green-700 text-base md:text-lg">{formatCurrency(totalIncome)}</span>
                            </div>
                        </div>
                    </div>

                    {/* PHẦN II: KHẤU TRỪ (MÀU ĐỎ) */}
                    <div className="border border-red-200 rounded-lg overflow-hidden">
                        <div className="bg-red-100/50 px-4 py-2 border-b border-red-200">
                            <h3 className="font-bold text-red-700 text-sm md:text-base">II. KHẤU TRỪ</h3>
                        </div>
                        <div className="p-4 bg-red-50/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                                <SalaryRow label="Bảo hiểm" value={data.insuranceamount} />
                                <SalaryRow label="Thuế TNCN" value={data.taxamount} />
                                <SalaryRow label="Phạt vi phạm" value={data.penaltyamount} />
                                <SalaryRow label="Ứng lương" value={data.advanceamount} />
                            </div>
                            <div className="mt-4 pt-3 border-t border-red-200 flex justify-between items-center">
                                <span className="font-bold text-red-800 text-sm md:text-base">Tổng khấu trừ:</span>
                                <span className="font-bold text-red-700 text-base md:text-lg">{formatCurrency(totalDeduction)}</span>
                            </div>
                        </div>
                    </div>

                    {/* PHẦN III: THỰC LĨNH (MÀU XANH DƯƠNG - NỔI BẬT) */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-2">
                        <span className="text-base md:text-xl font-bold text-blue-800 uppercase">THỰC LĨNH:</span>
                        <span className="text-2xl md:text-3xl font-bold text-blue-600">
                            {formatCurrency(data.netsalary)}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end shrink-0">
                    <Button 
                        onClick={() => setShowModal(false)}
                        className="bg-gray-800 text-white hover:bg-gray-900"
                    >
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Component con hiển thị từng dòng trong bảng lương
const SalaryRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="flex justify-between items-center md:block">
        <span className="text-gray-600 text-sm md:float-left">{label}:</span>
        <span className="font-semibold text-gray-900 text-sm md:text-base md:float-right">{formatCurrency(value)}</span>
        <div className="hidden md:block clear-both"></div> 
    </div>
);