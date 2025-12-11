'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faFloppyDisk, faRotateLeft, faMoneyBillWave, faCogs, faCalculator,
    faPlus, faTrash, faPenToSquare
} from '@fortawesome/free-solid-svg-icons';
import { Label } from '@/components/ui/label';

// Import Services
import { 
    getTaxConfigs, createTaxConfig, updateTaxConfig, deleteTaxConfig,
    getDeductionConfigs, updateDeductionConfig,
    getPenaltyConfigs, updatePenaltyConfig,
    calculateMonthlyPayroll,
    createAdvanceRequest, updateAdvanceRequest,
    getEmployeesList, // <--- Import hàm lấy nhân viên
    TaxConfig, DeductionConfig, PenaltyConfig
} from '@/services/admin/payroll';

// --- INTERFACES ---

interface SalaryDetail {
    salaryid: number;
    basicsalary: number;
    totalallowance: number;
    overtimeamount: number;
    insuranceamount: number;
    taxamount: number;
    penaltyamount: number;
    advanceamount: number;
    netsalary: number;
    employee: {
        employeecode: string;
        name: string;
        jobtitle: { name: string };
    };
    month: number;
    year: number;
}

interface AdvanceDetail {
    advancerequestid: number;
    employeeid: number;
    advanceamount: number;
    createddate: string;
    reason: string;
    status: string;
}

// Interface cho danh sách nhân viên trong dropdown
interface EmployeeSimple {
    employeeid: number;
    employeecode: string;
    name: string;
}

interface PayrollModalsProps {
  showConfigModal: boolean; setShowConfigModal: (v: boolean) => void;
  showCreatePayrollModal: boolean; setShowCreatePayrollModal: (v: boolean) => void;
  showAdvanceModal: boolean; setShowAdvanceModal: (v: boolean) => void;
  
  // Props cho Modal Chi Tiết Lương
  showDetailModal: boolean; setShowDetailModal: (v: boolean) => void;
  selectedSalary: SalaryDetail | null;

  // Props cho Modal Ứng Lương
  isEditingAdvance?: boolean;
  selectedAdvance?: AdvanceDetail | null;
  onRefreshData?: () => void;
}

