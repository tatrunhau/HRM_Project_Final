import express from 'express';
import { 
    getAllJobTitles, 
    createJobTitle, 
    updateJobTitle, 
    deleteJobTitle,
    exportJobTitles
} from '../controllers/JobTitleController.js'; 

const router = express.Router();

router.get('/export', exportJobTitles);
router.get('/', getAllJobTitles);
router.post('/', createJobTitle);
router.put('/:id', updateJobTitle);
router.delete('/:id', deleteJobTitle);

export default router;