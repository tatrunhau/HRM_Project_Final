import initModels from '../models/init-models.js';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs'; // Cần import cho chức năng Export
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

// Tạo mã viết tắt cơ bản (Base Acronym)
const generateBaseCode = (name) => {
  if (!name) return 'CC'; // Mã mặc định cho Chứng chỉ
  // Lấy chữ cái đầu của mỗi từ, chuyển thành chữ hoa
  const words = name.split(/\s+/).filter(word => word.length > 0);
  let acronym = '';
  words.forEach(word => {
      acronym += word.charAt(0).toUpperCase();
  });
  return acronym;
};

// Tìm mã duy nhất (Thêm số nếu trùng)
const findUniqueCode = async (baseCode, transaction) => {
  let finalCode = baseCode;
  let counter = 0;
  let exists = true;

  while (exists) {
      const existingCertificate = await models.Certificate.findOne({
          where: { certificatecode: finalCode },
          transaction: transaction
      });

      if (!existingCertificate) {
          exists = false;
      } else {
          counter++;
          finalCode = baseCode + counter;
      }
  }
  return finalCode;
};

// ----------------------------------------------------------------------
// --- CÁC CONTROLLER CHỨC NĂNG ---
// ----------------------------------------------------------------------

// 1. Lấy danh sách chứng chỉ (Đã có, bổ sung thêm thuộc tính status)
export const getAllCertificates = async (req, res) => {
  try {
    const certificates = await models.Certificate.findAll({
      // Bổ sung status để hiển thị trên bảng
      attributes: ['certificateid', 'name', 'certificatecode', 'status'], 
      order: [['certificateid', 'ASC']]
    });
    return res.status(200).json(certificates);
  } catch (error) {
    console.error("Lỗi lấy DS bằng cấp:", error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// 2. Tạo mới chứng chỉ (POST /certificates)
export const createCertificate = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, status } = req.body;

    if (!name) { 
      return res.status(400).json({ message: 'Tên chứng chỉ là bắt buộc!' });
    }
    
    // A. Sinh mã tự động và kiểm tra tính duy nhất
    const baseCode = generateBaseCode(name);
    const finalCertificateCode = await findUniqueCode(baseCode, t); 

    // B. Tạo record mới
    const newCertificate = await models.Certificate.create({
      certificatecode: finalCertificateCode, // <-- Mã tự sinh
      name, 
      status: status !== undefined ? status : true, // Mặc định là true
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({ message: 'Thêm chứng chỉ thành công!', data: newCertificate });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi tạo chứng chỉ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. Cập nhật chứng chỉ (PUT /certificates/:id)
export const updateCertificate = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Không cho phép cập nhật mã chứng chỉ
    if (updateData.certificatecode) delete updateData.certificatecode;

    const certificate = await models.Certificate.findByPk(id);
    if (!certificate) {
      await t.rollback();
      return res.status(404).json({ message: 'Chứng chỉ không tồn tại' });
    }

    await certificate.update(updateData, { transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật chứng chỉ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. Xóa chứng chỉ (DELETE /certificates/:id)
export const deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await models.Certificate.destroy({ where: { certificateid: id } });
    
    if (deleted === 0) {
      return res.status(404).json({ message: 'Chứng chỉ không tồn tại' });
    }

    return res.status(200).json({ message: 'Xóa chứng chỉ thành công' });
  } catch (error) {
    console.error('Lỗi xóa chứng chỉ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 5. Xuất Excel (GET /certificates/export)
export const exportCertificates = async (req, res) => {
  try {
    const certificates = await models.Certificate.findAll({ order: [['certificateid', 'ASC']] });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Chứng Chỉ');

    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH CHỨNG CHỈ';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', size: 16, bold: true };

    const headerRow = worksheet.addRow([
      'STT', 'Mã CC', 'Tên Chứng Chỉ', 'Trạng Thái'
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    const getStatusText = (status) => status === true ? 'Đang áp dụng' : 'Ngưng áp dụng';

    certificates.forEach((c, index) => {
      worksheet.addRow([
        index + 1,
        c.certificatecode,
        c.name,
        getStatusText(c.status),
      ]);
    });

    worksheet.columns = [
      { width: 5 }, { width: 15 }, { width: 40 }, { width: 15 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachChungChi.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};