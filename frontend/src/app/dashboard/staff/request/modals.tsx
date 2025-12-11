'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlane, faClock, faMoneyBillWave, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

// Định nghĩa Props nhận từ cha (Page)
interface RequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'leave' | 'overtime' | 'advance';
    initialData?: any; // Dữ liệu khi bấm sửa
    onSave: (data: any) => Promise<void>; // Hàm lưu từ cha truyền vào
}

export default function CreateRequestModal({ isOpen, onClose, type, initialData, onSave }: RequestModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State form chung cho cả 3 loại
    const [formData, setFormData] = useState({
        // Leave
        leavetype: '', fromDate: '', toDate: '',
        // Overtime
        date: '', startTime: '', endTime: '',
        // Advance
        amount: '',
        // Common
        reason: ''
    });

    // 1. Tự động điền dữ liệu khi mở modal (Chế độ Sửa) hoặc Reset (Chế độ Thêm)
    useEffect(() => {
        if (isOpen && initialData) {
            // Mapping dữ liệu từ API vào Form
            setFormData({
                leavetype: initialData.leavetype || '',
                fromDate: initialData.startdate ? initialData.startdate.split('T')[0] : '',
                toDate: initialData.enddate ? initialData.enddate.split('T')[0] : '',
                
                date: initialData.overtimedate || initialData.createddate ? (initialData.overtimedate || initialData.createddate).split('T')[0] : '',
                
                // Cắt chuỗi ISO để lấy giờ phút (HH:mm)
                startTime: initialData.starttime ? new Date(initialData.starttime).toISOString().substring(11, 16) : '', 
                endTime: initialData.endtime ? new Date(initialData.endtime).toISOString().substring(11, 16) : '',
                
                amount: initialData.advanceamount || '',
                reason: initialData.reason || initialData.workcontent || ''
            });
        } else if (isOpen && !initialData) {
            // Reset form khi tạo mới
            setFormData({
                leavetype: '', fromDate: '', toDate: '',
                date: new Date().toISOString().split('T')[0], startTime: '', endTime: '',
                amount: '', reason: ''
            });
        }
    }, [isOpen, initialData]);

    // 2. Xử lý khi bấm Lưu/Gửi
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Chuẩn bị payload tùy theo loại
            let payload: any = {};
            
            if (type === 'leave') {
                payload = { 
                    type: formData.leavetype, 
                    fromDate: formData.fromDate, 
                    toDate: formData.toDate, 
                    reason: formData.reason 
                };
            } else if (type === 'overtime') {
                payload = { 
                    date: formData.date, 
                    startTime: formData.startTime, 
                    endTime: formData.endTime, 
                    reason: formData.reason 
                };
            } else {
                payload = { 
                    date: formData.date, 
                    amount: Number(formData.amount), // Ép kiểu số
                    reason: formData.reason 
                };
            }
            
            // Gọi hàm onSave được truyền từ Page
            await onSave(payload);
            onClose(); // Đóng modal nếu thành công
        } catch (error) {
            console.error(error);
            // alert("Có lỗi xảy ra, vui lòng kiểm tra lại thông tin!"); // Page đã alert rồi
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cấu hình giao diện (Màu sắc & Icon)
    const config = {
        leave: {
            title: 'Lập Đơn Nghỉ Phép',
            color: 'bg-blue-600',
            icon: faPlane,
            btnColor: 'bg-blue-600 hover:bg-blue-700'
        },
        overtime: {
            title: 'Lập Đơn Tăng Ca',
            color: 'bg-green-600',
            icon: faClock,
            btnColor: 'bg-green-600 hover:bg-green-700'
        },
        advance: {
            title: 'Tạo Đơn Ứng Lương',
            color: 'bg-orange-600',
            icon: faMoneyBillWave,
            btnColor: 'bg-orange-600 hover:bg-orange-700'
        }
    }[type];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
                {/* Header */}
                <DialogHeader className={`${config.color} p-4 text-white flex flex-row items-center gap-3 space-y-0`}>
                    <FontAwesomeIcon icon={config.icon} className="h-5 w-5" />
                    <DialogTitle className="text-lg font-bold">
                        {initialData ? `Cập Nhật ${config.title}` : config.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    
                    {/* --- FORM NGHỈ PHÉP --- */}
                    {type === 'leave' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Loại nghỉ *</label>
                                <Select value={formData.leavetype} onValueChange={(v) => setFormData({...formData, leavetype: v})}>
                                    <SelectTrigger><SelectValue placeholder="Chọn loại nghỉ" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="annual">Nghỉ phép năm</SelectItem>
                                        <SelectItem value="sick">Nghỉ ốm</SelectItem>
                                        <SelectItem value="personal">Việc riêng</SelectItem>
                                        <SelectItem value="unpaid">Nghỉ không lương</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Từ ngày *</label>
                                    <Input type="date" value={formData.fromDate} onChange={e => setFormData({...formData, fromDate: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Đến ngày *</label>
                                    <Input type="date" value={formData.toDate} onChange={e => setFormData({...formData, toDate: e.target.value})} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- FORM TĂNG CA --- */}
                    {type === 'overtime' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Ngày tăng ca *</label>
                                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Giờ vào *</label>
                                    <Input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Giờ ra *</label>
                                    <Input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- FORM ỨNG LƯƠNG --- */}
                    {type === 'advance' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Ngày ứng *</label>
                                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Số tiền (VNĐ) *</label>
                                    <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Nhập số tiền..." />
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- PHẦN CHUNG: LÝ DO --- */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Lý do / Nội dung *</label>
                        <Textarea 
                            value={formData.reason} 
                            onChange={e => setFormData({...formData, reason: e.target.value})}
                            placeholder={type === 'overtime' ? "Mô tả công việc..." : "Nhập lý do..."} 
                            className="resize-none h-24" 
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
                        <Button className={`${config.btnColor} text-white`} onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> : <FontAwesomeIcon icon={faPaperPlane} className="mr-2"/>}
                            {initialData ? 'Cập Nhật' : 'Gửi Đơn'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}