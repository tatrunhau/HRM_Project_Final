import express from 'express';
import { 
    getAllAllowances, 
    createAllowance, 
    updateAllowance, 
    deleteAllowance,
    exportAllowances
} from '../controllers/AllowanceController.js'; // Chú ý đường dẫn

const router = express.Router();

router.get('/export', exportAllowances);

router.get('/', getAllAllowances);
router.post('/', createAllowance);
router.put('/:id', updateAllowance);
router.delete('/:id', deleteAllowance);

export default router;