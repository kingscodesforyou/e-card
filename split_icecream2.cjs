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

// ================ SVG Path Parser -> outputs (x,y) list with on-curve points only ================
// We also keep bezier info but for cutting polygon, we use high-resolution sampled points.
function flattenPath(d, samplesPerCurve=10) {
  const tokens = d.match(/[MLCQSTAHVZmlcqstahvz]|-?\d*\.?\d+/gi);
  if (!tokens) return [];
  let i = 0;
  let cx = 0, cy = 0; // current point
  const pts = [];
  while (i < tokens.length) {
    let tok = tokens[i++];
    const isRel = tok === tok.toLowerCase();
    const cmd = tok.toUpperCase();
    const readPair = () => {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      if (isRel) return [cx + x, cy + y];
      return [x, y];
    };
    const readNum = () => {
      const v = parseFloat(tokens[i++]);
      return isRel ? v : v;
    };
    if (cmd === 'M' || cmd === 'L') {
      while (i < tokens.length && /-?\d/.test(tokens[i])) {
        const [x, y] = readPair();
        pts.push([x, y]);
        cx = x; cy = y;
        if (cmd === 'M') tok = isRel ? 'l' : 'L';
      }
    } else if (cmd === 'C') {
      while (i < tokens.length && /-?\d/.test(tokens[i])) {
        const [x1, y1] = readPair();
        const [x2, y2] = readPair();
        const [xe, ye] = readPair();
        // sample cubic bezier
        for (let s = 1; s <= samplesPerCurve; s++) {
          const t = s / samplesPerCurve;
          const mt = 1 - t;
          const x = mt*mt*mt*cx + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*xe;
          const y = mt*mt*mt*cy + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*ye;
          pts.push([x, y]);
        }
        cx = xe; cy = ye;
      }
    } else if (cmd === 'H') {
      while (i < tokens.length && /-?\d/.test(tokens[i])) {
        const xv = readNum();
        const x = isRel ? cx + xv : xv;
        pts.push([x, cy]);
        cx = x;
      }
    } else if (cmd === 'V') {
      while (i < tokens.length && /-?\d/.test(tokens[i])) {
        const yv = readNum();
        const y = isRel ? cy + yv : yv;
        pts.push([cx, y]);
        cy = y;
      }
    } else if (cmd === 'Q' || cmd === 'S') {
      while (i < tokens.length && /-?\d/.test(tokens[i])) {
        const [x1, y1] = readPair();
        const [xe, ye] = readPair();
        for (let s = 1; s <= samplesPerCurve; s++) {
          const t = s / samplesPerCurve;
          const mt = 1 - t;
          const x = mt*mt*cx + 2*mt*t*x1 + t*t*xe;
          const y = mt*mt*cy + 2*mt*t*y1 + t*t*ye;
          pts.push([x, y]);
        }
        cx = xe; cy = ye;
      }
    } else if (cmd === 'Z') {
      // close
    }
  }
  return pts;
}

const sp1Flat = flattenPath(subPaths[0], 16);
console.log('Subpath 1 flattened points:', sp1Flat.length);

// Find crossings for each Y candidate
function findCrossings(pts, y) {
  const xs = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i+1) % pts.length];
    if ((ay - y) * (by - y) < 0) { // strictly crossing
      const t = (y - ay) / (by - ay);
      const ix = ax + t * (bx - ax);
      xs.push(ix);
    }
  }
  xs.sort((a,b) => a-b);
  return xs;
}

console.log('\n=== Bottleneck scan (looking for exactly 2 crossings and min width) ===');
const candidates = [];
for (let y = 40; y <= 60; y += 0.1) {
  const xs = findCrossings(sp1Flat, y);
  if (xs.length === 2) {
    candidates.push({ y, width: xs[1]-xs[0], leftX: xs[0], rightX: xs[1] });
  }
}
candidates.sort((a,b) => a.width - b.width);
console.log('Total candidates:', candidates.length);
for (let i = 0; i < Math.min(20, candidates.length); i++) {
  const c = candidates[i];
  console.log(`  Y=${c.y.toFixed(2)}  width=${c.width.toFixed(2)}  L=${c.leftX.toFixed(2)}  R=${c.rightX.toFixed(2)}`);
}
const best = candidates[0];
console.log('\nBest split Y=' + best.y.toFixed(2) + '  width=' + best.width.toFixed(2));

// Now build top and bottom polygons from flattened points, cut at Y=best.y
// Strategy: walk through flattened points, insert cut intersections, split into top and bottom chains

