import express from 'express';
import { 
    // Tax
    getTaxConfigs, 
    createTaxConfig, 
    updateTaxConfig, 
    deleteTaxConfig,

    // Deduction
    getDeductionConfigs,
    updateDeductionConfig,

    // Penalty
    getPenaltyConfigs,
    createPenaltyConfig,
    updatePenaltyConfig,
    deletePenaltyConfig,
    createMonthlyPayroll,
    getMonthlySalaries,
    exportPayrollExcel,
    getAdvanceRequests,
    createAdvanceRequest,
    updateAdvanceRequest,
    exportAdvanceRequestsExcel,
    getEmployeesList

} from '../controllers/PayrollController.js';

const router = express.Router();

// --- 1. ROUTES CẤU HÌNH THUẾ (TAX) ---
router.get('/config/tax', getTaxConfigs);
router.post('/config/tax', createTaxConfig);
router.put('/config/tax/:id', updateTaxConfig);
router.delete('/config/tax/:id', deleteTaxConfig);

// --- 2. ROUTES CẤU HÌNH GIẢM TRỪ (DEDUCTION) ---
router.get('/config/deduction', getDeductionConfigs);
// Deduction chỉ có Update (theo yêu cầu nghiệp vụ)
router.put('/config/deduction/:id', updateDeductionConfig);

// --- 3. ROUTES CẤU HÌNH PHẠT (PENALTY) ---
router.get('/config/penalty', getPenaltyConfigs);
router.post('/config/penalty', createPenaltyConfig);
router.put('/config/penalty/:id', updatePenaltyConfig);
router.delete('/config/penalty/:id', deletePenaltyConfig);

// --- ROUTES BẢNG LƯƠNG ---
router.post('/calculate', createMonthlyPayroll);
router.get('/salaries', getMonthlySalaries); // API xem danh sách
router.get('/export', exportPayrollExcel);   // API xuất Excel

router.get('/advance/export', exportAdvanceRequestsExcel);
router.get('/advance', getAdvanceRequests);       // Lấy danh sách
router.post('/advance', createAdvanceRequest);    // Tạo mới
router.put('/advance/:id', updateAdvanceRequest); // Sửa / Duyệt
router.delete('/advance/:id', createAdvanceRequest); // Xóa
router.get('/employees', getEmployeesList);

export default router;