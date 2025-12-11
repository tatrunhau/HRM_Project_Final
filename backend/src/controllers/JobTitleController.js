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

// --- HELPER 1: Tạo mã viết tắt cơ bản (Kế toán -> KT) ---
const generateBaseCode = (name) => {
  if (!name) return 'CV';
  // Lấy chữ cái đầu của mỗi từ, chuyển thành chữ hoa
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
      const existingJobtitle = await models.Jobtitle.findOne({ 
          where: { jobtitlecode: finalCode },
          transaction: transaction 
      });

      if (!existingJobtitle) {
          exists = false;
      } else {
          counter++;
          finalCode = baseCode + counter;
      }
  }
  return finalCode;
};

// 1. Lấy danh sách chức vụ (GET)
export const getAllJobTitles = async (req, res) => {
  try {
    // Lấy tất cả các cột theo Model jobtitle.js
    const jobTitles = await models.Jobtitle.findAll({
      attributes: ['jobtitleid', 'jobtitlecode', 'name', 'description'],
      order: [['jobtitleid', 'ASC']]
    });

    return res.status(200).json(jobTitles);
  } catch (error) {
    console.error('Lỗi lấy DS chức vụ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 2. Tạo mới chức vụ (POST)
export const createJobTitle = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description } = req.body; 

    if (!name) {
      return res.status(400).json({ message: 'Tên chức vụ là bắt buộc!' });
    }
    
    const baseCode = generateBaseCode(name);
    const finalJobTitleCode = await findUniqueCode(baseCode, t); 

    const newJobTitle = await models.Jobtitle.create({
      jobtitlecode: finalJobTitleCode, 
      name, 
      description,
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({ message: 'Thêm chức vụ thành công!', data: newJobTitle });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi tạo chức vụ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. Cập nhật chức vụ (PUT /:id)
export const updateJobTitle = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Không cho phép cập nhật jobtitlecode
    if (updateData.jobtitlecode) delete updateData.jobtitlecode;

    const jobTitle = await models.Jobtitle.findByPk(id); 
    if (!jobTitle) {
      await t.rollback();
      return res.status(404).json({ message: 'Chức vụ không tồn tại' });
    }

    await jobTitle.update(updateData, { transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật chức vụ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. Xóa chức vụ (DELETE /:id)
export const deleteJobTitle = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    
    // KIỂM TRA RÀNG BUỘC: Bảng Employee link đến Jobtitle này
    const employeeCount = await models.Employee.count({
        where: { jobtitleid: id } 
    });

    if (employeeCount > 0) {
        await t.rollback();
        return res.status(400).json({ message: `Không thể xóa: Vẫn còn ${employeeCount} nhân viên liên kết.` });
    }

    const deleted = await models.Jobtitle.destroy({ where: { jobtitleid: id }, transaction: t });
    
    if (deleted === 0) {
        await t.rollback();
        return res.status(404).json({ message: 'Chức vụ không tồn tại' });
    }

    await t.commit();
    return res.status(200).json({ message: 'Xóa chức vụ thành công' });
  } catch (error) {
    await t.rollback();
    console.error('Lỗi xóa chức vụ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 5. Xuất Excel
export const exportJobTitles = async (req, res) => {
  try {
    const jobTitles = await models.Jobtitle.findAll({
      attributes: ['jobtitleid', 'jobtitlecode', 'name', 'description'],
      order: [['jobtitleid', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Chức Danh');

    worksheet.mergeCells('A1:D1'); 
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH CHỨC DANH';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', size: 16, bold: true };

    const headerRow = worksheet.addRow([
      'STT', 'Mã CD', 'Tên Chức Danh', 'Mô Tả'
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    jobTitles.forEach((p, index) => {
      worksheet.addRow([
        index + 1,
        p.jobtitlecode, 
        p.name,
        p.description,
      ]);
    });

    worksheet.columns = [
      { width: 5 }, { width: 15 }, { width: 30 }, { width: 40 }
    ];
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachChucDanh.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    return res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};