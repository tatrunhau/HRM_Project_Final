import initModels from '../models/init-models.js';
import { Sequelize, Op } from 'sequelize';
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
  if (!name) return 'CV';
  const words = name.split(/\s+/).filter(word => word.length > 0);
  let acronym = '';
  words.forEach(word => {
      acronym += word.charAt(0).toUpperCase();
  });
  return acronym;
};

// --- HELPER 2: Tìm mã duy nhất ---
const findUniqueCode = async (baseCode, transaction) => {
  let finalCode = baseCode;
  let counter = 0;
  let exists = true;

  while (exists) {
      const existingPosition = await models.Position.findOne({ 
          where: { positioncode: finalCode },
          transaction: transaction 
      });

      if (!existingPosition) {
          exists = false;
      } else {
          counter++;
          finalCode = baseCode + counter;
      }
  }
  return finalCode;
};

// 1. Lấy danh sách chức vụ
export const getAllPositions = async (req, res) => {
  try {
    // BỔ SUNG: Thêm 'bonus'
    const positions = await models.Position.findAll({
      attributes: [
        'positionid', 'positioncode', 'name', 'status', 'bonus' 
      ],
      order: [['positionid', 'ASC']]
    });

    return res.status(200).json(positions);
  } catch (error) {
    console.error('Lỗi lấy DS chức vụ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 2. Tạo mới chức vụ
export const createPosition = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // BỔ SUNG: Thêm 'bonus'
    const { name, status, bonus, positioncode } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tên chức vụ là bắt buộc!' });
    }
    
    let finalPositionCode;
    if (positioncode) {
        // Nếu người dùng nhập mã, kiểm tra tính duy nhất
        const existingPosition = await models.Position.findOne({ 
            where: { positioncode },
            transaction: t
        });
        if (existingPosition) {
            await t.rollback();
            return res.status(400).json({ message: `Mã chức vụ "${positioncode}" đã tồn tại.` });
        }
        finalPositionCode = positioncode;
    } else {
        // Nếu người dùng không nhập mã, tạo mã tự động
        const baseCode = generateBaseCode(name);
        finalPositionCode = await findUniqueCode(baseCode, t); 
    }

    // B. Tạo record mới
    const newPosition = await models.Position.create({
      positioncode: finalPositionCode, 
      name, 
      status: status !== undefined ? status : true,
      bonus: bonus !== undefined ? bonus : null, 
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({ message: 'Thêm chức vụ thành công!', data: newPosition });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi tạo chức vụ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. Cập nhật chức vụ
export const updatePosition = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Mã (positioncode) không được sửa trong update.
    delete updateData.positioncode; 
    delete updateData.jobtitlecode;
    delete updateData.description; 

    const position = await models.Position.findByPk(id);
    if (!position) {
      await t.rollback();
      return res.status(404).json({ message: 'Chức vụ không tồn tại' });
    }

    await position.update(updateData, { transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật chức vụ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. Xóa chức vụ
export const deletePosition = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    
    // ✨ SỬA LỖI: Kiểm tra liên kết qua bảng trung gian employee_position
    // Giả định model của bảng trung gian là EmployeePosition
    const employeeCount = await models.EmployeePosition.count({
        where: { positionid: id },
        transaction: t
    });

    if (employeeCount > 0) {
        await t.rollback();
        return res.status(400).json({ message: `Không thể xóa: Vẫn còn ${employeeCount} nhân viên liên kết.` });
    }

    const deleted = await models.Position.destroy({ where: { positionid: id }, transaction: t }); 
    
    if (deleted === 0) {
        await t.rollback();
        return res.status(404).json({ message: 'Chức vụ không tồn tại' });
    }

    await t.commit();
    return res.status(200).json({ message: 'Xóa chức vụ thành công' });
  } catch (error) {
    await t.rollback();
    console.error('Lỗi xóa chức vụ:', error);
    // Vấn đề: Nếu models.EmployeePosition chưa được định nghĩa, lỗi sẽ xảy ra ở đây.
    // Nếu bạn muốn dùng logic cũ hơn (Employee.count), bạn cần đảm bảo cột đó tồn tại hoặc dùng liên kết qua include.
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 5. Xuất Excel
const getStatusText = (status) => status === true ? 'Hoạt động' : 'Ngừng hoạt động';

// ✨ HELPER định dạng phần trăm cho Excel
const formatPercentageForExcel = (amount) => {
    if (amount === null || amount === undefined) return '0%';
    // Nhân với 100 và làm tròn 2 chữ số thập phân, sau đó thêm ký hiệu %
    return `${(parseFloat(amount) * 100).toFixed(2)}%`;
};

export const exportPositions = async (req, res) => {
  try {
    const positions = await models.Position.findAll({
      order: [['positionid', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Chức Vụ');

    // Headers
    worksheet.mergeCells('A1:E1'); 
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH CHỨC VỤ';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', size: 16, bold: true };

    const headerRow = worksheet.addRow([
      'STT', 'Mã CV', 'Tên Chức Vụ', 'Trạng Thái', 'Phần trăm thưởng' // ✨ Cập nhật tiêu đề
    ]);

    // Style Header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data
    positions.forEach((p, index) => {
      const row = worksheet.addRow([
        index + 1,
        p.positioncode, 
        p.name,
        getStatusText(p.status),
        formatPercentageForExcel(p.bonus) // Sử dụng helper định dạng phần trăm
      ]);
      
      // Căn phải cho cột Phần trăm thưởng (cột E)
      row.getCell(5).alignment = { horizontal: 'right' };
    });

    // Finalize
    worksheet.columns = [
      { width: 5, alignment: { horizontal: 'center' } }, 
      { width: 15 }, 
      { width: 30 }, 
      { width: 15, alignment: { horizontal: 'center' } }, 
      { width: 20, alignment: { horizontal: 'right' } } // Căn phải cho cột Phần trăm
    ];
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachChucVu.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    return res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};