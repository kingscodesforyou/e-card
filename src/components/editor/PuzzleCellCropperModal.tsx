import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Undo2, Redo2, RotateCcw } from 'lucide-react';
import type { CropParams, PuzzleCell } from '../../types';
import { parseClipPath, convertPercentToUnit } from '../../lib/clipPathUtils';

interface PuzzleCellCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  cell: PuzzleCell;
  onConfirm: (cropParams: CropParams, cropHistory: CropParams[], historyIndex: number) => void;
}

type DragType = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

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

function generateCroppedImage(image: HTMLImageElement, cropParams: CropParams): string {
  const canvas = document.createElement('canvas');
  canvas.width = cropParams.width;
  canvas.height = cropParams.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return image.src;
  ctx.drawImage(
    image,
    cropParams.x,
    cropParams.y,
    cropParams.width,
    cropParams.height,
    0,
    0,
    cropParams.width,
    cropParams.height
  );
  return canvas.toDataURL('image/png');
}

function renderShapePath(shapePath: string | undefined, shapeType: string | undefined): string {
  if (shapePath) {
    return shapePath;
  }
  
  switch (shapeType) {
    case 'circle':
      return 'circle(50%)';
    case 'ellipse':
      return 'ellipse(50% 50%)';
    case 'triangle':
      return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'heart':
      return 'polygon(50% 100%, 0% 35%, 25% 15%, 50% 40%, 75% 15%, 100% 35%)';
    case 'hexagon':
      return 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
    default:
      return '';
  }
}

function getShapeSvgPath(shapePath: string | undefined, shapeType: string | undefined): string {
  const info = parseClipPath(shapePath, shapeType);
  if (info.useSvgClipPath && info.svgPathData) {
    return convertPercentToUnit(info.svgPathData);
  }
  return '';
}

