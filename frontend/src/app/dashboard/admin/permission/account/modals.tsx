'use client';

import { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation, faCircleCheck, faFloppyDisk, faUserPlus, faKey, faUserPen, faRotateRight
} from '@fortawesome/free-solid-svg-icons';

import { AccountPayload, Employee, Jobtitle, Role } from '@/services/admin/auth';

interface ModalProps {
  showModal: boolean; setShowModal: (v: boolean) => void;
  showDeleteModal: boolean; setShowDeleteModal: (v: boolean) => void;
  showSuccessModal: boolean; setShowSuccessModal: (v: boolean) => void;
  
  isEditing: boolean;
  formData: Partial<AccountPayload> & { 
    status?: boolean; 
    userid?: number; 
    employeename?: string; 
    employeecode?: string; 
  };
  setFormData: Dispatch<SetStateAction<any>>;

  onConfirmSave: () => void;
  onConfirmDelete: () => void;
  onResetPassword: () => void;
  
  employees: Employee[];
  jobtitles: Jobtitle[];
  roles: Role[];
  createdPassword?: string | null;
}

export default function AccountModals({
  showModal, setShowModal,
  showDeleteModal, setShowDeleteModal,
  showSuccessModal, setShowSuccessModal,
  isEditing,
  formData, setFormData,
  onConfirmSave, onConfirmDelete, onResetPassword,
  employees, jobtitles, roles, createdPassword
}: ModalProps) {

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };
  
  const isFormValid = isEditing ? true : (formData.employeeid && formData.jobtitleid && formData.role);

  return (
    <>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
                <div className={`${isEditing ? 'bg-blue-600' : 'bg-green-600'} text-white p-2 rounded-md`}>
                   <FontAwesomeIcon icon={isEditing ? faUserPen : faUserPlus} className="h-5 w-5" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {isEditing ? 'Cập Nhật Tài Khoản' : 'Tạo Tài Khoản Mới'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Chỉnh sửa trạng thái hoặc đặt lại mật khẩu.' : 'Nhập thông tin để khởi tạo tài khoản hệ thống.'}
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* --- 1. NHÂN VIÊN (Luôn hiện hàng đầu tiên) --- */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nhân Viên {isEditing ? '' : <span className="text-red-500">*</span>}</label>
                
                {isEditing ? (
                    <Input 
                        disabled 
                        className="bg-slate-100 text-slate-700 font-medium border-slate-300"
                        value={formData.employeename ? `${formData.employeename} (${formData.employeecode})` : 'Đang tải...'}
                    />
                ) : (
                    <Select 
                        value={formData.employeeid?.toString()} 
                        onValueChange={(val) => handleInputChange('employeeid', Number(val))}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="-- Chọn nhân viên --" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {employees.map(emp => (
                                <SelectItem key={emp.employeeid} value={emp.employeeid.toString()}>
                                    {`[${emp.employeecode}] ${emp.name}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* --- 2. GRID LAYOUT: CHỨC DANH & VAI TRÒ --- */}
            {/* Nếu tạo mới: Hiện 2 cột. Nếu sửa: Hiện 1 cột (chỉ còn Vai trò) */}
            <div className={!isEditing ? "grid grid-cols-2 gap-4" : "space-y-4"}>
                
                {/* Cột Trái: Chức Danh (Chỉ hiện khi Tạo Mới) */}
                {!isEditing && (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Chức Danh <span className="text-red-500">*</span></label>
                        <Select 
                            value={formData.jobtitleid?.toString()} 
                            onValueChange={(val) => handleInputChange('jobtitleid', Number(val))}
                        >
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Chọn chức danh" />
                            </SelectTrigger>
                            <SelectContent>
                                {jobtitles.map(jt => (
                                    <SelectItem key={jt.jobtitleid} value={jt.jobtitleid.toString()}>
                                        {jt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Cột Phải (hoặc Full): Vai Trò */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Vai Trò <span className="text-red-500">*</span></label>
                    <Select 
                        value={formData.role?.toString()} 
                        onValueChange={(val) => handleInputChange('role', Number(val))}
                    >
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
                        <SelectContent>
                                {roles.map(r => (
                                <SelectItem key={r.roleid} value={r.roleid.toString()}>
                                    {r.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {/* --- 3. GHI CHÚ CÔNG THỨC (Chỉ hiện khi Tạo Mới) --- */}
            {!isEditing && (
                <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded border border-yellow-200 mt-2 flex items-start gap-2">
                    <FontAwesomeIcon icon={faCircleExclamation} className="mt-1 flex-shrink-0"/>
                    <span>
                        Thông tin đăng nhập sẽ được gửi tự động qua email. 
                        <br/>
                        <strong>UserCode = [STT] + [Mã NV] + [Mã Chức Danh]</strong>
                    </span>
                </div>
            )}

            {/* --- 4. CÁC PHẦN CỦA CHỨC NĂNG SỬA --- */}
            {isEditing && (
                 <>
                     <div className="space-y-2 pt-2 border-t mt-2">
                        <label className="text-sm font-semibold text-slate-700">Trạng Thái Hoạt Động</label>
                        <Select 
                            value={formData.status ? 'true' : 'false'} 
                            onValueChange={(val) => handleInputChange('status', val === 'true')}
                        >
                            <SelectTrigger className={`font-medium ${formData.status ? 'text-green-600' : 'text-red-600'}`}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true" className="text-green-600 font-medium">Đang hoạt động (Cho phép đăng nhập)</SelectItem>
                                <SelectItem value="false" className="text-red-600 font-medium">Vô hiệu hóa (Chặn đăng nhập)</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>

                    <div className="bg-slate-50 p-3 rounded border flex justify-between items-center mt-4">
                        <div className="text-sm text-slate-600">
                            <FontAwesomeIcon icon={faKey} className="mr-2"/> 
                            Quên hoặc cần cấp lại mật khẩu?
                        </div>
                        <Button variant="outline" size="sm" onClick={onResetPassword} className="border-orange-300 text-orange-700 hover:bg-orange-50">
                            <FontAwesomeIcon icon={faRotateRight} className="mr-2"/> Reset Password
                        </Button>
                    </div>
                 </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
            <Button 
                className={`${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                onClick={onConfirmSave}
                disabled={!isFormValid}
            >
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2"/>
                {isEditing ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal Xóa */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-sm text-center">
             <div className="text-red-500 text-5xl mb-3"><FontAwesomeIcon icon={faCircleExclamation} /></div>
             <DialogTitle>Xóa tài khoản này?</DialogTitle>
             <DialogDescription>Hành động này sẽ xóa vĩnh viễn tài khoản và session đăng nhập.</DialogDescription>
             <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
                <Button className="bg-red-600 text-white hover:bg-red-700" onClick={onConfirmDelete}>Xác nhận Xóa</Button>
             </div>
        </DialogContent>
      </Dialog>

      {/* Modal Thành Công */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
            <div className="text-green-500 text-5xl mb-3 flex justify-center"><FontAwesomeIcon icon={faCircleCheck} /></div>
            <DialogTitle className="text-xl font-bold text-slate-800">Thành công!</DialogTitle>
            
            {createdPassword ? (
                <div className="mt-4 bg-orange-50 border border-orange-200 p-4 rounded-lg text-left">
                    <div className="flex items-start gap-2 mb-2">
                        <FontAwesomeIcon icon={faKey} className="text-orange-500 mt-1"/>
                        <p className="text-sm text-orange-900 font-semibold">Mật khẩu mới (Do không gửi được email):</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-orange-300 p-3 rounded shadow-inner">
                        <code className="text-xl font-mono font-bold text-slate-800 flex-1 text-center select-all tracking-wider">{createdPassword}</code>
                    </div>
                </div>
            ) : (
                <DialogDescription className="mt-2 text-slate-600">Thao tác đã hoàn tất. Email thông báo đã được gửi.</DialogDescription>
            )}

            <div className="flex justify-center mt-6">
                <Button className="bg-slate-900 text-white px-6" onClick={() => setShowSuccessModal(false)}>Đóng</Button>
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}