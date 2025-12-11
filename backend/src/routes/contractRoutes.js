import express from 'express';
import { 
    getAllContracts, 
    createContract, 
    updateContract, 
    deleteContract,
    exportContracts
} from '../controllers/ContractController.js'; // Import các controller đã bổ sung

const router = express.Router();

// 1. GET ALL & LẤY DỮ LIỆU CƠ BẢN (GET /api/contracts)
router.get('/', getAllContracts); 

// 2. XUẤT EXCEL (GET /api/contracts/export)
router.get('/export', exportContracts);

// 3. TẠO MỚI (POST /api/contracts)
router.post('/', createContract);

// 4. CẬP NHẬT (PUT /api/contracts/:id)
// Sử dụng động /:id để xác định Hợp đồng cần cập nhật
router.put('/:id', updateContract);

// 5. XÓA (DELETE /api/contracts/:id)
// Sử dụng động /:id để xác định Hợp đồng cần xóa
router.delete('/:id', deleteContract);

export default router;