// First find the 2 edge intersections in the flattened point array
const cuts = []; // {beforeIdx, x, y}
for (let i = 0; i < sp1Flat.length; i++) {
  const [ax, ay] = sp1Flat[i];
  const [bx, by] = sp1Flat[(i+1) % sp1Flat.length];
  if ((ay - best.y) * (by - best.y) < 0) {
    const t = (best.y - ay) / (by - ay);
    const ix = ax + t * (bx - ax);
    cuts.push({ beforeIdx: i, ix, iy: best.y, dirUp: by < ay }); // dirUp means next point goes upward (decreasing Y)
  }
}
console.log('\nFound cuts:', cuts.length);
cuts.forEach(c => {
  const [ax, ay] = sp1Flat[c.beforeIdx];
  const [bx, by] = sp1Flat[(c.beforeIdx+1) % sp1Flat.length];
  console.log(`  before idx=${c.beforeIdx}: (${ax.toFixed(1)},${ay.toFixed(1)})->(${bx.toFixed(1)},${by.toFixed(1)})  cut@(${c.ix.toFixed(1)},${c.iy.toFixed(1)})  dirUp=${c.dirUp}`);
});
cuts.sort((a,b) => a.ix - b.ix);
const leftCut = cuts[0];
const rightCut = cuts[1];
console.log(`Left cut idx=${leftCut.beforeIdx} at x=${leftCut.ix.toFixed(2)}`);
console.log(`Right cut idx=${rightCut.beforeIdx} at x=${rightCut.ix.toFixed(2)}`);

// Construct top polygon (ice cream) -> from rightCut, go upward (the direction toward top), pass through 
// We know: if dirUp is true, the segment goes to lower y (higher up).
// Walk: start at rightCut intersection -> go along the path that visits top area -> reach leftCut -> connect back to right cut

function buildPolygon(cutStart, cutEnd, direction) {
  // direction: 'up' means we take the path from cutStart going in direction toward decreasing Y, and loop back
  const result = [[cutStart.ix, cutStart.iy]];
  let idx = (cutStart.beforeIdx + 1) % sp1Flat.length;
  let steps = 0;
  let firstStep = true;
  while (steps++ < 10000) {
    // Stop condition: reached the edge where cutEnd lives (beforeIdx == cutEnd.beforeIdx)
    // Actually: after we add idx, if this idx is exactly cutEnd.beforeIdx, we should stop and insert cutEnd instead
    result.push([sp1Flat[idx][0], sp1Flat[idx][1]]);
    if (idx === cutEnd.beforeIdx) {
      result.push([cutEnd.ix, cutEnd.iy]);
      break;
    }
    idx = (idx + 1) % sp1Flat.length;
  }
  return result;
}

// Need to determine correct walking direction
// Try both and use the one whose resulting polygon has the correct centroid Y (top should have lower Y)
function tryBuild(cutStart, endCut, startForward) {
  const result = [[cutStart.ix, cutStart.iy]];
  let idx = startForward ? (cutStart.beforeIdx + 1) % sp1Flat.length : cutStart.beforeIdx;
  const step = startForward ? 1 : -1;
  let safety = 0;
  while (safety++ < sp1Flat.length * 2) {
    if (startForward) {
      // Forward: we add sp1Flat[idx], then check if idx==endCut.beforeIdx -> insert cut end
      result.push([sp1Flat[idx][0], sp1Flat[idx][1]]);
      if (idx === endCut.beforeIdx) {
        result.push([endCut.ix, endCut.iy]);
        break;
      }
      idx = (idx + 1) % sp1Flat.length;
    } else {
      // Backward: current is idx, next is idx-1. The cut lives BEFORE idx endCut.beforeIdx. So when we land on idx == (endCut.beforeIdx+1), we need to insert cutEnd before adding that? 
      // Actually simpler: check before adding
      if ((idx - 1 + sp1Flat.length) % sp1Flat.length === endCut.beforeIdx) {
        result.push([endCut.ix, endCut.iy]);
        break;
      }
      result.push([sp1Flat[idx][0], sp1Flat[idx][1]]);
      idx = (idx - 1 + sp1Flat.length) % sp1Flat.length;
    }
  }
  return result;
}

