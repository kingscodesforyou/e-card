import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🔧 环境变量:', {
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_PORT: process.env.POSTGRES_PORT,
  POSTGRES_DB: process.env.POSTGRES_DB,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? '***' : undefined,
});

// 数据库连接
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'ecard',
  user: process.env.POSTGRES_USER || 'ecard',
  password: process.env.POSTGRES_PASSWORD || 'your_secure_password',
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 健康检查（不依赖数据库）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 测试数据库连接
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 电子贺卡 API 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  
  // 测试数据库连接
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ 数据库连接成功！');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    // 不退出，继续运行
  }
});
