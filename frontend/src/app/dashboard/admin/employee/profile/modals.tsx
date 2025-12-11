'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation, faCircleCheck, faFloppyDisk, faUser, faUsers,
  faBriefcase, faInfoCircle, faMoneyBill, faAddressCard, faGraduationCap,
  faEnvelope, faPhone, faVenusMars, faBirthdayCake, faIdCard, faPray, faRing, faFileContract,
  faPaperclip, faXmark, faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import { Badge } from '@/components/ui/badge';
import { useRef, useState, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: 'Probation', label: 'Thử việc' },
  { value: 'Official', label: 'Chính thức' },
  { value: 'Resigned', label: 'Đã nghỉ việc' },
];

interface ModalProps {
  showModal: boolean; setShowModal: (v: boolean) => void;
  showDeleteModal: boolean; setShowDeleteModal: (v: boolean) => void;
  showSuccessModal: boolean; setShowSuccessModal: (v: boolean) => void;
  showViewModal: boolean; setShowViewModal: (v: boolean) => void;
  viewData: any;

  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  
  // Lists
  departments: any[];
  jobTitles: any[];
  contracts: any[];
  certificates: any[];

  // File Upload
  attachedFile: File | null;
  setAttachedFile: (file: File | null) => void;
  existingFileUrl: string;

  onConfirmSave: () => void;
  onConfirmDelete: () => void;
}

