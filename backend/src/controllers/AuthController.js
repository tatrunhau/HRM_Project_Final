import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Sequelize, Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import initModels from '../models/init-models.js'; // ✅ Models ESM

dotenv.config();

const ACCESS_TOKEN_TTL = '15m'; // Thời gian sống của access token
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;// Thời gian sống của refresh token

// ✅ Kết nối Sequelize tới Supabase
const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});

// ✅ Khởi tạo models
const models = initModels(sequelize);

/**
 * 🔹 Sinh mật khẩu ngẫu nhiên (6–12 ký tự)
 */
function randomPassword() {
  const length = Math.floor(Math.random() * (12 - 6 + 1)) + 6;
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .slice(0, length)
    .map(b => chars[b % chars.length])
    .join('');
}

/**
 * 🔹 Gửi email qua nodemailer
 */
async function sendEmail(to, subject, text) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  // Nếu chưa có SMTP config → in ra console thay vì gửi
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.warn('⚠️ Chưa cấu hình SMTP, in nội dung email ra console:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    return { sent: false, info: 'no-smtp-config' };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const info = await transporter.sendMail({ from: SMTP_FROM, to, subject, text });
  return { sent: true, info };
}

/**
 * 🔹 API: Tạo tài khoản người dùng mới
 */
/**
 * 🔹 API: Tạo tài khoản người dùng mới
 */
export const createAccount = async (req, res) => {
  try {
    // 1. Nhận dữ liệu từ Frontend (Bao gồm cả jobtitleid)
    const { employeeid, jobtitleid, role } = req.body;

    // 2. Kiểm tra thiếu dữ liệu đầu vào
    if (!employeeid || !jobtitleid || !role) {
      return res.status(400).json({
        message: 'Thiếu thông tin: Vui lòng chọn Nhân viên, Chức danh và Vai trò!',
      });
    }

    // 3. Lấy thông tin Employee
    const employee = await models.Employee.findByPk(employeeid);
    if (!employee) {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên!' });
    }
    const employeecode = employee.employeecode?.toString() || '';
    
    // Kiểm tra Email an toàn
    const rawEmail = employee.email;
    const employeeEmail = (rawEmail && typeof rawEmail === 'string' && rawEmail.trim() !== '') 
                          ? rawEmail.trim() 
                          : null;

    // 4. Lấy thông tin Jobtitle (Dựa trên ID gửi lên từ form)
    const jobtitle = await models.Jobtitle.findByPk(jobtitleid);
    if (!jobtitle) {
      return res.status(404).json({ message: 'Không tìm thấy chức danh!' });
    }
    const jobtitlecode = jobtitle.jobtitlecode?.toString() || '';

    // 5. Lấy thông tin Role
    const roleData = await models.Role.findByPk(role);
    if (!roleData) {
      return res.status(404).json({ message: 'Không tìm thấy vai trò!' });
    }

    // 6. Kiểm tra trùng lặp (1 nhân viên không được có 2 tài khoản với cùng 1 vai trò)
    const existingUser = await models.User.findOne({
      where: { employeeid, role },
    });

    if (existingUser) {
      return res.status(400).json({
        message: `Nhân viên này ĐÃ CÓ tài khoản với vai trò "${roleData.name}"!`,
      });
    }

    // 7. Sinh Usercode và Name tự động
    // Format: [Số thứ tự][Mã NV][Mã Chức Danh]
    const countUsers = await models.User.count();
    const userIndex = countUsers + 1;
    const generated = `${userIndex}${employeecode}${jobtitlecode}`;
    
    const usercode = generated;
    const name = generated;

    // 8. Sinh mật khẩu ngẫu nhiên và mã hóa
    const plainPass = randomPassword(); // Hàm randomPassword() đã có trong file của bạn
    const hashedPass = await bcrypt.hash(plainPass, 10);

    // 9. Lưu vào Database
    const newUser = await models.User.create({
      usercode,
      name,
      employeeid,
      role, // Lưu ID role
      pass: hashedPass,
      status: true, // Mặc định là hoạt động
    });

    console.log(`✅ [CreateAccount] Đã tạo user: ${usercode} - Role: ${roleData.name}`);

    // 10. Gửi Email thông báo (Nếu có email)
    let emailResult = { sent: false };
    
    if (employeeEmail) {
      const mailText = `Xin chào ${employee.name || 'Nhân viên'},\n\n` +
                       `Tài khoản hệ thống của bạn đã được khởi tạo thành công:\n` +
                       `- Tên đăng nhập: ${name}\n` +
                       `- Mật khẩu: ${plainPass}\n` +
                       `- Vai trò: ${roleData.name}\n\n` +
                       `Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.`;
      try {
        await sendEmail(
          employeeEmail,
          'Thông báo: Tài khoản hệ thống HRM đã được tạo',
          mailText
        );
        console.log(`📧 Đã gửi email đến: ${employeeEmail}`);
        emailResult.sent = true;
      } catch (mailError) {
        console.error('⚠️ Lỗi gửi email:', mailError.message);
        // Không return lỗi, vẫn cho tạo thành công nhưng trả về pass thủ công
      }
    } else {
      console.warn(`⚠️ Nhân viên ${employee.name} không có email. Cần cấp pass thủ công.`);
    }

    // 11. Trả về kết quả cho Frontend
    return res.status(201).json({
      message: 'Tạo tài khoản thành công!',
      user: {
        userid: newUser.userid,
        usercode: newUser.usercode,
        name: newUser.name,
        role: roleData.name,
      },
      // Quan trọng: Trả về mật khẩu nếu không gửi được mail (để hiện lên Modal Success)
      manualPassword: !emailResult.sent ? plainPass : null, 
    });

  } catch (error) {
    console.error('🔥 [CreateAccount] Lỗi Server:', error);
    return res.status(500).json({
      message: 'Lỗi khi tạo tài khoản!',
      error: error.message,
    });
  }
};

