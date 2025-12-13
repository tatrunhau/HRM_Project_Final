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

// --- HELPER: Sinh mã nhân viên ---
// Quy tắc: JobCode + DeptCode + EmployeeID (VD: ITPNS1)
const generateEmployeeCode = async (jobId, deptId, recordId) => {
  try {
    const job = await models.Jobtitle.findByPk(jobId);
    const dept = await models.Department.findByPk(deptId);
    
    const jobCode = job ? job.jobtitlecode : 'XX';
    const deptCode = dept ? dept.departmentcode : 'YY';
    
    return `${jobCode}${deptCode}${recordId}`;
  } catch (error) {
    console.error("Lỗi sinh mã NV:", error);
    return `NV${recordId}`;
  }
};

// 1. Lấy danh sách nhân viên
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await models.Employee.findAll({
      order: [['employeeid', 'DESC']],
      include: [
        { model: models.Jobtitle, as: "jobtitle", attributes: ['name', 'jobtitlecode'] },
        { model: models.Department, as: "department", attributes: ['name', 'departmentcode'] },
        { model: models.Contract, as: "contract", attributes: ['name'] },
        { model: models.Certificate, as: "educationlevel_certificate", attributes: ['name'] },
        // Lấy link file từ Profile
        { model: models.Profile, as: "profiles", attributes: ['uniquefilename'], limit: 1 }
      ]
    });

    const formattedData = employees.map(e => {
      const data = e.toJSON();
      data.cv_file = data.profiles && data.profiles.length > 0 ? data.profiles[0].uniquefilename : null;
      return data;
    });

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Lỗi lấy danh sách NV:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 2. Lấy chi tiết nhân viên
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 👇 SỬA ĐOẠN NÀY: Thêm include Jobtitle, Department, Certificate
    const employee = await models.Employee.findByPk(id, {
      include: [
        // Lấy thông tin file hồ sơ
        { model: models.Profile, as: "profiles" },
        
        // 👇 BỔ SUNG CÁC DÒNG NÀY ĐỂ HIỂN THỊ TÊN TRÊN PAGE
        { 
            model: models.Jobtitle, 
            as: "jobtitle", 
            attributes: ['name', 'jobtitlecode'] 
        },
        { 
            model: models.Department, 
            as: "department", 
            attributes: ['name', 'departmentcode'] 
        },
        { 
            model: models.Certificate, 
            as: "educationlevel_certificate", // Lưu ý: Alias này phải khớp với model relation (trong init-models)
            attributes: ['name'] 
        },
        { 
            model: models.Contract, 
            as: "contract", 
            attributes: ['name'] 
        }
      ]
    });

    if (!employee) return res.status(404).json({ message: 'Không tìm thấy nhân viên' });

    const data = employee.toJSON();
    // Flatten link file (giữ nguyên logic cũ của bạn)
    data.cv_file = data.profiles && data.profiles.length > 0 ? data.profiles[0].uniquefilename : null;

    return res.status(200).json(data);
  } catch (error) {
    console.error("Lỗi getEmployeeById:", error); // Log lỗi ra xem nếu alias sai
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 3. Tạo mới nhân viên
export const createEmployee = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      name, dateofbirth, gender, maritalstatus, religion,
      email, phonenumber, cccd,
      departmentid, jobtitleid, contractid, educationlevel,
      joineddate, status, basicsalary, note, cv_file, dependents
    } = req.body;

    // A. Tạo record Employee
    const newEmployee = await models.Employee.create({
      name, dateofbirth, gender, maritalstatus, religion,
      email, phonenumber, cccd,
      departmentid, jobtitleid, contractid, educationlevel,
      joineddate: joineddate || new Date(),
      status: status || 'Probation',
      basicsalary,
      dependents: dependents || 0,
      note,
      layoff: null // Mới tạo chưa nghỉ việc
    }, { transaction: t });

    // B. Sinh mã nhân viên và Update lại
    const empCode = await generateEmployeeCode(jobtitleid, departmentid, newEmployee.employeeid);
    await newEmployee.update({ employeecode: empCode }, { transaction: t });

    // C. Lưu file vào Profile (Nếu có)
    if (cv_file) {
      await models.Profile.create({
        profilecode: `PF_E${newEmployee.employeeid}`,
        employeeid: newEmployee.employeeid, // Gắn vào nhân viên
        uniquefilename: cv_file,
        candidateid: null // Không phải ứng viên
      }, { transaction: t });
    }

    await t.commit();
    return res.status(201).json({ message: 'Thêm nhân viên thành công!', data: newEmployee });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi tạo nhân viên:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. Cập nhật nhân viên
