const fs = require('fs');

const svgContent = fs.readFileSync('e:\\workspaceForTrae\\e-card(trea)\\新建文件夹\\PixPin_2026-07-08_12-32-53.svg', 'utf-8');
const pathMatch = svgContent.match(/d="([^"]+)"/);
const d = pathMatch[1];

const viewBoxW = 130;
const viewBoxH = 128;
const SPLIT_Y = 80; // pixels, about 62.5%

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

function parsePathSegments(d, samplesPerBezier = 14) {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d+\.?\d*(?:e[+-]?\d+)?/gi) || [];
  const segments = [];
  let currentPts = [];
  let i = 0;
  let cx = 0, cy = 0;
  let sx = 0, sy = 0;
  let prevCmd = null;
  
  function readNum() { return parseFloat(tokens[i++]); }
  
  function flushSub() {
    if (currentPts.length > 0) {
      segments.push([...currentPts]);
      currentPts = [];
    }
  }
  
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
        flushSub();
        const x = readNum() + (isRelative ? cx : 0);
        const y = readNum() + (isRelative ? cy : 0);
        cx = x; cy = y; sx = x; sy = y;
        currentPts.push({x, y});
        prevCmd = 'L';
        break;
      }
      case 'L': {
        const x = readNum() + (isRelative ? cx : 0);
        const y = readNum() + (isRelative ? cy : 0);
        currentPts.push({x, y});
        cx = x; cy = y;
        prevCmd = cmd;
        break;
      }
      case 'H': {
        const x = readNum() + (isRelative ? cx : 0);
        currentPts.push({x, y: cy});
        cx = x;
        prevCmd = cmd;
        break;
      }
      case 'V': {
        const y = readNum() + (isRelative ? cy : 0);
        currentPts.push({x: cx, y});
        cy = y;
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
          currentPts.push({x, y});
        }
        cx = ex; cy = ey;
        prevCmd = cmd;
        break;
      }
      case 'S': {
        let x1, y1;
        if (prevCmd === 'C' || prevCmd === 'S') {
          const prevEndIdx = currentPts.length - samplesPerBezier - 1;
          const prevC2 = prevEndIdx >= 0 ? currentPts[prevEndIdx] : {x: cx, y: cy};
          x1 = 2*cx - prevC2.x;
          y1 = 2*cy - prevC2.y;
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
          currentPts.push({x, y});
        }
        cx = ex; cy = ey;
        prevCmd = cmd;
        break;
      }
      case 'Z': {
        currentPts.push({x: sx, y: sy});
        flushSub();
        cx = sx; cy = sy;
        prevCmd = null;
        break;
      }
      default:
        i++;
    }
  }
  flushSub();
  return segments;
}

function splitPointsAtY(points, ySplit) {
  const above = [];
  const below = [];
  const isects = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    
    const p1Above = p1.y <= ySplit + 0.001;
    const p2Above = p2.y <= ySplit + 0.001;
    
    if (p1Above) above.push({...p1});
    else below.push({...p1});
    
    if (p1Above !== p2Above) {
      const t = (ySplit - p1.y) / (p2.y - p1.y);
      const ix = p1.x + t * (p2.x - p1.x);
      const isect = {x: ix, y: ySplit, isIntersection: true};
      above.push(isect);
      below.push(isect);
      isects.push(ix);
    }
  }
  const last = points[points.length - 1];
  if (last.y <= ySplit + 0.001) above.push({...last});
  else below.push({...last});
  
  return { above, below, isects };
}

function pointsToPath(points) {
  if (points.length < 2) return '';
  let s = `M ${points[0].x.toFixed(4)},${points[0].y.toFixed(4)}`;
  for (let i = 1; i < points.length; i++) {
    s += ` L ${points[i].x.toFixed(4)},${points[i].y.toFixed(4)}`;
  }
  return s + ' Z';
}

function convertToPercent(rawPath, w, h) {
  return rawPath.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (m, x, y) => {
    const xp = (parseFloat(x)/w*100).toFixed(4) + '%';
    const yp = (parseFloat(y)/h*100).toFixed(4) + '%';
    return `${xp},${yp}`;
  });
}

function buildTopPolygon(mainAbove, holesAbove, ySplit) {
  if (mainAbove.length < 3) return '';
  const outline = [...mainAbove];
  
  // Check if we need to close along split line
  const firstOnSplit = Math.abs(outline[0].y - ySplit) < 0.01;
  const lastOnSplit = Math.abs(outline[outline.length - 1].y - ySplit) < 0.01;
  
  // Collect all points on y=split line (including holes' top edges)
  const splitPoints = [];
  for (let i = 0; i < outline.length; i++) {
    if (Math.abs(outline[i].y - ySplit) < 0.01) {
      splitPoints.push({...outline[i], idx: i});
    }
  }
  for (const h of holesAbove) {
    for (const p of h) {
      if (Math.abs(p.y - ySplit) < 0.01) splitPoints.push({...p, hole: true});
    }
  }
  splitPoints.sort((a,b) => a.x - b.x);
  
  return pointsToPath(outline);
}

