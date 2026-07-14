const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '新建文件夹');
const files = fs.readdirSync(inputDir).filter(f => f.toLowerCase().endsWith('.svg'));
files.sort();

function splitSubPaths(d) {
  const result = [];
  let current = '';
  for (let i = 0; i < d.length; i++) {
    const ch = d[i];
    current += ch;
    if (ch === 'Z' || ch === 'z') {
      result.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) result.push(current.trim());
  return result.filter(s => s.length > 0);
}

function computeBBoxAndArea(pathStr) {
  // 提取所有数字对并计算包围盒 + 面积（用于近似排序）
  const coords = [];
  let i = 0;
  const n = pathStr.length;
  const readNum = () => {
    let num = '';
    while (i < n && (pathStr[i] === '-' || pathStr[i] === '.' || (pathStr[i] >= '0' && pathStr[i] <= '9'))) num += pathStr[i++];
    return num ? parseFloat(num) : NaN;
  };
  const skipSep = () => { while (i < n && (pathStr[i] === ' ' || pathStr[i] === ',' || pathStr[i] === '\n' || pathStr[i] === '\t')) i++; };
  const isCmd = (ch) => 'MLQCSTAHVZmlqcstahvz'.includes(ch);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  while (i < n) {
    skipSep();
    if (i >= n) break;
    if (isCmd(pathStr[i])) {
      const cmd = pathStr[i++];
      skipSep();
      if (cmd === 'Z' || cmd === 'z') continue;
      if (cmd === 'H' || cmd === 'h') {
        while (i < n && !isCmd(pathStr[i])) {
          skipSep(); if (i >= n || isCmd(pathStr[i])) break;
          const v = readNum();
          if (!isNaN(v)) { if (v < minX) minX = v; if (v > maxX) maxX = v; }
          skipSep();
        }
        continue;
      }
      if (cmd === 'V' || cmd === 'v') {
        while (i < n && !isCmd(pathStr[i])) {
          skipSep(); if (i >= n || isCmd(pathStr[i])) break;
          const v = readNum();
          if (!isNaN(v)) { if (v < minY) minY = v; if (v > maxY) maxY = v; }
          skipSep();
        }
        continue;
      }
      const pairCount = { M:1,m:1,L:1,l:1,T:1,t:1,Q:2,q:2,S:2,s:2,C:3,c:3 }[cmd.toUpperCase()] || 1;
      while (i < n && !isCmd(pathStr[i])) {
        for (let p = 0; p < pairCount; p++) {
          skipSep(); if (i >= n || isCmd(pathStr[i])) break;
          const x = readNum();
          skipSep(); if (pathStr[i] === ',') i++; skipSep();
          const y = readNum();
          if (!isNaN(x)) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
          if (!isNaN(y)) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
        }
      }
    } else i++;
  }
  if (!isFinite(minX)) return { w:0, h:0, area:0, minX:0, minY:0, maxX:0, maxY:0 };
  const w = maxX - minX, h = maxY - minY;
  // 用几何包围盒中心加权打分，避免长条和小图形被优先
  const area = w * h;
  return { area, w, h, minX, minY, maxX, maxY };
}

function normalizePathAdvanced(pathStr, vb) {
  let result = '';
  let i = 0;
  const n = pathStr.length;
  const readNum = () => {
    let num = '';
    while (i < n && (pathStr[i] === '-' || pathStr[i] === '.' || (pathStr[i] >= '0' && pathStr[i] <= '9'))) num += pathStr[i++];
    return num ? parseFloat(num) : NaN;
  };
  const skipSep = () => { while (i < n && (pathStr[i] === ' ' || pathStr[i] === ',' || pathStr[i] === '\n' || pathStr[i] === '\t')) i++; };
  const isCmd = (ch) => 'MLQCSTAHVZmlqcstahvz'.includes(ch);
  while (i < n) {
    skipSep();
    if (i >= n) break;
    if (isCmd(pathStr[i])) {
      const cmd = pathStr[i++];
      result += cmd;
      skipSep();
      if (cmd === 'Z' || cmd === 'z') continue;
      if (cmd === 'H' || cmd === 'h') {
        while (i < n && !isCmd(pathStr[i])) {
          skipSep(); if (i >= n || isCmd(pathStr[i])) break;
          const v = readNum();
          const nv = cmd === 'H' ? ((v - vb.x) / vb.w) * 100 : (v / vb.w) * 100;
          result += ` ${nv.toFixed(4)}%`;
          skipSep();
        }
        continue;
      }
      if (cmd === 'V' || cmd === 'v') {
        while (i < n && !isCmd(pathStr[i])) {
          skipSep(); if (i >= n || isCmd(pathStr[i])) break;
          const v = readNum();
          const nv = cmd === 'V' ? ((v - vb.y) / vb.h) * 100 : (v / vb.h) * 100;
          result += ` ${nv.toFixed(4)}%`;
          skipSep();
        }
        continue;
      }
      const pairCount = { M:1,m:1,L:1,l:1,T:1,t:1,Q:2,q:2,S:2,s:2,C:3,c:3 }[cmd.toUpperCase()] || 1;
      let firstPair = true;
      while (i < n && !isCmd(pathStr[i])) {
        for (let p = 0; p < pairCount; p++) {
          skipSep(); if (i >= n || isCmd(pathStr[i])) break;
          if (firstPair && p === 0) result += ' ';
          else if (p > 0 || !firstPair) result += ',';
          const x = readNum();
          skipSep(); if (pathStr[i] === ',') i++; skipSep();
          const y = readNum();
          let nx, ny;
          if (cmd === cmd.toUpperCase()) { nx = ((x - vb.x) / vb.w) * 100; ny = ((y - vb.y) / vb.h) * 100; }
          else { nx = (x / vb.w) * 100; ny = (y / vb.h) * 100; }
          result += `${nx.toFixed(4)}% ${ny.toFixed(4)}%`;
        }
        firstPair = false;
      }
    } else i++;
  }
  return result.trim();
}

// 通用三图模板默认名，可之后在 puzzleTemplates.ts 中手动调整
const defaultNames = [
  '三图拼图1','三图拼图2','三图拼图3','三图拼图4','三图拼图5','三图拼图6','三图拼图7','三图拼图8',
  '三图拼图9','三图拼图10','三图拼图11','三图拼图12','三图拼图13','三图拼图14','三图拼图15','三图拼图16',
  '三图拼图17','三图拼图18','三图拼图19','三图拼图20','三图拼图21','三图拼图22','三图拼图23'
];

const templates = [];

for (let fi = 0; fi < files.length; fi++) {
  const file = files[fi];
  const filePath = path.join(inputDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
  let vb;
  if (viewBoxMatch) {
    const [, vbStr] = viewBoxMatch;
    const [vx, vy, vw, vh] = vbStr.split(/\s+/).map(Number);
    vb = { x: vx, y: vy, w: vw, h: vh };
  } else {
    // fallback: 找 width/height
    const wM = content.match(/width="([^"]+)"/), hM = content.match(/height="([^"]+)"/);
    const w = wM ? parseFloat(wM[1]) : 100;
    const h = hM ? parseFloat(hM[1]) : 100;
    vb = { x: 0, y: 0, w, h };
  }

  const pathRegex = /<path\s+[^>]*d="([^"]+)"[^>]*\/>/g;
  const rawPaths = [];
  let match;
  while ((match = pathRegex.exec(content)) !== null) rawPaths.push(match[1]);

  let allSubs = [];
  for (const rp of rawPaths) {
    const subs = splitSubPaths(rp);
    for (const s of subs) allSubs.push(s);
  }

  if (allSubs.length === 0) {
    console.warn(`跳过无闭合路径文件: ${file}`);
    continue;
  }

  const withBBox = allSubs.map(sp => {
    const bb = computeBBoxAndArea(sp);
    return { path: sp, ...bb };
  }).sort((a, b) => b.area - a.area);

  // 取最大 3 个，如果不够 3 个就用已有的个数
  const topN = withBBox.slice(0, Math.min(3, withBBox.length));
  // 如果不够3个，补足到3个复制最后一个
  while (topN.length < 3 && topN.length > 0) topN.push(topN[topN.length - 1]);

  const cells = topN.map(item => {
    const norm = normalizePathAdvanced(item.path, vb);
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      shapeType: 'custom',
      shapePath: `path("${norm}")`
    };
  });

  const tplName = defaultNames[fi] || `三图拼图${fi + 1}`;

  templates.push({
    id: `puzzle-3-svg-${fi + 1}`,
    name: tplName,
    category: 3,
    cells,
    sourceFile: file
  });
}

