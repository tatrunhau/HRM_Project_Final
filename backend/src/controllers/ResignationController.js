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

// 1. Lấy danh sách
export const getAllResignations = async (req, res) => {
  try {
    const resignations = await models.Resignation.findAll({
      order: [['createddate', 'DESC']],
      include: [
        { 
            model: models.Employee, 
            as: "employee", 
            attributes: ['name', 'employeecode', 'departmentid', 'jobtitleid'],
            include: [
                { model: models.Department, as: "department", attributes: ['name'] }
            ]
        }
      ]
    });
    return res.status(200).json(resignations);
  } catch (error) {
    console.error('Lỗi lấy DS nghỉ việc:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 2. Tạo hồ sơ (MẶC ĐỊNH LÀ PENDING - CHƯA CẬP NHẬT NHÂN VIÊN)
export const createResignation = async (req, res) => {
  try {
    const { employeeid, resignationdate, reason } = req.body;

    const newResignation = await models.Resignation.create({
      employeeid,
      resignationdate,
      reason,
      status: 'Pending', // Mặc định là Chờ duyệt
      createddate: new Date()
    });

    return res.status(201).json({ 
        message: 'Đã tạo hồ sơ, đang chờ duyệt!', 
        data: newResignation 
    });

  } catch (error) {
    console.error('Lỗi tạo hồ sơ:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 3. Cập nhật hồ sơ (DUYỆT ĐƠN -> CẬP NHẬT NHÂN VIÊN)
export const updateResignation = async (req, res) => {
  const t = await sequelize.transaction(); // Dùng transaction để an toàn dữ liệu
  try {
    const { id } = req.params;
    const { resignationdate, reason, status } = req.body;

    const record = await models.Resignation.findByPk(id);
    if (!record) {
        await t.rollback();
        return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
    }

    // Cập nhật thông tin Resignation
    await record.update({ 
        resignationdate, 
        reason, 
        status: status || record.status 
    }, { transaction: t });

    // LOGIC QUAN TRỌNG: Nếu trạng thái chuyển thành 'Approved' -> Update Nhân viên
    if (status === 'Approved') {
        await models.Employee.update({
            status: 'Resigned', // Đổi trạng thái nhân viên
            layoff: resignationdate // Ghi nhận ngày nghỉ
        }, {
            where: { employeeid: record.employeeid },
            transaction: t
        });
    }

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 4. Xóa
export const deleteResignation = async (req, res) => {
  try {
    const { id } = req.params;
    await models.Resignation.destroy({ where: { resignationid: id } });
    return res.status(200).json({ message: 'Xóa hồ sơ thành công' });
  } catch (error) {
    console.error('Lỗi xóa:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 5. Xuất Excel
export const exportResignations = async (req, res) => {
  try {
    const data = await models.Resignation.findAll({
      include: [{ 
          model: models.Employee, as: "employee", 
          include: [{ model: models.Department, as: "department" }]
      }]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DS Nghi Viec');

    worksheet.addRow(['STT', 'Mã NV', 'Họ Tên', 'Phòng Ban', 'Ngày Nghỉ', 'Lý Do', 'Trạng Thái']);
    // Format header giống file EmployeeController cũ...
    
    data.forEach((item, index) => {
      worksheet.addRow([
        index + 1,
        item.employee?.employeecode,
        item.employee?.name,
        item.employee?.department?.name,
        item.resignationdate,
        item.reason,
        item.status
      ]);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DS_NghiViec.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xuất Excel' });
  }
};