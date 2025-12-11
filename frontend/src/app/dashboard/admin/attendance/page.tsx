'use client';

import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faFileExport, faClock, faPlaneDeparture, faPencil,
    faQrcode, faUserClock, faPenToSquare, faTrash, faCheck, faXmark,
    faGear, faSearch, faChevronLeft, faChevronRight,
    faSort, faSortUp, faSortDown,
    faRotateRight, faCalendarDays
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo } from 'react';
import AttendanceModals from './modals';

import {
    getLeaves, updateLeaveStatus, deleteLeave,
    getOvertimes, updateOvertimeStatus, deleteOvertime, exportOvertimeToExcel,
    getDailyAttendance, initDailyAttendance, exportDailyAttendanceToExcel
} from '@/services/admin/attendance';

// --- TYPES & HELPERS ---
type SortDirection = 'asc' | 'desc';
interface SortConfig { key: string; direction: SortDirection; }

const removeVietnameseTones = (str: string) => {
    if (!str) return '';
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return str;
}

export default function AttendancePage() {
    const [activeTab, setActiveTab] = useState<'attendance' | 'leave' | 'overtime'>('attendance');

    // ================== STATE: DATA GỐC ==================
    const [allLeaves, setAllLeaves] = useState<any[]>([]);
    const [allOvertimes, setAllOvertimes] = useState<any[]>([]);

    // ================== STATE: CHẤM CÔNG (ATTENDANCE) ==================
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);

    // ================== STATE: NGHỈ PHÉP (LEAVE) ==================
    const [leaveSearch, setLeaveSearch] = useState('');
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');
    const [leaveSort, setLeaveSort] = useState<SortConfig | null>(null);
    const [leavePage, setLeavePage] = useState(1);
    const [leaveItemsPerPage, setLeaveItemsPerPage] = useState(10);

    // ================== STATE: TĂNG CA (OVERTIME) ==================
    const [otSearch, setOtSearch] = useState('');
    const [otStatusFilter, setOtStatusFilter] = useState('all');
    const [otSort, setOtSort] = useState<SortConfig | null>(null);
    const [otPage, setOtPage] = useState(1);
    const [otItemsPerPage, setOtItemsPerPage] = useState(10);

    // [THÊM MỚI] State cho modal sửa trạng thái item
    const [showEditStatusModal, setShowEditStatusModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const [attendanceSearch, setAttendanceSearch] = useState('');

    const [attendancePage, setAttendancePage] = useState(1);
    const [attendanceItemsPerPage, setAttendanceItemsPerPage] = useState(10);

    // --- MODAL STATES ---
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showOvertimeModal, setShowOvertimeModal] = useState(false);
    const [showEditTimeModal, setShowEditTimeModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showOtConfigModal, setShowOtConfigModal] = useState(false);

    // ================== FETCH DATA ==================
    const fetchAttendance = async () => {
        try {
            const data = await getDailyAttendance(selectedDate);
            setAttendanceData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Lỗi tải chấm công:", error);
            setAttendanceData([]);
        }
    };

    const fetchData = async () => {
        try {
            if (activeTab === 'leave') {
                const data = await getLeaves();
                setAllLeaves(Array.isArray(data) ? data : []);
            }
            if (activeTab === 'overtime') {
                const res = await getOvertimes({ page: 1, limit: 1000, search: '', status: 'all' });
                setAllOvertimes(res && res.data ? res.data : []);
            }
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            setAllLeaves([]); setAllOvertimes([]);
        }
    };

    useEffect(() => {
        if (activeTab === 'attendance') fetchAttendance();
        else fetchData();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'attendance') fetchAttendance();
    }, [selectedDate]);


    // ================== LOGIC XỬ LÝ (MEMO) - NGHỈ PHÉP ==================
    const processedLeaves = useMemo(() => {
        let result = allLeaves;
        if (leaveStatusFilter !== 'all') {
            result = result.filter(item => item.status === leaveStatusFilter);
        }
        if (leaveSearch.trim() !== '') {
            const normalizedSearch = removeVietnameseTones(leaveSearch.trim());
            result = result.filter(item => {
                const name = removeVietnameseTones(item.employee?.name || '');
                const code = removeVietnameseTones(item.employee?.employeecode || '');
                const d = new Date(item.startdate);
                const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                return name.includes(normalizedSearch) || code.includes(normalizedSearch) || dateStr.includes(leaveSearch.trim());
            });
        }
        if (leaveSort) {
            result = [...result].sort((a, b) => {
                let valA: any = '', valB: any = '';
                switch (leaveSort.key) {
                    case 'name': valA = a.employee?.name; valB = b.employee?.name; break;
                    case 'type': valA = mapLeaveType(a.leavetype); valB = mapLeaveType(b.leavetype); break;
                    case 'startdate': valA = new Date(a.startdate).getTime(); valB = new Date(b.startdate).getTime(); break;
                    case 'status': valA = a.status; valB = b.status; break;
                    default: return 0;
                }
                if (valA < valB) return leaveSort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return leaveSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [allLeaves, leaveStatusFilter, leaveSearch, leaveSort]);

    const filteredAttendanceData = useMemo(() => {
        let data = attendanceData;
        if (attendanceSearch.trim() !== '') {
            const normalizedSearch = removeVietnameseTones(attendanceSearch.trim());
            data = data.filter(item => {
                // Lấy thông tin
                const name = removeVietnameseTones(item.employee?.name || '');
                const code = removeVietnameseTones(item.employee?.employeecode || '');
                // Format ngày hiển thị để tìm kiếm (VD: 07/12/2025)
                const dateStr = new Date(item.workdate).toLocaleDateString('vi-VN');

                // Kiểm tra trùng khớp
                return name.includes(normalizedSearch) || code.includes(normalizedSearch) || dateStr.includes(attendanceSearch.trim());
            });
        }
        return data;
    }, [attendanceData, attendanceSearch]);

    const paginatedAttendanceData = useMemo(() => {
        const start = (attendancePage - 1) * attendanceItemsPerPage;
        return filteredAttendanceData.slice(start, start + attendanceItemsPerPage);
    }, [filteredAttendanceData, attendancePage, attendanceItemsPerPage]);

    const totalAttendancePages = Math.ceil(filteredAttendanceData.length / attendanceItemsPerPage) || 1;

    const paginatedLeaves = useMemo(() => {
        const start = (leavePage - 1) * leaveItemsPerPage;
        return processedLeaves.slice(start, start + leaveItemsPerPage);
    }, [processedLeaves, leavePage, leaveItemsPerPage]);
    const totalLeavePages = Math.ceil(processedLeaves.length / leaveItemsPerPage) || 1;


    // ================== LOGIC XỬ LÝ (MEMO) - TĂNG CA ==================
    const processedOvertimes = useMemo(() => {
        let result = allOvertimes;
        if (otStatusFilter !== 'all') result = result.filter(item => item.status === otStatusFilter);
        if (otSearch.trim() !== '') {
            const normalizedSearch = removeVietnameseTones(otSearch.trim());
            result = result.filter(item => {
                const name = removeVietnameseTones(item.employee?.name || '');
                const code = removeVietnameseTones(item.employee?.employeecode || '');
                const d = new Date(item.overtimedate);
                const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                return name.includes(normalizedSearch) || code.includes(normalizedSearch) || dateStr.includes(otSearch.trim());
            });
        }
        if (otSort) {
            result = [...result].sort((a, b) => {
                let valA: any = '', valB: any = '';
                switch (otSort.key) {
                    case 'name': valA = a.employee?.name; valB = b.employee?.name; break;
                    case 'date': valA = new Date(a.overtimedate).getTime(); valB = new Date(b.overtimedate).getTime(); break;
                    case 'hours': valA = parseFloat(a.overtimehours); valB = parseFloat(b.overtimehours); break;
                    case 'status': valA = a.status; valB = b.status; break;
                    default: return 0;
                }
                if (valA < valB) return otSort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return otSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [allOvertimes, otStatusFilter, otSearch, otSort]);

    const paginatedOvertimes = useMemo(() => {
        const start = (otPage - 1) * otItemsPerPage;
        return processedOvertimes.slice(start, start + otItemsPerPage);
    }, [processedOvertimes, otPage, otItemsPerPage]);
    const totalOtPages = Math.ceil(processedOvertimes.length / otItemsPerPage) || 1;


    // ================== HELPERS & ACTIONS ==================
    const handleSortLeave = (key: string) => { setLeaveSort({ key, direction: leaveSort?.key === key && leaveSort.direction === 'asc' ? 'desc' : 'asc' }); };
    const handleSortOt = (key: string) => { setOtSort({ key, direction: otSort?.key === key && otSort.direction === 'asc' ? 'desc' : 'asc' }); };

    // [THÊM MỚI] Hàm xử lý khi bấm nút sửa (cây bút)
    const handleEditLogClick = (log: any) => {
        setSelectedLog(log);
        setShowEditStatusModal(true);
    };

    const handleExportAttendance = async () => {
        if (!selectedDate) return alert("Vui lòng chọn ngày!");
        await exportDailyAttendanceToExcel(selectedDate);
    };

    const renderSortIcon = (currentSort: SortConfig | null, key: string) => {
        if (currentSort?.key !== key) return <FontAwesomeIcon icon={faSort} className="text-slate-300 ml-1 h-3 w-3" />;
        return currentSort.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="text-blue-600 ml-1 h-3 w-3" /> : <FontAwesomeIcon icon={faSortDown} className="text-blue-600 ml-1 h-3 w-3" />;
    };

    const mapLeaveType = (type: string) => {
        if (!type) return '';
        const map: any = { 'annual': 'Nghỉ phép năm', 'sick': 'Nghỉ ốm', 'unpaid': 'Nghỉ không lương', 'maternity': 'Nghỉ thai sản' };
        return map[type.toLowerCase()] || type;
    };

    const handleUpdateDaily = async () => {
        try {
            // 1. Gọi API khởi tạo dữ liệu (Tạo Vắng cho người chưa có)
            await initDailyAttendance(selectedDate);

            // 2. Sau đó tải lại danh sách để hiển thị
            await fetchAttendance();

            // (Tùy chọn) Có thể hiển thị thông báo nhỏ
            // alert("Đã cập nhật danh sách chấm công!"); 
        } catch (error: any) {
            console.error("Lỗi cập nhật:", error);
            alert("Lỗi cập nhật: " + (error.response?.data?.message || error.message));
        }
    };

    // ✅ GIỮ NGUYÊN HÀM CŨ: Dùng cho Tab Nghỉ phép & Tăng ca
    const mapStatus = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline" className="text-yellow-600 border-yellow-200">Chờ duyệt</Badge>;
            case 'approved': return <Badge variant="outline" className="text-green-600 border-green-200">Đã duyệt</Badge>;
            case 'rejected': return <Badge variant="outline" className="text-red-600 border-red-200">Từ chối</Badge>;
            default: return <Badge variant="outline">--</Badge>;
        }
    };

    // ✅ HÀM MỚI: Dùng riêng cho Tab Chấm công (Xử lý cả status cũ và mới)
    const renderAttendanceStatus = (log: any) => {
        // Chuẩn hóa status về chữ hoa
        const status = log.status ? log.status.toUpperCase() : '';

        // 1. Map trực tiếp từ status DB
        if (status === 'ON TIME' || status === 'ON_TIME') return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Đúng giờ</Badge>;
        if (status === 'LATE') return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200">Đi muộn</Badge>;
        if (status === 'EARLY LEAVE' || status === 'EARLY_LEAVE') return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Về sớm</Badge>;

        // [THÊM] Hiển thị Badge cho Vắng có phép
        if (status === 'ABSENT_PERMISSION') {
            return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">Vắng có phép</Badge>;
        }

        if (status.includes('LATE') && (status.includes('&') || status.includes('AND'))) {
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Muộn & Sớm</Badge>;
        }

        // Các trường hợp Vắng thường
        if (status === 'ABSENT') return <Badge variant="destructive">Vắng</Badge>;
        if (status === 'NOT_FULL') return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">Đang làm việc</Badge>;

        // Fallback
        if (!log.checkintime) return <Badge variant="destructive">Vắng</Badge>;
        if (log.checkintime && !log.checkouttime) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Đang làm việc</Badge>;

        if (log.late_minutes > 0 && log.early_leave_minutes > 0) return <Badge className="bg-red-100 text-red-800 border-red-200">Muộn & Sớm</Badge>;
        if (log.late_minutes > 0) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Đi muộn</Badge>;
        if (log.early_leave_minutes > 0) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Về sớm</Badge>;

        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Đúng giờ</Badge>;
    };

    const handleLeaveAction = async (id: number, type: 'approve' | 'reject' | 'delete') => {
        if (!confirm("Bạn có chắc chắn muốn thực hiện thao tác này?")) return;
        try {
            if (type === 'delete') await deleteLeave(id);
            else await updateLeaveStatus(id, type === 'approve' ? 'approved' : 'rejected');
            fetchData();
        } catch (error) { alert("Có lỗi xảy ra!"); }
    };

    const handleOTAction = async (id: number, type: 'approve' | 'reject' | 'delete') => {
        if (!confirm("Bạn có chắc chắn muốn thực hiện thao tác này?")) return;
        try {
            if (type === 'delete') await deleteOvertime(id);
            else await updateOvertimeStatus(id, type === 'approve' ? 'approved' : 'rejected');
            fetchData();
        } catch (error) { alert("Có lỗi xảy ra!"); }
    };

    const handleExportExcel = async () => {
        if (activeTab === 'overtime') await exportOvertimeToExcel({ search: otSearch, status: otStatusFilter });
        else alert("Chức năng xuất Excel cho Nghỉ phép đang cập nhật");
    };

    const handleOpenScanner = () => window.open('/dashboard/admin/attendance/scanner', '_blank');

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 w-full ml-64 p-8 transition-all duration-300 ease-in-out">
                <h1 className="text-3xl font-bold text-slate-800 mb-6">Quản Lý Công & Nghỉ</h1>

                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-white border border-slate-200 shadow-sm">
                        <TabsTrigger value="attendance" className="flex gap-2 items-center"><FontAwesomeIcon icon={faUserClock} /> Chấm công</TabsTrigger>
                        <TabsTrigger value="leave" className="flex gap-2 items-center"><FontAwesomeIcon icon={faPlaneDeparture} /> Đơn Nghỉ Phép</TabsTrigger>
                        <TabsTrigger value="overtime" className="flex gap-2 items-center"><FontAwesomeIcon icon={faClock} /> Đơn Tăng Ca</TabsTrigger>
                    </TabsList>

                    {/* TAB ATTENDANCE (DÙNG renderAttendanceStatus) */}
                    <TabsContent value="attendance" className="mt-4">
                        <Card className="shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-2 mb-6">
                                    <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                                        <Button onClick={handleOpenScanner} className="bg-slate-800 hover:bg-slate-900 text-white shadow-sm">
                                            <FontAwesomeIcon icon={faQrcode} className="mr-2" /> Mở Quét QR
                                        </Button>
                                        <Button onClick={() => setShowEditTimeModal(true)} variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm">
                                            <FontAwesomeIcon icon={faPenToSquare} className="mr-2" /> Chỉnh sửa giờ
                                        </Button>
                                        <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm" onClick={handleUpdateDaily}>
                                            <FontAwesomeIcon icon={faRotateRight} className="mr-2" /> Cập nhật
                                        </Button>
                                    </div>
                                    <div className="relative ml-2">
                                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                        <Input
                                            placeholder="Tìm mã, tên, ngày..."
                                            className="pl-9 w-[220px] bg-white border-slate-300 shadow-sm"
                                            value={attendanceSearch}
                                            onChange={(e) => {
                                                setAttendanceSearch(e.target.value);
                                                setAttendancePage(1); // [THÊM] Reset về trang 1 khi tìm kiếm
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FontAwesomeIcon icon={faCalendarDays} className="text-slate-400" />
                                            </div>
                                            <Input type="date" className="pl-10 w-[160px] bg-slate-50 border-slate-300"
                                                value={selectedDate}
                                                onChange={(e) => {
                                                    setSelectedDate(e.target.value);
                                                    setAttendancePage(1); // [THÊM] Reset về trang 1 khi đổi ngày
                                                }} />
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="gap-2 text-slate-600 border-slate-300 hover:bg-slate-50 shadow-sm"
                                            onClick={handleExportAttendance}
                                        >
                                            <FontAwesomeIcon icon={faFileExport} /> Xuất Báo Cáo
                                        </Button>
                                    </div>
                                </div>

                                <div className="border rounded-lg w-full bg-white shadow-sm overflow-hidden flex flex-col">
                                    <div className="overflow-y-scroll max-h-[600px]">
                                        <Table className="w-full table-fixed">
                                            <TableHeader className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                                                <TableRow>
                                                    <TableHead className="w-[5%] font-bold text-slate-700">#</TableHead>
                                                    <TableHead className="w-[10%] font-bold text-slate-700">Mã NV</TableHead>
                                                    <TableHead className="w-[20%] font-bold text-slate-700">Tên Nhân viên</TableHead>
                                                    <TableHead className="w-[10%] font-bold text-slate-700">Ngày</TableHead>
                                                    <TableHead className="w-[10%] font-bold text-slate-700">Giờ Vào</TableHead>
                                                    <TableHead className="w-[10%] font-bold text-slate-700">Giờ Ra</TableHead>
                                                    <TableHead className="w-[15%] font-bold text-slate-700">Về Sớm/Trễ</TableHead>
                                                    <TableHead className="w-[12%] font-bold text-slate-700">Trạng thái</TableHead>
                                                    <TableHead className="w-[8%] text-right font-bold text-slate-700">Thao tác</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {/* [SỬA] Dùng paginatedAttendanceData thay vì filteredAttendanceData */}
                                                {paginatedAttendanceData && paginatedAttendanceData.length > 0 ? paginatedAttendanceData.map((log, index) => {


                                                    // [SỬA] Tính số thứ tự (STT) dựa trên trang hiện tại
                                                    const realIndex = (attendancePage - 1) * attendanceItemsPerPage + index + 1;

                                                    return (
                                                        <TableRow key={log.timekeepingid} className="hover:bg-slate-50">
                                                            <TableCell className="truncate">{realIndex}</TableCell>
                                                            <TableCell className="font-mono text-slate-500 truncate" title={log.employee?.employeecode}>{log.employee?.employeecode}</TableCell>
                                                            <TableCell className="font-medium text-slate-700 truncate" title={log.employee?.name}>{log.employee?.name}</TableCell>
                                                            <TableCell className="truncate">{new Date(log.workdate).toLocaleDateString('vi-VN')}</TableCell>
                                                            <TableCell className="font-mono text-blue-600 font-medium truncate">
                                                                {log.checkintime ? new Date(log.checkintime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-orange-600 font-medium truncate">
                                                                {log.checkouttime ? new Date(log.checkouttime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-slate-500 truncate">
                                                                {log.late_minutes > 0 && <div className="text-red-500">Trễ: {log.late_minutes}p</div>}
                                                                {log.early_leave_minutes > 0 && <div className="text-orange-500">Sớm: {log.early_leave_minutes}p</div>}
                                                            </TableCell>

                                                            <TableCell>{renderAttendanceStatus(log)}</TableCell>

                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="hover:bg-slate-200"
                                                                    onClick={() => handleEditLogClick(log)}
                                                                >
                                                                    <FontAwesomeIcon icon={faPencil} className="h-4 w-4 text-slate-500" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                }) : (
                                                    <TableRow>
                                                        <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                                                            {attendanceSearch ? "Không tìm thấy kết quả phù hợp." : "Chưa có dữ liệu chấm công."}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* [THÊM MỚI] Footer Phân trang */}
                                    <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <span>Hiển thị</span>
                                            <Select
                                                value={attendanceItemsPerPage.toString()}
                                                onValueChange={(val) => { setAttendanceItemsPerPage(Number(val)); setAttendancePage(1); }}
                                            >
                                                <SelectTrigger className="w-[70px] h-8 text-sm bg-white">
                                                    <SelectValue placeholder="10" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="5">5</SelectItem>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="20">20</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <span>dòng / trang. Tổng số: {filteredAttendanceData.length} bản ghi.</span>
                                        </div>

                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                disabled={attendancePage <= 1}
                                                onClick={() => setAttendancePage(prev => prev - 1)}
                                            >
                                                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                                            </Button>
                                            <Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white">
                                                {attendancePage}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                disabled={attendancePage >= totalAttendancePages}
                                                onClick={() => setAttendancePage(prev => prev + 1)}
                                            >
                                                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB LEAVE (Dùng mapStatus CŨ) */}
                    <TabsContent value="leave" className="mt-4">
                        <Card className="shadow-sm border-slate-200">
                            <div className="p-4 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white rounded-t-lg border-b border-slate-100">
                                <div className="flex gap-2 w-full lg:w-auto">
                                    <Button onClick={() => setShowLeaveModal(true)} className="bg-blue-600 hover:bg-blue-700">
                                        <FontAwesomeIcon icon={faPlus} className="mr-2" /> Lập Đơn Nghỉ Phép
                                    </Button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
                                    <div className="relative w-full sm:w-64">
                                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                        <Input placeholder="Tìm tên, ngày, lý do..." className="pl-9 bg-slate-50" value={leaveSearch} onChange={(e) => { setLeaveSearch(e.target.value); setLeavePage(1); }} />
                                    </div>
                                    <Select value={leaveStatusFilter} onValueChange={(v) => { setLeaveStatusFilter(v); setLeavePage(1); }}>
                                        <SelectTrigger className="w-full sm:w-[150px] bg-slate-50"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                                        <SelectContent><SelectItem value="all">Tất cả</SelectItem><SelectItem value="pending">Chờ duyệt</SelectItem><SelectItem value="approved">Đã duyệt</SelectItem><SelectItem value="rejected">Từ chối</SelectItem></SelectContent>
                                    </Select>
                                    <Button variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-50 w-full sm:w-auto" onClick={handleExportExcel}>
                                        <FontAwesomeIcon icon={faFileExport} className="mr-2" /> Xuất Excel
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto min-h-[300px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead className="font-bold text-slate-700 cursor-pointer" onClick={() => handleSortLeave('name')}>NV {renderSortIcon(leaveSort, 'name')}</TableHead>
                                                <TableHead className="font-bold text-slate-700 cursor-pointer" onClick={() => handleSortLeave('type')}>Loại nghỉ {renderSortIcon(leaveSort, 'type')}</TableHead>
                                                <TableHead className="font-bold text-slate-700 cursor-pointer" onClick={() => handleSortLeave('startdate')}>Từ Ngày {renderSortIcon(leaveSort, 'startdate')}</TableHead>
                                                <TableHead className="font-bold text-slate-700">Đến Ngày</TableHead>
                                                <TableHead className="font-bold text-slate-700">Lý do</TableHead>
                                                <TableHead className="font-bold text-slate-700 cursor-pointer" onClick={() => handleSortLeave('status')}>Trạng thái {renderSortIcon(leaveSort, 'status')}</TableHead>
                                                <TableHead className="text-center font-bold text-slate-700">Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedLeaves.length > 0 ? paginatedLeaves.map((req) => (
                                                <TableRow key={req.leaverequestid} className="hover:bg-slate-50">
                                                    <TableCell className="font-medium text-slate-700">{req.employee?.name}</TableCell>
                                                    <TableCell>{mapLeaveType(req.leavetype)}</TableCell>
                                                    <TableCell>{new Date(req.startdate).toLocaleDateString('vi-VN')}</TableCell>
                                                    <TableCell>{new Date(req.enddate).toLocaleDateString('vi-VN')}</TableCell>
                                                    <TableCell className="max-w-[200px] truncate" title={req.reason}>{req.reason}</TableCell>
                                                    <TableCell>{mapStatus(req.status)}</TableCell>
                                                    <TableCell className="flex justify-center gap-2">
                                                        {req.status === 'pending' && (<><Button size="sm" variant="ghost" onClick={() => handleLeaveAction(req.leaverequestid, 'approve')}><FontAwesomeIcon icon={faCheck} className="text-green-600" /></Button><Button size="sm" variant="ghost" onClick={() => handleLeaveAction(req.leaverequestid, 'reject')}><FontAwesomeIcon icon={faXmark} className="text-red-600" /></Button><Button size="sm" variant="ghost" onClick={() => handleLeaveAction(req.leaverequestid, 'delete')}><FontAwesomeIcon icon={faTrash} className="text-gray-400" /></Button></>)}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (<TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500">Không tìm thấy dữ liệu phù hợp</TableCell></TableRow>)}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600"><span>Hiển thị</span><Select value={leaveItemsPerPage.toString()} onValueChange={(val) => { setLeaveItemsPerPage(Number(val)); setLeavePage(1); }}><SelectTrigger className="w-[70px] h-8 text-sm bg-white"><SelectValue placeholder="10" /></SelectTrigger><SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent></Select><span>dòng</span></div>
                                    <div className="flex gap-1"><Button variant="outline" size="icon" className="h-8 w-8" disabled={leavePage <= 1} onClick={() => setLeavePage(prev => prev - 1)}><FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" /></Button><Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white">{leavePage}</Button><Button variant="outline" size="icon" className="h-8 w-8" disabled={leavePage >= totalLeavePages} onClick={() => setLeavePage(prev => prev + 1)}><FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" /></Button></div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB OVERTIME (Dùng mapStatus CŨ) */}
                    <TabsContent value="overtime" className="mt-4">
                        <Card className="shadow-sm border-slate-200">
                            <div className="p-4 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white rounded-t-lg border-b border-slate-100">
                                <div className="flex gap-2 w-full lg:w-auto">
                                    <Button onClick={() => setShowOvertimeModal(true)} className="bg-green-600 hover:bg-green-700"><FontAwesomeIcon icon={faPlus} className="mr-2" /> Lập Đơn</Button>
                                    <Button variant="outline" onClick={() => setShowOtConfigModal(true)} className="border-orange-200 text-orange-700 hover:bg-orange-50"><FontAwesomeIcon icon={faGear} className="mr-2" /> Cấu hình OT</Button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
                                    <div className="relative w-full sm:w-64">
                                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                        <Input placeholder="Tên NV hoặc Ngày..." className="pl-9 bg-slate-50" value={otSearch} onChange={(e) => { setOtSearch(e.target.value); setOtPage(1); }} />
                                    </div>
                                    <Select value={otStatusFilter} onValueChange={(v) => { setOtStatusFilter(v); setOtPage(1); }}>
                                        <SelectTrigger className="w-full sm:w-[150px] bg-slate-50"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                                        <SelectContent><SelectItem value="all">Tất cả</SelectItem><SelectItem value="pending">Chờ duyệt</SelectItem><SelectItem value="approved">Đã duyệt</SelectItem><SelectItem value="rejected">Từ chối</SelectItem></SelectContent>
                                    </Select>
                                    <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 w-full sm:w-auto" onClick={handleExportExcel}><FontAwesomeIcon icon={faFileExport} className="mr-2" /> Xuất Excel</Button>
                                </div>
                            </div>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto min-h-[300px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead className="font-bold text-slate-700 cursor-pointer" onClick={() => handleSortOt('name')}>NV {renderSortIcon(otSort, 'name')}</TableHead>
                                                <TableHead className="font-bold text-slate-700 cursor-pointer" onClick={() => handleSortOt('date')}>Ngày {renderSortIcon(otSort, 'date')}</TableHead>
                                                <TableHead className="font-bold text-slate-700">Giờ</TableHead>
                                                <TableHead className="text-center font-bold text-slate-700 cursor-pointer" onClick={() => handleSortOt('hours')}>Tổng (h) {renderSortIcon(otSort, 'hours')}</TableHead>
                                                <TableHead className="font-bold text-slate-700">Nội dung</TableHead>
                                                <TableHead className="font-bold text-slate-700 cursor-pointer" onClick={() => handleSortOt('status')}>Trạng thái {renderSortIcon(otSort, 'status')}</TableHead>
                                                <TableHead className="text-center font-bold text-slate-700">Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedOvertimes.length > 0 ? paginatedOvertimes.map((req) => (
                                                <TableRow key={req.overtimerequestid} className="hover:bg-slate-50">
                                                    <TableCell className="font-medium text-slate-700">{req.employee?.name}</TableCell>
                                                    <TableCell>{new Date(req.overtimedate).toLocaleDateString('vi-VN')}</TableCell>
                                                    <TableCell className="text-xs text-slate-500"><span className="font-mono text-slate-700">{new Date(req.starttime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span> ➔ <span className="font-mono text-slate-700">{new Date(req.endtime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></TableCell>
                                                    <TableCell className="text-center font-bold text-slate-600">{req.overtimehours}</TableCell>
                                                    <TableCell className="max-w-[150px] truncate text-slate-600" title={req.workcontent}>{req.workcontent}</TableCell>
                                                    <TableCell>{mapStatus(req.status)}</TableCell>
                                                    <TableCell className="flex justify-center gap-2">
                                                        {req.status === 'pending' && (<><Button size="sm" variant="ghost" onClick={() => handleOTAction(req.overtimerequestid, 'approve')}><FontAwesomeIcon icon={faCheck} className="text-green-600" /></Button><Button size="sm" variant="ghost" onClick={() => handleOTAction(req.overtimerequestid, 'reject')}><FontAwesomeIcon icon={faXmark} className="text-red-600" /></Button><Button size="sm" variant="ghost" onClick={() => handleOTAction(req.overtimerequestid, 'delete')}><FontAwesomeIcon icon={faTrash} className="text-gray-400" /></Button></>)}
                                                    </TableCell>
                                                </TableRow>
                                            )) : (<TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500">Không tìm thấy dữ liệu phù hợp</TableCell></TableRow>)}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600"><span>Hiển thị</span><Select value={otItemsPerPage.toString()} onValueChange={(val) => { setOtItemsPerPage(Number(val)); setOtPage(1); }}><SelectTrigger className="w-[70px] h-8 text-sm bg-white"><SelectValue placeholder="10" /></SelectTrigger><SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent></Select><span>dòng</span></div>
                                    <div className="flex gap-1"><Button variant="outline" size="icon" className="h-8 w-8" disabled={otPage <= 1} onClick={() => setOtPage(prev => prev - 1)}><FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" /></Button><Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white">{otPage}</Button><Button variant="outline" size="icon" className="h-8 w-8" disabled={otPage >= totalOtPages} onClick={() => setOtPage(prev => prev + 1)}><FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" /></Button></div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            <AttendanceModals
                showLeaveModal={showLeaveModal} setShowLeaveModal={setShowLeaveModal}
                showOvertimeModal={showOvertimeModal} setShowOvertimeModal={setShowOvertimeModal}
                showEditTimeModal={showEditTimeModal} setShowEditTimeModal={setShowEditTimeModal}
                showQrModal={showQrModal} setShowQrModal={setShowQrModal}
                showOtConfigModal={showOtConfigModal} setShowOtConfigModal={setShowOtConfigModal}
                showEditStatusModal={showEditStatusModal} setShowEditStatusModal={setShowEditStatusModal}
                selectedLog={selectedLog}
                onRefresh={fetchData}
            />
        </div>
    );
}