// 🔹 Hàm tự xoá session hết hạn
async function cleanupExpiredSessions() {
  try {
    const deleted = await models.Session.destroy({
      where: {
        expiresat: { [Op.lt]: new Date() }, // xoá khi expiresat < thời điểm hiện tại
      },
    });

    if (deleted > 0) {
      console.log(`🧹 Đã xoá ${deleted} session hết hạn`);
    }
  } catch (err) {
    console.error('⚠️ Lỗi khi xoá session hết hạn:', err.message);
  }
}

// 🔹 API: Đăng nhập
export const Login = async (req, res) => {
  try {
    const { usercode, pass } = req.body;

    if (!usercode || !pass) {
      return res.status(400).json({ message: 'Thiếu thông tin đăng nhập!' });
    }

    const user = await models.User.findOne({ where: { usercode } }); 
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại!' });
    }

    // 👇 MỚI THÊM: Kiểm tra trạng thái hoạt động
    if (user.status === false) { 
        return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Admin!' });
    }

    const passwordCorrect =  await bcrypt.compare(pass, user.pass);
    if (!passwordCorrect) {
      return res.status(401).json({ message: 'Mật khẩu không đúng!' });
    }

    // ... (Giữ nguyên phần tạo Token và Session bên dưới)
    const accessToken = jwt.sign({userid: user.userid}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});
    const refreshtoken = crypto.randomBytes(64).toString('hex');
    const expiresat = new Date(Date.now() + REFRESH_TOKEN_TTL);

    const existingSession = await models.Session.findOne({ where: { userid: user.userid } });
    if (existingSession) {
      await existingSession.update({ refreshtoken, expiresat });
    } else {
      await models.Session.create({ userid: user.userid, refreshtoken, expiresat });
    }

    res.cookie('refreshtoken', refreshtoken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: REFRESH_TOKEN_TTL });
    await cleanupExpiredSessions();

    return res.status(200).json({ message: 'Đăng nhập thành công!', accessToken, role: user.role });

  } catch (error) {
    console.error('Lỗi login:', error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 🔹 API: Đăng xuất
export const signOut = async (req, res) => {
  try {
    // Lấy refreshToken từ cookie
    const token = req.cookies?.refreshtoken;

    if (token) {
      // Xoá refreshToken trong bảng session (theo Sequelize)
      const deleted = await models.Session.destroy({
        where: { refreshtoken: token },
      });

      if (deleted > 0) {
        console.log(`🚪 Đã đăng xuất và xoá session của token: ${token.slice(0, 10)}...`);
      } else {
        console.log('⚠️ Không tìm thấy session để xoá');
      }

      // Xoá cookie refreshToken
      res.clearCookie('refreshtoken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
    }

    // Trả về 204 (No Content)
    return res.status(204).end();

  } catch (error) {
    console.error('lỗi khi gọi signOut', error);
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * 🔹 API: Xác thực tài khoản qua Usercode và Email (Dùng cho Quên mật khẩu)
 */
export const verifyUserIdentity = async (req, res) => {
  try {
    const { usercode, email } = req.body;

    // 1. Kiểm tra đầu vào
    if (!usercode || !email) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Email!' });
    }

    // 2. Tìm User theo usercode
    const user = await models.User.findOne({ where: { usercode } });
    
    if (!user) {
      return res.status(404).json({ message: 'Tên đăng nhập không tồn tại!' });
    }

    // 3. Tìm thông tin Employee liên kết để lấy Email
    // Chúng ta query bảng Employee dựa trên user.employeeid
    const employee = await models.Employee.findByPk(user.employeeid);

    if (!employee) {
       return res.status(404).json({ message: 'Không tìm thấy thông tin nhân viên liên kết với tài khoản này!' });
    }

    // 4. So sánh Email (chuyển về chữ thường để so sánh chính xác)
    const dbEmail = (employee.email || '').toString().trim().toLowerCase();
    const inputEmail = email.toString().trim().toLowerCase();

    if (dbEmail !== inputEmail) {
      return res.status(400).json({ message: 'Email cung cấp không khớp với tài khoản này!' });
    }

    // 5. Thành công -> Trả về userid
    return res.status(200).json({
      message: 'Xác thực thành công!',
      userid: user.userid
    });

  } catch (error) {
    console.error('[AuthController] verifyUserIdentity error:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống khi xác thực!', error: error.message });
  }
};

/**
 * 🔹 API: Đặt lại mật khẩu mới
 */
export const resetPassword = async (req, res) => {
  try {
    const { userid, newPass, confirmPass } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào
    if (!userid || !newPass || !confirmPass) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
    }

    // 2. Kiểm tra mật khẩu nhập lại
    if (newPass !== confirmPass) {
      return res.status(400).json({ message: 'Mật khẩu nhập lại không khớp!' });
    }

    // 3. Tìm tài khoản trong DB
    const user = await models.User.findByPk(userid);

    if (!user) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại!' });
    }

    // 4. Mã hóa mật khẩu mới (sử dụng bcrypt giống hàm createAccount)
    const hashedPass = await bcrypt.hash(newPass, 10);

    // 5. Cập nhật mật khẩu vào CSDL
    await user.update({ pass: hashedPass });

    // 6. (Bảo mật) Xóa tất cả các phiên đăng nhập (Session) cũ của user này 
    // để bắt buộc họ phải đăng nhập lại bằng mật khẩu mới
    await models.Session.destroy({
      where: { userid: userid }
    });

    // 7. Trả về thông báo thành công
    return res.status(200).json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.' });

  } catch (error) {
    console.error('[AuthController] resetPassword error:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống khi đặt lại mật khẩu!', error: error.message });
  }
};

