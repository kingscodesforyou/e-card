import { useState, useRef, useCallback } from 'react';
import {
  Plus, Copy, Trash2, GripVertical,
  ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { useEditorStore } from '../../store';
import PageThumbnail from './PageThumbnail';

/** 动画持续时间（毫秒） */
const ANIM_DURATION = 380;

/** 贝塞尔曲线：先加速后减速，带少许弹性 */
const EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const PagesPanel = () => {
  const {
    currentCard,
    addPage,
    deletePage,
    duplicatePage,
    setCurrentPage,
    reorderPages,
  } = useEditorStore();

  // ── 拖拽排序状态 ──
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── 页面动画相关 ──
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  // ── 页码跳转输入 ──
  const [jumpValue, setJumpValue] = useState('');
  const jumpInputRef = useRef<HTMLInputElement>(null);
  const [showJumpInput, setShowJumpInput] = useState(false);

  // ── 翻页 ──
  const handlePrev = () => {
    if (currentCard.currentPageIndex > 0) {
      setCurrentPage(currentCard.currentPageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentCard.currentPageIndex < currentCard.pages.length - 1) {
      setCurrentPage(currentCard.currentPageIndex + 1);
    }
  };

  // ── 带 FLIP 动画的移动 ──
  const moveWithAnimation = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentCard.pages.length) return;

    const pageA = currentCard.pages[index];
    const pageB = currentCard.pages[targetIndex];
    if (!pageA || !pageB) return;

    // 防止动画进行中再次触发
    if (animatingIds.has(pageA.id) || animatingIds.has(pageB.id)) return;

    // ── 1. 记录移动前所有页面项的 DOM 位置 ──
    const oldRects = new Map<string, DOMRect>();
    currentCard.pages.forEach((p) => {
      const el = itemRefs.current.get(p.id);
      if (el) oldRects.set(p.id, el.getBoundingClientRect());
    });

    // ── 2. 标记动画中页面，阻止重复操作 ──
    setAnimatingIds(new Set([pageA.id, pageB.id]));

    // ── 3. 执行 Store 排序（立即更新数据，React 自动重渲染） ──
    reorderPages(index, targetIndex);

    // 更新当前页索引
    if (currentCard.currentPageIndex === index) {
      setCurrentPage(targetIndex);
    } else if (currentCard.currentPageIndex === targetIndex) {
      setCurrentPage(index);
    }

    // ── 4. FLIP 动画 ──
    // 步骤 A（第 1 帧）：将元素 Snapshot 回旧位置（Invert），浏览器会画出"旧位置"这一帧
    requestAnimationFrame(() => {
      const animatingNow: HTMLDivElement[] = [];

      currentCard.pages.forEach((p) => {
        const el = itemRefs.current.get(p.id);
        const old = oldRects.get(p.id);
        if (!el || !old) return;

        const newRect = el.getBoundingClientRect();
        const deltaY = old.top - newRect.top;

        if (Math.abs(deltaY) < 2) return;
        animatingNow.push(el);

        el.style.transition = 'none';
        el.style.transform = `translateY(${deltaY}px) scale(0.97)`;
        el.style.opacity = '0.85';
      });

      if (animatingNow.length === 0) {
        setAnimatingIds(new Set());
        return;
      }

      // 强制回流确保逆变换已生效，然后进入下一帧
      void animatingNow[0].offsetHeight;

      // 步骤 B（第 2 帧）：添加过渡 → 设置终点 → 浏览器自行动画（Play）
      requestAnimationFrame(() => {
        animatingNow.forEach((el) => {
          el.style.transition = `transform ${ANIM_DURATION}ms ${EASING}, opacity ${ANIM_DURATION}ms ease`;
          el.style.transform = 'translateY(0) scale(1)';
          el.style.opacity = '1';
        });

        // 步骤 C：动画结束后清理内联样式
        setTimeout(() => {
          animatingNow.forEach((el) => {
            el.style.transition = 'none';
            el.style.transform = '';
            el.style.opacity = '';
            void el.offsetHeight;
            el.style.transition = '';
          });
          setAnimatingIds(new Set());
        }, ANIM_DURATION + 50);
      });
    });
  };

  // ── 拖拽排序事件 ──
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setDragOverIndex(null);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null) {
      cleanupDrag();
      return;
    }
    if (draggedIndex === dropIndex) {
      cleanupDrag();
      return;
    }
    reorderPages(draggedIndex, dropIndex);
    cleanupDrag();
  };

  const handleDragEnd = () => {
    cleanupDrag();
  };

  const cleanupDrag = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // ── 跳转到指定页码 ──
  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpValue, 10);
    if (!isNaN(target) && target >= 1 && target <= currentCard.pages.length) {
      setCurrentPage(target - 1);
    }
    setJumpValue('');
    setShowJumpInput(false);
  };

  const toggleJumpInput = () => {
    setShowJumpInput((v) => !v);
    if (!showJumpInput) {
      setTimeout(() => jumpInputRef.current?.focus(), 50);
    }
  };

  // ── 滚轮拦截 ──
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop >= scrollHeight - clientHeight - 1;

    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    container.scrollTop += e.deltaY;
  }, []);

  const totalPages = currentCard.pages.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-full overflow-hidden">
      {/* ── 头部标题区 ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900">页面管理</h3>
        <span className="text-xs text-gray-500">{totalPages} 页</span>
      </div>

      {/* ── 翻页控制 + 页码跳转 ── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0 gap-1">
        <button
          onClick={handlePrev}
          disabled={currentCard.currentPageIndex === 0}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="上一页"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {showJumpInput ? (
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
            <input
              ref={jumpInputRef}
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onBlur={() => setShowJumpInput(false)}
              className="w-16 text-sm text-center border border-purple-400 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="页码"
            />
          </form>
        ) : (
          <button
            onClick={toggleJumpInput}
            className="text-sm text-gray-600 hover:text-purple-600 px-2 py-0.5 rounded hover:bg-purple-50 transition-colors"
            title="点击输入页码跳转"
          >
            第 {currentCard.currentPageIndex + 1} / {totalPages} 页
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={currentCard.currentPageIndex >= totalPages - 1}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          title="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {draggedIndex !== null && (
        <div className="text-xs text-purple-600 bg-purple-50 rounded px-2 py-1 mb-2 flex-shrink-0 text-center">
          拖拽页面到目标位置释放以调整顺序
        </div>
      )}

      {/* ── 缩略图列表 ── */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {currentCard.pages.map((page, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver =
            dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;
          const isAnimating = animatingIds.has(page.id);

          return (
            <div key={page.id} className="flex-shrink-0">
              <div
                ref={(el) => {
                  if (el) itemRefs.current.set(page.id, el);
                  else itemRefs.current.delete(page.id);
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => setCurrentPage(index)}
                className={[
                  'group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors',
                  // 当前页高亮
                  index === currentCard.currentPageIndex
                    ? 'border-purple-500 shadow-md'
                    : 'border-gray-200 hover:border-gray-300',
                  // 拖拽中自身半透明
                  isDragging ? 'opacity-40' : '',
                  // 拖拽悬停目标
                  isDragOver
                    ? 'ring-2 ring-purple-400 ring-offset-1 scale-[1.02] shadow-lg'
                    : '',
                  // 动画中阻止点击
                  isAnimating ? 'pointer-events-none' : '',
                ].join(' ')}
              >
                {/* 拖拽手柄 */}
                <div
                  className={[
                    'absolute top-2 left-2 z-10 transition-opacity',
                    draggedIndex !== null
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100',
                  ].join(' ')}
                >
                  <GripVertical className="w-4 h-4 text-gray-400 drop-shadow-sm" />
                </div>

                {/* 页码标号 */}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                  第 {index + 1} 页
                </div>

                {/* 缩略图 */}
                <div className="h-48 relative">
                  <PageThumbnail page={page} />
                </div>

                {/* 操作层 */}
                <div
                  className={[
                    'absolute inset-0 flex items-end justify-center pb-3 gap-1 z-20 transition-opacity',
                    draggedIndex !== null
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-0 group-hover:opacity-100 bg-black/30',
                    isAnimating ? 'opacity-0 pointer-events-none' : '',
                  ].join(' ')}
                >
                  {/* 上移 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveWithAnimation(index, 'up');
                    }}
                    disabled={index === 0 || isAnimating}
                    className="p-1.5 bg-white rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="上移"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* 下移 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveWithAnimation(index, 'down');
                    }}
                    disabled={index === totalPages - 1 || isAnimating}
                    className="p-1.5 bg-white rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="下移"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* 复制 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicatePage(page.id);
                    }}
                    className="p-1.5 bg-white rounded hover:bg-gray-100"
                    title="复制页面"
                  >
                    <Copy className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* 删除 */}
                  {totalPages > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('确定要删除这页吗？')) {
                          deletePage(page.id);
                        }
                      }}
                      className="p-1.5 bg-white rounded hover:bg-red-50"
                      title="删除页面"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* 添加新页面按钮 */}
        <button
          onClick={addPage}
          className="h-36 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 flex-shrink-0"
        >
          <Plus className="w-8 h-8" />
          <span className="text-sm">添加新页面</span>
        </button>
      </div>
    </div>
  );
};

export default PagesPanel;
