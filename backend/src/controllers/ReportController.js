import initModels from '../models/init-models.js';
import { Sequelize, Op } from 'sequelize';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit-table';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình đường dẫn cho module (để dùng được __dirname trong ES Module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Khởi tạo kết nối DB
const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
    dialect: 'postgres',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
    logging: false, // Tắt log query để console đỡ rối
});

const models = initModels(sequelize);

// =========================================================================
// PHẦN 1: CÁC HÀM HELPER (PHỤ TRỢ TÍNH TOÁN)
// =========================================================================

// Tính tuổi từ ngày sinh
const getAge = (dob) => {
    if (!dob) return 30; // Mặc định nếu thiếu dữ liệu
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

// Tính thâm niên từ ngày vào làm
const getYearsAtCompany = (joinedDate) => {
    if (!joinedDate) return 0; // Mới vào làm
    const diff = Date.now() - new Date(joinedDate).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

// =========================================================================
// PHẦN 2: CONTROLLER THỐNG KÊ BÁO CÁO (BIỂU ĐỒ)
// =========================================================================
export const exportReportPDF = async (req, res) => {
    try {
        console.log("--- BẮT ĐẦU XUẤT PDF ---");

        // 1. LẤY DỮ LIỆU THỐNG KÊ (Giữ nguyên)
        const deptStats = await models.Employee.findAll({
            attributes: [
                [Sequelize.col('department.name'), 'name'],
                [Sequelize.fn('COUNT', Sequelize.col('Employee.employeeid')), 'employees'],
                [Sequelize.fn('SUM', Sequelize.col('Employee.basicsalary')), 'totalSalary']
            ],
            include: [{ model: models.Department, as: 'department', attributes: [] }],
            where: { [Op.or]: [{ status: 'Active' }, { layoff: { [Op.is]: null } }] },
            group: ['department.departmentid', 'department.name'],
            raw: true
        });

        const contractStats = await models.Employee.findAll({
            attributes: [
                [Sequelize.col('contract.name'), 'name'],
                [Sequelize.fn('COUNT', Sequelize.col('Employee.employeeid')), 'value']
            ],
            include: [{ model: models.Contract, as: 'contract', attributes: [] }],
            where: { [Op.or]: [{ status: 'Active' }, { layoff: { [Op.is]: null } }] },
            group: ['contract.contractid', 'contract.name'],
            raw: true
        });

        // 2. CHUẨN BỊ DỮ LIỆU CHO AI (Copy logic chuẩn từ hàm getAttritionPrediction)
        const employeesForAI = await models.Employee.findAll({
            where: { [Op.or]: [{ status: 'Active' }, { layoff: { [Op.is]: null } }] },
            include: [
                { model: models.Department, as: 'department' },
                { model: models.Salary, as: 'salaries', limit: 1, order: [['year', 'DESC'], ['month', 'DESC']] }
            ]
        });

        const pythonInput = employeesForAI.map(emp => {
            const salary = emp.salaries?.length > 0 ? parseFloat(emp.salaries[0].netsalary) : parseFloat(emp.basicsalary || 0);
            return {
                EmployeeID: emp.employeecode || emp.employeeid,
                Name: emp.name,
                Department: emp.department ? emp.department.name : 'Unknown',
                Age: getAge(emp.dateofbirth),
                Gender: emp.gender === true ? 1 : 0,
                YearsAtCompany: getYearsAtCompany(emp.joineddate),
                MonthlyIncome: salary,
                EducationLevel: (emp.educationlevel && emp.educationlevel <= 5) ? parseInt(emp.educationlevel) : 3,
                MaritalStatus: emp.maritalstatus === true ? 1 : 0,
                NumDependents: emp.dependents ? parseInt(emp.dependents) : 0
            };
        });

        // 3. GỌI PYTHON (Đã thêm log để debug)
        const getPythonPrediction = () => {
            return new Promise((resolve, reject) => {
                const scriptPath = path.join(__dirname, '../python/predict_attrition.py');
                console.log("PDF: Đang gọi Python tại:", scriptPath); // Log đường dẫn để kiểm tra

                const pythonProcess = spawn('python', [scriptPath]);
                let dataString = '';
                let errorString = '';

                pythonProcess.stdin.write(JSON.stringify(pythonInput));
                pythonProcess.stdin.end();

                pythonProcess.stdout.on('data', (data) => dataString += data.toString());
                pythonProcess.stderr.on('data', (data) => {
                    errorString += data.toString();
                    console.error("PDF Python Error Log:", data.toString()); // Log lỗi từ Python
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`PDF: Python thoát với mã lỗi ${code}`);
                        console.error("PDF: Chi tiết lỗi:", errorString);
                        // Thay vì trả về rỗng, hãy log ra để biết
                        resolve([]); 
                    } else {
                        try {
                            const results = JSON.parse(dataString);
                            console.log(`PDF: Python trả về ${results.length} nhân viên rủi ro.`);
                            // Kiểm tra xem có lỗi trả về từ chính script Python không
                            if (results.length > 0 && results[0].error) {
                                console.error("PDF: Python logic error:", results[0].error);
                                resolve([]);
                            } else {
                                resolve(results);
                            }
                        } catch (e) {
                            console.error("PDF: Lỗi Parse JSON:", e);
                            console.log("PDF: Dữ liệu nhận được (Raw):", dataString);
                            resolve([]);
                        }
                    }
                });
            });
        };

        // Chờ kết quả AI
        const aiResults = await getPythonPrediction();

        // 4. VẼ PDF (Giữ nguyên phần vẽ, chỉ đảm bảo aiResults có dữ liệu)
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=BaoCao_NhanSu_AI.pdf');
        doc.pipe(res);

        // Font chữ
        const fontPath = path.join(__dirname, '../fonts/Roboto-Regular.ttf');
        if (fs.existsSync(fontPath)) doc.font(fontPath);
        else doc.font('Helvetica');

        // --- NỘI DUNG PDF ---
        doc.fontSize(20).text('BÁO CÁO QUẢN TRỊ & DỰ BÁO NHÂN SỰ', { align: 'center' });
        doc.fontSize(10).text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'center' });
        doc.moveDown(2);

        // 1. Phòng ban
        doc.fontSize(14).text('1. Thống kê Nhân sự & Quỹ lương', { underline: true });
        doc.moveDown(0.5);
        const tableDept = {
            headers: ["Phòng ban", "Số NV", "Quỹ lương (Triệu)"],
            rows: deptStats.map(d => [d.name || 'Khác', d.employees, (parseInt(d.totalSalary||0)/1000000).toLocaleString('vi-VN')])
        };
        await doc.table(tableDept, { width: 500, prepareHeader: () => doc.font(fontPath).fontSize(10), prepareRow: () => doc.font(fontPath).fontSize(10) });
        doc.moveDown(1);

        // 2. Hợp đồng
        doc.fontSize(14).text('2. Cơ cấu Hợp đồng', { underline: true });
        doc.moveDown(0.5);
        const tableContract = {
            headers: ["Loại HĐ", "Số lượng", "Tỷ lệ"],
            rows: contractStats.map(c => {
                const total = contractStats.reduce((s, i) => s + parseInt(i.value), 0);
                return [c.name||'Khác', c.value, `${((parseInt(c.value)/total)*100).toFixed(1)}%`]
            })
        };
        await doc.table(tableContract, { width: 500, prepareHeader: () => doc.font(fontPath).fontSize(10), prepareRow: () => doc.font(fontPath).fontSize(10) });
        doc.moveDown(1);

        // 3. AI RISK
        doc.fontSize(14).fillColor('red').text('3. Cảnh báo Nguy cơ Nghỉ việc (AI)', { underline: true });
        doc.fontSize(10).fillColor('black').text('(Dự báo Realtime từ XGBoost)');
        doc.moveDown(0.5);

        if (aiResults && aiResults.length > 0) {
            const tableRisk = {
                headers: ["Mã", "Họ Tên", "Phòng", "Rủi ro", "%", "Lý do"],
                rows: aiResults.map(r => [r.id, r.name, r.dept, r.riskScore, `${r.probability}%`, r.reason])
            };
            await doc.table(tableRisk, { 
                width: 535,
                columnsSize: [40, 100, 100, 60, 40, 195], // Căn chỉnh cột cho đẹp
                prepareHeader: () => doc.font(fontPath).fontSize(9).fillColor('black'), 
                prepareRow: () => doc.font(fontPath).fontSize(9).fillColor('black')
            });
        } else {
            doc.fontSize(12).text('Không phát hiện nhân viên có nguy cơ cao, hoặc có lỗi khi chạy AI (Xem terminal để biết thêm).');
        }

        doc.end();

    } catch (error) {
        console.error("Lỗi xuất PDF:", error);
        if (!res.headersSent) res.status(500).send("Lỗi Server");
    }
};
// GET /api/reports/stats
export const getReportStats = async (req, res) => {
    try {
        // A. THỐNG KÊ THEO PHÒNG BAN (Nhân sự & Quỹ lương)
        const departmentStats = await models.Employee.findAll({
            attributes: [
                [Sequelize.col('department.name'), 'name'],
                [Sequelize.fn('COUNT', Sequelize.col('Employee.employeeid')), 'employees'],
                [Sequelize.fn('SUM', Sequelize.col('Employee.basicsalary')), 'totalSalary']
            ],
            include: [{
                model: models.Department,
                as: 'department',
                attributes: []
            }],
            where: {
                // Chỉ lấy nhân viên đang hoạt động hoặc chưa nghỉ việc
                [Op.or]: [
                    { status: 'Active' },
                    { layoff: { [Op.is]: null } }
                ]
            },
            group: ['department.departmentid', 'department.name'],
            raw: true
        });

        // Format dữ liệu phòng ban
        const formattedDeptData = departmentStats.map(item => ({
            name: item.name || 'Chưa phân loại',
            employees: parseInt(item.employees),
            salary: parseFloat((parseInt(item.totalSalary || 0) / 1000000).toFixed(1)) // Chia 1 triệu
        }));

        // B. THỐNG KÊ HỢP ĐỒNG (Biểu đồ tròn)
        const contractStats = await models.Employee.findAll({
            attributes: [
                [Sequelize.col('contract.name'), 'name'],
                [Sequelize.fn('COUNT', Sequelize.col('Employee.employeeid')), 'value']
            ],
            include: [{
                model: models.Contract,
                as: 'contract',
                attributes: []
            }],
            where: {
                [Op.or]: [
                    { status: 'Active' },
                    { layoff: { [Op.is]: null } }
                ]
            },
            group: ['contract.contractid', 'contract.name'],
            raw: true
        });

        const formattedContractData = contractStats.map(item => ({
            name: item.name || 'Chưa có HĐ',
            value: parseInt(item.value)
        }));

        // Trả về kết quả
        return res.status(200).json({
            departmentData: formattedDeptData,
            employeeTypeData: formattedContractData
        });

    } catch (error) {
        console.error("Lỗi lấy thống kê báo cáo:", error);
        return res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
};

// =========================================================================
// PHẦN 3: CONTROLLER DỰ BÁO NGHỈ VIỆC (AI - XGBoost)
// =========================================================================

// POST /api/reports/predict-attrition
export const getAttritionPrediction = async (req, res) => {
    try {
        // BƯỚC 1: LẤY DỮ LIỆU TỪ SQL (Active Employees)
        const employees = await models.Employee.findAll({
            where: {
                [Op.or]: [{ status: 'Active' }, { layoff: { [Op.is]: null } }]
            },
            include: [
                { model: models.Department, as: 'department' },
                // Lấy lương tháng mới nhất để làm MonthlyIncome
                {
                    model: models.Salary,
                    as: 'salaries',
                    limit: 1,
                    order: [['year', 'DESC'], ['month', 'DESC']]
                }
            ]
        });

        // BƯỚC 2: "PHIÊN DỊCH" DỮ LIỆU SQL SANG ĐỊNH DẠNG AI HIỂU ĐƯỢC
        // (Xử lý các xung đột về kiểu dữ liệu Date, Boolean, Null...)
        const pythonInput = employees.map(emp => {
            // Lấy lương thực nhận (net), nếu không có lấy lương cơ bản
            const salary = emp.salaries && emp.salaries.length > 0
                ? parseFloat(emp.salaries[0].netsalary)
                : parseFloat(emp.basicsalary || 0);

            return {
                // Thông tin định danh (để hiển thị kết quả)
                EmployeeID: emp.employeecode || emp.employeeid,
                Name: emp.name,
                Department: emp.department ? emp.department.name : 'Unknown',

                // --- CÁC FEATURES (ĐẶC TRƯNG) CHO AI ---
                // Phải khớp tên và kiểu dữ liệu với file train_model.py

                // 1. Age: Chuyển Date -> Int
                Age: getAge(emp.dateofbirth),

                // 2. Gender: Chuyển Boolean (true/false) -> Int (1/0)
                Gender: emp.gender === true ? 1 : 0,

                // 3. YearsAtCompany: Chuyển Date -> Int
                YearsAtCompany: getYearsAtCompany(emp.joineddate),

                // 4. MonthlyIncome: Chuyển Decimal -> Float
                MonthlyIncome: salary,

                // 5. EducationLevel: Giữ nguyên ID nếu <= 5, ngược lại gán mặc định 3
                EducationLevel: (emp.educationlevel && emp.educationlevel <= 5) ? parseInt(emp.educationlevel) : 3,

                // 6. MaritalStatus: Chuyển Boolean -> 1/0 (1=Married)
                MaritalStatus: emp.maritalstatus === true ? 1 : 0,

                // 7. NumDependents: Xử lý null -> 0
                NumDependents: emp.dependents ? parseInt(emp.dependents) : 0
            };
        });

        // BƯỚC 3: GỌI SCRIPT PYTHON ĐỂ DỰ ĐOÁN
        // Đường dẫn tới file python (giả sử nằm ở backend/python/predict_attrition.py)
        // __dirname đang ở backend/src/controllers -> đi ra 2 cấp (../../) -> vào python/
        const pythonScriptPath = path.join(__dirname, '../python/predict_attrition.py');
        const pythonProcess = spawn('python', [pythonScriptPath]);
        let dataString = '';

        // Gửi dữ liệu vào Python qua stdin
        pythonProcess.stdin.write(JSON.stringify(pythonInput));
        pythonProcess.stdin.end();

        // Nhận kết quả từ Python (stdout)
        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        // Nhận log lỗi từ Python (stderr)
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Log: ${data}`);
        });

        // Xử lý khi Python chạy xong
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return res.status(500).json({ message: "Lỗi khi chạy mô hình AI" });
            }
            try {
                const results = JSON.parse(dataString);

                // Kiểm tra nếu Python trả về lỗi (được đóng gói trong JSON)
                if (results.length > 0 && results[0].error) {
                    console.error("Python trả về lỗi:", results[0].error);
                    return res.status(500).json({ message: results[0].error });
                }

                // Trả về danh sách nhân viên có nguy cơ cao
                return res.status(200).json(results);
            } catch (e) {
                console.error("Lỗi parse JSON từ Python:", e);
                return res.status(500).json({ message: "Lỗi định dạng dữ liệu từ AI" });
            }
        });

    } catch (error) {
        console.error("Lỗi API Dự đoán:", error);
        return res.status(500).json({ message: "Lỗi Server", error: error.message });
    }
};