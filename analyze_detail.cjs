const fs = require('fs');
const path = require('path');

const svgFile = path.join(__dirname, '新建文件夹', 'PixPin_2026-07-08_12-32-53.svg');
const content = fs.readFileSync(svgFile, 'utf-8');

const dMatch = content.match(/<path[^>]*d="([^"]+)"[^>]*>/);
const d = dMatch[1];

const regex = /M[^MZ]*Z/gi;
const subPaths = [];
let m;
while ((m = regex.exec(d)) !== null) subPaths.push(m[0]);

console.log('Total subpaths:', subPaths.length);

// Extract all coordinate pairs from a path command, tracking sequence
function extractCoordsInOrder(pathD) {
  const result = [];
  let cmdMatch;
  const cmdRegex = /([MLCQSTAHV])([^MLCQSTAHVZ]*)/gi;
  while ((cmdMatch = cmdRegex.exec(pathD)) !== null) {
    const cmd = cmdMatch[1].toUpperCase();
    const paramsStr = cmdMatch[2].trim();
    if (!paramsStr) continue;
    const nums = paramsStr.split(/[\s,]+/).filter(Boolean).map(Number);
    
    if (cmd === 'M' || cmd === 'L') {
      for (let i = 0; i < nums.length; i += 2) {
        result.push({ cmd, x: nums[i], y: nums[i+1] });
      }
    } else if (cmd === 'C') {
      for (let i = 0; i < nums.length; i += 6) {
        result.push({ cmd: 'C-cp1', x: nums[i], y: nums[i+1] });
        result.push({ cmd: 'C-cp2', x: nums[i+2], y: nums[i+3] });
        result.push({ cmd: 'C-end', x: nums[i+4], y: nums[i+5] });
      }
    } else if (cmd === 'H') {
      nums.forEach(x => result.push({ cmd: 'H', x, y: result.length ? result[result.length-1].y : 0 }));
    } else if (cmd === 'V') {
      nums.forEach(y => result.push({ cmd: 'V', x: result.length ? result[result.length-1].x : 0, y }));
    } else if (cmd === 'Q' || cmd === 'S') {
      for (let i = 0; i < nums.length; i += 4) {
        result.push({ cmd: cmd+'-cp', x: nums[i], y: nums[i+1] });
        result.push({ cmd: cmd+'-end', x: nums[i+2], y: nums[i+3] });
      }
    } else if (cmd === 'A') {
      for (let i = 0; i < nums.length; i += 7) {
        result.push({ cmd: 'A-end', x: nums[i+5], y: nums[i+6] });
      }
    } else if (cmd === 'T') {
      for (let i = 0; i < nums.length; i += 2) {
        result.push({ cmd: 'T-end', x: nums[i], y: nums[i+1] });
      }
    }
  }
  return result;
}

const vbW = 130, vbH = 128;
function toPct(x, y) {
  return `(${(x/vbW*100).toFixed(1)}%, ${(y/vbH*100).toFixed(1)}%)`;
}

console.log('\n=== Subpath 1 (Big Outline) - All nodes in order ===');
const sp1 = subPaths[0];
const coords1 = extractCoordsInOrder(sp1);
console.log('Total nodes:', coords1.length);
console.log('\nNode# | Type   | (x, y)      | % (X%, Y%)       | X range info');
console.log('------+--------+-------------+-----------------+------------');
coords1.forEach((c, i) => {
  const marker = [];
  if (c.y < 50) marker.push('TOP(y<50)');
  else if (c.y > 90) marker.push('BOTTOM(y>90)');
  if (c.cmd === 'M') marker.unshift('<<START');
  if (i === coords1.length - 1) marker.push('<<LAST BEFORE Z');
  console.log(
    String(i+1).padStart(5) + ' | ' +
    c.cmd.padEnd(6) + ' | ' +
    `(${c.x.toFixed(2)}, ${c.y.toFixed(2)})`.padEnd(13) + ' | ' +
    toPct(c.x, c.y).padEnd(17) + ' | ' +
    marker.join(' ')
  );
});

// Analyze Y-axis distribution
console.log('\n=== Subpath 1 Y-axis analysis (looking for split point) ===');
const yVals = coords1.map(c => c.y);
console.log('Y min:', Math.min(...yVals).toFixed(2), '  Y max:', Math.max(...yVals).toFixed(2));
// Find horizontal bands
for (let y = 24; y <= 108; y += 5) {
  const nodes = coords1.filter(c => c.y >= y && c.y < y+5).length;
  const xValsInBand = coords1.filter(c => c.y >= y && c.y < y+5).map(c => c.x);
  const xMin = xValsInBand.length ? Math.min(...xValsInBand) : 0;
  const xMax = xValsInBand.length ? Math.max(...xValsInBand) : 0;
  const width = xMax - xMin;
  console.log(`Y ${y.toString().padStart(3)}-${(y+5).toString().padStart(3)}: ${nodes.toString().padStart(3)} nodes, X width: ${width.toFixed(2).padStart(6)} (${xMin.toFixed(1)} to ${xMax.toFixed(1)}) ${width < 50 ? '<< NARROW' : ''}`);
}

console.log('\n=== Subpath 8 (Upper-left small shape) Details ===');
const sp8 = subPaths[7];
const coords8 = extractCoordsInOrder(sp8);
coords8.forEach((c, i) => {
  console.log(String(i+1).padStart(3), c.cmd.padEnd(6), `(${c.x.toFixed(2)}, ${c.y.toFixed(2)})`, toPct(c.x, c.y));
});
console.log('X:', Math.min(...coords8.map(c=>c.x)).toFixed(2), '-', Math.max(...coords8.map(c=>c.x)).toFixed(2));
console.log('Y:', Math.min(...coords8.map(c=>c.y)).toFixed(2), '-', Math.max(...coords8.map(c=>c.y)).toFixed(2));
