'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFloppyDisk, faPlaneDeparture, faClock,
    faPenToSquare, faQrcode, faListCheck
} from '@fortawesome/free-solid-svg-icons';

// Import API
import { getEmployeesList } from '@/services/admin/payroll';
import { createLeave, createOvertime, updateAttendanceLog, getShiftConfig, updateShiftConfig } from '@/services/admin/attendance';
import { getOtConfigs, updateOtConfig, OtConfig } from '@/services/admin/otConfig';

interface AttendanceModalsProps {
    showLeaveModal: boolean; setShowLeaveModal: (v: boolean) => void;
    showOvertimeModal: boolean; setShowOvertimeModal: (v: boolean) => void;
    showEditTimeModal: boolean; setShowEditTimeModal: (v: boolean) => void;
    showQrModal: boolean; setShowQrModal: (v: boolean) => void;
    showOtConfigModal: boolean; setShowOtConfigModal: (v: boolean) => void;
    showEditStatusModal: boolean; setShowEditStatusModal: (v: boolean) => void;
    selectedLog: any;
    onRefresh: () => void;
}

const LEAVE_TYPES = [
    { value: 'Nghỉ phép năm', label: 'Nghỉ phép năm' },
    { value: 'Nghỉ ốm', label: 'Nghỉ ốm' },
    { value: 'Nghỉ không lương', label: 'Nghỉ không lương' },
    { value: 'Nghỉ thai sản', label: 'Nghỉ thai sản' },
];

