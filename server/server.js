import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

// 生成 JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, is_admin: user.is_admin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// 验证 JWT 中间件
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }

  const token = authHeader.substring(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token 无效' });
  }
}

// 健康检查
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

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    // 检查用户是否已存在
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, is_admin, created_at`,
      [email, passwordHash, name || email.split('@')[0]]
    );

    const user = result.rows[0];

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,
      },
      message: '注册成功，请查收验证邮件'
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    // 查找用户
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const user = result.rows[0];

    // 检查密码
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 检查是否被禁用
    if (user.is_disabled) {
      return res.status(401).json({ error: '账号已被禁用' });
    }

    // 生成 token
    const token = generateToken(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,
      },
      token,
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前用户
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, is_admin, is_email_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('获取用户错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 同步用户到本地数据库（用于Supabase注册后同步）
app.post('/api/auth/sync-user', async (req, res) => {
  try {
    const { supabase_id, email, name, is_email_verified } = req.body;

    if (!supabase_id || !email) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 检查用户是否已存在（通过supabase_id或email）
    const existing = await pool.query(
      'SELECT * FROM users WHERE id = $1 OR email = $2',
      [supabase_id, email]
    );

    if (existing.rows.length > 0) {
      // 用户已存在，更新信息
      const user = existing.rows[0];
      if (user.id !== supabase_id) {
        // 如果是email匹配但id不同，更新id
        await pool.query(
          'UPDATE users SET id = $1, name = COALESCE($2, name), is_email_verified = COALESCE($3, is_email_verified) WHERE email = $4',
          [supabase_id, name, is_email_verified, email]
        );
      } else {
        // 更新name和邮箱验证状态
        await pool.query(
          'UPDATE users SET name = COALESCE($1, name), is_email_verified = COALESCE($2, is_email_verified) WHERE id = $3',
          [name, is_email_verified, supabase_id]
        );
      }
      
      const updated = await pool.query(
        'SELECT id, email, name, is_admin, is_email_verified, is_disabled, created_at FROM users WHERE id = $1',
        [supabase_id]
      );
      const token = generateToken(updated.rows[0]);
      return res.json({ user: updated.rows[0], token, created: false });
    }

    // 创建新用户（不需要密码，认证由Supabase处理）
    const result = await pool.query(
      `INSERT INTO users (id, email, name, password_hash, is_admin, is_email_verified, is_disabled)
       VALUES ($1, $2, $3, '', false, $4, false)
       RETURNING id, email, name, is_admin, is_email_verified, is_disabled, created_at`,
      [supabase_id, email, name || email.split('@')[0], is_email_verified || false]
    );

    const token = generateToken(result.rows[0]);
    res.status(201).json({ user: result.rows[0], token, created: true });
  } catch (error) {
    console.error('同步用户错误:', error);
    res.status(500).json({ error: '同步用户失败' });
  }
});

// 模板相关
app.get('/api/templates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM templates ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('获取模板错误:', error);
    res.status(500).json({ error: '获取模板失败' });
  }
});

app.get('/api/templates/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM templates WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '模板不存在' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取模板错误:', error);
    res.status(500).json({ error: '获取模板失败' });
  }
});

// 贺卡相关
app.get('/api/cards', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cards WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('获取贺卡错误:', error);
    res.status(500).json({ error: '获取贺卡失败' });
  }
});

app.get('/api/cards/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM cards WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '贺卡不存在或无权限' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取贺卡错误:', error);
    res.status(500).json({ error: '获取贺卡失败' });
  }
});

app.post('/api/cards', requireAuth, async (req, res) => {
  try {
    const { title, template_id, pages, background_music_url, background_music_loop, cover, description, is_public } = req.body;

    const result = await pool.query(
      `INSERT INTO cards (user_id, template_id, title, pages, background_music_url, background_music_loop, cover, description, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id, 
        template_id || null, 
        title || '未命名贺卡', 
        JSON.stringify(pages || []), 
        background_music_url || null,
        background_music_loop !== undefined ? background_music_loop : true,
        cover || null,
        description || null,
        is_public !== undefined ? is_public : false
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('创建贺卡错误:', error);
    res.status(500).json({ error: '创建贺卡失败' });
  }
});

