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
  faPlus, faFilter, faUserTie, faDownload, faEye,
  faChevronLeft, faChevronRight, faSort, faSortUp, faSortDown, faChevronDown, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo, useRef } from 'react';
import CandidateModals from './modals';
import { supabase } from '@/lib/supabase';
import api from '@/lib/axios';

// API Services
import { getCandidates, createCandidate, updateCandidate, deleteCandidate, CandidatePayload } from '@/services/admin/candidate';
import { getDepartments, Department } from '@/services/admin/department';
import { getJobTitles, JobTitle } from '@/services/admin/jobtitle';

// --- SEARCHABLE SELECT COMPONENT (Dropdown có ô tìm kiếm) ---
interface SearchableSelectProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableSelect = ({ options, value, onChange, placeholder, disabled }: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder || "Chọn...";

  return (
    <div className="relative w-full sm:w-[200px]" ref={wrapperRef}>
      <div
        className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md bg-white cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedLabel}</span>
        <FontAwesomeIcon icon={faChevronDown} className="text-xs text-slate-400" />
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b">
            <input type="text" className="w-full px-2 py-1 text-sm border rounded outline-none focus:border-blue-500" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div key={opt.value} className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${value === opt.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`} onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(''); }}>
                  {opt.label} {value === opt.value && <FontAwesomeIcon icon={faCheck} className="text-xs" />}
                </div>
              ))
            ) : <div className="px-3 py-2 text-sm text-gray-400 text-center">Không tìm thấy</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// --- TYPES & HELPERS ---
interface Candidate {
  candidateid: number;
  candidatecode: string;
  name: string;
  // email, phonenumber đã bỏ khỏi hiển thị bảng
  jobtitleid: number;
  departmentid: number;
  submissiondate: string;
  status: number;
  skill: string;
  cv_file: string;
  // Các field khác nếu cần
  email?: string;
  phonenumber?: string;
  note?: string;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: keyof Candidate;
  direction: SortDirection;
}

const getStatusBadge = (status: number) => {
  switch (Number(status)) {
    case 1: return <span className="px-2 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-700 border-blue-200">Đã gửi CV</span>;
    case 2: return <span className="px-2 py-1 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-700 border-yellow-200">Đang xử lý</span>;
    case 3: return <span className="px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">Được tuyển</span>;
    case 4: return <span className="px-2 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-200">Rớt tuyển</span>;
    default: return <Badge variant="outline">---</Badge>;
  }
};

const formatDate = (dateString: any) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function CandidatePage() {
  // --- STATES ---
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // Data
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);

  // Filter & Search & Sort & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'status' | 'department' | 'jobtitle'>('all');
  const [filterValue, setFilterValue] = useState<string>('');
  
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form (Đã bỏ email, phone)
  const [formData, setFormData] = useState({ 
    candidatecode: '', name: '', jobtitleid: '', departmentid: '', 
    submissiondate: '', status: '1', skill: '' 
  });
  const [viewData, setViewData] = useState<any>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');

  // Helpers lấy tên từ ID
  const getJobName = (id: any) => jobTitles.find(j => j.jobtitleid == id)?.name || id;
  const getDeptName = (id: any) => departments.find(d => d.departmentid == id)?.name || id;

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [candidatesData, depsData, jobsData] = await Promise.all([
        getCandidates(), getDepartments(), getJobTitles()
      ]);
      setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      setDepartments(Array.isArray(depsData) ? depsData : []);
      setJobTitles(Array.isArray(jobsData) ? jobsData : []);
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC LỌC & SẮP XẾP ---
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      // 1. Tìm kiếm
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        c.name?.toLowerCase().includes(searchLower) || 
        c.candidatecode?.toLowerCase().includes(searchLower);

      // 2. Lọc theo loại
      let matchesFilter = true;
      if (filterType === 'status' && filterValue) matchesFilter = c.status.toString() === filterValue;
      else if (filterType === 'department' && filterValue) matchesFilter = c.departmentid.toString() === filterValue;
      else if (filterType === 'jobtitle' && filterValue) matchesFilter = c.jobtitleid.toString() === filterValue;

      return matchesSearch && matchesFilter;
    });
  }, [candidates, searchTerm, filterType, filterValue]);

  const sortedCandidates = useMemo(() => {
    if (!sortConfig) return filteredCandidates;
    return [...filteredCandidates].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Xử lý sort đặc biệt cho cột ID (hiển thị tên)
      if (sortConfig.key === 'jobtitleid') { aValue = getJobName(aValue); bValue = getJobName(bValue); }
      else if (sortConfig.key === 'departmentid') { aValue = getDeptName(aValue); bValue = getDeptName(bValue); }

      // Handle nulls
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCandidates, sortConfig, departments, jobTitles]);

  // --- PHÂN TRANG ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = sortedCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedCandidates.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- HANDLERS ---
  const handleSort = (key: keyof Candidate) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof Candidate) => {
    if (sortConfig?.key !== key) return <FontAwesomeIcon icon={faSort} className="text-slate-300 ml-1 h-3 w-3" />;
    return sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="text-blue-600 ml-1 h-3 w-3" /> : <FontAwesomeIcon icon={faSortDown} className="text-blue-600 ml-1 h-3 w-3" />;
  };

  const handleAddNewClick = () => {
    setIsEditing(false); setCurrentId(null);
    setFormData({ candidatecode: '', name: '', jobtitleid: '', departmentid: '', submissiondate: '', status: '1', skill: '' });
    setAttachedFile(null); setExistingFileUrl(''); setShowModal(true);
  };

  const handleEditClick = (c: any) => {
    setIsEditing(true); setCurrentId(c.candidateid);
    setFormData({
      candidatecode: c.candidatecode, name: c.name, 
      jobtitleid: c.jobtitleid?.toString() || '', departmentid: c.departmentid?.toString() || '',
      submissiondate: c.submissiondate, status: c.status?.toString() || '1', skill: c.skill || '',
    });
    setExistingFileUrl(c.cv_file || ''); setAttachedFile(null); setShowModal(true);
  };

  const handleViewClick = (c: any) => { setViewData(c); setShowViewModal(true); };

  const uploadFileToSupabase = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cv/cv_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('recruitment-files').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('recruitment-files').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) { console.error('Upload CV lỗi:', error); return null; }
  };

  const handleConfirmSave = async () => {
    try {
      let fileUrl = existingFileUrl;
      if (attachedFile) {
        const url = await uploadFileToSupabase(attachedFile);
        if (url) fileUrl = url;
      }
      
      const payload: CandidatePayload = {
        name: formData.name,
        jobtitleid: formData.jobtitleid,
        departmentid: formData.departmentid,
        submissiondate: formData.submissiondate,
        status: formData.status,
        skill: formData.skill,
        cv_file: fileUrl || null,
        // Không gửi email/phone vì form không có input
      };

      if (isEditing && currentId) await updateCandidate(currentId, payload);
      else await createCandidate(payload);
      
      await fetchData(); setShowModal(false); setShowSuccessModal(true);
    } catch (error) { alert("Lỗi lưu dữ liệu!"); }
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try { await deleteCandidate(deleteId); await fetchData(); } catch { alert("Xóa thất bại!"); }
    }
    setShowDeleteModal(false);
  };

  // --- XUẤT EXCEL ---
  const handleExportExcel = async () => {
    try {
      const response = await api.get('/candidates/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DanhSachUngVien.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) { console.error("Lỗi xuất Excel"); alert("Lỗi xuất file Excel."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Sidebar />
      <main className="ml-64 transition-all duration-300 ease-in-out">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><FontAwesomeIcon icon={faUserTie} className="text-slate-600" /> Hồ Sơ Ứng Viên</h1>
              <p className="text-slate-500 mt-1">Quản lý và theo dõi thông tin ứng viên</p>
            </div>
            <Button className="bg-slate-900 text-white gap-2" onClick={handleAddNewClick}><FontAwesomeIcon icon={faPlus} /> Thêm Ứng Viên</Button>
          </div>

          {/* FILTER BAR */}
          <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center mb-6 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
             <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
               
               {/* Search */}
               <div className="relative w-full sm:w-64">
                  <Input placeholder="Tìm tên, mã UV..." className="pl-9 bg-white border-slate-200" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
               </div>

               {/* Filters */}
               <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={filterType} onValueChange={(val: any) => { setFilterType(val); setFilterValue(''); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[150px] bg-slate-50">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-slate-500 text-xs"/>
                            <SelectValue placeholder="Lọc theo..." />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="status">Trạng thái</SelectItem>
                        <SelectItem value="department">Phòng ban</SelectItem>
                        <SelectItem value="jobtitle">Vị trí</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filter Values */}
                  {filterType !== 'all' && (
                      <SearchableSelect 
                        placeholder={
                            filterType === 'status' ? 'Chọn trạng thái...' : 
                            filterType === 'department' ? 'Chọn phòng ban...' : 'Chọn vị trí...'
                        }
                        value={filterValue}
                        onChange={(val) => { setFilterValue(val); setCurrentPage(1); }}
                        options={
                            filterType === 'status' ? [
                                { label: 'Đã gửi CV', value: '1' }, { label: 'Đang xử lý', value: '2' }, 
                                { label: 'Được tuyển', value: '3' }, { label: 'Rớt tuyển', value: '4' }
                            ] :
                            filterType === 'department' ? departments.map(d => ({ label: d.name, value: d.departmentid.toString() })) :
                            filterType === 'jobtitle' ? jobTitles.map(j => ({ label: j.name, value: j.jobtitleid.toString() })) : []
                        }
                      />
                  )}
               </div>
             </div>
             
             {/* Export Button */}
             <Button variant="outline" className="gap-2 text-slate-600 bg-white border-slate-200 hover:bg-slate-50" onClick={handleExportExcel}>
                <FontAwesomeIcon icon={faFileExport} /> Xuất Excel
             </Button>
          </div>

          {/* TABLE */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[50px]">STT</TableHead>
                    
                    {[
                        { key: 'candidatecode', label: 'Mã UV' },
                        { key: 'name', label: 'Họ và Tên' },
                        { key: 'jobtitleid', label: 'Vị trí' },
                        { key: 'departmentid', label: 'Phòng ban' },
                        { key: 'submissiondate', label: 'Ngày nộp' },
                        { key: 'status', label: 'Trạng thái' },
                    ].map((col) => (
                        <TableHead 
                            key={col.key} 
                            className="font-bold text-slate-700 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap" 
                            onClick={() => handleSort(col.key as keyof Candidate)}
                        >
                            <div className="flex items-center gap-1">{col.label}{renderSortIcon(col.key as keyof Candidate)}</div>
                        </TableHead>
                    ))}

                    <TableHead className="text-center font-bold text-slate-700">CV</TableHead>
                    <TableHead className="text-right font-bold text-slate-700 pr-6">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (<TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Đang tải dữ liệu...</TableCell></TableRow>) : 
                   currentCandidates.length === 0 ? (<TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Không tìm thấy dữ liệu</TableCell></TableRow>) : (
                    currentCandidates.map((c, idx) => (
                      <TableRow key={c.candidateid} className="hover:bg-slate-50">
                        <TableCell className="text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                        <TableCell><span className="text-blue-600 font-medium">{c.candidatecode}</span></TableCell>
                        <TableCell><span className="font-medium text-slate-800">{c.name}</span></TableCell>
                        <TableCell>{getJobName(c.jobtitleid)}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal bg-slate-100 text-slate-600 border-slate-200">{getDeptName(c.departmentid)}</Badge></TableCell>
                        <TableCell className="text-sm text-slate-500">{formatDate(c.submissiondate)}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-center">
                          {c.cv_file ? (<a href={c.cv_file} target="_blank" className="text-blue-500"><FontAwesomeIcon icon={faDownload} /></a>) : <span className="text-gray-300">-</span>}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-600 hover:bg-teal-50" onClick={() => handleViewClick(c)}><FontAwesomeIcon icon={faEye} /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(c)}><FontAwesomeIcon icon={faPenToSquare} /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(c.candidateid); setShowDeleteModal(true); }}><FontAwesomeIcon icon={faTrash} /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* PAGINATION */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Hiển thị</span>
                    <Select defaultValue="10" onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[70px] h-8 bg-white border-slate-200"><SelectValue placeholder="10" /></SelectTrigger>
                        <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
                    </Select>
                    <span>dòng / trang</span>
                </div>
                {sortedCandidates.length > 0 && (
                  <div className="flex items-center gap-4">
                      <div className="text-sm text-slate-500">
                          Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedCandidates.length)}</strong> của <strong>{sortedCandidates.length}</strong>
                      </div>
                      <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8 bg-white" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}><FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" /></Button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                             <Button key={number} variant={currentPage === number ? "default" : "outline"} size="icon" className={`h-8 w-8 ${currentPage === number ? 'bg-slate-900 text-white' : 'bg-white'}`} onClick={() => paginate(number)}>{number}</Button>
                          ))}
                          <Button variant="outline" size="icon" className="h-8 w-8 bg-white" disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)}><FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" /></Button>
                      </div>
                  </div>
                )}
            </div>
          </Card>
        </div>
      </main>

      <CandidateModals
        showModal={showModal} setShowModal={setShowModal}
        showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal}
        showSuccessModal={showSuccessModal} setShowSuccessModal={setShowSuccessModal}
        showViewModal={showViewModal} setShowViewModal={setShowViewModal} 
        viewData={viewData} 
        isEditing={isEditing} formData={formData} setFormData={setFormData}
        jobTitles={jobTitles} departments={departments}
        attachedFile={attachedFile} setAttachedFile={setAttachedFile} existingFileUrl={existingFileUrl}
        onConfirmSave={handleConfirmSave} onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}