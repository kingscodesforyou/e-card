import { test, expect } from '@playwright/test';

test.describe('PropertyPanel — 动画功能 E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/editor');
    await page.getByTitle('撤销 (Ctrl+Z)').waitFor({ timeout: 15000 });
    await page.waitForSelector('#card-canvas', { timeout: 10000 });

    // 添加文字并选中它
    await page.getByTitle('添加文字').click();
    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toBeVisible({ timeout: 3000 });
    await textEl.click();
    await page.waitForTimeout(300);
  });

  test('① 切换到动画标签页', async ({ page }) => {
    await page.getByText('动画').click();
    await page.waitForTimeout(300);
    await expect(page.getByText('动画类型')).toBeVisible();
  });

  test('② 选择"淡入" → animation-name 被设置', async ({ page }) => {
    await page.getByText('动画').click();
    await page.waitForTimeout(300);

    // 动画类型 select：包含 "淡入" option 的 select
    const animSelect = page.locator('select').filter({ has: page.locator('option', { hasText: '淡入' }) }).first();
    await animSelect.selectOption('淡入');
    await page.waitForTimeout(600);

    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toHaveCSS('animation-name', /fadeIn/i);
  });

  test('③ 选择"缩放" → animation-name 含 scaleIn', async ({ page }) => {
    await page.getByText('动画').click();
    await page.waitForTimeout(300);

    const animSelect = page.locator('select').filter({ has: page.locator('option', { hasText: '淡入' }) }).first();
    await animSelect.selectOption('缩放');
    await page.waitForTimeout(600);

    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toHaveCSS('animation-name', /scaleIn/i);
  });

  test('④ 选择"旋转" → animation-name 含 rotateIn', async ({ page }) => {
    await page.getByText('动画').click();
    await page.waitForTimeout(300);

    const animSelect = page.locator('select').filter({ has: page.locator('option', { hasText: '淡入' }) }).first();
    await animSelect.selectOption('旋转');
    await page.waitForTimeout(600);

    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toHaveCSS('animation-name', /rotateIn/i);
  });

  test('⑤ 选择"滑动" → animation-name 含 slideIn', async ({ page }) => {
    await page.getByText('动画').click();
    await page.waitForTimeout(300);

    const animSelect = page.locator('select').filter({ has: page.locator('option', { hasText: '淡入' }) }).first();
    await animSelect.selectOption('滑动');
    await page.waitForTimeout(600);

    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toHaveCSS('animation-name', /slideIn/i);
  });

  test('⑥ 选择"弹跳" → animation-name 含 bounceIn', async ({ page }) => {
    await page.getByText('动画').click();
    await page.waitForTimeout(300);

    const animSelect = page.locator('select').filter({ has: page.locator('option', { hasText: '淡入' }) }).first();
    await animSelect.selectOption('弹跳');
    await page.waitForTimeout(600);

    const textEl = page.locator('#card-canvas').getByText('双击编辑文字');
    await expect(textEl).toHaveCSS('animation-name', /bounceIn/i);
  });

  test('⑦ 选择动画后"预览动画"按钮出现', async ({ page }) => {
    await page.getByText('动画').click();
    await page.waitForTimeout(300);

    const animSelect = page.locator('select').filter({ has: page.locator('option', { hasText: '淡入' }) }).first();
    await animSelect.selectOption('淡入');
    await page.waitForTimeout(500);

    await expect(page.getByText('▶ 预览动画')).toBeVisible();
  });
});