export const updateEmployee = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      name, dateofbirth, gender, maritalstatus, religion,
      email, phonenumber, cccd,
      departmentid, jobtitleid, contractid, educationlevel,
      joineddate, status, basicsalary, layoff, note, cv_file, dependents
    } = req.body;

    const employee = await models.Employee.findByPk(id);
    if (!employee) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
    }

    // A. Cập nhật thông tin chính
    // Kiểm tra nếu đổi phòng ban hoặc chức vụ thì có cần sinh lại mã không?
    // Thường thì KHÔNG đổi mã nhân viên cũ, nên ta giữ nguyên mã cũ.
    
    await employee.update({
      name, dateofbirth, gender, maritalstatus, religion,
      email, phonenumber, cccd,
      departmentid, jobtitleid, contractid, educationlevel,
      joineddate, status, basicsalary, layoff, note, dependents
    }, { transaction: t });

    // B. Cập nhật file Profile
    if (cv_file) {
      const profile = await models.Profile.findOne({ where: { employeeid: id } });
      if (profile) {
        await profile.update({ uniquefilename: cv_file }, { transaction: t });
      } else {
        await models.Profile.create({
          profilecode: `PF_E${id}`,
          employeeid: id,
          uniquefilename: cv_file,
          candidateid: null
        }, { transaction: t });
      }
    }

    await t.commit();
    return res.status(200).json({ message: 'Cập nhật thành công!' });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi cập nhật:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 5. Xóa nhân viên (Xóa cứng hoặc mềm tùy chính sách - ở đây làm xóa cứng Profile trước rồi xóa Employee)
export const deleteEmployee = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    
    // Xóa profile liên quan trước (nếu không setup CASCADE ở DB)
    await models.Profile.destroy({ where: { employeeid: id }, transaction: t });
    
    // Xóa nhân viên
    const deleted = await models.Employee.destroy({ where: { employeeid: id }, transaction: t });
    
    if (!deleted) {
        await t.rollback();
        return res.status(404).json({ message: 'Nhân viên không tồn tại' });
    }

    await t.commit();
    return res.status(200).json({ message: 'Xóa nhân viên thành công' });
  } catch (error) {
    await t.rollback();
    console.error('Lỗi xóa:', error);
    
    // 👇 SỬA DÒNG NÀY: Gửi kèm chi tiết lỗi (error.original.detail) để Frontend bắt được
    return res.status(500).json({ 
        message: 'Lỗi máy chủ', 
        error: error.original ? error.original.detail : error.message 
    });
  }
};

// 6. Xuất Excel
const getStatusText = (status) => {
    const map = { 'Official': 'Chính thức', 'Probation': 'Thử việc', 'Resigned': 'Đã nghỉ việc' };
    return map[status] || status;
};

export const exportEmployees = async (req, res) => {
  try {
    const employees = await models.Employee.findAll({
      order: [['employeeid', 'DESC']],
      include: [
        { model: models.Jobtitle, as: "jobtitle", attributes: ['name'] },
        { model: models.Department, as: "department", attributes: ['name'] },
        { model: models.Profile, as: "profiles", attributes: ['uniquefilename'], limit: 1 }
      ]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Nhân Viên');

    // Header
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH HỒ SƠ NHÂN SỰ';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', family: 4, size: 16, bold: true };

    const headerRow = worksheet.addRow([
      'STT', 'Mã NV', 'Họ và Tên', 'SĐT', 'Email', 'Phòng Ban', 'Chức Danh', 'Ngày Vào', 'Trạng Thái', 'Người Phụ Thuộc', 'Link Hồ Sơ'
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Data
    employees.forEach((e, index) => {
      const cvLink = e.profiles && e.profiles.length > 0 ? e.profiles[0].uniquefilename : null;
      const row = worksheet.addRow([
        index + 1,
        e.employeecode,
        e.name,
        e.phonenumber,
        e.email,
        e.department ? e.department.name : '',
        e.jobtitle ? e.jobtitle.name : '',
        e.joineddate,
        getStatusText(e.status),
        e.dependents || 0,
        cvLink ? 'Xem Hồ Sơ' : ''
      ]);

      if (cvLink) {
        const fileCell = row.getCell(10);
        fileCell.value = { text: 'Xem Hồ Sơ', hyperlink: cvLink, tooltip: 'Mở file' };
        fileCell.font = { color: { argb: '0000FF' }, underline: true };
      }
      
      row.eachCell((cell) => { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
    });

worksheet.columns = [
      { width: 5 }, { width: 15 }, { width: 25 }, { width: 15 }, { width: 25 }, 
      { width: 20 }, { width: 20 }, { width: 15 }, { width: 15 }, { width: 8 }, { width: 15 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachNhanVien.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};