export const getAllAccounts = async (req, res) => {
  try {
    const users = await models.User.findAll({
      attributes: ['userid', 'usercode', 'name', 'status', 'role', 'employeeid'], // ✅ Đã lấy employeeid ở đây
      include: [
        {
          model: models.Employee,
          as: 'employee', 
          attributes: ['employeeid', 'employeecode', 'name'], 
          include: [
             {
                model: models.Jobtitle,
                as: 'jobtitle', 
                attributes: ['name']
             }
          ]
        },
        {
          model: models.Role,
          as: 'role_role', 
          attributes: ['name'] 
        }
      ],
      order: [['userid', 'DESC']]
    });

    const formattedData = users.map(u => {
        const emp = u.employee || {}; 
        const jt = emp.jobtitle || {};
        const rl = u.role_role || {}; 

        return {
            userid: u.userid,
            usercode: u.usercode,
            name: u.name,
            status: u.status,
            
            // 👇 QUAN TRỌNG: Phải trả về dòng này để Frontend map vào Select box
            employeeid: u.employeeid, 
            
            employeename: emp.name || '---', 
            employeecode: emp.employeecode || '',
            jobtitlename: jt.name || '---',
            role: rl.name || '---', 
            roleid: u.role 
        };
    });

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('🔥 [AuthController] getAllAccounts error:', error); 
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * 🔹 API: Lấy dữ liệu cho Dropdown (Employee, Jobtitle, Role)
 */
export const getAccountFormData = async (req, res) => {
    try {
        const [employees, jobtitles, roles] = await Promise.all([
            // Lấy danh sách nhân viên
            models.Employee.findAll({ 
                attributes: ['employeeid', 'employeecode', 'name'] // Chú ý: model bạn gửi trường tên là 'name', không phải 'fullname'
            }),
            // Lấy danh sách chức danh (độc lập)
            models.Jobtitle.findAll({ 
                attributes: ['jobtitleid', 'name'] 
            }),
            // Lấy danh sách vai trò
            models.Role.findAll({ 
                attributes: ['roleid', 'name'] 
            }) 
        ]);

        return res.status(200).json({
            employees,
            jobtitles,
            roles
        });
    } catch (error) {
        console.error('[AuthController] getAccountFormData error:', error);
        return res.status(500).json({ message: 'Lỗi tải dữ liệu form', error: error.message });
    }
}

export const updateAccount = async (req, res) => {
    try {
        const { id } = req.params; // userid
        const { status, role } = req.body; // Chỉ cho phép sửa trạng thái và vai trò

        const user = await models.User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'Tài khoản không tồn tại!' });

        // Cập nhật
        await user.update({ 
            status: status,
            role: role // Nếu muốn cho sửa cả role
        });

        // Nếu vô hiệu hóa -> Xóa session để user bị đăng xuất ngay lập tức
        if (status === false) {
            await models.Session.destroy({ where: { userid: id } });
        }

        return res.status(200).json({ message: 'Cập nhật tài khoản thành công!' });
    } catch (error) {
        console.error('[AuthController] updateAccount error:', error);
        return res.status(500).json({ message: 'Lỗi cập nhật', error: error.message });
    }
};

