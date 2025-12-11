import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddlewares.js';
import cors from 'cors';

// 👇 QUAN TRỌNG: Import route này để sử dụng ở dòng 32
import recruitmentPlanRoutes from './routes/recruitmentPlanRoutes.js';

import departmentRoutes from './routes/departmentRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';

import candidateRoutes from './routes/candidateRoutes.js';
import jobTitleRoutes from './routes/jobTitleRoutes.js';

import contractRoutes from './routes/contractRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';

import allowanceRoutes from './routes/allowanceRoutes.js';
import positionRoutes from './routes/positionRoutes.js';

import stateDocumentRoutes from './routes/stateDocumentRoutes.js';
import insuranceConfigRoutes from './routes/insuranceConfigRoutes.js';

import payrollRoutes from './routes/payrollRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';

import dashboardRoutes from './routes/dashboardRoutes.js';
import concurrentlyRoutes from './routes/concurrentlyRoutes.js';

import holidayRoutes from './routes/holidayRoutes.js';
import staffRequestRoutes from './routes/staffRequest.js';

import resignationRoutes from './routes/resignationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// middleware
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://127.0.0.1:3000', // Đôi khi cần thiết
  'http://192.168.1.4:3000', // <--- THAY ĐỔI IP CỦA BẠN TẠI ĐÂY
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// --- PUBLIC ROUTES (Không cần đăng nhập) ---
app.use('/api/auth', authRoutes);

// Route quản lý kế hoạch tuyển dụng
app.use('/api/recruitment-plans', recruitmentPlanRoutes);

app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);

app.use('/api/candidates', candidateRoutes);

app.use('/api/jobtitles', jobTitleRoutes);

app.use('/api/contracts', contractRoutes);
app.use('/api/certificates', certificateRoutes);

app.use('/api/allowances', allowanceRoutes);
app.use('/api/positions', positionRoutes);

app.use('/api/state-documents', stateDocumentRoutes);
app.use('/api/insurance-configs', insuranceConfigRoutes);

app.use('/api/payroll', payrollRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/concurrently', concurrentlyRoutes);

app.use('/api/requests', staffRequestRoutes);

app.use('/api/holidays', holidayRoutes);
app.use('/api/resignations', resignationRoutes);

app.use('/api/reports', reportRoutes);

// --- PRIVATE ROUTES (Cần đăng nhập) ---
// Middleware protectedRoute sẽ chặn tất cả các request bên dưới nếu không có Token hợp lệ
app.use(protectedRoute);

app.use('/api/users', userRoutes);


// Khởi động Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy ở port ${PORT}`);
  });
});