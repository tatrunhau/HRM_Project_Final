'use client';

import Sidebar from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMagnifyingGlass, faPenToSquare, faTrash, faFileExport, 
  faPlus, faUserXmark, faChevronLeft, faChevronRight, faFilter 
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo } from 'react';
import ResignationModals from './modals';

// Services
import { getResignations, deleteResignation, exportResignations, Resignation } from '@/services/admin/resignation';
import { getEmployees } from '@/services/admin/employee';

// --- HELPER 1: Format ngày tháng ---
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '---';

// --- HELPER 2: Badge trạng thái Tiếng Việt ---
const getStatusBadge = (status: string) => {
    switch(status) {
        case 'Approved': 
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Đã duyệt</Badge>;
        case 'Rejected': 
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Từ chối</Badge>;
        default: 
            return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Chờ duyệt</Badge>;
    }
};

// --- HELPER 3: Xóa dấu tiếng Việt để tìm kiếm ---
const removeVietnameseTones = (str: string) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Một số hệ thống mã hóa tiếng Việt khác
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
    return str;
}

export default function ResignationPage() {
  const [data, setData] = useState<Resignation[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter & Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resData, empData] = await Promise.all([getResignations(), getEmployees()]);
      setData(resData || []);
      setEmployees(empData.filter((e: any) => e.status !== 'Resigned'));
    } catch (error) { 
        console.error("Lỗi tải dữ liệu:", error); 
    } finally { 
        setIsLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 2. FILTER LOGIC (ĐÃ CẬP NHẬT TÌM KIẾM TIẾNG VIỆT) ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Chuẩn hóa từ khóa tìm kiếm: Chữ thường + Xóa dấu
      const searchNormalized = removeVietnameseTones(searchTerm.toLowerCase());
      
      // Chuẩn hóa dữ liệu: Chữ thường + Xóa dấu
      const nameNormalized = removeVietnameseTones((item.employee?.name || '').toLowerCase());
      const codeNormalized = removeVietnameseTones((item.employee?.employeecode || '').toLowerCase());

      // So sánh
      const matchesSearch = nameNormalized.includes(searchNormalized) || codeNormalized.includes(searchNormalized);
      
      // Lọc theo trạng thái
      const matchesStatus = filterStatus === 'all' ? true : item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, filterStatus]);

  // --- 3. PAGINATION CALCULATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // --- 4. ACTIONS ---
  const handleAddNew = () => {
    setIsEditing(false);
    setFormData({ 
        employeeid: '', 
        resignationdate: new Date().toISOString().split('T')[0], 
        reason: '', 
        status: 'Pending'
    });
    setShowModal(true);
  };

  const handleEdit = (item: Resignation) => {
    setIsEditing(true);
    setFormData({ 
        ...item, 
        employeeid: item.employeeid.toString(), 
        resignationdate: item.resignationdate ? new Date(item.resignationdate).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
        await deleteResignation(deleteId);
        await fetchData();
        setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Sidebar />
      <main className="ml-64 transition-all duration-300">
        <div className="p-8 max-w-7xl mx-auto">
          
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faUserXmark} className="text-red-600" /> Quản Lý Nghỉ Việc
              </h1>
              <p className="text-slate-500 mt-1">Danh sách hồ sơ thôi việc & quyết định nghỉ việc</p>
            </div>
            <Button className="bg-slate-900 text-white gap-2 hover:bg-slate-800" onClick={handleAddNew}>
                <FontAwesomeIcon icon={faPlus} /> Lập Hồ Sơ
            </Button>
          </div>

          {/* TOOLBAR */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <Input 
                        placeholder="Tìm tên, mã NV..." 
                        className="pl-9 bg-slate-50" 
                        value={searchTerm} 
                        onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} 
                    />
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>
                
                <Select value={filterStatus} onValueChange={(val) => {setFilterStatus(val); setCurrentPage(1);}}>
                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-slate-400 text-xs"/>
                            <SelectValue placeholder="Trạng thái" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="Pending">⏳ Chờ duyệt</SelectItem>
                        <SelectItem value="Approved">✅ Đã duyệt</SelectItem>
                        <SelectItem value="Rejected">❌ Từ chối</SelectItem>
                    </SelectContent>
                </Select>
             </div>

             <Button variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50" onClick={exportResignations}>
                <FontAwesomeIcon icon={faFileExport} className="mr-2"/> Xuất Excel
             </Button>
          </div>

          {/* TABLE DATA */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/70">
                    <TableHead className="w-[50px] font-bold text-slate-700">STT</TableHead>
                    <TableHead className="font-bold text-slate-700">Mã NV</TableHead>
                    <TableHead className="font-bold text-slate-700">Họ và Tên</TableHead>
                    <TableHead className="font-bold text-slate-700">Phòng Ban</TableHead>
                    <TableHead className="font-bold text-slate-700">Ngày Nghỉ</TableHead>
                    <TableHead className="font-bold text-slate-700">Lý Do</TableHead>
                    <TableHead className="font-bold text-slate-700">Trạng Thái</TableHead>
                    <TableHead className="text-right font-bold text-slate-700">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Đang tải dữ liệu...</TableCell></TableRow> :
                    currentItems.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500 italic">Không tìm thấy hồ sơ nào</TableCell></TableRow> :
                    currentItems.map((item, idx) => (
                    <TableRow key={item.resignationid} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-center text-slate-500">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                        <TableCell className="font-medium text-blue-600">{item.employee?.employeecode}</TableCell>
                        <TableCell className="font-semibold text-slate-700">{item.employee?.name}</TableCell>
                        <TableCell><Badge variant="outline" className="font-normal text-slate-600 bg-slate-50">{item.employee?.department?.name || '---'}</Badge></TableCell>
                        <TableCell className="text-slate-600 text-sm">{formatDate(item.resignationdate)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-slate-500 text-xs" title={item.reason}>{item.reason}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700" onClick={() => handleEdit(item)}>
                                <FontAwesomeIcon icon={faPenToSquare} />
                            </Button>
                            {item.status !== 'Approved' && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { setDeleteId(item.resignationid); setShowDeleteModal(true); }}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            )}
                          </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            
            {/* PAGINATION */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Hiển thị</span>
                    <Select defaultValue="10" onValueChange={(val) => {setItemsPerPage(Number(val)); setCurrentPage(1);}}>
                        <SelectTrigger className="w-[70px] h-8 text-sm bg-white"><SelectValue placeholder="10" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-slate-500">dòng - Tổng <span className="font-medium text-slate-700">{filteredData.length}</span> kết quả</span>
                </div>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}><FontAwesomeIcon icon={faChevronLeft} className="text-xs"/></Button>
                    <Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white hover:bg-slate-800 pointer-events-none">{currentPage}</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===totalPages || totalPages === 0} onClick={()=>setCurrentPage(p=>p+1)}><FontAwesomeIcon icon={faChevronRight} className="text-xs"/></Button>
                </div>
            </div>
          </Card>
        </div>
      </main>

      <ResignationModals
        showModal={showModal} setShowModal={setShowModal}
        showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal}
        isEditing={isEditing}
        formData={formData} setFormData={setFormData}
        employeeList={employees}
        refreshData={fetchData}
        onConfirmDelete={handleDelete}
      />
    </div>
  );
}