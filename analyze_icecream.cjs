const fs = require('fs');

const svgContent = fs.readFileSync('e:\\workspaceForTrae\\e-card(trea)\\新建文件夹\\PixPin_2026-07-08_12-32-53.svg', 'utf-8');

const pathMatch = svgContent.match(/d="([^"]+)"/);
if (!pathMatch) {
  console.log('No path found');
  process.exit(1);
}

const d = pathMatch[1];
console.log('Raw d attribute:', d.substring(0, 100) + '...');
console.log('');

function extractSubPaths(d) {
  const subPaths = [];
  const regex = /M[^MZ]*Z/gi;
  let match;
  while ((match = regex.exec(d)) !== null) {
    subPaths.push(match[0]);
  }
  return subPaths;
}

const subPaths = extractSubPaths(d);
console.log(`Found ${subPaths.length} subpaths:`);
console.log('');

const viewBoxW = 130;
const viewBoxH = 128;

function analyzeSubPath(sp, idx) {
  const coordRegex = /(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)/g;
  const coords = [];
  let m;
  while ((m = coordRegex.exec(sp)) !== null) {
    coords.push([parseFloat(m[1]), parseFloat(m[2])]);
  }
  
  if (coords.length === 0) return null;
  
  const xs = coords.map(c => c[0]);
  const ys = coords.map(c => c[1]);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  const pct = (v, total) => (v / total * 100).toFixed(4) + '%';
  
  return {
    idx,
    numCoords: coords.length,
    minX: pct(minX, viewBoxW),
    maxX: pct(maxX, viewBoxW),
    minY: pct(minY, viewBoxH),
    maxY: pct(maxY, viewBoxH),
    centerX: pct(centerX, viewBoxW),
    centerY: pct(centerY, viewBoxH),
    width: ((maxX - minX) / viewBoxW * 100).toFixed(2) + '%',
    height: ((maxY - minY) / viewBoxH * 100).toFixed(2) + '%',
    rawMinX: minX,
    rawMaxX: maxX,
    rawMinY: minY,
    rawMaxY: maxY,
    rawCenterX: centerX,
    rawCenterY: centerY,
    pathPreview: sp.substring(0, 80) + '...'
  };
}

const analyses = [];
subPaths.forEach((sp, i) => {
  const a = analyzeSubPath(sp, i);
  if (a) {
    analyses.push(a);
    console.log(`--- Subpath ${i} ---`);
    console.log(`  Coords: ${a.numCoords}`);
    console.log(`  X: [${a.minX}, ${a.maxX}]  Width: ${a.width}`);
    console.log(`  Y: [${a.minY}, ${a.maxY}]  Height: ${a.height}`);
    console.log(`  Center: (${a.centerX}, ${a.centerY})`);
    console.log(`  Preview: ${a.pathPreview}`);
    console.log('');
  }
});

console.log('=== Summary by Region ===');
console.log('Top (Y < 50%):');
analyses.filter(a => a.rawCenterY < viewBoxH * 0.5).forEach(a => {
  console.log(`  Subpath ${a.idx}: CenterY=${a.centerY}, X=[${a.minX},${a.maxX}]`);
});
console.log('Bottom (Y >= 50%):');
analyses.filter(a => a.rawCenterY >= viewBoxH * 0.5).forEach(a => {
  console.log(`  Subpath ${a.idx}: CenterY=${a.centerY}, X=[${a.minX},${a.maxX}]`);
});
console.log('Left (X < 50%):');
analyses.filter(a => a.rawCenterX < viewBoxW * 0.5).forEach(a => {
  console.log(`  Subpath ${a.idx}: CenterX=${a.centerX}`);
});
console.log('Right (X >= 50%):');
analyses.filter(a => a.rawCenterX >= viewBoxW * 0.5).forEach(a => {
  console.log(`  Subpath ${a.idx}: CenterX=${a.centerX}`);
});
