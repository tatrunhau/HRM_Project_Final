import express from 'express';
import { getDashboardSummary } from '../controllers/DashboardController.js'; // Nhớ trỏ đúng đường dẫn file controller vừa tạo

const router = express.Router();

// Định nghĩa đường dẫn: GET /api/dashboard/summary
router.get('/summary', getDashboardSummary);

export default router;