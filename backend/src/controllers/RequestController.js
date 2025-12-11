import dotenv from 'dotenv';
import { Sequelize, Op } from 'sequelize';
import initModels from '../models/init-models.js';

dotenv.config();

// Kết nối DB
const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
    dialect: 'postgres',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
    logging: false,
});

const models = initModels(sequelize);

// =========================================================================
// PHẦN 1: QUẢN LÝ NGHỈ PHÉP (LEAVE)
// =========================================================================

export const getEmployeeLeaves = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) return res.status(400).json({ message: "Thiếu ID nhân viên" });

        const data = await models.LeaveRequest.findAll({
            where: { employeeid: employeeId },
            include: [{
                model: models.Employee,
                as: 'employee',
                attributes: ['employeecode', 'name']
            }],
            order: [['createddate', 'DESC']]
        });
        return res.status(200).json(data);
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const createLeave = async (req, res) => {
    try {
        const { employeeId, type, fromDate, toDate, reason } = req.body;
        // 1. Validate dữ liệu
        if (!employeeId || !fromDate || !toDate) return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });

        await models.LeaveRequest.create({
            employeeid: employeeId,
            leavetype: type,
            startdate: fromDate,
            enddate: toDate,
            reason: reason,
            status: 'pending', // ✅ Mặc định luôn là Chờ duyệt
            createddate: new Date()
        });
        return res.status(201).json({ message: 'Gửi đơn nghỉ phép thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const updateLeave = async (req, res) => {
    try {
        const { id } = req.params;
        // ❌ CHỈ LẤY thông tin cần sửa, KHÔNG lấy 'status' từ req.body
        const { type, fromDate, toDate, reason } = req.body; 
        
        const request = await models.LeaveRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn' });

        // 🔒 CHỈ CHO PHÉP SỬA KHI TRẠNG THÁI LÀ PENDING
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Không thể chỉnh sửa đơn đã được xử lý (Đã duyệt hoặc bị từ chối)' });
        }

        let updateData = {};
        if (type) updateData.leavetype = type;
        if (fromDate) updateData.startdate = fromDate;
        if (toDate) updateData.enddate = toDate;
        if (reason) updateData.reason = reason;
        
        // Lưu ý: Không update field 'status' ở đây -> Trạng thái vẫn giữ nguyên là 'pending'

        await request.update(updateData);
        return res.status(200).json({ message: 'Cập nhật đơn thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const deleteLeave = async (req, res) => {
    try {
        const request = await models.LeaveRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn' });

        // 🔒 CHỈ CHO PHÉP XÓA KHI TRẠNG THÁI LÀ PENDING
        if (request.status !== 'pending') {
            return res.status(400).json({ message: "Không thể xóa đơn đã được xử lý" });
        }
        
        await request.destroy();
        return res.status(200).json({ message: 'Hủy đơn thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};


// =========================================================================
// PHẦN 2: QUẢN LÝ TĂNG CA (OVERTIME)
// =========================================================================

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const checkShiftOverlap = async (dateStr, startTimeStr, endTimeStr) => {
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false; 

    const holiday = await models.Holiday.findOne({
        where: {
            start_date: { [Op.lte]: dateStr },
            end_date: { [Op.gte]: dateStr }
        }
    });
    if (holiday) return false;

    const shift = await models.Shift.findOne(); 
    if (!shift) return false;

    const reqStart = timeToMinutes(startTimeStr);
    const reqEnd = timeToMinutes(endTimeStr);
    const shiftStart = timeToMinutes(shift.startTime);
    const shiftEnd = timeToMinutes(shift.endTime);

    if (reqStart < shiftEnd && reqEnd > shiftStart) {
        return true; 
    }
    return false;
};

export const getEmployeeOvertimes = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) return res.status(400).json({ message: "Thiếu ID nhân viên" });

        const data = await models.OvertimeRequest.findAll({
            where: { employeeid: employeeId },
            include: [{
                model: models.Employee,
                as: 'employee',
                attributes: ['employeecode', 'name']
            }],
            order: [['overtimedate', 'DESC']]
        });
        return res.status(200).json(data);
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const createOvertime = async (req, res) => {
    try {
        const { employeeId, date, startTime, endTime, reason } = req.body;
        
        const isOverlap = await checkShiftOverlap(date, startTime, endTime);
        if (isOverlap) {
            return res.status(400).json({ message: 'Thời gian tăng ca trùng với giờ làm việc chính thức.' });
        }

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
            status: 'pending', // ✅ Mặc định luôn là Chờ duyệt
            createddate: new Date()
        });

        return res.status(201).json({ message: 'Gửi yêu cầu tăng ca thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};

export const updateOvertime = async (req, res) => {
    try {
        const { id } = req.params;
        // ❌ CHỈ LẤY thông tin cần sửa, KHÔNG lấy 'status'
        const { date, startTime, endTime, reason } = req.body;
        
        const request = await models.OvertimeRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn' });

        // 🔒 CHỈ CHO PHÉP SỬA KHI PENDING
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Không thể chỉnh sửa đơn đã được xử lý' });
        }

        // Nếu có sửa ngày giờ -> Check lại trùng ca
        if (date && startTime && endTime) {
             const isOverlap = await checkShiftOverlap(date, startTime, endTime);
             if (isOverlap) {
                 return res.status(400).json({ message: 'Cập nhật thất bại: Thời gian trùng giờ làm việc chính.' });
             }
        }

        let updateData = {};
        if (reason) updateData.workcontent = reason;
        if (date) updateData.overtimedate = date;

        if (date && startTime && endTime) {
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
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn' });
        
        // 🔒 CHỈ CHO PHÉP XÓA KHI PENDING
        if(request.status !== 'pending') {
            return res.status(400).json({message: "Không thể xóa đơn đã được xử lý"});
        }

        await request.destroy();
        return res.status(200).json({ message: 'Hủy đơn thành công' });
    } catch (e) { return res.status(500).json({ message: e.message }); }
};


// =========================================================================
// PHẦN 3: QUẢN LÝ ỨNG LƯƠNG (ADVANCE)
// =========================================================================

export const getEmployeeAdvances = async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) return res.status(400).json({ message: "Thiếu ID nhân viên" });

        const requests = await models.AdvanceRequest.findAll({
            where: { employeeid: employeeId },
            include: [{
                model: models.Employee,
                as: 'employee',
                attributes: ['employeecode', 'name']
            }],
            order: [['createddate', 'DESC']]
        });

        return res.status(200).json(requests);
    } catch (error) { return res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

export const createAdvanceRequest = async (req, res) => {
    try {
        const { employeeId, date, amount, reason } = req.body;

        if (!employeeId || !date || !amount) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        const requestDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        requestDate.setHours(0, 0, 0, 0);

        if (requestDate < today) {
            return res.status(400).json({ message: 'Ngày ứng lương phải từ hôm nay trở đi!' });
        }

        // Logic check hạn mức 30% lương thực nhận
        const currentDate = new Date();
        let prevMonth = currentDate.getMonth(); 
        let prevYear = currentDate.getFullYear();
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        } 

        const lastMonthSalary = await models.Salary.findOne({
            where: {
                employeeid: employeeId,
                month: prevMonth,
                year: prevYear
            }
        });

        if (!lastMonthSalary) {
            return res.status(400).json({ message: `Chưa có dữ liệu lương tháng ${prevMonth}/${prevYear}. Không thể ứng.` });
        }

        const netSalary = parseFloat(lastMonthSalary.netsalary) || 0;
        const maxAdvanceAmount = netSalary * 0.3;

        if (parseFloat(amount) > maxAdvanceAmount) {
            const formattedMax = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxAdvanceAmount);
            return res.status(400).json({ 
                message: `Vượt quá hạn mức 30% lương tháng trước. Tối đa: ${formattedMax}` 
            });
        }

        const advanceMonth = requestDate.getMonth() + 1;
        const advanceYear = requestDate.getFullYear();

        await models.AdvanceRequest.create({
            employeeid: employeeId,
            advanceamount: amount,
            advancemonth: advanceMonth,
            advanceyear: advanceYear,
            createddate: date, 
            reason: reason,
            status: 'pending' // ✅ Mặc định luôn là Chờ duyệt
        });

        return res.status(201).json({ message: 'Gửi đơn ứng lương thành công!' });

    } catch (error) { return res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

export const updateAdvanceRequest = async (req, res) => {
    try {
        const { id } = req.params;
        // ❌ CHỈ LẤY thông tin cần sửa, KHÔNG lấy 'status'
        const { amount, reason, date } = req.body;

        const request = await models.AdvanceRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn!' });

        // 🔒 CHỈ CHO PHÉP SỬA KHI PENDING
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Không thể sửa đơn đã được xử lý!' });
        }

        let updateData = {};
        if (amount) updateData.advanceamount = amount;
        if (reason) updateData.reason = reason;
        if (date) {
            const dateObj = new Date(date);
            updateData.createddate = date;
            updateData.advancemonth = dateObj.getMonth() + 1;
            updateData.advanceyear = dateObj.getFullYear();
        }

        await request.update(updateData);
        return res.status(200).json({ message: 'Cập nhật thành công!' });
    } catch (error) { return res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};

export const deleteAdvanceRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await models.AdvanceRequest.findByPk(id);
        if (!request) return res.status(404).json({ message: 'Không tìm thấy đơn!' });

        // 🔒 CHỈ CHO PHÉP XÓA KHI PENDING
        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Không thể hủy đơn đã được xử lý!' });
        }

        await request.destroy();
        return res.status(200).json({ message: 'Hủy đơn thành công!' });
    } catch (error) { return res.status(500).json({ message: 'Lỗi server', error: error.message }); }
};