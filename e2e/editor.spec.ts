import { test, expect } from '@playwright/test';

test.describe('贺卡编辑器 — 核心功能 E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到编辑器页面（无模板ID，使用 mock 模式加载第一个模板）
    await page.goto('/editor');
    // 等待编辑器加载完成（Toolbar 的撤销按钮出现，title 属性匹配）
    await page.getByTitle('撤销 (Ctrl+Z)').waitFor({ timeout: 15000 });
    // 确保 canvas 也渲染完成
    await page.waitForSelector('#card-canvas', { timeout: 10000 });
  });

  test('① 编辑器页面正确加载', async ({ page }) => {
    // 验证标题输入框存在并显示模板名称
    const titleInput = page.locator('input[placeholder="贺卡标题"]');
    await expect(titleInput).toBeVisible();
    const titleValue = await titleInput.inputValue();
    // Mock 模式下第一个模板是 "新年祝福"
    expect(titleValue.length).toBeGreaterThan(0);

    // 验证工具栏按钮存在
    await expect(page.getByTitle('添加文字')).toBeVisible();
    await expect(page.getByTitle('撤销 (Ctrl+Z)')).toBeVisible();
    await expect(page.getByTitle('重做 (Ctrl+Y)')).toBeVisible();
    await expect(page.getByTitle('形状菜单')).toBeVisible();
    await expect(page.getByTitle('添加表情/图标')).toBeVisible();

    // 验证画布存在
    const canvas = page.locator('#card-canvas');
    await expect(canvas).toBeVisible();

    // 验证页面侧边栏存在
    await expect(page.getByText('页面').first()).toBeVisible();
  });

  test('② 添加文字元素', async ({ page }) => {
    // 点击"添加文字"按钮
    await page.getByTitle('添加文字').click();

    // 等待文字出现在画布上
    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toBeVisible({ timeout: 3000 });

    // 点击文字元素 → 应被选中（显示紫色边框）
    await textEl.click();
    // 选中后应该出现删除按钮（×）
    const deleteBtn = page.locator('#card-canvas button').filter({ hasText: '×' });
    await expect(deleteBtn.first()).toBeVisible({ timeout: 3000 });
  });

  test('③ 添加矩形形状', async ({ page }) => {
    // 打开形状菜单
    await page.getByTitle('形状菜单').click();
    // 选择矩形
    await page.getByText('矩形').click();

    // 形状添加后应自动选中，验证工具栏删除按钮变为可用
    await expect(page.getByTitle('删除选中元素')).not.toBeDisabled({ timeout: 3000 });
  });

  test('④ 添加圆形形状', async ({ page }) => {
    // 打开形状菜单
    await page.getByTitle('形状菜单').click();
    // 选择圆形
    await page.getByText('圆形').click();

    // 验证工具栏删除按钮变为可用（形状已选中）
    await expect(page.getByTitle('删除选中元素')).not.toBeDisabled({ timeout: 3000 });
  });

  test('⑤ 选择并删除元素', async ({ page }) => {
    // 先添加一个文字
    await page.getByTitle('添加文字').click();
    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toBeVisible({ timeout: 3000 });
    await textEl.click();

    // 点击删除按钮（工具栏上的删除）
    await page.getByTitle('删除选中元素').click();

    // 验证文字已被删除
    await expect(page.locator('#card-canvas').getByText('双击编辑文字')).not.toBeVisible();
  });

  test('⑥ 撤销与重做', async ({ page }) => {
    // 添加文字
    await page.getByTitle('添加文字').click();
    await expect(page.locator('#card-canvas').getByText('双击编辑文字')).toBeVisible({ timeout: 3000 });

    // 撤销（Ctrl+Z）
    await page.keyboard.press('Control+z');
    // 等待一小段时间让状态更新
    await page.waitForTimeout(300);
    // 文字应该被移除
    await expect(page.locator('#card-canvas').getByText('双击编辑文字')).not.toBeVisible();

    // 重做（Ctrl+Y）
    await page.keyboard.press('Control+y');
    await page.waitForTimeout(300);
    // 文字应该重新出现
    await expect(page.locator('#card-canvas').getByText('双击编辑文字')).toBeVisible();
  });

  test('⑦ 键盘 Delete 键删除元素', async ({ page }) => {
    // 添加文字
    await page.getByTitle('添加文字').click();
    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toBeVisible({ timeout: 3000 });

    // 点击选中它
    await textEl.click();

    // 按 Delete 键
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    // 验证删除
    await expect(page.locator('#card-canvas').getByText('双击编辑文字')).not.toBeVisible();
  });

  test('⑧ 添加图标元素', async ({ page }) => {
    // 点击添加图标
    await page.getByTitle('添加表情/图标').click();

    // 验证图标（⭐）出现在画布上
    const iconEl = page.locator('#card-canvas').getByText('⭐');
    await expect(iconEl).toBeVisible({ timeout: 3000 });
  });

  test('⑨ 复制元素', async ({ page }) => {
    // 添加文字
    await page.getByTitle('添加文字').click();
    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toBeVisible({ timeout: 3000 });

    // 选中它
    await textEl.click();

    // 点击复制按钮
    await page.getByTitle('复制元素 (Ctrl+D)').click();

    // 现在应该有至少两个文本节点（原始被复制了）
    // duplicateElement 会创建新元素并选中它，位置偏移 3%
    await page.waitForTimeout(200);
    const textElements = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textElements).toHaveCount(2);
  });

  test('⑩ 添加新页面并切换', async ({ page }) => {
    // 页面侧边栏默认显示，找到"添加页面"按钮
    const addPageBtn = page.getByText('添加页面');
    await expect(addPageBtn).toBeVisible();
    await addPageBtn.click();

    await page.waitForTimeout(300);

    // 验证标题显示的页数变化："共 X 页"
    const pageCountText = page.getByText(/共 \d+ 页/);
    await expect(pageCountText).toBeVisible();
    const pageCount = await pageCountText.textContent();
    // 至少应有 2 页（原始1页 + 新增1页）
    expect(pageCount).toMatch(/共 [2-9] 页/);
  });

  test('⑪ 图层操作 — 置顶', async ({ page }) => {
    // 先添加一个形状（紫色背景）
    await page.getByTitle('形状菜单').click();
    await page.getByText('矩形').click();
    await page.waitForTimeout(300);

    // 添加文字
    await page.getByTitle('添加文字').click();
    await page.waitForTimeout(300);

    // 选中形状（点击画布中形状所在区域）
    // 形状默认位置 x:35%, y:35%，尺寸 30%x30%，点击中心
    const canvas = page.locator('#card-canvas');
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      const shapeX = canvasBox.x + canvasBox.width * 0.5;
      const shapeY = canvasBox.y + canvasBox.height * 0.5;
      await page.mouse.click(shapeX, shapeY);
      await page.waitForTimeout(200);
    }

    // 选中后验证工具栏"置顶"按钮可用
    await expect(page.getByTitle('置顶 (Ctrl+Shift+])').first()).not.toBeDisabled({ timeout: 2000 });
  });

  test('⑫ 从模板加载特定贺卡', async ({ page }) => {
    // 先刷新页面确保干净状态，再导航到带有模板 ID 的编辑器
    await page.goto('/editor/3');
    // 等待加载
    await page.getByTitle('撤销 (Ctrl+Z)').waitFor({ timeout: 15000 });
    await page.waitForSelector('#card-canvas', { timeout: 10000 });

    // 验证标题不是空白（模板加载成功）
    const titleInput = page.locator('input[placeholder="贺卡标题"]');
    const titleValue = await titleInput.inputValue();
    expect(titleValue.length).toBeGreaterThan(0);
  });
});
