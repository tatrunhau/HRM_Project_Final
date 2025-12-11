import initModels from '../models/init-models.js';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';

dotenv.config();

const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});

const models = initModels(sequelize);

// --- HELPER 1: Tạo mã viết tắt cơ bản (Base Acronym) ---
const generateBaseCode = (name) => {
  if (!name) return 'PC';
  // Lấy chữ cái đầu của mỗi từ, chuyển thành chữ hoa
  // Ví dụ: "Phụ cấp cơm trưa" -> PCCT
  const words = name.split(/\s+/).filter(word => word.length > 0);
  let acronym = '';
  words.forEach(word => {
      acronym += word.charAt(0).toUpperCase();
  });
  return acronym;
};

// --- HELPER 2: Tìm mã duy nhất (Thêm số nếu trùng) ---
const findUniqueCode = async (baseCode, transaction) => {
  let finalCode = baseCode;
  let counter = 0;
  let exists = true;

  while (exists) {
      const existingAllowance = await models.Allowance.findOne({
          where: { allowancecode: finalCode },
          transaction: transaction // Sử dụng transaction để đảm bảo kiểm tra đồng bộ
      });

      if (!existingAllowance) {
          exists = false;
      } else {
          counter++;
          finalCode = baseCode + counter;
      }
  }
  return finalCode;
};

// 1. Lấy danh sách phụ cấp
export const getAllAllowances = async (req, res) => {
  try {
    const allowances = await models.Allowance.findAll({
      attributes: [
        'allowanceid', 'allowancecode', 'name', 'amount', 'condition', 
        'status', 'apply_to_all', 'effectivedate'
      ],
      order: [['allowanceid', 'ASC']]
    });
    return res.status(200).json(allowances);
  } catch (error) {
    console.error('Lỗi lấy DS phụ cấp:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// 2. Tạo mới phụ cấp (SỬA LẠI LOGIC TỰ SINH MÃ)
export const createAllowance = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      name, amount, condition, status, 
      apply_to_all, effectivedate
    } = req.body;

    if (!name) { // Chỉ cần tên là bắt buộc
      return res.status(400).json({ message: 'Tên phụ cấp là bắt buộc!' });
    }
    
    // A. Sinh mã tự động và kiểm tra tính duy nhất
    const baseCode = generateBaseCode(name);
    const finalAllowanceCode = await findUniqueCode(baseCode, t); 

    // B. Tạo record mới
    const newAllowance = await models.Allowance.create({
      allowancecode: finalAllowanceCode, // <-- Dùng mã tự sinh duy nhất
      name, 
      amount, 
      condition, 
      status: status !== undefined ? status : true,
      apply_to_all: apply_to_all !== undefined ? apply_to_all : true,
      effectivedate
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({ message: 'Thêm phụ cấp thành công!', data: newAllowance });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi tạo phụ cấp:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. Cập nhật phụ cấp
export const updateAllowance = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Không cho phép cập nhật allowancecode vì nó được sinh tự động và là mã định danh
    if (updateData.allowancecode) delete updateData.allowancecode;

    const allowance = await models.Allowance.findByPk(id);
    if (!allowance) {
      await t.rollback();
      return res.status(404).json({ message: 'Phụ cấp không tồn tại' });
    }

    // Nếu tên (name) bị thay đổi, ta không cần sinh lại mã (code), chỉ update các trường khác
    await allowance.update(updateData, { transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật phụ cấp:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. Xóa phụ cấp
export const deleteAllowance = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await models.Allowance.destroy({ where: { allowanceid: id } });
    
    if (deleted === 0) {
      return res.status(404).json({ message: 'Phụ cấp không tồn tại' });
    }

    return res.status(200).json({ message: 'Xóa phụ cấp thành công' });
  } catch (error) {
    console.error('Lỗi xóa phụ cấp:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 5. Xuất Excel (Giữ nguyên)
export const exportAllowances = async (req, res) => {
  try {
    const allowances = await models.Allowance.findAll({ order: [['allowanceid', 'ASC']] });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Phụ Cấp');

    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH PHỤ CẤP';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', size: 16, bold: true };

    const headerRow = worksheet.addRow([
      'STT', 'Mã PC', 'Tên Phụ Cấp', 'Số Tiền', 'Điều Kiện', 'Ngày Hiệu Lực', 'Phạm Vi', 'Trạng Thái'
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    const getApplyToAllText = (apply) => apply === true ? 'Toàn bộ nhân viên' : 'Tùy chọn';
    const getStatusText = (status) => status === true ? 'Đang áp dụng' : 'Ngưng áp dụng';

    allowances.forEach((a, index) => {
      worksheet.addRow([
        index + 1,
        a.allowancecode,
        a.name,
        a.amount,
        a.condition,
        a.effectivedate,
        getApplyToAllText(a.apply_to_all),
        getStatusText(a.status),
      ]);
    });

    worksheet.columns = [
      { width: 5 }, { width: 15 }, { width: 30 }, { width: 15 }, { width: 30 }, 
      { width: 15 }, { width: 15 }, { width: 15 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachPhuCap.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};