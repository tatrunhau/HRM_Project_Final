import express from 'express';
import { exportReportPDF, getAttritionPrediction, getReportStats } from '../controllers/ReportController.js';

const router = express.Router();

// Định nghĩa đường dẫn: GET /api/reports/stats
router.get('/stats', getReportStats);
router.post('/predict-attrition', getAttritionPrediction);
router.get('/export-pdf', exportReportPDF);

export default router;