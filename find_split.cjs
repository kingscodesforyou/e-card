const fs = require('fs');

const svgContent = fs.readFileSync('e:\\workspaceForTrae\\e-card(trea)\\新建文件夹\\PixPin_2026-07-08_12-32-53.svg', 'utf-8');
const pathMatch = svgContent.match(/d="([^"]+)"/);
const d = pathMatch[1];

const viewBoxW = 130;
const viewBoxH = 128;

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
console.log(`Total subpaths: ${subPaths.length}`);

function parsePathPoints(d, samplesPerBezier = 8) {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d+\.?\d*(?:e[+-]?\d+)?/gi) || [];
  const points = [];
  let i = 0;
  let cx = 0, cy = 0;
  let sx = 0, sy = 0;
  let prevCmd = null;
  
  function readNum() { return parseFloat(tokens[i++]); }
  
  while (i < tokens.length) {
    let cmd = tokens[i];
    if (/^-?\d/.test(cmd)) {
      cmd = prevCmd;
      i--;
    } else {
      i++;
    }
    
    const isRelative = cmd === cmd.toLowerCase();
    
    switch (cmd.toUpperCase()) {
      case 'M': {
        const x = readNum() + (isRelative ? cx : 0);
        const y = readNum() + (isRelative ? cy : 0);
        cx = x; cy = y; sx = x; sy = y;
        points.push({x, y, moveTo: true});
        prevCmd = 'L';
        break;
      }
      case 'L': {
        const x = readNum() + (isRelative ? cx : 0);
        const y = readNum() + (isRelative ? cy : 0);
        cx = x; cy = y;
        points.push({x, y});
        prevCmd = cmd;
        break;
      }
      case 'H': {
        const x = readNum() + (isRelative ? cx : 0);
        cx = x;
        points.push({x, y: cy});
        prevCmd = cmd;
        break;
      }
      case 'V': {
        const y = readNum() + (isRelative ? cy : 0);
        cy = y;
        points.push({x: cx, y});
        prevCmd = cmd;
        break;
      }
      case 'C': {
        const x1 = readNum() + (isRelative ? cx : 0);
        const y1 = readNum() + (isRelative ? cy : 0);
        const x2 = readNum() + (isRelative ? cx : 0);
        const y2 = readNum() + (isRelative ? cy : 0);
        const ex = readNum() + (isRelative ? cx : 0);
        const ey = readNum() + (isRelative ? cy : 0);
        for (let s = 1; s <= samplesPerBezier; s++) {
          const t = s / samplesPerBezier;
          const mt = 1 - t;
          const x = mt*mt*mt*cx + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*ex;
          const y = mt*mt*mt*cy + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*ey;
          points.push({x, y});
        }
        cx = ex; cy = ey;
        prevCmd = cmd;
        break;
      }
      case 'S': {
        let x1, y1;
        if (prevCmd === 'C' || prevCmd === 'S') {
          x1 = 2*cx - (points[points.length - samplesPerBezier - 1]?.x || cx);
          y1 = 2*cy - (points[points.length - samplesPerBezier - 1]?.y || cy);
        } else { x1 = cx; y1 = cy; }
        const x2 = readNum() + (isRelative ? cx : 0);
        const y2 = readNum() + (isRelative ? cy : 0);
        const ex = readNum() + (isRelative ? cx : 0);
        const ey = readNum() + (isRelative ? cy : 0);
        for (let s = 1; s <= samplesPerBezier; s++) {
          const t = s / samplesPerBezier;
          const mt = 1 - t;
          const x = mt*mt*mt*cx + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*ex;
          const y = mt*mt*mt*cy + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*ey;
          points.push({x, y});
        }
        cx = ex; cy = ey;
        prevCmd = cmd;
        break;
      }
      case 'Z': {
        cx = sx; cy = sy;
        points.push({x: sx, y: sy, close: true});
        prevCmd = null;
        break;
      }
      default:
        console.log('Unknown cmd:', cmd);
        i++;
    }
  }
  return points;
}

function lineIntersectY(p1, p2, y) {
  if ((p1.y <= y && p2.y <= y) || (p1.y >= y && p2.y >= y)) return null;
  if (p1.y === p2.y) return null;
  const t = (y - p1.y) / (p2.y - p1.y);
  return { x: p1.x + t * (p2.x - p1.x), y };
}

function findIntersections(points, y) {
  const xs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (p2.moveTo) continue;
    const isect = lineIntersectY(p1, p2, y);
    if (isect) xs.push(isect.x);
  }
  xs.sort((a, b) => a - b);
  return xs;
}

const mainPoints = parsePathPoints(subPaths[0], 12);
console.log(`\nMain shape points: ${mainPoints.length}`);

console.log('\n=== Intersection analysis (Y=48~80 pixels) ===');
for (let y = 48; y <= 82; y += 1) {
  const xs = findIntersections(mainPoints, y);
  const widths = [];
  for (let i = 0; i < xs.length - 1; i += 2) {
    widths.push((xs[i+1] - xs[i]).toFixed(1));
  }
  const bottleneckWidth = xs.length >= 2 ? Math.min(...xs.filter((_,idx)=>idx%2===1).map((x,idx)=>x-xs[idx*2])) : 0;
  const pctY = (y/viewBoxH*100).toFixed(1);
  console.log(`Y=${y}px (${pctY}%): isects=${xs.length}, Xs=[${xs.map(x=>x.toFixed(1)).join(',')}], widths=[${widths.join(',')}]${xs.length===2 && bottleneckWidth < 85 ? '  <-- GOOD BOTTLENECK' : ''}`);
}
