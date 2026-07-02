import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onConfirm: (croppedImageUrl: string) => void;
}

const ASPECT_RATIOS = [
  { label: '自由', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
  { label: '9:16', value: 9 / 16 },
];

type DragType = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export default function ImageCropperModal({ isOpen, onClose, imageUrl, onConfirm }: ImageCropperModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [selectedAspect, setSelectedAspect] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<DragType | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropArea | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setImage(null);
      setCropArea({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.src = imageUrl;

    return () => {
      img.src = '';
    };
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (!image || !containerRef.current) return;

    const container = containerRef.current;
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

    const cropWidth = Math.min(image.width, rect.width / newScale) * 0.8;
    const cropHeight = selectedAspect
      ? cropWidth / selectedAspect
      : Math.min(image.height, rect.height / newScale) * 0.8;

    setCropArea({
      x: (image.width - cropWidth) / 2,
      y: (image.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  }, [image, isOpen, selectedAspect]);

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
        if (selectedAspect) {
          newCrop.width = newCrop.height * selectedAspect;
        }
        break;
      case 's':
        newCrop.height = Math.max(20, Math.min(image!.height - cropStart.y, cropStart.height + dy));
        if (selectedAspect) {
          newCrop.width = newCrop.height * selectedAspect;
        }
        break;
      case 'w':
        newCrop.x = Math.max(0, cropStart.x + dx);
        newCrop.width = Math.max(20, cropStart.width - dx);
        if (selectedAspect) {
          newCrop.height = newCrop.width / selectedAspect;
        }
        break;
      case 'e':
        newCrop.width = Math.max(20, Math.min(image!.width - cropStart.x, cropStart.width + dx));
        if (selectedAspect) {
          newCrop.height = newCrop.width / selectedAspect;
        }
        break;
      case 'nw':
        newCrop.x = Math.max(0, cropStart.x + dx);
        newCrop.y = Math.max(0, cropStart.y + dy);
        newCrop.width = Math.max(20, cropStart.width - dx);
        newCrop.height = Math.max(20, cropStart.height - dy);
        if (selectedAspect) {
          if (dragType.includes('n')) {
            newCrop.width = newCrop.height * selectedAspect;
            newCrop.x = Math.min(cropStart.x + dx, image!.width - newCrop.width);
          } else {
            newCrop.height = newCrop.width / selectedAspect;
            newCrop.y = Math.min(cropStart.y + dy, image!.height - newCrop.height);
          }
        }
        break;
      case 'ne':
        newCrop.y = Math.max(0, cropStart.y + dy);
        newCrop.width = Math.max(20, Math.min(image!.width - cropStart.x, cropStart.width + dx));
        newCrop.height = Math.max(20, cropStart.height - dy);
        if (selectedAspect) {
          if (dragType.includes('n')) {
            newCrop.width = newCrop.height * selectedAspect;
          } else {
            newCrop.height = newCrop.width / selectedAspect;
            newCrop.y = Math.min(cropStart.y + dy, image!.height - newCrop.height);
          }
        }
        break;
      case 'sw':
        newCrop.x = Math.max(0, cropStart.x + dx);
        newCrop.width = Math.max(20, cropStart.width - dx);
        newCrop.height = Math.max(20, Math.min(image!.height - cropStart.y, cropStart.height + dy));
        if (selectedAspect) {
          if (dragType.includes('s')) {
            newCrop.width = newCrop.height * selectedAspect;
            newCrop.x = Math.min(cropStart.x + dx, image!.width - newCrop.width);
          } else {
            newCrop.height = newCrop.width / selectedAspect;
          }
        }
        break;
      case 'se':
        newCrop.width = Math.max(20, Math.min(image!.width - cropStart.x, cropStart.width + dx));
        newCrop.height = Math.max(20, Math.min(image!.height - cropStart.y, cropStart.height + dy));
        if (selectedAspect) {
          if (dragType.includes('s')) {
            newCrop.width = newCrop.height * selectedAspect;
          } else {
            newCrop.height = newCrop.width / selectedAspect;
          }
        }
        break;
    }

    newCrop.x = Math.max(0, Math.min(image!.width - newCrop.width, newCrop.x));
    newCrop.y = Math.max(0, Math.min(image!.height - newCrop.height, newCrop.y));

    setCropArea(newCrop);
  }, [isDragging, dragType, cropStart, dragStart, image, selectedAspect, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setCropStart(null);
  }, []);

  const handleAspectChange = useCallback((aspect: number | null) => {
    setSelectedAspect(aspect);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      image,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    const croppedUrl = canvas.toDataURL('image/png');
    onConfirm(croppedUrl);
    onClose();
  }, [image, cropArea, onConfirm, onClose]);

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

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-xl shadow-2xl w-[700px] max-w-[90vw] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">图片裁切</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => handleAspectChange(ratio.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedAspect === ratio.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
          </span>
        </div>

        <div className="relative bg-gray-900 flex-1 min-h-[300px]">
          <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={image.src}
              alt="crop"
              style={imageStyle}
              className="pointer-events-none"
            />

            <div
              className="absolute bg-black/50 pointer-events-none"
              style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />

            <div
              className="absolute bg-transparent border-2 border-white pointer-events-auto cursor-move"
              style={cropStyle}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e);
              }}
            >
              <div className="absolute inset-0 bg-transparent" />

              <div className="absolute w-3 h-3 -top-1.5 -left-1.5 bg-white rounded-full border-2 border-gray-400 cursor-nw-resize" />
              <div className="absolute w-3 h-3 -top-1.5 -right-1.5 bg-white rounded-full border-2 border-gray-400 cursor-ne-resize" />
              <div className="absolute w-3 h-3 -bottom-1.5 -left-1.5 bg-white rounded-full border-2 border-gray-400 cursor-sw-resize" />
              <div className="absolute w-3 h-3 -bottom-1.5 -right-1.5 bg-white rounded-full border-2 border-gray-400 cursor-se-resize" />

              <div className="absolute w-3 h-3 -top-1.5 left-1/2 -translate-x-1/2 bg-white rounded-full border-2 border-gray-400 cursor-n-resize" />
              <div className="absolute w-3 h-3 -bottom-1.5 left-1/2 -translate-x-1/2 bg-white rounded-full border-2 border-gray-400 cursor-s-resize" />
              <div className="absolute w-3 h-3 -left-1.5 top-1/2 -translate-y-1/2 bg-white rounded-full border-2 border-gray-400 cursor-w-resize" />
              <div className="absolute w-3 h-3 -right-1.5 top-1/2 -translate-y-1/2 bg-white rounded-full border-2 border-gray-400 cursor-e-resize" />

              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${image.src})`,
                  backgroundSize: `${image.width * scale}px ${image.height * scale}px`,
                  backgroundPosition: `-${cropArea.x * scale}px -${cropArea.y * scale}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
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
