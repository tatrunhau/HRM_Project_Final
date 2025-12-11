// src/app/dashboard/admin/regime/document/page.tsx (hoặc StateDocumentPage.tsx)

'use client';

import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faPenToSquare, faTrash, faFileExport,
  faPaperclip, faPlus, faFilter, faLayerGroup,
  faChevronLeft, faChevronRight, faCircleCheck, faRotateLeft,
  faSort, faSortUp, faSortDown, faBookOpen
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo } from 'react';

// SỬ DỤNG COMPONENT MODAL MỚI TRONG CÙNG THƯ MỤC
import DocumentModals from './modals'; 

import api from '@/lib/axios'; // Import axios instance để gọi API export
import { supabase } from '@/lib/supabase'; // Tái sử dụng Supabase cho việc upload file

import { 
  getStateDocuments, 
  createStateDocument, 
  updateStateDocument, 
  deleteStateDocument,
  StateDocumentPayload 
} from '@/services/admin/stateDocument'; // Import logic API đã tạo


// --- INTERFACE DỮ LIỆU ---
interface StateDocument {
  id: number;
  documentCode: string; // Số VB
  name: string; // Tên/Tiêu đề
  type: string; // Loại VB
  description: string; // Trích yếu
  createdDate: string;
  hasFile: boolean;
  fileUrl?: string;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: keyof StateDocument;
  direction: SortDirection;
}

// Danh sách các loại văn bản (dùng cho Select)
const DOCUMENT_TYPES = [
    { value: 'nghi-dinh', label: 'Nghị Định' },
    { value: 'thong-tu', label: 'Thông Tư' },
    { value: 'quyet-dinh', label: 'Quyết Định' },
    { value: 'cong-van', label: 'Công Văn' },
    { value: 'khac', label: 'Khác' },
];