app.put('/api/cards/:id', requireAuth, async (req, res) => {
  try {
    const { title, pages, background_music_url, background_music_loop, cover, description, is_public } = req.body;

    const result = await pool.query(
      `UPDATE cards SET 
        title = COALESCE($1, title),
        pages = COALESCE($2, pages),
        background_music_url = COALESCE($3, background_music_url),
        background_music_loop = COALESCE($4, background_music_loop),
        cover = COALESCE($5, cover),
        description = COALESCE($6, description),
        is_public = COALESCE($7, is_public),
        updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        title || null, 
        pages ? JSON.stringify(pages) : null, 
        background_music_url || null,
        background_music_loop !== undefined ? background_music_loop : null,
        cover || null,
        description || null,
        is_public !== undefined ? is_public : null,
        req.params.id, 
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '贺卡不存在或无权限' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('更新贺卡错误:', error);
    res.status(500).json({ error: '更新贺卡失败' });
  }
});

app.delete('/api/cards/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM cards WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '贺卡不存在或无权限' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('删除贺卡错误:', error);
    res.status(500).json({ error: '删除贺卡失败' });
  }
});

// 管理员路由
app.get('/api/admin/users', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const result = await pool.query(
      'SELECT id, email, name, is_admin, is_disabled, is_email_verified, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// =====================================================
// 收藏相关 API
// =====================================================

// 获取用户的收藏列表
app.get('/api/favorites', requireAuth, async (req, res) => {
  try {
    const userId = req.query.user_id || req.user.id;
    
    // 确保只能查看自己的收藏
    if (userId !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: '无权限查看此用户的收藏' });
    }

    const result = await pool.query(
      `SELECT f.id, f.user_id, f.template_id, f.created_at,
              t.id as t_id, t.name, t.category, t.occasion, t.style, 
              t.thumbnail_url, t.background_url
       FROM favorites f
       JOIN templates t ON f.template_id = t.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    // 转换返回格式以匹配前端 Template 类型
    const favorites = result.rows.map(row => ({
      id: row.template_id,
      name: row.name,
      category: row.category,
      occasion: row.occasion,
      style: row.style,
      thumbnail_url: row.thumbnail_url,
      background_url: row.background_url,
      created_at: row.created_at
    }));

    res.json(favorites);
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({ error: '获取收藏列表失败' });
  }
});

// 添加收藏
app.post('/api/favorites', requireAuth, async (req, res) => {
  try {
    const { template_id } = req.body;
    const userId = req.user.id;

    if (!template_id) {
      return res.status(400).json({ error: '缺少模板ID' });
    }

    // 检查是否已经收藏
    const existingCheck = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND template_id = $2',
      [userId, template_id]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ error: '已经收藏过了' });
    }

    // 检查模板是否存在
    const templateCheck = await pool.query(
      'SELECT id FROM templates WHERE id = $1',
      [template_id]
    );

    if (templateCheck.rows.length === 0) {
      return res.status(404).json({ error: '模板不存在' });
    }

    // 添加收藏
    const result = await pool.query(
      `INSERT INTO favorites (user_id, template_id)
       VALUES ($1, $2)
       RETURNING id, user_id, template_id, created_at`,
      [userId, template_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('添加收藏错误:', error);
    res.status(500).json({ error: '添加收藏失败' });
  }
});

// 删除收藏
app.delete('/api/favorites', requireAuth, async (req, res) => {
  try {
    const { template_id } = req.query;
    const userId = req.user.id;

    if (!template_id) {
      return res.status(400).json({ error: '缺少模板ID' });
    }

    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND template_id = $2 RETURNING id',
      [userId, template_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '收藏不存在' });
    }

    res.json({ success: true, message: '取消收藏成功' });
  } catch (error) {
    console.error('删除收藏错误:', error);
    res.status(500).json({ error: '删除收藏失败' });
  }
});

