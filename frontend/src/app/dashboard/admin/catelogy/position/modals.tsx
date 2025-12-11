'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation, faCircleCheck, faFloppyDisk, faBriefcase
} from '@fortawesome/free-solid-svg-icons';

interface ModalProps {
  showModal: boolean; setShowModal: (v: boolean) => void;
  showDeleteModal: boolean; setShowDeleteModal: (v: boolean) => void;
  showSuccessModal: boolean; setShowSuccessModal: (v: boolean) => void;
  
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;

  onConfirmSave: () => void;
  onConfirmDelete: () => void;
}

export default function PositionModals({
  showModal, setShowModal,
  showDeleteModal, setShowDeleteModal,
  showSuccessModal, setShowSuccessModal,
  isEditing,
  formData, setFormData,
  onConfirmSave, onConfirmDelete
}: ModalProps) {

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ 
        ...prev, 
        // Xử lý bonus: Nếu là chuỗi rỗng thì là null, nếu không thì parse float.
        [field]: field === 'bonus' ? (value === '' ? null : parseFloat(value)) : value 
    }));
  };

  return (
    <>
      {/* --- FORM MODAL --- */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
                <div className={`${isEditing ? 'bg-orange-500' : 'bg-slate-900'} text-white p-2 rounded-md`}>
                   <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {isEditing ? 'Cập Nhật Chức Vụ' : 'Thêm Mới Chức Vụ'}
                    </DialogTitle>
                    <DialogDescription>Quản lý các chức vụ (Vị trí).</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            
            {/* Hàng 1: Mã chức vụ (Chỉ hiển thị khi Chỉnh sửa) */}
            {isEditing && (
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Mã chức vụ <span className="text-red-500">*</span></label>
                    <Input 
                        value={formData.positioncode || ''} 
                        onChange={(e) => handleInputChange('positioncode', e.target.value)} 
                        placeholder="VD: NV, TP..." 
                        disabled={true} 
                        className="bg-slate-100"
                    />
                </div>
            )}

            {/* Hàng 2 (Mới): Tên Chức vụ */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tên chức vụ <span className="text-red-500">*</span></label>
                <Input 
                    value={formData.name || ''} 
                    onChange={(e) => handleInputChange('name', e.target.value)} 
                    placeholder="VD: Nhân viên chính thức" 
                />
            </div>
            
            {/* Hàng 3 (Mới): Trạng thái & Phần trăm thưởng */}
            <div className="grid grid-cols-2 gap-4">
                {/* 1. Trạng thái */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
                    <Select 
                        value={formData.status?.toString()} 
                        onValueChange={(val) => handleInputChange('status', val === 'true')}
                    >
                        <SelectTrigger className="bg-white"><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Hoạt động</SelectItem>
                            <SelectItem value="false">Ngừng hoạt động</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 2. Phần trăm thưởng */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phần trăm thưởng (0.1 = 10%)</label>
                    <Input 
                        type="number" 
                        step="0.01"  
                        value={formData.bonus !== null && formData.bonus !== undefined ? formData.bonus : ''} 
                        onChange={(e) => handleInputChange('bonus', e.target.value)} 
                        placeholder="VD: 0.1, 0.05, 1.0..." 
                    />
                </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={onConfirmSave}>
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2"/>
                {isEditing ? 'Lưu Thay Đổi' : 'Thêm Mới'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL HỆ THỐNG (Xóa & Success) --- */}
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
            <Button className="mt-4 bg-black text-white" onClick={() => setShowSuccessModal(false)}>OK</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}