'use client';

import Sidebar from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'; // Cần đảm bảo bạn đã có component Badge
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faTrash, faPlus, faPenToSquare, faFileExport,
  faUserGroup, faLock, faUnlock, faSort, faSortUp, faSortDown, faChevronLeft, faChevronRight, faChevronDown, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useMemo, useRef } from 'react';

import AccountModals from './modals'; 
import { 
    getUserAccounts, createAccount, updateAccount, deleteAccount, adminResetPassword, getFormData, 
    UserAccount, AccountPayload, Employee, Jobtitle, Role 
} from '@/services/admin/auth';

// --- COMPONENT: SEARCHABLE SELECT (Giống bên Employee) ---
interface SearchableSelectProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const label = options.find(o => o.value === value)?.label || placeholder || "Chọn...";

  return (
    <div className="relative w-full sm:w-[200px]" ref={wrapperRef}>
        <div className="flex items-center justify-between px-3 py-2 text-sm border rounded bg-white cursor-pointer h-10" onClick={() => setIsOpen(!isOpen)}>
            <span className="truncate">{label}</span>
            <FontAwesomeIcon icon={faChevronDown} className="text-xs text-slate-400"/>
        </div>
        {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto flex flex-col">
                <div className="p-2 border-b">
                    <input className="w-full px-2 py-1 text-sm border rounded outline-none" placeholder="Tìm..." value={search} onChange={e => setSearch(e.target.value)} autoFocus/>
                </div>
                <div className="flex-1">
                    {filtered.length > 0 ? filtered.map(o => (
                        <div key={o.value} className={`px-3 py-2 text-sm cursor-pointer flex justify-between ${value === o.value ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50'}`} 
                             onClick={() => { onChange(o.value); setIsOpen(false); }}>
                            {o.label}{value === o.value && <FontAwesomeIcon icon={faCheck} className="text-xs"/>}
                        </div>
                    )) : <div className="px-3 py-2 text-sm text-slate-400 text-center">Không tìm thấy</div>}
                </div>
            </div>
        )}
    </div>
  );
};

// Types Helper
type SortDirection = 'asc' | 'desc';
interface SortConfig { key: keyof UserAccount; direction: SortDirection; }

