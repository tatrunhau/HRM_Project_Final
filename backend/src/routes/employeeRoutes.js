import express from 'express';

import { getAllEmployees,

    getEmployeeById,

    createEmployee,

    updateEmployee,

    deleteEmployee,

    exportEmployees } from '../controllers/EmployeeController.js'; // Nhớ đảm bảo file Controller đã có hàm này



const router = express.Router();



// Đường dẫn thực tế sẽ là: GET /api/employees

router.get('/export', exportEmployees);



// 1. Lấy danh sách (GET /api/employees)

router.get('/', getAllEmployees);



// 2. Lấy chi tiết (GET /api/employees/:id)

router.get('/:id', getEmployeeById);



// 3. Tạo mới (POST /api/employees)

router.post('/', createEmployee);



// 4. Cập nhật (PUT /api/employees/:id)

router.put('/:id', updateEmployee);



// 5. Xóa (DELETE /api/employees/:id)

router.delete('/:id', deleteEmployee);



export default router;