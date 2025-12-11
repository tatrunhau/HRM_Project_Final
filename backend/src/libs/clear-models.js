import fs from 'fs';
import path from 'path';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// Đường dẫn đến thư mục chứa models
const modelsDir = path.join(process.cwd(), 'src', 'models');

// Kết nối PostgreSQL
const client = new Client({
  connectionString: process.env.SUPABASE_CONNECTIONSTRING,
  ssl: { rejectUnauthorized: false },
});

async function cleanModels() {
  await client.connect();

  // Lấy danh sách bảng trong database
  const res = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  const tableNames = res.rows.map(row => row.table_name.toLowerCase());

  // Đọc danh sách file model
  const files = fs.readdirSync(modelsDir);

  files.forEach(file => {
    // Bỏ qua init-models.js
    if (file === 'init-models.js') return;

    if (file.endsWith('.js')) {
      const modelName = path.basename(file, '.js').toLowerCase();

      // Nếu model không tồn tại trong DB → xóa
      if (!tableNames.includes(modelName)) {
        fs.unlinkSync(path.join(modelsDir, file));
        console.log('🧹 Đã xoá model dư:', file);
      }
    }
  });

  await client.end();
  console.log('✅ Dọn dẹp models xong!');
}

// Chạy script
cleanModels().catch(err => {
  console.error('❌ Lỗi khi dọn models:', err);
  process.exit(1);
});
