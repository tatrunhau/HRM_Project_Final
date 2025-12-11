import initModels from '../models/init-models.js';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs'; // Cần import ExcelJS cho chức năng Export

dotenv.config();

const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});
const models = initModels(sequelize);

// ----------------------------------------------------------------------
// --- CÁC HÀM HELPER TƯƠNG TỰ TỪ AllowanceController ---
// ----------------------------------------------------------------------

// --- HELPER 1: Tạo mã viết tắt cơ bản (Base Acronym) ---
const generateBaseCode = (name) => {
  if (!name) return 'HD'; // Mã mặc định cho Hợp đồng
  // Lấy chữ cái đầu của mỗi từ, chuyển thành chữ hoa
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
      const existingContract = await models.Contract.findOne({
          where: { contractcode: finalCode },
          transaction: transaction // Sử dụng transaction để đảm bảo kiểm tra đồng bộ
      });

      if (!existingContract) {
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

// 1. Lấy danh sách hợp đồng (GET /contracts)
export const getAllContracts = async (req, res) => {
  try {
    // Lấy tất cả thuộc tính để phục vụ cho bảng dữ liệu
    const contracts = await models.Contract.findAll({
      attributes: ['contractid', 'contractcode', 'name', 'description', 'status'], 
      order: [['contractid', 'ASC']]
    });
    return res.status(200).json(contracts);
  } catch (error) {
    console.error("Lỗi lấy DS hợp đồng:", error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// 2. Tạo mới hợp đồng (POST /contracts)
export const createContract = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, status } = req.body;

    if (!name) { 
      return res.status(400).json({ message: 'Tên hợp đồng là bắt buộc!' });
    }
    
    // A. Sinh mã tự động và kiểm tra tính duy nhất
    const baseCode = generateBaseCode(name);
    const finalContractCode = await findUniqueCode(baseCode, t); 

    // B. Tạo record mới
    const newContract = await models.Contract.create({
      contractcode: finalContractCode, // <-- Dùng mã tự sinh duy nhất
      name, 
      description, 
      status: status !== undefined ? status : true, // Mặc định là true
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({ message: 'Thêm hợp đồng thành công!', data: newContract });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi tạo hợp đồng:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. Cập nhật hợp đồng (PUT /contracts/:id)
export const updateContract = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Không cho phép cập nhật contractcode vì nó được sinh tự động và là mã định danh
    if (updateData.contractcode) delete updateData.contractcode;

    const contract = await models.Contract.findByPk(id);
    if (!contract) {
      await t.rollback();
      return res.status(404).json({ message: 'Hợp đồng không tồn tại' });
    }

    await contract.update(updateData, { transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật hợp đồng:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. Xóa hợp đồng (DELETE /contracts/:id)
export const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await models.Contract.destroy({ where: { contractid: id } });
    
    if (deleted === 0) {
      return res.status(404).json({ message: 'Hợp đồng không tồn tại' });
    }

    return res.status(200).json({ message: 'Xóa hợp đồng thành công' });
  } catch (error) {
    console.error('Lỗi xóa hợp đồng:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 5. Xuất Excel (GET /contracts/export)
export const exportContracts = async (req, res) => {
  try {
    const contracts = await models.Contract.findAll({ order: [['contractid', 'ASC']] });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Hợp Đồng');

    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH LOẠI HỢP ĐỒNG';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', size: 16, bold: true };

    const headerRow = worksheet.addRow([
      'STT', 'Mã HĐ', 'Tên Hợp Đồng', 'Mô Tả', 'Trạng Thái'
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    const getStatusText = (status) => status === true ? 'Đang áp dụng' : 'Ngưng áp dụng';

    contracts.forEach((c, index) => {
      worksheet.addRow([
        index + 1,
        c.contractcode,
        c.name,
        c.description || '',
        getStatusText(c.status),
      ]);
    });

    worksheet.columns = [
      { width: 5 }, { width: 15 }, { width: 30 }, { width: 40 }, { width: 15 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachLoaiHopDong.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};