export default function AccountPage() {
  // --- UI STATES ---
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- DATA STATES ---
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({}); 
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // --- LOOKUP DATA ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobtitles, setJobtitles] = useState<Jobtitle[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // --- FILTER & PAGINATION & SORT STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all | role | status
  const [filterValue, setFilterValue] = useState('');
  
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'userid', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
        const data = await getUserAccounts();
        setAccounts(Array.isArray(data) ? data : []);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };
  
  const fetchLookups = async () => {
      try {
          const data = await getFormData();
          setEmployees(data.employees || []);
          setJobtitles(data.jobtitles || []);
          setRoles(data.roles || []);
      } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchData(); fetchLookups(); }, []);

  // --- LOGIC FILTER & SORT ---
  const filteredData = useMemo(() => {
    return accounts.filter(item => {
      // 1. Search text
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = 
            (item.usercode?.toLowerCase() || '').includes(lowerSearch) || 
            (item.name?.toLowerCase() || '').includes(lowerSearch) || 
            (item.employeename?.toLowerCase() || '').includes(lowerSearch);
      
      // 2. Filter dropdown
      let matchesFilter = true;
      if (filterType === 'role' && filterValue) {
          // So sánh roleid (number) với filterValue (string)
          matchesFilter = item.roleid.toString() === filterValue;
      }
      if (filterType === 'status' && filterValue) {
          // So sánh status (boolean) với filterValue ('true'/'false')
          matchesFilter = String(item.status) === filterValue;
      }

      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchTerm, filterType, filterValue]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a: any, b: any) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Xử lý null/undefined
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        // So sánh string hoặc number
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [filteredData, sortConfig]);

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: keyof UserAccount) => {
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
    setIsEditing(false);
    setFormData({});
    setCreatedPassword(null);
    setShowModal(true);
  };

  const handleEditClick = (acc: UserAccount) => {
      setIsEditing(true);
      setCreatedPassword(null);
      setFormData({
          userid: acc.userid,
          employeeid: acc.employeeid, 
          employeename: acc.employeename, 
          employeecode: acc.employeecode,
          role: acc.roleid,
          status: acc.status
      });
      setShowModal(true);
  };

  const handleDeleteClick = (id: number) => {
      setSelectedId(id);
      setShowDeleteModal(true);
  };

  const handleConfirmSave = async () => {
    try {
        let response;
        if (isEditing) {
            await updateAccount(formData.userid, { status: formData.status, role: formData.role });
            response = { manualPassword: null };
        } else {
            if (!formData.employeeid || !formData.jobtitleid || !formData.role) return;
            response = await createAccount(formData as AccountPayload);
        }
        setCreatedPassword(response?.manualPassword || null);
        await fetchData(); 
        setShowModal(false); 
        setShowSuccessModal(true); 
    } catch (error: any) { alert(error.response?.data?.message || "Lỗi xử lý!"); }
  };

  const handleConfirmDelete = async () => {
      if (!selectedId) return;
      try {
          await deleteAccount(selectedId);
          await fetchData();
          setShowDeleteModal(false);
      } catch (error: any) { alert("Lỗi xóa: " + error.response?.data?.message); }
  };

  const handleResetPassword = async () => {
      if (!formData.userid || !confirm("Bạn có chắc chắn muốn reset mật khẩu?")) return;
      try {
          const res = await adminResetPassword(formData.userid);
          if (res.manualPassword) {
              setCreatedPassword(res.manualPassword);
              setShowModal(false);
              setShowSuccessModal(true);
          } else { alert("Đã reset mật khẩu và gửi email thành công!"); }
      } catch (error: any) { alert("Lỗi: " + error.response?.data?.message); }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Sidebar />
      <main className="ml-64 p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faUserGroup} className="text-slate-600" /> Quản Lý Tài Khoản
              </h1>
              <p className="text-slate-500 mt-1">Quản lý tài khoản đăng nhập hệ thống</p>
            </div>
            <Button className="bg-slate-900 text-white gap-2 hover:bg-slate-800" onClick={handleAddNew}>
                <FontAwesomeIcon icon={faPlus} /> Thêm Tài Khoản
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
             <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Input placeholder="Tìm tên, mã NV, user..." className="pl-9 bg-slate-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>
                
                {/* Filter Controls */}
                <div className="flex gap-2">
                    <Select value={filterType} onValueChange={(val) => {setFilterType(val); setFilterValue(''); setCurrentPage(1);}}>
                        <SelectTrigger className="w-[140px] bg-slate-50"><SelectValue placeholder="Lọc theo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="role">Vai trò</SelectItem>
                            <SelectItem value="status">Trạng thái</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {filterType !== 'all' && (
                        <SearchableSelect 
                            placeholder={filterType === 'role' ? 'Chọn vai trò...' : 'Chọn trạng thái...'}
                            value={filterValue}
                            onChange={setFilterValue}
                            options={
                                filterType === 'role' ? roles.map(r => ({ label: r.name, value: r.roleid.toString() })) :
                                filterType === 'status' ? [{label: 'Hoạt động', value: 'true'}, {label: 'Đã khóa', value: 'false'}] : []
                            }
                        />
                    )}
                </div>
             </div>
          </div>

          {/* Table */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[50px] text-center font-bold">STT</TableHead>
                    
                    {/* Sortable Headers */}
                    <TableHead className="font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('usercode')}>
                        Tên Đăng Nhập {renderSortIcon('usercode')}
                    </TableHead>
                    <TableHead className="font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('employeename')}>
                        Nhân Viên {renderSortIcon('employeename')}
                    </TableHead>
                    <TableHead className="font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('role')}>
                        Vai Trò {renderSortIcon('role')}
                    </TableHead>
                    <TableHead className="text-center font-bold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                        Trạng Thái {renderSortIcon('status')}
                    </TableHead>

                    <TableHead className="text-right font-bold pr-6">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     <TableRow><TableCell colSpan={6} className="text-center py-8">Đang tải...</TableCell></TableRow>
                  ) : currentItems.length === 0 ? (
                     <TableRow><TableCell colSpan={6} className="text-center py-8">Không tìm thấy dữ liệu</TableCell></TableRow>
                  ) : (
                    currentItems.map((item, idx) => (
                        <TableRow key={item.userid} className="hover:bg-slate-50">
                        <TableCell className="text-center">{(currentPage - 1) * itemsPerPage + idx + 1}</TableCell>
                        <TableCell><span className="text-blue-600 font-semibold">{item.usercode}</span></TableCell>
                        <TableCell>
                            <div className="font-medium text-slate-800">{item.employeename}</div>
                            <div className="text-xs text-slate-500">{item.jobtitlename}</div>
                        </TableCell>
                        <TableCell><span className="font-medium text-purple-600">{item.role}</span></TableCell>
                        <TableCell className="text-center">
                            {item.status ? 
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Hoạt động</Badge> : 
                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Đã khóa</Badge>
                            }
                        </TableCell>
                        <TableCell className="text-right pr-4">
                             <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(item)}>
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteClick(item.userid)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                             </div>
                        </TableCell>
                        </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination Footer */}
              <div className="border-t border-slate-100 p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Hiển thị</span>
                    <Select defaultValue="10" onValueChange={(val) => {setItemsPerPage(Number(val)); setCurrentPage(1);}}>
                        <SelectTrigger className="w-[70px] h-8 text-sm"><SelectValue placeholder="10" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-slate-500">dòng - Tổng {sortedData.length} kết quả</span>
                </div>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}>
                        <FontAwesomeIcon icon={faChevronLeft}/>
                    </Button>
                    <Button variant="default" size="icon" className="h-8 w-8 bg-slate-900 text-white hover:bg-slate-800">
                        {currentPage}
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}>
                        <FontAwesomeIcon icon={faChevronRight}/>
                    </Button>
                </div>
            </div>
          </Card>
      </main>

      <AccountModals
        showModal={showModal} setShowModal={setShowModal}
        showDeleteModal={showDeleteModal} setShowDeleteModal={setShowDeleteModal}
        showSuccessModal={showSuccessModal} setShowSuccessModal={setShowSuccessModal}
        
        isEditing={isEditing}
        formData={formData} setFormData={setFormData}
        
        onConfirmSave={handleConfirmSave} 
        onConfirmDelete={handleConfirmDelete}
        onResetPassword={handleResetPassword}

        employees={employees} jobtitles={jobtitles} roles={roles}
        createdPassword={createdPassword}
      />
    </div>
  );
}