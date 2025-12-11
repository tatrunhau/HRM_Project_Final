import initModels from '../models/init-models.js';
import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});
const models = initModels(sequelize);

// ----------------------------------------------------------------------
// --- CÁC HÀM HELPER ---
// ----------------------------------------------------------------------

// Tính phần trăm tăng trưởng: ((Mới - Cũ) / Cũ) * 100
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return (((current - previous) / previous) * 100).toFixed(1);
};

// Helper lấy ngày đầu tháng và cuối tháng
const getMonthRange = (year, month) => {
    // month đầu vào là 1-12
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Ngày cuối của tháng
    return { startDate, endDate };
};

// ----------------------------------------------------------------------
// --- CÁC CONTROLLER CHỨC NĂNG ---
// ----------------------------------------------------------------------

// 1. Lấy tổng quan thống kê Dashboard (GET /dashboard/summary)
export const getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYear = today.getFullYear();

    // Xác định thời gian tháng trước
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.getMonth() + 1;
    const lastMonthYear = lastMonthDate.getFullYear();

    // Các mốc thời gian quan trọng
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const startOfLastMonth = new Date(lastMonthYear, lastMonth - 1, 1);

    // ---------------------------------------------------
    // A. XỬ LÝ SỐ LIỆU NHÂN VIÊN (Total Employees)
    // ---------------------------------------------------
    
    // 1. Đếm nhân viên hiện tại (Active hoặc layoff trong tương lai)
    const currentEmployeesCount = await models.Employee.count({
      where: {
        [Op.or]: [
          { status: 'Active' }, // Hoặc logic check status cụ thể của bạn
          { layoff: { [Op.is]: null } },
          { layoff: { [Op.gt]: today } }
        ]
      }
    });

    // 2. Đếm nhân viên tại thời điểm cuối tháng trước (để so sánh)
    // Logic: Đã vào làm trước đầu tháng này AND (chưa nghỉ hoặc nghỉ sau đầu tháng này)
    const lastMonthEmployeesCount = await models.Employee.count({
        where: {
            joineddate: { [Op.lt]: startOfCurrentMonth },
            [Op.or]: [
                { layoff: { [Op.is]: null } },
                { layoff: { [Op.gte]: startOfCurrentMonth } }
            ]
        }
    });

    const employeeGrowth = calculateGrowth(currentEmployeesCount, lastMonthEmployeesCount);

    // ---------------------------------------------------
    // B. XỬ LÝ SỐ LIỆU TUYỂN DỤNG (Candidates)
    // ---------------------------------------------------

    // 1. Tổng đơn tuyển dụng (Không tính đã xóa)
    const totalCandidates = await models.Candidate.count({
      where: {
        isdeleted: { [Op.or]: [false, null] }
      }
    });

    // 2. Đang xử lý (Giả định status 1, 2 là đang xử lý - Cần map theo business logic thực tế)
    const processingCandidates = await models.Candidate.count({
      where: {
        status: { [Op.in]: [1, 2] }, 
        isdeleted: { [Op.or]: [false, null] }
      }
    });

    // ---------------------------------------------------
    // C. XỬ LÝ TỔNG LƯƠNG (Total Salary)
    // ---------------------------------------------------

    // Helper tính tổng lương theo tháng/năm
    const getSalarySum = async (m, y) => {
        const sum = await models.Salary.sum('netsalary', {
            where: { month: m, year: y }
        });
        return Number(sum) || 0;
    };

    const currentMonthSalary = await getSalarySum(currentMonth, currentYear);
    const lastMonthSalary = await getSalarySum(lastMonth, lastMonthYear);
    
    const salaryGrowth = calculateGrowth(currentMonthSalary, lastMonthSalary);

    // ---------------------------------------------------
    // D. XỬ LÝ TỶ LỆ GIỮ CHÂN (Retention Rate)
    // ---------------------------------------------------
    // Công thức: ((Nhân viên đầu kỳ - Nhân viên nghỉ trong kỳ) / Nhân viên đầu kỳ) * 100
    
    // 1. Tính cho tháng hiện tại
    const employeesLeftThisMonth = await models.Employee.count({
        where: {
            layoff: {
                [Op.gte]: startOfCurrentMonth,
                [Op.lte]: today
            }
        }
    });

    let retentionCurrent = 100;
    if (lastMonthEmployeesCount > 0) {
        retentionCurrent = ((lastMonthEmployeesCount - employeesLeftThisMonth) / lastMonthEmployeesCount) * 100;
    }

    // 2. Tính cho tháng trước (để so sánh growth)
    // Cần biết nhân viên đầu tháng trước (startOfLastMonth)
    const startOfLastMonthCount = await models.Employee.count({
        where: {
            joineddate: { [Op.lt]: startOfLastMonth },
            [Op.or]: [
                { layoff: { [Op.is]: null } },
                { layoff: { [Op.gte]: startOfLastMonth } }
            ]
        }
    });

    const employeesLeftLastMonth = await models.Employee.count({
        where: {
            layoff: {
                [Op.gte]: startOfLastMonth,
                [Op.lt]: startOfCurrentMonth
            }
        }
    });

    let retentionLastMonth = 100;
    if (startOfLastMonthCount > 0) {
        retentionLastMonth = ((startOfLastMonthCount - employeesLeftLastMonth) / startOfLastMonthCount) * 100;
    }

    const retentionGrowth = (retentionCurrent - retentionLastMonth).toFixed(1);

    // ---------------------------------------------------
    // E. TRẢ VỀ KẾT QUẢ
    // ---------------------------------------------------
    return res.status(200).json({
      employees: {
        value: currentEmployeesCount,
        growth: parseFloat(employeeGrowth),
        trend: parseFloat(employeeGrowth) >= 0 ? 'increase' : 'decrease'
      },
      candidates: {
        value: totalCandidates,
        processing: processingCandidates
      },
      salary: {
        value: currentMonthSalary,
        growth: parseFloat(salaryGrowth),
        trend: parseFloat(salaryGrowth) >= 0 ? 'increase' : 'decrease'
      },
      retention: {
        value: parseFloat(retentionCurrent.toFixed(1)),
        growth: parseFloat(retentionGrowth),
        trend: parseFloat(retentionGrowth) >= 0 ? 'increase' : 'decrease'
      }
    });

  } catch (error) {
    console.error('Lỗi lấy dữ liệu Dashboard:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};