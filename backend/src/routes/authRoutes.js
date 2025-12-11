import express from 'express';
// ✅ Cập nhật import: Thay 'getUsers' bằng 'getAllAccounts' và thêm 'getAccountFormData'
import { 
    createAccount, 
    Login, 
    resetPassword, 
    signOut, 
    verifyUserIdentity, 
    getAllAccounts,     // 🔹 Hàm xem danh sách
    getAccountFormData,  // 🔹 Hàm lấy dữ liệu dropdown
    updateAccount,
    deleteAccount,
    adminResetPassword,
    changePassword
} from '../controllers/AuthController.js'; 
import { protectedRoute } from '../middlewares/authMiddlewares.js';

const router = express.Router();

// --- POST ROUTES ---

// ⚠️ Lưu ý: Trong service frontend (auth.ts) nếu bạn để URL là /register 
// thì đổi dòng dưới thành: router.post('/register', createAccount);
router.post('/create', createAccount); 

router.post('/login', Login);

router.post('/signOut', signOut);

router.post('/verify-identity', verifyUserIdentity);

// --- PUT ROUTES ---
router.put('/reset-password', resetPassword);

// --- GET ROUTES (Mới thêm) ---

// 1. API lấy danh sách tài khoản (hiển thị lên bảng)
router.get('/accounts', getAllAccounts);

// 2. API lấy dữ liệu Employees, Jobtitles, Roles (cho dropdown modal)
router.get('/form-data', getAccountFormData);

router.put('/update/:id', updateAccount);
router.delete('/delete/:id', deleteAccount);
router.post('/admin-reset-password', adminResetPassword);
router.put('/change-password', protectedRoute, changePassword);

export default router;