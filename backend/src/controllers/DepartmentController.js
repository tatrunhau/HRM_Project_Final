import initModels from '../models/init-models.js';
import { Sequelize, Op } from 'sequelize';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs'; // Thư viện xuất Excel

dotenv.config();

const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});

const models = initModels(sequelize);

// --- HELPER 1: Tạo mã viết tắt cơ bản (Base Acronym) ---
const generateBaseCode = (name) => {
  if (!name) return 'PB'; 
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
      const existingDepartment = await models.Department.findOne({
          where: { departmentcode: finalCode },
          transaction: transaction 
      });

      if (!existingDepartment) {
          exists = false;
      } else {
          counter++;
          finalCode = baseCode + counter;
      }
  }
  return finalCode;
};

// 1. Lấy danh sách phòng ban (GET)
export const getAllDepartments = async (req, res) => {
  try {
    // Lấy đầy đủ các thuộc tính cần thiết cho bảng hiển thị
    const departments = await models.Department.findAll({
      attributes: [
        'departmentid', 'departmentcode', 'name', 'description', 
        'status', 'notes', 'employeecount'
      ],
      order: [['departmentid', 'ASC']]
    });

    return res.status(200).json(departments);
  } catch (error) {
    console.error('Lỗi lấy DS phòng ban:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

// 2. Tạo mới phòng ban (POST)
export const createDepartment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, status, notes } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tên phòng ban là bắt buộc!' });
    }
    
    // A. Sinh mã tự động và kiểm tra tính duy nhất
    const baseCode = generateBaseCode(name);
    const finalDepartmentCode = await findUniqueCode(baseCode, t); 

    // B. Tạo record mới
    const newDepartment = await models.Department.create({
      departmentcode: finalDepartmentCode, // Mã tự sinh
      name, 
      description, 
      status: status !== undefined ? status : true, // Mặc định true nếu không gửi
      notes,
      employeecount: 0 // Mới tạo, số lượng NV mặc định là 0
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({ message: 'Thêm phòng ban thành công!', data: newDepartment });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi tạo phòng ban:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. Cập nhật phòng ban (PUT /:id)
export const updateDepartment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Không cho phép cập nhật departmentcode và employeecount
    if (updateData.departmentcode) delete updateData.departmentcode;
    if (updateData.employeecount) delete updateData.employeecount;

    const department = await models.Department.findByPk(id);
    if (!department) {
      await t.rollback();
      return res.status(404).json({ message: 'Phòng ban không tồn tại' });
    }

    await department.update(updateData, { transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật phòng ban:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. Xóa phòng ban (DELETE /:id)
export const deleteDepartment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    
    // ⚠️ KIỂM TRA QUAN TRỌNG: Không thể xóa nếu còn nhân viên liên kết
    const employeeCount = await models.Employee.count({
        where: { departmentid: id }
    });

    if (employeeCount > 0) {
        await t.rollback();
        return res.status(400).json({ message: `Không thể xóa: Vẫn còn ${employeeCount} nhân viên liên kết.` });
    }

    const deleted = await models.Department.destroy({ where: { departmentid: id }, transaction: t });
    
    if (deleted === 0) {
        await t.rollback();
        return res.status(404).json({ message: 'Phòng ban không tồn tại' });
    }

    await t.commit();
    return res.status(200).json({ message: 'Xóa phòng ban thành công' });
  } catch (error) {
    await t.rollback();
    console.error('Lỗi xóa phòng ban:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 5. Xuất Excel (GET /export)
export const exportDepartments = async (req, res) => {
  try {
    const departments = await models.Department.findAll({
      order: [['departmentid', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Phòng Ban');

    // Headers
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH PHÒNG BAN';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', size: 16, bold: true };

    const headerRow = worksheet.addRow([
      'STT', 'Mã PB', 'Tên Phòng Ban', 'Mô Tả', 'Ghi Chú', 'Số Lượng NV', 'Trạng Thái'
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data
    const getStatusText = (status) => status === true ? 'Hoạt động' : 'Ngừng hoạt động';

    departments.forEach((d, index) => {
      worksheet.addRow([
        index + 1,
        d.departmentcode,
        d.name,
        d.description,
        d.notes,
        d.employeecount,
        getStatusText(d.status),
      ]);
    });

    // Finalize
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachPhongBan.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    return res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};