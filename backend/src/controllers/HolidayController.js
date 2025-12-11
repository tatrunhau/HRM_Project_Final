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

// 1. Lấy danh sách ngày nghỉ
export const getAllHolidays = async (req, res) => {
  try {
    const holidays = await models.Holiday.findAll({
      order: [['start_date', 'DESC']]
    });
    return res.status(200).json(holidays);
  } catch (error) {
    console.error('Lỗi lấy DS ngày nghỉ:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// 2. Tạo mới ngày nghỉ
export const createHoliday = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { holiday_name, start_date, end_date, is_annual } = req.body;

    // Validate cơ bản
    if (!holiday_name || !start_date || !end_date) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
    }
    if (new Date(start_date) > new Date(end_date)) {
        return res.status(400).json({ message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.' });
    }

    const newHoliday = await models.Holiday.create({
      holiday_name,
      start_date,
      end_date,
      is_annual: is_annual || false
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({ message: 'Thêm ngày nghỉ thành công!', data: newHoliday });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi tạo ngày nghỉ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. Cập nhật ngày nghỉ
export const updateHoliday = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { holiday_name, start_date, end_date, is_annual } = req.body;

    const holiday = await models.Holiday.findByPk(id);
    if (!holiday) {
      await t.rollback();
      return res.status(404).json({ message: 'Ngày nghỉ không tồn tại' });
    }

    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
        await t.rollback();
        return res.status(400).json({ message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.' });
    }

    await holiday.update({
        holiday_name, start_date, end_date, is_annual
    }, { transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật ngày nghỉ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. Xóa ngày nghỉ
export const deleteHoliday = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const deleted = await models.Holiday.destroy({ where: { holiday_id: id }, transaction: t });
    
    if (deleted === 0) {
        await t.rollback();
        return res.status(404).json({ message: 'Ngày nghỉ không tồn tại' });
    }

    await t.commit();
    return res.status(200).json({ message: 'Xóa ngày nghỉ thành công' });
  } catch (error) {
    await t.rollback();
    console.error('Lỗi xóa ngày nghỉ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 5. Xuất Excel
export const exportHolidays = async (req, res) => {
  try {
    const holidays = await models.Holiday.findAll({ order: [['start_date', 'DESC']] });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Ngày Nghỉ');

    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH NGÀY NGHỈ';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', size: 16, bold: true };

    const headerRow = worksheet.addRow(['STT', 'Tên Ngày Nghỉ', 'Từ Ngày', 'Đến Ngày', 'Loại Nghỉ']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    holidays.forEach((h, index) => {
      worksheet.addRow([
        index + 1,
        h.holiday_name,
        h.start_date,
        h.end_date,
        h.is_annual ? 'Hằng năm' : 'Một lần',
      ]);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachNgayNghi.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    return res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};