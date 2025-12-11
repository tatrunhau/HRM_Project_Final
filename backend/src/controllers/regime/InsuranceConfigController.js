// backend/src/controllers/salary/InsuranceConfigController.js

import initModels from '../../models/init-models.js';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
// XÓA DÒNG IMPORT BỊ LỖI NÀY:
// import { formatDateForDB } from '../../utils/formatDate.js'; 

dotenv.config();

// --- HÀM FORMAT DATE MỚI ĐƯỢC ĐỊNH NGHĨA TRỰC TIẾP ---
const formatDateForDB = (dateInput) => {
  if (!dateInput) return null;

  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date(dateInput);
  }

  // Kiểm tra ngày hợp lệ
  if (isNaN(date.getTime())) {
    return null; 
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
// --------------------------------------------------------

// Khởi tạo kết nối DB
const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});

const models = initModels(sequelize);

// 1. Lấy danh sách cấu hình (GET)
export const getAllInsuranceConfigs = async (req, res) => {
  try {
    const configs = await models.InsuranceConfig.findAll({
      // Lấy các cấu hình đang active
      where: { status: true },
      // Sắp xếp theo tên loại bảo hiểm để dễ quản lý
      order: [['insurancetype', 'ASC']], 
    });

    return res.status(200).json(configs);
  } catch (error) {
    console.error('Lỗi lấy danh sách cấu hình bảo hiểm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 2. Cập nhật cấu hình (PUT)
export const updateInsuranceConfig = async (req, res) => {
  const { id } = req.params;
  const { employeerate, employerrate, maxsalarybase, effectivedate } = req.body;

  try {
    const config = await models.InsuranceConfig.findByPk(id);

    if (!config) {
      return res.status(404).json({ message: 'Không tìm thấy cấu hình bảo hiểm' });
    }

    // Cập nhật các trường được phép sửa
    config.employeerate = parseFloat(employeerate); // Tỷ lệ
    config.employerrate = parseFloat(employerrate); // Tỷ lệ
    config.maxsalarybase = parseFloat(maxsalarybase); // Mức lương tối đa
    // SỬ DỤNG HÀM MỚI ĐỊNH NGHĨA Ở TRÊN
    config.effectivedate = formatDateForDB(effectivedate); 
    
    await config.save();

    return res.status(200).json({ message: 'Cập nhật cấu hình bảo hiểm thành công', config });
  } catch (error) {
    console.error(`Lỗi cập nhật cấu hình BHXH ID ${id}:`, error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};