const fwd1 = tryBuild(rightCut, leftCut, true);
const fwd2 = tryBuild(rightCut, leftCut, false);
function avgY(poly) {
  return poly.reduce((s,p) => s+p[1], 0) / poly.length;
}
// Top polygon should have smaller average Y (higher up on screen)
let topPoly, botPoly;
if (avgY(fwd1) < avgY(fwd2)) {
  topPoly = fwd1;
  // The bottom polygon should then be opposite direction from left cut to right cut, OR simply: the other direction
  // Let's verify: bottom = tryBuild(leftCut, rightCut, ...) such that avgY is larger
  // Actually bottom is the complement. But let's compute both from leftCut
  const bwd1 = tryBuild(leftCut, rightCut, true);
  const bwd2 = tryBuild(leftCut, rightCut, false);
  botPoly = avgY(bwd1) > avgY(bwd2) ? bwd1 : bwd2;
} else {
  topPoly = fwd2;
  const bwd1 = tryBuild(leftCut, rightCut, true);
  const bwd2 = tryBuild(leftCut, rightCut, false);
  botPoly = avgY(bwd1) > avgY(bwd2) ? bwd1 : bwd2;
}
console.log('\nTop poly points:', topPoly.length, '  avg Y:', avgY(topPoly).toFixed(2));
console.log('Bot poly points:', botPoly.length, '  avg Y:', avgY(botPoly).toFixed(2));

function polyToD(poly) {
  return 'M' + poly.map(p => p[0].toFixed(4) + ',' + p[1].toFixed(4)).join(' L ') + ' Z';
}

let topD = polyToD(topPoly);
let botD = polyToD(botPoly);

// Now add holes (evenodd). Determine which holes belong to top vs bottom
const holesTop = [];
const holesBot = [];
for (let i = 1; i < subPaths.length; i++) {
  if (i === 7) continue; // subpath 8 is reserved as straw/cherry (index 7)
  const flat = flattenPath(subPaths[i], 8);
  const avg = flat.reduce((s,p) => s+p[1], 0) / flat.length;
  if (avg < best.y) holesTop.push(subPaths[i]);
  else holesBot.push(subPaths[i]);
}
console.log('\nTop holes:', holesTop.length, '  Bottom holes:', holesBot.length);
holesTop.forEach((h,i) => { const f=flattenPath(h,4); const ys=f.map(p=>p[1]); console.log(`  top hole: Y avg=${(ys.reduce((s,v)=>s+v,0)/ys.length).toFixed(1)}`); topD += ' ' + h; });
holesBot.forEach((h,i) => { const f=flattenPath(h,4); const ys=f.map(p=>p[1]); console.log(`  bot hole: Y avg=${(ys.reduce((s,v)=>s+v,0)/ys.length).toFixed(1)}`); botD += ' ' + h; });

// Straw (subpath 8) — use original bezier path directly, no simplification needed
const strawD = subPaths[7];

// ============= Convert to percent coordinates (robust) =============
function convertToPercent(d) {
  // Tokenize: split into commands and numbers
  const result = [];
  const tokens = d.match(/[MLCQSTAHVZmlcqstahvz]|-?\d*\.?\d+/gi) || [];
  let i = 0;
  while (i < tokens.length) {
    if (/[MLCQSTAHVZmlcqstahvz]/.test(tokens[i])) {
      result.push(tokens[i++] + ' ');
    } else {
      // read number
      const x = parseFloat(tokens[i++]);
      // if prev command was H or V (relative? treat them same for percent conversion based on absolute position, since these are absolute anyway)
      const lastCmd = (result.filter(t => /[A-Za-z]/.test(t.trim())).pop() || '').trim().toUpperCase();
      let num1Pct;
      if (lastCmd === 'V') {
        num1Pct = ((x / vbH) * 100).toFixed(4) + '%';
        result.push(num1Pct + ' ');
      } else if (lastCmd === 'H') {
        num1Pct = ((x / vbW) * 100).toFixed(4) + '%';
        result.push(num1Pct + ' ');
      } else {
        // X coord, expect next number as Y
        num1Pct = ((x / vbW) * 100).toFixed(4) + '%';
        const y = parseFloat(tokens[i++]);
        const yPct = ((y / vbH) * 100).toFixed(4) + '%';
        result.push(num1Pct + ',' + yPct + ' ');
      }
    }
  }
  return result.join('').trim();
}

const topPct = 'path("' + convertToPercent(topD) + '")';
const botPct = 'path("' + convertToPercent(botD) + '")';
const strawPct = 'path("' + convertToPercent(strawD) + '")';

console.log('\n========= FINAL OUTPUT =========');
const templateSnippet = `  {
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
        shapePath: '${botPct}',
      },
    ],
  },`;
console.log(templateSnippet);
fs.writeFileSync(path.join(__dirname, 'icecream_output.txt'), templateSnippet + '\n\n---\nTOP raw:\n' + topD + '\n\nBOT raw:\n' + botD + '\n\nSTRAW raw:\n' + strawD);
console.log('\nSaved to icecream_output.txt');
