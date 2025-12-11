// backend/src/routes/insuranceConfigRoutes.js

import express from 'express';
import { 
    getAllInsuranceConfigs, 
    updateInsuranceConfig,
} from '../controllers/regime/InsuranceConfigController.js'; // Đường dẫn đến Controller

const router = express.Router();

// Lấy danh sách cấu hình
router.get('/', getAllInsuranceConfigs);

// Cập nhật cấu hình theo ID
router.put('/:id', updateInsuranceConfig);

export default router;