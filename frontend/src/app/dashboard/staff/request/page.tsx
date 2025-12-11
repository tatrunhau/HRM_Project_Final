'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import EmployeeSidebar from '@/components/EmployeeSidebar'; 
import RequestModal from './modals';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, faFilter, faPlane, faClock, faMoneyBillWave, 
    faCheckCircle, faTimesCircle, faHourglassHalf,
    faEdit, faTrash, faSortAmountDown, faSortAmountUp, faChevronLeft, faChevronRight, faSync
} from '@fortawesome/free-solid-svg-icons';

// --- IMPORT SERVICES ---
import { 
    getLeaves, createLeave, updateLeave, deleteLeave,
    getOvertimes, createOvertime, updateOvertime, deleteOvertime,
    getAdvances, createAdvance, updateAdvance, deleteAdvance
} from '@/services/staff/request';

// ✅ IMPORT THÊM: Hàm lấy thông tin user hiện tại (Giống trang Profile)
import { getCurrentUser } from '@/services/staff/staff';

// Helper: Badge trạng thái
const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'pending': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><FontAwesomeIcon icon={faHourglassHalf} className="w-3" /> Chờ duyệt</span>;
        case 'approved': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><FontAwesomeIcon icon={faCheckCircle} className="w-3" /> Đã duyệt</span>;
        case 'rejected': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><FontAwesomeIcon icon={faTimesCircle} className="w-3" /> Từ chối</span>;
        default: return <span>{status}</span>;
    }
};

