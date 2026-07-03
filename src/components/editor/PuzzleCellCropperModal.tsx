import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Undo2, Redo2, RotateCcw } from 'lucide-react';
import type { CropParams, PuzzleCell } from '../../types';

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

function renderShapePath(shapePath: string | undefined): string {
  if (!shapePath) return '';
  if (shapePath.startsWith('circle(')) {
    const match = shapePath.match(/circle\(([^)]+)\)/);
    if (match) return `circle(${match[1]})`;
  }
  if (shapePath.startsWith('ellipse(')) {
    const match = shapePath.match(/ellipse\(([^)]+)\)/);
    if (match) return `ellipse(${match[1]})`;
  }
  if (shapePath.startsWith('polygon(')) {
    const match = shapePath.match(/polygon\(([^)]+)\)/);
    if (match) return `polygon(${match[1]})`;
  }
  return shapePath;
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
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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

  const getMousePosition = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [scale]);

  const detectDragType = useCallback((e: React.MouseEvent): DragType | null => {
    const pos = getMousePosition(e);
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const type = detectDragType(e);
    if (!type) return;

    setIsDragging(true);
    setDragType(type);
    setDragStart(getMousePosition(e));
    setCropStart({ ...cropArea });
  }, [cropArea, detectDragType, getMousePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragType || !cropStart) return;

    const currentPos = getMousePosition(e);
    const dx = currentPos.x - dragStart.x;
    const dy = currentPos.y - dragStart.y;

    let newCrop = { ...cropStart };

    switch (dragType) {
      case 'move':
        newCrop.x = Math.max(0, Math.min(image!.width - cropStart.width, cropStart.x + dx));
        newCrop.y = Math.max(0, Math.min(image!.height - cropStart.height, cropStart.y + dy));
        break;
      case 'n':
        newCrop.y = Math.max(0, cropStart.y + dy);
        newCrop.height = Math.max(20, cropStart.height - dy);
        if (aspectRatio) {
          newCrop.width = newCrop.height * aspectRatio;
        }
        break;
      case 's':
        newCrop.height = Math.max(20, Math.min(image!.height - cropStart.y, cropStart.height + dy));
        if (aspectRatio) {
          newCrop.width = newCrop.height * aspectRatio;
        }
        break;
      case 'w':
        newCrop.x = Math.max(0, cropStart.x + dx);
        newCrop.width = Math.max(20, cropStart.width - dx);
        if (aspectRatio) {
          newCrop.height = newCrop.width / aspectRatio;
        }
        break;
      case 'e':
        newCrop.width = Math.max(20, Math.min(image!.width - cropStart.x, cropStart.width + dx));
        if (aspectRatio) {
          newCrop.height = newCrop.width / aspectRatio;
        }
        break;
      case 'nw':
        newCrop.x = Math.max(0, cropStart.x + dx);
        newCrop.y = Math.max(0, cropStart.y + dy);
        newCrop.width = Math.max(20, cropStart.width - dx);
        newCrop.height = Math.max(20, cropStart.height - dy);
        if (aspectRatio) {
          if (dragType.includes('n')) {
            newCrop.width = newCrop.height * aspectRatio;
            newCrop.x = Math.min(cropStart.x + dx, image!.width - newCrop.width);
          } else {
            newCrop.height = newCrop.width / aspectRatio;
            newCrop.y = Math.min(cropStart.y + dy, image!.height - newCrop.height);
          }
        }
        break;
      case 'ne':
        newCrop.y = Math.max(0, cropStart.y + dy);
        newCrop.width = Math.max(20, Math.min(image!.width - cropStart.x, cropStart.width + dx));
        newCrop.height = Math.max(20, cropStart.height - dy);
        if (aspectRatio) {
          if (dragType.includes('n')) {
            newCrop.width = newCrop.height * aspectRatio;
          } else {
            newCrop.height = newCrop.width / aspectRatio;
            newCrop.y = Math.min(cropStart.y + dy, image!.height - newCrop.height);
          }
        }
        break;
      case 'sw':
        newCrop.x = Math.max(0, cropStart.x + dx);
        newCrop.width = Math.max(20, cropStart.width - dx);
        newCrop.height = Math.max(20, Math.min(image!.height - cropStart.y, cropStart.height + dy));
        if (aspectRatio) {
          if (dragType.includes('s')) {
            newCrop.width = newCrop.height * aspectRatio;
            newCrop.x = Math.min(cropStart.x + dx, image!.width - newCrop.width);
          } else {
            newCrop.height = newCrop.width / aspectRatio;
          }
        }
        break;
      case 'se':
        newCrop.width = Math.max(20, Math.min(image!.width - cropStart.x, cropStart.width + dx));
        newCrop.height = Math.max(20, Math.min(image!.height - cropStart.y, cropStart.height + dy));
        if (aspectRatio) {
          if (dragType.includes('s')) {
            newCrop.width = newCrop.height * aspectRatio;
          } else {
            newCrop.height = newCrop.width / aspectRatio;
          }
        }
        break;
    }

    newCrop.x = Math.max(0, Math.min(image!.width - newCrop.width, newCrop.x));
    newCrop.y = Math.max(0, Math.min(image!.height - newCrop.height, newCrop.y));

    setCropArea(newCrop);
  }, [isDragging, dragType, cropStart, dragStart, image, aspectRatio, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setCropStart(null);
  }, []);

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

  const shapePathValue = renderShapePath(cell.shapePath);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[900px] max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">子图裁剪</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
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

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="relative bg-gray-900 flex-1 overflow-auto min-h-0">
            <div
              ref={containerRef}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="relative"
                style={{
                  width: image.width * scale,
                  height: image.height * scale,
                }}
              >
                <img
                  src={image.src}
                  alt="crop"
                  style={{
                    width: image.width * scale,
                    height: image.height * scale,
                  }}
                  className="pointer-events-none"
                />

                <div className="absolute top-0 left-0 right-0 bg-black/50 pointer-events-none" style={{ height: cropArea.y * scale }} />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 pointer-events-none" style={{ height: (image.height - cropArea.y - cropArea.height) * scale }} />
                <div className="absolute top-0 bottom-0 left-0 bg-black/50 pointer-events-none" style={{ width: cropArea.x * scale }} />
                <div className="absolute top-0 bottom-0 right-0 bg-black/50 pointer-events-none" style={{ width: (image.width - cropArea.x - cropArea.width) * scale }} />

                <div
                  className="absolute bg-transparent border-2 border-white pointer-events-auto cursor-move"
                  style={cropStyle}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e);
                  }}
                >
                  {shapePathValue && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <defs>
                        <clipPath id="cropShapeClip">
                          <path d={shapePathValue.replace(/%/g, (_, i) => '%')} />
                        </clipPath>
                      </defs>
                      <path
                        d={shapePathValue.replace(/%/g, (_, i) => '%')}
                        fill="none"
                        stroke="#00ffff"
                        strokeWidth="2"
                        strokeOpacity="0.7"
                        className="drop-shadow-lg"
                      />
                    </svg>
                  )}

                  <div className="absolute w-3 h-3 -top-1.5 -left-1.5 bg-white rounded-full border-2 border-gray-400 cursor-nw-resize" />
                  <div className="absolute w-3 h-3 -top-1.5 -right-1.5 bg-white rounded-full border-2 border-gray-400 cursor-ne-resize" />
                  <div className="absolute w-3 h-3 -bottom-1.5 -left-1.5 bg-white rounded-full border-2 border-gray-400 cursor-sw-resize" />
                  <div className="absolute w-3 h-3 -bottom-1.5 -right-1.5 bg-white rounded-full border-2 border-gray-400 cursor-se-resize" />

                  <div className="absolute w-3 h-3 -top-1.5 left-1/2 -translate-x-1/2 bg-white rounded-full border-2 border-gray-400 cursor-n-resize" />
                  <div className="absolute w-3 h-3 -bottom-1.5 left-1/2 -translate-x-1/2 bg-white rounded-full border-2 border-gray-400 cursor-s-resize" />
                  <div className="absolute w-3 h-3 -left-1.5 top-1/2 -translate-y-1/2 bg-white rounded-full border-2 border-gray-400 cursor-w-resize" />
                  <div className="absolute w-3 h-3 -right-1.5 top-1/2 -translate-y-1/2 bg-white rounded-full border-2 border-gray-400 cursor-e-resize" />
                </div>
              </div>
            </div>
          </div>

          <div className="w-40 sm:w-48 bg-gray-50 border-l border-gray-100 flex flex-col">
            <div className="px-3 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">裁剪预览</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="max-w-full max-h-[150px] sm:max-h-[200px] object-contain rounded-lg shadow-md"
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
            <div className="px-2 py-2 border-t border-gray-100">
              <div className="text-xs text-gray-400 space-y-0.5">
                <div>原图: {image.width} × {image.height}</div>
                <div>裁剪: {Math.round(cropArea.x)}, {Math.round(cropArea.y)}</div>
                <div>尺寸: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
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