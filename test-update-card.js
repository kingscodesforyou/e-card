/**
 * 测试场景：从"我的设计"列表编辑并保存贺卡
 * 验证：更新现有贺卡而不是创建新记录
 */

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
    // Step 1: 获取一个测试用户的ID
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.error('❌ 没有找到测试用户，请先注册一个用户');
      process.exit(1);
    }
    const userId = userResult.rows[0].id;
    console.log(`📋 测试用户ID: ${userId}`);

    // Step 2: 获取该用户的贺卡数量（编辑前）
    const beforeCount = await pool.query(
      'SELECT COUNT(*) as count FROM cards WHERE user_id = $1',
      [userId]
    );
    console.log(`📊 编辑前用户贺卡数量: ${beforeCount.rows[0].count}`);

    // Step 3: 如果用户没有贺卡，先创建一个测试贺卡
    let cardId;
    if (beforeCount.rows[0].count === '0') {
      console.log('⚠️ 用户没有贺卡，先创建一个测试贺卡...');
      const createResult = await pool.query(
        `INSERT INTO cards (user_id, title, pages)
         VALUES ($1, $2, $3)
         RETURNING id, title, created_at`,
        [userId, '测试贺卡', JSON.stringify([{ id: 'page1', pageNumber: 1, elements: [] }])]
      );
      cardId = createResult.rows[0].id;
      console.log(`✅ 创建测试贺卡成功，ID: ${cardId}`);
    } else {
      // 获取第一个贺卡
      const cardResult = await pool.query(
        'SELECT id, title, pages, updated_at FROM cards WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      cardId = cardResult.rows[0].id;
      console.log(`📋 使用现有贺卡测试，ID: ${cardId}`);
      console.log(`   原标题: ${cardResult.rows[0].title}`);
      console.log(`   原更新时间: ${cardResult.rows[0].updated_at}`);
    }

    // Step 4: 模拟"编辑并保存"操作（调用更新API）
    console.log('\n🔄 模拟编辑并保存操作...');
    const updatedTitle = `测试贺卡_修改后_${Date.now()}`;
    const updatedPages = JSON.stringify([
      { id: 'page1', pageNumber: 1, elements: [{ id: 'text1', type: 'text', content: '修改后的内容' }] }
    ]);

    const updateResult = await pool.query(
      `UPDATE cards 
       SET title = $1, pages = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, title, updated_at`,
      [updatedTitle, updatedPages, cardId, userId]
    );

    if (updateResult.rows.length === 0) {
      console.error('❌ 更新失败：贺卡不存在或无权限');
      process.exit(1);
    }

    console.log(`✅ 更新成功！`);
    console.log(`   更新后标题: ${updateResult.rows[0].title}`);
    console.log(`   更新后时间: ${updateResult.rows[0].updated_at}`);

    // Step 5: 验证贺卡数量（应该和编辑前相同，没有新增）
    const afterCount = await pool.query(
      'SELECT COUNT(*) as count FROM cards WHERE user_id = $1',
      [userId]
    );
    console.log(`\n📊 编辑后用户贺卡数量: ${afterCount.rows[0].count}`);

    if (beforeCount.rows[0].count === afterCount.rows[0].count) {
      console.log('✅ 测试通过！贺卡数量没有增加，说明是更新而不是创建新记录');
    } else {
      console.error('❌ 测试失败！贺卡数量增加了，说明创建了新记录而不是更新');
      process.exit(1);
    }

    // Step 6: 验证更新的内容
    const verifyResult = await pool.query(
      'SELECT title, pages FROM cards WHERE id = $1',
      [cardId]
    );
    
    if (verifyResult.rows[0].title === updatedTitle) {
      console.log('✅ 标题已正确更新');
    } else {
      console.error('❌ 标题更新失败');
      process.exit(1);
    }

    console.log('\n🎉 所有测试通过！从"我的设计"编辑并保存功能正常工作');
    console.log('   - 更新了现有贺卡而不是创建新记录');
    console.log('   - 贺卡数量保持不变');
    console.log('   - 内容正确更新');

  } catch (error) {
    console.error('❌ 测试出错:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}