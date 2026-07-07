import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';
import type { PuzzleCell, ImageTransform } from '../../types';
import { parseClipPath, convertPercentToUnit } from '../../lib/clipPathUtils';

interface PuzzleCellCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  cell: PuzzleCell;
  onConfirm: (
    croppedImageUrl: string,
    transform: ImageTransform,
    transformHistory: ImageTransform[],
    historyIndex: number
  ) => void;
}

// ============================================================
// 图片缓存 —— 避免重复加载同一张原图
// ============================================================
const imageCache = new Map<string, HTMLImageElement>();

function getCachedImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const cached = imageCache.get(url);
    if (cached) {
      resolve(cached);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ============================================================
// 计算默认变换 —— 让图片居中覆盖整个画布
// ============================================================
function computeDefaultTransform(
  imgW: number,
  imgH: number,
  canvasW: number,
  canvasH: number
): ImageTransform {
  const scale = Math.max(canvasW / imgW, canvasH / imgH);
  const x = (canvasW - imgW * scale) / 2;
  const y = (canvasH - imgH * scale) / 2;
  return { x, y, scale };
}

// ============================================================
// 核心绘制函数 —— 在给定 ctx 上按形状裁剪绘制图片
//
// 关键技巧：单位坐标 (0–1) 的 SVG path 无法直接用于像素级裁剪，
// 这里通过 ctx.scale(canvasW, canvasH) 将上下文缩放到单位空间，
// 再 ctx.clip(unitPath) 完成裁剪，最后用 ctx.setTransform 恢复
// 到 DPR 缩放状态（clip 不受 setTransform 影响，仍然保留）。
// ============================================================
function drawShapedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  transform: ImageTransform,
  canvasW: number,
  canvasH: number,
  dpr: number,
  unitPath: Path2D | null,
  drawOverlay: boolean
) {
  // ---- 重置变换矩阵并清空画布 ----
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // ---- 设置 DPR 缩放，后续坐标全部使用 CSS 像素 ----
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // ---- 1. 绘制半透明遮罩 ----
  if (drawOverlay) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // ---- 2. 在形状裁剪区域内绘制变换后的原图 ----
  ctx.save();
  if (unitPath) {
    // 缩放到单位坐标空间 → clip → 恢复到 DPR 空间（clip 保留）
    ctx.scale(canvasW, canvasH);
    ctx.clip(unitPath);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  } else {
    // 无形状时裁剪到整个画布
    ctx.beginPath();
    ctx.rect(0, 0, canvasW, canvasH);
    ctx.clip();
  }
  // 应用图片位移和缩放
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.scale, transform.scale);
  ctx.drawImage(image, 0, 0);
  ctx.restore();

  // ---- 3. 绘制形状白色边框（仅在预览模式下绘制） ----
  if (drawOverlay) {
    ctx.save();
    if (unitPath) {
      ctx.scale(canvasW, canvasH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / (dpr * Math.max(canvasW, canvasH));
      ctx.stroke(unitPath);
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(0.5, 0.5, canvasW - 1, canvasH - 1);
    }
    ctx.restore();
  }
}

const MAX_SCALE = 10;
const MIN_SCALE = 0.1;
const CANVAS_MAX_DIM = 480; // 弹窗中画布的最大边长（CSS 像素）

