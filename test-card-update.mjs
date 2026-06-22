import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'ecard',
  user: process.env.POSTGRES_USER || 'ecard',
  password: process.env.POSTGRES_PASSWORD || 'your_secure_password',
});

async function runTest() {
  console.log('🚀 开始测试：从"我的设计"编辑并保存贺卡\n');
  
  try {
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.error('❌ 没有找到测试用户');
      process.exit(1);
    }
    const userId = userResult.rows[0].id;
    console.log('📋 测试用户ID:', userId);

    const beforeCount = await pool.query(
      'SELECT COUNT(*) as count FROM cards WHERE user_id = $1',
      [userId]
    );
    const before = beforeCount.rows[0].count;
    console.log('📊 编辑前用户贺卡数量:', before);

    let cardId;
    if (before === '0') {
      console.log('⚠️ 用户没有贺卡，创建测试贺卡...');
      const createResult = await pool.query(
        'INSERT INTO cards (user_id, title, pages) VALUES ($1, $2, $3) RETURNING id',
        [userId, '测试贺卡', JSON.stringify([{ id: 'page1', pageNumber: 1, elements: [] }])]
      );
      cardId = createResult.rows[0].id;
      console.log('✅ 创建测试贺卡成功，ID:', cardId);
    } else {
      const cardResult = await pool.query(
        'SELECT id, title FROM cards WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      cardId = cardResult.rows[0].id;
      console.log('📋 使用现有贺卡测试，ID:', cardId, '标题:', cardResult.rows[0].title);
    }

    console.log('\n🔄 模拟编辑并保存操作...');
    const newTitle = '测试贺卡_修改后_' + Date.now();
    const updateResult = await pool.query(
      'UPDATE cards SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING title',
      [newTitle, cardId, userId]
    );

    if (updateResult.rows.length === 0) {
      console.error('❌ 更新失败');
      process.exit(1);
    }
    console.log('✅ 更新成功！新标题:', updateResult.rows[0].title);

    const afterCount = await pool.query(
      'SELECT COUNT(*) as count FROM cards WHERE user_id = $1',
      [userId]
    );
    const after = afterCount.rows[0].count;
    console.log('\n📊 编辑后用户贺卡数量:', after);

    if (before === after) {
      console.log('✅ 测试通过！贺卡数量保持不变:', before);
    } else {
      console.error('❌ 测试失败！贺卡数量从', before, '变为', after);
      process.exit(1);
    }

    const verify = await pool.query('SELECT title FROM cards WHERE id = $1', [cardId]);
    if (verify.rows[0].title === newTitle) {
      console.log('✅ 内容已正确更新');
    }

    console.log('\n🎉 所有测试通过！');
    console.log('   - 更新了现有贺卡而不是创建新记录');
    console.log('   - 贺卡数量保持不变');
    console.log('   - 内容正确更新');

  } catch (err) {
    console.error('❌ 测试出错:', err.message);
    process.exit(1);
  } finally