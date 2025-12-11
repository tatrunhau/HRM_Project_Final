import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './libs/db.js';

// Import các routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
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
import staffRequestRoutes from './routes/staffRequest.js';
import holidayRoutes from './routes/holidayRoutes.js';
import resignationRoutes from './routes/resignationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// Cấu hình Dotenv
dotenv.config();

// Kết nối Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// --- CẤU HÌNH CORS (ĐÃ SỬA) ---
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:5173',
  process.env.CLIENT_URL, // Lấy từ biến môi trường trên Render
  'https://hrm-system-frontend-sage.vercel.app' // Hardcode luôn URL Vercel của bạn để chắc chắn chạy
];

app.use(cors({
  origin: function (origin, callback) {
    // Cho phép request không có origin (như Postman, Mobile App) hoặc origin nằm trong danh sách cho phép
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin); // Log ra để debug nếu bị chặn
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Cho phép cookie/token
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// -----------------------------

app.use(express.json()); // Để parse JSON body
app.use(cookieParser()); // Để parse cookie

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
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

app.use(protectedRoute);

app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS Origins:`, allowedOrigins); // Log để kiểm tra
});