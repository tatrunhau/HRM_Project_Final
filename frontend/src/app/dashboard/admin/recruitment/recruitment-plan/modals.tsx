'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleExclamation, faCircleCheck, faFloppyDisk, faXmark
} from '@fortawesome/free-solid-svg-icons';
import { useRef, useState } from 'react';

interface ModalProps {
  showFileModal: boolean;
  setShowFileModal: (v: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  showSaveModal: boolean;
  setShowSaveModal: (v: boolean) => void;
  showSuccessModal: boolean;
  setShowSuccessModal: (v: boolean) => void;
  showCancelModal: boolean;
  setShowCancelModal: (v: boolean) => void;
  
  // Callback functions
  onConfirmUpload?: (file: File) => void;
  onConfirmSave?: () => void;
  onConfirmDelete?: () => void;
}

export default function Modal({
  showFileModal, setShowFileModal,
  showDeleteModal, setShowDeleteModal,
  showSaveModal, setShowSaveModal,
  showSuccessModal, setShowSuccessModal,
  showCancelModal, setShowCancelModal,
  onConfirmUpload,
  onConfirmSave,
  onConfirmDelete,
}: ModalProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleViewFile = () => {
    if (selectedFile) {
      const fileUrl = URL.createObjectURL(selectedFile);
      window.open(fileUrl, '_blank');
    }
  };

  const shortenFileName = (name: string) => {
    if (!name) return '';
    return name.length > 30 ? `${name.slice(0, 15)}...${name.slice(-10)}` : name;
  };

  const handleConfirmUpload = () => {
    if (selectedFile && onConfirmUpload) {
      onConfirmUpload(selectedFile);
    }
    setShowFileModal(false);
  };

  return (
    <>
      {/* File Modal */}
      <Dialog open={showFileModal} onOpenChange={setShowFileModal}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-gray-500 to-gray-700 text-white px-3 py-2 -m-6 mb-4 rounded-t-lg">
              Văn bản kế hoạch
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm block mb-1 font-medium">File kế hoạch *</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf" />

              <div className="flex items-center border rounded p-2 bg-gray-50 w-full">
                <Button type="button" variant="outline" size="sm" className="mr-2 border-black text-black hover:bg-gray-200 shrink-0" onClick={handleButtonClick}>
                  Chọn file
                </Button>
                
                <div className="flex-1 min-w-0 mx-2 flex items-center">
                    {selectedFile ? (
                        <span className="text-sm break-all text-blue-600 font-medium cursor-pointer hover:underline" onClick={handleViewFile}>
                            {shortenFileName(selectedFile.name)}
                        </span>
                    ) : (
                        <span className="text-sm italic text-gray-400">Chưa có file nào được chọn</span>
                    )}
                </div>

                {selectedFile && (
                  <Button variant="ghost" size="sm" className="text-red-500 h-8 w-8 p-0 shrink-0" onClick={removeFile}>
                    <FontAwesomeIcon icon={faXmark} />
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Chỉ chấp nhận file PDF (Tối đa 5MB)</p>
            </div>
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
             <Button variant="ghost" className="mr-2" onClick={() => setShowFileModal(false)}>Đóng</Button>
             <Button className="bg-black hover:bg-gray-800" onClick={handleConfirmUpload}>Xác nhận</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="flex flex-col items-center justify-center">
             <div className="text-yellow-500 text-5xl mb-3"><FontAwesomeIcon icon={faCircleExclamation} /></div>
             <DialogTitle className="text-lg font-semibold text-center">Xác nhận xóa?</DialogTitle>
             <DialogDescription className="text-center text-gray-500">
               Hành động này không thể hoàn tác.
             </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={onConfirmDelete}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Save Modal */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="flex flex-col items-center justify-center">
            <div className="text-blue-600 text-5xl mb-3"><FontAwesomeIcon icon={faFloppyDisk} /></div>
            <DialogTitle className="text-lg font-semibold text-center">Xác nhận lưu?</DialogTitle>
            <DialogDescription className="text-center text-gray-500">
               Dữ liệu sẽ được cập nhật vào hệ thống.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowSaveModal(false)}>Hủy</Button>
            <Button className="bg-black text-white hover:bg-gray-800" onClick={onConfirmSave}>Đồng ý</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="flex flex-col items-center justify-center">
            <div className="text-green-500 text-5xl mb-3"><FontAwesomeIcon icon={faCircleCheck} /></div>
            <DialogTitle className="text-lg font-semibold text-center">Thành công!</DialogTitle>
            <DialogDescription className="text-center text-gray-500">
               Thao tác đã được thực hiện thành công.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button className="bg-black hover:bg-gray-800 w-24" onClick={() => setShowSuccessModal(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="flex flex-col items-center justify-center">
            <div className="text-red-500 text-5xl mb-3"><FontAwesomeIcon icon={faXmark} /></div>
            <DialogTitle className="text-lg font-semibold text-center">Đã hủy thao tác</DialogTitle>
            <DialogDescription className="text-center text-gray-500">
               Bạn đã hủy bỏ quá trình nhập liệu.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button className="bg-black hover:bg-gray-800 w-24" onClick={() => setShowCancelModal(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}