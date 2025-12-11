'use client';

import Sidebar from '@/components/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faPenToSquare, faTrash, faFileExport,
  faPaperclip, faPlus, faFilter, faCalendarDays, faLayerGroup,
  faChevronLeft, faChevronRight, faCircleCheck, faRotateLeft,
  faSort, faSortUp, faSortDown, faChevronDown, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './modals';

import { supabase } from '@/lib/supabase';
import { 
  getRecruitmentPlans, 
  createRecruitmentPlan, 
  updateRecruitmentPlan, 
  deleteRecruitmentPlan,
  RecruitmentPlanPayload 
} from '@/services/admin/recruitmentplan';

import { getDepartments, Department } from '@/services/admin/department';
import { getEmployees, Employee } from '@/services/admin/employee';
import api from '@/lib/axios'; // Import axios instance để gọi API export

// --- COMPONENT: SEARCHABLE SELECT ---
interface SearchableSelectProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  width?: string;
}

const SearchableSelect = ({ options, value, onChange, placeholder, disabled, width = "w-full" }: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder || "Chọn...";

  return (
    <div className={`relative ${width}`} ref={wrapperRef}>
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
            <input
              type="text"
              className="w-full px-2 py-1 text-sm border rounded outline-none focus:border-blue-500"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${value === opt.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {opt.label}
                  {value === opt.value && <FontAwesomeIcon icon={faCheck} className="text-xs" />}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400 text-center">Không tìm thấy</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ... INTERFACES ...
interface Plan {
  id: number;
  planNumber: string;
  signer: string;
  department: string;
  issueDate: string;
  effectiveDate: string;
  endDate: string;
  abstract: string;
  location: string;
  hasFile: boolean;
  fileUrl?: string;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: keyof Plan;
  direction: SortDirection;
}

export default function RecruitmentPlanPage() {
  const [showFileModal, setShowFileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'signer' | 'department'>('all');
  const [filterValue, setFilterValue] = useState<string>('');

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    planNumber: '', signer: '', department: '', issueDate: '', effectiveDate: '', endDate: '', abstract: '', location: ''
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ... HELPERS ...
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(date);
  };
  const getDepartmentName = (id: string) => departments.find(d => d.departmentid.toString() === id)?.name || id;
  const getEmployeeName = (id: string) => employees.find(e => e.employeeid.toString() === id)?.name || id;

  // ... FETCH DATA ...
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansData, depsData, empsData] = await Promise.all([
        getRecruitmentPlans(), getDepartments(), getEmployees()
      ]);
      setDepartments(depsData || []);
      setEmployees(empsData || []);
      if (Array.isArray(plansData)) {
        setPlans(plansData.map((item: any) => ({
          id: item.recruitmentplanid,
          planNumber: item.plannumber,
          signer: item.employeeid ? item.employeeid.toString() : '',
          department: item.departmentid ? item.departmentid.toString() : '',
          issueDate: item.issuedate,
          effectiveDate: item.effectivedate,
          endDate: item.enddate,
          abstract: item.abstract,
          location: item.receivinglocation,
          hasFile: !!item.linkfile,
          fileUrl: item.linkfile
        })));
      } else { setPlans([]); }
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); } finally { setIsLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  // ... SORT & FILTER LOGIC ...
  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const matchesSearch = plan.planNumber.toLowerCase().includes(searchTerm.toLowerCase()) || plan.abstract?.toLowerCase().includes(searchTerm.toLowerCase()) || plan.location?.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesFilter = true;
      if (filterType === 'signer' && filterValue) matchesFilter = plan.signer === filterValue;
      else if (filterType === 'department' && filterValue) matchesFilter = plan.department === filterValue;
      return matchesSearch && matchesFilter;
    });
  }, [plans, searchTerm, filterType, filterValue]);

  const sortedPlans = useMemo(() => {
    if (!sortConfig) return filteredPlans;
    return [...filteredPlans].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (aValue == null) aValue = '';
      if (bValue == null) bValue = '';
      if (sortConfig.key === 'signer') { aValue = getEmployeeName(a.signer); bValue = getEmployeeName(b.signer); } 
      else if (sortConfig.key === 'department') { aValue = getDepartmentName(a.department); bValue = getDepartmentName(b.department); }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPlans, sortConfig, departments, employees]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPlans = sortedPlans.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedPlans.length / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleSort = (key: keyof Plan) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const renderSortIcon = (key: keyof Plan) => {
    if (sortConfig?.key !== key) return <FontAwesomeIcon icon={faSort} className="text-slate-300 ml-1 h-3 w-3" />;
    return sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="text-blue-600 ml-1 h-3 w-3" /> : <FontAwesomeIcon icon={faSortDown} className="text-blue-600 ml-1 h-3 w-3" />;
  };

  // ... HANDLERS ...
  const uploadFileToSupabase = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error } = await supabase.storage.from('recruitment-files').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('recruitment-files').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) { console.error('Upload lỗi:', error); throw error; }
  };

  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleReceiveFile = (file: File) => { setAttachedFile(file); setShowFileModal(false); };
  
  const validateForm = () => {
    const missingFields: string[] = [];

    // 1. Kiểm tra dữ liệu rỗng (như cũ)
    if (!formData.planNumber.trim()) missingFields.push('Số kế hoạch');
    if (!formData.department) missingFields.push('Bộ phận tham mưu');
    if (!formData.signer) missingFields.push('Người ký duyệt');
    if (!formData.issueDate) missingFields.push('Ngày ban hành');
    if (!formData.effectiveDate) missingFields.push('Ngày hiệu lực');
    if (!formData.endDate) missingFields.push('Ngày kết thúc');
    if (!formData.abstract.trim()) missingFields.push('Trích yếu nội dung');
    
    if (missingFields.length > 0) {
      alert(`Vui lòng nhập đầy đủ các thông tin sau:\n- ${missingFields.join('\n- ')}`);
      return false;
    }

    // 2. Kiểm tra Logic ngày tháng (MỚI)
    const issueDate = new Date(formData.issueDate);
    const effectiveDate = new Date(formData.effectiveDate);
    const endDate = new Date(formData.endDate);

    // Rule 1: Ngày hiệu lực không được nhỏ hơn Ngày ban hành
    // (Tức là phải ban hành xong hoặc ban hành cùng ngày thì mới có hiệu lực)
    if (effectiveDate < issueDate) {
      alert("Ngày hiệu lực phải lớn hơn hoặc bằng Ngày ban hành.");
      return false;
    }

    // Rule 2: Ngày kết thúc phải lớn hơn Ngày hiệu lực
    // (Tức là phải bắt đầu rồi mới kết thúc được)
    if (endDate <= effectiveDate) {
      alert("Ngày kết thúc phải lớn hơn Ngày hiệu lực.");
      return false;
    }

    return true; // Tất cả hợp lệ
  };

  // --- HÀM SAVE ĐÃ ĐƯỢC CHỈNH SỬA ---
  const handleConfirmSave = async () => {
    // 1. GỌI HÀM VALIDATE NGAY ĐẦU TIÊN
    // Nếu thiếu dữ liệu -> Dừng lại ngay, không làm gì cả
    if (!validateForm()) {
        // validateForm đã tự alert rồi, nên ở đây chỉ cần return
        return; 
    }

    // 2. Nếu đủ dữ liệu thì mới chạy tiếp đoạn dưới này
    try {
      let finalFileUrl = existingFileUrl;
      if (attachedFile) finalFileUrl = await uploadFileToSupabase(attachedFile);
      
      const payload: RecruitmentPlanPayload = {
        planNumber: formData.planNumber, 
        signer: formData.signer, 
        department: formData.department,
        issueDate: formData.issueDate, 
        effectiveDate: formData.effectiveDate, 
        endDate: formData.endDate,
        abstract: formData.abstract, 
        location: formData.location, 
        file_url: finalFileUrl || null
      };

      if (isEditing && currentId) await updateRecruitmentPlan(currentId, payload);
      else await createRecruitmentPlan(payload);

      await fetchData(); 
      setShowSuccessModal(true); 
      handleResetForm();
      
      // Đóng modal save khi thành công
      setShowSaveModal(false); 

    } catch (error: any) { 
        console.error("Lỗi lưu dữ liệu:", error);
        // Alert lỗi hệ thống (nếu có lỗi lạ khác ngoài việc thiếu dữ liệu)
        alert("Đã xảy ra lỗi khi lưu. Vui lòng thử lại!");
    } 
  };

  const handleEditClick = (plan: Plan) => {
    setIsEditing(true); setCurrentId(plan.id);
    setFormData({
      planNumber: plan.planNumber, signer: plan.signer, department: plan.department,
      issueDate: plan.issueDate, effectiveDate: plan.effectiveDate, endDate: plan.endDate,
      abstract: plan.abstract, location: plan.location
    });
    setExistingFileUrl(plan.fileUrl || ''); setAttachedFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleResetForm = () => {
    setIsEditing(false); setCurrentId(null);
    setFormData({ planNumber: '', signer: '', department: '', issueDate: '', effectiveDate: '', endDate: '', abstract: '', location: '' });
    setAttachedFile(null); setExistingFileUrl('');
  };
  const handleDeleteClick = (id: number) => { setDeleteId(id); setShowDeleteModal(true); };
  const handleConfirmDelete = async () => {
    if (deleteId) { try { await deleteRecruitmentPlan(deleteId); await fetchData(); } catch (error) { alert("Xóa thất bại!"); } }
    setShowDeleteModal(false);
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get('/recruitment-plans/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'DanhSachKeHoach.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
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
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kế Hoạch Tuyển Dụng</h1>
              <p className="text-slate-500 mt-1">Quản lý toàn bộ quy trình và kế hoạch tuyển dụng</p>
            </div>
          </div>

          {/* FORM NHẬP LIỆU */}
          <Card className={`mb-8 shadow-sm bg-white border-t-4 transition-colors ${isEditing ? 'border-t-orange-500' : 'border-t-slate-900'}`}>
             <div className="flex flex-col space-y-1.5 p-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                    <div className={`${isEditing ? 'bg-orange-500' : 'bg-slate-900'} text-white p-2 rounded-md`}>
                        <FontAwesomeIcon icon={isEditing ? faPenToSquare : faLayerGroup} className="h-4 w-4" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Cập Nhật Kế Hoạch' : 'Tạo Kế Hoạch Mới'}</h3>
                </div>
             </div>
             
             <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Số kế hoạch <span className="text-red-500">*</span></label>
                                <Input placeholder="VD: 12345" className="bg-slate-50" value={formData.planNumber} onChange={(e) => handleInputChange('planNumber', e.target.value)} />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Bộ phận tham mưu</label>
                                <SearchableSelect 
                                    options={departments.map(d => ({ label: d.name, value: d.departmentid.toString() }))}
                                    value={formData.department}
                                    onChange={(val) => handleInputChange('department', val)}
                                    placeholder="Chọn bộ phận"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Trích yếu nội dung <span className="text-red-500">*</span></label>
                                <textarea className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white resize-none" placeholder="Mô tả tóm tắt..." value={formData.abstract} onChange={(e) => handleInputChange('abstract', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Nơi nhận</label>
                                <Input placeholder="VD: Ban Giám Đốc..." className="bg-slate-50" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold border-b border-slate-200 pb-2">
                                <FontAwesomeIcon icon={faCalendarDays} className="text-slate-500" /> Thời gian & Thẩm quyền
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase text-slate-500">Người ký duyệt</label>
                                <SearchableSelect 
                                    options={employees.map(e => ({ label: e.name || '', value: e.employeeid.toString() }))}
                                    value={formData.signer}
                                    onChange={(val) => handleInputChange('signer', val)}
                                    placeholder="Chọn người ký"
                                />
                            </div>

                            <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Ngày ban hành</label><Input type="date" className="bg-white" value={formData.issueDate} onChange={(e) => handleInputChange('issueDate', e.target.value)} /></div>
                            <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Ngày hiệu lực</label><Input type="date" className="bg-white" value={formData.effectiveDate} onChange={(e) => handleInputChange('effectiveDate', e.target.value)} /></div>
                            <div className="space-y-2"><label className="text-xs font-semibold uppercase text-slate-500">Ngày kết thúc</label><Input type="date" className="bg-white" value={formData.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} /></div>
                        </div>
                        <Button type="button" variant="outline" onClick={() => setShowFileModal(true)} className={`w-full border-dashed border-2 h-12 ${(attachedFile || existingFileUrl) ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-300 text-slate-600'}`}>
                            {(attachedFile || existingFileUrl) ? <><FontAwesomeIcon icon={faCircleCheck} className="mr-2" /><span>{attachedFile ? 'Đã chọn file mới' : 'Đã có file đính kèm'}</span></> : <><FontAwesomeIcon icon={faPaperclip} className="mr-2" /><span>Đính kèm file kế hoạch (PDF)</span></>}
                        </Button>
                    </div>
                </div>
                <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                    <Button variant="ghost" onClick={handleResetForm}>{isEditing && <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />}{isEditing ? 'Hủy chỉnh sửa' : 'Hủy bỏ'}</Button>
                    <Button className={`${isEditing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-900 hover:bg-slate-800'} text-white min-w-[140px]`} onClick={() => setShowSaveModal(true)}>
                        <FontAwesomeIcon icon={isEditing ? faPenToSquare : faPlus} className="mr-2" />{isEditing ? 'Cập nhật' : 'Lưu kế hoạch'}
                    </Button>
                </div>
             </CardContent>
          </Card>

          {/* SEARCH & FILTER */}
          <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center mb-6 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
             <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
               <div className="relative w-full sm:w-64">
                  <Input placeholder="Tìm kiếm..." className="pl-9 bg-white border-slate-200" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
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
                        <SelectItem value="all">Tất cả</SelectItem><SelectItem value="signer">Người ký</SelectItem><SelectItem value="department">Bộ phận</SelectItem>
                    </SelectContent>
                  </Select>
                  {filterType !== 'all' && (
                      <SearchableSelect 
                        placeholder={filterType === 'signer' ? 'Chọn nhân viên...' : 'Chọn phòng ban...'}
                        value={filterValue}
                        onChange={(val) => { setFilterValue(val); setCurrentPage(1); }}
                        options={filterType === 'signer' ? employees.map(e => ({ label: e.name || '', value: e.employeeid.toString() })) : departments.map(d => ({ label: d.name, value: d.departmentid.toString() }))}
                        width="sm:w-[250px] w-full"
                      />
                  )}
               </div>
             </div>
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
                        { key: 'planNumber', label: 'Số KH' }, { key: 'signer', label: 'Người ký' },
                        { key: 'department', label: 'Bộ phận' }, { key: 'issueDate', label: 'Ngày ban hành' },
                        { key: 'effectiveDate', label: 'Hiệu lực' }, { key: 'endDate', label: 'Kết thúc' },
                        { key: 'location', label: 'Nơi nhận' }, { key: 'abstract', label: 'Trích yếu' }
                      ].map((col) => (
                        <TableHead key={col.key} className="font-bold text-slate-700 cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort(col.key as keyof Plan)}>
                            <div className="flex items-center gap-1">{col.label}{renderSortIcon(col.key as keyof Plan)}</div>
                        </TableHead>
                      ))}
                      <TableHead className="font-bold text-slate-700 text-center">File</TableHead>
                      <TableHead className="text-right font-bold text-slate-700 pr-6">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (<TableRow><TableCell colSpan={11} className="text-center py-10 text-gray-500">Đang tải dữ liệu...</TableCell></TableRow>) : 
                    currentPlans.length === 0 ? (<TableRow><TableCell colSpan={11} className="text-center py-10 text-gray-400">Không có dữ liệu nào</TableCell></TableRow>) : (
                        currentPlans.map((plan, idx) => (
                        <TableRow key={plan.id} className={`hover:bg-slate-50 ${isEditing && currentId === plan.id ? 'bg-orange-50' : ''}`}>
                            <TableCell className="font-medium text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                            <TableCell><span className="font-medium text-blue-600">{plan.planNumber}</span></TableCell>
                            <TableCell>{getEmployeeName(plan.signer)}</TableCell>
                            <TableCell><Badge variant="secondary" className="font-normal">{getDepartmentName(plan.department)}</Badge></TableCell>
                            <TableCell className="text-sm text-slate-500 whitespace-nowrap">{formatDate(plan.issueDate)}</TableCell>
                            <TableCell className="text-sm text-slate-500 whitespace-nowrap">{formatDate(plan.effectiveDate)}</TableCell>
                            <TableCell className="text-sm text-slate-500 whitespace-nowrap">{formatDate(plan.endDate)}</TableCell>
                            <TableCell className="max-w-[150px] truncate" title={plan.location}>{plan.location}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={plan.abstract}>{plan.abstract}</TableCell>
                            <TableCell className="text-center">{plan.hasFile && (<a href={plan.fileUrl} target="_blank" className="text-blue-500"><FontAwesomeIcon icon={faPaperclip} /></a>)}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleEditClick(plan)}><FontAwesomeIcon icon={faPenToSquare} /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDeleteClick(plan.id)}><FontAwesomeIcon icon={faTrash} /></Button>
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
                {sortedPlans.length > 0 && (
                  <div className="flex items-center gap-4">
                      <div className="text-sm text-slate-500">
                          Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedPlans.length)}</strong> của <strong>{sortedPlans.length}</strong>
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
      <Modal showFileModal={showFileModal} setShowFileModal={setShowFileModal} showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal} showSaveModal={showSaveModal} setShowSaveModal={setShowSaveModal} showSuccessModal={showSuccessModal} setShowSuccessModal={setShowSuccessModal} showCancelModal={showCancelModal} setShowCancelModal={setShowCancelModal} onConfirmUpload={handleReceiveFile} onConfirmSave={handleConfirmSave} onConfirmDelete={handleConfirmDelete} />
    </div>
  );
}