import initModels from '../../models/init-models.js';
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

// --- HELPER: Sinh mã tự động ---
// Quy tắc: Prefix + JobCode + DeptCode + ID
const generateCode = async (prefix, jobId, deptId, recordId) => {
  try {
    const job = await models.Jobtitle.findByPk(jobId);
    const dept = await models.Department.findByPk(deptId);
    
    const jobCode = job ? job.jobtitlecode : 'XX';
    const deptCode = dept ? dept.departmentcode : 'YY';
    
    // Ví dụ: UV + IT + PNS + 1 => UVITPNS1
    return `${prefix}${jobCode}${deptCode}${recordId}`;
  } catch (error) {
    console.error("Lỗi sinh mã:", error);
    return `${prefix}${recordId}`;
  }
};

// 1. Lấy danh sách ứng viên
export const getAllCandidates = async (req, res) => {
  try {
    const candidates = await models.Candidate.findAll({
      where: { isdeleted: false }, // Lọc chưa xóa
      order: [['candidateid', 'DESC']],
      include: [
        { model: models.Jobtitle, as: "jobtitle", attributes: ['name', 'jobtitlecode'] },
        { model: models.Department, as: "department", attributes: ['name', 'departmentcode'] },
        // Lấy link file từ Profile
        { model: models.Profile, as: "profiles", attributes: ['uniquefilename'], limit: 1 }
      ]
    });

    // Flatten dữ liệu để frontend dễ đọc (lấy file đầu tiên)
    const formattedData = candidates.map(c => {
      const data = c.toJSON();
      data.cv_file = data.profiles && data.profiles.length > 0 ? data.profiles[0].uniquefilename : null;
      return data;
    });

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('Lỗi lấy danh sách:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 2. Lấy chi tiết ứng viên
export const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await models.Candidate.findByPk(id, {
      include: [{ model: models.Profile, as: "profiles" }]
    });

    if (!candidate) return res.status(404).json({ message: 'Không tìm thấy ứng viên' });

    const data = candidate.toJSON();
    data.cv_file = data.profiles && data.profiles.length > 0 ? data.profiles[0].uniquefilename : null;

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 3. Tạo mới ứng viên
export const createCandidate = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      name, submissiondate, jobtitleid, departmentid, skill, note, cv_file
    } = req.body;

    // A. Tạo record Candidate (Status mặc định = 1: Đã gửi CV)
    const newCandidate = await models.Candidate.create({
      name,
      submissiondate: submissiondate || new Date(),
      jobtitleid,
      departmentid,
      skill,
      note,
      status: 1, 
      isdeleted: false
    }, { transaction: t });

    // B. Sinh mã ứng viên: UV + JobCode + DeptCode + CandidateID
    const candidateCode = await generateCode('UV', jobtitleid, departmentid, newCandidate.candidateid);
    await newCandidate.update({ candidatecode: candidateCode }, { transaction: t });

    // C. Lưu file vào Profile (Nếu có)
    if (cv_file) {
      await models.Profile.create({
        profilecode: `PF_C${newCandidate.candidateid}`,
        candidateid: newCandidate.candidateid,
        uniquefilename: cv_file,
        employeeid: null // Chưa là nhân viên nên để trống
      }, { transaction: t });
    }

    await t.commit();
    return res.status(201).json({ message: 'Thêm ứng viên thành công!', data: newCandidate });

  } catch (error) {
    await t.rollback();
    console.error('Lỗi tạo ứng viên:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. Cập nhật ứng viên (Xử lý chuyển thành Nhân viên)
export const updateCandidate = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      name, submissiondate, jobtitleid, departmentid, skill, note, status, cv_file
    } = req.body;

    const candidate = await models.Candidate.findByPk(id);
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy ứng viên' });
    }

    // A. Cập nhật thông tin Candidate
    await candidate.update({
      name,
      submissiondate,
      jobtitleid,
      departmentid,
      skill,
      note,
      status
    }, { transaction: t });

    // B. Cập nhật file CV trong Profile
    if (cv_file) {
      // Tìm xem đã có profile chưa
      const profile = await models.Profile.findOne({ where: { candidateid: id } });
      if (profile) {
        // Có rồi thì update link file
        await profile.update({ uniquefilename: cv_file }, { transaction: t });
      } else {
        // Chưa có thì tạo mới
        await models.Profile.create({
          profilecode: `PF_C${id}`,
          candidateid: id,
          uniquefilename: cv_file,
          employeeid: null
        }, { transaction: t });
      }
    }

    // C. LOGIC CHUYỂN THÀNH NHÂN VIÊN (Khi Status = 3: Được tuyển)
    if (parseInt(status) === 3) {
      // 1. Kiểm tra xem ứng viên này đã có nhân viên tương ứng chưa (tránh tạo trùng lặp)
      const existingEmp = await models.Employee.findOne({ where: { candidateid: id } });
      
      if (!existingEmp) {
        // 2. Tạo nhân viên mới
        const newEmployee = await models.Employee.create({
          name: name, // Lấy tên từ ứng viên
          // Email, SĐT bỏ qua theo yêu cầu (để null)
          candidateid: id, // Link ngược lại để biết nguồn gốc
          jobtitleid: jobtitleid,
          departmentid: departmentid,
          joineddate: new Date(), // Ngày gia nhập là hôm nay
          status: 'Probation' // Trạng thái thử việc
        }, { transaction: t });

        // 3. Sinh mã nhân viên: JobCode + DeptCode + EmployeeID
        const empCode = await generateCode('', jobtitleid, departmentid, newEmployee.employeeid);
        await newEmployee.update({ employeecode: empCode }, { transaction: t });

        // 4. Cập nhật Profile: Gán file hồ sơ này cho nhân viên mới luôn
        await models.Profile.update(
          { employeeid: newEmployee.employeeid },
          { where: { candidateid: id }, transaction: t }
        );
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

// 5. Xóa mềm ứng viên
export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    // Cập nhật cờ isdeleted = true chứ không xóa hẳn khỏi DB
    await models.Candidate.update({ isdeleted: true }, { where: { candidateid: id } });
    return res.status(200).json({ message: 'Xóa ứng viên thành công' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const getStatusText = (status) => {
  switch (parseInt(status)) {
    case 1: return 'Đã gửi CV';
    case 2: return 'Đang xử lý';
    case 3: return 'Được tuyển';
    case 4: return 'Rớt tuyển';
    default: return 'Khác';
  }
};

// 6. API Xuất Excel Danh sách Ứng viên (MỚI)
export const exportCandidates = async (req, res) => {
  try {
    // Lấy dữ liệu kèm thông tin liên quan
    const candidates = await models.Candidate.findAll({
      where: { isdeleted: false },
      order: [['candidateid', 'DESC']],
      include: [
        { model: models.Jobtitle, as: "jobtitle", attributes: ['name'] },
        { model: models.Department, as: "department", attributes: ['name'] },
        { model: models.Profile, as: "profiles", attributes: ['uniquefilename'], limit: 1 }
      ]
    });

    // Tạo Workbook & Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh Sách Ứng Viên');

    // --- A. Tạo Tiêu Đề ---
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH HỒ SƠ ỨNG VIÊN';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', family: 4, size: 16, bold: true };

    // --- B. Header Cột ---
    const headerRow = worksheet.addRow([
      'STT', 
      'Mã Ứng Viên', 
      'Họ và Tên', 
      'Vị Trí Ứng Tuyển', 
      'Phòng Ban', 
      'Ngày Nộp', 
      'Trạng Thái', 
      'Kỹ Năng', 
      'Ghi Chú',
      'Link CV'
    ]);

    // Style Header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // --- C. Đổ Dữ Liệu ---
    candidates.forEach((c, index) => {
      const cvLink = c.profiles && c.profiles.length > 0 ? c.profiles[0].uniquefilename : null;
      
      const row = worksheet.addRow([
        index + 1,
        c.candidatecode,
        c.name,
        c.jobtitle ? c.jobtitle.name : '',
        c.department ? c.department.name : '',
        c.submissiondate, // Có thể format lại ngày nếu cần
        getStatusText(c.status),
        c.skill,
        c.note,
        cvLink ? 'Xem CV' : ''
      ]);

      // Tạo Hyperlink cho cột CV
      if (cvLink) {
        const fileCell = row.getCell(10);
        fileCell.value = {
          text: 'Xem CV',
          hyperlink: cvLink,
          tooltip: 'Nhấn để mở file CV'
        };
        fileCell.font = { color: { argb: '0000FF' }, underline: true };
      }

      // Border cho từng ô
      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // --- D. Chỉnh độ rộng cột ---
    worksheet.columns = [
      { width: 5 },  // STT
      { width: 15 }, // Mã UV
      { width: 25 }, // Họ tên
      { width: 20 }, // Vị trí
      { width: 20 }, // Phòng ban
      { width: 15 }, // Ngày nộp
      { width: 15 }, // Trạng thái
      { width: 30 }, // Kỹ năng
      { width: 20 }, // Ghi chú
      { width: 15 }, // Link CV
    ];

    // Trả file về client
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachUngVien.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};