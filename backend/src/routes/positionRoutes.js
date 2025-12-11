import express from 'express';
import { 
    getAllPositions, 
    createPosition, 
    updatePosition, 
    deletePosition,
    exportPositions
} from '../controllers/PositionController.js'; // Chú ý đường dẫn

const router = express.Router();

router.get('/export', exportPositions);
router.get('/', getAllPositions);
router.post('/', createPosition);
router.put('/:id', updatePosition);
router.delete('/:id', deletePosition);

export default router;