/**
 * 字体文件下载脚本
 *
 * 从 Google Fonts CDN 下载需要自托管的字体文件 (.woff2)，
 * 并生成包含本地 @font-face 声明的 CSS 文件。
 *
 * 使用方法： node scripts/download-fonts.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// 数据库连接
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'ecard',
  user: process.env.POSTGRES_USER || 'ecard',
  password: process.env.POSTGRES_PASSWORD || 'your_secure_password',
});

// 字体文件输出目录（相对于项目根目录）
const FONTS_DIR = path.resolve(__dirname, '../../public/fonts');
const CSS_OUTPUT = path.join(FONTS_DIR, 'fonts.css');

/** 生成安全的文件名 */
function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/** 从数据库读取所有带有 google_font_name 的字体 */
async function getGoogleFonts() {
  const result = await pool.query(
    `SELECT google_font_name, weights FROM fonts
     WHERE google_font_name IS NOT NULL AND is_active = TRUE
     ORDER BY sort_order ASC`
  );
  return result.rows;
}

/** 下载单个字体文件的 @font-face CSS 和 .woff2 资源 */
async function downloadFont(googleName, weights) {
  const familyEncoded = googleName.replace(/ /g, '+');
  const weightsStr = weights.join(';');
  const url = `https://fonts.googleapis.com/css2?family=${familyEncoded}:wght@${weightsStr}&display=swap`;

  console.log(`  📥 获取 ${googleName} (${weightsStr})`);

  let css;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  ❌ ${googleName}: HTTP ${res.status}`);
      return { css: '', downloads: [] };
    }
    css = await res.text();
  } catch (e) {
    console.error(`  ❌ ${googleName}: 请求失败 - ${e.message}`);
    return { css: '', downloads: [] };
  }

  const downloads = [];
  const localCss = css.replace(
    /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g,
    (match, gstaticUrl) => {
      // 从 URL 中提取文件名
      const urlParts = new URL(gstaticUrl);
      const filename = path.basename(urlParts.pathname);
      const localPath = `/fonts/${filename}`;

      downloads.push({ url: gstaticUrl, filename });
      return `url(${localPath})`;
    }
  );

  return { css: localCss, downloads };
}

async function main() {
  console.log('🔄 开始下载字体文件...\n');

  // 确保目录存在
  if (!fs.existsSync(FONTS_DIR)) {
    fs.mkdirSync(FONTS_DIR, { recursive: true });
    console.log(`📁 创建目录: ${FONTS_DIR}`);
  }

  // 读取需要下载的字体
  const fonts = await getGoogleFonts();
  if (fonts.length === 0) {
    console.log('⚠️  数据库中没有需要下载的 Google Fonts (google_font_name IS NULL)');
    await pool.end();
    return;
  }

  console.log(`📋 发现 ${fonts.length} 个需要下载的字体\n`);

  // 下载每个字体
  let allCss = '/* =============================================\n';
  allCss += ' * 自托管字体 - @font-face 声明\n';
  allCss += ' * 由 download-fonts.js 自动生成\n';
  allCss += ` * 生成时间: ${new Date().toISOString()}\n`;
  allCss += ' * ============================================= */\n\n';

  let totalDownloads = 0;

  for (const font of fonts) {
    const { google_font_name, weights } = font;
    const result = await downloadFont(google_font_name, weights || [400]);

    allCss += result.css + '\n';
    totalDownloads += result.downloads.length;

    // 下载实际的 .woff2 文件
    for (const dl of result.downloads) {
      const filePath = path.join(FONTS_DIR, dl.filename);
      if (fs.existsSync(filePath)) {
        console.log(`    ✅ ${dl.filename} (已存在，跳过)`);
        continue;
      }

      try {
        const res = await fetch(dl.url);
        if (!res.ok) {
          console.error(`    ❌ ${dl.filename}: HTTP ${res.status}`);
          continue;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        const sizeKB = (buffer.length / 1024).toFixed(1);
        console.log(`    ✅ ${dl.filename} (${sizeKB}KB)`);
      } catch (e) {
        console.error(`    ❌ ${dl.filename}: 下载失败 - ${e.message}`);
      }
    }
  }

  // 写入 CSS 文件
  fs.writeFileSync(CSS_OUTPUT, allCss);
  console.log(`\n📄 已生成 CSS: ${CSS_OUTPUT}`);

  // 统计
  const fontFiles = fs.readdirSync(FONTS_DIR).filter(f => f.endsWith('.woff2'));
  const totalSizeKB = fontFiles
    .reduce((sum, f) => sum + fs.statSync(path.join(FONTS_DIR, f)).size, 0) / 1024;

  console.log(`\n🎉 完成！`);
  console.log(`   字体 CSS: fonts.css`);
  console.log(`   字体文件: ${fontFiles.length} 个 (.woff2)`);
  console.log(`   总大小: ${totalSizeKB.toFixed(1)}KB`);
  console.log(`   位置: ${FONTS_DIR}\n`);

  await pool.end();
}

main().catch((err) => {
  console.error('❌ 下载失败:', err);
  process.exit(1);
});
