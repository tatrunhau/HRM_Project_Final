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
  faPlus, faFilter, faUser, faPhone, faEye,
  faChevronLeft, faChevronRight, faSort, faSortUp, faSortDown, faChevronDown, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo, useRef } from 'react';
import EmployeeModals from './modals';
import { supabase } from '@/lib/supabase';

// API Services
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, exportEmployees, EmployeePayload } from '@/services/admin/employee';
import { getDepartments, Department } from '@/services/admin/department';
import { getJobTitles, JobTitle } from '@/services/admin/jobtitle';
import { getContracts, Contract } from '@/services/admin/contract';
import { getCertificates, Certificate } from '@/services/admin/certificate';

// --- HÀM HỖ TRỢ TÌM KIẾM TIẾNG VIỆT ---
function removeVietnameseTones(str: string) {
    if (!str) return '';
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
    // Kết hợp các dấu rời
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return str;
}

// Interface
interface Employee {
  employeeid: number;
  employeecode: string;
  name: string;
  departmentid: number;
  jobtitleid: number;
  contractid: number;
  certificateid: number;
  joineddate: string;
  status: string;
  phonenumber: string;
  email: string;
  cv_file?: string;
}

// --- SEARCHABLE SELECT ---
interface SearchableSelectProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}
const SearchableSelect = ({ options, value, onChange, placeholder }: SearchableSelectProps) => {
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

  // Áp dụng tìm kiếm tiếng Việt cho Select luôn
  const filtered = options.filter(o => 
    removeVietnameseTones(o.label.toLowerCase()).includes(removeVietnameseTones(search.toLowerCase()))
  );
  
  const label = options.find(o => o.value === value)?.label || placeholder || "Chọn...";
  return (
    <div className="relative w-full sm:w-[200px]" ref={wrapperRef}>
        <div className="flex items-center justify-between px-3 py-2 text-sm border rounded bg-white cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
            <span className="truncate">{label}</span><FontAwesomeIcon icon={faChevronDown} className="text-xs text-slate-400"/>
        </div>
        {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto flex flex-col">
                <div className="p-2 border-b"><input className="w-full px-2 py-1 text-sm border rounded outline-none" placeholder="Tìm..." value={search} onChange={e => setSearch(e.target.value)} autoFocus/></div>
                <div className="flex-1">{filtered.map(o => (
                    <div key={o.value} className={`px-3 py-2 text-sm cursor-pointer flex justify-between ${value === o.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`} onClick={() => { onChange(o.value); setIsOpen(false); }}>{o.label}{value === o.value && <FontAwesomeIcon icon={faCheck} className="text-xs"/>}</div>
                ))}</div>
            </div>
        )}
    </div>
  );
};

// Types & Helpers
type SortDirection = 'asc' | 'desc';
interface SortConfig { key: string; direction: SortDirection; }

const getStatusBadge = (status: string) => {
    const map: any = { 'Official': 'bg-green-100 text-green-700', 'Probation': 'bg-yellow-100 text-yellow-700', 'Resigned': 'bg-red-100 text-red-700' };
    const label: any = { 'Official': 'Chính thức', 'Probation': 'Thử việc', 'Resigned': 'Đã nghỉ việc' };
    return <Badge className={`font-normal border-0 ${map[status] || 'bg-gray-100'}`}>{label[status] || status}</Badge>;
};
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '';

