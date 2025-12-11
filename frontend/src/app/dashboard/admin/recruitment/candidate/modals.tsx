'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation, faCircleCheck, faFloppyDisk, faXmark, faPaperclip, faUserTie,
  faCalendarDays, faBuilding, faBriefcase, faIdCard, faFilePdf, faEye
} from '@fortawesome/free-solid-svg-icons';
import { useRef, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS = [
  { value: 1, label: 'Đã gửi CV', color: 'bg-blue-100 text-blue-700' },
  { value: 2, label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700' },
  { value: 3, label: 'Được tuyển', color: 'bg-green-100 text-green-700' },
  { value: 4, label: 'Rớt tuyển', color: 'bg-red-100 text-red-700' },
];

interface ModalProps {
  showModal: boolean; setShowModal: (v: boolean) => void;
  showDeleteModal: boolean; setShowDeleteModal: (v: boolean) => void;
  showSuccessModal: boolean; setShowSuccessModal: (v: boolean) => void;
  showViewModal: boolean; setShowViewModal: (v: boolean) => void;

  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  viewData: any;
  
  jobTitles: any[];
  departments: any[];

  attachedFile: File | null;
  setAttachedFile: (file: File | null) => void;
  existingFileUrl: string;

  onConfirmSave: () => void;
  onConfirmDelete: () => void;
}

export default function CandidateModals({
  showModal, setShowModal,
  showDeleteModal, setShowDeleteModal,
  showSuccessModal, setShowSuccessModal,
  showViewModal, setShowViewModal,
  isEditing,
  formData, setFormData, viewData,
  jobTitles, departments,
  attachedFile, setAttachedFile, existingFileUrl,
  onConfirmSave, onConfirmDelete
}: ModalProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- 1. STATE LƯU LỖI ---
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (showModal) setErrors({});
  }, [showModal]);

  // --- 2. HÀM VALIDATE (KIỂM TRA TẤT CẢ NGOẠI TRỪ FILE) ---
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    // 1. Kiểm tra Họ tên
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Vui lòng nhập họ tên ứng viên.';
      isValid = false;
    }

    // 2. Kiểm tra Vị trí
    if (!formData.jobtitleid) {
      newErrors.jobtitleid = 'Vui lòng chọn vị trí.';
      isValid = false;
    }

    // 3. Kiểm tra Phòng ban
    if (!formData.departmentid) {
      newErrors.departmentid = 'Vui lòng chọn phòng ban.';
      isValid = false;
    }

    // 4. Kiểm tra Ngày nộp
    if (!formData.submissiondate) {
      newErrors.submissiondate = 'Vui lòng chọn ngày nộp hồ sơ.';
      isValid = false;
    }

    // 5. Kiểm tra Kỹ năng (Skill)
    if (!formData.skill || formData.skill.trim() === '') {
      newErrors.skill = 'Vui lòng nhập mô tả kỹ năng/kinh nghiệm.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSaveClick = () => {
    if (validateForm()) {
      onConfirmSave();
    }
  };

  // --- XỬ LÝ FILE ---
  const handleButtonClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files?.[0]) setAttachedFile(e.target.files[0]); 
  };
  
  const removeFile = () => { 
    setAttachedFile(null); 
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };
  
  const handleViewAttachedFile = (e: any) => {
    e.stopPropagation();
    if (attachedFile) {
      const url = URL.createObjectURL(attachedFile);
      window.open(url, '_blank');
    }
  };

  const shortenFileName = (name: string) => name.length > 20 ? `${name.slice(0, 10)}...${name.slice(-7)}` : name;

  // --- XỬ LÝ FORM & XÓA LỖI KHI NHẬP ---
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getJobName = (id: any) => jobTitles.find(j => j.jobtitleid == id)?.name || '---';
  const getDeptName = (id: any) => departments.find(d => d.departmentid == id)?.name || '---';
  
  const getStatusBadge = (statusId: any) => {
    const status = STATUS_OPTIONS.find(s => s.value == statusId);
    return status ? <Badge className={`${status.color} border-0`}>{status.label}</Badge> : <Badge variant="outline">---</Badge>;
  };

  return (
    <>
      {/* ======================= */}
      {/* 1. MODAL FORM (THÊM / SỬA) */}
      {/* ======================= */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
                <div className={`${isEditing ? 'bg-orange-500' : 'bg-slate-900'} text-white p-2 rounded-md`}>
                   <FontAwesomeIcon icon={faUserTie} className="h-5 w-5" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold text-slate-800">{isEditing ? 'Cập Nhật Hồ Sơ' : 'Thêm Mới Ứng Viên'}</DialogTitle>
                    <DialogDescription>Nhập thông tin chi tiết ứng viên.</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Cột Trái: Thông tin cơ bản */}
            <div className="md:col-span-8 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Mã UV</label>
                        <Input value={formData.candidatecode} disabled className="bg-slate-100" placeholder="Tự động..." />
                    </div>
                    
                    {/* HỌ TÊN */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Họ tên <span className="text-red-500">*</span></label>
                        <Input 
                            value={formData.name} 
                            onChange={(e) => handleInputChange('name', e.target.value)} 
                            placeholder="Nhập họ tên..." 
                            className={errors.name ? 'border-red-500 focus-visible:ring-red-200' : ''}
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                </div>
                
                {/* KỸ NĂNG / KINH NGHIỆM */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kỹ năng / Kinh nghiệm <span className="text-red-500">*</span></label>
                    <textarea 
                        className={`flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 ${errors.skill ? 'border-red-500 ring-red-200' : 'border-slate-200'}`}
                        value={formData.skill} 
                        onChange={(e) => handleInputChange('skill', e.target.value)} 
                        placeholder="Mô tả kỹ năng..." 
                    />
                    {errors.skill && <p className="text-xs text-red-500 mt-1">{errors.skill}</p>}
                </div>
            </div>

            {/* Cột Phải: Thông tin ứng tuyển */}
            <div className="md:col-span-4 space-y-5">
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 space-y-4">
                    <div className="text-sm font-bold text-slate-800 border-b pb-2 uppercase">Thông tin ứng tuyển</div>
                    
                    {/* VỊ TRÍ (JOB TITLE) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Vị trí <span className="text-red-500">*</span></label>
                        <Select value={formData.jobtitleid} onValueChange={(val) => handleInputChange('jobtitleid', val)}>
                            <SelectTrigger className={`bg-white ${errors.jobtitleid ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Chọn vị trí" />
                            </SelectTrigger>
                            <SelectContent>
                                {jobTitles.map((j: any) => (
                                    <SelectItem key={j.jobtitleid} value={j.jobtitleid.toString()}>
                                        {j.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.jobtitleid && <p className="text-xs text-red-500 mt-1">{errors.jobtitleid}</p>}
                    </div>

                    {/* PHÒNG BAN (DEPARTMENT) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Phòng ban <span className="text-red-500">*</span></label>
                        <Select value={formData.departmentid} onValueChange={(val) => handleInputChange('departmentid', val)}>
                            <SelectTrigger className={`bg-white ${errors.departmentid ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Chọn phòng" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((d: any) => (
                                    <SelectItem key={d.departmentid} value={d.departmentid.toString()}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         {errors.departmentid && <p className="text-xs text-red-500 mt-1">{errors.departmentid}</p>}
                    </div>

                    {/* NGÀY NỘP */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500">Ngày nộp <span className="text-red-500">*</span></label>
                        <Input 
                            type="date" 
                            className={`bg-white ${errors.submissiondate ? 'border-red-500' : ''}`}
                            value={formData.submissiondate} 
                            onChange={(e) => handleInputChange('submissiondate', e.target.value)} 
                        />
                         {errors.submissiondate && <p className="text-xs text-red-500 mt-1">{errors.submissiondate}</p>}
                    </div>
                    
                    {isEditing && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500">Trạng thái</label>
                            <Select value={formData.status} onValueChange={(val) => handleInputChange('status', val)}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.filter(opt => opt.value !== 1).map(opt => (
                                        <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* UPLOAD FILE */}
                <div>
                    <label className="text-xs font-semibold text-slate-600 mb-2 block">File CV (PDF)</label>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx" />
                    
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleButtonClick} 
                        className={`w-full border-dashed border-2 h-12 transition-all duration-200 ${(attachedFile || existingFileUrl) ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-600'}`}
                    >
                      {(attachedFile || existingFileUrl) ? (
                        <div className="flex items-center w-full justify-between">
                            <div 
                                className="flex items-center truncate cursor-pointer hover:underline" 
                                onClick={attachedFile ? handleViewAttachedFile : (e) => { e.stopPropagation(); window.open(existingFileUrl, '_blank'); }}
                                title="Nhấn để xem file"
                            >
                                <FontAwesomeIcon icon={faCircleCheck} className="mr-2"/>
                                <span className="truncate max-w-[180px]">
                                    {attachedFile ? shortenFileName(attachedFile.name) : 'Đã có CV'}
                                </span>
                                {attachedFile && <span className="ml-1 text-[10px] text-green-600">(Mới)</span>}
                            </div>
                            <div 
                                className="p-1.5 hover:bg-red-200 rounded-full text-red-500 transition-colors" 
                                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            >
                                <FontAwesomeIcon icon={faXmark} />
                            </div>
                        </div> 
                      ) : (
                        <><FontAwesomeIcon icon={faPaperclip} className="mr-2" /><span>Chọn file CV</span></>
                      )}
                    </Button>
                </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleSaveClick}>
                {isEditing ? 'Cập Nhật' : 'Lưu Hồ Sơ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. MODAL XEM CHI TIẾT */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="border-b pb-4 mb-4">
             <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xl font-bold">
                    {viewData?.name?.charAt(0) || 'U'}
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold text-slate-800">{viewData?.name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-slate-500 font-normal">{viewData?.candidatecode}</Badge>
                        {getStatusBadge(viewData?.status)}
                    </div>
                </div>
             </div>
          </DialogHeader>

          {viewData && (
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-2 gap-y-4">
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><FontAwesomeIcon icon={faBriefcase}/> Vị trí ứng tuyển</p>
                        <p className="text-sm font-medium text-slate-900">{getJobName(viewData.jobtitleid)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><FontAwesomeIcon icon={faBuilding}/> Phòng ban</p>
                        <p className="text-sm font-medium text-slate-900">{getDeptName(viewData.departmentid)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><FontAwesomeIcon icon={faCalendarDays}/> Ngày nộp hồ sơ</p>
                        <p className="text-sm font-medium text-slate-900">{viewData.submissiondate}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><FontAwesomeIcon icon={faIdCard}/> CV Đính kèm</p>
                        {viewData.cv_file ? (
                            <a href={viewData.cv_file} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                <FontAwesomeIcon icon={faFilePdf} /> Xem tài liệu
                            </a>
                        ) : <span className="text-sm text-gray-400 italic">Không có file</span>}
                    </div>
                </div>

                <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Kỹ năng / Ghi chú</p>
                    <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 min-h-[60px]">
                        {viewData.skill || 'Không có mô tả thêm.'}
                    </div>
                </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t mt-2">
             <Button className="bg-slate-900 text-white" onClick={() => setShowViewModal(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. MODAL HỆ THỐNG */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-sm text-center">
             <div className="text-yellow-500 text-5xl mb-3"><FontAwesomeIcon icon={faCircleExclamation} /></div>
             <DialogTitle>Xác nhận xóa?</DialogTitle>
             <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
             <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
                <Button className="bg-red-600 text-white hover:bg-red-700" onClick={onConfirmDelete}>Xóa</Button>
             </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-sm text-center">
            <div className="text-green-500 text-5xl mb-3"><FontAwesomeIcon icon={faCircleCheck} /></div>
            <DialogTitle>Thành công!</DialogTitle>
            <DialogDescription className="text-gray-500">Dữ liệu đã được cập nhật.</DialogDescription>
            <Button className="mt-4 bg-black text-white hover:bg-gray-800" onClick={() => setShowSuccessModal(false)}>OK</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}