export default function PayrollModals({
  showConfigModal, setShowConfigModal,
  showCreatePayrollModal, setShowCreatePayrollModal,
  showAdvanceModal, setShowAdvanceModal,
  showDetailModal, setShowDetailModal, selectedSalary,
  isEditingAdvance = false, selectedAdvance, onRefreshData
}: PayrollModalsProps) {

  const formatCurrency = (val: any) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val) || 0);

  // --- HELPER: MAPPING NGÔN NGỮ (DB -> UI) ---
  const getPenaltyLabel = (type: string) => {
      switch (type) {
          case 'late': return 'Đi muộn';
          case 'early_leave': return 'Về sớm';
          case 'unauthorized_absence': return 'Nghỉ không phép';
          default: return 'Vi phạm khác';
      }
  };

  const getDeductionLabel = (type: string) => {
      switch (type) {
          case 'personal': return 'Giảm trừ bản thân';
          case 'dependents': return 'Người phụ thuộc';
          default: return type; 
      }
  };

  // ==================== STATE MANAGEMENT ====================

  // 1. Config Data
  const [taxList, setTaxList] = useState<TaxConfig[]>([]);
  const [deductionList, setDeductionList] = useState<DeductionConfig[]>([]);
  const [penaltyList, setPenaltyList] = useState<PenaltyConfig[]>([]);
  
  // 2. Employee List (Data thật từ DB)
  const [employeeList, setEmployeeList] = useState<EmployeeSimple[]>([]);

  // 3. Form States - Configs
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<number | null>(null);
  const [taxFormData, setTaxFormData] = useState({ level: 1, min: 0, max: 0, rate: 0 });

  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [editingDeductionId, setEditingDeductionId] = useState<number | null>(null);
  const [deductionFormData, setDeductionFormData] = useState({ name: '', amount: 0 });

  const [showPenaltyForm, setShowPenaltyForm] = useState(false);
  const [editingPenaltyId, setEditingPenaltyId] = useState<number | null>(null);
  const [penaltyFormData, setPenaltyFormData] = useState({ 
      type: 'late', min: 0, max: 0, amount: 0, rate: 0, desc: '' 
  });

  // 4. Create Payroll State
  const [createPayrollData, setCreatePayrollData] = useState({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
  });

  // 5. Advance Form State
  const [advanceFormData, setAdvanceFormData] = useState({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      reason: ''
  });

  // ==================== FETCH CONFIG DATA ====================
  // Khi mở Config Modal -> tải cấu hình
  useEffect(() => {
    if (showConfigModal) {
        fetchConfigData();
    }
  }, [showConfigModal]);

  // Khi mở Advance Modal -> tải danh sách nhân viên
  useEffect(() => {
      if (showAdvanceModal) {
          fetchEmployeeData();
      }
  }, [showAdvanceModal]);

  const fetchConfigData = async () => {
      try {
        const [taxes, deductions, penalties] = await Promise.all([
            getTaxConfigs(),
            getDeductionConfigs(),
            getPenaltyConfigs()
        ]);
        setTaxList(taxes?.sort((a,b) => a.taxlevel - b.taxlevel) || []);
        setDeductionList(deductions || []);
        setPenaltyList(penalties || []);
      } catch (e) {
        console.error("Lỗi tải dữ liệu cấu hình", e);
      }
  };

  const fetchEmployeeData = async () => {
      try {
          const employees = await getEmployeesList();
          setEmployeeList(employees || []);
      } catch (e) {
          console.error("Lỗi tải nhân viên", e);
      }
  };

  // ==================== EFFECT: LOAD ADVANCE DATA ON EDIT ====================
  useEffect(() => {
      if (showAdvanceModal) {
          if (isEditingAdvance && selectedAdvance) {
              setAdvanceFormData({
                  employeeId: selectedAdvance.employeeid.toString(),
                  date: selectedAdvance.createddate ? selectedAdvance.createddate.split('T')[0] : new Date().toISOString().split('T')[0],
                  amount: selectedAdvance.advanceamount,
                  reason: selectedAdvance.reason || ''
              });
          } else {
              setAdvanceFormData({
                  employeeId: '',
                  date: new Date().toISOString().split('T')[0],
                  amount: 0,
                  reason: ''
              });
          }
      }
  }, [showAdvanceModal, isEditingAdvance, selectedAdvance]);


  // ==================== HANDLERS: CONFIGS ====================
  
  // --- Tax ---
  const openAddTax = () => {
      setEditingTaxId(null);
      setTaxFormData({ level: taxList.length + 1, min: 0, max: 0, rate: 0 });
      setShowTaxForm(true);
  };
  const openEditTax = (item: TaxConfig) => {
      setEditingTaxId(item.taxconfigid);
      setTaxFormData({ level: item.taxlevel, min: item.minamount, max: item.maxamount || 0, rate: item.taxrate });
      setShowTaxForm(true);
  };
  const handleSaveTax = async () => {
      try {
          const payload = {
              level: Number(taxFormData.level),
              min: Number(taxFormData.min),
              max: Number(taxFormData.max) === 0 ? undefined : Number(taxFormData.max),
              rate: Number(taxFormData.rate)
          };
          if (editingTaxId) await updateTaxConfig(editingTaxId, payload);
          else await createTaxConfig(payload);
          await fetchConfigData();
          setShowTaxForm(false);
      } catch (error) { alert("Lỗi lưu cấu hình thuế!"); }
  };
  const handleDeleteTax = async (id: number) => {
      if (!confirm("Bạn có chắc chắn muốn xóa bậc thuế này?")) return;
      try { await deleteTaxConfig(id); await fetchConfigData(); } catch (error) { alert("Lỗi xóa thuế!"); }
  };

  // --- Deduction ---
  const openEditDeduction = (item: DeductionConfig) => {
      setEditingDeductionId(item.deductionconfigid);
      setDeductionFormData({ name: getDeductionLabel(item.deductiontype), amount: Number(item.amount) });
      setShowDeductionForm(true);
  };
  const handleSaveDeduction = async () => {
      if (!editingDeductionId) return;
      try { await updateDeductionConfig(editingDeductionId, Number(deductionFormData.amount)); await fetchConfigData(); setShowDeductionForm(false); } catch (error) { alert("Lỗi cập nhật giảm trừ!"); }
  };

  // --- Penalty ---
  const openEditPenalty = (item: PenaltyConfig) => {
      setEditingPenaltyId(item.penaltyconfigid);
      setPenaltyFormData({
          type: item.penaltytype, min: item.min_minutes, max: item.max_minutes,
          amount: Number(item.fixedamount), rate: Number(item.penaltyrate), desc: item.description || ''
      });
      setShowPenaltyForm(true);
  };
  const handleSavePenalty = async () => {
      try {
          const payload = {
              type: penaltyFormData.type, min: Number(penaltyFormData.min), max: Number(penaltyFormData.max),
              amount: Number(penaltyFormData.amount), rate: Number(penaltyFormData.rate), desc: penaltyFormData.desc
          };
          if (editingPenaltyId) await updatePenaltyConfig(editingPenaltyId, payload); 
          await fetchConfigData();
          setShowPenaltyForm(false);
      } catch (error) { alert("Lỗi lưu cấu hình phạt!"); }
  };

  // ==================== HANDLER: CREATE PAYROLL ====================
  const handleCreatePayrollAction = async () => {
      try {
          const { month, year } = createPayrollData;
          if (!month || !year) return alert("Vui lòng chọn tháng năm!");
          
          if(confirm(`Xác nhận tính lương tháng ${month}/${year}? Dữ liệu cũ của tháng này (nếu có) sẽ được tính lại.`)) {
              await calculateMonthlyPayroll(Number(month), Number(year));
              alert("Tính toán lương thành công! Vui lòng tải lại trang để xem kết quả.");
              setShowCreatePayrollModal(false);
              window.location.reload(); 
          }
      } catch (error: any) {
          alert("Lỗi tính lương: " + (error?.message || "Lỗi server"));
      }
  };

  // ==================== HANDLER: ADVANCE REQUEST ====================
  const handleSaveAdvanceAction = async () => {
      try {
          if(!advanceFormData.employeeId || !advanceFormData.amount || !advanceFormData.date) {
              return alert("Vui lòng nhập đầy đủ thông tin: Nhân viên, Ngày, Số tiền.");
          }

          const payload = {
            employeeId: advanceFormData.employeeId,
            date: advanceFormData.date,
            amount: advanceFormData.amount,
            reason: advanceFormData.reason
          };

          if (isEditingAdvance && selectedAdvance) {
              await updateAdvanceRequest(selectedAdvance.advancerequestid, payload);
              alert("Cập nhật đơn ứng lương thành công!");
          } else {
              await createAdvanceRequest(payload);
              alert("Tạo đơn ứng lương thành công!");
          }

          setShowAdvanceModal(false);
          if (onRefreshData) onRefreshData();

      } catch (error: any) {
          alert("Lỗi lưu đơn ứng: " + (error?.message || error));
      }
  };

  // ==================== SUB-MODALS RENDER ====================
  
  const renderTaxFormModal = () => (
    <Dialog open={showTaxForm} onOpenChange={setShowTaxForm}>
        <DialogContent className="sm:max-w-md z-[110]">
            <DialogHeader><DialogTitle>{editingTaxId ? 'Sửa Bậc Thuế' : 'Thêm Bậc Thuế'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Bậc</Label>
                    <Input value={taxFormData.level} disabled className="col-span-3 bg-slate-100" type="number" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Từ (VNĐ)</Label>
                    <Input value={taxFormData.min} onChange={(e) => setTaxFormData({...taxFormData, min: Number(e.target.value)})} className="col-span-3" type="number" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Đến (VNĐ)</Label>
                    <Input value={taxFormData.max} onChange={(e) => setTaxFormData({...taxFormData, max: Number(e.target.value)})} className="col-span-3" type="number" placeholder="Nhập 0 nếu vô cùng" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Thuế (%)</Label>
                    <Input value={taxFormData.rate} onChange={(e) => setTaxFormData({...taxFormData, rate: Number(e.target.value)})} className="col-span-3" type="number" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowTaxForm(false)}>Hủy</Button>
                <Button onClick={handleSaveTax}>Lưu</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );

  const renderDeductionFormModal = () => (
    <Dialog open={showDeductionForm} onOpenChange={setShowDeductionForm}>
        <DialogContent className="sm:max-w-md z-[110]">
            <DialogHeader><DialogTitle>Sửa Mức Giảm Trừ</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Loại</Label>
                    <Input value={deductionFormData.name} disabled className="col-span-3 bg-slate-100" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Mức tiền</Label>
                    <Input value={deductionFormData.amount} onChange={(e) => setDeductionFormData({...deductionFormData, amount: Number(e.target.value)})} className="col-span-3" type="number" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeductionForm(false)}>Hủy</Button>
                <Button onClick={handleSaveDeduction}>Cập nhật</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );

  const renderPenaltyFormModal = () => (
    <Dialog open={showPenaltyForm} onOpenChange={setShowPenaltyForm}>
        <DialogContent className="sm:max-w-lg z-[110]">
            <DialogHeader><DialogTitle>Sửa Quy Định Phạt</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
                 <div className="space-y-1">
                    <Label>Loại vi phạm</Label>
                    <Select value={penaltyFormData.type} onValueChange={(val) => setPenaltyFormData({...penaltyFormData, type: val})}>
                        <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                        <SelectContent className="z-[9999] bg-white">
                            <SelectItem value="late">Đi muộn</SelectItem>
                            <SelectItem value="early_leave">Về sớm</SelectItem>
                            <SelectItem value="unauthorized_absence">Nghỉ không phép</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Từ (phút)</Label>
                        <Input value={penaltyFormData.min} onChange={(e) => setPenaltyFormData({...penaltyFormData, min: Number(e.target.value)})} type="number" />
                    </div>
                    <div className="space-y-1">
                        <Label>Đến (phút)</Label>
                        <Input value={penaltyFormData.max} onChange={(e) => setPenaltyFormData({...penaltyFormData, max: Number(e.target.value)})} type="number" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <Label>Phạt tiền (Cố định)</Label>
                        <Input value={penaltyFormData.amount} onChange={(e) => setPenaltyFormData({...penaltyFormData, amount: Number(e.target.value)})} type="number" />
                    </div>
                    <div className="space-y-1">
                        <Label>Hoặc Phạt % Lương</Label>
                        <Input value={penaltyFormData.rate} onChange={(e) => setPenaltyFormData({...penaltyFormData, rate: Number(e.target.value)})} type="number" placeholder="%" />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label>Mô tả chi tiết</Label>
                    <Textarea value={penaltyFormData.desc} onChange={(e) => setPenaltyFormData({...penaltyFormData, desc: e.target.value})} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowPenaltyForm(false)}>Hủy</Button>
                <Button onClick={handleSavePenalty}>Lưu</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );

  const renderDetailModal = () => {
      if (!selectedSalary) return null;
      const s = selectedSalary;
      const totalIncome = Number(s.basicsalary) + Number(s.totalallowance) + Number(s.overtimeamount);
      const totalDeduction = Number(s.insuranceamount) + Number(s.taxamount) + Number(s.penaltyamount) + Number(s.advanceamount);

      return (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
            <DialogContent className="sm:max-w-2xl z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold text-blue-800 uppercase">
                        Phiếu Lương Tháng {s.month}/{s.year}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Nhân viên: <span className="font-bold text-black">{s.employee?.name}</span> - {s.employee?.employeecode}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="border rounded-lg p-4 bg-green-50">
                        <h4 className="font-bold text-green-700 mb-2 border-b pb-1">I. THU NHẬP</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between"><span>Lương cơ bản:</span> <span className="font-medium">{formatCurrency(s.basicsalary)}</span></div>
                            <div className="flex justify-between"><span>Phụ cấp:</span> <span className="font-medium">{formatCurrency(s.totalallowance)}</span></div>
                            <div className="flex justify-between"><span>Lương OT:</span> <span className="font-medium">{formatCurrency(s.overtimeamount)}</span></div>
                            <div className="flex justify-between font-bold border-t pt-1 mt-1 text-green-800">
                                <span>Tổng thu nhập:</span> <span>{formatCurrency(totalIncome)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="border rounded-lg p-4 bg-red-50">
                        <h4 className="font-bold text-red-700 mb-2 border-b pb-1">II. KHẤU TRỪ</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between"><span>Bảo hiểm:</span> <span className="font-medium">{formatCurrency(s.insuranceamount)}</span></div>
                            <div className="flex justify-between"><span>Thuế TNCN:</span> <span className="font-medium">{formatCurrency(s.taxamount)}</span></div>
                            <div className="flex justify-between"><span>Phạt vi phạm:</span> <span className="font-medium">{formatCurrency(s.penaltyamount)}</span></div>
                            <div className="flex justify-between"><span>Ứng lương:</span> <span className="font-medium">{formatCurrency(s.advanceamount)}</span></div>
                            <div className="flex justify-between font-bold border-t pt-1 mt-1 text-red-800">
                                <span>Tổng khấu trừ:</span> <span>{formatCurrency(totalDeduction)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center bg-blue-100 p-4 rounded-lg border border-blue-200">
                        <span className="text-lg font-bold text-blue-900">THỰC LĨNH:</span>
                        <span className="text-2xl font-bold text-blue-700">{formatCurrency(s.netsalary)}</span>
                    </div>
                </div>
                <DialogFooter><Button onClick={() => setShowDetailModal(false)}>Đóng</Button></DialogFooter>
            </DialogContent>
        </Dialog>
      );
  }

  // --- MAIN RENDER ---
  return (
    <>
      {/* 1. Modal Config */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg font-bold text-slate-800 border-b pb-2">
              <FontAwesomeIcon icon={faCogs} className="mr-2 text-slate-600" /> Cấu Hình Tham Số Lương
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="tax" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100">
                <TabsTrigger value="tax">Thuế TNCN</TabsTrigger>
                <TabsTrigger value="deduction">Giảm trừ</TabsTrigger>
                <TabsTrigger value="penalty">Phạt</TabsTrigger>
            </TabsList>
            <TabsContent value="tax">
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-slate-700">Biểu thuế lũy tiến</h3>
                        <Button size="sm" variant="outline" onClick={openAddTax} className="h-8 border-dashed text-blue-600 border-blue-300 bg-blue-50"><FontAwesomeIcon icon={faPlus} className="mr-1" /> Thêm bậc thuế</Button>
                    </div>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100"><TableRow><TableHead>Bậc</TableHead><TableHead>Thu nhập (Min)</TableHead><TableHead>Thu nhập (Max)</TableHead><TableHead>Thuế (%)</TableHead><TableHead></TableHead></TableRow></TableHeader>
                            <TableBody>{taxList.map((item) => (<TableRow key={item.taxconfigid}><TableCell className="font-bold text-center">{item.taxlevel}</TableCell><TableCell>{formatCurrency(Number(item.minamount))}</TableCell><TableCell>{(!item.maxamount || item.maxamount == 0) ? 'Trở lên' : formatCurrency(Number(item.maxamount))}</TableCell><TableCell className="text-center font-bold text-blue-600">{item.taxrate}%</TableCell><TableCell><div className="flex gap-1 justify-end"><Button onClick={() => openEditTax(item)} variant="ghost" size="sm"><FontAwesomeIcon icon={faPenToSquare} className="text-blue-500" /></Button><Button onClick={() => handleDeleteTax(item.taxconfigid)} variant="ghost" size="sm"><FontAwesomeIcon icon={faTrash} className="text-red-500" /></Button></div></TableCell></TableRow>))}</TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="deduction">
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center"><h3 className="text-sm font-semibold text-slate-700">Các khoản giảm trừ</h3></div>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100"><TableRow><TableHead>Loại</TableHead><TableHead className="text-right">Mức tiền</TableHead><TableHead></TableHead></TableRow></TableHeader>
                            <TableBody>{deductionList.map((item) => (<TableRow key={item.deductionconfigid}><TableCell className="font-medium text-blue-700">{getDeductionLabel(item.deductiontype)}</TableCell><TableCell className="text-right font-bold text-green-700">{formatCurrency(Number(item.amount))}</TableCell><TableCell><div className="flex justify-end"><Button onClick={() => openEditDeduction(item)} variant="ghost" size="sm"><FontAwesomeIcon icon={faPenToSquare} className="text-blue-500" /></Button></div></TableCell></TableRow>))}</TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="penalty">
                <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center"><h3 className="text-sm font-semibold text-slate-700">Quy định phạt</h3></div>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100"><TableRow><TableHead>Loại</TableHead><TableHead className="text-center">Số phút</TableHead><TableHead className="text-right">Mức phạt</TableHead><TableHead>Mô tả</TableHead><TableHead></TableHead></TableRow></TableHeader>
                            <TableBody>{penaltyList.map((item) => (<TableRow key={item.penaltyconfigid}><TableCell className="font-medium text-red-600">{getPenaltyLabel(item.penaltytype)}</TableCell><TableCell className="text-center text-xs">{item.min_minutes} - {item.max_minutes > 900 ? '∞' : item.max_minutes}</TableCell><TableCell className="text-right font-bold">{Number(item.fixedamount) > 0 ? formatCurrency(Number(item.fixedamount)) : `${item.penaltyrate}%`}</TableCell><TableCell className="text-xs truncate max-w-[150px]">{item.description}</TableCell><TableCell><div className="flex justify-end"><Button onClick={() => openEditPenalty(item)} variant="ghost" size="sm"><FontAwesomeIcon icon={faPenToSquare} className="text-blue-500" /></Button></div></TableCell></TableRow>))}</TableBody>
                        </Table>
                    </div>
                </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4 border-t pt-4"><Button variant="outline" onClick={() => setShowConfigModal(false)}>Đóng</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render Sub Modals */}
      {renderTaxFormModal()}
      {renderDeductionFormModal()}
      {renderPenaltyFormModal()}
      {renderDetailModal()}

      {/* 2. Modal Tạo Bảng Lương */}
      <Dialog open={showCreatePayrollModal} onOpenChange={setShowCreatePayrollModal}>
        <DialogContent className="sm:max-w-md z-[100]">
            <DialogHeader><DialogTitle className="flex items-center text-lg font-bold text-green-700 border-b pb-2"><FontAwesomeIcon icon={faCalculator} className="mr-2" /> Khởi Tạo Bảng Lương</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2"><Label>Tháng</Label><Select value={createPayrollData.month.toString()} onValueChange={(val) => setCreatePayrollData({...createPayrollData, month: Number(val)})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="z-[9999] bg-white">{Array.from({length: 12}, (_, i) => i + 1).map(m => (<SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Năm</Label><Input type="number" value={createPayrollData.year} onChange={(e) => setCreatePayrollData({...createPayrollData, year: Number(e.target.value)})} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowCreatePayrollModal(false)}>Hủy</Button><Button className="bg-green-600 hover:bg-green-700" onClick={handleCreatePayrollAction}>Tạo</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Modal Ứng Lương (ĐÃ CẬP NHẬT DANH SÁCH NHÂN VIÊN) */}
      <Dialog open={showAdvanceModal} onOpenChange={setShowAdvanceModal}>
        <DialogContent className="sm:max-w-lg z-[100]">
            <DialogHeader><DialogTitle className="flex items-center text-lg font-bold text-orange-600 border-b pb-2"><FontAwesomeIcon icon={faMoneyBillWave} className="mr-2" /> {isEditingAdvance ? 'Sửa Đơn Ứng' : 'Tạo Đơn Ứng'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
                <div className="space-y-1">
                    <Label>Nhân viên</Label>
                    <Select 
                        disabled={isEditingAdvance} 
                        value={advanceFormData.employeeId} 
                        onValueChange={(val) => setAdvanceFormData({...advanceFormData, employeeId: val})}
                    >
                        <SelectTrigger><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
                        <SelectContent className="z-[9999] bg-white max-h-[250px] overflow-y-auto">
                            {employeeList.length > 0 ? (
                                employeeList.map((emp) => (
                                    <SelectItem key={emp.employeeid} value={emp.employeeid.toString()}>
                                        {emp.employeecode} - {emp.name}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-center text-slate-500">
                                    {isEditingAdvance ? 'Đang tải thông tin...' : 'Đang tải danh sách...'}
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                    {isEditingAdvance && <p className="text-xs text-slate-500">* Không thể thay đổi nhân viên khi sửa</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Ngày ứng</Label><Input type="date" value={advanceFormData.date} onChange={(e) => setAdvanceFormData({...advanceFormData, date: e.target.value})} /></div>
                    <div className="space-y-1"><Label>Số tiền</Label><Input type="number" value={advanceFormData.amount} onChange={(e) => setAdvanceFormData({...advanceFormData, amount: Number(e.target.value)})} /></div>
                </div>
                <div className="space-y-1"><Label>Lý do</Label><Textarea value={advanceFormData.reason} onChange={(e) => setAdvanceFormData({...advanceFormData, reason: e.target.value})} /></div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdvanceModal(false)}>Hủy</Button>
                <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSaveAdvanceAction}>{isEditingAdvance ? 'Cập nhật' : 'Lưu'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}