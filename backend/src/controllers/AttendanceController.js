import { Sequelize, Op } from 'sequelize';
import initModels from '../models/init-models.js'; 
import ExcelJS from 'exceljs'; // Đảm bảo đã chạy: npm install exceljs
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});

const models = initModels(sequelize);

// ===================== LEAVE REQUEST (NGHỈ PHÉP) =====================

export const getLeaves = async (req, res) => {
    try {
        const { search, status } = req.query;
        let whereClause = {};
        if (status && status !== 'all') whereClause.status = status;

        const data = await models.LeaveRequest.findAll({
            where: whereClause,
            include: [{
                model: models.Employee,
                as: 'employee',
                attributes: ['employeecode', 'name'],
                where: search ? { name: { [Op.iLike]: `%${search}%` } } : undefined
            }],
            order: [['createddate', 'DESC']]
        });
        return res.status(200).json(data);
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const createLeave = async (req, res) => {
    try {
        const { employeeId, type, fromDate, toDate, reason } = req.body;
        if (!employeeId || !fromDate || !toDate) return res.status(400).json({ message: "Thiếu thông tin" });

        await models.LeaveRequest.create({
            employeeid: employeeId,
            leavetype: type,
            startdate: fromDate,
            enddate: toDate,
            reason: reason,
            status: 'pending',
            createddate: new Date()
        });
        return res.status(201).json({ message: 'Tạo đơn nghỉ phép thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const updateLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, type, fromDate, toDate, reason } = req.body;
        
        const request = await models.LeaveRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn' });

        let updateData = {};
        if (status) {
            updateData.status = status;
            if(status === 'approved') updateData.approveddate = new Date();
        }
        if (type) updateData.leavetype = type;
        if (fromDate) updateData.startdate = fromDate;
        if (toDate) updateData.enddate = toDate;
        if (reason) updateData.reason = reason;

        await request.update(updateData);
        return res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const deleteLeave = async (req, res) => {
    try {
        const request = await models.LeaveRequest.findByPk(req.params.id);
        if(request && request.status === 'approved') return res.status(400).json({message: "Không thể xóa đơn đã duyệt"});
        
        await models.LeaveRequest.destroy({ where: { leaverequestid: req.params.id } });
        return res.status(200).json({ message: 'Xóa thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ===================== OVERTIME REQUEST (TĂNG CA) =====================

// 5. Lấy danh sách tăng ca (Đã sửa Phân trang & Bỏ lọc ngày)
export const getOvertimes = async (req, res) => {
    try {
        const { search, status, page, limit } = req.query;
        
        // Xử lý phân trang
        const pageNum = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 10;
        const offset = (pageNum - 1) * pageSize;

        // 1. Logic lọc cơ bản (Status)
        let whereClause = {};
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        // 2. Logic tìm kiếm thông minh (Ngày hoặc Tên)
        let employeeWhere = {}; // Điều kiện lọc cho bảng Employee

        if (search) {
            // Regex kiểm tra format ngày dd/mm/yyyy (Ví dụ: 05/12/2025)
            const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
            const match = search.match(dateRegex);

            if (match) {
                // ==> NẾU LÀ NGÀY: Lọc theo cột overtimedate
                const [_, day, month, year] = match;
                // Chuyển đổi sang format YYYY-MM-DD để query DB
                whereClause.overtimedate = `${year}-${month}-${day}`;
            } else {
                // ==> NẾU LÀ CHỮ: Lọc theo Tên hoặc Mã NV (Logic cũ)
                employeeWhere = { 
                    [Op.or]: [
                        { name: { [Op.iLike]: `%${search}%` } },
                        { employeecode: { [Op.iLike]: `%${search}%` } }
                    ]
                };
            }
        }

        // Query Database
        const { count, rows } = await models.OvertimeRequest.findAndCountAll({
            where: whereClause, // Áp dụng điều kiện lọc (Status + Ngày nếu có)
            include: [{
                model: models.Employee,
                as: 'employee',
                attributes: ['employeecode', 'name'],
                // Áp dụng điều kiện lọc tên (nếu user không nhập ngày)
                where: Object.keys(employeeWhere).length > 0 ? employeeWhere : undefined
            }],
            order: [['overtimedate', 'DESC']],
            limit: pageSize,
            offset: offset,
            distinct: true 
        });

        return res.status(200).json({
            data: rows,
            pagination: {
                totalItems: count,
                totalPages: Math.ceil(count / pageSize),
                currentPage: pageNum,
                pageSize: pageSize
            }
        });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

// [MỚI] Xuất Excel (Đã bỏ lọc ngày)
export const exportOvertimeExcel = async (req, res) => {
    try {
        const { search, status } = req.query;

        // Build where clause giống getOvertimes nhưng KHÔNG phân trang
        let whereClause = {};
        if (status && status !== 'all') whereClause.status = status;

        const data = await models.OvertimeRequest.findAll({
            where: whereClause,
            include: [{
                model: models.Employee,
                as: 'employee',
                attributes: ['employeecode', 'name'],
                where: search ? { name: { [Op.iLike]: `%${search}%` } } : undefined
            }],
            order: [['overtimedate', 'DESC']]
        });

        // Tạo File Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách Tăng ca');

        // Định nghĩa cột
        worksheet.columns = [
            { header: 'Mã NV', key: 'code', width: 15 },
            { header: 'Họ tên', key: 'name', width: 25 },
            { header: 'Ngày', key: 'date', width: 15 },
            { header: 'Giờ bắt đầu', key: 'start', width: 15 },
            { header: 'Giờ kết thúc', key: 'end', width: 15 },
            { header: 'Tổng giờ', key: 'hours', width: 10 },
            { header: 'Nội dung', key: 'content', width: 30 },
            { header: 'Trạng thái', key: 'status', width: 15 },
        ];

        // Thêm dữ liệu
        data.forEach(item => {
            const dateStr = item.overtimedate ? new Date(item.overtimedate).toLocaleDateString('vi-VN') : '';
            const startStr = item.starttime ? new Date(item.starttime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '';
            const endStr = item.endtime ? new Date(item.endtime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '';
            
            let statusText = '';
            if(item.status === 'pending') statusText = 'Chờ duyệt';
            else if(item.status === 'approved') statusText = 'Đã duyệt';
            else if(item.status === 'rejected') statusText = 'Từ chối';

            worksheet.addRow({
                code: item.employee?.employeecode,
                name: item.employee?.name,
                date: dateStr,
                start: startStr,
                end: endStr,
                hours: item.overtimehours,
                content: item.workcontent,
                status: statusText
            });
        });

        // Style header đậm
        worksheet.getRow(1).font = { bold: true };
        
        // Response header để trình duyệt tải xuống
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=DS_TangCa.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (e) {
        console.error("Lỗi xuất Excel:", e);
        if(!res.headersSent) return res.status(500).json({ message: "Lỗi xuất Excel" });
    }
};

// ... (Các hàm createOvertime, updateOvertime, deleteOvertime, getAllOTConfigs, updateOTConfig giữ nguyên logic cũ) ...
export const createOvertime = async (req, res) => {
    try {
        const { employeeId, date, startTime, endTime, reason } = req.body;
        
        // [VALIDATION MỚI]: Kiểm tra trùng giờ làm việc chính thức
        const isOverlap = await checkShiftOverlap(date, startTime, endTime);
        if (isOverlap) {
            return res.status(400).json({ 
                message: 'Không thể tạo đơn: Thời gian tăng ca trùng với giờ làm việc chính thức.' 
            });
        }

        // [FIX LỖI GIỜ]: Giữ nguyên logic Z như yêu cầu cũ
        const start = new Date(`${date}T${startTime}:00Z`); 
        let end = new Date(`${date}T${endTime}:00Z`);

        let diffMs = end - start;
        if (diffMs < 0) {
            end.setDate(end.getDate() + 1);
            diffMs = end - start;
        }

        const hours = diffMs / 36e5; 

        await models.OvertimeRequest.create({
            employeeid: employeeId,
            overtimedate: date, 
            starttime: start,   
            endtime: end,
            overtimehours: hours.toFixed(2),
            workcontent: reason,
            status: 'pending',
            createddate: new Date()
        });

        return res.status(201).json({ message: 'Tạo đơn tăng ca thành công' });
    } catch (e) { 
        console.error(e);
        return res.status(500).json({ message: e.message }); 
    }
};

export const updateOvertime = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, date, startTime, endTime, reason } = req.body;
        
        const request = await models.OvertimeRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn' });

        // [VALIDATION MỚI]: Nếu có thay đổi ngày hoặc giờ, phải kiểm tra lại Shift
        if (date && startTime && endTime) {
             const isOverlap = await checkShiftOverlap(date, startTime, endTime);
             if (isOverlap) {
                 return res.status(400).json({ 
                     message: 'Cập nhật thất bại: Thời gian tăng ca trùng với giờ làm việc chính thức.' 
                 });
             }
        }

        let updateData = {};
        
        if (status) {
            updateData.status = status;
            if(status === 'approved') updateData.approveddate = new Date();
        }
        if (reason) updateData.workcontent = reason;
        if (date) updateData.overtimedate = date;

        if (date && startTime && endTime) {
            // [FIX LỖI GIỜ]: Giữ nguyên logic Z
            const start = new Date(`${date}T${startTime}:00Z`);
            let end = new Date(`${date}T${endTime}:00Z`);

            let diffMs = end - start;
            if (diffMs < 0) {
                end.setDate(end.getDate() + 1);
                diffMs = end - start;
            }
            
            const hours = diffMs / 36e5;

            updateData.starttime = start;
            updateData.endtime = end;
            updateData.overtimehours = hours.toFixed(2);
        }

        await request.update(updateData);
        return res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const deleteOvertime = async (req, res) => {
    try {
        const request = await models.OvertimeRequest.findByPk(req.params.id);
        if(request && request.status === 'approved') return res.status(400).json({message: "Không thể xóa đơn đã duyệt"});
        await models.OvertimeRequest.destroy({ where: { overtimerequestid: req.params.id } });
        return res.status(200).json({ message: 'Xóa thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const getAllOTConfigs = async (req, res) => {
    try {
        const configs = await models.OtConfig.findAll({
            attributes: ['ot_config_id', 'ot_type', 'rate', 'is_active', 'description'],
            order: [['ot_config_id', 'ASC']]
        });
        return res.status(200).json(configs);
    } catch (e) { return res.status(500).json({ message: 'Lỗi server khi lấy cấu hình OT' }); }
};

export const updateOTConfig = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { rate, is_active } = req.body;
        const config = await models.OtConfig.findByPk(id);
        if (!config) { await t.rollback(); return res.status(404).json({ message: 'Cấu hình OT không tồn tại' }); }

        if (rate !== undefined && (isNaN(rate) || rate < 0)) { await t.rollback(); return res.status(400).json({ message: 'Hệ số lương (Rate) không hợp lệ' }); }

        await config.update({
            rate: rate !== undefined ? rate : config.rate, 
            is_active: is_active !== undefined ? is_active : config.is_active
        }, { transaction: t });

        await t.commit();
        return res.status(200).json({ message: 'Cập nhật cấu hình thành công' });
    } catch (e) { await t.rollback(); return res.status(500).json({ message: e.message }); }
};

// Hàm chuyển đổi giờ "HH:mm" hoặc "HH:mm:ss" sang số phút để so sánh
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Hàm kiểm tra trùng lặp giờ
const checkShiftOverlap = async (dateStr, startTimeStr, endTimeStr) => {
    // 1. Kiểm tra cuối tuần (0 = Sunday, 6 = Saturday)
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Cuối tuần -> Không trùng giờ làm -> Cho phép

    // 2. Kiểm tra ngày lễ
    const holiday = await models.Holiday.findOne({
        where: {
            start_date: { [Op.lte]: dateStr }, // start_date <= date
            end_date: { [Op.gte]: dateStr }    // end_date >= date
        }
    });
    if (holiday) return false; // Là ngày lễ -> Không trùng giờ làm -> Cho phép

    // 3. Kiểm tra trùng giờ Shift (Chỉ xét khi là Ngày thường)
    // Lấy ca làm việc đầu tiên (Giả định áp dụng chung, nếu có nhiều ca cần logic lấy ca theo NV)
    const shift = await models.Shift.findOne(); 
    if (!shift) return false; // Không có cấu hình ca -> Cho phép

    // Convert sang phút để so sánh
    const reqStart = timeToMinutes(startTimeStr);
    const reqEnd = timeToMinutes(endTimeStr);
    const shiftStart = timeToMinutes(shift.startTime);
    const shiftEnd = timeToMinutes(shift.endTime);

    // Logic Overlap: (ReqStart < ShiftEnd) AND (ReqEnd > ShiftStart)
    // Ví dụ Shift: 08:00-17:00. Req: 16:00-18:00 -> Trùng đoạn 16:00-17:00 -> Báo lỗi
    if (reqStart < shiftEnd && reqEnd > shiftStart) {
        return true; // CÓ TRÙNG LẶP (Vi phạm)
    }

    return false; // Không trùng
};

// ===================== TIMEKEEPING (CHẤM CÔNG QR) =====================

// ===================== HELPER FUNCTIONS =====================
const parseTimeOnDate = (timeString, dateObj) => {
    if (!timeString) return dateObj;
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const result = new Date(dateObj);
    result.setHours(hours, minutes, seconds || 0, 0);
    return result;
};

// ===================== CHỨC NĂNG CHẤM CÔNG QR =====================
export const checkInByQr = async (req, res) => {
    try {
        const { token } = req.body; 
        if (!token) return res.status(400).json({ message: "Không tìm thấy mã QR" });

        // 1. Giải mã Token
        let payload;
        try {
            const decoded = atob(token);
            payload = JSON.parse(decoded);
        } catch (e) {
            return res.status(400).json({ message: "Mã QR không hợp lệ" });
        }

        const { id: employeeId, ts } = payload;
        
        // Chuẩn hóa giờ VN
        const now = new Date(); 
        const LOCAL_OFFSET = 7 * 60 * 60 * 1000; 
        // localTime: Giờ đã cộng 7 tiếng (Dùng để lưu vào DB cho đẹp)
        const localTime = new Date(now.getTime() + LOCAL_OFFSET);
        const todayStr = localTime.toISOString().split('T')[0];

        // 2. Kiểm tra hạn sử dụng QR
        const timeDiff = (now.getTime() - ts) / 1000;
        if (timeDiff > 120 || timeDiff < -5) { 
            return res.status(400).json({ message: "Mã QR đã hết hạn. Vui lòng tải lại trang!" });
        }

        // 3. Lấy thông tin nhân viên
        const employee = await models.Employee.findByPk(employeeId);
        if (!employee) return res.status(404).json({ message: "Nhân viên không tồn tại" });

        // 4. KIỂM TRA ĐƠN TĂNG CA
        const anyOvertimeReq = await models.OvertimeRequest.findOne({
            where: { 
                employeeid: employeeId, 
                overtimedate: {
                    [Op.gte]: new Date(`${todayStr}T00:00:00Z`), 
                    [Op.lt]: new Date(`${todayStr}T23:59:59Z`)
                }
            }
        });

        if (anyOvertimeReq && anyOvertimeReq.status === 'pending') {
            return res.status(400).json({ message: "Đơn tăng ca hôm nay CHƯA ĐƯỢC DUYỆT. Vui lòng liên hệ quản lý!" });
        }

        const overtimeReq = (anyOvertimeReq && anyOvertimeReq.status === 'approved') ? anyOvertimeReq : null;

        const holiday = await models.Holiday.findOne({
            where: { start_date: { [Op.lte]: todayStr }, end_date: { [Op.gte]: todayStr } }
        });

        const dayOfWeek = localTime.getUTCDay(); 
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        if ((holiday || isWeekend) && !overtimeReq) {
            const reason = holiday ? `ngày lễ (${holiday.holiday_name})` : "ngày cuối tuần";
            return res.status(400).json({ message: `Hôm nay là ${reason}. Bạn không có lịch tăng ca hợp lệ nên không thể chấm công.` });
        }

        const shift = await models.Shift.findOne(); 
        if (!shift && !overtimeReq) {
            return res.status(400).json({ message: "Hệ thống chưa cấu hình Ca làm việc." });
        }
        
        // 5. TÌM BẢN GHI CHẤM CÔNG
        let timekeeping = await models.Timekeeping.findOne({
            where: { employeeid: employeeId, workdate: todayStr }
        });

        let message = "";
        let action = "";

        // ================= TRƯỜNG HỢP 1: CHECK-IN =================
        // (Logic fix lỗi check-in/check-out lần trước vẫn giữ nguyên ở đây)
        if (!timekeeping || !timekeeping.checkintime) {
            
            if (overtimeReq) {
                const otEnd = new Date(overtimeReq.endtime);
                if (now.getTime() > otEnd.getTime()) {
                    try {
                        await overtimeReq.update({
                            status: 'rejected',
                            workcontent: (overtimeReq.workcontent || "") + ` [Hủy tự động: Check-in trễ lúc ${now.toLocaleTimeString('vi-VN')}]`
                        });
                        return res.status(400).json({ message: `LỖI: Bạn check-in quá trễ.` });
                    } catch (err) {
                        return res.status(500).json({ message: "Lỗi hệ thống khi hủy đơn tăng ca." });
                    }
                }
            }

            action = "CHECK_IN";
            let lateMinutes = 0;

            if (!holiday && !isWeekend && shift) {
                const [sH, sM] = shift.startTime.split(':');
                const shiftStart = new Date(localTime); 
                shiftStart.setUTCHours(sH - 7, sM, 0, 0); // Logic tính toán vẫn dùng offset chuẩn
                
                const diffMs = now - shiftStart;
                if (diffMs > 0) lateMinutes = Math.floor(diffMs / 60000);
            }

            // [SỬA] Dùng localTime để lưu vào DB cho đẹp (8:00 thay vì 1:00)
            if (timekeeping) {
                await timekeeping.update({
                    checkintime: localTime, 
                    late_minutes: lateMinutes,
                    status: lateMinutes > 0 ? 'LATE' : 'ON_TIME'
                });
            } else {
                timekeeping = await models.Timekeeping.create({
                    employeeid: employeeId,
                    checkintime: localTime, 
                    workdate: todayStr,
                    late_minutes: lateMinutes,
                    status: lateMinutes > 0 ? 'LATE' : 'ON_TIME'
                });
            }

            if (overtimeReq) {
                const otStart = new Date(overtimeReq.starttime); 
                if (now > otStart) {
                    const otEnd = new Date(overtimeReq.endtime);
                    let newDuration = (otEnd - now) / 36e5; 
                    if (newDuration < 0) newDuration = 0;
                    await overtimeReq.update({ starttime: now, overtimehours: newDuration.toFixed(2) });
                    message += " (Đã cập nhật giờ vào Tăng ca)";
                } 
            }

            const timeDisplay = new Date(now.getTime() + LOCAL_OFFSET).toISOString().substring(11, 19);
            message = `Check-in thành công lúc ${timeDisplay}. ` + (lateMinutes > 0 ? `Trễ ${lateMinutes} phút.` : "") + message;
        
        // ================= TRƯỜNG HỢP 2: CHECK-OUT =================
        } else if (!timekeeping.checkouttime) {
            action = "CHECK_OUT";
            let earlyMinutes = 0;

            if (!holiday && !isWeekend && shift) {
                const [eH, eM] = shift.endTime.split(':');
                const shiftEnd = new Date(localTime);
                shiftEnd.setUTCHours(eH - 7, eM, 0, 0);
                const diffMs = shiftEnd - now;
                if (diffMs > 0) earlyMinutes = Math.floor(diffMs / 60000);
            }

            // [SỬA] Dùng localTime để lưu vào DB
            await timekeeping.update({
                checkouttime: localTime,
                early_leave_minutes: earlyMinutes,
                status: (timekeeping.late_minutes > 0 || earlyMinutes > 0) ? 'NOT_FULL' : 'FULL'
            });

            if (overtimeReq) {
                const otEnd = new Date(overtimeReq.endtime); 
                if (now < otEnd) {
                    const currentStart = new Date(overtimeReq.starttime); 
                    let newDuration = (now - currentStart) / 36e5;
                    if (newDuration < 0) newDuration = 0;
                    await overtimeReq.update({ endtime: now, overtimehours: newDuration.toFixed(2) });
                    message += " (Đã cập nhật giờ ra Tăng ca)";
                } else {
                    message += " (Giờ ra Tăng ca giữ nguyên)";
                }
            }
            const timeDisplay = new Date(now.getTime() + LOCAL_OFFSET).toISOString().substring(11, 19);
            message = `Check-out thành công lúc ${timeDisplay}. ` + (earlyMinutes > 0 ? `Sớm ${earlyMinutes} phút.` : "") + message;

        } else {
            return res.status(400).json({ message: `Nhân viên ${employee.name} đã hoàn thành chấm công hôm nay!` });
        }

        return res.status(200).json({ success: true, employeeName: employee.name, message: message, action: action });

    } catch (error) {
        console.error("Check-in Error:", error);
        return res.status(500).json({ message: "Lỗi hệ thống chấm công", error: error.message });
    }
};

// ===================== API LẤY DANH SÁCH CHẤM CÔNG THEO NGÀY =====================
export const getDailyAttendance = async (req, res) => {
    try {
        const { date } = req.query; // Nhận tham số date (YYYY-MM-DD) từ Frontend

        // Xử lý ngày: Nếu không gửi lên thì lấy ngày hiện tại (VN)
        let targetDate = date;
        if (!targetDate) {
            const now = new Date();
            const LOCAL_OFFSET = 7 * 60 * 60 * 1000;
            const vnTime = new Date(now.getTime() + LOCAL_OFFSET);
            targetDate = vnTime.toISOString().split('T')[0];
        }

        // Query Database
        const attendanceList = await models.Timekeeping.findAll({
            where: {
                workdate: targetDate
            },
            include: [{
                model: models.Employee,
                as: 'employee',
                attributes: ['employeecode', 'name'] // Lấy thêm tên và mã NV để hiển thị
            }],
            order: [
                ['checkintime', 'ASC'] // Người đến sớm xếp trước
            ]
        });

        return res.status(200).json(attendanceList);

    } catch (error) {
        console.error("Lỗi lấy danh sách chấm công:", error);
        return res.status(500).json({ message: "Lỗi server khi tải dữ liệu chấm công", error: error.message });
    }
};

// ===================== [THÊM MỚI] XỬ LÝ SỬA CHẤM CÔNG & SHIFT =====================

// 1. Cập nhật trạng thái bản ghi chấm công (Modal Item)
export const updateAttendanceLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, checkInTime, checkOutTime } = req.body; // checkInTime dạng "HH:mm"

        const log = await models.Timekeeping.findByPk(id);
        if (!log) return res.status(404).json({ message: 'Không tìm thấy dữ liệu chấm công' });

        // Lấy cấu hình Shift để tính toán
        const shift = await models.Shift.findOne();
        const workDateStr = log.workdate; // YYYY-MM-DD

        let updateData = {};
        if (status) updateData.status = status;

        // Helper: Convert "HH:mm" + WorkDate -> Date Object (UTC stored)
        const combineDateTime = (dateStr, timeStr) => {
             if (!timeStr) return null; 
             return new Date(`${dateStr}T${timeStr}:00Z`); // Giả định lưu UTC như các bước trước
        };

        // Helper: Convert "HH:mm" -> Minutes
        const timeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        // --- XỬ LÝ CHECK-IN & TÍNH PHÚT TRỄ ---
        if (checkInTime !== undefined) {
            updateData.checkintime = checkInTime ? combineDateTime(workDateStr, checkInTime) : null;
            
            // Tính lại Late Minutes nếu có Shift
            if (shift && checkInTime) {
                const shiftStartMins = timeToMinutes(shift.startTime);
                const checkInMins = timeToMinutes(checkInTime);
                
                // Nếu vào trễ hơn giờ quy định
                if (checkInMins > shiftStartMins) {
                    updateData.late_minutes = checkInMins - shiftStartMins;
                } else {
                    updateData.late_minutes = 0;
                }
            } else if (!checkInTime) {
                updateData.late_minutes = 0; // Xóa giờ vào -> Xóa phút trễ
            }
        }

        // --- XỬ LÝ CHECK-OUT & TÍNH PHÚT VỀ SỚM ---
        if (checkOutTime !== undefined) {
             updateData.checkouttime = checkOutTime ? combineDateTime(workDateStr, checkOutTime) : null;

             // Tính lại Early Leave Minutes nếu có Shift
             if (shift && checkOutTime) {
                const shiftEndMins = timeToMinutes(shift.endTime);
                const checkOutMins = timeToMinutes(checkOutTime);

                // Nếu về sớm hơn giờ quy định
                if (checkOutMins < shiftEndMins) {
                    updateData.early_leave_minutes = shiftEndMins - checkOutMins;
                } else {
                    updateData.early_leave_minutes = 0;
                }
             } else if (!checkOutTime) {
                 updateData.early_leave_minutes = 0;
             }
        }

        await log.update(updateData);
        return res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (e) {  {log.checkintime ? new Date(log.checkintime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '--:--'}
        console.error(e);
        return res.status(500).json({ message: e.message });
    }
};

// 2. Lấy cấu hình Shift hiện tại (Modal Chỉnh sửa giờ)
export const getShiftConfig = async (req, res) => {
    try {
        // Giả định hệ thống chỉ có 1 ca làm việc chính hoặc lấy ca đầu tiên
        const shift = await models.Shift.findOne();
        if (!shift) {
            // Trả về mặc định nếu chưa có DB
            return res.status(200).json({ startTime: '08:00:00', endTime: '17:00:00' });
        }
        return res.status(200).json(shift);
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
};

// 3. Cập nhật Shift (Modal Chỉnh sửa giờ)
export const updateShiftConfig = async (req, res) => {
    try {
        const { startTime, endTime } = req.body;
        
        // Tìm ca làm việc đầu tiên
        let shift = await models.Shift.findOne();

        if (shift) {
            await shift.update({ startTime, endTime });
        } else {
            // Nếu chưa có thì tạo mới
            await models.Shift.create({
                shiftId: 1, // ID cố định hoặc auto-increment tùy DB
                startTime,
                endTime
            });
        }

        return res.status(200).json({ message: 'Cập nhật giờ làm việc thành công' });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
};
// ===================== [UPDATE] KHỞI TẠO & CHỐT CÔNG & XỬ LÝ NGHỈ PHÉP =====================
export const initDailyAttendance = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { date } = req.body; // YYYY-MM-DD
        if (!date) {
            await t.rollback();
            return res.status(400).json({ message: "Thiếu thông tin ngày" });
        }

        // --- CẤU HÌNH THỜI GIAN ---
        const now = new Date();
        const LOCAL_OFFSET = 7 * 60 * 60 * 1000;
        const currentDbTime = new Date(now.getTime() + LOCAL_OFFSET); 
        // Lấy chuỗi ngày hiện tại YYYY-MM-DD theo giờ VN để so sánh
        const todayStr = currentDbTime.toISOString().split('T')[0];

        // [YÊU CẦU 1] CHẶN CẬP NHẬT NGÀY TƯƠNG LAI
        if (date > todayStr) {
            await t.rollback();
            return res.status(400).json({ 
                message: `Không thể cập nhật cho ngày tương lai (${date}). Chỉ được cập nhật đến ngày hiện tại.` 
            });
        }

        // --- 1. KIỂM TRA NGÀY NGHỈ / CUỐI TUẦN ---
        const targetDateObj = new Date(date);
        const dayOfWeek = targetDateObj.getDay(); // 0: CN, 6: T7
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        const holiday = await models.Holiday.findOne({
            where: {
                start_date: { [Op.lte]: date },
                end_date: { [Op.gte]: date }
            }
        });

        const isOffDay = isWeekend || !!holiday;

        // --- 2. XỬ LÝ TỰ ĐỘNG CHECK-OUT (CHO NGƯỜI QUÊN CHECK-OUT) ---
        // (Logic giữ nguyên: Đã checkin mà chưa checkout thì chốt công)
        const hangingLogs = await models.Timekeeping.findAll({
            where: {
                workdate: date,
                checkintime: { [Op.ne]: null },
                checkouttime: null
            },
            transaction: t
        });

        const shift = await models.Shift.findOne();
        let autoCheckoutCount = 0;

        if (shift && hangingLogs.length > 0) {
            for (const log of hangingLogs) {
                const overtimeReq = await models.OvertimeRequest.findOne({
                    where: { employeeid: log.employeeid, overtimedate: date, status: 'approved' }
                });

                let targetEndTimeStr = shift.endTime;
                if (overtimeReq && overtimeReq.endtime) {
                    const otEndDate = new Date(overtimeReq.endtime);
                    targetEndTimeStr = otEndDate.toISOString().substring(11, 19);
                }

                const targetEndDbTime = new Date(`${date}T${targetEndTimeStr}Z`);

                if (currentDbTime > targetEndDbTime) {
                    const newStatus = log.late_minutes > 0 ? 'LATE' : 'FULL';
                    await log.update({
                        checkouttime: targetEndDbTime,
                        early_leave_minutes: 0,
                        status: newStatus
                    }, { transaction: t });
                    autoCheckoutCount++;
                }
            }
        }

        // --- 3. KHỞI TẠO DANH SÁCH (NẾU KHÔNG PHẢI NGÀY NGHỈ LỄ/CUỐI TUẦN) ---
        let addedCount = 0;
        let message = "";

        if (isOffDay) {
            message = `Ngày ${date} là ${holiday ? 'Ngày lễ' : 'Cuối tuần'}. Chỉ xử lý chốt công (${autoCheckoutCount} người), KHÔNG tạo danh sách vắng.`;
        } else {
            // Lấy tất cả nhân viên
            const employees = await models.Employee.findAll();

            // Lấy danh sách ID đã có chấm công
            const existingLogs = await models.Timekeeping.findAll({
                where: { workdate: date },
                attributes: ['employeeid'],
                transaction: t
            });
            const existingIds = new Set(existingLogs.map(l => l.employeeid));

            // [YÊU CẦU 2] TÌM NHÂN VIÊN CÓ ĐƠN NGHỈ PHÉP (APPROVED) TRONG NGÀY NÀY
            // startdate <= date <= enddate
            const approvedLeaves = await models.LeaveRequest.findAll({
                where: {
                    status: 'approved',
                    startdate: { [Op.lte]: date },
                    enddate: { [Op.gte]: date }
                },
                attributes: ['employeeid']
            });
            // Tạo Set chứa ID nhân viên nghỉ phép để tra cứu nhanh
            const onLeaveIds = new Set(approvedLeaves.map(l => l.employeeid));

            // Lọc và tạo record mới
            const newRecords = [];
            for (const emp of employees) {
                // Chỉ tạo nếu chưa có record chấm công
                if (!existingIds.has(emp.employeeid)) {
                    // Kiểm tra xem có đang nghỉ phép không
                    const isLeaving = onLeaveIds.has(emp.employeeid);

                    newRecords.push({
                        employeeid: emp.employeeid,
                        workdate: date,
                        // Nếu có đơn nghỉ -> ABSENT_PERMISSION, ngược lại -> ABSENT
                        status: isLeaving ? 'ABSENT_PERMISSION' : 'ABSENT',
                        late_minutes: 0,
                        early_leave_minutes: 0
                    });
                }
            }

            if (newRecords.length > 0) {
                await models.Timekeeping.bulkCreate(newRecords, { transaction: t });
                addedCount = newRecords.length;
            }
            message = `Cập nhật thành công. Tự động chốt công: ${autoCheckoutCount}. Thêm mới: ${addedCount} (Có phép/Vắng).`;
        }

        await t.commit();
        return res.status(200).json({ message, autoCheckoutCount, addedCount });

    } catch (e) {
        await t.rollback();
        console.error(e);
        return res.status(500).json({ message: "Lỗi xử lý: " + e.message });
    }
};

// ===================== [THÊM MỚI] XUẤT EXCEL CHẤM CÔNG NGÀY =====================
export const exportDailyAttendanceExcel = async (req, res) => {
    try {
        const { date } = req.query; // Nhận ngày từ query params (YYYY-MM-DD)
        if (!date) return res.status(400).json({ message: "Vui lòng chọn ngày để xuất báo cáo" });

        // 1. Lấy dữ liệu chấm công kèm thông tin nhân viên
        const data = await models.Timekeeping.findAll({
            where: { workdate: date },
            include: [{
                model: models.Employee,
                as: 'employee',
                attributes: ['employeecode', 'name']
            }],
            order: [
                ['employee', 'employeecode', 'ASC'] // Sắp xếp theo mã nhân viên
            ]
        });

        // 2. Khởi tạo Workbook Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Chấm công ${date}`);

        // 3. Định nghĩa cột
        worksheet.columns = [
            { header: 'STT', key: 'stt', width: 5 },
            { header: 'Mã NV', key: 'code', width: 15 },
            { header: 'Họ tên', key: 'name', width: 25 },
            { header: 'Ngày', key: 'date', width: 15 },
            { header: 'Giờ vào', key: 'checkin', width: 15, style: { alignment: { horizontal: 'center' } } },
            { header: 'Giờ ra', key: 'checkout', width: 15, style: { alignment: { horizontal: 'center' } } },
            { header: 'Trễ (phút)', key: 'late', width: 15, style: { alignment: { horizontal: 'center' } } },
            { header: 'Sớm (phút)', key: 'early', width: 15, style: { alignment: { horizontal: 'center' } } },
            { header: 'Trạng thái', key: 'status', width: 20 },
        ];

        // Helper: Format giờ VN (Khớp logic Frontend)
        const formatTime = (timeVal) => {
            if (!timeVal) return '';
            // Cộng 7 tiếng hoặc dùng múi giờ VN để hiển thị đúng 09:10 thay vì 02:10
            return new Date(timeVal).toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit'
            });
        };

        // Helper: Dịch trạng thái
        const mapStatus = (status) => {
            if (!status) return '';
            const s = status.toUpperCase();
            if (s === 'ON_TIME') return 'Đúng giờ';
            if (s === 'LATE') return 'Đi muộn';
            if (s === 'EARLY_LEAVE') return 'Về sớm';
            if (s === 'FULL') return 'Đủ công';
            if (s === 'ABSENT') return 'Vắng';
            if (s === 'ABSENT_PERMISSION') return 'Vắng có phép';
            if (s.includes('LATE') && s.includes('EARLY')) return 'Muộn & Sớm';
            return status;
        };

        // 4. Đổ dữ liệu vào dòng
        data.forEach((item, index) => {
            worksheet.addRow({
                stt: index + 1,
                code: item.employee?.employeecode,
                name: item.employee?.name,
                date: new Date(item.workdate).toLocaleDateString('vi-VN'),
                checkin: formatTime(item.checkintime),
                checkout: formatTime(item.checkouttime),
                late: item.late_minutes > 0 ? item.late_minutes : '',
                early: item.early_leave_minutes > 0 ? item.early_leave_minutes : '',
                status: mapStatus(item.status)
            });
        });

        // Style Header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E293B' } // Màu slate-800
        };

        // 5. Trả về file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=ChamCong_${date}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (e) {
        console.error("Export Error:", e);
        return res.status(500).json({ message: "Lỗi xuất file Excel: " + e.message });
    }
};