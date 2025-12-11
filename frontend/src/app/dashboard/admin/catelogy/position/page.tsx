'use client';

import Sidebar from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faPenToSquare, faTrash, faFileExport,
  faPlus, faFilter, faBriefcase, faChevronLeft, faChevronRight, faSort, faSortUp, faSortDown
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo, useRef } from 'react';
import PositionModals from './modals';
// API Services
import { getPositions, createPosition, updatePosition, deletePosition, exportPositions, Position } from '@/services/admin/position';

// Types & Helpers
type SortDirection = 'asc' | 'desc';
interface SortConfig { key: keyof Position; direction: SortDirection; }

const getStatusBadge = (status: boolean) => {
  return status 
    ? <span className="px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">Hoạt động</span>
    : <span className="px-2 py-1 rounded-full text-xs font-medium border bg-slate-100 text-slate-500 border-slate-200">Ngừng</span>;
};

// ✨ Helper định dạng phần trăm
const formatPercentage = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || amount === 0) return '0%';
    // Nhân với 100 và định dạng thành chuỗi phần trăm
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};


export default function PositionPage() {
  // States UI
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // States Data & Logic
  const [positions, setPositions] = useState<Position[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter & Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- LOGIC ---
  const filteredData = useMemo(() => {
    return positions.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.positioncode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' ? true : 
                            filterStatus === 'active' ? item.status === true : item.status === false;
      return matchesSearch && matchesStatus;
    });
  }, [positions, searchTerm, filterStatus]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
        // Cập nhật logic sắp xếp cho trường bonus (và các trường số khác)
        if (sortConfig.key === 'bonus') {
            const valA = a[sortConfig.key] || 0;
            const valB = b[sortConfig.key] || 0;
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }

        // Logic mặc định cho các trường khác (string, boolean, number)
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [filteredData, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
        const data = await getPositions();
        setPositions(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Lỗi tải dữ liệu"); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLERS ---
  const handleSort = (key: keyof Position) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const renderSortIcon = (key: keyof Position) => {
    if (sortConfig?.key !== key) return <FontAwesomeIcon icon={faSort} className="text-slate-300 ml-1 h-3 w-3"/>;
    return sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="text-blue-600 ml-1 h-3 w-3"/> : <FontAwesomeIcon icon={faSortDown} className="text-blue-600 ml-1 h-3 w-3"/>;
  };

  const handleAddNew = () => {
    setIsEditing(false); setCurrentId(null);
    setFormData({ positioncode: '', name: '', status: true, bonus: null });
    setShowModal(true);
  };

  const handleEdit = (item: Position) => {
    setIsEditing(true); setCurrentId(item.positionid);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleConfirmSave = async () => {
    try {
        if (isEditing && currentId) await updatePosition(currentId, formData);
        else await createPosition(formData);
        await fetchData();
        setShowModal(false); setShowSuccessModal(true);
    } catch { alert("Lỗi lưu dữ liệu!"); }
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
        try { await deletePosition(deleteId); await fetchData(); } catch { alert("Xóa thất bại!"); }
    }
    setShowDeleteModal(false);
  };

  const handleExport = async () => { 
    try { await exportPositions(); } catch (error) { alert("Lỗi xuất Excel."); } 
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Sidebar />
      <main className="ml-64 transition-all duration-300 ease-in-out">
        <div className="p-8 max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faBriefcase} className="text-slate-600" /> Quản Lý Chức Vụ
              </h1>
              <p className="text-slate-500 mt-1">Danh mục các chức vụ (vị trí) trong hệ thống</p>
            </div>
            <Button className="bg-slate-900 text-white gap-2" onClick={handleAddNew}><FontAwesomeIcon icon={faPlus} /> Thêm Mới</Button>
          </div>

          {/* Toolbar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <Input placeholder="Tìm mã, tên chức vụ..." className="pl-9 bg-slate-50" value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>
                <Select value={filterStatus} onValueChange={(val) => {setFilterStatus(val); setCurrentPage(1);}}>
                    <SelectTrigger className="w-[160px] bg-slate-50"><div className="flex items-center gap-2"><FontAwesomeIcon icon={faFilter} className="text-slate-400 text-xs"/><SelectValue placeholder="Trạng thái" /></div></SelectTrigger>
                    <SelectContent><SelectItem value="all">Tất cả</SelectItem><SelectItem value="true">Hoạt động</SelectItem><SelectItem value="false">Ngừng hoạt động</SelectItem></SelectContent>
                </Select>
             </div>
             <Button variant="outline" className="text-slate-600 border-slate-200" onClick={handleExport}><FontAwesomeIcon icon={faFileExport} className="mr-2"/> Xuất Excel</Button>
          </div>

          {/* Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[50px] text-center font-bold text-slate-700">STT</TableHead>
                    {[
                        { key: 'positioncode', label: 'Mã CV' },
                        { key: 'name', label: 'Tên Chức Vụ' },
                        { key: 'status', label: 'Trạng Thái' },
                        { key: 'bonus', label: 'Phần trăm thưởng' }, // ✨ Cập nhật tiêu đề
                    ].map((col) => (
                        <TableHead 
                            key={col.key} 
                            className={`font-bold text-slate-700 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap ${col.key === 'status' || col.key === 'bonus' ? 'text-center' : 'text-left'}`}
                            onClick={() => handleSort(col.key as keyof Position)}
                        >
                            <div className={`flex items-center gap-1 ${col.key === 'status' || col.key === 'bonus' ? 'justify-center' : ''}`}> 
                                {col.label}{renderSortIcon(col.key as keyof Position)}
                            </div>
                        </TableHead>
                    ))}
                    <TableHead className="text-right font-bold text-slate-700 pr-6">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Không tìm thấy dữ liệu</TableCell></TableRow> : 
                  currentItems.map((item, idx) => (
                    <TableRow key={item.positionid} className="hover:bg-slate-50">
                      {/* STT */}
                      <TableCell className="text-center text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                      
                      {/* Mã CV */}
                      <TableCell><span className="text-blue-600 font-medium">{item.positioncode}</span></TableCell>
                      
                      {/* Tên CV (Căn lại text-left) */}
                      <TableCell className="text-left"><span className="font-medium text-slate-800">{item.name}</span></TableCell>
                      
                      {/* Trạng Thái (Căn giữa) */}
                      <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>

                      {/* Bonus (Căn giữa) */}
                      <TableCell className="text-center text-slate-700 font-medium whitespace-nowrap">
                          {formatPercentage(item.bonus)}
                      </TableCell>
                      
                      {/* Thao tác */}
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(item)}><FontAwesomeIcon icon={faPenToSquare} /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(item.positionid); setShowDeleteModal(true); }}><FontAwesomeIcon icon={faTrash} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Hiển thị</span>
                    <Select defaultValue="10" onValueChange={(val) => {setItemsPerPage(Number(val)); setCurrentPage(1);}}>
                        <SelectTrigger className="w-[70px] h-8 text-sm"><SelectValue placeholder="10" /></SelectTrigger>
                        <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
                    </Select>
                    <span>dòng - Tổng {sortedData.length} kết quả</span>
                </div>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}><FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3"/></Button>
                    <Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white">{currentPage}</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}><FontAwesomeIcon icon={faChevronRight} className="h-3 w-3"/></Button>
                </div>
            </div>
          </Card>
        </div>
      </main>

      <PositionModals
        showModal={showModal} setShowModal={setShowModal}
        showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal}
        showSuccessModal={showSuccessModal} setShowSuccessModal={setShowSuccessModal}
        isEditing={isEditing} formData={formData} setFormData={setFormData}
        onConfirmSave={handleConfirmSave} onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}