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

const vbW = 130, vbH = 128;

// ================ SVG Path Parser ================
class SVGParser {
  constructor() { this.points = []; }
  add(x, y, type='on', cmd='') { this.points.push({x, y, type, cmd}); }

  parse(d) {
    const tokens = d.match(/[MLCQSTAHVZmlcqstahvz]|-?\d*\.?\d+/gi);
    if (!tokens) return;
    let i = 0;
    let cx = 0, cy = 0;
    let sx = 0, sy = 0;
    let prevCmd = '';
    while (i < tokens.length) {
      let tok = tokens[i++];
      const isRel = tok === tok.toLowerCase();
      const cmd = tok.toUpperCase();
      
      if (cmd === 'M' || cmd === 'L') {
        while (i < tokens.length && /-?\d/.test(tokens[i])) {
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          if (isRel) { cx += x; cy += y; } else { cx = x; cy = y; }
          if (cmd === 'M' && this.points.length === 0) this.add(cx, cy, 'on', 'M');
          else this.add(cx, cy, 'on', cmd === 'M' ? 'L' : cmd);
          if (cmd === 'M') { tok = isRel ? 'l' : 'L'; }
        }
      } else if (cmd === 'C') {
        while (i < tokens.length && /-?\d/.test(tokens[i])) {
          const x1 = parseFloat(tokens[i++]); const y1 = parseFloat(tokens[i++]);
          const x2 = parseFloat(tokens[i++]); const y2 = parseFloat(tokens[i++]);
          const x  = parseFloat(tokens[i++]); const y  = parseFloat(tokens[i++]);
          const p1 = isRel ? {x:cx+x1, y:cy+y1} : {x:x1, y:y1};
          const p2 = isRel ? {x:cx+x2, y:cy+y2} : {x:x2, y:y2};
          const pE = isRel ? {x:cx+x,  y:cy+y}  : {x:x,  y:y};
          this.add(p1.x, p1.y, 'ctrl1', 'C');
          this.add(p2.x, p2.y, 'ctrl2', 'C');
          this.add(pE.x, pE.y, 'on', 'C');
          sx = p2.x; sy = p2.y;
          cx = pE.x; cy = pE.y;
        }
      } else if (cmd === 'H') {
        while (i < tokens.length && /-?\d/.test(tokens[i])) {
          let x = parseFloat(tokens[i++]);
          if (isRel) cx += x; else cx = x;
          this.add(cx, cy, 'on', 'H');
        }
      } else if (cmd === 'V') {
        while (i < tokens.length && /-?\d/.test(tokens[i])) {
          let y = parseFloat(tokens[i++]);
          if (isRel) cy += y; else cy = y;
          this.add(cx, cy, 'on', 'V');
        }
      } else if (cmd === 'Z') {
        // close - don't add
      }
      prevCmd = cmd;
    }
    return this.points;
  }
}

function splitPathAtY(parser, splitY) {
  const pts = parser.points;
  // We need to split the closed polygon into two at horizontal line Y=splitY.
  // First find the two intersection points (left side and right side of path)
  const edges = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i+1) % pts.length];
    if ((a.y - splitY) * (b.y - splitY) < 0) {
      // Edge crosses the split line
      const t = (splitY - a.y) / (b.y - a.y);
      const ix = a.x + t * (b.x - a.x);
      const iy = splitY;
      edges.push({ segIdx: i, a, b, t, ix, iy });
    }
  }
  return edges;
}

// Parse Subpath 1
const parser1 = new SVGParser();
parser1.parse(subPaths[0]);
console.log('Subpath 1 parsed points:', parser1.points.length);

// Find all intersections at multiple candidate Y values to find the "bottleneck" (minimum width between left-right crossings)
// For each Y candidate, find all crossings, sort by X -> leftmost and rightmost are the outline crossings
const candidates = [];
for (let y = 40; y <= 60; y += 0.25) {
  const edges = splitPathAtY(parser1, y);
  if (edges.length >= 2) {
    const xs = edges.map(e => e.ix).sort((a,b) => a-b);
    const leftX = xs[0];
    const rightX = xs[xs.length-1];
    candidates.push({ y, width: rightX-leftX, leftX, rightX, count: edges.length });
  }
}
// Find bottleneck (min width)
candidates.sort((a,b) => a.width - b.width);
console.log('\n=== Top 15 bottleneck candidates (min width at Y) ===');
for (let i = 0; i < Math.min(15, candidates.length); i++) {
  const c = candidates[i];
  console.log(`Y=${c.y.toFixed(2)}  width=${c.width.toFixed(2)}  leftX=${c.leftX.toFixed(2)}  rightX=${c.rightX.toFixed(2)}  (crossings=${c.count})`);
}
const best = candidates[0];
console.log('\nBest split (bottleneck): Y=' + best.y.toFixed(2) + '  width=' + best.width.toFixed(2));
console.log('  Left intersection at X=' + best.leftX.toFixed(2));
console.log('  Right intersection at X=' + best.rightX.toFixed(2));

