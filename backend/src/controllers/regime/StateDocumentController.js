// controllers/document/StateDocumentController.js

import initModels from '../../models/init-models.js';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';

dotenv.config();

// Khởi tạo kết nối DB
const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});

const models = initModels(sequelize);

// --- CÁC HÀM CRUD ---

// 1. Lấy danh sách văn bản (GET)
export const getAllStateDocuments = async (req, res) => {
  try {
    const documents = await models.Document.findAll({
      order: [['documentid', 'DESC']],
    });
    return res.status(200).json(documents);
  } catch (error) {
    console.error('Lỗi lấy danh sách văn bản:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 2. Lấy chi tiết 1 văn bản (GET /:id)
export const getStateDocumentById = async (req, res) => {
  // ... Logic tương tự getRecruitmentPlanById
  return res.status(501).json({ message: 'Not Implemented' });
};

// 3. Tạo mới văn bản (POST)
export const createStateDocument = async (req, res) => {
  try {
    const { documentCode, name, type, description, file_url } = req.body;

    if (!documentCode || !name || !type) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc: Số, Tên và Loại!' });
    }

    const newDocument = await models.Document.create({
      documentcode: documentCode,
      name: name,
      type: type,
      description: description,
      filepath: file_url, // Lưu file path vào trường filepath
    });

    return res.status(201).json({ message: 'Tạo văn bản thành công!', data: newDocument });

  } catch (error) {
    console.error('Lỗi tạo văn bản:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};

// 4. Cập nhật văn bản (PUT /:id)
export const updateStateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { documentCode, name, type, description, file_url } = req.body;

    const document = await models.Document.findByPk(id);
    if (!document) {
      return res.status(404).json({ message: 'Văn bản không tồn tại' });
    }

    await document.update({
      documentcode: documentCode,
      name: name,
      type: type,
      description: description,
      filepath: file_url,
    });

    return res.status(200).json({ message: 'Cập nhật thành công!', data: document });
  } catch (error) {
    console.error('Lỗi cập nhật văn bản:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 5. Xóa văn bản (DELETE /:id)
export const deleteStateDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Tìm văn bản xem có tồn tại không
    const document = await models.Document.findByPk(id);

    if (!document) {
      return res.status(404).json({ message: 'Văn bản không tồn tại' });
    }

    // 2. Thực hiện xóa trong Database
    await document.destroy();

    // 3. Trả về thông báo thành công
    return res.status(200).json({ message: 'Xóa văn bản thành công!' });

  } catch (error) {
    console.error('Lỗi xóa văn bản:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};


// --- HÀM EXPORT EXCEL ---
export const exportStateDocuments = async (req, res) => {
  try {
    const documents = await models.Document.findAll({ order: [['documentid', 'DESC']] });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Văn Bản Nhà Nước');

    // Tiêu Đề
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH VĂN BẢN NHÀ NƯỚC';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', family: 4, size: 16, bold: true };

    // Header Cột
    const headerRow = worksheet.addRow([
      'STT', 
      'Số Văn Bản', 
      'Loại Văn Bản', 
      'Tên/Tiêu Đề', 
      'Trích Yếu/Mô Tả', 
      'Ngày Tạo',
      'File Đính Kèm'
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Đổ Dữ Liệu
    documents.forEach((doc, index) => {
      const row = worksheet.addRow([
        index + 1,
        doc.documentcode,
        doc.type,
        doc.name,
        doc.description,
        doc.createddate ? new Date(doc.createddate).toLocaleDateString('vi-VN') : '',
        doc.filepath ? 'Xem File' : ''
      ]);

      // Xử lý Hyperlink cho cột File (Cột thứ 7 - G)
      if (doc.filepath) {
        const fileCell = row.getCell(7);
        fileCell.value = { text: 'Xem File', hyperlink: doc.filepath, tooltip: 'Nhấn để mở file' };
        fileCell.font = { color: { argb: '0000FF' }, underline: true };
      }

      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // Chỉnh độ rộng cột
    worksheet.columns = [
      { width: 5 },  // STT
      { width: 15 }, // Số VB
      { width: 15 }, // Loại VB
      { width: 35 }, // Tên/Tiêu đề
      { width: 40 }, // Trích yếu
      { width: 15 }, // Ngày Tạo
      { width: 15 }, // File
    ];

    // Trả về file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachVanBanNhaNuoc.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel Văn bản Nhà nước:', error);
    res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};