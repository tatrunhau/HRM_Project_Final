'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faUserXmark, faTriangleExclamation, faCircleInfo, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createResignation, updateResignation } from '@/services/admin/resignation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface Props {
  showModal: boolean; setShowModal: (v: boolean) => void;
  showDeleteModal: boolean; setShowDeleteModal: (v: boolean) => void;
  isEditing: boolean;
  formData: any; setFormData: (v: any) => void;
  employeeList: any[];
  refreshData: () => void;
  onConfirmDelete: () => void;
}

export default function ResignationModals({
  showModal, setShowModal,
  showDeleteModal, setShowDeleteModal,
  isEditing,
  formData, setFormData,
  employeeList,
  refreshData,
  onConfirmDelete
}: Props) {
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Validate cơ bản
    if (!formData.employeeid) {
        alert("Vui lòng chọn nhân viên!");
        return;
    }
    if (!formData.resignationdate) {
        alert("Vui lòng chọn ngày nghỉ việc!");
        return;
    }

    setLoading(true);
    try {
        if (isEditing) {
            // Khi sửa: Gửi cả Status để backend xử lý (Duyệt/Từ chối)
            await updateResignation(formData.resignationid, formData);
        } else {
            // Khi tạo mới: Luôn set Status = Pending (dù form có thể không hiện)
            await createResignation({ ...formData, status: 'Pending' });
        }
        await refreshData();
        setShowModal(false);
    } catch (error) {
        alert("Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại!");
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      {/* --- ADD / EDIT FORM MODAL --- */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="border-b pb-4 mb-2">
            <DialogTitle className="flex items-center gap-3 text-slate-800 text-xl">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isEditing ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    <FontAwesomeIcon icon={faUserXmark} />
                </div>
                {isEditing ? 'Cập Nhật / Duyệt Hồ Sơ' : 'Lập Đơn Xin Nghỉ Việc'}
            </DialogTitle>
            <DialogDescription>
                {isEditing 
                 ? "Xem xét lý do và cập nhật trạng thái duyệt đơn."
                 : "Tạo hồ sơ nghỉ việc mới cho nhân viên. Trạng thái mặc định là 'Chờ duyệt'."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-2">
            {/* 1. Chọn Nhân viên */}
            <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Nhân viên <span className="text-red-500">*</span></Label>
                <Select 
                    disabled={isEditing} // Không được đổi nhân viên khi đang sửa
                    value={formData.employeeid?.toString()} 
                    onValueChange={(val) => setFormData({...formData, employeeid: val})}
                >
                    <SelectTrigger className="bg-slate-50 h-10 border-slate-300 focus:ring-2 focus:ring-blue-200">
                        <SelectValue placeholder="-- Chọn nhân viên --" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px]">
                        {isEditing 
                          // Khi Sửa: Tìm tên nhân viên hiện tại để hiển thị (do danh sách employeeList có thể đã bị lọc)
                          ? <SelectItem value={formData.employeeid?.toString() || "0"}>
                              {/* Hiển thị tạm ID nếu không tìm thấy, hoặc Logic map tên ở đây */}
                                Mã NV: {formData.employee?.employeecode} - {formData.employee?.name}
                            </SelectItem>
                          // Khi Tạo: Hiển thị danh sách nhân viên active
                          : employeeList.map(emp => (
                            <SelectItem key={emp.employeeid} value={emp.employeeid.toString()}>
                                <span className="font-mono font-semibold text-slate-600 mr-2">{emp.employeecode}</span> 
                                {emp.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 2. Ngày & Lý do */}
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Ngày nghỉ việc dự kiến <span className="text-red-500">*</span></Label>
                    <Input 
                        type="date" 
                        className="h-10 border-slate-300"
                        value={formData.resignationdate} 
                        onChange={(e) => setFormData({...formData, resignationdate: e.target.value})} 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">Lý do nghỉ việc</Label>
                    <Textarea 
                        className="min-h-[80px] border-slate-300 resize-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Nhập lý do chi tiết..." 
                        value={formData.reason || ''} 
                        onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                    />
                </div>
            </div>

            {/* 3. Trạng thái (Chỉ hiện khi EDIT) */}
            {isEditing && (
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mt-2 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <FontAwesomeIcon icon={faCircleInfo} className="text-blue-500"/>
                        <Label className="font-bold text-slate-800">Phê duyệt đơn</Label>
                    </div>
                    
                    <Select 
                        value={formData.status} 
                        onValueChange={(val) => setFormData({...formData, status: val})}
                    >
                        <SelectTrigger className={`h-10 font-semibold border-slate-300 ${
                            formData.status === 'Approved' ? 'text-green-600 bg-green-50 border-green-200' :
                            formData.status === 'Rejected' ? 'text-red-600 bg-red-50 border-red-200' : 
                            'text-yellow-600 bg-yellow-50 border-yellow-200'
                        }`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Pending">⏳ Chờ duyệt</SelectItem>
                            <SelectItem value="Approved" className="text-green-600 font-bold focus:bg-green-50">✅ Duyệt (Đồng ý cho nghỉ)</SelectItem>
                            <SelectItem value="Rejected" className="text-red-600 font-bold focus:bg-red-50">❌ Từ chối</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Cảnh báo logic nghiệp vụ */}
                    {formData.status === 'Approved' && (
                        <div className="text-xs text-green-700 bg-green-100 p-2 rounded flex gap-2 items-start">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5"/>
                            <span>Hệ thống sẽ tự động cập nhật trạng thái nhân viên thành <b>"Đã nghỉ việc"</b> sau khi lưu.</span>
                        </div>
                    )}
                </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 mt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Hủy bỏ</Button>
            <Button onClick={handleSave} disabled={loading} className={`${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-slate-800'} text-white min-w-[120px]`}>
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2"/> 
                {loading ? 'Đang xử lý...' : (isEditing ? 'Cập Nhật' : 'Lưu Hồ Sơ')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRM MODAL --- */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-sm text-center p-6">
             <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-2xl mb-4">
                <FontAwesomeIcon icon={faTrash} />
             </div>
             <DialogTitle className="text-lg font-bold text-slate-900">Xác nhận xóa hồ sơ?</DialogTitle>
             <DialogDescription className="text-slate-500 mt-2">
                Hành động này không thể hoàn tác. Dữ liệu nghỉ việc sẽ bị xóa vĩnh viễn khỏi hệ thống.
             </DialogDescription>
             <div className="flex justify-center gap-3 mt-6">
                <Button variant="outline" className="w-full" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white w-full" onClick={onConfirmDelete}>Xóa ngay</Button>
             </div>
        </DialogContent>
      </Dialog>
    </>
  );
}