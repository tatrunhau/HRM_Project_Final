import express from 'express';
import * as RequestController from '../controllers/RequestController.js';

// ✅ SỬA 1: Đổi đường dẫn thành authMiddlewares.js và lấy hàm protectedRoute
import { protectedRoute } from '../middlewares/authMiddlewares.js';

const router = express.Router();

// ==========================================
// 1. QUẢN LÝ NGHỈ PHÉP (LEAVE)
// ==========================================
// ✅ SỬA 2: Thay tất cả verifyToken thành protectedRoute

// Lấy danh sách đơn của nhân viên
router.get('/leave/:employeeId', protectedRoute, RequestController.getEmployeeLeaves);

// Tạo đơn mới
router.post('/leave', protectedRoute, RequestController.createLeave);

// Cập nhật đơn (Chỉ cho phép khi status = pending)
router.put('/leave/:id', protectedRoute, RequestController.updateLeave);

// Hủy/Xóa đơn (Chỉ cho phép khi status = pending)
router.delete('/leave/:id', protectedRoute, RequestController.deleteLeave);


// ==========================================
// 2. QUẢN LÝ TĂNG CA (OVERTIME)
// ==========================================
router.get('/overtime/:employeeId', protectedRoute, RequestController.getEmployeeOvertimes);
router.post('/overtime', protectedRoute, RequestController.createOvertime);
router.put('/overtime/:id', protectedRoute, RequestController.updateOvertime);
router.delete('/overtime/:id', protectedRoute, RequestController.deleteOvertime);


// ==========================================
// 3. QUẢN LÝ ỨNG LƯƠNG (ADVANCE)
// ==========================================
router.get('/advance/:employeeId', protectedRoute, RequestController.getEmployeeAdvances);
router.post('/advance', protectedRoute, RequestController.createAdvanceRequest);
router.put('/advance/:id', protectedRoute, RequestController.updateAdvanceRequest);
router.delete('/advance/:id', protectedRoute, RequestController.deleteAdvanceRequest);

export default router;