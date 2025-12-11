import express from 'express';
import * as AttendanceController from '../controllers/AttendanceController.js';

const router = express.Router();

// Routes cho Leave (Nghỉ phép)
router.get('/leave', AttendanceController.getLeaves);
router.post('/leave', AttendanceController.createLeave);
router.put('/leave/:id', AttendanceController.updateLeave);
router.delete('/leave/:id', AttendanceController.deleteLeave);

// Routes cho Overtime (Tăng ca - Đơn từ)
// --- [FIX 403 ERROR] Đặt route export lên ĐẦU TIÊN ---
router.get('/overtime/export', AttendanceController.exportOvertimeExcel);

// Sau đó mới đến route lấy danh sách (search/filter/pagination)
router.get('/overtime', AttendanceController.getOvertimes);

// Các route có tham số :id đặt cuối cùng
router.post('/overtime', AttendanceController.createOvertime);
router.put('/overtime/:id', AttendanceController.updateOvertime);
router.delete('/overtime/:id', AttendanceController.deleteOvertime);

// Routes cho OT Config (Cấu hình hệ số lương tăng ca)
router.get('/ot-config', AttendanceController.getAllOTConfigs);     
router.put('/ot-config/:id', AttendanceController.updateOTConfig);   

router.post('/checkin', AttendanceController.checkInByQr);
router.get('/daily', AttendanceController.getDailyAttendance);

// 1. Cập nhật trạng thái của 1 bản ghi chấm công (Modal sửa item)
router.put('/log/:id', AttendanceController.updateAttendanceLog);

// 2. Lấy cấu hình giờ làm việc (Shift)
router.get('/shift', AttendanceController.getShiftConfig);

// 3. Cập nhật cấu hình giờ làm việc (Shift)
router.put('/shift', AttendanceController.updateShiftConfig);

router.post('/init-daily', AttendanceController.initDailyAttendance);
router.get('/daily/export', AttendanceController.exportDailyAttendanceExcel);

export default router;