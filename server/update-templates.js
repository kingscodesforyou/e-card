import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'ecard',
  user: process.env.POSTGRES_USER || 'ecard',
  password: process.env.POSTGRES_PASSWORD || 'your_secure_password',
});

async function updateTemplates() {
  console.log('🔄 开始更新模板标签为中文...');

  try {
    const updateQuery = `
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
    `;

    const result = await pool.query(updateQuery);
    console.log(`✅ 成功更新了 ${result.rowCount} 条模板记录！`);
    
    // 验证更新结果
    const templates = await pool.query('SELECT name, category, occasion, style FROM templates');
    console.log('\n📋 更新后的模板数据：');
    templates.rows.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} - 分类: ${template.category}, 场合: ${template.occasion}, 风格: ${template.style}`);
    });

  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
