'use client';

import Sidebar from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faPenToSquare, faTrash, faFileExport,
  faPlus, faFilter, faFileContract, 
  faChevronLeft, faChevronRight, faSort, faSortUp, faSortDown
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo } from 'react';
import ContractModals from './modals'; 
// API Services
import { getContracts, createContract, updateContract, deleteContract, exportContracts, Contract } from '@/services/admin/contract';

// Types & Helpers
type SortDirection = 'asc' | 'desc';
interface SortConfig { key: keyof Contract; direction: SortDirection; }

export default function ContractPage() {
  // States
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 🆕 THÊM TRẠNG THÁI KIỂM TRA CLIENT SIDE MOUNT
  const [isClient, setIsClient] = useState(false);

  const [contracts, setContracts] = useState<Contract[]>([]);
  // Khởi tạo formData với các trường của Contract, status mặc định là true
  const [formData, setFormData] = useState<Partial<Contract>>({ contractcode: '', name: '', description: '', status: true }); 
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- LOGIC ---
  const filteredData = useMemo(() => {
    return contracts.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.contractcode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' ? true : 
                            filterStatus === 'active' ? item.status === true : item.status === false;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, filterStatus]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [filteredData, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: keyof Contract) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const renderSortIcon = (key: keyof Contract) => {
    if (sortConfig?.key !== key) return <FontAwesomeIcon icon={faSort} className="text-slate-300 ml-1 h-3 w-3"/>;
    return sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="text-blue-600 ml-1 h-3 w-3"/> : <FontAwesomeIcon icon={faSortDown} className="text-blue-600 ml-1 h-3 w-3"/>;
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
        const data = await getContracts();
        setContracts(Array.isArray(data) ? data : []);
    } catch (error) { console.error("Lỗi tải dữ liệu"); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { 
      // 🆕 SET TRẠNG THÁI CLIENT TẠI ĐÂY
      setIsClient(true);
      fetchData(); 
  }, []);

  // --- ACTIONS ---
  const handleAddNew = () => {
    setIsEditing(false); setCurrentId(null);
    setFormData({ contractcode: '', name: '', description: '', status: true }); // Reset form
    setShowModal(true);
  };

  const handleEdit = (item: Contract) => {
    setIsEditing(true); setCurrentId(item.contractid);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleConfirmSave = async () => {
    try {
        if (!formData.name) {
            alert("Tên hợp đồng không được để trống!");
            return;
        }

        if (isEditing && currentId) await updateContract(currentId, formData);
        else await createContract(formData);
        
        await fetchData();
        setShowModal(false); setShowSuccessModal(true);
    } catch { alert("Lỗi lưu dữ liệu! Vui lòng kiểm tra lại kết nối."); }
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
        try { 
            await deleteContract(deleteId); 
            await fetchData(); 
            setShowDeleteModal(false);
            setShowSuccessModal(true);
        } catch { 
            alert("Xóa thất bại!"); 
            setShowDeleteModal(false);
        }
    }
  };

  // --- XUẤT EXCEL ---
  const handleExport = async () => {
    try { 
        await exportContracts(); 
    } catch (error) { 
        alert("Xuất Excel thất bại. Vui lòng kiểm tra API Backend."); 
    }
  };

  // Helper render Badge trạng thái
  const getStatusBadgeRender = (status: boolean | undefined) => {
    if (status === undefined) return <span className="px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">Không xác định</span>;

    return status 
      ? <span className="px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">Đang áp dụng</span>
      : <span className="px-2 py-1 rounded-full text-xs font-medium border bg-slate-100 text-slate-500 border-slate-200">Ngừng</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Sidebar />
      <main className="ml-64 transition-all duration-300 ease-in-out">
        <div className="p-8 max-w-7xl mx-auto">
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileContract} className="text-slate-600" /> Quản Lý Hợp Đồng
              </h1>
              <p className="text-slate-500 mt-1">Danh mục các loại hợp đồng lao động.</p>
            </div>
            <Button className="bg-slate-900 text-white gap-2" onClick={handleAddNew}><FontAwesomeIcon icon={faPlus} /> Thêm Mới</Button>
          </div>

          {/* Toolbar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <Input placeholder="Tìm mã, tên hợp đồng..." className="pl-9 bg-slate-50" value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>
                <Select value={filterStatus} onValueChange={(val) => {setFilterStatus(val); setCurrentPage(1);}}>
                    <SelectTrigger className="w-[160px] bg-slate-50"><div className="flex items-center gap-2"><FontAwesomeIcon icon={faFilter} className="text-slate-400 text-xs"/><SelectValue placeholder="Trạng thái" /></div></SelectTrigger>
                    <SelectContent><SelectItem value="all">Tất cả</SelectItem><SelectItem value="active">Đang áp dụng</SelectItem><SelectItem value="inactive">Ngưng áp dụng</SelectItem></SelectContent>
                </Select>
             </div>
             <Button variant="outline" className="text-slate-600 border-slate-200" onClick={handleExport}>
                <FontAwesomeIcon icon={faFileExport} className="mr-2"/> Xuất Excel
             </Button>
          </div>

          {/* Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[50px] text-center font-bold text-slate-700">STT</TableHead>
                    {[
                        { key: 'contractcode', label: 'Mã HĐ' },
                        { key: 'name', label: 'Tên Hợp Đồng' },
                        { key: 'status', label: 'Trạng Thái' },
                        { key: 'description', label: 'Mô Tả' },
                    ].map((col) => (
                        <TableHead key={col.key} className="font-bold text-slate-700 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap" onClick={() => handleSort(col.key as keyof Contract)}>
                            <div className="flex items-center gap-1">{col.label}{renderSortIcon(col.key as keyof Contract)}</div>
                        </TableHead>
                    ))}
                    <TableHead className="text-right font-bold text-slate-700 pr-6">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Đang tải...</TableCell></TableRow> :
                  currentItems.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Không tìm thấy dữ liệu</TableCell></TableRow> : 
                  currentItems.map((item, idx) => (
                    <TableRow key={item.contractid} className="hover:bg-slate-50">
                      <TableCell className="text-center text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                      <TableCell><span className="text-blue-600 font-medium">{item.contractcode}</span></TableCell>
                      <TableCell><span className="font-medium text-slate-800">{item.name}</span></TableCell>
                      <TableCell>{getStatusBadgeRender(item.status)}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-slate-500" title={item.description || ''}>{item.description || '-'}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(item)}><FontAwesomeIcon icon={faPenToSquare} /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(item.contractid); setShowDeleteModal(true); }}><FontAwesomeIcon icon={faTrash} /></Button>
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

      {/* 🆕 CHỈ RENDER MODAL KHI CHẮC CHẮN TRÊN CLIENT */}
      {isClient && (
          <ContractModals
            showModal={showModal} setShowModal={setShowModal}
            showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal}
            showSuccessModal={showSuccessModal} setShowSuccessModal={setShowSuccessModal}
            isEditing={isEditing} formData={formData} setFormData={setFormData}
            onConfirmSave={handleConfirmSave} onConfirmDelete={handleConfirmDelete}
          />
      )}
    </div>
  );
}