/**
 * 组件库渲染器 - 为 ComponentPicker 中的每种高级组件提供渲染逻辑
 * 在 Canvas 和 Preview 中复用
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { CardElement, ComponentConfig, ImageTransform } from '../../types';
import { Heart, Eye, MapPin, Volume2, ChevronRight, PenTool, Play, Pause, RotateCcw, User, MessageSquare, FolderOpen, Menu, Image as ImageIcon, Crop } from 'lucide-react';
import { parseClipPath, convertPercentToUnit } from '../../lib/clipPathUtils';
import { useEditorStore } from '../../store';
import PuzzleCellCropperModal from './PuzzleCellCropperModal';

// ============================================================
// 拼图组件
// ============================================================
// 每个实例独立的 clipPath id 前缀，避免多实例冲突
let _puzzleClipSeq = 0;

export function PuzzleRenderer({ element, editable = false }: { element: CardElement; editable?: boolean }) {
  const config = element.componentConfig;
  const cells = config?.puzzleCells || [];
  const layout = config?.puzzleLayout || {};
  const gap = layout.gap || 0;

  // ---- 编辑模式状态 ----
  const { updateElement } = useEditorStore();
  const [activeCellIdx, setActiveCellIdx] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [croppingIdx, setCroppingIdx] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // 每个实例独立的 clip id 前缀
  const clipPrefix = useRef(`pz-${++_puzzleClipSeq}`).current;

  // 点击菜单外部时关闭菜单
  useEffect(() => {
    if (activeCellIdx === null) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveCellIdx(null);
      }
    };
    // 延迟绑定，避免触发菜单打开的那次 click 事件立即关闭
    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [activeCellIdx]);

  const getAnimationClass = (animation?: string) => {
    switch (animation) {
      case 'fadeIn': return 'animate-fade-in';
      case 'slideIn': return 'animate-slide-in';
      case 'bounce': return 'animate-bounce';
      case 'pulse': return 'animate-pulse';
      case 'shake': return 'animate-shake';
      default: return '';
    }
  };

  const getClipPathInfo = (cell: typeof cells[0], idx: number) => {
    const info = parseClipPath(cell.shapePath, cell.shapeType);
    if (info.useSvgClipPath && info.svgPathData) {
      return {
        ...info,
        clipPathValue: `url(#${clipPrefix}-clip-${idx})`,
      };
    }
    return info;
  };

  const getBorderRadius = (cell: typeof cells[0]) => {
    if (cell.shapeType === 'circle') return '50%';
    if (cell.borderRadius) return `${cell.borderRadius}px`;
    if (!cell.shapeType && !cell.shapePath) return '4px';
    return '0px';
  };

  // ---- 更新单个 cell（复用与 PuzzlePropertyEditor 相同的逻辑） ----
  const updateCell = (index: number, updates: Partial<typeof cells[0]>) => {
    const newCells = [...cells];
    newCells[index] = { ...newCells[index], ...updates };
    updateElement(element.id, {
      componentConfig: { ...config, puzzleCells: newCells } as ComponentConfig,
    });
  };

  // ---- 点击子图：弹出操作菜单 ----
  const handleCellClick = (e: React.MouseEvent, idx: number) => {
    if (!editable) return;
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setActiveCellIdx(idx);
    setMenuPos({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
  };

  // 阻止 mousedown 冒泡到父元素，防止触发画布拖拽
  const handleCellMouseDown = (e: React.MouseEvent) => {
    if (!editable) return;
    e.stopPropagation();
  };

  // ---- 选择图片（复用 PuzzlePropertyEditor.handleImageUpload 逻辑） ----
  const handleSelectImage = () => {
    const idx = activeCellIdx;
    setActiveCellIdx(null);
    if (idx === null) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const files = input.files;
      if (!files || files.length === 0) return;
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(files[0]);
      });
      updateCell(idx, {
        imageUrl: url,
        originalImageUrl: url,
        cropParams: undefined,
        cropHistory: undefined,
        historyIndex: undefined,
        transform: undefined,
        transformHistory: undefined,
        transformHistoryIndex: undefined,
      });
    };
    input.click();
  };

  // ---- 裁切图片（复用 PuzzleCellCropperModal） ----
  const handleCropImage = () => {
    const idx = activeCellIdx;
    if (idx === null) return;
    if (!cells[idx]?.originalImageUrl) return;
    setCroppingIdx(idx);
    setActiveCellIdx(null);
  };

  // ---- 确认裁切 ----
  const handleCropConfirm = (
    croppedImageUrl: string,
    transform: ImageTransform,
    transformHistory: ImageTransform[],
    transformHistoryIndex: number
  ) => {
    if (croppingIdx === null) return;
    updateCell(croppingIdx, {
      imageUrl: croppedImageUrl,
      transform,
      transformHistory,
      transformHistoryIndex,
    });
  };

  return (
    <>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: `${element.style?.borderRadius || 8}px`,
          overflow: 'hidden',
          padding: `${gap}px`,
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '0', height: '0' }}>
          {cells.map((cell, idx) => {
            const info = getClipPathInfo(cell, idx);
            if (info.useSvgClipPath && info.svgPathData) {
              return (
                <clipPath key={`clip-${idx}`} id={`${clipPrefix}-clip-${idx}`} clipPathUnits="objectBoundingBox">
                  <path d={convertPercentToUnit(info.svgPathData)} />
                </clipPath>
              );
            }
            return null;
          })}
        </svg>
        {cells.map((cell, idx) => {
          const info = getClipPathInfo(cell, idx);
          const clipPath = info.clipPathValue || undefined;
          return (
            <div
              key={idx}
              className={`absolute ${getAnimationClass(cell.animation)} ${editable ? 'cursor-pointer' : ''}`}
              style={{
                left: `${cell.x}%`,
                top: `${cell.y}%`,
                width: `${cell.width}%`,
                height: `${cell.height}%`,
                borderRadius: getBorderRadius(cell),
                overflow: clipPath ? 'visible' : 'hidden',
                clipPath: clipPath,
                WebkitClipPath: clipPath,
                borderWidth: `${cell.borderWidth || layout.borderWidth || 0}px`,
                borderColor: cell.borderColor || layout.borderColor || '#ffffff',
                borderStyle: 'solid',
                opacity: cell.opacity ?? 1,
              }}
              onClick={editable ? (e) => handleCellClick(e, idx) : undefined}
              onMouseDown={editable ? handleCellMouseDown : undefined}
            >
              {cell.imageUrl ? (
                <img
                  src={cell.imageUrl}
                  alt={`puzzle-cell-${idx}`}
                  className="w-full h-full object-cover"
                  style={{
                    borderRadius: clipPath ? 'inherit' : undefined,
                    clipPath: clipPath,
                    WebkitClipPath: clipPath,
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-gray-400 text-xs"
                  style={{
                    backgroundColor: editable
                      ? `rgba(219, 234, 254, ${0.3 + (idx % 5) * 0.12})`
                      : 'transparent',
                  }}
                >
                  {editable ? '+ 添加图片' : ''}
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* 选中子图的虚线边框 —— 独立覆盖层，放在 overflow:hidden 容器外部，
          对于自定义形状用 SVG path + stroke-dasharray 绘制，矩形/圆形用 CSS border */}
      {editable && activeCellIdx !== null && cells[activeCellIdx] && (() => {
        const ac = cells[activeCellIdx];
        const ai = getClipPathInfo(ac, activeCellIdx);
        const hasSvgShape = ai.useSvgClipPath && !!ai.svgPathData;
        const baseStyle: React.CSSProperties = {
          left: `calc(${ac.x}% + ${gap}px)`,
          top: `calc(${ac.y}% + ${gap}px)`,
          width: `${ac.width}%`,
          height: `${ac.height}%`,
          zIndex: 10,
        };
        if (hasSvgShape) {
          return (
            <div className="absolute pointer-events-none" style={baseStyle}>
              <svg
                className="w-full h-full"
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
              >
                <path
                  d={convertPercentToUnit(ai.svgPathData)}
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          );
        }
        return (
          <div
            className="absolute pointer-events-none"
            style={{
              ...baseStyle,
              border: '2px dashed #000',
              borderRadius: getBorderRadius(ac),
              boxSizing: 'border-box',
            }}
          />
        );
      })()}

      {/* 操作菜单 —— 通过 Portal 渲染到 body，避免被 canvas 的 transform/overflow 裁切 */}
      {editable && activeCellIdx !== null && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden min-w-[140px]"
          style={{
            left: `${menuPos.x}px`,
            top: `${menuPos.y}px`,
            transform: 'translateX(-50%)',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
            onClick={handleSelectImage}
          >
            <ImageIcon className="w-4 h-4 text-gray-400" />
            选择图片
          </button>
          <button
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700"
            onClick={handleCropImage}
            disabled={!cells[activeCellIdx]?.originalImageUrl}
          >
            <Crop className="w-4 h-4 text-gray-400" />
            裁切图片
          </button>
        </div>,
        document.body
      )}

      {/* 裁切弹窗 —— 同样通过 Portal 渲染到 body，避免 canvas transform 导致 fixed 定位失效 */}
      {/* 外层 div 仅拦截 mousedown 冒泡，防止画布开始拖拽。
          不能拦截 mousemove/mouseup，否则会阻断裁切弹窗 window 级别的原生监听器 */}
      {editable && croppingIdx !== null && cells[croppingIdx]?.originalImageUrl && createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <PuzzleCellCropperModal
            isOpen={croppingIdx !== null}
            onClose={() => setCroppingIdx(null)}
            cell={cells[croppingIdx]}
            onConfirm={handleCropConfirm}
          />
        </div>,
        document.body
      )}
    </>
  );
}