// Now we need to reconstruct two paths.
// Strategy: walk around Subpath 1's parsed ON-curves points (simplify: use only 'on' type points with line segments for shape construction)
// Since puzzle cells use CSS clip-path shapes, we can use simplified polygons for the cut.
const onPoints = parser1.points.filter(p => p.type === 'on');
console.log('\nOn-curve points:', onPoints.length);

// Find which segments the left and right split X lie on.
// For reconstruction we'll use the onPoints and linearly interpolate at splitY.

// Walk the polygon from right intersection going upward/leftward along top -> left intersection -> connect back (TOP half = ice cream)
// Walk left intersection going downward/rightward along bottom -> right intersection -> connect back (BOTTOM half = cup)

// First: find all on-point edges that cross splitY (between leftX and rightX)
// and note which are "left side" (closest to minX) and "right side" (closest to maxX)

// Actually simpler: just build two polygon shapes by walking onPoints and inserting the split interpolations.
// Find edges (on points) that cross splitY, and their X at that Y.
const crossOnEdges = [];
for (let i = 0; i < onPoints.length; i++) {
  const a = onPoints[i];
  const b = onPoints[(i+1) % onPoints.length];
  if ((a.y - best.y) * (b.y - best.y) <= 0 && a.y !== b.y) {
    const t = (best.y - a.y) / (b.y - a.y);
    const ix = a.x + t * (b.x - a.x);
    crossOnEdges.push({ idx: i, a, b, ix, iy: best.y, dir: b.y > a.y ? 'up' : 'down' });
  }
}
console.log('\nOn-curve edges crossing Y=' + best.y.toFixed(2) + ':', crossOnEdges.length);
crossOnEdges.forEach(e => console.log(`  edge[${e.idx}] (${e.a.x.toFixed(1)},${e.a.y.toFixed(1)})->(${e.b.x.toFixed(1)},${e.b.y.toFixed(1)})  ix=${e.ix.toFixed(2)}  dir=${e.dir}`));

crossOnEdges.sort((a,b) => a.ix - b.ix);
const leftCross = crossOnEdges[0];
const rightCross = crossOnEdges[crossOnEdges.length-1];
console.log('\nLeft  cross: edge idx=' + leftCross.idx + ', ix=' + leftCross.ix.toFixed(2));
console.log('Right cross: edge idx=' + rightCross.idx + ', ix=' + rightCross.ix.toFixed(2));

// ========= Build top half polygon (ice cream) =========
// Walk: rightCross.iy -> go forward (follow path in direction of decreasing Y, i.e. upward) until leftCross -> add line to rightCross
// Determine direction: 
const topPts = [{x: rightCross.ix, y: best.y}];
// We start from rightCross's edge. If rightCross.b is below/above?
// We want to traverse toward the TOP (y decreasing). So start with rightCross's endpoint that has lower Y, then continue.
let startIdx;
if (rightCross.a.y < rightCross.b.y) {
  // a is higher up: go backwards from rightCross.idx (include a)
  startIdx = rightCross.idx; // edge a->b, a is higher. Insert a and then walk back from rightCross.idx-1
} else {
  startIdx = (rightCross.idx + 1) % onPoints.length;
}
// Walk backwards around polygon until we hit leftCross edge
let cur = rightCross.a.y < rightCross.b.y ? rightCross.idx : (rightCross.idx + 1) % onPoints.length;
let safety = 0;
while (safety++ < 500) {
  // is cur the leftCross edge? leftCross edge connects onPoints[leftCross.idx] to onPoints[leftCross.idx+1]
  if (cur === (leftCross.idx + 1) % onPoints.length) {
    // Add leftCross intersection point (it's on edge leftCross.idx which ends at idx (leftCross.idx+1), so we insert after the crossing)
    topPts.push({x: leftCross.ix, y: best.y});
    break;
  }
  topPts.push({x: onPoints[cur].x, y: onPoints[cur].y});
  // step backward
  cur = (cur - 1 + onPoints.length) % onPoints.length;
}

