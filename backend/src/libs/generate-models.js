import SequelizeAuto from 'sequelize-auto';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.SUPABASE_CONNECTIONSTRING;

// Phân tích chuỗi kết nối Postgres
const regex = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
const match = dbUrl.match(regex);

if (!match) {
  console.error('SUPABASE_CONNECTIONSTRING không đúng định dạng!');
  process.exit(1);
}

const [, username, password, host, port, database] = match;

const auto = new SequelizeAuto(database, username, password, {
  host,
  port,
  dialect: 'postgres',
  directory: './src/models', // ✅ thư mục models
  schema: 'public',
  additional: {
    timestamps: false,
  },
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
  caseModel: 'p',       // giữ chữ hoa/thường cho tên model
  caseFile: 'c',        // tên file in thường
  singularize: true,
  lang: 'esm',          // ✅ sinh model dạng ESM
});

auto.run()
  .then(() => {
    console.log('✅ Đã sinh models Sequelize (ESM) thành công!');
  })
  .catch((err) => console.error('❌ Lỗi khi generate models:', err));