export default function PuzzleCellCropperModal({ isOpen, onClose, cell, onConfirm }: PuzzleCellCropperModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [cropArea, setCropArea] = useState<CropParams>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<DragType | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropParams | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  const cropHistory = useMemo(() => cell.cropHistory || [], [cell.cropHistory]);
  const historyIndex = useMemo(() => cell.historyIndex ?? -1, [cell.historyIndex]);

  const aspectRatio = useMemo(() => {
    if (!cell.width || !cell.height) return null;
    return cell.width / cell.height;
  }, [cell.width, cell.height]);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < cropHistory.length - 1;

  useEffect(() => {
    if (!isOpen) {
      setImage(null);
      setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      setPreviewUrl('');
      return;
    }

    if (!cell.originalImageUrl) {
      onClose();
      return;
    }

    getCachedImage(cell.originalImageUrl).then(setImage).catch(() => {
      onClose();
    });

    return () => {
      setImage(null);
    };
  }, [isOpen, cell.originalImageUrl, onClose]);

  useEffect(() => {
    if (!image || !containerRef.current) return;

    const container = containerRef.current;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });

      const imgRatio = image.width / image.height;
      const containerRatio = rect.width / rect.height;

      let newScale: number;
      if (imgRatio > containerRatio) {
        newScale = rect.width / image.width;
      } else {
        newScale = rect.height / image.height;
      }
      setScale(newScale);

      let cropWidth: number, cropHeight: number;

      if (aspectRatio) {
        const maxWidth = image.width;
        const maxHeight = image.height;
        const testHeight = maxWidth / aspectRatio;
        if (testHeight <= maxHeight) {
          cropWidth = maxWidth;
          cropHeight = testHeight;
        } else {
          cropHeight = maxHeight;
          cropWidth = maxHeight * aspectRatio;
        }
      } else {
        cropWidth = Math.min(image.width, rect.width / newScale) * 0.8;
        cropHeight = Math.min(image.height, rect.height / newScale) * 0.8;
      }

      const savedParams = cropHistory[historyIndex];
      if (savedParams) {
        setCropArea(savedParams);
      } else {
        setCropArea({
          x: (image.width - cropWidth) / 2,
          y: (image.height - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight,
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [image, isOpen, aspectRatio, cropHistory, historyIndex]);

  useEffect(() => {
    if (!image) return;
    const croppedUrl = generateCroppedImage(image, cropArea);
    setPreviewUrl(croppedUrl);
  }, [image, cropArea]);

  // ============================================================
  // 坐标转换：基于 imageWrapperRef（图片包裹层），消除居中偏移
  // ============================================================
  const getMousePosition = useCallback((clientX: number, clientY: number) => {
    if (!imageWrapperRef.current) return { x: 0, y: 0 };
    const rect = imageWrapperRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  }, [scale]);

  // ============================================================
  // 拖拽类型探测（用于裁剪区域内部点击）
  // ============================================================
  const detectDragType = useCallback((clientX: number, clientY: number): DragType | null => {
    const pos = getMousePosition(clientX, clientY);
    const { x, y, width, height } = cropArea;
    const threshold = 10 / scale;

    const inXRange = pos.x >= x - threshold && pos.x <= x + width + threshold;
    const inYRange = pos.y >= y - threshold && pos.y <= y + height + threshold;

    if (!inXRange || !inYRange) return null;

    const nearLeft = Math.abs(pos.x - x) <= threshold;
    const nearRight = Math.abs(pos.x - (x + width)) <= threshold;
    const nearTop = Math.abs(pos.y - y) <= threshold;
    const nearBottom = Math.abs(pos.y - (y + height)) <= threshold;

    if (nearTop && nearLeft) return 'nw';
    if (nearTop && nearRight) return 'ne';
    if (nearBottom && nearLeft) return 'sw';
    if (nearBottom && nearRight) return 'se';
    if (nearTop) return 'n';
    if (nearBottom) return 's';
    if (nearLeft) return 'w';
    if (nearRight) return 'e';
    return 'move';
  }, [cropArea, getMousePosition, scale]);

  // ============================================================
  // 鼠标按下：裁剪区域内部（通过位置探测判断拖拽类型）
  // ============================================================
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const type = detectDragType(e.clientX, e.clientY);
    if (!type) return;

    setIsDragging(true);
    setDragType(type);
    setDragStart(getMousePosition(e.clientX, e.clientY));
    setCropStart({ ...cropArea });
  }, [cropArea, detectDragType, getMousePosition]);

  // ============================================================
  // 鼠标按下：手柄（直接指定拖拽类型，不依赖位置探测）
  // ============================================================
  const handleHandleMouseDown = useCallback((e: React.MouseEvent, type: DragType) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart(getMousePosition(e.clientX, e.clientY));
    setCropStart({ ...cropArea });
  }, [cropArea, getMousePosition]);

  // ============================================================
  // 拖拽状态 ref（供全局事件监听器读取最新值，避免闭包过期）
  // ============================================================
  const dragStateRef = useRef({
    dragType: null as DragType | null,
    cropStart: null as CropParams | null,
    dragStart: { x: 0, y: 0 },
    image: null as HTMLImageElement | null,
    aspectRatio: null as number | null,
    scale: 1,
  });

  useEffect(() => {
    dragStateRef.current = { dragType, cropStart, dragStart, image, aspectRatio, scale };
  }, [dragType, cropStart, dragStart, image, aspectRatio, scale]);

  // ============================================================
  // 全局鼠标移动 / 鼠标松开（拖拽时挂载到 window，确保拖出容器仍生效）
  // ============================================================
  useEffect(() => {
    if (!isDragging) return;

    const computeNewCrop = (
      type: DragType,
      start: CropParams,
      startPos: { x: number; y: number },
      currentPos: { x: number; y: number },
      imgW: number,
      imgH: number,
      aspect: number | null
    ): CropParams => {
      const dx = currentPos.x - startPos.x;
      const dy = currentPos.y - startPos.y;
      let nc: CropParams = { ...start };

      switch (type) {
        case 'move':
          nc.x = Math.max(0, Math.min(imgW - start.width, start.x + dx));
          nc.y = Math.max(0, Math.min(imgH - start.height, start.y + dy));
          break;

        case 'n': {
          const newY = Math.max(0, start.y + dy);
          let newH = Math.max(20, start.height - (newY - start.y));
          if (aspect) {
            const newW = newH * aspect;
            nc.x = Math.max(0, Math.min(imgW - newW, start.x + (start.width - newW) / 2));
            nc.width = Math.min(newW, imgW - nc.x);
            nc.height = nc.width / aspect;
            nc.y = start.y + start.height - nc.height;
          } else {
            nc.y = newY;
            nc.height = newH;
          }
          break;
        }

        case 's': {
          let newH = Math.max(20, Math.min(imgH - start.y, start.height + dy));
          if (aspect) {
            const newW = newH * aspect;
            nc.x = Math.max(0, Math.min(imgW - newW, start.x + (start.width - newW) / 2));
            nc.width = Math.min(newW, imgW - nc.x);
            nc.height = nc.width / aspect;
          } else {
            nc.height = newH;
          }
          break;
        }

        case 'w': {
          const newX = Math.max(0, start.x + dx);
          let newW = Math.max(20, start.width - (newX - start.x));
          if (aspect) {
            const newHv = newW / aspect;
            nc.y = Math.max(0, Math.min(imgH - newHv, start.y + (start.height - newHv) / 2));
            nc.height = Math.min(newHv, imgH - nc.y);
            nc.width = nc.height * aspect;
            nc.x = start.x + start.width - nc.width;
          } else {
            nc.x = newX;
            nc.width = newW;
          }
          break;
        }

        case 'e': {
          let newW = Math.max(20, Math.min(imgW - start.x, start.width + dx));
          if (aspect) {
            const newHv = newW / aspect;
            nc.y = Math.max(0, Math.min(imgH - newHv, start.y + (start.height - newHv) / 2));
            nc.height = Math.min(newHv, imgH - nc.y);
            nc.width = nc.height * aspect;
          } else {
            nc.width = newW;
          }
          break;
        }

        case 'nw': {
          const newX = Math.max(0, start.x + dx);
          const newY = Math.max(0, start.y + dy);
          let newW = Math.max(20, start.width - (newX - start.x));
          let newH = Math.max(20, start.height - (newY - start.y));
          if (aspect) {
            // 取较小的缩放比例，确保不超出边界
            const ratioW = newW / start.width;
            const ratioH = newH / start.height;
            const ratio = Math.min(ratioW, ratioH);
            newW = start.width * ratio;
            newH = start.height * ratio;
            if (aspect) {
              if (newW / newH > aspect) {
                newW = newH * aspect;
              } else {
                newH = newW / aspect;
              }
            }
          }
          nc.x = start.x + start.width - newW;
          nc.y = start.y + start.height - newH;
          nc.width = newW;
          nc.height = newH;
          break;
        }

        case 'ne': {
          const newY = Math.max(0, start.y + dy);
          let newW = Math.max(20, Math.min(imgW - start.x, start.width + dx));
          let newH = Math.max(20, start.height - (newY - start.y));
          if (aspect) {
            const ratioW = newW / start.width;
            const ratioH = newH / start.height;
            const ratio = Math.min(ratioW, ratioH);
            newW = start.width * ratio;
            newH = start.height * ratio;
            if (aspect) {
              if (newW / newH > aspect) {
                newW = newH * aspect;
              } else {
                newH = newW / aspect;
              }
            }
          }
          nc.y = start.y + start.height - newH;
          nc.width = newW;
          nc.height = newH;
          break;
        }

        case 'sw': {
          const newX = Math.max(0, start.x + dx);
          let newW = Math.max(20, start.width - (newX - start.x));
          let newH = Math.max(20, Math.min(imgH - start.y, start.height + dy));
          if (aspect) {
            const ratioW = newW / start.width;
            const ratioH = newH / start.height;
            const ratio = Math.min(ratioW, ratioH);
            newW = start.width * ratio;
            newH = start.height * ratio;
            if (aspect) {
              if (newW / newH > aspect) {
                newW = newH * aspect;
              } else {
                newH = newW / aspect;
              }
            }
          }
          nc.x = start.x + start.width - newW;
          nc.width = newW;
          nc.height = newH;
          break;
        }

        case 'se': {
          let newW = Math.max(20, Math.min(imgW - start.x, start.width + dx));
          let newH = Math.max(20, Math.min(imgH - start.y, start.height + dy));
          if (aspect) {
            const ratioW = newW / start.width;
            const ratioH = newH / start.height;
            const ratio = Math.min(ratioW, ratioH);
            newW = start.width * ratio;
            newH = start.height * ratio;
            if (aspect) {
              if (newW / newH > aspect) {
                newW = newH * aspect;
              } else {
                newH = newW / aspect;
              }
            }
          }
          nc.width = newW;
          nc.height = newH;
          break;
        }
      }

      // 全局边界约束
      nc.x = Math.max(0, Math.min(imgW - nc.width, nc.x));
      nc.y = Math.max(0, Math.min(imgH - nc.height, nc.y));
      nc.width = Math.max(20, Math.min(imgW - nc.x, nc.width));
      nc.height = Math.max(20, Math.min(imgH - nc.y, nc.height));

      return nc;
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds.dragType || !ds.cropStart || !ds.image) return;

      const rect = imageWrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentPos = {
        x: (e.clientX - rect.left) / ds.scale,
        y: (e.clientY - rect.top) / ds.scale,
      };

      const newCrop = computeNewCrop(
        ds.dragType,
        ds.cropStart,
        ds.dragStart,
        currentPos,
        ds.image.width,
        ds.image.height,
        ds.aspectRatio
      );

      setCropArea(newCrop);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setCropStart(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const handleUndo = useCallback(() => {
    if (!canUndo || historyIndex < 0) return;
    const newIndex = historyIndex - 1;
    if (newIndex >= 0) {
      setCropArea(cropHistory[newIndex]);
    } else {
      const cropWidth = aspectRatio
        ? Math.min(image!.width, image!.height * aspectRatio)
        : image!.width * 0.8;
      const cropHeight = aspectRatio
        ? cropWidth / aspectRatio
        : image!.height * 0.8;
      setCropArea({
        x: (image!.width - cropWidth) / 2,
        y: (image!.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      });
    }
    onConfirm(cropArea, cropHistory, newIndex);
  }, [canUndo, historyIndex, cropHistory, aspectRatio, image, cropArea, onConfirm]);

  const handleRedo = useCallback(() => {
    if (!canRedo || historyIndex >= cropHistory.length - 1) return;
    const newIndex = historyIndex + 1;
    setCropArea(cropHistory[newIndex]);
    onConfirm(cropArea, cropHistory, newIndex);
  }, [canRedo, historyIndex, cropHistory, cropArea, onConfirm]);

  const handleReset = useCallback(() => {
    if (!image) return;
    const cropWidth = aspectRatio
      ? Math.min(image.width, image.height * aspectRatio)
      : image.width * 0.8;
    const cropHeight = aspectRatio
      ? cropWidth / aspectRatio
      : image.height * 0.8;
    const defaultParams: CropParams = {
      x: (image.width - cropWidth) / 2,
      y: (image.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    };
    setCropArea(defaultParams);
    onConfirm(defaultParams, [], -1);
  }, [image, aspectRatio, onConfirm]);

  const handleConfirm = useCallback(() => {
    if (!image) return;
    const newHistory = cropHistory.slice(0, historyIndex + 1);
    newHistory.push({ ...cropArea });
    onConfirm(cropArea, newHistory, newHistory.length - 1);
    onClose();
  }, [image, cropArea, cropHistory, historyIndex, onConfirm, onClose]);

  if (!isOpen || !image) return null;

  const imageStyle = {
    width: image.width * scale,
    height: image.height * scale,
  };

  const cropStyle = {
    left: cropArea.x * scale,
    top: cropArea.y * scale,
    width: cropArea.width * scale,
    height: cropArea.height * scale,
  };

  const shapePathValue = renderShapePath(cell.shapePath, cell.shapeType);

  // 手柄通用样式
  const handleBaseClass = 'absolute w-3 h-3 bg-white rounded-full border-2 border-gray-400 shadow-sm';

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[860px] max-w-[95vw] max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">子图裁剪</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-2.5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置
            </button>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                canUndo
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              撤销
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                canRedo
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
              重做
            </button>
          </div>
          <span className="text-xs text-gray-400">
            {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
            {aspectRatio && <span className="ml-2">| {cell.width}:{cell.height}</span>}
          </span>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="relative bg-gray-900 flex-1 min-h-[200px]">
            <div
              ref={containerRef}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onMouseDown={handleMouseDown}
            >
              {/* 图片包裹层 —— getMousePosition 基于此元素计算坐标，消除居中偏移 */}
              <div
                ref={imageWrapperRef}
                className="relative"
                style={{
                  width: image.width * scale,
                  height: image.height * scale,
                }}
              >
                <img
                  src={image.src}
                  alt="crop"
                  style={imageStyle}
                  className="pointer-events-none"
                  draggable={false}
                />

                {/* 四向遮罩 */}
                <div className="absolute top-0 left-0 right-0 bg-black/50 pointer-events-none" style={{ height: cropArea.y * scale }} />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 pointer-events-none" style={{ height: (image.height - cropArea.y - cropArea.height) * scale }} />
                <div className="absolute top-0 bottom-0 left-0 bg-black/50 pointer-events-none" style={{ width: cropArea.x * scale }} />
                <div className="absolute top-0 bottom-0 right-0 bg-black/50 pointer-events-none" style={{ width: (image.width - cropArea.x - cropArea.width) * scale }} />

                {/* 裁剪区域 */}
                <div
                  className="absolute bg-transparent border-2 border-white pointer-events-auto cursor-move"
                  style={cropStyle}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e);
                  }}
                >
                  {/* 形状轮廓指引 */}
                  {shapePathValue && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {shapePathValue.startsWith('circle(') ? (
                        <circle
                          cx="50%"
                          cy="50%"
                          r="50%"
                          fill="none"
                          stroke="#00ffff"
                          strokeWidth="2"
                          strokeOpacity="0.7"
                          className="drop-shadow-lg"
                        />
                      ) : shapePathValue.startsWith('ellipse(') ? (
                        <ellipse
                          cx="50%"
                          cy="50%"
                          rx="50%"
                          ry="50%"
                          fill="none"
                          stroke="#00ffff"
                          strokeWidth="2"
                          strokeOpacity="0.7"
                          className="drop-shadow-lg"
                        />
                      ) : shapePathValue.startsWith('polygon(') ? (
                        <polygon
                          points={shapePathValue.replace('polygon(', '').replace(')', '')}
                          fill="none"
                          stroke="#00ffff"
                          strokeWidth="2"
                          strokeOpacity="0.7"
                          className="drop-shadow-lg"
                        />
                      ) : (
                        <path
                          d={getShapeSvgPath(cell.shapePath, cell.shapeType) || shapePathValue.replace(/^path\(["']/, '').replace(/["']\)$/, '')}
                          fill="none"
                          stroke="#00ffff"
                          strokeWidth="2"
                          strokeOpacity="0.7"
                          className="drop-shadow-lg"
                        />
                      )}
                    </svg>
                  )}

                  {/* 四角手柄 —— 每个手柄绑定明确的 onMouseDown 拖拽类型 */}
                  <div
                    className={`${handleBaseClass} cursor-nw-resize`}
                    style={{ top: '-6px', left: '-6px' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, 'nw')}
                  />
                  <div
                    className={`${handleBaseClass} cursor-ne-resize`}
                    style={{ top: '-6px', right: '-6px' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, 'ne')}
                  />
                  <div
                    className={`${handleBaseClass} cursor-sw-resize`}
                    style={{ bottom: '-6px', left: '-6px' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, 'sw')}
                  />
                  <div
                    className={`${handleBaseClass} cursor-se-resize`}
                    style={{ bottom: '-6px', right: '-6px' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, 'se')}
                  />

                  {/* 四边中点手柄 */}
                  <div
                    className={`${handleBaseClass} cursor-n-resize`}
                    style={{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, 'n')}
                  />
                  <div
                    className={`${handleBaseClass} cursor-s-resize`}
                    style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, 's')}
                  />
                  <div
                    className={`${handleBaseClass} cursor-w-resize`}
                    style={{ left: '-6px', top: '50%', transform: 'translateY(-50%)' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, 'w')}
                  />
                  <div
                    className={`${handleBaseClass} cursor-e-resize`}
                    style={{ right: '-6px', top: '50%', transform: 'translateY(-50%)' }}
                    onMouseDown={(e) => handleHandleMouseDown(e, 'e')}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-48 bg-gray-50 border-l border-gray-100 flex flex-col min-h-0">
            <div className="px-3 py-2 border-b border-gray-100 shrink-0">
              <span className="text-xs text-gray-500">裁剪预览</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-3 min-h-0 overflow-hidden">
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="max-w-full max-h-[160px] object-contain rounded-lg shadow-md"
                    style={{
                      clipPath: shapePathValue || undefined,
                    }}
                  />
                  {shapePathValue && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ clipPath: shapePathValue }}>
                      <path
                        d={shapePathValue.replace(/%/g, (_, i) => '%')}
                        fill="none"
                        stroke="#00ffff"
                        strokeWidth="1"
                        strokeOpacity="0.7"
                      />
                    </svg>
                  )}
                </div>
              )}
            </div>
            <div className="px-3 py-2 border-t border-gray-100 shrink-0">
              <div className="text-xs text-gray-400 space-y-0.5">
                <div>原图: {image.width} × {image.height}</div>
                <div>裁剪: {Math.round(cropArea.x)}, {Math.round(cropArea.y)}</div>
                <div>尺寸: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}</div>
              </div>
            </div>
          </div>
        </div>

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
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