// ============================================================
// 轮播图组件
// ============================================================
export function CarouselRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const images = config?.carouselImages || [];
  const interval = config?.carouselInterval || 3000;
  const autoPlay = config?.carouselAutoPlay !== false;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, images.length, interval]);

  if (images.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
          <ImageIcon style={{ width: '32px', height: '32px', margin: '0 auto 8px' }} />
          <div>添加轮播图片</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: idx === currentIndex ? 1 : 0,
            transition: 'opacity 0.5s ease-in-out',
          }}
        />
      ))}
      {/* 指示器 */}
      <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
        {images.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 弹幕组件
// ============================================================
export function BarrageRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const messages = config?.barrageMessages || ['这是一条弹幕~'];
  const speed = config?.barrageSpeed || 8;
  const color = config?.barrageColor || '#8B5CF6';
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', pointerEvents: 'none' }}
    >
      {messages.map((msg, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            whiteSpace: 'nowrap',
            color: color,
            fontSize: '14px',
            fontWeight: 'bold',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            top: `${15 + (idx % 5) * 16}%`,
            animation: `barrage-scroll ${speed}s linear infinite`,
            animationDelay: `${idx * 1.5}s`,
            opacity: 0.85,
          }}
        >
          {msg}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 留言板组件
// ============================================================
export function MessageBoardRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const messages = config?.messages || [];
  const placeholder = config?.messagePlaceholder || '写下你的祝福...';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
      {/* 消息列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', padding: '20px 0' }}>
            暂无留言，快来写下第一条吧~
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: `hsl(${260 + idx * 60}, 70%, 70%)`,
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '12px', fontWeight: 'bold',
              }}>
                {msg.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#374151', marginBottom: '2px' }}>
                  {msg.name}
                  <span style={{ fontWeight: '400', color: '#9ca3af', marginLeft: '6px', fontSize: '10px' }}>{msg.time}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#4b5563', backgroundColor: '#f9fafb', padding: '6px 10px', borderRadius: '8px', lineHeight: 1.4 }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* 输入框 */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          placeholder={placeholder}
          style={{
            flex: 1, border: '1px solid #e5e7eb', borderRadius: '20px',
            padding: '6px 14px', fontSize: '12px', outline: 'none', backgroundColor: '#f9fafb',
          }}
          readOnly
        />
        <button style={{
          backgroundColor: '#8B5CF6', color: '#fff', border: 'none',
          borderRadius: '50%', width: '28px', height: '28px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px',
        }}>
          ↑
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 点赞组件
// ============================================================
export function LikeRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const [count, setCount] = useState(config?.likeCount || 0);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleLike = useCallback(() => {
    if (!liked) {
      setCount((c: number) => c + 1);
      setLiked(true);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    } else {
      setCount((c: number) => c - 1);
      setLiked(false);
    }
  }, [liked]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={handleLike}>
      <Heart
        style={{
          width: '32px',
          height: '32px',
          color: liked ? '#ef4444' : '#d1d5db',
          fill: liked ? '#ef4444' : 'none',
          transform: animating ? 'scale(1.3)' : 'scale(1)',
          transition: 'all 0.2s ease',
        }}
      />
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{count}</span>
    </div>
  );
}

// ============================================================
// 计时器组件
// ============================================================
export function TimerRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const countUp = config?.timerCountUp !== false;
  const [elapsed, setElapsed] = useState(config?.timerStartFrom || 0);
  const [running, setRunning] = useState(config?.timerRunning !== false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev: number) => countUp ? prev + 1 : Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, countUp]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace', color: '#374151' }}>
        {formatTime(elapsed)}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={(e) => { e.stopPropagation(); setRunning(!running); }}
          style={{
            border: 'none', background: running ? '#fef2f2' : '#f0fdf4',
            borderRadius: '50%', width: '28px', height: '28px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          {running ? <Pause style={{ width: '14px', height: '14px', color: '#ef4444' }} /> : <Play style={{ width: '14px', height: '14px', color: '#10b981' }} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setElapsed(0); }}
          style={{
            border: 'none', background: '#f3f4f6', borderRadius: '50%',
            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <RotateCcw style={{ width: '14px', height: '14px', color: '#6b7280' }} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 数据图表组件
// ============================================================
export function ChartRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const chartType = config?.chartType || 'bar';
  const chartData = config?.chartData || [];
  const maxValue = Math.max(...chartData.map((d: { value: number }) => d.value), 1);

  if (chartType === 'bar') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '8px 8px 24px 8px', position: 'relative' }}>
        {chartData.map((item: { label: string; value: number; color?: string }, idx: number) => (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div
              style={{
                width: '100%',
                height: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color || '#8B5CF6',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.5s ease',
                minHeight: '4px',
              }}
            />
            <span style={{ position: 'absolute', bottom: '2px', fontSize: '10px', color: '#6b7280' }}>{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (chartType === 'pie') {
    const total = chartData.reduce((sum: number, d: { value: number }) => sum + d.value, 0);
    let cumulativePercent = 0;
    const slices = chartData.map((d: { value: number; color?: string }) => {
      const percent = d.value / total;
      const start = cumulativePercent;
      cumulativePercent += percent;
      return { ...d, start, percent };
    });

    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '80%', height: '80%' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            {slices.map((slice: { color?: string; start: number; percent: number }, idx: number) => {
              const startAngle = slice.start * 360;
              const endAngle = (slice.start + slice.percent) * 360;
              const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
              const largeArc = slice.percent > 0.5 ? 1 : 0;
              return (
                <path
                  key={idx}
                  d={`M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`}
                  fill={slice.color || `hsl(${260 + idx * 50}, 70%, 60%)`}
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px' }}>图表数据</div>;
}

// ============================================================
// 天气组件
// ============================================================
export function WeatherRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const city = config?.weatherCity || '北京';
  const [weather, setWeather] = useState({ temp: '26°', desc: '晴', icon: '☀️' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '16px', backdropFilter: 'blur(8px)' }}>
      <span style={{ fontSize: '32px' }}>{weather.icon}</span>
      <div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{weather.temp}</div>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>{weather.desc} · {city}</div>
      </div>
    </div>
  );
}

// ============================================================
// 实时日期组件
// ============================================================
export function RealDateRenderer({ element }: { element: CardElement }) {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return (
    <div style={{ textAlign: 'center', padding: '8px 12px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{date.getFullYear()}年</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{date.getMonth() + 1}月{date.getDate()}日</div>
      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{weekDays[date.getDay()]}</div>
    </div>
  );
}

// ============================================================
// 动态数字组件
// ============================================================
export function DynamicNumberRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const target = config?.dynamicNumberTarget || 0;
  const duration = config?.dynamicNumberDuration || 2000;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const steps = 30;
    const increment = target / steps;
    const stepDuration = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setCurrent(target);
        clearInterval(timer);
      } else {
        setCurrent(Math.round(increment * step));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <div style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
      {current.toLocaleString()}
    </div>
  );
}

// ============================================================
// 模拟对话组件
// ============================================================
export function SimulateChatRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const messages = config?.chatMessages || [];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', overflow: 'auto' }}>
      {messages.map((msg: { sender: string; content: string; isMe: boolean }, idx: number) => (
        <div key={idx} style={{ display: 'flex', gap: '6px', justifyContent: msg.isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
          {!msg.isMe && (
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#c4b5fd', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff' }}>
              {msg.sender[0]}
            </div>
          )}
          <div style={{
            maxWidth: '70%', padding: '6px 10px', borderRadius: '12px',
            fontSize: '12px', lineHeight: 1.4,
            backgroundColor: msg.isMe ? '#8B5CF6' : '#f3f4f6',
            color: msg.isMe ? '#fff' : '#374151',
            borderBottomRightRadius: msg.isMe ? '4px' : '12px',
            borderBottomLeftRadius: msg.isMe ? '12px' : '4px',
          }}>
            {msg.content}
          </div>
          {msg.isMe && (
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f9a8d4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff' }}>
              我
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 随机事件组件
// ============================================================
export function RandomEventRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const options = config?.randomOptions || ['大吉', '中吉', '小吉', '末吉', '凶'];
  const [result, setResult] = useState(config?.randomResult || '');
  const [rolling, setRolling] = useState(false);

  const handleRandom = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    let count = 0;
    const maxCount = 15;
    const timer = setInterval(() => {
      setResult(options[Math.floor(Math.random() * options.length)]);
      count++;
      if (count >= maxCount) {
        clearInterval(timer);
        setRolling(false);
      }
    }, 100);
  }, [options, rolling]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={handleRandom}>
      <div style={{
        backgroundColor: '#f3e8ff', padding: '10px 20px', borderRadius: '12px',
        fontSize: '16px', fontWeight: 'bold', color: '#7c3aed',
        border: '1px solid #e9d5ff', minWidth: '60px', textAlign: 'center',
        transition: 'all 0.2s',
      }}>
        {result || '点击抽取'}
      </div>
      <span style={{ fontSize: '10px', color: '#9ca3af' }}>{rolling ? '抽取中...' : '点击随机'}</span>
    </div>
  );
}

// ============================================================
// 快闪组件
// ============================================================
export function FlashRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const texts = config?.flashTexts || ['惊喜', '快乐', '幸福'];
  const interval = config?.flashInterval || 800;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev: number) => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [texts, interval]);

  return (
    <div style={{
      fontSize: '32px', fontWeight: 'bold', textAlign: 'center',
      background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      animation: 'flash-pulse 0.3s ease-in-out',
    }}>
      {texts[currentIndex]}
    </div>
  );
}

// ============================================================
// 飘落物组件
// ============================================================
export function FallingRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const items = config?.fallingItems || ['🎉', '🎊', '✨', '💫', '🌟'];
  const type = config?.fallingType || 'confetti';
  const particles = 20;

  const getItemByType = (): string[] => {
    switch (type) {
      case 'snow': return ['❄️', '❅', '❆', '⛄'];
      case 'hearts': return ['❤️', '💕', '💗', '💖', '💝'];
      case 'stars': return ['⭐', '🌟', '✨', '💫'];
      case 'confetti': return ['🎉', '🎊', '🎀', '🎈', '✨'];
      default: return items;
    }
  };

  const displayItems = type !== 'custom' ? getItemByType() : items;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: particles }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            fontSize: `${12 + Math.random() * 18}px`,
            animation: `falling-drop ${3 + Math.random() * 4}s linear infinite`,
            animationDelay: `${Math.random() * 4}s`,
            opacity: 0.6 + Math.random() * 0.4,
          }}
        >
          {displayItems[Math.floor(Math.random() * displayItems.length)]}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 目录组件
// ============================================================
export function TocRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const items = config?.tocItems || [];
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
      {items.map((item: { title: string; pageIndex: number }, idx: number) => (
        <div
          key={idx}
          onClick={() => setActiveIndex(idx)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
            borderRadius: '8px', cursor: 'pointer',
            backgroundColor: idx === activeIndex ? '#f0fdfa' : 'transparent',
            color: idx === activeIndex ? '#0d9488' : '#6b7280',
            fontSize: '13px', fontWeight: idx === activeIndex ? '600' : '400',
            transition: 'all 0.2s',
          }}
        >
          <FolderOpen style={{ width: '14px', height: '14px', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{item.title}</span>
          <span style={{ fontSize: '10px', opacity: 0.6 }}>第{item.pageIndex + 1}页</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 底部菜单组件
// ============================================================
export function BottomMenuRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const items = config?.menuItems || [
    { label: '首页', icon: 'home', target: 'page1' },
    { label: '发现', icon: 'compass', target: 'page2' },
    { label: '我的', icon: 'user', target: 'page3' },
  ];
  const [activeTab, setActiveTab] = useState(0);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'home': return '🏠';
      case 'compass': return '🧭';
      case 'user': return '👤';
      case 'heart': return '❤️';
      case 'star': return '⭐';
      default: return '📄';
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}>
      {items.map((item: { label: string; icon: string }, idx: number) => (
        <div
          key={idx}
          onClick={() => setActiveTab(idx)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '2px', cursor: 'pointer', padding: '6px 0',
            color: idx === activeTab ? '#0d9488' : '#9ca3af',
          }}
        >
          <span style={{ fontSize: '16px' }}>{getIcon(item.icon)}</span>
          <span style={{ fontSize: '10px', fontWeight: idx === activeTab ? '600' : '400' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 地图组件（静态地图展示）
// ============================================================
export function MapRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const address = config?.mapAddress || '北京市';

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '6px',
      backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0',
    }}>
      <div style={{ position: 'relative' }}>
        <MapPin style={{ width: '24px', height: '24px', color: '#ef4444' }} />
        <div style={{
          position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)',
          width: '6px', height: '6px', backgroundColor: '#ef4444', borderRadius: '50%',
          boxShadow: '0 0 8px rgba(239,68,68,0.4)',
        }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#065f46' }}>{address}</div>
        <div style={{ fontSize: '10px', color: '#6ee7b7' }}>点击查看地图</div>
      </div>
    </div>
  );
}

// ============================================================
// 浏览计数组件
// ============================================================
export function ViewCountRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const count = config?.viewCount || 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Eye style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
      <span style={{ fontSize: '13px', color: '#6b7280' }}>浏览 {count.toLocaleString()} 次</span>
    </div>
  );
}

// ============================================================
// 画板组件
// ============================================================
export function DrawingBoardRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState(config?.canvasBrushColor || '#8B5CF6');
  const [brushSize, setBrushSize] = useState(config?.canvasBrushSize || 4);
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8B5CF6', '#ec4899', '#000000'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setIsDrawing(false);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
      <canvas
        ref={canvasRef}
        style={{ flex: 1, cursor: 'crosshair', backgroundColor: '#fafafa', touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      <div style={{ display: 'flex', gap: '4px', padding: '6px', borderTop: '1px solid #e5e7eb', alignItems: 'center' }}>
        {colors.map((c) => (
          <button
            key={c}
            onClick={(e) => { e.stopPropagation(); setBrushColor(c); }}
            style={{
              width: '18px', height: '18px', borderRadius: '50%', backgroundColor: c,
              border: brushColor === c ? '2px solid #374151' : '2px solid transparent',
              cursor: 'pointer',
            }}
          />
        ))}
        <div style={{ width: '1px', height: '18px', backgroundColor: '#e5e7eb', margin: '0 4px' }} />
        <input
          type="range"
          min="1"
          max="12"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          style={{ width: '50px' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

// ============================================================
// 语音组件
// ============================================================
export function VoiceRenderer({ element }: { element: CardElement }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
      style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#f3e8ff', borderRadius: '50%', cursor: 'pointer',
        border: '2px solid #e9d5ff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <div className={`w-1 h-3 bg-purple-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '0s' }} />
        <div className={`w-1 h-5 bg-pink-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.2s' }} />
        <div className={`w-1 h-4 bg-purple-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.4s' }} />
        <div className={`w-1 h-6 bg-pink-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.6s' }} />
        <div className={`w-1 h-3 bg-purple-400 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: '0.8s' }} />
      </div>
    </div>
  );
}

// ============================================================
// 页面跳转组件
// ============================================================
export function PageJumpRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const label = config?.jumpLabel || '前往下一页';

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '6px', backgroundColor: '#f0fdfa', borderRadius: '12px', cursor: 'pointer',
      border: '1px solid #99f6e4', padding: '8px 16px',
    }}>
      <span style={{ fontSize: '13px', color: '#0d9488', fontWeight: '500' }}>{label}</span>
      <ChevronRight style={{ width: '16px', height: '16px', color: '#0d9488' }} />
    </div>
  );
}

// ============================================================
// 年龄改变组件
// ============================================================
export function AgeChangeRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const [currentAge, setCurrentAge] = useState(config?.ageFrom || 18);
  const [showTo, setShowTo] = useState(false);

  const handleClick = () => {
    if (!showTo) {
      setShowTo(true);
      setCurrentAge(config?.ageTo || 25);
    } else {
      setShowTo(false);
      setCurrentAge(config?.ageFrom || 18);
    }
  };

  return (
    <div onClick={handleClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: showTo
          ? 'linear-gradient(135deg, #8B5CF6, #EC4899)'
          : 'linear-gradient(135deg, #fbbf24, #f97316)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 'bold', fontSize: '16px',
        transition: 'all 0.5s ease',
      }}>
        {currentAge}
      </div>
      <ChevronRight style={{ width: '16px', height: '16px', color: '#9ca3af' }} />
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: showTo
          ? 'linear-gradient(135deg, #fbbf24, #f97316)'
          : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 'bold', fontSize: '16px',
        transition: 'all 0.5s ease',
      }}>
        {showTo ? (config?.ageFrom || 18) : (config?.ageTo || 25)}
      </div>
    </div>
  );
}

// ============================================================
// 头像墙组件
// ============================================================
export function AvatarWallRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const avatars = config?.avatarUrls || [];
  const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];

  const displayAvatars = avatars.length > 0 ? avatars : colors;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', marginLeft: displayAvatars.length > 0 ? `${(displayAvatars.length - 1) * 8}px` : '0' }}>
        {displayAvatars.map((avatar: string, idx: number) => (
          <div
            key={idx}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: typeof avatar === 'string' && avatar.startsWith('#') ? avatar : '#e5e7eb',
              backgroundImage: typeof avatar === 'string' && !avatar.startsWith('#') ? `url(${avatar})` : undefined,
              backgroundSize: 'cover', backgroundPosition: 'center',
              border: '2px solid #fff', marginLeft: idx > 0 ? '-8px' : '0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', color: '#fff',
            }}
          >
            {!avatar && <User style={{ width: '14px', height: '14px', color: '#fff' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 立体魔方组件
// ============================================================
export function CubeRenderer({ element }: { element: CardElement }) {
  const config = element.componentConfig;
  const faces = config?.cubeFaces || ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRotation((prev: number) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '200px' }}>
      <div style={{
        width: '60%', height: '60%', position: 'relative',
        transformStyle: 'preserve-3d',
        transform: `rotateY(${rotation}deg) rotateX(${rotation * 0.5}deg)`,
      }}>
        {/* 前面 */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: faces[0], borderRadius: '4px', transform: 'translateZ(15px)', opacity: 0.9 }} />
        {/* 后面 */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: faces[1], borderRadius: '4px', transform: 'translateZ(-15px) rotateY(180deg)', opacity: 0.9 }} />
        {/* 右面 */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: faces[2], borderRadius: '4px', transform: 'rotateY(90deg) translateZ(15px)', opacity: 0.9 }} />
        {/* 左面 */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: faces[3], borderRadius: '4px', transform: 'rotateY(-90deg) translateZ(15px)', opacity: 0.9 }} />
        {/* 上面 */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: faces[4], borderRadius: '4px', transform: 'rotateX(90deg) translateZ(15px)', opacity: 0.9 }} />
        {/* 下面 */}
        <div style={{ position: 'absolute', inset: 0, backgroundColor: faces[5], borderRadius: '4px', transform: 'rotateX(-90deg) translateZ(15px)', opacity: 0.9 }} />
      </div>
    </div>
  );
}