// 输出 TypeScript 代码块（不含 const/export，方便手动粘贴）
let tsCode = '';
for (const t of templates) {
  tsCode += `  {\n`;
  tsCode += `    id: '${t.id}',\n`;
  tsCode += `    name: '${t.name}',\n`;
  tsCode += `    category: ${t.category},\n`;
  tsCode += `    cells: [\n`;
  for (const cell of t.cells) {
    tsCode += `      {\n`;
    tsCode += `        x: ${cell.x},\n`;
    tsCode += `        y: ${cell.y},\n`;
    tsCode += `        width: ${cell.width},\n`;
    tsCode += `        height: ${cell.height},\n`;
    tsCode += `        shapeType: '${cell.shapeType}',\n`;
    tsCode += `        shapePath: '${cell.shapePath}',\n`;
    tsCode += `      },\n`;
  }
  tsCode += `    ],\n`;
  tsCode += `  },\n`;
}

const outFile = path.join(__dirname, '3图模板输出.ts');
fs.writeFileSync(outFile, tsCode, 'utf-8');

console.log(`共生成 ${templates.length} 个3图模板:`);
for (const t of templates) {
  console.log(`  ${t.id} (${t.name}) <- ${t.sourceFile}`);
}
console.log(`\nTS 代码已写入: ${outFile}`);