function buildBottomPolygon(mainBelow, holesBelow, ySplit) {
  if (mainBelow.length < 3) return '';
  return pointsToPath(mainBelow);
}

// ===================== Process Main Shape (subpath 0) =====================
const mainSegs = parsePathSegments(subPaths[0], 14);
console.log(`Main segments: ${mainSegs.length}`);
const mainPts = mainSegs[0];
console.log(`Main points: ${mainPts.length}`);

const split = splitPointsAtY(mainPts, SPLIT_Y);
console.log(`Above points: ${split.above.length}, Below points: ${split.below.length}, Intersections: ${split.isects.length}`);

let topRaw = buildTopPolygon(split.above, [], SPLIT_Y);
let bottomRaw = buildBottomPolygon(split.below, [], SPLIT_Y);

// ===================== Add holes (subpaths 3-6) to TOP =====================
// Holes above split: add them as separate M...Z subpaths for even-odd rule
for (let hi = 3; hi <= 6; hi++) {
  const holeSegs = parsePathSegments(subPaths[hi], 10);
  if (holeSegs.length > 0) {
    const holePts = holeSegs[0];
    const maxY = Math.max(...holePts.map(p => p.y));
    const minY = Math.min(...holePts.map(p => p.y));
    console.log(`Hole ${hi}: Y range [${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
    if (maxY <= SPLIT_Y + 0.1) {
      // Hole fully above split -> add to top
      topRaw += ' ' + pointsToPath(holePts);
      console.log(`  -> Added to ICE CREAM (top)`);
    } else if (minY >= SPLIT_Y - 0.1) {
      bottomRaw += ' ' + pointsToPath(holePts);
      console.log(`  -> Added to CUP (bottom)`);
    } else {
      // Hole crosses split -> split it
      const hSplit = splitPointsAtY(holePts, SPLIT_Y);
      if (hSplit.above.length >= 3) topRaw += ' ' + pointsToPath(hSplit.above);
      if (hSplit.below.length >= 3) bottomRaw += ' ' + pointsToPath(hSplit.below);
      console.log(`  -> SPLIT across`);
    }
  }
}

// ===================== Subpath 7: STRAW =====================
const strawSegs = parsePathSegments(subPaths[7], 10);
const strawRaw = pointsToPath(strawSegs[0]);
console.log(`\nStraw subpath 7: points=${strawSegs[0].length}`);

// ===================== Add bottom feet (subpaths 1-2) to CUP =====================
const cupSegs1 = parsePathSegments(subPaths[1], 10);
bottomRaw += ' ' + pointsToPath(cupSegs1[0]);
console.log(`Added foot 1 to CUP`);
const cupSegs2 = parsePathSegments(subPaths[2], 10);
bottomRaw += ' ' + pointsToPath(cupSegs2[0]);
console.log(`Added foot 2 to CUP`);

// ===================== Convert to percentages =====================
const topPct = convertToPercent(topRaw, viewBoxW, viewBoxH);
const strawPct = convertToPercent(strawRaw, viewBoxW, viewBoxH);
const bottomPct = convertToPercent(bottomRaw, viewBoxW, viewBoxH);

console.log('\n================ OUTPUT: TypeScript Template ================\n');
console.log(`{`);
console.log(`  id: 'puzzle-3-svg-9',`);
console.log(`  name: '冰淇淋3图',`);
console.log(`  category: 3,`);
console.log(`  cells: [`);
console.log(`    // Cell 1: Ice cream (top)`);
console.log(`    {`);
console.log(`      x: 0, y: 0, width: 100, height: 100,`);
console.log(`      shapeType: 'custom',`);
console.log(`      shapePath: 'path("${topPct}")',`);
console.log(`    },`);
console.log(`    // Cell 2: Straw (top-left/right)`);
console.log(`    {`);
console.log(`      x: 0, y: 0, width: 100, height: 100,`);
console.log(`      shapeType: 'custom',`);
console.log(`      shapePath: 'path("${strawPct}")',`);
console.log(`    },`);
console.log(`    // Cell 3: Cup (bottom)`);
console.log(`    {`);
console.log(`      x: 0, y: 0, width: 100, height: 100,`);
console.log(`      shapeType: 'custom',`);
console.log(`      shapePath: 'path("${bottomPct}")',`);
console.log(`    },`);
console.log(`  ],`);
console.log(`},`);

// Save to file
fs.writeFileSync('e:\\workspaceForTrae\\e-card(trea)\\icecream_final.txt', `{
  id: 'puzzle-3-svg-9',
  name: '冰淇淋3图',
  category: 3,
  cells: [
    // Cell 1: Ice cream (top)
    {
      x: 0, y: 0, width: 100, height: 100,
      shapeType: 'custom',
      shapePath: 'path("${topPct}")',
    },
    // Cell 2: Straw
    {
      x: 0, y: 0, width: 100, height: 100,
      shapeType: 'custom',
      shapePath: 'path("${strawPct}")',
    },
    // Cell 3: Cup (bottom)
    {
      x: 0, y: 0, width: 100, height: 100,
      shapeType: 'custom',
      shapePath: 'path("${bottomPct}")',
    },
  ],
},`);
console.log('\nSaved to icecream_final.txt');
