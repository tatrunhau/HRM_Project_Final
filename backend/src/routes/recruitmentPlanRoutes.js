import express from 'express';
import { 
    createRecruitmentPlan, 
    getAllRecruitmentPlans, 
    getRecruitmentPlanById, 
    updateRecruitmentPlan, 
    deleteRecruitmentPlan,
    exportRecruitmentPlans
} from '../controllers/recruitment/RecruitmentPlanController.js';

const router = express.Router();

// Xuất file exel
router.get('/export', exportRecruitmentPlans);

// Lấy danh sách
router.get('/', getAllRecruitmentPlans);

// Lấy chi tiết
router.get('/:id', getRecruitmentPlanById);

// Tạo mới
router.post('/', createRecruitmentPlan);

// Cập nhật
router.put('/:id', updateRecruitmentPlan);

// Xóa
router.delete('/:id', deleteRecruitmentPlan);

export default router;