/**
 * 🔹 API: Xóa tài khoản
 */
export const deleteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Xóa Session trước (do ràng buộc khóa ngoại nếu có)
        await models.Session.destroy({ where: { userid: id } });
        
        // Xóa User
        const deleted = await models.User.destroy({ where: { userid: id } });

        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy tài khoản để xóa!' });

        return res.status(200).json({ message: 'Xóa tài khoản thành công!' });
    } catch (error) {
        console.error('[AuthController] deleteAccount error:', error);
        return res.status(500).json({ message: 'Lỗi khi xóa tài khoản', error: error.message });
    }
};

/**
 * 🔹 API: Admin Reset Mật Khẩu (Gửi mail hoặc trả về pass)
 */
export const adminResetPassword = async (req, res) => {
    try {
        const { userid } = req.body;
        
        const user = await models.User.findByPk(userid);
        if (!user) return res.status(404).json({ message: 'Tài khoản không tồn tại!' });

        // 1. Sinh mật khẩu mới
        const newPass = randomPassword();
        const hashedPass = await bcrypt.hash(newPass, 10);

        // 2. Cập nhật DB
        await user.update({ pass: hashedPass });
        // Xóa session cũ để bắt đăng nhập lại
        await models.Session.destroy({ where: { userid } });

        // 3. Lấy email nhân viên
        const employee = await models.Employee.findByPk(user.employeeid);
        const rawEmail = employee?.email;
        const employeeEmail = (rawEmail && typeof rawEmail === 'string' && rawEmail.trim() !== '') 
                              ? rawEmail.trim() 
                              : null;

        // 4. Gửi Email
        let emailResult = { sent: false };
        if (employeeEmail) {
            try {
                const mailText = `Xin chào ${employee.name},\n\n` +
                                 `Admin đã đặt lại mật khẩu cho tài khoản của bạn:\n` +
                                 `- Tên đăng nhập: ${user.name}\n` +
                                 `- Mật khẩu mới: ${newPass}\n\n` +
                                 `Vui lòng đổi mật khẩu ngay sau khi đăng nhập.`;
                
                await sendEmail(employeeEmail, 'Thông báo: Mật khẩu mới từ Admin', mailText);
                emailResult.sent = true;
            } catch (e) {
                console.error('Lỗi gửi mail reset:', e);
            }
        }

        // 5. Trả về
        return res.status(200).json({
            message: 'Đã đặt lại mật khẩu!',
            // Nếu không gửi được mail -> Trả về manualPassword để hiện lên Modal
            manualPassword: !emailResult.sent ? newPass : null
        });

    } catch (error) {
        console.error('[AuthController] adminResetPassword error:', error);
        return res.status(500).json({ message: 'Lỗi reset mật khẩu', error: error.message });
    }
};

export const changePassword = async (req, res) => {
  try {
    // 1. Lấy userid từ middleware (req.user) thay vì req.body để bảo mật
    const userid = req.user.userid; 
    const { oldPass, newPass, confirmPass } = req.body;

    // 2. Kiểm tra dữ liệu đầu vào
    if (!oldPass || !newPass || !confirmPass) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ: Mật khẩu cũ, Mật khẩu mới và Xác nhận!' });
    }

    if (newPass !== confirmPass) {
      return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp!' });
    }

    // 3. Tìm user trong DB
    const user = await models.User.findByPk(userid);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại!' });
    }

    // 4. QUAN TRỌNG: Kiểm tra mật khẩu cũ có đúng không
    const isMatch = await bcrypt.compare(oldPass, user.pass);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác!' });
    }

    // 5. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ (tùy chọn)
    if (oldPass === newPass) {
        return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu cũ!' });
    }

    // 6. Mã hóa mật khẩu mới
    const hashedPass = await bcrypt.hash(newPass, 10);

    // 7. Cập nhật mật khẩu
    await user.update({ pass: hashedPass });

    // 8. Xóa tất cả session (đăng xuất mọi thiết bị) TRỪ session hiện tại (nếu muốn)
    // Hoặc an toàn nhất là xóa hết để bắt đăng nhập lại:
    await models.Session.destroy({ where: { userid: userid } });

    return res.status(200).json({ message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.' });

  } catch (error) {
    console.error('[AuthController] changePassword error:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
  }
};