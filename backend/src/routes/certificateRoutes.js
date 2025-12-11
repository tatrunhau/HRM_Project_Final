import express from 'express';
import { 
    getAllCertificates, 
    createCertificate, 
    updateCertificate, 
    deleteCertificate,
    exportCertificates
} from '../controllers/CertificateController.js'; // Import các controller

const router = express.Router();

// 1. GET ALL (GET /api/certificates)
router.get('/', getAllCertificates); 

// 2. XUẤT EXCEL (GET /api/certificates/export)
router.get('/export', exportCertificates);

// 3. TẠO MỚI (POST /api/certificates)
router.post('/', createCertificate);

// 4. CẬP NHẬT (PUT /api/certificates/:id)
router.put('/:id', updateCertificate);

// 5. XÓA (DELETE /api/certificates/:id)
router.delete('/:id', deleteCertificate);

export default router;