app.put('/api/admin/users/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { is_admin, is_disabled, name } = req.body;
    const result = await pool.query(
      `UPDATE users SET is_admin = COALESCE($1, is_admin), is_disabled = COALESCE($2, is_disabled), name = COALESCE($3, name)
       WHERE id = $4
       RETURNING id, email, name, is_admin, is_disabled`,
      [is_admin, is_disabled, name, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ error: '更新用户失败' });
  }
});

app.get('/api/admin/stats', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const templatesCount = await pool.query('SELECT COUNT(*) FROM templates');
    const cardsCount = await pool.query('SELECT COUNT(*) FROM cards');

    res.json({
      users: parseInt(usersCount.rows[0].count),
      templates: parseInt(templatesCount.rows[0].count),
      cards: parseInt(cardsCount.rows[0].count),
    });
  } catch (error) {
    console.error('获取统计错误:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 管理员模板管理
app.post('/api/admin/templates', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { name, category, occasion, style, thumbnail_url, pages } = req.body;

    const result = await pool.query(
      `INSERT INTO templates (name, category, occasion, style, thumbnail_url, pages)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category, occasion, style, thumbnail_url, JSON.stringify(pages || [])]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('创建模板错误:', error);
    res.status(500).json({ error: '创建模板失败' });
  }
});

app.put('/api/admin/templates/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { name, category, occasion, style, thumbnail_url, pages } = req.body;

    const result = await pool.query(
      `UPDATE templates SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        occasion = COALESCE($3, occasion),
        style = COALESCE($4, style),
        thumbnail_url = COALESCE($5, thumbnail_url),
        pages = COALESCE($6, pages)
       WHERE id = $7
       RETURNING *`,
      [name, category, occasion, style, thumbnail_url, pages ? JSON.stringify(pages) : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '模板不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('更新模板错误:', error);
    res.status(500).json({ error: '更新模板失败' });
  }
});

app.delete('/api/admin/templates/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const result = await pool.query('DELETE FROM templates WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '模板不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('删除模板错误:', error);
    res.status(500).json({ error: '删除模板失败' });
  }
});

// 管理员贺卡管理
app.delete('/api/admin/cards/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const result = await pool.query('DELETE FROM cards WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '贺卡不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('删除贺卡错误:', error);
    res.status(500).json({ error: '删除贺卡失败' });
  }
});

// 初始化模板标签为中文
async function initTemplateLabels() {
  try {
    const result = await pool.query(`
      UPDATE templates SET
        category = CASE 
          WHEN category = 'birthday' THEN '生日'
          WHEN category = 'festival' THEN '节日'
          WHEN category = 'wedding' THEN '婚礼'
          WHEN category = 'graduation' THEN '祝福'
          ELSE category
        END,
        occasion = CASE 
          WHEN occasion = 'birthday' THEN '生日'
          WHEN occasion = 'new_year' THEN '新年'
          WHEN occasion = 'christmas' THEN '圣诞节'
          WHEN occasion = 'wedding' THEN '婚礼'
          WHEN occasion = 'graduation' THEN '毕业'
          ELSE occasion
        END,
        style = CASE 
          WHEN style = 'warm' THEN '温馨'
          WHEN style = 'traditional' THEN '传统'
          WHEN style = 'festive' THEN '华丽'
          WHEN style = 'elegant' THEN '优雅'
          WHEN style = 'youth' THEN '青春'
          ELSE style
        END;
    `);
    if (result.rowCount > 0) {
      console.log(`🔄 已更新 ${result.rowCount} 条模板标签为中文`);
    }
  } catch (error) {
    console.log('⚠️ 模板标签初始化失败（可能数据库中已为中文）:', error.message);
  }
}

// 启动服务器
async function startServer() {
  await initTemplateLabels();
  
  app.listen(PORT, () => {
    console.log(`🚀 电子贺卡 API 服务器运行在 http://localhost:${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`🔌 数据库: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}`);
  });
}

startServer();

// 保持服务器运行
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  pool.end().then(() => {
    console.log('数据库连接已关闭');
    process.exit(0);
  });
});