export default function AttendanceModals({
    showLeaveModal, setShowLeaveModal,
    showOvertimeModal, setShowOvertimeModal,
    showEditTimeModal, setShowEditTimeModal,
    showQrModal, setShowQrModal,
    showOtConfigModal, setShowOtConfigModal,
    showEditStatusModal, setShowEditStatusModal,
    selectedLog,
    onRefresh
}: AttendanceModalsProps) {

    const [employees, setEmployees] = useState<any[]>([]);

    // --- STATE CẤU HÌNH OT ---
    const [otConfigs, setOtConfigs] = useState<OtConfig[]>([]);
    const [showEditConfigSubModal, setShowEditConfigSubModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<OtConfig | null>(null);

    // [THÊM MỚI] State cho Modal Shift (Chỉnh sửa giờ)
    const [shiftForm, setShiftForm] = useState({ startTime: '', endTime: '' });

    // [THÊM MỚI] State cho Modal Status (Sửa trạng thái item)
    const [editCheckIn, setEditCheckIn] = useState('');
    const [editCheckOut, setEditCheckOut] = useState('');
    const [statusForm, setStatusForm] = useState('');

    // [SỬA] State dùng 'rate'
    const [editOtFormData, setEditOtFormData] = useState({ rate: 0, is_active: true });

    const [leaveForm, setLeaveForm] = useState({ employeeId: '', type: '', start: '', end: '', reason: '' });
    const [otForm, setOtForm] = useState({ employeeId: '', date: '', start: '', end: '', reason: '' });

    useEffect(() => {
        // Chỉ gọi API khi mở modal "Nghỉ phép" hoặc "Tăng ca" và danh sách đang trống
        if ((showLeaveModal || showOvertimeModal) && employees.length === 0) {
            const fetchEmployees = async () => {
                try {
                    // Gọi API (đã import ở trên)
                    const data = await getEmployeesList(); 
                    // Kiểm tra dữ liệu trả về có phải mảng không
                    if (Array.isArray(data)) {
                        setEmployees(data);
                    } else if (data && data.data && Array.isArray(data.data)) {
                         // Dự phòng trường hợp API trả về { data: [...] }
                        setEmployees(data.data);
                    }
                } catch (error) {
                    console.error("Lỗi tải danh sách nhân viên:", error);
                }
            };
            fetchEmployees();
        }
    }, [showLeaveModal, showOvertimeModal]);

    useEffect(() => {
        if (showEditStatusModal && selectedLog) {
            // 1. Load Status
            const currentStatus = selectedLog.status ? selectedLog.status.toUpperCase() : 'ABSENT';
            setStatusForm(currentStatus);

            // 2. Load Giờ (Parse từ ISO String "2025-12-08T08:30:00Z" -> "08:30")
            // Dùng getUTCHours vì DB đang lưu giờ VN dưới dạng UTC
            const getTimeFromDate = (dateVal: any) => {
                if (!dateVal) return '';
                const d = new Date(dateVal);
                const hh = d.getHours().toString().padStart(2, '0');
                const mm = d.getMinutes().toString().padStart(2, '0');
                return `${hh}:${mm}`;
            };

            setEditCheckIn(getTimeFromDate(selectedLog.checkintime));
            setEditCheckOut(getTimeFromDate(selectedLog.checkouttime));
        }
    }, [showEditStatusModal, selectedLog]);

    useEffect(() => {
        if (showOtConfigModal) {
            fetchOtConfigs();
        }
    }, [showOtConfigModal]);

    // Load dữ liệu Shift khi mở Modal Chỉnh Sửa Giờ
    useEffect(() => {
        if (showEditTimeModal) {
            getShiftConfig().then(data => {
                if (data) {
                    // Cắt giây nếu cần thiết (HH:mm:ss -> HH:mm) cho input type="time"
                    const start = data.startTime?.length > 5 ? data.startTime.substring(0, 5) : data.startTime;
                    const end = data.endTime?.length > 5 ? data.endTime.substring(0, 5) : data.endTime;
                    setShiftForm({ startTime: start, endTime: end });
                }
            });
        }
    }, [showEditTimeModal]);

    // Load dữ liệu Status khi mở Modal Sửa Item
    useEffect(() => {
        if (showEditStatusModal && selectedLog) {
            // Lấy status từ log, chuyển thành chữ hoa để khớp với SelectItem value
            // Nếu status rỗng/null thì mặc định là ABSENT
            const currentStatus = selectedLog.status ? selectedLog.status.toUpperCase() : 'ABSENT';
            setStatusForm(currentStatus);
        }
    }, [showEditStatusModal, selectedLog]);

    // [HANDLER] Lưu cấu hình Shift
    const handleSaveShift = async () => {
        try {
            await updateShiftConfig(shiftForm.startTime, shiftForm.endTime);
            alert("Cập nhật giờ làm việc thành công!");
            setShowEditTimeModal(false);
        } catch (e: any) {
            alert("Lỗi: " + e.message);
        }
    };

    // [HANDLER] Lưu trạng thái Item
    const handleSaveStatus = async () => {
        if (!selectedLog) return;
        try {
            await updateAttendanceLog(selectedLog.timekeepingid, {
                status: statusForm,
                checkInTime: editCheckIn,
                checkOutTime: editCheckOut
            });
            alert("Cập nhật thành công!");
            setShowEditStatusModal(false);
            onRefresh();
        } catch (e: any) {
            alert("Lỗi: " + e.message);
        }
    };

    const fetchOtConfigs = async () => {
        const data = await getOtConfigs();
        setOtConfigs(data || []);
    };

    // --- HANDLERS CẤU HÌNH OT ---
    const handleOpenEditConfig = (config: OtConfig) => {
        setEditingConfig(config);
        setEditOtFormData({
            rate: Number(config.rate), // [SỬA] Map dữ liệu từ rate
            is_active: config.is_active
        });
        setShowEditConfigSubModal(true);
    };

    const handleSaveConfig = async () => {
        if (!editingConfig) return;
        try {
            // [SỬA] Gọi API với payload 'rate'
            await updateOtConfig(editingConfig.ot_config_id, {
                rate: editOtFormData.rate,
                is_active: editOtFormData.is_active
            });
            alert("Cập nhật thành công!");
            setShowEditConfigSubModal(false);
            fetchOtConfigs();
        } catch (e: any) {
            alert("Lỗi cập nhật: " + e.message);
        }
    };

    // --- HANDLERS TẠO ĐƠN (GIỮ NGUYÊN) ---
    const handleSaveLeave = async () => {
        try {
            if (!leaveForm.employeeId || !leaveForm.start || !leaveForm.end) return alert("Vui lòng điền đủ thông tin");
            await createLeave({
                employeeId: leaveForm.employeeId, type: leaveForm.type, fromDate: leaveForm.start, toDate: leaveForm.end, reason: leaveForm.reason
            });
            alert("Tạo đơn nghỉ thành công!"); setShowLeaveModal(false); setLeaveForm({ employeeId: '', type: '', start: '', end: '', reason: '' }); onRefresh();
        } catch (e: any) { alert("Lỗi: " + e.message); }
    };

    const handleSaveOT = async () => {
        try {
            if (!otForm.employeeId || !otForm.date || !otForm.start) return alert("Vui lòng điền đủ thông tin");

            await createOvertime({
                employeeId: otForm.employeeId,
                date: otForm.date,
                startTime: otForm.start,
                endTime: otForm.end,
                reason: otForm.reason
            });

            alert("Tạo đơn tăng ca thành công!");
            setShowOvertimeModal(false);
            setOtForm({ employeeId: '', date: '', start: '', end: '', reason: '' });
            onRefresh();

        } catch (e: any) {
            // [SỬA ĐOẠN NÀY] Để lấy thông báo lỗi chi tiết từ Backend trả về
            // e.response.data.message là nơi chứa câu: "Không thể tạo đơn: Thời gian tăng ca trùng..."
            const errorMessage = e.response?.data?.message || e.message || "Có lỗi xảy ra";
            alert("Lỗi: " + errorMessage);
        }
    };

    return (
        <>
            {/* 1. MODAL NGHỈ PHÉP */}
            <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
                <DialogContent className="sm:max-w-lg overflow-hidden">
                    <DialogHeader><DialogTitle className="text-lg font-semibold bg-blue-600 text-white px-3 py-2 -m-6 mb-4 rounded-t-lg"><FontAwesomeIcon icon={faPlaneDeparture} className="mr-2" /> Lập Đơn Nghỉ Phép</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nhân viên *</label>
                                <Select value={leaveForm.employeeId} onValueChange={(v) => setLeaveForm({ ...leaveForm, employeeId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
                                    <SelectContent>{employees.map(emp => (<SelectItem key={emp.employeeid} value={emp.employeeid.toString()}>{emp.employeecode} - {emp.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Loại nghỉ *</label>
                                <Select value={leaveForm.type} onValueChange={(v) => setLeaveForm({ ...leaveForm, type: v })}>
                                    <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                                    <SelectContent>{LEAVE_TYPES.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-sm font-medium">Từ ngày *</label><Input type="date" value={leaveForm.start} onChange={(e) => setLeaveForm({ ...leaveForm, start: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Đến ngày *</label><Input type="date" value={leaveForm.end} onChange={(e) => setLeaveForm({ ...leaveForm, end: e.target.value })} /></div>
                        </div>
                        <div className="space-y-1"><label className="text-sm font-medium">Lý do *</label><Textarea placeholder="Nhập lý do..." value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} /></div>
                    </div>
                    <DialogFooter className="mt-4 pt-4 border-t"><Button variant="outline" onClick={() => setShowLeaveModal(false)}>Hủy</Button><Button className="bg-blue-600" onClick={handleSaveLeave}>Gửi Đơn</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. MODAL TĂNG CA */}
            <Dialog open={showOvertimeModal} onOpenChange={setShowOvertimeModal}>
                <DialogContent className="sm:max-w-lg overflow-hidden">
                    <DialogHeader><DialogTitle className="text-lg font-semibold bg-green-600 text-white px-3 py-2 -m-6 mb-4 rounded-t-lg"><FontAwesomeIcon icon={faClock} className="mr-2" /> Lập Đơn Tăng Ca</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Nhân viên *</label>
                                <Select value={otForm.employeeId} onValueChange={(v) => setOtForm({ ...otForm, employeeId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
                                    <SelectContent>{employees.map(emp => (<SelectItem key={emp.employeeid} value={emp.employeeid.toString()}>{emp.employeecode} - {emp.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1"><label className="text-sm font-medium">Ngày *</label><Input type="date" value={otForm.date} onChange={(e) => setOtForm({ ...otForm, date: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-sm font-medium">Giờ vào *</label><Input type="time" value={otForm.start} onChange={(e) => setOtForm({ ...otForm, start: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-sm font-medium">Giờ ra *</label><Input type="time" value={otForm.end} onChange={(e) => setOtForm({ ...otForm, end: e.target.value })} /></div>
                        </div>
                        <div className="space-y-1"><label className="text-sm font-medium">Nội dung *</label><Textarea placeholder="Mô tả công việc..." value={otForm.reason} onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })} /></div>
                    </div>
                    <DialogFooter className="mt-4 pt-4 border-t"><Button variant="outline" onClick={() => setShowOvertimeModal(false)}>Hủy</Button><Button className="bg-green-600" onClick={handleSaveOT}>Gửi Đơn</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. MODAL EDIT TIME & QR */}
            <Dialog open={showEditTimeModal} onOpenChange={setShowEditTimeModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold bg-slate-800 text-white px-3 py-2 -m-6 mb-4 rounded-t-lg">
                            <FontAwesomeIcon icon={faClock} className="mr-2" /> Cấu Hình Giờ Làm Việc
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Giờ Vào (Start)</Label>
                                <Input
                                    type="time"
                                    value={shiftForm.startTime}
                                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Giờ Ra (End)</Label>
                                <Input
                                    type="time"
                                    value={shiftForm.endTime}
                                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                            * Lưu ý: Giờ này sẽ được dùng làm chuẩn để tính trễ/sớm cho toàn bộ hệ thống.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditTimeModal(false)}>Hủy</Button>
                        <Button onClick={handleSaveShift}>Lưu Cấu Hình</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
                <DialogContent className="sm:max-w-sm text-center"><DialogHeader><DialogTitle>QR Chấm Công</DialogTitle></DialogHeader><div className="py-6 flex justify-center"><div className="w-48 h-48 bg-slate-100 flex items-center justify-center"><FontAwesomeIcon icon={faQrcode} className="text-6xl" /></div></div><DialogFooter><Button onClick={() => setShowQrModal(false)}>Đóng</Button></DialogFooter></DialogContent>
            </Dialog>

            {/* 4. MODAL DANH SÁCH CẤU HÌNH OT */}
            <Dialog open={showOtConfigModal} onOpenChange={setShowOtConfigModal}>
                <DialogContent className="sm:max-w-3xl overflow-hidden z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold bg-orange-600 text-white px-3 py-2 -m-6 mb-4 rounded-t-lg">
                            <FontAwesomeIcon icon={faListCheck} className="mr-2" /> Cấu Hình Loại Tăng Ca
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Loại OT</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead className="text-center">Hệ số (Rate)</TableHead>
                                    <TableHead className="text-center">Trạng thái</TableHead>
                                    <TableHead className="text-center">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {otConfigs.map((cfg) => (
                                    <TableRow key={cfg.ot_config_id}>
                                        {/* [SỬA] Hiển thị ot_type */}
                                        <TableCell className="font-semibold">{cfg.ot_type}</TableCell>
                                        <TableCell>{cfg.description}</TableCell>
                                        {/* [SỬA] Hiển thị rate */}
                                        <TableCell className="text-center font-mono text-blue-600 font-bold">x {cfg.rate}</TableCell>
                                        <TableCell className="text-center">
                                            {cfg.is_active ?
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Đang dùng</Badge> :
                                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Đã khóa</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenEditConfig(cfg)}>
                                                <FontAwesomeIcon icon={faPenToSquare} /> Sửa
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter className="mt-4 pt-4 border-t"><Button variant="outline" onClick={() => setShowOtConfigModal(false)}>Đóng</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 5. MODAL CON: SỬA CẤU HÌNH */}
            <Dialog open={showEditConfigSubModal} onOpenChange={setShowEditConfigSubModal}>
                <DialogContent className="sm:max-w-sm z-[110]">
                    <DialogHeader><DialogTitle>Cập nhật: {editingConfig?.ot_type}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Hệ số</Label>
                            {/* [SỬA] Bind vào editOtFormData.rate */}
                            <Input
                                type="number" step="0.1"
                                value={editOtFormData.rate}
                                onChange={(e) => setEditOtFormData({ ...editOtFormData, rate: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Trạng thái</Label>
                            <div className="col-span-3">
                                <Select
                                    value={editOtFormData.is_active ? "true" : "false"}
                                    onValueChange={(val) => setEditOtFormData({ ...editOtFormData, is_active: val === "true" })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>

                                    {/* --- SỬA Ở ĐÂY: Thêm className="z-[200]" --- */}
                                    <SelectContent className="z-[200]">
                                        <SelectItem value="true">Đang hoạt động</SelectItem>
                                        <SelectItem value="false">Ngưng hoạt động</SelectItem>
                                    </SelectContent>

                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setShowEditConfigSubModal(false)}>Hủy</Button>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={handleSaveConfig}>
                            <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" /> Lưu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 6. MODAL SỬA TRẠNG THÁI (ITEM) */}
            <Dialog open={showEditStatusModal} onOpenChange={setShowEditStatusModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa chấm công</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Thông tin nhân viên */}
                        <div className="space-y-1 bg-slate-50 p-3 rounded-md border border-slate-100">
                            <div className="text-xs text-slate-500 uppercase font-semibold">Nhân viên</div>
                            <div className="font-bold text-slate-800 text-lg">
                                {selectedLog?.employee?.name || "Không xác định"}
                            </div>
                            <div className="text-sm text-slate-600">
                                Mã NV: {selectedLog?.employee?.employeecode}
                            </div>
                            <div className="text-sm text-slate-600">
                                Ngày: {selectedLog?.workdate ? new Date(selectedLog.workdate).toLocaleDateString('vi-VN') : ''}
                            </div>
                        </div>

                        {/* Ô chọn Trạng thái */}
                        <div className="space-y-1">
                            <Label>Trạng thái</Label>
                            <Select value={statusForm} onValueChange={setStatusForm}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ON_TIME">Đúng giờ (On Time)</SelectItem>
                                    <SelectItem value="LATE">Đi muộn (Late)</SelectItem>
                                    <SelectItem value="EARLY_LEAVE">Về sớm (Early Leave)</SelectItem>
                                    <SelectItem value="LATE & EARLY_LEAVE">Muộn & Sớm</SelectItem>
                                    <SelectItem value="FULL">Đủ công (Full)</SelectItem>
                                    <SelectItem value="ABSENT">Vắng (Absent)</SelectItem>
                                    <SelectItem value="ABSENT_PERMISSION">Vắng có phép</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Ô nhập Giờ vào / Giờ ra */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>Giờ Vào</Label>
                                <Input
                                    type="time"
                                    value={editCheckIn}
                                    onChange={(e) => setEditCheckIn(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Giờ Ra</Label>
                                <Input
                                    type="time"
                                    value={editCheckOut}
                                    onChange={(e) => setEditCheckOut(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditStatusModal(false)}>Đóng</Button>
                        <Button className="bg-blue-600" onClick={handleSaveStatus}>Lưu thay đổi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}