export default function RequestPage() {
    // --- STATE QUẢN LÝ USER ---
    const [user, setUser] = useState<{employeeid: number} | null>(null);

    // ✅ FIX: Gọi API lấy User thật sự thay vì fix cứng ID = 1
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Gọi API authme/getCurrentUser giống trang Profile
                const data = await getCurrentUser(); 
                if (data && data.employee) {
                    setUser(data.employee); // Lưu thông tin nhân viên
                } else {
                    console.warn("Không tìm thấy thông tin nhân viên trong tài khoản này");
                }
            } catch (error) {
                console.error("Lỗi xác thực người dùng:", error);
                // Nếu lỗi auth (401/403), có thể redirect về login
                // window.location.href = '/login';
            }
        };
        fetchUser();
    }, []);

    // --- STATE UI ---
    const [activeTab, setActiveTab] = useState<'leave' | 'overtime' | 'advance'>('leave');
    const [data, setData] = useState<any[]>([]); 
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Filter & Pagination State
    const [filterDate, setFilterDate] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Sidebar Mobile Logic
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- 1. FETCH DATA (Tự động chạy khi `user` có dữ liệu) ---
    const fetchData = useCallback(async () => {
        if (!user?.employeeid) return; // Chỉ chạy khi đã có ID nhân viên thật
        setIsLoading(true);
        try {
            let res: any[] = [];
            if (activeTab === 'leave') res = await getLeaves(user.employeeid);
            else if (activeTab === 'overtime') res = await getOvertimes(user.employeeid);
            else if (activeTab === 'advance') res = await getAdvances(user.employeeid);
            setData(res || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu bảng:", error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, user]);

    useEffect(() => { fetchData(); }, [fetchData]);


    // --- 2. XỬ LÝ DỮ LIỆU ---
    const processedData = useMemo(() => {
        let result = [...data];

        // Lọc theo ngày
        if (filterDate) {
            result = result.filter(item => {
                const dateVal = activeTab === 'leave' ? item.startdate : 
                                (activeTab === 'overtime' ? item.overtimedate : item.createddate);
                return dateVal && dateVal.startsWith(filterDate);
            });
        }

        // Sắp xếp
        result.sort((a, b) => {
            const dateFieldA = activeTab === 'leave' ? a.startdate : (activeTab === 'overtime' ? a.overtimedate : a.createddate);
            const dateFieldB = activeTab === 'leave' ? b.startdate : (activeTab === 'overtime' ? b.overtimedate : b.createddate);
            const timeA = new Date(dateFieldA).getTime();
            const timeB = new Date(dateFieldB).getTime();
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return result;
    }, [data, filterDate, sortOrder, activeTab]);

    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [activeTab, filterDate, itemsPerPage]);


    // --- 3. ACTIONS ---
    const handleSave = async (formData: any) => {
        if (!user?.employeeid) return;
        try {
            if (editingItem) {
                const id = editingItem.leaverequestid || editingItem.overtimerequestid || editingItem.advancerequestid;
                if (activeTab === 'leave') await updateLeave(id, formData);
                else if (activeTab === 'overtime') await updateOvertime(id, formData);
                else await updateAdvance(id, formData);
                alert("Cập nhật thành công!");
            } else {
                const payload = { ...formData, employeeId: user.employeeid };
                if (activeTab === 'leave') await createLeave(payload);
                else if (activeTab === 'overtime') await createOvertime(payload);
                else await createAdvance(payload);
                alert("Tạo đơn thành công!");
            }
            fetchData(); 
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    const handleDelete = async (item: any) => {
        if (!confirm("Bạn chắc chắn muốn hủy đơn này?")) return;
        try {
            const id = item.leaverequestid || item.overtimerequestid || item.advancerequestid;
            if (activeTab === 'leave') await deleteLeave(id);
            else if (activeTab === 'overtime') await deleteOvertime(id);
            else await deleteAdvance(id);
            alert("Đã hủy đơn thành công");
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Lỗi khi xóa!");
        }
    };

    const openCreateModal = () => { setEditingItem(null); setIsModalOpen(true); };
    const openEditModal = (item: any) => { setEditingItem(item); setIsModalOpen(true); };

    const ActionButtons = ({ item }: { item: any }) => {
        if (item.status !== 'pending') return <span className="text-gray-400 text-xs italic">Không thể sửa/xóa</span>;
        return (
            <div className="flex items-center gap-2 justify-center">
                <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><FontAwesomeIcon icon={faEdit} /></button>
                <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><FontAwesomeIcon icon={faTrash} /></button>
            </div>
        );
    };

    // --- HELPER FUNCTIONS ---
 const fmtDate = (d: string) => {
        if (!d) return '';
        // Chuyển sang định dạng ngày Việt Nam (dd/mm/yyyy)
        return new Date(d).toLocaleDateString('vi-VN');
    };
    const fmtMoney = (m: any) => {
        if (!m) return '0 đ';
        return Number(m).toLocaleString('vi-VN') + ' đ';
    };
    const fmtTime = (d: string) => d ? new Date(d).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '';
    const getLeaveTypeName = (type: string) => {
        const map: Record<string, string> = {
            'annual': 'Nghỉ phép năm',
            'sick': 'Nghỉ ốm',
            'personal': 'Việc riêng',
            'unpaid': 'Nghỉ không lương'
        };
        return map[type] || type; 
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <EmployeeSidebar />
            
            <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ${isMobile ? 'ml-0' : 'md:ml-64'}`}>
                <div className="pt-12 md:pt-0 max-w-6xl mx-auto">
                    
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Quản Lý Yêu Cầu</h1>
                        <div className="flex items-center justify-between">
                             <p className="text-slate-500 text-sm mt-1">Lịch sử và tạo đơn từ.</p>
                             <Button variant="ghost" size="sm" onClick={fetchData}><FontAwesomeIcon icon={faSync} className={isLoading ? "animate-spin" : ""}/></Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-4">
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex w-full md:w-auto overflow-hidden">
                            {[
                                { id: 'leave', label: 'Nghỉ Phép', icon: faPlane },
                                { id: 'overtime', label: 'Tăng Ca', icon: faClock },
                                { id: 'advance', label: 'Ứng Lương', icon: faMoneyBillWave },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all
                                        ${activeTab === tab.id 
                                            ? 'bg-blue-50 text-blue-700 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                                    `}
                                >
                                    <FontAwesomeIcon icon={tab.icon} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative">
                                <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"/>
                                <input type="date" className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 outline-none"
                                    value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                            </div>
                            <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                <FontAwesomeIcon icon={sortOrder === 'desc' ? faSortAmountDown : faSortAmountUp} />
                                <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}</span>
                            </button>
                        </div>
                        <button onClick={openCreateModal} className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center justify-center gap-2 font-medium text-sm">
                            <FontAwesomeIcon icon={faPlus} /> <span>Tạo Đơn Mới</span>
                        </button>
                    </div>

                    {/* Table / List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col">
                        <div className="flex-1">
                            {/* PC View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                                        <tr>
                                            {activeTab === 'leave' && <><th className="px-6 py-3">Loại nghỉ</th><th className="px-6 py-3">Thời gian</th></>}
                                            {activeTab === 'overtime' && <><th className="px-6 py-3">Ngày</th><th className="px-6 py-3">Giờ làm</th><th className="px-6 py-3">Tổng</th></>}
                                            {activeTab === 'advance' && <><th className="px-6 py-3">Ngày ứng</th><th className="px-6 py-3">Số tiền</th></>}
                                            <th className="px-6 py-3">Lý do / Ghi chú</th>
                                            <th className="px-6 py-3">Trạng thái</th>
                                            <th className="px-6 py-3 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr><td colSpan={6} className="text-center py-10">Đang tải dữ liệu...</td></tr>
                                        ) : paginatedData.length > 0 ? (
                                            paginatedData.map((item: any, idx) => (
                                                <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                                    {activeTab === 'leave' && <>
                                                        <td className="px-6 py-4 font-medium text-gray-900">
                                                            {getLeaveTypeName(item.leavetype)}
                                                        </td>
                                                        <td className="px-6 py-4">{fmtDate(item.startdate)} <span className="text-gray-400">→</span> {fmtDate(item.enddate)}</td>
                                                    </>}
                                                    {activeTab === 'overtime' && <>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{fmtDate(item.overtimedate)}</td>
                                                        <td className="px-6 py-4">{fmtTime(item.starttime)} - {fmtTime(item.endtime)}</td>
                                                        <td className="px-6 py-4 font-bold text-blue-600">{item.overtimehours}h</td>
                                                    </>}
                                                    {activeTab === 'advance' && <>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{fmtDate(item.createddate)}</td>
                                                        <td className="px-6 py-4 font-bold text-orange-600">{fmtMoney(item.advanceamount)}</td>
                                                    </>}
                                                    <td className="px-6 py-4 max-w-[200px] truncate">{item.reason || item.workcontent}</td>
                                                    <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                                    <td className="px-6 py-4"><ActionButtons item={item} /></td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chưa có dữ liệu nào.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden space-y-3 p-4 bg-gray-50">
                                {paginatedData.map((item: any, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start mb-2 border-b pb-2 border-dashed">
                                            <div>
                                                {activeTab === 'leave' && (
                                                    <span className="font-bold text-gray-800 block">
                                                        {getLeaveTypeName(item.leavetype)}
                                                    </span>
                                                )}
                                                {activeTab === 'overtime' && <span className="font-bold text-gray-800 block">Tăng ca: {fmtDate(item.overtimedate)}</span>}
                                                {activeTab === 'advance' && <span className="font-bold text-orange-600 block">Ứng: {fmtMoney(item.advanceamount)}</span>}
                                                <span className="text-xs text-gray-500">
                                                    {activeTab === 'leave' ? `${fmtDate(item.startdate)} -> ${fmtDate(item.enddate)}` : fmtDate(item.createddate)}
                                                </span>
                                            </div>
                                            <StatusBadge status={item.status} />
                                        </div>
                                        <div className="text-sm text-gray-600 mb-2">"{item.reason || item.workcontent}"</div>
                                        {item.status === 'pending' && (
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button onClick={() => openEditModal(item)} className="text-blue-600 text-sm font-medium"><FontAwesomeIcon icon={faEdit}/> Sửa</button>
                                                <button onClick={() => handleDelete(item)} className="text-red-600 text-sm font-medium"><FontAwesomeIcon icon={faTrash}/> Hủy</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pagination Footer */}
                        <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span>Hiển thị</span>
                                <Select value={itemsPerPage.toString()} onValueChange={(val) => {setItemsPerPage(Number(val)); setCurrentPage(1);}}>
                                    <SelectTrigger className="w-[70px] h-8 text-sm"><SelectValue placeholder="5" /></SelectTrigger>
                                    <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
                                </Select>
                                <span>/ {processedData.length} kết quả</span>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}><FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3"/></Button>
                                <Button variant="default" size="icon" className="h-8 w-8 bg-blue-600 text-white">{currentPage}</Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}><FontAwesomeIcon icon={faChevronRight} className="h-3 w-3"/></Button>
                            </div>
                        </div>
                    </div>
                </div>

                <RequestModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    type={activeTab}
                    initialData={editingItem}
                    onSave={handleSave}
                />
            </main>
        </div>
    );
}