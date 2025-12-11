import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import initModels from '../models/init-models.js';
import { Sequelize } from 'sequelize';

dotenv.config();

// Khởi tạo Sequelize + models
const sequelize = new Sequelize(process.env.SUPABASE_CONNECTIONSTRING, {
  dialect: 'postgres',
  dialectOptions: { ssl: { rejectUnauthorized: false } },
  logging: false,
});
const models = initModels(sequelize);

// Middleware xác thực JWT
export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ message: 'Không có token, truy cập bị từ chối!' });
    }

    // Xác minh token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
      if (err) {
        console.error('Lỗi xác minh token:', err);
        return res.status(403).json({ message: 'Token hết hạn hoặc không hợp lệ!' });
      }

      // Tìm user trong database
      const user = await models.User.findByPk(decodedUser.userid, {
        attributes: { exclude: ['pass'] },
      });

      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại!' });
      }

      // Gắn user vào req để các route sau dùng
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Lỗi trong middleware xác thực JWT:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ!' });
  }
};