export default function EmployeeModals({
  showModal, setShowModal,
  showDeleteModal, setShowDeleteModal,
  showSuccessModal, setShowSuccessModal,
  showViewModal, setShowViewModal,
  viewData,
  isEditing,
  formData, setFormData,
  departments, jobTitles, contracts, certificates,
  attachedFile, setAttachedFile, existingFileUrl,
  onConfirmSave, onConfirmDelete
}: ModalProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- 1. STATE LƯU LỖI ---
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset lỗi khi đóng/mở modal
  useEffect(() => {
    if (showModal) setErrors({});
  }, [showModal]);

  // --- 2. HÀM VALIDATE DỮ LIỆU ---
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    // --- Cột 1: Thông tin cá nhân ---
    if (!formData.name?.trim()) { newErrors.name = 'Vui lòng nhập họ tên.'; isValid = false; }
    if (!formData.dateofbirth) { newErrors.dateofbirth = 'Chọn ngày sinh.'; isValid = false; }
    if (formData.gender === undefined || formData.gender === null) { newErrors.gender = 'Chọn giới tính.'; isValid = false; }
    if (!formData.cccd?.trim()) { newErrors.cccd = 'Nhập CCCD/CMND.'; isValid = false; }
    if (!formData.phonenumber?.trim()) { newErrors.phonenumber = 'Nhập SĐT.'; isValid = false; }
    if (!formData.email?.trim()) { newErrors.email = 'Nhập Email.'; isValid = false; }

    // --- Cột 2: Công việc & Lương ---
    if (!formData.departmentid) { newErrors.departmentid = 'Chọn phòng ban.'; isValid = false; }
    if (!formData.jobtitleid) { newErrors.jobtitleid = 'Chọn chức danh.'; isValid = false; }
    if (!formData.contractid) { newErrors.contractid = 'Chọn loại HĐ.'; isValid = false; }
    if (!formData.joineddate) { newErrors.joineddate = 'Chọn ngày vào làm.'; isValid = false; }
    if (!formData.status) { newErrors.status = 'Chọn trạng thái.'; isValid = false; }
    if (!formData.basicsalary || Number(formData.basicsalary) < 0) { newErrors.basicsalary = 'Nhập lương cơ bản.'; isValid = false; }

    // --- Cột 3: Thông tin khác ---
    if (!formData.educationlevel) { newErrors.educationlevel = 'Chọn trình độ.'; isValid = false; }
    if (formData.maritalstatus === undefined || formData.maritalstatus === null) { newErrors.maritalstatus = 'Chọn TT hôn nhân.'; isValid = false; }
    if (formData.religion === undefined || formData.religion === null) { newErrors.religion = 'Chọn tôn giáo.'; isValid = false; }
    // Dependents có thể để 0 (mặc định), nhưng không được để trống hoàn toàn
    if (formData.dependents === undefined || formData.dependents === '' || Number(formData.dependents) < 0) { 
        newErrors.dependents = 'Nhập số người.'; isValid = false; 
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSaveClick = () => {
    if (validateForm()) {
      onConfirmSave();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    // Xóa lỗi khi người dùng bắt đầu nhập
    if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // --- FILE HANDLERS ---
  const handleButtonClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: any) => { if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); };
  const removeFile = () => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const shortenFileName = (name: string) => name.length > 20 ? `${name.slice(0, 10)}...${name.slice(-7)}` : name;
  const handleViewAttachedFile = (e: any) => {
    e.stopPropagation();
    if (attachedFile) {
        const url = URL.createObjectURL(attachedFile);
        window.open(url, '_blank');
    } else if (existingFileUrl) {
        window.open(existingFileUrl, '_blank');
    }
  };

  // --- HELPERS HIỂN THỊ ---
  const getDeptName = (id: any) => departments.find(d => d.departmentid == id)?.name || '---';
  const getJobName = (id: any) => jobTitles.find(j => j.jobtitleid == id)?.name || '---';
  const getContractName = (id: any) => contracts.find(c => c.contractid == id)?.name || '---';
  const getCertName = (id: any) => certificates.find(c => c.certificateid == id)?.name || '---';
  
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '---';
  const formatDateInput = (d: string) => d ? new Date(d).toISOString().split('T')[0] : '';

  const formatCurrency = (amount: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount) || 0);
  
  const getStatusBadge = (status: string) => {
    const map: any = { 'Official': 'bg-green-100 text-green-700', 'Probation': 'bg-yellow-100 text-yellow-700', 'Resigned': 'bg-red-100 text-red-700' };
    const label: any = { 'Official': 'Chính thức', 'Probation': 'Thử việc', 'Resigned': 'Đã nghỉ việc' };
    return <Badge className={`font-normal border-0 ${map[status] || 'bg-gray-100'}`}>{label[status] || status}</Badge>;
  };

  return (
    <>
      {/* --- 1. FORM MODAL --- */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
                <div className={`${isEditing ? 'bg-orange-500' : 'bg-blue-700'} text-white p-2 rounded-md`}>
                   <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {isEditing ? 'Cập Nhật Hồ Sơ Nhân Sự' : 'Thêm Mới Nhân Viên'}
                    </DialogTitle>
                    <DialogDescription>Quản lý thông tin chi tiết nhân sự.</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CỘT 1: THÔNG TIN CÁ NHÂN */}
            <div className="space-y-4 border-r pr-6 border-slate-100">
                <h4 className="text-sm font-bold text-blue-700 uppercase flex items-center gap-2"><FontAwesomeIcon icon={faAddressCard}/> Thông Tin Cá Nhân</h4>
                
                <div className="space-y-2"><label className="text-xs font-semibold text-slate-600">Mã nhân viên</label><Input value={formData.employeecode || ''} disabled className="bg-slate-100 font-mono text-slate-500" placeholder="Tự động sinh..." /></div>
                
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Họ và tên <span className="text-red-500">*</span></label>
                    <Input 
                        value={formData.name || ''} 
                        onChange={(e) => handleInputChange('name', e.target.value)} 
                        className={errors.name ? 'border-red-500 focus-visible:ring-red-200' : ''}
                    />
                    {errors.name && <p className="text-[10px] text-red-500">{errors.name}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">Ngày sinh <span className="text-red-500">*</span></label>
                        <Input 
                            type="date" 
                            value={formatDateInput(formData.dateofbirth)} 
                            onChange={(e) => handleInputChange('dateofbirth', e.target.value)} 
                            className={errors.dateofbirth ? 'border-red-500' : ''}
                        />
                         {errors.dateofbirth && <p className="text-[10px] text-red-500">{errors.dateofbirth}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">Giới tính <span className="text-red-500">*</span></label>
                        <Select value={formData.gender?.toString()} onValueChange={(val) => handleInputChange('gender', val === 'true')}>
                            <SelectTrigger className={errors.gender ? 'border-red-500' : ''}><SelectValue placeholder="Chọn" /></SelectTrigger>
                            <SelectContent><SelectItem value="true">Nam</SelectItem><SelectItem value="false">Nữ</SelectItem></SelectContent>
                        </Select>
                        {errors.gender && <p className="text-[10px] text-red-500">{errors.gender}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">CCCD / CMND <span className="text-red-500">*</span></label>
                    <Input 
                        type="number" 
                        value={formData.cccd || ''} 
                        onChange={(e) => handleInputChange('cccd', e.target.value)} 
                        className={errors.cccd ? 'border-red-500 focus-visible:ring-red-200' : ''}
                    />
                    {errors.cccd && <p className="text-[10px] text-red-500">{errors.cccd}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">SĐT <span className="text-red-500">*</span></label>
                        <Input 
                            type="number" 
                            value={formData.phonenumber || ''} 
                            onChange={(e) => handleInputChange('phonenumber', e.target.value)} 
                            className={errors.phonenumber ? 'border-red-500 focus-visible:ring-red-200' : ''}
                        />
                        {errors.phonenumber && <p className="text-[10px] text-red-500">{errors.phonenumber}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">Email <span className="text-red-500">*</span></label>
                        <Input 
                            type="email" 
                            value={formData.email || ''} 
                            onChange={(e) => handleInputChange('email', e.target.value)} 
                            className={errors.email ? 'border-red-500 focus-visible:ring-red-200' : ''}
                        />
                        {errors.email && <p className="text-[10px] text-red-500">{errors.email}</p>}
                    </div>
                </div>
            </div>

            {/* CỘT 2: CÔNG VIỆC */}
            <div className="space-y-4 border-r pr-6 border-slate-100">
                <h4 className="text-sm font-bold text-orange-600 uppercase flex items-center gap-2"><FontAwesomeIcon icon={faBriefcase}/> Công Việc & Lương</h4>
                
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Phòng ban <span className="text-red-500">*</span></label>
                    <Select value={formData.departmentid} onValueChange={(val) => handleInputChange('departmentid', val)}>
                        <SelectTrigger className={errors.departmentid ? 'border-red-500' : ''}><SelectValue placeholder="Chọn phòng ban" /></SelectTrigger>
                        <SelectContent>{departments.map((d: any) => <SelectItem key={d.departmentid} value={d.departmentid.toString()}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.departmentid && <p className="text-[10px] text-red-500">{errors.departmentid}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Chức danh <span className="text-red-500">*</span></label>
                    <Select value={formData.jobtitleid} onValueChange={(val) => handleInputChange('jobtitleid', val)}>
                        <SelectTrigger className={errors.jobtitleid ? 'border-red-500' : ''}><SelectValue placeholder="Chọn chức vụ" /></SelectTrigger>
                        <SelectContent>{jobTitles.map((j: any) => <SelectItem key={j.jobtitleid} value={j.jobtitleid.toString()}>{j.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.jobtitleid && <p className="text-[10px] text-red-500">{errors.jobtitleid}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Loại hợp đồng <span className="text-red-500">*</span></label>
                    <Select value={formData.contractid} onValueChange={(val) => handleInputChange('contractid', val)}>
                        <SelectTrigger className={errors.contractid ? 'border-red-500' : ''}><SelectValue placeholder="Chọn hợp đồng" /></SelectTrigger>
                        <SelectContent>{contracts.map((c: any) => <SelectItem key={c.contractid} value={c.contractid.toString()}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.contractid && <p className="text-[10px] text-red-500">{errors.contractid}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">Ngày vào làm <span className="text-red-500">*</span></label>
                        <Input 
                            type="date" 
                            value={formatDateInput(formData.joineddate)} 
                            onChange={(e) => handleInputChange('joineddate', e.target.value)} 
                            className={errors.joineddate ? 'border-red-500' : ''}
                        />
                        {errors.joineddate && <p className="text-[10px] text-red-500">{errors.joineddate}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">Trạng thái <span className="text-red-500">*</span></label>
                        <Select value={formData.status} onValueChange={(val) => handleInputChange('status', val)}>
                            <SelectTrigger className={errors.status ? 'border-red-500' : ''}><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                            <SelectContent>{STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                        {errors.status && <p className="text-[10px] text-red-500">{errors.status}</p>}
                    </div>
                </div>

                <div className={`space-y-2 bg-slate-50 p-3 rounded border ${errors.basicsalary ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><FontAwesomeIcon icon={faMoneyBill} className="text-green-600"/> Lương cơ bản (VNĐ) <span className="text-red-500">*</span></label>
                    <Input 
                        type="number" 
                        className={`bg-white border-slate-300 text-right font-mono text-slate-900 font-semibold ${errors.basicsalary ? 'border-red-500 focus-visible:ring-red-200' : ''}`}
                        value={formData.basicsalary || ''} 
                        onChange={(e) => handleInputChange('basicsalary', e.target.value)} 
                        placeholder="0" 
                    />
                    {errors.basicsalary && <p className="text-[10px] text-red-500 text-right">{errors.basicsalary}</p>}
                </div>
            </div>

            {/* CỘT 3: THÔNG TIN KHÁC + FILE */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-purple-600 uppercase flex items-center gap-2"><FontAwesomeIcon icon={faGraduationCap}/> Thông Tin Khác</h4>
                
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Trình độ học vấn <span className="text-red-500">*</span></label>
                    <Select value={formData.educationlevel} onValueChange={(val) => handleInputChange('educationlevel', val)}>
                        <SelectTrigger className={errors.educationlevel ? 'border-red-500' : ''}><SelectValue placeholder="Chọn trình độ" /></SelectTrigger>
                        <SelectContent>{certificates.map((c: any) => <SelectItem key={c.certificateid} value={c.certificateid.toString()}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.educationlevel && <p className="text-[10px] text-red-500">{errors.educationlevel}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">Hôn nhân <span className="text-red-500">*</span></label>
                        <Select value={formData.maritalstatus?.toString()} onValueChange={(val) => handleInputChange('maritalstatus', val === 'true')}>
                            <SelectTrigger className={errors.maritalstatus ? 'border-red-500' : ''}><SelectValue placeholder="Chọn" /></SelectTrigger>
                            <SelectContent><SelectItem value="false">Độc thân</SelectItem><SelectItem value="true">Đã kết hôn</SelectItem></SelectContent>
                        </Select>
                        {errors.maritalstatus && <p className="text-[10px] text-red-500">{errors.maritalstatus}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-600">Tôn giáo <span className="text-red-500">*</span></label>
                        <Select value={formData.religion?.toString()} onValueChange={(val) => handleInputChange('religion', val === 'true')}>
                            <SelectTrigger className={errors.religion ? 'border-red-500' : ''}><SelectValue placeholder="Chọn" /></SelectTrigger>
                            <SelectContent><SelectItem value="false">Không</SelectItem><SelectItem value="true">Có</SelectItem></SelectContent>
                        </Select>
                         {errors.religion && <p className="text-[10px] text-red-500">{errors.religion}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Số người phụ thuộc (Giảm trừ) <span className="text-red-500">*</span></label>
                    <Input 
                        type="number" 
                        min="0"
                        placeholder="0"
                        value={formData.dependents} 
                        onChange={(e) => handleInputChange('dependents', e.target.value)}
                        className={errors.dependents ? 'border-red-500 focus-visible:ring-red-200' : ''}
                    />
                     {errors.dependents && <p className="text-[10px] text-red-500">{errors.dependents}</p>}
                </div>

                <div className="space-y-2"><label className="text-xs font-semibold text-slate-600">Ngày nghỉ việc (Nếu có)</label><Input type="date" value={formatDateInput(formData.layoff)} onChange={(e) => handleInputChange('layoff', e.target.value)} /></div>
                
                {/* --- FILE UPLOAD (KHÔNG VALIDATE) --- */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Hồ sơ / Tài liệu đính kèm</label>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" />
                    
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleButtonClick} 
                        className={`w-full border-dashed border-2 h-10 transition-all duration-200 ${(attachedFile || existingFileUrl) ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600'}`}
                    >
                      {(attachedFile || existingFileUrl) ? (
                        <div className="flex items-center w-full justify-between">
                            <div className="flex items-center truncate cursor-pointer hover:underline" onClick={handleViewAttachedFile} title="Nhấn để xem file">
                                <FontAwesomeIcon icon={faCircleCheck} className="mr-2"/>
                                <span className="truncate max-w-[180px]">{attachedFile ? shortenFileName(attachedFile.name) : 'Đã có File'}</span>
                                {attachedFile && <span className="ml-1 text-[10px] text-green-600">(Mới)</span>}
                            </div>
                            <div className="p-1 hover:bg-red-200 rounded-full text-red-500 transition-colors" onClick={(e) => { e.stopPropagation(); removeFile(); }}>
                                <FontAwesomeIcon icon={faXmark} />
                            </div>
                        </div> 
                      ) : (
                        <><FontAwesomeIcon icon={faPaperclip} className="mr-2" /><span>Đính kèm file</span></>
                      )}
                    </Button>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Ghi chú</label>
                    <textarea 
                        className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" 
                        value={formData.note || ''} 
                        onChange={(e) => handleInputChange('note', e.target.value)} 
                        placeholder="Ghi chú thêm..." 
                    />
                </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleSaveClick}>
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2"/>
                {isEditing ? 'Lưu Thay Đổi' : 'Tạo Hồ Sơ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- 2. VIEW MODAL (GIỮ NGUYÊN) --- */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-4xl">
          {viewData && (
            <>
                <DialogHeader className="border-b pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold border-2 border-blue-200">
                            {viewData.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold text-slate-800">{viewData.name}</DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-slate-600 font-mono">{viewData.employeecode}</Badge>
                                {getStatusBadge(viewData.status)}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* KHỐI 1 */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-blue-700 uppercase border-b pb-1">Thông tin cá nhân</h4>
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                            <div><p className="text-slate-500 text-xs uppercase mb-1">Email</p><p className="font-medium flex items-center gap-2"><FontAwesomeIcon icon={faEnvelope} className="text-slate-400"/> {viewData.email || '---'}</p></div>
                            <div><p className="text-slate-500 text-xs uppercase mb-1">Điện thoại</p><p className="font-medium flex items-center gap-2"><FontAwesomeIcon icon={faPhone} className="text-slate-400"/> {viewData.phonenumber || '---'}</p></div>
                            <div><p className="text-slate-500 text-xs uppercase mb-1">Ngày sinh</p><p className="font-medium flex items-center gap-2"><FontAwesomeIcon icon={faBirthdayCake} className="text-slate-400"/> {formatDate(viewData.dateofbirth)}</p></div>
                            <div><p className="text-slate-500 text-xs uppercase mb-1">Giới tính</p><p className="font-medium flex items-center gap-2"><FontAwesomeIcon icon={faVenusMars} className="text-slate-400"/> {viewData.gender ? 'Nam' : 'Nữ'}</p></div>
                            <div><p className="text-slate-500 text-xs uppercase mb-1">CCCD</p><p className="font-medium flex items-center gap-2"><FontAwesomeIcon icon={faIdCard} className="text-slate-400"/> {viewData.cccd || '---'}</p></div>
                            <div><p className="text-slate-500 text-xs uppercase mb-1">Hôn nhân</p><p className="font-medium flex items-center gap-2"><FontAwesomeIcon icon={faRing} className="text-slate-400"/> {viewData.maritalstatus ? 'Đã kết hôn' : 'Độc thân'}</p></div>
                            
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Người phụ thuộc</p>
                                <p className="font-medium flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUsers} className="text-slate-400"/> 
                                    {viewData.dependents || 0} người
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 2 */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-orange-600 uppercase border-b pb-1">Công việc & Lương</h4>
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2">
                                <div><p className="text-slate-500 text-xs uppercase mb-1">Phòng ban</p><p className="font-medium">{getDeptName(viewData.departmentid)}</p></div>
                                <div><p className="text-slate-500 text-xs uppercase mb-1">Chức danh</p><p className="font-medium">{getJobName(viewData.jobtitleid)}</p></div>
                            </div>
                            <div><p className="text-slate-500 text-xs uppercase mb-1">Loại hợp đồng</p><p className="font-medium flex items-center gap-2"><FontAwesomeIcon icon={faFileContract} className="text-slate-400"/> {getContractName(viewData.contractid)}</p></div>
                            
                            <div>
                                <p className="text-slate-500 text-xs uppercase mb-1">Hồ sơ đính kèm</p>
                                {viewData.cv_file ? (
                                    <a href={viewData.cv_file} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                                        <FontAwesomeIcon icon={faFilePdf} /> Xem tài liệu
                                    </a>
                                ) : <span className="text-gray-400 italic">Không có file</span>}
                            </div>

                            <div className="bg-green-50 p-3 rounded border border-green-100 mt-2">
                                <p className="text-green-700 text-xs uppercase font-bold mb-1"><FontAwesomeIcon icon={faMoneyBill}/> Lương cơ bản</p>
                                <p className="text-lg font-mono font-bold text-slate-800">{formatCurrency(viewData.basicsalary)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-bold text-purple-600 uppercase mb-2">Ghi chú & Học vấn</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded text-sm"><span className="font-semibold mr-2">Trình độ:</span> {getCertName(viewData.educationlevel)}</div>
                        <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 italic">"{viewData.note || 'Không có ghi chú'}"</div>
                    </div>
                </div>
            </>
          )}
          <div className="flex justify-end mt-6">
             <Button className="bg-slate-900 text-white" onClick={() => setShowViewModal(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- 3. MODAL HỆ THỐNG --- */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-sm text-center">
             <div className="text-yellow-500 text-5xl mb-3"><FontAwesomeIcon icon={faCircleExclamation} /></div>
             <DialogTitle>Xác nhận xóa?</DialogTitle>
             <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
                <Button className="bg-red-600 text-white" onClick={onConfirmDelete}>Xóa</Button>
             </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-sm text-center">
            <div className="text-green-500 text-5xl mb-3"><FontAwesomeIcon icon={faCircleCheck} /></div>
            <DialogTitle>Thành công!</DialogTitle>
            <Button className="mt-4 bg-black text-white hover:bg-gray-800" onClick={() => setShowSuccessModal(false)}>OK</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}