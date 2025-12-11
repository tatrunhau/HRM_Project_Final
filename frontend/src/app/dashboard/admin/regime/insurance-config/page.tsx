// src/app/dashboard/admin/salary/insurance-config/page.tsx

'use client';

import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare, faCircleCheck, faSquarePen, faFloppyDisk, faRotateLeft, faGear
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  getInsuranceConfigs, 
  updateInsuranceConfig, 
  InsuranceConfig, 
  InsuranceConfigPayload 
} from '@/services/admin/insuranceConfig'; // Import API service


// --- HELPER FUNCTIONS ---
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Chuyển đổi ngày tháng từ DB sang DD/MM/YYYY
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(date);
};

const formatCurrency = (amount: number) => {
    // Định dạng tiền tệ VND, không hiển thị ký hiệu
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// Chuyển đổi Date object/String sang YYYY-MM-DD để hiển thị trong input type="date"
const dateToInputFormat = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Lấy YYYY-MM-DD
    return date.toISOString().split('T')[0]; 
};

export default function InsuranceConfigPage() {
  // --- STATE ---
  const [configs, setConfigs] = useState<InsuranceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State quản lý Modal Sửa
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEditConfig, setCurrentEditConfig] = useState<InsuranceConfig | null>(null);
  const [formData, setFormData] = useState<InsuranceConfigPayload | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false); // Dùng cho thông báo thành công


  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getInsuranceConfigs();
      setConfigs(data);
    } catch (error) { 
        console.error("Lỗi tải cấu hình bảo hiểm:", error); 
        alert("Lỗi tải dữ liệu cấu hình bảo hiểm.");
    } finally { 
        setIsLoading(false); 
    }
  };
  useEffect(() => { fetchData(); }, []);


  // --- HANDLERS ---
  const handleEditClick = (config: InsuranceConfig) => {
    setCurrentEditConfig(config);
    setFormData({
        employeerate: config.employeerate,
        employerrate: config.employerrate,
        maxsalarybase: config.maxsalarybase,
        // Chuyển ngày tháng sang format input date
        effectivedate: dateToInputFormat(config.effectivedate), 
    });
    setShowEditModal(true);
  };

  const handleInputChange = (field: keyof InsuranceConfigPayload, value: string) => {
    setFormData(prev => {
        if (!prev) return null;
        // Giữ nguyên giá trị string/date cho effectivedate, chuyển số cho các trường khác
        const parsedValue = (field === 'employeerate' || field === 'employerrate' || field === 'maxsalarybase') 
                            ? (value === '' ? '' : parseFloat(value)) // Cho phép rỗng tạm thời
                            : value;
        return { ...prev, [field]: parsedValue };
    });
  };

  const handleConfirmSave = async () => {
    if (!currentEditConfig || !formData) return;

    // Validation
    const requiredFields = [formData.employeerate, formData.employerrate, formData.maxsalarybase, formData.effectivedate];
    if (requiredFields.some(field => field === '' || field === null)) {
        alert("Vui lòng điền đầy đủ tất cả các trường.");
        return;
    }
    
    // Tỉ lệ đóng phải là số dương
    if (parseFloat(String(formData.employeerate)) < 0 || parseFloat(String(formData.employerrate)) < 0) {
        alert("Tỉ lệ đóng không được âm.");
        return;
    }
    
    // Mức lương tối đa phải lớn hơn 0
    if (parseFloat(String(formData.maxsalarybase)) <= 0) {
        alert("Mức lương tối đa phải lớn hơn 0.");
        return;
    }

    // Gửi yêu cầu cập nhật
    try {
      await updateInsuranceConfig(currentEditConfig.insuranceconfigid, {
        ...formData,
        // Chuyển về kiểu Number trước khi gửi (đảm bảo không gửi string rỗng)
        employeerate: parseFloat(String(formData.employeerate)),
        employerrate: parseFloat(String(formData.employerrate)),
        maxsalarybase: parseFloat(String(formData.maxsalarybase)),
      });

      // Cập nhật lại dữ liệu sau khi lưu
      await fetchData(); 
      setShowEditModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Lỗi cập nhật cấu hình:", error);
      alert("Cập nhật thất bại! Vui lòng kiểm tra console.");
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Sidebar />
      <main className="ml-64 transition-all duration-300 ease-in-out">
        <div className="p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản Lý Cấu Hình Bảo Hiểm</h1>
              <p className="text-slate-500 mt-1">Thiết lập các tỉ lệ đóng và mức lương cơ bản tối đa cho các loại bảo hiểm.</p>
            </div>
          </div>

          {/* TABLE - Chỉ có Bảng và Nút Sửa */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-slate-100">
                <FontAwesomeIcon icon={faGear} className="text-xl text-slate-500" />
                <h3 className="font-semibold text-slate-700">Danh sách cấu hình</h3>
            </div>
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="w-[150px] font-bold text-slate-700">Loại Bảo Hiểm</TableHead>
                      <TableHead className="font-bold text-slate-700 text-right">Tỷ lệ NLĐ (%)</TableHead>
                      <TableHead className="font-bold text-slate-700 text-right">Tỷ lệ NSDLĐ (%)</TableHead>
                      <TableHead className="font-bold text-slate-700 text-right w-[180px]">Mức Lương Tối Đa</TableHead>
                      <TableHead className="font-bold text-slate-700 text-center w-[120px]">Ngày Hiệu Lực</TableHead>
                      <TableHead className="text-right font-bold text-slate-700 pr-6 w-[80px]">Sửa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-500">Đang tải dữ liệu...</TableCell></TableRow>
                    ) : configs.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">Không có dữ liệu cấu hình</TableCell></TableRow>
                    ) : (
                        configs.map((config) => (
                        <TableRow key={config.insuranceconfigid} className="hover:bg-slate-50">
                            <TableCell className="font-medium text-slate-800">{config.insurancetype}</TableCell>
                            <TableCell className="text-right text-slate-600">{config.employeerate}%</TableCell>
                            <TableCell className="text-right text-slate-600">{config.employerrate}%</TableCell>
                            <TableCell className="text-right text-slate-600 font-mono">{formatCurrency(config.maxsalarybase)} VNĐ</TableCell>
                            <TableCell className="text-center text-slate-500 whitespace-nowrap">{formatDate(config.effectivedate)}</TableCell>
                            <TableCell className="text-right">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600 hover:bg-orange-100" onClick={() => handleEditClick(config)}>
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                </Button>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
            </div>
          </Card>
        </div>
      </main>
      
      {/* EDIT MODAL */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold bg-orange-600 text-white px-3 py-2 -m-6 mb-4 rounded-t-lg">
              <FontAwesomeIcon icon={faSquarePen} className="mr-2" /> Chỉnh Sửa Cấu Hình: {currentEditConfig?.insurancetype}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Tỉ lệ NLĐ */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tỷ lệ đóng của Người lao động (%)</label>
                <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="VD: 8.0" 
                    className="bg-slate-50" 
                    value={formData?.employeerate ?? ''} 
                    onChange={(e) => handleInputChange('employeerate', e.target.value)} 
                />
            </div>
            {/* Tỉ lệ NSDLĐ */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tỷ lệ đóng của Người sử dụng lao động (%)</label>
                <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="VD: 17.5" 
                    className="bg-slate-50" 
                    value={formData?.employerrate ?? ''} 
                    onChange={(e) => handleInputChange('employerrate', e.target.value)} 
                />
            </div>
            {/* Mức Lương Tối Đa */}
            <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-slate-700">Mức lương cơ bản tối đa (VND)</label>
                <Input 
                    type="number" 
                    step="100000"
                    min="0"
                    placeholder="VD: 36000000" 
                    className="bg-slate-50" 
                    value={formData?.maxsalarybase ?? ''} 
                    onChange={(e) => handleInputChange('maxsalarybase', e.target.value)} 
                />
                <p className='text-xs text-slate-500'>* Nhập số không dấu phân cách.</p>
            </div>
            {/* Ngày Hiệu Lực */}
            <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-slate-700">Ngày Hiệu Lực Mới</label>
                <Input 
                    type="date" 
                    className="bg-slate-50" 
                    value={formData?.effectivedate ?? ''} 
                    onChange={(e) => handleInputChange('effectivedate', e.target.value)} 
                />
            </div>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
                <FontAwesomeIcon icon={faRotateLeft} className="mr-2" /> Hủy bỏ
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleConfirmSave}>
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" /> Lưu Thay Đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* SUCCESS MODAL */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="flex flex-col items-center justify-center">
            <div className="text-green-500 text-5xl mb-3"><FontAwesomeIcon icon={faCircleCheck} /></div>
            <DialogTitle className="text-lg font-semibold text-center">Thành công!</DialogTitle>
            <p className="text-center text-gray-500 text-sm">Cấu hình đã được cập nhật thành công.</p>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button className="bg-black hover:bg-gray-800 w-24" onClick={() => setShowSuccessModal(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}