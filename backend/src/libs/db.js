import pkg from 'pg';
const { Client } = pkg;

export const connectDB = async () => {
  const client = new Client({
    connectionString: process.env.SUPABASE_CONNECTIONSTRING,
    ssl: { rejectUnauthorized: false } // Supabase yêu cầu SSL
  });

  try {
    await client.connect();
    console.log('Dữ liệu kết nối thành công');
    return client; // Trả ra client để chỗ khác dùng query
  } catch (error) {
    console.error('Kết nối lỗi:', error);
  }
};