'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faFloppyDisk, faMagnifyingGlass, faBan } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

// Import API services
import { getPositions, Position } from '@/services/admin/position';
import { updateConcurrentPositions } from '@/services/admin/concurrently';

// --- HÀM HELPER: Xử lý tìm kiếm tiếng Việt không dấu ---
const removeAccents = (str: string) => {
  if (!str) return "";
  return str
    .normalize("NFD") // Tách dấu ra khỏi ký tự gốc
    .replace(/[\u0300-\u036f]/g, "") // Xóa các dấu
    .replace(/đ/g, "d").replace(/Đ/g, "D") // Xử lý chữ đ/Đ
    .toLowerCase() // Chuyển về chữ thường
    .trim(); // Xóa khoảng trắng thừa
};

interface UIModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
  mainJobId: number | null; 
  mainJobTitle: string;
  currentSubJobIds: number[];
  onSuccess?: () => void;
}

export default function ConcurrentModal({ 
  isOpen, 
  onClose, 
  employeeId, 
  employeeName, 
  mainJobId, 
  mainJobTitle, 
  currentSubJobIds, 
  onSuccess 
}: UIModalProps) {
  
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentSubJobIds || []);
      setSearchTerm('');

      const fetchPositions = async () => {
        try {
          const data = await getPositions();
          setAllPositions(data);
        } catch (error) {
          console.error("Lỗi lấy danh sách chức vụ:", error);
        }
      };
      fetchPositions();
    }
  }, [isOpen, currentSubJobIds]);

  const handleToggle = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!employeeId) return;
    try {
      setIsSaving(true);
      await updateConcurrentPositions({
        employeeId: employeeId,
        positionIds: selectedIds
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Đã có lỗi xảy ra khi cập nhật.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- LOGIC LỌC ĐÃ CẬP NHẬT ---
  const filteredJobs = allPositions.filter(pos => {
    // 1. Tìm kiếm tiếng Việt thông minh (Không dấu)
    // Ví dụ: Nhập "truong" sẽ tìm thấy "Trưởng phòng"
    const normalizedName = removeAccents(pos.name);
    const normalizedSearch = removeAccents(searchTerm);
    const matchName = normalizedName.includes(normalizedSearch);
    
    // 2. Logic hiển thị (Ẩn/Hiện dựa trên Status):
    const shouldShow = pos.status === true || selectedIds.includes(pos.positionid);

    return matchName && shouldShow;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden gap-0">
        
        {/* HEADER */}
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <div className="h-8 w-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faBriefcase} className="text-sm"/>
              </div>
              Phân Chức Vụ Kiêm Nhiệm
            </DialogTitle>
            <DialogDescription>
              Cấu hình các vị trí công tác bổ sung cho nhân viên.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 bg-slate-50 p-3 rounded border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Nhân viên được chọn</p>
              <p className="text-base font-bold text-slate-800">{employeeName || '---'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-semibold">Chức danh</p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                {mainJobTitle || '---'}
              </Badge>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 py-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <Input 
                    placeholder="Tìm kiếm chức vụ..." 
                    className="pl-9 bg-white" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List Items */}
            <div className="border rounded-md h-[280px] overflow-y-auto p-2 bg-slate-50/50 space-y-1 custom-scrollbar">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((pos) => {
                        const isSelected = selectedIds.includes(pos.positionid);
                        const isInactive = pos.status === false;

                        return (
                            <div 
                                key={pos.positionid}
                                onClick={() => handleToggle(pos.positionid)}
                                className={`
                                    flex items-center justify-between p-3 rounded-md border cursor-pointer transition-all
                                    ${isSelected 
                                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                        : 'bg-white border-transparent hover:bg-white hover:shadow-sm'}
                                    ${isInactive ? 'opacity-70 bg-gray-50' : ''} 
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => handleToggle(pos.positionid)}
                                    />
                                    <div className="flex flex-col">
                                        <span className={`
                                            text-sm font-medium 
                                            ${isSelected ? 'text-slate-900' : 'text-slate-600'}
                                            ${isInactive ? 'text-slate-400 line-through decoration-slate-400' : ''}
                                        `}>
                                            {pos.name}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {isInactive && (
                                        <Badge variant="secondary" className="bg-gray-200 text-gray-500 text-[10px] h-5 px-1.5 flex gap-1 items-center">
                                            <FontAwesomeIcon icon={faBan} className="text-[8px]" /> Ngừng
                                        </Badge>
                                    )}
                                    
                                    {isSelected && !isInactive && (
                                        <Badge className="bg-blue-600 hover:bg-blue-700 h-5 text-[10px]">Đang chọn</Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center text-sm text-slate-400 py-8">
                        {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Không có chức vụ khả dụng'}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500 px-1">
                <span>Đã chọn thêm: <b className="text-blue-600">{selectedIds.length}</b> vị trí</span>
                <span className="text-xs italic text-slate-400">* Nhấn vào dòng để chọn/bỏ chọn</span>
            </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 pt-0 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSaving} className="text-slate-500 hover:text-slate-900">
            Hủy bỏ
          </Button>
          <Button 
            className="bg-slate-900 text-white hover:bg-slate-800 min-w-[120px]"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
                <>Đang lưu...</>
            ) : (
                <><FontAwesomeIcon icon={faFloppyDisk} className="mr-2"/> Lưu thay đổi</>
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}