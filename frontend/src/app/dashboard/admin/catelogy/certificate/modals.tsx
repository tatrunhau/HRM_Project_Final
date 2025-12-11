'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation, faCircleCheck, faFloppyDisk, faGraduationCap
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

export default function CertificateModals({
  showModal, setShowModal,
  showDeleteModal, setShowDeleteModal,
  showSuccessModal, setShowSuccessModal,
  isEditing,
  formData, setFormData,
  onConfirmSave, onConfirmDelete
}: ModalProps) {

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      {/* --- 1. FORM MODAL --- */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
                <div className={`${isEditing ? 'bg-orange-500' : 'bg-slate-900'} text-white p-2 rounded-md`}>
                   <FontAwesomeIcon icon={faGraduationCap} className="h-5 w-5" />
                </div>
                <div>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {isEditing ? 'Cập Nhật Chứng Chỉ' : 'Thêm Mới Chứng Chỉ'}
                    </DialogTitle>
                    <DialogDescription>Quản lý các loại chứng chỉ chuyên môn.</DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Hàng 1: Mã & Tên */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tên Chứng chỉ <span className="text-red-500">*</span></label>
                <Input 
                    value={formData.name || ''} 
                    onChange={(e) => handleInputChange('name', e.target.value)} 
                    placeholder="VD: Chứng chỉ TOEIC, PMP, AWS" 
                />
            </div>
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Mã Chứng chỉ</label>
                <Input 
                    value={formData.certificatecode || ''} 
                    onChange={(e) => handleInputChange('certificatecode', e.target.value)} 
                    placeholder="Tự động sinh (CC-...)" 
                    disabled={true} 
                    className="bg-slate-100 text-slate-500" 
                />
            </div>

            {/* Hàng 2: Trạng thái */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
                <Select 
                    value={formData.status?.toString()} 
                    onValueChange={(val) => handleInputChange('status', val === 'true')}
                >
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">Đang áp dụng</SelectItem>
                        <SelectItem value="false">Ngưng áp dụng</SelectItem>
                    </SelectContent>
                </Select>
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

      {/* --- MODAL XÓA --- */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-sm text-center">
             <div className="text-yellow-500 text-5xl mb-3"><FontAwesomeIcon icon={faCircleExclamation} /></div>
             <DialogTitle>Xác nhận xóa?</DialogTitle>
             <DialogDescription>Hành động này không thể hoàn tác.</DialogDescription>
             <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
                <Button className="bg-red-600 text-white" onClick={onConfirmDelete}>Xóa</Button>
             </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL THÀNH CÔNG --- */}
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