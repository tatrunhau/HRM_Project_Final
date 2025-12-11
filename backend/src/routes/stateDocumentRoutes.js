// routes/stateDocumentRoutes.js

import express from 'express';
import { 
    createStateDocument, 
    getAllStateDocuments, 
    getStateDocumentById, 
    updateStateDocument, 
    deleteStateDocument,
    exportStateDocuments // Thêm hàm xuất Excel
} from '../controllers/regime/StateDocumentController.js';

const router = express.Router();

// Xuất file exel
router.get('/export', exportStateDocuments);

// Lấy danh sách
router.get('/', getAllStateDocuments);

// Lấy chi tiết
router.get('/:id', getStateDocumentById);

// Tạo mới
router.post('/', createStateDocument);

// Cập nhật
router.put('/:id', updateStateDocument);

// Xóa
router.delete('/:id', deleteStateDocument);

export default router;