// ========= Build bottom half polygon (cup) =========
const botPts = [{x: leftCross.ix, y: best.y}];
// Walk forward from leftCross edge downward
let cur2 = (leftCross.idx + 1) % onPoints.length;
let safety2 = 0;
while (safety2++ < 500) {
  if (cur2 === (rightCross.idx + 1) % onPoints.length) {
    botPts.push({x: rightCross.ix, y: best.y});
    break;
  }
  botPts.push({x: onPoints[cur2].x, y: onPoints[cur2].y});
  cur2 = (cur2 + 1) % onPoints.length;
}

function buildPolygonD(pts) {
  return 'M' + pts.map(p => p.x.toFixed(4) + ',' + p.y.toFixed(4)).join(' L ') + ' Z';
}

const topD = buildPolygonD(topPts);
const botD = buildPolygonD(botPts);

function pct(x, y) { return ((x/vbW)*100).toFixed(4) + '%,' + ((y/vbH)*100).toFixed(4) + '%'; }
function convertPathToPercent(pathD) {
  return pathD.replace(/([MLCZ])\s*(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (m, cmd, x, y) => {
    return cmd + ' ' + pct(parseFloat(x), parseFloat(y));
  });
}

// Subpath 8 (the small shape, currently evenodd hole). We'll treat this as CELL 2 (straw)
// For display as filled shape, not hole, we just use its path directly.
const strawD = subPaths[7]; // M16.78,38.44 ... Z

// Also, for evenodd holes (subpaths 2-7 in bottom): integrate them into cup's d using evenodd syntax (just concatenate)
// But CSS clip-path path() does support fill-rule? Let's test by building a composite path.
let cupWithHolesD = botD;
// Subpaths that lie below splitY -> belong to cup: subpath 2 (Y 93-107), subpath3 (Y96-104), subpath4 (Y78-81), subpath5 (Y70-73), subpath6 (Y57-65), subpath7 (Y52-54)
// Check each:
const holeIndexes = [];
for (let i = 1; i < subPaths.length; i++) {
  if (i === 7) continue; // subpath 8 is used as straw
  const p = new SVGParser();
  p.parse(subPaths[i]);
  const ys = p.points.map(q => q.y);
  const avgY = (Math.min(...ys) + Math.max(...ys)) / 2;
  if (avgY > best.y) {
    cupWithHolesD += ' ' + subPaths[i];
    holeIndexes.push(i+1);
  } else {
    topD += ' ' + subPaths[i];
    console.log(`Subpath ${i+1} avgY=${avgY.toFixed(1)} - added to ICE CREAM as hole`);
  }
}
console.log('\nCup holes (below splitY): subpath indexes', holeIndexes);

console.log('\n========= TOP (ICE CREAM) raw d (length: ' + topD.length + ') =========');
console.log(topD.substring(0,500) + '...');
console.log('\n========= BOTTOM (CUP) with holes raw d =========');
console.log(cupWithHolesD.substring(0,500) + '...');
console.log('\n========= STRAW (subpath 8) raw d =========');
console.log(strawD);

// Now convert all to percent
const topPct = 'path("' + convertPathToPercent(topD) + '")';
const cupPct = 'path("' + convertPathToPercent(cupWithHolesD) + '")';
const strawPct = 'path("' + convertPathToPercent(strawD) + '")';

console.log('\n\n========= FINAL CELLS for puzzle template =========');
console.log(`
  {
    id: 'puzzle-3-svg-9',
    name: '冰淇淋3图',
    category: 3,
    cells: [
      {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        shapeType: 'custom',
        shapePath: '${topPct}',
      },
      {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        shapeType: 'custom',
        shapePath: '${strawPct}',
      },
      {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        shapeType: 'custom',
        shapePath: '${cupPct}',
      },
    ],
  },
`);

// Also write for inspection
fs.writeFileSync(path.join(__dirname, 'icecream_output.txt'), 
  'TOP (ICE CREAM):\n' + topD + '\n\n' +
  'TOP percent:\n' + topPct + '\n\n' +
  'STRAW:\n' + strawD + '\n\n' +
  'STRAW percent:\n' + strawPct + '\n\n' +
  'BOTTOM (CUP) with holes:\n' + cupWithHolesD + '\n\n' +
  'BOTTOM percent:\n' + cupPct + '\n\n' +
  'TEMPLATE SNIPPET:\n' + 
`  {
    id: 'puzzle-3-svg-9',
    name: '冰淇淋3图',
    category: 3,
    cells: [
      { x: 0, y: 0, width: 100, height: 100, shapeType: 'custom', shapePath: '${topPct}' },
      { x: 0, y: 0, width: 100, height: 100, shapeType: 'custom', shapePath: '${strawPct}' },
      { x: 0, y: 0, width: 100, height: 100, shapeType: 'custom', shapePath: '${cupPct}' },
    ],
  },
`
);
console.log('\nOutput written to icecream_output.txt');
