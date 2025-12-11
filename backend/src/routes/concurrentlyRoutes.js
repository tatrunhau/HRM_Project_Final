import express from 'express';
import { 
    exportConcurrentEmployees,
    getConcurrentList, 
    updateConcurrent 
} from '../controllers/ConcurrentlyController.js'; 

const router = express.Router();

// --- ĐỊNH NGHĨA CÁC ROUTES ---
router.get('/export', exportConcurrentEmployees);
// 1. Lấy danh sách nhân viên kèm thông tin kiêm nhiệm
// Endpoint: GET /api/concurrently
router.get('/', getConcurrentList);

// 2. Cập nhật chức vụ kiêm nhiệm cho nhân viên
// Endpoint: POST /api/concurrently/update
router.post('/update', updateConcurrent);

export default router;