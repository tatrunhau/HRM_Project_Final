'use client';

import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faFileExport, faMagnifyingGlass, faMoneyCheckDollar, 
  faHandHoldingDollar, faScrewdriverWrench, faEye, faChevronLeft, faChevronRight,
  faFileInvoiceDollar, faPencil, faCheck, faXmark, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import PayrollModals from './modals';
import { 
    getMonthlySalaries, exportPayroll,
    getAdvanceRequests, updateAdvanceStatus, deleteAdvanceRequest, exportAdvanceRequests 
} from '@/services/admin/payroll';

export default function PayrollPage() {
    // --- STATE QUẢN LÝ TABS ---
    const [activeTab, setActiveTab] = useState<'payroll' | 'advance'>('payroll');
    
    // --- MODAL STATES ---
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showCreatePayrollModal, setShowCreatePayrollModal] = useState(false);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    const [selectedSalary, setSelectedSalary] = useState<any>(null);
    const [selectedAdvance, setSelectedAdvance] = useState<any>(null); // State cho đơn được chọn để sửa
    const [isEditingAdvance, setIsEditingAdvance] = useState(false);

    // --- DATA STATES ---
    const [salaryData, setSalaryData] = useState<any[]>([]);
    const [advanceData, setAdvanceData] = useState<any[]>([]); // Data ứng lương thật
    const [loading, setLoading] = useState(false);

    // --- FILTER STATES ---
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString()); 
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [searchTerm, setSearchTerm] = useState('');

    // --- PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); 

    // ================== FETCH DATA ==================
    
    // 1. Fetch Payroll
    const fetchSalaries = async () => {
        setLoading(true);
        try {
            const data = await getMonthlySalaries(Number(selectedMonth), Number(selectedYear), searchTerm);
            setSalaryData(data);
            if (activeTab === 'payroll') setCurrentPage(1); 
        } catch (error) {
            console.error("Failed to fetch salaries", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. Fetch Advance Requests
    const fetchAdvanceData = async () => {
        setLoading(true);
        try {
            // Truyền tham số status = '' để lấy tất cả
            const data = await getAdvanceRequests(searchTerm, ''); 
            setAdvanceData(data);
             if (activeTab === 'advance') setCurrentPage(1);
        } catch (error) {
            console.error("Failed to fetch advance requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (activeTab === 'payroll') fetchSalaries();
            else fetchAdvanceData();
        }, 300); 
        return () => clearTimeout(timeoutId);
    }, [selectedMonth, selectedYear, searchTerm, activeTab]);

    // ================== ACTIONS ==================

    // Export Payroll Excel
    const handleExport = async () => {
        const success = await exportPayroll(Number(selectedMonth), Number(selectedYear));
        if (!success) alert("Xuất file thất bại! Vui lòng thử lại.");
    };

    // Export Advance Excel
    const handleExportAdvance = async () => {
        const success = await exportAdvanceRequests(searchTerm, '');
        if (!success) alert("Xuất file danh sách ứng lương thất bại!");
    };

    const handleViewDetail = (item: any) => {
        setSelectedSalary(item);
        setShowDetailModal(true);
    };

    // --- ADVANCE ACTIONS ---
    const handleCreateAdvance = () => {
        setIsEditingAdvance(false);
        setSelectedAdvance(null);
        setShowAdvanceModal(true);
    };

    const handleEditAdvance = (item: any) => {
        if(item.status !== 'pending') return alert("Chỉ có thể sửa đơn chưa duyệt!");
        setIsEditingAdvance(true);
        setSelectedAdvance(item);
        setShowAdvanceModal(true);
    };

    const handleDeleteAdvance = async (id: number, status: string) => {
        if(status === 'approved') return alert("Không thể xóa đơn đã duyệt!");
        if(!confirm("Bạn có chắc muốn xóa đơn này?")) return;
        try {
            await deleteAdvanceRequest(id);
            fetchAdvanceData(); // Refresh list
        } catch (error: any) {
            alert(error?.message || "Lỗi xóa đơn");
        }
    };

    const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
        if(!confirm(`Xác nhận ${status === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'} đơn này?`)) return;
        try {
            await updateAdvanceStatus(id, status);
            fetchAdvanceData(); // Refresh list
        } catch (error: any) {
            alert(error?.message || "Lỗi cập nhật trạng thái");
        }
    };

    // ================== RENDER HELPERS ==================
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
    };

    const mapStatus = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Chờ duyệt</Badge>;
            case 'approved': return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Đã duyệt</Badge>;
            case 'rejected': return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">Đã từ chối</Badge>;
            default: return <Badge variant="secondary">Không rõ</Badge>;
        }
    };

    // Pagination Logic
    const currentList = activeTab === 'payroll' ? salaryData : advanceData;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = currentList.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(currentList.length / itemsPerPage);

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 w-full ml-64 p-8 transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FontAwesomeIcon icon={faMoneyCheckDollar} className="text-slate-600" /> Quản Lý Lương & Chế Độ
                        </h1>
                        <p className="text-slate-500 mt-1">Tính toán lương, thưởng và các khoản khấu trừ</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
                    
                    {/* --- TABS LIST --- */}
                    <TabsList className="grid w-full sm:w-[500px] grid-cols-2 h-auto p-1 bg-white border border-slate-200 shadow-sm rounded-lg">
                        <TabsTrigger value="payroll" className="flex items-center gap-2 py-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
                            <FontAwesomeIcon icon={faFileInvoiceDollar} /> Bảng Lương Tháng
                        </TabsTrigger>
                        <TabsTrigger value="advance" className="flex items-center gap-2 py-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
                            <FontAwesomeIcon icon={faHandHoldingDollar} /> Đơn Ứng Lương
                        </TabsTrigger>
                    </TabsList>

                    {/* --- TAB 1: BẢNG LƯƠNG --- */}
                    <TabsContent value="payroll" className="mt-6 space-y-4">
                        {/* Filter Bar Payroll */}
                        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                             <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center flex-wrap">
                                <Button onClick={() => setShowCreatePayrollModal(true)} className="bg-slate-900 text-white gap-2 whitespace-nowrap">
                                    <FontAwesomeIcon icon={faPlus} /> Tạo Bảng Lương
                                </Button>
                                <Button variant="outline" onClick={() => setShowConfigModal(true)} className="whitespace-nowrap">
                                    <FontAwesomeIcon icon={faScrewdriverWrench} className="mr-2" /> Cấu Hình
                                </Button>
                                <div className="hidden sm:block w-[1px] h-8 bg-slate-200 mx-1"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Tháng:</span>
                                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                        <SelectTrigger className="w-[80px] bg-slate-50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({length: 12}, (_, i) => (i + 1).toString()).map(m => (
                                                <SelectItem key={m} value={m}>T{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Năm:</span>
                                    <Input type="number" className="w-[80px] bg-slate-50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} />
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Input placeholder="Tìm tên, mã NV..." className="pl-9 bg-slate-50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                </div>
                             </div>
                             <div className="flex w-full xl:w-auto justify-end">
                                <Button variant="outline" onClick={handleExport} className="text-green-700 border-green-200 hover:bg-green-50 whitespace-nowrap">
                                    <FontAwesomeIcon icon={faFileExport} className="mr-2" /> Excel
                                </Button>
                             </div>
                        </div>

                        {/* Salary Table */}
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50">
                                            <TableHead className="w-[50px] font-bold text-slate-700">STT</TableHead>
                                            <TableHead className="font-bold text-slate-700">Mã NV</TableHead>
                                            <TableHead className="font-bold text-slate-700">Họ Tên</TableHead>
                                            <TableHead className="font-bold text-slate-700">Chức Vụ</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700">Lương CB</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700">Phụ Cấp</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700">Lương OT</TableHead>
                                            <TableHead className="text-right font-bold text-red-600">Khấu Trừ</TableHead>
                                            <TableHead className="text-right font-bold text-blue-700">Thực Lĩnh</TableHead>
                                            <TableHead className="text-center font-bold text-slate-700">Chi tiết</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-500">Đang tải dữ liệu...</TableCell></TableRow>
                                        ) : currentItems.length > 0 ? (
                                            currentItems.map((item, idx) => {
                                                const totalDeduction = Number(item.insuranceamount) + Number(item.taxamount) + Number(item.penaltyamount) + Number(item.advanceamount);
                                                return (
                                                    <TableRow key={item.salaryid} className="hover:bg-slate-50">
                                                        <TableCell className="text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                                                        <TableCell className="font-medium text-blue-600">{item.employee?.employeecode}</TableCell>
                                                        <TableCell className="font-medium text-slate-800">{item.employee?.name}</TableCell>
                                                        <TableCell>{item.employee?.jobtitle?.name}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.basicsalary)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.totalallowance)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.overtimeamount)}</TableCell>
                                                        <TableCell className="text-right text-red-500 font-medium">-{formatCurrency(totalDeduction)}</TableCell>
                                                        <TableCell className="text-right font-bold text-blue-700 text-base">{formatCurrency(item.netsalary)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:bg-teal-50" onClick={() => handleViewDetail(item)}>
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow><TableCell colSpan={10} className="text-center py-8 text-slate-500">Không tìm thấy dữ liệu</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Pagination (Dùng chung logic) */}
                            <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">Hiển thị</span>
                                    <Select defaultValue="10" onValueChange={(val) => {setItemsPerPage(Number(val)); setCurrentPage(1);}}>
                                        <SelectTrigger className="w-[70px] h-8 text-sm"><SelectValue placeholder="10" /></SelectTrigger>
                                        <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
                                    </Select>
                                    <span className="text-sm text-slate-500">dòng - Tổng {currentList.length} kết quả</span>
                                </div>
                                {totalPages > 1 && (
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FontAwesomeIcon icon={faChevronLeft} /></Button>
                                        <Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white">{currentPage}</Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FontAwesomeIcon icon={faChevronRight} /></Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </TabsContent>

                    {/* --- TAB 2: ĐƠN ỨNG LƯƠNG --- */}
                    <TabsContent value="advance" className="mt-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardContent className="p-6">
                                {/* Toolbar */}
                                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <div className="relative w-full sm:w-64">
                                            <Input placeholder="Tìm theo tên..." className="pl-9 bg-slate-50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                                        <Button onClick={handleCreateAdvance} className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm">
                                            <FontAwesomeIcon icon={faPlus} className="mr-2" /> Tạo Đơn Ứng
                                        </Button>
                                        <Button variant="outline" onClick={handleExportAdvance} className="text-slate-600 hover:bg-slate-50">
                                            <FontAwesomeIcon icon={faFileExport} className="mr-2" /> Xuất Danh Sách
                                        </Button>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50">
                                                <TableHead className="w-[50px] font-bold text-slate-700">#</TableHead>
                                                <TableHead className="font-bold text-slate-700">Mã NV</TableHead>
                                                <TableHead className="font-bold text-slate-700">Họ Tên</TableHead>
                                                <TableHead className="font-bold text-slate-700">Ngày Ứng</TableHead>
                                                <TableHead className="text-right font-bold text-slate-700">Số Tiền</TableHead>
                                                <TableHead className="font-bold text-slate-700">Lý Do</TableHead>
                                                <TableHead className="font-bold text-slate-700">Trạng Thái</TableHead>
                                                <TableHead className="text-center font-bold text-slate-700">Thao tác</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={8} className="text-center py-8">Đang tải...</TableCell></TableRow>
                                            ) : currentItems.length > 0 ? (
                                                currentItems.map((req, index) => (
                                                    <TableRow key={req.advancerequestid} className="hover:bg-slate-50 transition-colors">
                                                        <TableCell className="text-slate-600 font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                                                        <TableCell className="font-mono text-xs text-slate-500">{req.employee?.employeecode}</TableCell>
                                                        <TableCell className="font-medium text-slate-700">{req.employee?.name}</TableCell>
                                                        <TableCell>{new Date(req.createddate).toLocaleDateString('vi-VN')}</TableCell>
                                                        <TableCell className="text-right font-semibold text-orange-700">{formatCurrency(req.advanceamount)}</TableCell>
                                                        <TableCell className="max-w-[200px] truncate text-slate-600" title={req.reason}>{req.reason}</TableCell>
                                                        <TableCell>{mapStatus(req.status)}</TableCell>
                                                        <TableCell className="text-right flex justify-end gap-2">
                                                            {req.status === 'pending' && (
                                                                <>
                                                                    <Button variant="ghost" size="sm" title="Duyệt" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => handleUpdateStatus(req.advancerequestid, 'approved')}>
                                                                        <FontAwesomeIcon icon={faCheck} />
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" title="Từ chối" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleUpdateStatus(req.advancerequestid, 'rejected')}>
                                                                        <FontAwesomeIcon icon={faXmark} />
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" title="Sửa" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => handleEditAdvance(req)}>
                                                                        <FontAwesomeIcon icon={faPencil} className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" title="Xóa" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteAdvance(req.advancerequestid, req.status)}>
                                                                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {req.status !== 'pending' && <span className="text-xs text-gray-400 italic">Đã xử lý</span>}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Không có dữ liệu đơn ứng lương.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                {/* Pagination cho Advance Tab */}
                                <div className="flex items-center justify-end space-x-2 py-4">
                                     <div className="flex gap-1">
                                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FontAwesomeIcon icon={faChevronLeft} /></Button>
                                        <Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white">{currentPage}</Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FontAwesomeIcon icon={faChevronRight} /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* MODALS CONTROLLER */}
            <PayrollModals 
                showConfigModal={showConfigModal}
                setShowConfigModal={setShowConfigModal}
                showCreatePayrollModal={showCreatePayrollModal}
                setShowCreatePayrollModal={setShowCreatePayrollModal}
                showAdvanceModal={showAdvanceModal}
                setShowAdvanceModal={setShowAdvanceModal}
                
                showDetailModal={showDetailModal}
                setShowDetailModal={setShowDetailModal}
                selectedSalary={selectedSalary}
                
                // Props cho Advance
                isEditingAdvance={isEditingAdvance}
                selectedAdvance={selectedAdvance}
                onRefreshData={fetchAdvanceData} 
            />
        </div>
    );
}