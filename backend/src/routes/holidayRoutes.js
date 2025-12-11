import express from 'express';
import { 
    getAllHolidays, 
    createHoliday, 
    updateHoliday, 
    deleteHoliday,
    exportHolidays
} from '../controllers/HolidayController.js'; 

const router = express.Router();

router.get('/export', exportHolidays);
router.get('/', getAllHolidays);
router.post('/', createHoliday);
router.put('/:id', updateHoliday);
router.delete('/:id', deleteHoliday);

export default router;