import initModels from '../../models/init-models.js';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';

dotenv.config();

// Khởi tạo kết nối DB (Tương tự như file authMiddlewares.js của bạn)
const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});

const models = initModels(sequelize);

// 1. Lấy danh sách kế hoạch (GET)
export const getAllRecruitmentPlans = async (req, res) => {
  try {
    const plans = await models.Recruitmentplan.findAll({
      order: [['recruitmentplanid', 'DESC']], // Sắp xếp mới nhất lên đầu
      // Nếu bạn muốn lấy thêm thông tin Phòng ban hoặc Nhân viên, hãy bỏ comment dòng dưới (nếu đã thiết lập quan hệ)
      // include: [
      //   { model: models.Department, as: "department", attributes: ['name'] },
      //   { model: models.Employee, as: "employee", attributes: ['fullname'] }
      // ]
    });

    return res.status(200).json(plans);
  } catch (error) {
    console.error('Lỗi lấy danh sách kế hoạch:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 2. Lấy chi tiết 1 kế hoạch (GET /:id)
export const getRecruitmentPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await models.Recruitmentplan.findByPk(id);

    if (!plan) {
      return res.status(404).json({ message: 'Kế hoạch không tồn tại' });
    }

    return res.status(200).json(plan);
  } catch (error) {
    console.error('Lỗi lấy chi tiết kế hoạch:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 3. Tạo mới kế hoạch (POST)
export const createRecruitmentPlan = async (req, res) => {
  try {
    const {
      planNumber,    // plannumber
      signer,        // employeeid
      department,    // departmentid
      issueDate,     // issuedate
      effectiveDate, // effectivedate
      endDate,       // enddate
      abstract,      // abstract
      location,      // receivinglocation
      file_url       // linkfile
    } = req.body;

    // --- BẮT ĐẦU: KIỂM TRA DỮ LIỆU ĐẦU VÀO ---
    const missingFields = [];

    if (!planNumber) missingFields.push('Số kế hoạch');
    if (!department) missingFields.push('Bộ phận tham mưu');
    if (!signer) missingFields.push('Người ký duyệt');
    if (!issueDate) missingFields.push('Ngày ban hành');
    if (!effectiveDate) missingFields.push('Ngày hiệu lực');
    if (!endDate) missingFields.push('Ngày kết thúc');
    if (!abstract) missingFields.push('Trích yếu nội dung');
    
    // Nếu danh sách thiếu có dữ liệu -> Trả về lỗi 400 ngay lập tức
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Vui lòng nhập đầy đủ: ${missingFields.join(', ')}` 
      });
    }
    // --- KẾT THÚC: KIỂM TRA DỮ LIỆU ---

    // Tạo record mới
    const newPlan = await models.Recruitmentplan.create({
      plannumber: planNumber, 
      employeeid: signer ? parseInt(signer) : null,
      departmentid: department ? parseInt(department) : null,
      issuedate: issueDate,
      effectivedate: effectiveDate,
      enddate: endDate,
      abstract: abstract,
      receivinglocation: location || '', // Nếu không nhập thì để rỗng
      linkfile: file_url
    });

    return res.status(201).json({ 
      message: 'Tạo kế hoạch thành công!', 
      data: newPlan 
    });

  } catch (error) {
    console.error('Lỗi tạo kế hoạch:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
  }
};

// 4. Cập nhật kế hoạch (PUT /:id)
export const updateRecruitmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      planNumber,
      signer,
      department,
      issueDate,
      effectiveDate,
      endDate,
      abstract,
      location,
      file_url
    } = req.body;

    // Kiểm tra kế hoạch có tồn tại không
    const plan = await models.Recruitmentplan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Kế hoạch không tồn tại' });
    }

    // --- BẮT ĐẦU: KIỂM TRA DỮ LIỆU ĐẦU VÀO (Tương tự Create) ---
    const missingFields = [];

    if (!planNumber) missingFields.push('Số kế hoạch');
    if (!department) missingFields.push('Bộ phận tham mưu');
    if (!signer) missingFields.push('Người ký duyệt');
    if (!issueDate) missingFields.push('Ngày ban hành');
    if (!effectiveDate) missingFields.push('Ngày hiệu lực');
    if (!endDate) missingFields.push('Ngày kết thúc');
    if (!abstract) missingFields.push('Trích yếu nội dung');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Vui lòng nhập đầy đủ: ${missingFields.join(', ')}` 
      });
    }
    // --- KẾT THÚC: KIỂM TRA DỮ LIỆU ---

    // Cập nhật
    await plan.update({
      plannumber: planNumber,
      employeeid: signer ? parseInt(signer) : null,
      departmentid: department ? parseInt(department) : null,
      issuedate: issueDate,
      effectivedate: effectiveDate,
      enddate: endDate,
      abstract: abstract,
      receivinglocation: location || '',
      linkfile: file_url 
    });

    return res.status(200).json({ message: 'Cập nhật thành công!', data: plan });

  } catch (error) {
    console.error('Lỗi cập nhật kế hoạch:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

// 5. Xóa kế hoạch (DELETE /:id)
export const deleteRecruitmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await models.Recruitmentplan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Kế hoạch không tồn tại' });
    }

    await plan.destroy();

    return res.status(200).json({ message: 'Xóa kế hoạch thành công!' });

  } catch (error) {
    console.error('Lỗi xóa kế hoạch:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

export const exportRecruitmentPlans = async (req, res) => {
  try {
    // Lấy dữ liệu kèm thông tin tên (Uncomment include để lấy tên thay vì ID)
    const plans = await models.Recruitmentplan.findAll({
      order: [['recruitmentplanid', 'DESC']],
      include: [
        { model: models.Department, as: "department", attributes: ['name'] },
        { model: models.Employee, as: "employee", attributes: ['name'] } // Chú ý: kiểm tra lại alias 'employee' trong model relationship
      ]
    });

    // Tạo Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kế Hoạch Tuyển Dụng');

    // --- 1. Tạo Tiêu Đề ---
    worksheet.mergeCells('A1:I1'); // Gộp ô từ A đến I
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DANH SÁCH KẾ HOẠCH TUYỂN DỤNG';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', family: 4, size: 16, bold: true };

    // --- 2. Tạo Header Cột ---
    const headerRow = worksheet.addRow([
      'STT', 
      'Số Kế Hoạch', 
      'Người Ký', 
      'Bộ Phận', 
      'Ngày Ban Hành', 
      'Ngày Hiệu Lực', 
      'Ngày Kết Thúc', 
      'Nơi Nhận', 
      'Trích Yếu', 
      'File Đính Kèm'
    ]);

    // Style cho Header
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } }; // Màu nền tối giống Sidebar
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // --- 3. Đổ Dữ Liệu ---
    plans.forEach((plan, index) => {
      const row = worksheet.addRow([
        index + 1, // STT
        plan.plannumber,
        plan.employee ? plan.employee.name : plan.employeeid, // Hiện tên nếu có include, không thì hiện ID
        plan.department ? plan.department.name : plan.departmentid,
        plan.issuedate,
        plan.effectivedate,
        plan.enddate,
        plan.receivinglocation,
        plan.abstract,
        plan.linkfile ? 'Xem File' : '' // Text hiển thị cho link
      ]);

      // Xử lý Hyperlink cho cột File (Cột thứ 10 - J)
      if (plan.linkfile) {
        const fileCell = row.getCell(10);
        fileCell.value = {
          text: 'Xem File',
          hyperlink: plan.linkfile,
          tooltip: 'Nhấn để mở file'
        };
        fileCell.font = { color: { argb: '0000FF' }, underline: true };
      }

      // Căn chỉnh border cho các ô dữ liệu
      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // --- 4. Chỉnh độ rộng cột ---
    worksheet.columns = [
      { width: 5 },  // STT
      { width: 15 }, // Số KH
      { width: 20 }, // Người ký
      { width: 20 }, // Bộ phận
      { width: 15 }, // Ngày
      { width: 15 }, // Ngày
      { width: 15 }, // Ngày
      { width: 25 }, // Nơi nhận
      { width: 30 }, // Trích yếu
      { width: 15 }, // File
    ];

    // --- 5. Trả về file ---
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DanhSachKeHoach.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
    res.status(500).json({ message: 'Lỗi xuất file Excel' });
  }
};