export default function EmployeePage() {
  // States
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const [formData, setFormData] = useState<any>({});
  const [viewData, setViewData] = useState<any>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // File State
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string>('');

  // Filter - Search - Sort - Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Helpers
  const getDeptName = (id: any) => departments.find(d => d.departmentid == id)?.name || id;
  const getJobName = (id: any) => jobTitles.find(j => j.jobtitleid == id)?.name || id;

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [empData, deptData, jobData, contractData, certData] = await Promise.all([
        getEmployees(),
        getDepartments(),
        getJobTitles(),
        getContracts(),
        getCertificates()
      ]);
      setEmployees(Array.isArray(empData) ? empData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setJobTitles(Array.isArray(jobData) ? jobData : []);
      setContracts(Array.isArray(contractData) ? contractData : []);
      setCertificates(Array.isArray(certData) ? certData : []);
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIC LỌC & SẮP XẾP (Đã Fix Tiếng Việt) ---
  const filteredData = useMemo(() => {
    return employees.filter(e => {
        // Chuẩn hóa từ khóa tìm kiếm và dữ liệu về dạng không dấu thường
        const normalizeSearch = removeVietnameseTones(searchTerm.toLowerCase());
        const normalizeName = removeVietnameseTones((e.name || '').toLowerCase());
        const normalizeCode = removeVietnameseTones((e.employeecode || '').toLowerCase());

        const matchSearch = 
            normalizeName.includes(normalizeSearch) || 
            normalizeCode.includes(normalizeSearch);
        
        let matchFilter = true;
        if (filterType === 'department' && filterValue) matchFilter = e.departmentid.toString() === filterValue;
        if (filterType === 'jobtitle' && filterValue) matchFilter = e.jobtitleid.toString() === filterValue;
        if (filterType === 'status' && filterValue) matchFilter = e.status === filterValue;

        return matchSearch && matchFilter;
    });
  }, [employees, searchTerm, filterType, filterValue]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'departmentid') { aVal = getDeptName(aVal); bVal = getDeptName(bVal); }
        if (sortConfig.key === 'jobtitleid') { aVal = getJobName(aVal); bVal = getJobName(bVal); }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [filteredData, sortConfig, departments, jobTitles]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };
  const renderSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <FontAwesomeIcon icon={faSort} className="text-slate-300 ml-1 h-3 w-3"/>;
    return sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="text-blue-600 ml-1 h-3 w-3"/> : <FontAwesomeIcon icon={faSortDown} className="text-blue-600 ml-1 h-3 w-3"/>;
  };

  // --- ACTIONS ---
  const handleAddNew = () => {
    setIsEditing(false); setCurrentId(null);
    setFormData({
        employeecode: '', name: '', dateofbirth: '', gender: true, maritalstatus: false, religion: false,
        email: '', phonenumber: '', cccd: '', departmentid: '', jobtitleid: '', contractid: '', educationlevel: '',
        joineddate: '', status: 'Probation', basicsalary: '', layoff: '', note: '', dependents: 0
    });
    setAttachedFile(null); setExistingFileUrl('');
    setShowModal(true);
  };

  const handleEdit = (emp: any) => {
    setIsEditing(true); setCurrentId(emp.employeeid);
    setFormData({ ...emp, 
        departmentid: emp.departmentid?.toString(), 
        jobtitleid: emp.jobtitleid?.toString(),
        contractid: emp.contractid?.toString(),
        educationlevel: emp.educationlevel?.toString(),
        gender: emp.gender,
        dependents: emp.dependents || 0
    });
    setExistingFileUrl(emp.cv_file || ''); setAttachedFile(null);
    setShowModal(true);
  };

  const handleView = (emp: any) => {
    setViewData(emp);
    setShowViewModal(true);
  };

  const uploadFileToSupabase = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile/pf_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('recruitment-files').upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from('recruitment-files').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) { console.error('Upload lỗi:', error); return null; }
  };

  // --- VALIDATE & SAVE ---
  const handleConfirmSave = async () => {
    // 1. Validate
    if (!formData.name?.trim()) { alert("Vui lòng nhập Họ và Tên nhân viên!"); return; }
    if (!formData.departmentid) { alert("Vui lòng chọn Phòng ban!"); return; }
    if (!formData.jobtitleid) { alert("Vui lòng chọn Chức danh!"); return; }

    if (formData.phonenumber && isNaN(Number(formData.phonenumber))) { alert("Số điện thoại phải là số!"); return; }
    if (formData.cccd && isNaN(Number(formData.cccd))) { alert("CCCD/CMND phải là số!"); return; }
    if (formData.basicsalary && isNaN(Number(formData.basicsalary))) { alert("Lương cơ bản phải là số!"); return; }

    try {
        setIsLoading(true);
        let fileUrl = existingFileUrl;
        if (attachedFile) {
            const url = await uploadFileToSupabase(attachedFile);
            if (url) fileUrl = url;
        }
        
        // 2. Clean Payload (Xử lý chuỗi rỗng thành null/0)
        const payload: EmployeePayload = { 
            ...formData, 
            cv_file: fileUrl,
            departmentid: Number(formData.departmentid),
            jobtitleid: Number(formData.jobtitleid),
            contractid: formData.contractid ? Number(formData.contractid) : undefined,
            educationlevel: formData.educationlevel ? Number(formData.educationlevel) : undefined,
            phonenumber: formData.phonenumber ? formData.phonenumber : null,
            cccd: formData.cccd ? formData.cccd : null,
            basicsalary: formData.basicsalary ? formData.basicsalary : 0,
            dependents: formData.dependents ? formData.dependents : 0,
        };

        if (isEditing && currentId) await updateEmployee(currentId, payload);
        else await createEmployee(payload);

        await fetchData();
        setShowModal(false); setShowSuccessModal(true);
    } catch (error: any) { 
        const msg = error?.response?.data?.message || "Có lỗi xảy ra khi lưu dữ liệu!";
        alert(msg); 
    } finally { setIsLoading(false); }
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
        try { await deleteEmployee(deleteId); await fetchData(); } catch { alert("Xóa thất bại!"); }
    }
    setShowDeleteModal(false);
  };

  const handleExportExcel = async () => {
    try { await exportEmployees(); } catch { alert("Lỗi xuất Excel!"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Sidebar />
      <main className="ml-64 transition-all duration-300 ease-in-out">
        <div className="p-8 max-w-7xl mx-auto">
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-slate-600" /> Hồ Sơ Nhân Sự
              </h1>
              <p className="text-slate-500 mt-1">Quản lý toàn bộ nhân viên trong công ty</p>
            </div>
            <Button className="bg-slate-900 text-white gap-2" onClick={handleAddNew}><FontAwesomeIcon icon={faPlus} /> Thêm Nhân Viên</Button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <Input placeholder="Tìm tên, mã NV..." className="pl-9 bg-slate-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>
                <div className="flex gap-2">
                    <Select value={filterType} onValueChange={(val) => {setFilterType(val); setFilterValue(''); setCurrentPage(1);}}>
                        <SelectTrigger className="w-[140px] bg-slate-50"><SelectValue placeholder="Lọc theo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="department">Phòng ban</SelectItem>
                            <SelectItem value="jobtitle">Chức danh</SelectItem>
                            <SelectItem value="status">Trạng thái</SelectItem>
                        </SelectContent>
                    </Select>
                    {filterType !== 'all' && (
                        <SearchableSelect 
                            placeholder={filterType === 'department' ? 'Chọn phòng...' : filterType === 'jobtitle' ? 'Chọn chức vụ...' : 'Chọn trạng thái...'}
                            value={filterValue}
                            onChange={setFilterValue}
                            options={
                                filterType === 'department' ? departments.map(d => ({ label: d.name, value: d.departmentid.toString() })) :
                                filterType === 'jobtitle' ? jobTitles.map(j => ({ label: j.name, value: j.jobtitleid.toString() })) :
                                filterType === 'status' ? [{label: 'Chính thức', value: 'Official'}, {label: 'Thử việc', value: 'Probation'}, {label: 'Đã nghỉ', value: 'Resigned'}] : []
                            }
                        />
                    )}
                </div>
             </div>
             <Button variant="outline" onClick={handleExportExcel}><FontAwesomeIcon icon={faFileExport} className="mr-2"/> Xuất Excel</Button>
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[50px] font-bold text-slate-700">STT</TableHead>
                    {[
                        { key: 'employeecode', label: 'Mã NV' },
                        { key: 'name', label: 'Họ và Tên' },
                        { key: 'jobtitleid', label: 'Chức danh' },
                        { key: 'departmentid', label: 'Phòng ban' },
                        { key: 'joineddate', label: 'Ngày vào' },
                        { key: 'status', label: 'Trạng thái' },
                    ].map((col) => (
                        <TableHead key={col.key} className="font-bold text-slate-700 cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap" onClick={() => handleSort(col.key)}>
                            <div className="flex items-center gap-1">{col.label}{renderSortIcon(col.key)}</div>
                        </TableHead>
                    ))}
                    <TableHead className="text-right pr-6">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Đang tải...</TableCell></TableRow> :
                  currentItems.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">Không tìm thấy dữ liệu</TableCell></TableRow> : 
                  currentItems.map((e, idx) => (
                    <TableRow key={e.employeeid} className="hover:bg-slate-50">
                      <TableCell className="text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                      <TableCell><span className="text-blue-600 font-medium">{e.employeecode}</span></TableCell>
                      <TableCell>
                        <div className="flex flex-col"><span className="font-medium text-slate-800">{e.name}</span><span className="text-xs text-slate-500 flex gap-2"><span className="flex items-center gap-1"><FontAwesomeIcon icon={faPhone} className="text-[10px]"/> {e.phonenumber}</span></span></div>
                      </TableCell>
                      <TableCell>{getJobName(e.jobtitleid)}</TableCell>
                      <TableCell><Badge variant="secondary" className="font-normal bg-slate-100 text-slate-600">{getDeptName(e.departmentid)}</Badge></TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(e.joineddate)}</TableCell>
                      <TableCell>{getStatusBadge(e.status)}</TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-600 hover:bg-teal-50" onClick={() => handleView(e)}><FontAwesomeIcon icon={faEye} /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(e)}><FontAwesomeIcon icon={faPenToSquare} /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => { setDeleteId(e.employeeid); setShowDeleteModal(true); }}><FontAwesomeIcon icon={faTrash} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Hiển thị</span>
                    <Select defaultValue="10" onValueChange={(val) => {setItemsPerPage(Number(val)); setCurrentPage(1);}}>
                        <SelectTrigger className="w-[70px] h-8 text-sm"><SelectValue placeholder="10" /></SelectTrigger>
                        <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
                    </Select>
                    <span className="text-sm text-slate-500">dòng - Tổng {sortedData.length} kết quả</span>
                </div>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}><FontAwesomeIcon icon={faChevronLeft}/></Button>
                    <Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white">{currentPage}</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}><FontAwesomeIcon icon={faChevronRight}/></Button>
                </div>
            </div>
          </Card>
        </div>
      </main>

      <EmployeeModals
        showModal={showModal} setShowModal={setShowModal}
        showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal}
        showSuccessModal={showSuccessModal} setShowSuccessModal={setShowSuccessModal}
        showViewModal={showViewModal} setShowViewModal={setShowViewModal}
        viewData={viewData}
        isEditing={isEditing} formData={formData} setFormData={setFormData}
        departments={departments} jobTitles={jobTitles} contracts={contracts} certificates={certificates}
        attachedFile={attachedFile} setAttachedFile={setAttachedFile} existingFileUrl={existingFileUrl}
        onConfirmSave={handleConfirmSave} onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}