export default function PuzzleCellCropperModal({
  isOpen,
  onClose,
  cell,
  onConfirm,
}: PuzzleCellCropperModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<ImageTransform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 拖拽状态 ref —— 供全局事件监听器读取最新值，避免闭包过期
  const dragStateRef = useRef({
    isDragging: false,
    startMouseX: 0,
    startMouseY: 0,
    startTransformX: 0,
    startTransformY: 0,
  });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // ============================================================
  // 画布尺寸 —— 根据子图宽高比计算，保持与子图一致的纵横比
  // ============================================================
  const { canvasWidth, canvasHeight } = useMemo(() => {
    const aspect = cell.width && cell.height ? cell.width / cell.height : 1;
    let w: number, h: number;
    if (aspect >= 1) {
      w = CANVAS_MAX_DIM;
      h = Math.round(CANVAS_MAX_DIM / aspect);
    } else {
      h = CANVAS_MAX_DIM;
      w = Math.round(CANVAS_MAX_DIM * aspect);
    }
    return { canvasWidth: w, canvasHeight: h };
  }, [cell.width, cell.height]);

  // ============================================================
  // 形状路径信息 —— parseClipPath 返回单位坐标 (0–1) 的 SVG path
  // ============================================================
  const shapeInfo = useMemo(
    () => parseClipPath(cell.shapePath, cell.shapeType),
    [cell.shapePath, cell.shapeType]
  );

  const hasShape = shapeInfo.useSvgClipPath && !!shapeInfo.svgPathData;

  // 创建单位坐标 Path2D
  // 注意：path() 格式的心形路径带有百分号（如 M50% 27.5%），需要先调用
  // convertPercentToUnit 将 50% → 0.5，否则 Path2D 会因 % 而静默失败
  const unitPath = useMemo(() => {
    if (!hasShape || !shapeInfo.svgPathData) return null;
    try {
      const unitPathData = convertPercentToUnit(shapeInfo.svgPathData);
      return new Path2D(unitPathData);
    } catch {
      return null;
    }
  }, [hasShape, shapeInfo.svgPathData]);

  // ============================================================
  // 变换历史
  // ============================================================
  const transformHistory = useMemo(
    () => cell.transformHistory || [],
    [cell.transformHistory]
  );
  const historyIndex = useMemo(
    () => cell.transformHistoryIndex ?? -1,
    [cell.transformHistoryIndex]
  );

  // ============================================================
  // 加载原图
  // ============================================================
  useEffect(() => {
    if (!isOpen) {
      setImage(null);
      return;
    }
    if (!cell.originalImageUrl) {
      onClose();
      return;
    }
    let cancelled = false;
    getCachedImage(cell.originalImageUrl)
      .then((img) => {
        if (!cancelled) setImage(img);
      })
      .catch(() => {
        if (!cancelled) onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, cell.originalImageUrl, onClose]);

  // ============================================================
  // 初始化变换参数
  // ============================================================
  useEffect(() => {
    if (!image) return;

    const savedTransform = transformHistory[historyIndex];
    if (savedTransform) {
      setTransform(savedTransform);
    } else if (cell.transform) {
      setTransform(cell.transform);
    } else {
      setTransform(
        computeDefaultTransform(image.width, image.height, canvasWidth, canvasHeight)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, canvasWidth, canvasHeight]);

  // ============================================================
  // Canvas 尺寸初始化 —— 仅在尺寸/DPR 变化时执行（不频繁重置）
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
  }, [image, canvasWidth, canvasHeight, dpr]);

  // ============================================================
  // 重绘 effect —— 任何绘制相关状态变化时立即重绘
  // 注意：这里不重设 canvas.width/height，避免清空画布
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawShapedImage(
      ctx,
      image,
      transform,
      canvasWidth,
      canvasHeight,
      dpr,
      unitPath,
      true // drawOverlay = true，绘制遮罩和边框
    );
  }, [image, transform, canvasWidth, canvasHeight, dpr, unitPath]);

  // ============================================================
  // 拖拽：鼠标按下
  // ============================================================
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dragStateRef.current = {
        isDragging: true,
        startMouseX: e.clientX - rect.left,
        startMouseY: e.clientY - rect.top,
        startTransformX: transform.x,
        startTransformY: transform.y,
      };
      setIsDragging(true);
    },
    [transform]
  );

  // ============================================================
  // 全局鼠标移动 / 松开 —— 确保拖出画布仍生效
  // ============================================================
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const ds = dragStateRef.current;
      setTransform((prev) => ({
        ...prev,
        x: ds.startTransformX + (mouseX - ds.startMouseX),
        y: ds.startTransformY + (mouseY - ds.startMouseY),
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStateRef.current.isDragging = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ============================================================
  // 触摸拖拽（移动端单指拖动）
  // ============================================================
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
      const ds = dragStateRef.current;
      setTransform((prev) => ({
        ...prev,
        x: ds.startTransformX + (mouseX - ds.startMouseX),
        y: ds.startTransformY + (mouseY - ds.startMouseY),
      }));
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      dragStateRef.current.isDragging = false;
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      dragStateRef.current = {
        isDragging: true,
        startMouseX: touch.clientX - rect.left,
        startMouseY: touch.clientY - rect.top,
        startTransformX: transform.x,
        startTransformY: transform.y,
      };
      setIsDragging(true);
    },
    [transform]
  );

  // ============================================================
  // 滚轮缩放（以鼠标位置为中心）—— 使用原生事件以支持 preventDefault
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setTransform((prev) => {
        const zoomRatio = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * zoomRatio));
        if (newScale === prev.scale) return prev;
        const ratio = newScale / prev.scale;
        return {
          x: mouseX - (mouseX - prev.x) * ratio,
          y: mouseY - (mouseY - prev.y) * ratio,
          scale: newScale,
        };
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [image]);

  // ============================================================
  // 按钮缩放（以画布中心为基准）
  // ============================================================
  const zoomByButton = useCallback(
    (factor: number) => {
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      setTransform((prev) => {
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
        if (newScale === prev.scale) return prev;
        const ratio = newScale / prev.scale;
        return {
          x: cx - (cx - prev.x) * ratio,
          y: cy - (cy - prev.y) * ratio,
          scale: newScale,
        };
      });
    },
    [canvasWidth, canvasHeight]
  );

  const handleZoomIn = useCallback(() => zoomByButton(1.2), [zoomByButton]);
  const handleZoomOut = useCallback(() => zoomByButton(1 / 1.2), [zoomByButton]);

  // ============================================================
  // 重置变换
  // ============================================================
  const handleReset = useCallback(() => {
    if (!image) return;
    setTransform(
      computeDefaultTransform(image.width, image.height, canvasWidth, canvasHeight)
    );
  }, [image, canvasWidth, canvasHeight]);

  // ============================================================
  // 确认裁剪 —— 导出透明背景 PNG
  // ============================================================
  const handleConfirm = useCallback(() => {
    if (!image) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = Math.round(canvasWidth * dpr);
    exportCanvas.height = Math.round(canvasHeight * dpr);
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    // 导出时不绘制遮罩和边框
    drawShapedImage(
      exportCtx,
      image,
      transform,
      canvasWidth,
      canvasHeight,
      dpr,
      unitPath,
      false // drawOverlay = false
    );

    const resultUrl = exportCanvas.toDataURL('image/png');

    const newHistory = transformHistory.slice(0, historyIndex + 1);
    newHistory.push({ ...transform });
    onConfirm(resultUrl, transform, newHistory, newHistory.length - 1);
    onClose();
  }, [
    image,
    transform,
    canvasWidth,
    canvasHeight,
    dpr,
    unitPath,
    transformHistory,
    historyIndex,
    onConfirm,
    onClose,
  ]);

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[640px] max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        {/* ===== 标题栏 ===== */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">裁剪图片</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===== 画布区域 ===== */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-6 min-h-0 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="cursor-move rounded-lg shadow-lg touch-none select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
        </div>

        {/* ===== 工具栏 ===== */}
        <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500 min-w-[3rem] text-center tabular-nums">
              {Math.round(transform.scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="放大"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors ml-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Move className="w-3.5 h-3.5" />
            <span>拖拽移动 · 滚轮缩放</span>
          </div>
        </div>

        {/* ===== 底部按钮 ===== */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
