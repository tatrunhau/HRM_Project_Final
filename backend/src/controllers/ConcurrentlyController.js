import initModels from '../models/init-models.js';
import { Sequelize } from 'sequelize';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});

const models = initModels(sequelize);

/**
 * 1. GET /api/concurrently
 * Lấy danh sách nhân viên để hiển thị lên bảng.
 */
export const getConcurrentList = async (req, res) => {
  try {
    const employees = await models.Employee.findAll({
      where: { layoff: null }, 
      attributes: ['employeeid', 'employeecode', 'name'],
      order: [['employeeid', 'ASC']],
      include: [
        { model: models.Department, as: 'department', attributes: ['departmentid', 'name'] },
        { model: models.Jobtitle, as: 'jobtitle', attributes: ['jobtitleid', 'name'] },
        {
          model: models.Position,
          as: 'positionid_positions', 
          // 👇 CẬP NHẬT: Thêm trường 'status' vào attributes
          attributes: ['positionid', 'name', 'status'],
          through: { attributes: [] } 
        }
      ]
    });

    const formattedData = employees.map(emp => {
      const e = emp.toJSON();
      const currentConcurrentPositions = e.positionid_positions || [];

      return {
        id: e.employeeid,
        code: e.employeecode || '---',
        name: e.name,
        deptId: e.department ? e.department.departmentid : null,
        deptName: e.department ? e.department.name : '---',
        mainJobId: e.jobtitle ? e.jobtitle.jobtitleid : null,
        mainJobName: e.jobtitle ? e.jobtitle.name : '---',

        // 👇 CẬP NHẬT: Trả về object đầy đủ thay vì chỉ mảng string tên
        subJobDetails: currentConcurrentPositions.map(p => ({
            id: p.positionid,
            name: p.name,
            status: p.status // true: Hoạt động, false: Ngừng
        })),
        
        // Vẫn giữ mảng ID để truyền vào Modal cho tiện
        subJobIds: currentConcurrentPositions.map(p => p.positionid)
      };
    });

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Lỗi lấy DS nhân viên kiêm nhiệm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};

/**
 * 2. POST /api/concurrently/update
 */
export const updateConcurrent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { employeeId, positionIds } = req.body; 

    if (!employeeId) {
      return res.status(400).json({ message: 'Thiếu ID nhân viên' });
    }

    // Bước 1: Xóa sạch các kiêm nhiệm cũ
    await models.EmployeePosition.destroy({
      where: { employeeid: employeeId },
      transaction: t
    });

    // Bước 2: Thêm mới
    if (positionIds && positionIds.length > 0) {
      const recordsToCreate = positionIds.map(posId => ({
        employeeid: employeeId,
        positionid: posId,
        startdate: new Date()
      }));

      await models.EmployeePosition.bulkCreate(recordsToCreate, { transaction: t });
    }

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật kiêm nhiệm thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật kiêm nhiệm:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

/**
 * 3. GET /api/concurrently/export
 * Xuất Excel danh sách nhân viên ĐÃ CÓ chức vụ kiêm nhiệm
 */
export const exportConcurrentEmployees = async (req, res) => {
  try {
    // Lấy dữ liệu giống hàm getConcurrentList nhưng lọc sẵn ở đây hoặc lọc bằng JS
    const employees = await models.Employee.findAll({
      where: { layoff: null },
      attributes: ['employeecode', 'name'],
      include: [
        { model: models.Department, as: 'department', attributes: ['name'] },
        { model: models.Jobtitle, as: 'jobtitle', attributes: ['name'] },
        {
          model: models.Position,
          as: 'positionid_positions',
          attributes: ['name'],
          through: { attributes: [] },
          required: true // ✨ QUAN TRỌNG: Chỉ lấy nhân viên CÓ liên kết với bảng Position (Inner Join)
        }
      ]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DS Kiêm Nhiệm');

    // Header
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH NHÂN SỰ KIÊM NHIỆM';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', size: 16, bold: true };

    const headerRow = worksheet.addRow(['STT', 'Mã NV', 'Họ Tên', 'Phòng Ban / Chức Danh Chính', 'Chức Vụ Kiêm Nhiệm']);
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data
    employees.forEach((emp, index) => {
      const e = emp.toJSON();
      // Nối các chức vụ kiêm nhiệm thành 1 chuỗi
      const concurrentStr = e.positionid_positions.map(p => p.name).join(', ');
      
      worksheet.addRow([
        index + 1,
        e.employeecode,
        e.name,
        `${e.department?.name || ''} - ${e.jobtitle?.name || ''}`,
        concurrentStr
      ]);
    });

    // Width
    worksheet.columns = [
      { width: 5 }, { width: 15 }, { width: 25 }, { width: 40 }, { width: 50 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachKiemNhiem.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    return res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};