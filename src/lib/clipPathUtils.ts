export interface ClipPathInfo {
  useSvgClipPath: boolean;
  clipPathValue: string;
  svgPathData?: string;
}

export function parseClipPath(shapePath?: string, shapeType?: string): ClipPathInfo {
  console.debug('[clipPathUtils] parseClipPath called:', { shapePath, shapeType });
  
  const normalizedPath = shapePath || '';
  
  if (normalizedPath.startsWith('path(')) {
    const extractedPath = normalizedPath.replace(/^path\(["']/, '').replace(/["']\)$/, '');
    console.debug('[clipPathUtils] Detected path() format, extracted:', { extractedPath });
    return {
      useSvgClipPath: true,
      clipPathValue: '',
      svgPathData: extractedPath,
    };
  }
  
  if (normalizedPath.startsWith('circle(')) {
    const match = normalizedPath.match(/circle\(([^)]+)\)/);
    if (match) {
      const svgPath = circleToPath(match[1]);
      console.debug('[clipPathUtils] Detected circle() format:', { input: match[1], svgPath });
      return {
        useSvgClipPath: true,
        clipPathValue: '',
        svgPathData: svgPath,
      };
    }
  }
  
  if (normalizedPath.startsWith('ellipse(')) {
    const match = normalizedPath.match(/ellipse\(([^)]+)\)/);
    if (match) {
      const svgPath = ellipseToPath(match[1]);
      console.debug('[clipPathUtils] Detected ellipse() format:', { input: match[1], svgPath });
      return {
        useSvgClipPath: true,
        clipPathValue: '',
        svgPathData: svgPath,
      };
    }
  }
  
  if (normalizedPath.startsWith('polygon(')) {
    const match = normalizedPath.match(/polygon\(([^)]+)\)/);
    if (match) {
      const svgPath = polygonToPath(match[1]);
      console.debug('[clipPathUtils] Detected polygon() format:', { input: match[1], svgPath });
      return {
        useSvgClipPath: true,
        clipPathValue: '',
        svgPathData: svgPath,
      };
    }
  }
  
  if (shapeType) {
    let svgPathData: string;
    switch (shapeType) {
      case 'circle':
        svgPathData = 'M0.5,0 A0.5,0.5 0 1,1 0.5,1 A0.5,0.5 0 1,1 0.5,0 Z';
        break;
      case 'ellipse':
        svgPathData = 'M0.5,0 A0.5,0.5 0 1,1 0.5,1 A0.5,0.5 0 1,1 0.5,0 Z';
        break;
      case 'triangle':
        svgPathData = 'M0.5,0 L0,1 L1,1 Z';
        break;
      case 'heart':
        svgPathData = 'M0.5,0.825 C0.325,0.7 0.15,0.525 0.15,0.35 C0.15,0.175 0.35,0.1 0.5,0.275 C0.65,0.1 0.85,0.175 0.85,0.35 C0.85,0.525 0.675,0.7 0.5,0.825 Z';
        break;
      case 'hexagon':
        svgPathData = 'M0.5,0 L1,0.25 L1,0.75 L0.5,1 L0,0.75 L0,0.25 Z';
        break;
      default:
        svgPathData = '';
    }
    console.debug('[clipPathUtils] Detected shapeType:', { shapeType, svgPathData });
    if (svgPathData) {
      return {
        useSvgClipPath: true,
        clipPathValue: '',
        svgPathData,
      };
    }
  }
  
  console.debug('[clipPathUtils] Using direct CSS clip-path:', { clipPathValue: normalizedPath });
  return {
    useSvgClipPath: false,
    clipPathValue: normalizedPath || '',
  };
}

export function convertPercentToUnit(pathData: string): string {
  console.debug('[clipPathUtils] convertPercentToUnit input:', { pathData });
  const result = pathData.replace(/(\d+(?:\.\d+)?)%/g, (match, num) => {
    const converted = parseFloat(num) / 100;
    console.debug('[clipPathUtils] Converting percent:', { original: match, converted });
    return `${converted}`;
  });
  console.debug('[clipPathUtils] convertPercentToUnit output:', { result });
  return result;
}

function circleToPath(value: string): string {
  const parts = value.split(/\s*,\s*/);
  if (parts.length === 1) {
    const radius = parseFloat(parts[0]) / 100;
    return `M0.5,${0.5 - radius} A${radius},${radius} 0 1,1 0.5,${0.5 + radius} A${radius},${radius} 0 1,1 0.5,${0.5 - radius} Z`;
  }
  const [radius, centerX, centerY] = parts.map(p => parseFloat(p) / 100);
  return `M${centerX},${centerY - radius} A${radius},${radius} 0 1,1 ${centerX},${centerY + radius} A${radius},${radius} 0 1,1 ${centerX},${centerY - radius} Z`;
}

function ellipseToPath(value: string): string {
  const parts = value.split(/\s*,\s*/);
  if (parts.length === 2) {
    const [rx, ry] = parts.map(p => parseFloat(p) / 100);
    return `M0.5,${0.5 - ry} A${rx},${ry} 0 1,1 0.5,${0.5 + ry} A${rx},${ry} 0 1,1 0.5,${0.5 - ry} Z`;
  }
  const [rx, ry, cx, cy] = parts.map(p => parseFloat(p) / 100);
  return `M${cx},${cy - ry} A${rx},${ry} 0 1,1 ${cx},${cy + ry} A${rx},${ry} 0 1,1 ${cx},${cy - ry} Z`;
}

function polygonToPath(points: string): string {
  const pointList = points.split(/\s*,\s*/);
  const convertedPoints = pointList.map(p => {
    const [x, y] = p.trim().split(/\s+/).map(v => parseFloat(v) / 100);
    return `${x},${y}`;
  });
  return `M${convertedPoints.join(' L')} Z`;
}