// ============================================================
// 主渲染入口：根据 componentType 选择对应渲染器
// ============================================================
export function renderComponent(element: CardElement, editable = false): React.ReactNode {
  const componentType = element.componentConfig?.componentType;

  if (!componentType) return null;

  switch (componentType) {
    case 'puzzle': return <PuzzleRenderer element={element} editable={editable} />;
    case 'carousel': return <CarouselRenderer element={element} />;
    case 'barrage': return <BarrageRenderer element={element} />;
    case 'messageBoard': return <MessageBoardRenderer element={element} />;
    case 'like': return <LikeRenderer element={element} />;
    case 'timer': return <TimerRenderer element={element} />;
    case 'chart': return <ChartRenderer element={element} />;
    case 'weather': return <WeatherRenderer element={element} />;
    case 'realDate': return <RealDateRenderer element={element} />;
    case 'dynamicNumber': return <DynamicNumberRenderer element={element} />;
    case 'simulateChat': return <SimulateChatRenderer element={element} />;
    case 'randomEvent': return <RandomEventRenderer element={element} />;
    case 'flash': return <FlashRenderer element={element} />;
    case 'falling': return <FallingRenderer element={element} />;
    case 'toc': return <TocRenderer element={element} />;
    case 'bottomMenu': return <BottomMenuRenderer element={element} />;
    case 'map': return <MapRenderer element={element} />;
    case 'viewCount': return <ViewCountRenderer element={element} />;
    case 'drawingBoard': return <DrawingBoardRenderer element={element} />;
    case 'voice': return <VoiceRenderer element={element} />;
    case 'pageJump': return <PageJumpRenderer element={element} />;
    case 'ageChange': return <AgeChangeRenderer element={element} />;
    case 'avatarWall': return <AvatarWallRenderer element={element} />;
    case 'cube': return <CubeRenderer element={element} />;

    // 以下组件使用纯 CSS / 文本渲染（无需特殊 React 渲染器）
    case 'realLocation':
    case 'wechatAvatar':
    case 'faceRecognition':
    case 'faceMerge':
    case 'voiceAssistant':
    case 'pip':
    case 'wordArt':
    case 'scratch':
    case 'fingerprint':
    case 'gradient':
    case 'gravity':
    case 'breakGlass':
    case 'screenshot':
    case 'photo':
    case 'soundEffect':
    case 'document':
    default:
      return null;
  }
}

export default renderComponent;
