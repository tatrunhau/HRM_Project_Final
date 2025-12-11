import express from 'express';
import { 
    getAllCandidates, 
    getCandidateById, 
    createCandidate, 
    updateCandidate, 
    deleteCandidate,
    exportCandidates
} from '../controllers/recruitment/CandidateController.js';

const router = express.Router();

router.get('/export', exportCandidates);
router.get('/', getAllCandidates);
router.get('/:id', getCandidateById);
router.post('/', createCandidate);
router.put('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

export default router;