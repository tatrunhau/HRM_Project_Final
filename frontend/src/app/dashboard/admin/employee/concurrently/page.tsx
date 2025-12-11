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
  faMagnifyingGlass, 
  faPenToSquare, 
  faSitemap, 
  faChevronLeft, 
  faChevronRight,
  faFilter,
  faSpinner,
  faFileExcel,
  faRotateRight
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo } from 'react';

import ConcurrentModal from './modals';
import { getConcurrentEmployees, exportConcurrentData, ConcurrentEmployee } from '@/services/admin/concurrently';

export default function ConcurrentPageUI() {
  // --- STATE DỮ LIỆU ---
  const [employees, setEmployees] = useState<ConcurrentEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<ConcurrentEmployee | null>(null);

  // --- STATE LỌC & TÌM KIẾM ---
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✨ THAY ĐỔI: Gộp filterType và concurrentStatus thành filterMode
  // Các giá trị: 'all' | 'department' | 'jobtitle' | 'has_concurrent' | 'no_concurrent'
  const [filterMode, setFilterMode] = useState('all'); 
  const [filterValue, setFilterValue] = useState('');

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Load dữ liệu
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getConcurrentEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Xuất Excel
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportConcurrentData();
    } catch (error) {
      alert("Lỗi khi xuất file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Tạo danh sách Filter options động (chỉ dùng khi chọn Phòng ban hoặc Chức danh)
  const filterOptions = useMemo(() => {
    if (filterMode === 'department') {
      const depts = new Map();
      employees.forEach(e => {
        if (e.deptId && e.deptName) depts.set(e.deptId, e.deptName);
      });
      return Array.from(depts.entries()).map(([id, name]) => ({ id: String(id), name }));
    }
    if (filterMode === 'jobtitle') {
      const jobs = new Map();
      employees.forEach(e => {
        if (e.mainJobId && e.mainJobName) jobs.set(e.mainJobId, e.mainJobName);
      });
      return Array.from(jobs.entries()).map(([id, name]) => ({ id: String(id), name }));
    }
    return [];
  }, [employees, filterMode]);

  // 4. ✨ Logic Lọc dữ liệu hiển thị (Đã cập nhật theo filterMode mới)
  const filteredData = useMemo(() => {
    return employees.filter(e => {
        // A. Tìm kiếm text
        const matchSearch = 
            (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (e.code || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchFilter = true;

        // B. Xử lý các chế độ lọc
        switch (filterMode) {
            case 'department':
                if (filterValue) matchFilter = String(e.deptId) === filterValue;
                break;
            case 'jobtitle':
                if (filterValue) matchFilter = String(e.mainJobId) === filterValue;
                break;
            case 'has_concurrent':
                matchFilter = e.subJobDetails.length > 0;
                break;
            case 'no_concurrent':
                matchFilter = e.subJobDetails.length === 0;
                break;
            default:
                matchFilter = true;
        }

        return matchSearch && matchFilter;
    });
  }, [searchTerm, filterMode, filterValue, employees]);

  // 5. Phân trang
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handleOpenModal = (emp: ConcurrentEmployee) => {
    setSelectedEmp(emp);
    setShowModal(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMode('all');
    setFilterValue('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || filterMode !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
      <Sidebar />
      
      <main className="ml-64 transition-all duration-300 ease-in-out p-8 max-w-7xl mx-auto">
        
        {/* Header Title */}
        <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <span className="bg-white p-2 rounded-lg border shadow-sm text-slate-700">
                    <FontAwesomeIcon icon={faSitemap} />
                </span>
                Quản Lý Kiêm Nhiệm
            </h1>
            <p className="text-slate-500 mt-2 ml-1">Thiết lập các vị trí công tác kiêm nhiệm cho nhân sự.</p>
        </div>

        {/* --- THANH CÔNG CỤ --- */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
           
           {/* NHÓM TRÁI: Tìm kiếm + Dropdown Gộp */}
           <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto flex-wrap items-center">
                
                {/* 1. Ô tìm kiếm */}
                <div className="relative w-full sm:w-64">
                    <Input 
                      placeholder="Tìm tên, mã NV..." 
                      className="pl-9 bg-slate-50" 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                    />
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>

                {/* 2. ✨ Dropdown Gộp (Chế độ lọc) */}
                <div className="flex gap-2 w-full sm:w-auto">
                    <Select 
                        value={filterMode} 
                        onValueChange={(val) => {
                            setFilterMode(val); 
                            setFilterValue(''); // Reset giá trị con khi đổi chế độ
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="w-[200px] bg-slate-50 font-medium">
                            <SelectValue placeholder="Chế độ lọc" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả nhân viên</SelectItem>
                            
                            {/* Nhóm Danh mục */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Theo danh mục</div>
                            <SelectItem value="department">Phòng ban</SelectItem>
                            <SelectItem value="jobtitle">Chức danh</SelectItem>

                            {/* Nhóm Trạng thái */}
                            <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1 border-t pt-2">Theo trạng thái</div>
                            <SelectItem value="has_concurrent" className="text-blue-600">✅ Đã có kiêm nhiệm</SelectItem>
                            <SelectItem value="no_concurrent" className="text-slate-600">⚪ Chưa có kiêm nhiệm</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* 3. Dropdown phụ (Chỉ hiện khi chọn Phòng ban hoặc Chức danh) */}
                    {(filterMode === 'department' || filterMode === 'jobtitle') && (
                        <Select value={filterValue} onValueChange={setFilterValue}>
                            <SelectTrigger className="w-[180px] bg-white border-blue-200 text-blue-700 animate-in fade-in zoom-in duration-200">
                                <SelectValue placeholder={`Chọn ${filterMode === 'department' ? 'phòng ban' : 'chức danh'}...`} />
                            </SelectTrigger>
                            <SelectContent>
                                {filterOptions.length > 0 ? (
                                    filterOptions.map(opt => (
                                        <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-xs text-slate-400 text-center">Không có dữ liệu</div>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </div>
           </div>
           
           {/* NHÓM PHẢI: Buttons */}
           <div className="flex gap-2 w-full xl:w-auto justify-end">
               {hasActiveFilters && (
                   <Button variant="ghost" className="text-red-500 hover:bg-red-50" onClick={clearFilters}>
                       <FontAwesomeIcon icon={faFilter} className="mr-1"/> Xóa lọc
                   </Button>
               )}

               <Button variant="outline" onClick={fetchData} disabled={loading} title="Tải lại dữ liệu">
                  <FontAwesomeIcon icon={faRotateRight} className={`${loading ? 'animate-spin' : ''}`}/>
               </Button>

               <Button 
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                  onClick={handleExport}
                  disabled={isExporting}
               >
                  {isExporting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> : <FontAwesomeIcon icon={faFileExcel} className="mr-2"/>}
                  Xuất Excel
               </Button>
           </div>
        </div>

        {/* Bảng danh sách */}
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="w-[100px] font-bold text-slate-700">Mã NV</TableHead>
                <TableHead className="font-bold text-slate-700">Họ và Tên</TableHead>
                <TableHead className="font-bold text-slate-700">Phòng Ban</TableHead>
                <TableHead className="font-bold text-slate-700">Chức Danh</TableHead>
                <TableHead className="font-bold text-slate-700">Vị Trí Kiêm Nhiệm</TableHead>
                <TableHead className="text-right font-bold text-slate-700 pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500"><FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> Đang tải dữ liệu...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      {hasActiveFilters ? 'Không tìm thấy kết quả phù hợp.' : 'Không có nhân viên nào.'}
                  </TableCell></TableRow>
              ) : (
                currentItems.map((emp, index) => (
                    <TableRow key={emp.id} className="group hover:bg-blue-50/30 transition-colors">
                    <TableCell>
                        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {emp.code}
                        </span>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                                ${(index % 5 === 0) ? 'bg-indigo-500' : 
                                 (index % 5 === 1) ? 'bg-pink-500' :
                                 (index % 5 === 2) ? 'bg-green-500' :
                                 (index % 5 === 3) ? 'bg-orange-500' : 'bg-blue-500'}`}
                            >
                                {emp.name.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-800">{emp.name}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{emp.deptName}</TableCell>
                    <TableCell>
                        <span className="text-blue-700 font-medium">{emp.mainJobName}</span>
                    </TableCell>
                    <TableCell>
                        {emp.subJobDetails && emp.subJobDetails.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {emp.subJobDetails.map((job) => (
                                    <Badge 
                                        key={job.id} 
                                        variant="outline" 
                                        className={`
                                            border transition-colors font-medium
                                            ${job.status 
                                                ? 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50' 
                                                : 'bg-slate-100 text-slate-500 border-slate-200' 
                                            }
                                        `}
                                    >
                                        {job.name}
                                        {!job.status && <span className="ml-1 text-[9px] text-slate-400 italic font-normal">(Ngừng)</span>}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <span className="text-slate-400 text-sm italic">Không có</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                        <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-all"
                            onClick={() => handleOpenModal(emp)}
                            title="Chỉnh sửa kiêm nhiệm"
                        >
                        <FontAwesomeIcon icon={faPenToSquare} />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* PHÂN TRANG */}
          <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Hiển thị</span>
                  <Select 
                    defaultValue="10" 
                    value={itemsPerPage.toString()} 
                    onValueChange={(val) => {setItemsPerPage(Number(val)); setCurrentPage(1);}}
                  >
                      <SelectTrigger className="w-[70px] h-8 text-sm bg-white">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                      </SelectContent>
                  </Select>
                  <span className="text-sm text-slate-500">dòng - Tổng {filteredData.length} kết quả</span>
              </div>
              
              <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 bg-white hover:bg-slate-100" 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <FontAwesomeIcon icon={faChevronLeft}/>
                  </Button>
                  
                  <Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white pointer-events-none">
                    {currentPage}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 bg-white hover:bg-slate-100" 
                    disabled={currentPage >= totalPages || totalPages === 0} 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <FontAwesomeIcon icon={faChevronRight}/>
                  </Button>
              </div>
          </div>

        </Card>
      </main>

      {/* Modal */}
      {selectedEmp && (
          <ConcurrentModal 
            isOpen={showModal} 
            onClose={() => setShowModal(false)} 
            employeeId={selectedEmp.id}
            employeeName={selectedEmp.name}
            mainJobId={selectedEmp.mainJobId}
            mainJobTitle={selectedEmp.mainJobName}
            currentSubJobIds={selectedEmp.subJobIds}
            onSuccess={fetchData}
          />
      )}
    </div>
  );
}