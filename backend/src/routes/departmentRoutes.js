import express from 'express';
import { 
    getAllDepartments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment,
    exportDepartments
} from '../controllers/DepartmentController.js'; 

const router = express.Router();

router.get('/export', exportDepartments);
router.get('/', getAllDepartments);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;