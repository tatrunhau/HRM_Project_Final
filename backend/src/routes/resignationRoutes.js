import express from 'express';
import {
    getAllResignations,
    createResignation,
    updateResignation,
    deleteResignation,
    exportResignations
} from '../controllers/ResignationController.js'; 

const router = express.Router();

// Đường dẫn gốc dự kiến: /api/resignations (Cần khai báo bên file server.js/index.js)

// 1. Xuất danh sách ra Excel (Đặt lên đầu để tránh nhầm với :id)
router.get('/export', exportResignations);

// 2. Lấy danh sách hồ sơ nghỉ việc (GET /api/resignations)
router.get('/', getAllResignations);

// 3. Tạo hồ sơ nghỉ việc mới (POST /api/resignations)
router.post('/', createResignation);

// 4. Cập nhật hồ sơ nghỉ việc (PUT /api/resignations/:id)
router.put('/:id', updateResignation);

// 5. Xóa hồ sơ nghỉ việc (DELETE /api/resignations/:id)
router.delete('/:id', deleteResignation);

export default router;