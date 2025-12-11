import dotenv from 'dotenv';
import { Sequelize, Op } from 'sequelize'; // Thêm Op
import initModels from '../models/init-models.js';
import ExcelJS from 'exceljs';

dotenv.config();

const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
    dialect: 'postgres',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
    logging: false,
});

const models = initModels(sequelize);

const getConfigMap = async (model, keyField = null) => {
    const data = await model.findAll({ where: { status: true } });
    if (!keyField) return data;
    return data.reduce((map, item) => {
        map[item[keyField]] = item;
        return map;
    }, {});
};

// Hàm kiểm tra ngày có phải cuối tuần (T7, CN)
const isWeekend = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
};

// Hàm kiểm tra ngày có nằm trong danh sách ngày lễ không
const isHolidayDate = (dateStr, holidayList) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return holidayList.some(h => {
        const start = new Date(h.start_date);
        const end = new Date(h.end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return d >= start && d <= end;
    });
};

// ==========================================
// A. QUẢN LÝ CẤU HÌNH THUẾ (TaxConfig)
// ==========================================

// 1. Lấy danh sách bậc thuế
export const getTaxConfigs = async (req, res) => {
    try {
        const data = await models.TaxConfig.findAll({
            order: [['taxlevel', 'ASC']],
            where: { status: true }
        });
        return res.status(200).json(data);
    } catch (error) {
        console.error('Lỗi lấy cấu hình thuế:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 2. Tạo bậc thuế mới
export const createTaxConfig = async (req, res) => {
    try {
        const { level, min, max, rate } = req.body;

        if (!level || min === undefined || !rate) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        const newConfig = await models.TaxConfig.create({
            taxlevel: level,
            minamount: min,
            maxamount: max || null,
            taxrate: rate,
            status: true
        });

        return res.status(201).json({ message: 'Thêm bậc thuế thành công!', data: newConfig });
    } catch (error) {
        console.error('Lỗi tạo thuế:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 3. Cập nhật bậc thuế
export const updateTaxConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { level, min, max, rate } = req.body;

        const config = await models.TaxConfig.findByPk(id);
        if (!config) return res.status(404).json({ message: 'Không tìm thấy cấu hình!' });

        await config.update({
            taxlevel: level,
            minamount: min,
            maxamount: max || null,
            taxrate: rate
        });

        return res.status(200).json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        console.error('Lỗi cập nhật thuế:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 4. Xóa bậc thuế
export const deleteTaxConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await models.TaxConfig.destroy({ where: { taxconfigid: id } });

        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy để xóa!' });
        return res.status(200).json({ message: 'Xóa thành công!' });
    } catch (error) {
        console.error('Lỗi xóa thuế:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ==========================================
// B. QUẢN LÝ GIẢM TRỪ (DeductionConfig)
// ==========================================

// 5. Lấy danh sách giảm trừ
export const getDeductionConfigs = async (req, res) => {
    try {
        const data = await models.DeductionConfig.findAll({
            where: { status: true }
        });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 6. Cập nhật mức giảm trừ
export const updateDeductionConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;

        const config = await models.DeductionConfig.findByPk(id);
        if (!config) return res.status(404).json({ message: 'Không tìm thấy mục giảm trừ!' });

        await config.update({ amount });
        return res.status(200).json({ message: 'Cập nhật mức giảm trừ thành công!' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ==========================================
// C. QUẢN LÝ PHẠT (PenaltyConfig)
// ==========================================

// 7. Lấy danh sách phạt
export const getPenaltyConfigs = async (req, res) => {
    try {
        const data = await models.PenaltyConfig.findAll({
            order: [['min_minutes', 'ASC']],
            where: { status: true }
        });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 8. Tạo quy định phạt mới
export const createPenaltyConfig = async (req, res) => {
    try {
        const { type, min, max, rate, amount, desc } = req.body;

        const newPenalty = await models.PenaltyConfig.create({
            penaltytype: type,
            min_minutes: min,
            max_minutes: max,
            penaltyrate: rate || 0,
            fixedamount: amount || 0,
            description: desc,
            status: true
        });

        return res.status(201).json({ message: 'Thêm quy định phạt thành công!', data: newPenalty });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 9. Cập nhật quy định phạt
export const updatePenaltyConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, min, max, rate, amount, desc } = req.body;

        const config = await models.PenaltyConfig.findByPk(id);
        if (!config) return res.status(404).json({ message: 'Không tìm thấy quy định!' });

        await config.update({
            penaltytype: type,
            min_minutes: min,
            max_minutes: max,
            penaltyrate: rate,
            fixedamount: amount,
            description: desc
        });

        return res.status(200).json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 10. Xóa quy định phạt
export const deletePenaltyConfig = async (req, res) => {
    try {
        const { id } = req.params;
        await models.PenaltyConfig.destroy({ where: { penaltyconfigid: id } });
        return res.status(200).json({ message: 'Xóa thành công!' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// ==========================================
// D. TÍNH TOÁN BẢNG LƯƠNG (Monthly Payroll)
// ==========================================

// 11. API Tạo bảng lương tháng
export const createMonthlyPayroll = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { month, year } = req.body;

        if (!month || !year) {
            return res.status(400).json({ message: 'Vui lòng chọn tháng và năm!' });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // 1. Tải dữ liệu Cấu hình & Nhân viên
        const [
            insuranceConfigs,
            taxConfigs,
            penaltyConfigs,
            deductionConfigs,
            otConfigList,
            employees, // <--- Sẽ cập nhật include ở đây
            holidays
        ] = await Promise.all([
            models.InsuranceConfig.findAll({ where: { status: true } }),
            models.TaxConfig.findAll({ where: { status: true }, order: [['taxlevel', 'ASC']] }),
            models.PenaltyConfig.findAll({ where: { status: true } }),
            models.DeductionConfig.findAll({ where: { status: true } }),
            models.OtConfig.findAll({ where: { is_active: true } }),
            models.Employee.findAll({
                where: { status: { [Op.ne]: 'Resigned' } },
                include: [
                    {
                        model: models.EmployeePosition,
                        as: 'employee_positions', // ⚠️ Lưu ý: Kiểm tra alias này trong init-models.js
                        include: [{
                            model: models.Position,
                            as: 'position' // ⚠️ Alias của Position trong EmployeePosition
                        }]
                    }
                ]
            }),
            models.Holiday.findAll({
                where: {
                    [Op.or]: [
                        { start_date: { [Op.between]: [startStr, endStr] } },
                        { end_date: { [Op.between]: [startStr, endStr] } }
                    ]
                }
            })
        ]);

        // Map OT Config
        const otMap = {};
        otConfigList.forEach(c => { otMap[c.ot_config_id] = parseFloat(c.rate); });

        // Map Penalty Config (Tìm PEN_4 và PEN_6)
        // PEN_4: Dùng ID 4 (theo yêu cầu user "tính là PEN_4")
        const pen4Config = penaltyConfigs.find(p => p.penaltyconfigid == 4);
        // PEN_6: Dùng ID 6 hoặc type 'unauthorized_absence'
        const pen6Config = penaltyConfigs.find(p => p.penaltyconfigid == 6 || p.penaltytype === 'unauthorized_absence');

        // Map cấu hình Giảm trừ
        const personalDedConfig = deductionConfigs.find(d => d.deductiontype === 'personal');
        const dependentDedConfig = deductionConfigs.find(d => d.deductiontype === 'dependents');
        const BASE_PERSONAL_DEDUCTION = personalDedConfig ? parseFloat(personalDedConfig.amount) : 11000000;
        const BASE_DEPENDENT_DEDUCTION = dependentDedConfig ? parseFloat(dependentDedConfig.amount) : 4400000;

        // 2. Tải dữ liệu Giao dịch
        const [overtimeRecords, advanceRecords, timekeepingRecords, allowances] = await Promise.all([
            models.OvertimeRequest.findAll({
                where: {
                    status: 'approved',
                    overtimedate: { [Op.between]: [startDate, endDate] }
                }
            }),
            models.AdvanceRequest.findAll({
                where: {
                    status: 'approved',
                    createddate: { [Op.between]: [startDate, endDate] }
                }
            }),
            models.Timekeeping.findAll({
                where: { workdate: { [Op.between]: [startDate, endDate] } }
            }),
            models.Allowance.findAll({ where: { status: true } })
        ]);

        const salaryRecords = [];
        const STANDARD_WORK_DAYS = 26;

        // 3. Loop tính toán
        for (const emp of employees) {
            const basicSalary = parseFloat(emp.basicsalary) || 0;
            const empId = emp.employeeid;

            // --- A. CÁC ĐƠN GIÁ ---
            const hourlySalary = basicSalary / (STANDARD_WORK_DAYS * 8);
            const dailySalary = basicSalary / STANDARD_WORK_DAYS;

            // --- B. LƯƠNG CHỨC VỤ ---
            let maxBonus = 0;
            const positionsList = emp.employee_positions || []; // Lấy danh sách từ bảng trung gian

            if (positionsList.length > 0) {
                positionsList.forEach(posRecord => {
                    // posRecord là dòng trong bảng employee_position
                    // posRecord.position là thông tin bảng position join vào
                    if (posRecord.position && posRecord.position.bonus) {
                        const currentBonus = parseFloat(posRecord.position.bonus);
                        if (currentBonus > maxBonus) {
                            maxBonus = currentBonus;
                        }
                    }
                });
            }

            // positionSalary = basicSalary * max(POS_xx)
            const positionSalary = basicSalary * maxBonus;

            // --- C. PHỤ CẤP ---
            let totalAllowance = 0;
            allowances.forEach(allw => {
                if (allw.apply_to_all) totalAllowance += parseFloat(allw.amount);
            });
            const finalTotalAllowance = totalAllowance + positionSalary;

            // --- D. XỬ LÝ CHẤM CÔNG & LƯƠNG THỰC TẾ ---
            const empTimelogs = timekeepingRecords.filter(tk => tk.employeeid === empId);

            // Lọc ra các ngày làm việc thực tế (Không tính ngày có trạng thái VẮNG)
            // Giả định: status 'ABSENT' và 'ABSENT_PERMISSION' là record đánh dấu vắng
            const workingLogs = empTimelogs.filter(tk =>
                tk.status !== 'ABSENT' && tk.status !== 'ABSENT_PERMISSION'
            );
            const actualWorkingDays = workingLogs.length;
            const actualWorkingSalary = dailySalary * actualWorkingDays;

            // --- E. TÍNH PHẠT (PENALTY) ---
            let totalPenalty = 0;

            // E1. Phạt đi muộn / về sớm (Chỉ tính trên những ngày CÓ đi làm)
            workingLogs.forEach(log => {
                const late = log.late_minutes || 0;
                const early = log.early_leave_minutes || 0;

                const calcOne = (mins, type) => {
                    if (mins <= 0) return 0;
                    const cfg = penaltyConfigs.find(p =>
                        p.penaltytype === type && mins >= p.min_minutes && mins <= p.max_minutes
                    );
                    if (cfg) {
                        const fixed = parseFloat(cfg.fixedamount) || 0;
                        const rate = parseFloat(cfg.penaltyrate) || 0;
                        return fixed > 0 ? fixed : (rate * dailySalary);
                    }
                    return 0;
                };
                totalPenalty += calcOne(late, 'late');
                totalPenalty += calcOne(early, 'early_leave');
            });

            // E2. Phạt Vắng (Dựa trên status trong Timekeeping)
            const unauthorizedLogs = empTimelogs.filter(tk => tk.status === 'ABSENT');
            const permissionLogs = empTimelogs.filter(tk => tk.status === 'ABSENT_PERMISSION');

            // Tính phạt Vắng Không Phép (PEN_6)
            if (unauthorizedLogs.length > 0) {
                const rate = pen6Config ? parseFloat(pen6Config.penaltyrate) : 1.5;
                totalPenalty += unauthorizedLogs.length * dailySalary * rate;
            }

            // Tính "phạt" Vắng Có Phép (PEN_4)
            if (permissionLogs.length > 0) {
                const rate = pen4Config ? parseFloat(pen4Config.penaltyrate) : 1.0;
                // Lưu ý: rate PEN_4 thường là 1.0 nếu muốn trừ lương ngày đó, 
                // hoặc 0 nếu chỉ trừ công (đã trừ ở actualWorkingSalary rồi).
                // Ở đây code trừ thêm theo yêu cầu "tính là PEN_4".
                totalPenalty += permissionLogs.length * dailySalary * rate;
            }

            // --- F. TÍNH OT (Overtime) ---
            const empOT = overtimeRecords.filter(ot => ot.employeeid === empId);
            let otTotalAmount = 0;
            const otUpdatePromises = []; // Mảng chứa các lệnh update DB

            // Dùng vòng lặp for...of để dễ xử lý logic (thay vì forEach)
            for (const rec of empOT) {
                const hours = parseFloat(rec.overtimehours || 0);
                const otDateStr = rec.overtimedate;

                // 1. Xác định hệ số (Rate)
                let appliedRate = 1.5; // Mặc định: Ngày thường (ID 1)

                if (isHolidayDate(otDateStr, holidays)) {
                    appliedRate = otMap[3] || 3.0; // Ngày lễ
                } else if (isWeekend(otDateStr)) {
                    appliedRate = otMap[2] || 2.0; // Cuối tuần
                } else {
                    appliedRate = otMap[1] || 1.5; // Ngày thường
                }

                // 2. Tính thành tiền cho ĐƠN NÀY
                const amount = hours * hourlySalary * appliedRate;

                // 3. Cộng vào tổng lương OT tháng
                otTotalAmount += amount;

                // 4. Tạo lệnh Update ngược lại vào bảng OvertimeRequest
                // Chỉ update nếu số tiền chưa có hoặc bị sai lệch
                // Sử dụng transaction 't' để đảm bảo an toàn dữ liệu
                otUpdatePromises.push(
                    rec.update({
                        overtimeamount: amount
                    }, { transaction: t })
                );
            }

            // Thực thi tất cả các lệnh update OT của nhân viên này cùng lúc
            await Promise.all(otUpdatePromises);

            // --- G. ỨNG LƯƠNG & BẢO HIỂM ---
            const empAdvance = advanceRecords.filter(adv => adv.employeeid === empId);
            const advanceAmount = empAdvance.reduce((sum, rec) => sum + parseFloat(rec.advanceamount || 0), 0);

            let insuranceAmount = 0;
            insuranceConfigs.forEach(conf => {
                const maxBase = parseFloat(conf.maxsalarybase) || Infinity;
                const salaryBase = Math.min(basicSalary, maxBase);
                insuranceAmount += salaryBase * parseFloat(conf.employeerate);
            });

            // --- H. THUẾ TNCN ---
            const grossIncome = actualWorkingSalary + positionSalary + totalAllowance + otTotalAmount;

            const dependentCount = emp.dependents || 0;
            const totalDeduction = BASE_PERSONAL_DEDUCTION + (dependentCount * BASE_DEPENDENT_DEDUCTION);

            const taxableIncome = Math.max(0, grossIncome - insuranceAmount - totalDeduction);

            let taxAmount = 0;
            if (taxableIncome > 0) {
                let remaining = taxableIncome;
                let prevMax = 0;
                for (const tier of taxConfigs) {
                    const max = parseFloat(tier.maxamount) || Infinity;
                    const rate = parseFloat(tier.taxrate);
                    const range = max - prevMax;
                    const taxableInTier = Math.min(remaining, range);

                    if (taxableInTier > 0) {
                        taxAmount += taxableInTier * rate;
                        remaining -= taxableInTier;
                        prevMax = max;
                    } else break;
                }
            }

            // --- I. THỰC LĨNH ---
            const netSalary = grossIncome - insuranceAmount - taxAmount - totalPenalty - advanceAmount;

            salaryRecords.push({
                employeeid: empId,
                month, year,
                basicsalary: basicSalary,
                totalallowance: finalTotalAllowance,
                overtimeamount: otTotalAmount,
                insuranceamount: insuranceAmount,
                taxamount: taxAmount,
                penaltyamount: totalPenalty,
                advanceamount: advanceAmount,
                otherdeductions: 0,
                netsalary: netSalary,
                status: 'pending',
                calculateddate: new Date()
            });
        }

        // 4. Lưu dữ liệu
        await models.Salary.destroy({
            where: { month, year, status: { [Op.ne]: 'paid' } },
            transaction: t
        });
        await models.Salary.bulkCreate(salaryRecords, { transaction: t });

        await t.commit();
        return res.status(200).json({ message: 'Tính lương thành công!', count: salaryRecords.length });

    } catch (error) {
        await t.rollback();
        console.error('Lỗi tính lương:', error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 12. API Lấy danh sách bảng lương (Có Lọc & Tìm kiếm)
export const getMonthlySalaries = async (req, res) => {
    try {
        const { month, year, search } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: 'Vui lòng cung cấp tháng và năm!' });
        }

        // Điều kiện lọc cơ bản
        const whereClause = {
            month: month,
            year: year
        };

        // Điều kiện tìm kiếm theo tên nhân viên
        const includeClause = [{
            model: models.Employee,
            as: 'employee',
            attributes: ['employeecode', 'name'],
            include: [{ model: models.Jobtitle, as: 'jobtitle', attributes: ['name'] }],
            where: search ? {
                name: { [Op.iLike]: `%${search}%` } // Tìm gần đúng không phân biệt hoa thường
            } : undefined
        }];

        const salaries = await models.Salary.findAll({
            where: whereClause,
            include: includeClause,
            order: [[{ model: models.Employee, as: 'employee' }, 'employeeid', 'ASC']]
        });

        return res.status(200).json(salaries);
    } catch (error) {
        console.error("Lỗi lấy bảng lương:", error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 13. API Xuất Bảng Lương ra Excel
export const exportPayrollExcel = async (req, res) => {
    try {
        const { month, year } = req.query;

        // Lấy dữ liệu giống như hàm xem danh sách
        const salaries = await models.Salary.findAll({
            where: { month, year },
            include: [{
                model: models.Employee,
                as: 'employee',
                attributes: ['employeecode', 'name'],
                include: [{ model: models.Jobtitle, as: 'jobtitle', attributes: ['name'] }]
            }],
            order: [['employeeid', 'ASC']]
        });

        if (!salaries || salaries.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu lương cho tháng này!' });
        }

        // Tạo Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Lương T${month}-${year}`);

        // Header Style
        worksheet.mergeCells('A1:L1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `BẢNG THANH TOÁN LƯƠNG THÁNG ${month}/${year}`;
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        titleCell.font = { name: 'Arial', size: 16, bold: true };

        // Columns Header
        const headerRow = worksheet.addRow([
            'STT', 'Mã NV', 'Họ Tên', 'Chức Danh',
            'Lương Cơ Bản', 'Phụ Cấp', 'Lương OT',
            'Bảo Hiểm', 'Thuế TNCN', 'Phạt', 'Ứng Lương', 'THỰC LĨNH'
        ]);

        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '166534' } }; // Màu xanh lá
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Data Rows
        let totalNet = 0;
        salaries.forEach((s, index) => {
            const row = worksheet.addRow([
                index + 1,
                s.employee?.employeecode,
                s.employee?.name,
                s.employee?.jobtitle?.name,
                Number(s.basicsalary),
                Number(s.totalallowance),
                Number(s.overtimeamount),
                Number(s.insuranceamount),
                Number(s.taxamount),
                Number(s.penaltyamount),
                Number(s.advanceamount),
                Number(s.netsalary)
            ]);

            totalNet += Number(s.netsalary);

            // Format Currency Cells
            [5, 6, 7, 8, 9, 10, 11, 12].forEach(colIdx => {
                row.getCell(colIdx).numFmt = '#,##0';
            });
        });

        // Footer Total
        const footerRow = worksheet.addRow(['', '', '', 'TỔNG CỘNG:', '', '', '', '', '', '', '', totalNet]);
        footerRow.getCell(4).font = { bold: true };
        footerRow.getCell(12).font = { bold: true, color: { argb: 'FF0000' } };
        footerRow.getCell(12).numFmt = '#,##0';

        // Column Widths
        worksheet.columns = [
            { width: 5 }, { width: 12 }, { width: 25 }, { width: 20 },
            { width: 15 }, { width: 15 }, { width: 15 },
            { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 20 }
        ];

        // Response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=BangLuong_T${month}_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Lỗi xuất Excel:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 14. Lấy danh sách đơn ứng lương (kèm lọc & tìm kiếm)
export const getAdvanceRequests = async (req, res) => {
    try {
        const { month, year, search, status } = req.query;

        // Tạo điều kiện lọc cơ bản
        let whereClause = {};

        // Nếu có lọc theo tháng/năm (dựa trên ngày tạo hoặc cột advancemonth/year)
        if (month && year) {
            whereClause.advancemonth = month;
            whereClause.advanceyear = year;
        }

        // Nếu có lọc theo trạng thái
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        // Cấu hình include Employee để lấy tên
        const includeClause = [{
            model: models.Employee,
            as: 'employee', // Đảm bảo model Employee đã được định nghĩa quan hệ trong init-models
            attributes: ['employeecode', 'name'],
            where: search ? {
                name: { [Op.iLike]: `%${search}%` } // Tìm kiếm theo tên nhân viên
            } : undefined
        }];

        const requests = await models.AdvanceRequest.findAll({
            where: whereClause,
            include: includeClause,
            order: [['createddate', 'DESC']] // Mới nhất lên đầu
        });

        return res.status(200).json(requests);
    } catch (error) {
        console.error("Lỗi lấy danh sách ứng lương:", error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 15. Tạo đơn ứng lương mới
export const createAdvanceRequest = async (req, res) => {
    try {
        const { employeeId, date, amount, reason } = req.body;

        if (!employeeId || !date || !amount) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
        }

        // --- 1. KIỂM TRA NGÀY (Không được chọn ngày trong quá khứ) ---
        const requestDate = new Date(date);
        const today = new Date();
        // Reset giờ về 00:00:00 để so sánh chính xác theo ngày
        today.setHours(0, 0, 0, 0);
        requestDate.setHours(0, 0, 0, 0);

        if (requestDate < today) {
            return res.status(400).json({ message: 'Ngày ứng lương phải từ hôm nay trở đi!' });
        }

        // --- 2. KIỂM TRA HẠN MỨC (Max 30% lương thực nhận tháng trước) ---

        // Tính toán tháng/năm trước đó
        const currentDate = new Date();
        let prevMonth = currentDate.getMonth(); // getMonth() trả về 0-11
        let prevYear = currentDate.getFullYear();

        // Nếu tháng hiện tại là tháng 1 (index 0) thì tháng trước là 12 năm ngoái
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }
        // Lưu ý: DB lưu tháng là 1-12, getMonth() trả về 0-11. 
        // Ví dụ: Hiện tại tháng 5 (index 4). prevMonth gán = 4 (tức là tháng 4 trong DB). Logic này đúng.

        // Tìm bảng lương tháng trước của nhân viên
        const lastMonthSalary = await models.Salary.findOne({
            where: {
                employeeid: employeeId,
                month: prevMonth,
                year: prevYear
            }
        });

        // Trường hợp không có dữ liệu lương tháng trước
        if (!lastMonthSalary) {
            return res.status(400).json({
                message: `Không tìm thấy dữ liệu lương tháng ${prevMonth}/${prevYear}. Nhân viên chưa thể ứng lương.`
            });
        }

        const netSalary = parseFloat(lastMonthSalary.netsalary) || 0;
        const maxAdvanceAmount = netSalary * 0.3; // 30%

        if (parseFloat(amount) > maxAdvanceAmount) {
            // Format tiền tệ để hiển thị thông báo lỗi đẹp hơn
            const formattedMax = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(maxAdvanceAmount);
            return res.status(400).json({
                message: `Số tiền ứng vượt quá hạn mức cho phép (30% lương tháng trước). Tối đa được ứng: ${formattedMax}`
            });
        }

        // --- 3. TẠO ĐƠN NẾU THỎA MÃN ---

        // Tính tháng/năm cho đơn ứng (dựa trên ngày ứng) để kế toán biết trừ vào lương tháng nào
        const advanceMonth = requestDate.getMonth() + 1;
        const advanceYear = requestDate.getFullYear();

        const newRequest = await models.AdvanceRequest.create({
            employeeid: employeeId,
            advanceamount: amount,
            advancemonth: advanceMonth,
            advanceyear: advanceYear,
            createddate: date,
            reason: reason,
            status: 'pending'
        });

        return res.status(201).json({ message: 'Tạo đơn ứng lương thành công!', data: newRequest });

    } catch (error) {
        console.error("Lỗi tạo đơn ứng lương:", error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 16. Cập nhật đơn ứng lương (Sửa thông tin HOẶC Duyệt/Từ chối)
export const updateAdvanceRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, amount, reason, date } = req.body; // status: 'approved' | 'rejected'

        const request = await models.AdvanceRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy đơn ứng lương!' });
        }

        // Logic cập nhật object
        let updateData = {};

        // Nếu cập nhật trạng thái (Duyệt/Từ chối)
        if (status) {
            updateData.status = status;
            // Nếu approved, có thể lưu thêm người duyệt/ngày duyệt nếu có thông tin từ req
            if (status === 'approved') {
                updateData.approveddate = new Date();
                // updateData.approvedby = req.user.userid; // Nếu có middleware xác thực user
            }
        }

        // Nếu sửa thông tin (chỉ cho phép khi chưa duyệt hoặc admin sửa)
        if (amount) updateData.advanceamount = amount;
        if (reason) updateData.reason = reason;
        if (date) {
            const dateObj = new Date(date);
            updateData.createddate = date;
            updateData.advancemonth = dateObj.getMonth() + 1;
            updateData.advanceyear = dateObj.getFullYear();
        }

        await request.update(updateData);

        return res.status(200).json({ message: 'Cập nhật thành công!', data: request });
    } catch (error) {
        console.error("Lỗi cập nhật ứng lương:", error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 17. Xóa đơn ứng lương
export const deleteAdvanceRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await models.AdvanceRequest.findByPk(id);
        if (!request) {
            return res.status(404).json({ message: 'Không tìm thấy đơn!' });
        }

        if (request.status === 'approved') {
            return res.status(400).json({ message: 'Không thể xóa đơn đã được duyệt!' });
        }

        await request.destroy();
        return res.status(200).json({ message: 'Xóa thành công!' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// 18. API Xuất Excel Danh sách Ứng lương
export const exportAdvanceRequestsExcel = async (req, res) => {
    try {
        const { month, year, search, status } = req.query;

        // 1. Tái sử dụng bộ lọc giống hệt hàm lấy danh sách
        let whereClause = {};

        if (month && year) {
            whereClause.advancemonth = month;
            whereClause.advanceyear = year;
        }

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        const includeClause = [{
            model: models.Employee,
            as: 'employee',
            attributes: ['employeecode', 'name'],
            where: search ? {
                name: { [Op.iLike]: `%${search}%` }
            } : undefined
        }];

        const requests = await models.AdvanceRequest.findAll({
            where: whereClause,
            include: includeClause,
            order: [['createddate', 'DESC']]
        });

        if (!requests || requests.length === 0) {
            return res.status(404).json({ message: 'Không có dữ liệu để xuất!' });
        }

        // 2. Tạo Workbook Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách ứng lương');

        // Header Style
        worksheet.mergeCells('A1:H1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `DANH SÁCH ỨNG LƯƠNG ${month ? `THÁNG ${month}/${year}` : ''}`;
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        titleCell.font = { name: 'Arial', size: 16, bold: true };

        // Column Headers
        const headerRow = worksheet.addRow([
            'STT', 'Mã NV', 'Họ Tên', 'Ngày Ứng',
            'Số Tiền', 'Lý Do', 'Trạng Thái', 'Ngày Duyệt'
        ]);

        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EA580C' } }; // Màu cam
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // 3. Mapping dữ liệu vào rows
        requests.forEach((req, index) => {
            let statusText = '';
            switch (req.status) {
                case 'approved': statusText = 'Đã duyệt'; break;
                case 'rejected': statusText = 'Từ chối'; break;
                default: statusText = 'Chờ duyệt';
            }

            const row = worksheet.addRow([
                index + 1,
                req.employee?.employeecode,
                req.employee?.name,
                req.createddate ? new Date(req.createddate).toLocaleDateString('vi-VN') : '',
                Number(req.advanceamount),
                req.reason,
                statusText,
                req.approveddate ? new Date(req.approveddate).toLocaleDateString('vi-VN') : ''
            ]);

            // Format cột Tiền (Column E - index 5)
            row.getCell(5).numFmt = '#,##0';
        });

        // Set độ rộng cột
        worksheet.columns = [
            { width: 5 }, { width: 15 }, { width: 25 }, { width: 15 },
            { width: 15 }, { width: 30 }, { width: 15 }, { width: 15 }
        ];

        // 4. Response file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=UngLuong_${new Date().getTime()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Lỗi xuất Excel ứng lương:', error);
        res.status(500).json({ message: 'Lỗi server khi xuất file' });
    }
};
// 19. Lấy danh sách nhân viên (ID, Name, Code) cho Dropdown
export const getEmployeesList = async (req, res) => {
    try {
        const employees = await models.Employee.findAll({
            attributes: ['employeeid', 'employeecode', 'name'],
            // Có thể thêm điều kiện chỉ lấy nhân viên đang hoạt động nếu cần
            // where: { status: { [Op.ne]: 'Resigned' } }, 
            order: [['name', 'ASC']]
        });
        return res.status(200).json(employees);
    } catch (error) {
        console.error("Lỗi lấy danh sách nhân viên:", error);
        return res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};