export default function StateDocumentPage() {
  // --- STATE ---
  const [showFileModal, setShowFileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false); // Chưa dùng, nhưng giữ lại cho đầy đủ

  const [documents, setDocuments] = useState<StateDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'type'>('all');
  const [filterValue, setFilterValue] = useState<string>('');

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    documentCode: '', name: '', type: '', description: '',
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // --- HELPER FUNCTIONS ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(date);
  };
  const getTypeName = (value: string) => DOCUMENT_TYPES.find(t => t.value === value)?.label || value;


  // --- FETCH DATA, SORT, FILTER LOGIC ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const docsData = await getStateDocuments();
      if (Array.isArray(docsData)) {
        setDocuments(docsData.map((item: any) => ({
          // Đảm bảo các key trùng khớp với response từ StateDocumentController.js
          id: item.documentid, // Sử dụng documentid từ DB
          documentCode: item.documentcode, 
          name: item.name, 
          type: item.type, 
          description: item.description,
          createdDate: item.createddate,
          hasFile: !!item.filepath, // Dùng 'filepath'
          fileUrl: item.filepath
        })));
      } else { setDocuments([]); }
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); } finally { setIsLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.documentCode.toLowerCase().includes(searchTerm.toLowerCase()) 
                          || doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) 
                          || doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesFilter = true;
      if (filterType === 'type' && filterValue) matchesFilter = doc.type === filterValue;
      return matchesSearch && matchesFilter;
    });
  }, [documents, searchTerm, filterType, filterValue]);

  const sortedDocuments = useMemo(() => {
    if (!sortConfig) return filteredDocuments;
    return [...filteredDocuments].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      if (sortConfig.key === 'type') { aValue = getTypeName(a.type); bValue = getTypeName(b.type); } 
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDocuments, sortConfig]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDocuments = sortedDocuments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleSort = (key: keyof StateDocument) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const renderSortIcon = (key: keyof StateDocument) => {
    if (sortConfig?.key !== key) return <FontAwesomeIcon icon={faSort} className="text-slate-300 ml-1 h-3 w-3" />;
    return sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="text-blue-600 ml-1 h-3 w-3" /> : <FontAwesomeIcon icon={faSortDown} className="text-blue-600 ml-1 h-3 w-3" />;
  };


  // --- UPLOAD & HANDLER ---
  const uploadFileToSupabase = async (file: File) => {
    try {
      // Đổi bucket thành 'document-files' (Đảm bảo bucket này đã được tạo trên Supabase)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('document-files').upload(fileName, file);
      if (error) throw error;
      
      // Lấy URL công khai
      const { data: publicUrlData } = supabase.storage.from('document-files').getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (error) { console.error('Upload lỗi:', error); throw error; }
  };

  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleReceiveFile = (file: File) => { 
      setAttachedFile(file); 
      setExistingFileUrl(''); // Xóa URL cũ nếu chọn file mới
      setShowFileModal(false); 
  };
  
  const handleConfirmSave = async () => {
    // Basic validation
    if (!formData.documentCode || !formData.name || !formData.type) {
        alert("Vui lòng điền đầy đủ Số văn bản, Tên/Tiêu đề và Loại văn bản.");
        setShowSaveModal(false);
        return;
    }

    try {
      let finalFileUrl = existingFileUrl;

      // Chỉ upload nếu có file mới được chọn (attachedFile)
      if (attachedFile) {
          alert("Đang tải file lên...");
          finalFileUrl = await uploadFileToSupabase(attachedFile);
      }
      
      const payload: StateDocumentPayload = {
        documentCode: formData.documentCode, name: formData.name, type: formData.type,
        description: formData.description, file_url: finalFileUrl || null
      };

      if (isEditing && currentId) await updateStateDocument(currentId, payload);
      else await createStateDocument(payload);
      
      await fetchData(); 
      setShowSaveModal(false); // Đóng modal save
      setShowSuccessModal(true); // Hiển thị modal thành công
      handleResetForm();
    } catch (error) { 
        console.error("Lỗi lưu dữ liệu:", error);
        alert("Lỗi lưu dữ liệu! Vui lòng kiểm tra console."); 
        setShowSaveModal(false);
    } 
  };

  const handleEditClick = (doc: StateDocument) => {
    setIsEditing(true); setCurrentId(doc.id);
    setFormData({
      documentCode: doc.documentCode, name: doc.name, type: doc.type, description: doc.description
    });
    setExistingFileUrl(doc.fileUrl || ''); // Giữ lại URL file cũ
    setAttachedFile(null); // Không có file mới nào được chọn
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleResetForm = () => {
    setIsEditing(false); setCurrentId(null);
    setFormData({ documentCode: '', name: '', type: '', description: '' });
    setAttachedFile(null); setExistingFileUrl('');
  };
  
  const handleDeleteClick = (id: number) => { setDeleteId(id); setShowDeleteModal(true); };
  
  const handleConfirmDelete = async () => {
    if (deleteId) { 
      try { 
        await deleteStateDocument(deleteId); 
        await fetchData(); 
        setShowDeleteModal(false);
        setShowSuccessModal(true); 
      } catch (error) { 
        console.error("Lỗi xóa:", error);
        alert("Xóa thất bại!"); 
        setShowDeleteModal(false);
      } 
    }
  };

  // --- HÀM XUẤT EXCEL ---
  const handleExportExcel = async () => {
    try {
      // Gọi API mới: /api/state-documents/export
      const response = await api.get('/state-documents/export', {
        responseType: 'blob', // Quan trọng: Nhận response dưới dạng file binary
      });
      
      // Tạo URL tạm thời cho file blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DanhSachVanBanNhaNuoc.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Giải phóng URL tạm thời
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      alert("Không thể xuất file Excel.");
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Sidebar />
      <main className="ml-64 transition-all duration-300 ease-in-out">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản Lý Văn Bản Nhà Nước</h1>
              <p className="text-slate-500 mt-1">Lưu trữ và theo dõi các văn bản, nghị định, thông tư...</p>
            </div>
          </div>

          {/* FORM NHẬP LIỆU */}
          <Card className={`mb-8 shadow-sm bg-white border-t-4 transition-colors ${isEditing ? 'border-t-orange-500' : 'border-t-slate-900'}`}>
             {/* Header Card */}
             <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                    <div className={`${isEditing ? 'bg-orange-500' : 'bg-slate-900'} text-white p-2 rounded-md`}>
                        <FontAwesomeIcon icon={isEditing ? faPenToSquare : faBookOpen} className="h-4 w-4" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Cập Nhật Văn Bản' : 'Tạo Văn Bản Mới'}</h3>
                </div>
             </div>
             
             <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Số văn bản <span className="text-red-500">*</span></label>
                                <Input placeholder="VD: 12/2024/NĐ-CP" className="bg-slate-50" value={formData.documentCode} onChange={(e) => handleInputChange('documentCode', e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Tên/Tiêu đề văn bản <span className="text-red-500">*</span></label>
                                <Input placeholder="VD: Nghị định về quản lý tuyển dụng..." className="bg-slate-50" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Trích yếu nội dung</label>
                                <textarea className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white resize-none" placeholder="Mô tả tóm tắt nội dung văn bản..." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold border-b border-slate-200 pb-2">
                                <FontAwesomeIcon icon={faLayerGroup} className="text-slate-500" /> Phân loại
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-slate-500">Loại văn bản <span className="text-red-500">*</span></label>
                                <Select value={formData.type} onValueChange={(val) => handleInputChange('type', val)}>
                                    <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Chọn loại..." /></SelectTrigger>
                                    <SelectContent>
                                        {DOCUMENT_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button type="button" variant="outline" onClick={() => setShowFileModal(true)} className={`w-full border-dashed border-2 h-12 ${(attachedFile || existingFileUrl) ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-300 text-slate-600'}`}>
                            {(attachedFile || existingFileUrl) ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-2" /><span>{attachedFile ? `Đã chọn file: ${attachedFile.name.substring(0, 20)}...` : 'Đã có file đính kèm'}</span></> : <><FontAwesomeIcon icon={faPaperclip} className="mr-2" /><span>Đính kèm file (PDF)</span></>}
                        </Button>
                    </div>
                </div>
                <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                    <Button variant="ghost" onClick={() => handleResetForm()}>{isEditing && <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />}{isEditing ? 'Hủy chỉnh sửa' : 'Hủy bỏ'}</Button>
                    <Button className={`${isEditing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-900 hover:bg-slate-800'} text-white min-w-[140px]`} onClick={() => setShowSaveModal(true)}>
                        <FontAwesomeIcon icon={isEditing ? faPenToSquare : faPlus} className="mr-2" />{isEditing ? 'Cập nhật' : 'Lưu văn bản'}
                    </Button>
                </div>
             </CardContent>
          </Card>

          {/* SEARCH & FILTER */}
          <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center mb-6 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
             <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
               <div className="relative w-full sm:w-64">
                  <Input placeholder="Tìm kiếm theo mã, tên, trích yếu..." className="pl-9 bg-white border-slate-200" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
               </div>
               <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={filterType} onValueChange={(val: any) => { setFilterType(val); setFilterValue(''); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[160px] bg-slate-50">
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-slate-500 text-xs"/>
                            <SelectValue placeholder="Lọc theo..." />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem><SelectItem value="type">Loại văn bản</SelectItem>
                    </SelectContent>
                  </Select>
                  {filterType === 'type' && (
                      <Select value={filterValue} onValueChange={(val) => { setFilterValue(val); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[180px] bg-slate-50">
                            <SelectValue placeholder="Chọn loại văn bản..." />
                        </SelectTrigger>
                        <SelectContent>
                            {DOCUMENT_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                  )}
               </div>
             </div>
             {/* NÚT XUẤT EXCEL - GỌI HÀM handleExportExcel */}
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
                      <TableHead className="w-[50px] font-bold text-slate-700">STT</TableHead>
                      {[
                        { key: 'documentCode', label: 'Số VB' }, { key: 'name', label: 'Tên/Tiêu đề' },
                        { key: 'type', label: 'Loại VB' }, { key: 'description', label: 'Trích yếu' },
                        { key: 'createdDate', label: 'Ngày Tạo' }
                      ].map((col) => (
                        <TableHead key={col.key} className="font-bold text-slate-700 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort(col.key as keyof StateDocument)}>
                            <div className="flex items-center gap-1">{col.label}{renderSortIcon(col.key as keyof StateDocument)}</div>
                        </TableHead>
                      ))}
                      <TableHead className="font-bold text-slate-700 text-center">File</TableHead>
                      <TableHead className="text-right font-bold text-slate-700 pr-6">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (<TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-500">Đang tải dữ liệu...</TableCell></TableRow>) : 
                    currentDocuments.length === 0 ? (<TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-400">Không có dữ liệu nào</TableCell></TableRow>) : (
                        currentDocuments.map((doc, idx) => (
                        <TableRow key={doc.id} className={`hover:bg-slate-50 ${isEditing && currentId === doc.id ? 'bg-orange-50' : ''}`}>
                            <TableCell className="font-medium text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                            <TableCell><span className="font-medium text-blue-600">{doc.documentCode}</span></TableCell>
                            <TableCell className="max-w-[250px] truncate" title={doc.name}>{doc.name}</TableCell>
                            <TableCell>{getTypeName(doc.type)}</TableCell>
                            <TableCell className="max-w-[300px] truncate text-slate-500" title={doc.description}>{doc.description}</TableCell>
                            <TableCell className="text-sm text-slate-500 whitespace-nowrap">{formatDate(doc.createdDate)}</TableCell>
                            <TableCell className="text-center">
                                {doc.hasFile && (
                                    <a href={doc.fileUrl} target="_blank" className="text-blue-500 hover:text-blue-700 transition-colors" title="Xem File Đính Kèm">
                                        <FontAwesomeIcon icon={faPaperclip} />
                                    </a>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => handleEditClick(doc)}><FontAwesomeIcon icon={faPenToSquare} /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={() => handleDeleteClick(doc.id)}><FontAwesomeIcon icon={faTrash} /></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
            </div>
            {/* Pagination */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Hiển thị</span>
                    <Select defaultValue="10" onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[70px] h-8 bg-white border-slate-200"><SelectValue placeholder="10" /></SelectTrigger>
                        <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
                    </Select>
                    <span>dòng / trang</span>
                </div>
                {sortedDocuments.length > 0 && (
                  <div className="flex items-center gap-4">
                      <div className="text-sm text-slate-500">
                          Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedDocuments.length)}</strong> của <strong>{sortedDocuments.length}</strong>
                      </div>
                      <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8 bg-white" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}><FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" /></Button>
                          {/* Render pagination buttons */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                             <Button key={number} variant={currentPage === number ? "default" : "outline"} size="icon" className={`h-8 w-8 ${currentPage === number ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white hover:bg-slate-100'}`} onClick={() => paginate(number)}>{number}</Button>
                          ))}
                          <Button variant="outline" size="icon" className="h-8 w-8 bg-white" disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)}><FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" /></Button>
                      </div>
                  </div>
                )}
            </div>
          </Card>
        </div>
      </main>
      
      {/* GỌI COMPONENT MODAL MỚI ĐÃ TẠO RIÊNG */}
      <DocumentModals 
        showFileModal={showFileModal} 
        setShowFileModal={setShowFileModal} 
        showDeleteModal={showDeleteModal} 
        setShowDeleteModal={setShowDeleteModal} 
        showSaveModal={showSaveModal} 
        setShowSaveModal={setShowSaveModal} 
        showSuccessModal={showSuccessModal} 
        setShowSuccessModal={setShowSuccessModal} 
        showCancelModal={showCancelModal} 
        setShowCancelModal={setShowCancelModal} 
        onConfirmUpload={handleReceiveFile} 
        onConfirmSave={handleConfirmSave} 
        onConfirmDelete={handleConfirmDelete} 
      />
    </div>
  );
}