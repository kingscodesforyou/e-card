import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ecard',
  user: 'ecard',
  password: 'your_secure_password',
});

async function testConnection() {
  try {
    console.log('🔌 正在连接数据库...');
    const result = await pool.query('SELECT NOW();');
    console.log('✅ 数据库连接成功！');
    console.log('时间:', result.rows[0].now);
    
    await pool.end();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

testConnection();
