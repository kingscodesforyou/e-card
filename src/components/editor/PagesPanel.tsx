import { Plus, Copy, Trash2, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEditorStore } from '../../store';
import { useState, useRef, useCallback } from 'react';
import PageThumbnail from './PageThumbnail';

const PagesPanel = () => {
  const {
    currentCard,
    addPage,
    deletePage,
    duplicatePage,
    setCurrentPage,
    reorderPages,
  } = useEditorStore();
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }
    reorderPages(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtTop = scrollTop === 0;
    const isAtBottom = scrollTop >= scrollHeight - clientHeight - 1;

    // 如果在顶部且向上滚动，或在底部且向下滚动，允许事件传递
    if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
      return;
    }

    // 阻止默认行为和事件冒泡
    e.preventDefault();
    e.stopPropagation();
    
    // 手动滚动
    container.scrollTop += e.deltaY;
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900">页面管理</h3>
        <span className="text-xs text-gray-500">
          {currentCard.pages.length} 页
        </span>
      </div>

      {/* 翻页控制 */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <button
          onClick={handlePrev}
          disabled={currentCard.currentPageIndex === 0}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-600">
          第 {currentCard.currentPageIndex + 1} / {currentCard.pages.length} 页
        </span>
        <button
          onClick={handleNext}
          disabled={currentCard.currentPageIndex >= currentCard.pages.length - 1}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 缩略图列表 */}
      <div 
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0"
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        {currentCard.pages.map((page, index) => (
          <div
            key={page.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => setCurrentPage(index)}
            className={`group relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
              index === currentCard.currentPageIndex
                ? 'border-purple-500 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            } ${draggedIndex === index ? 'opacity-50' : ''}`}
          >
            {/* 拖拽手柄 */}
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            {/* 页码 */}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
              第 {index + 1} 页
            </div>

            {/* 缩略图 - 使用 PageThumbnail 渲染实际内容 */}
            <div className="h-48 relative">
              <PageThumbnail page={page} />
            </div>

            {/* 操作按钮 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicatePage(page.id);
                }}
                className="p-2 bg-white rounded hover:bg-gray-100"
                title="复制页面"
              >
                <Copy className="w-4 h-4 text-gray-700" />
              </button>
              {currentCard.pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这页吗？')) {
                      deletePage(page.id);
                    }
                  }}
                  className="p-2 bg-white rounded hover:bg-red-50"
                  title="删除页面"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* 添加新页面按钮 */}
        <button
          onClick={addPage}
          className="h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-purple-600 flex-shrink-0"
        >
          <Plus className="w-8 h-8" />
          <span className="text-sm">添加页面</span>
        </button>
      </div>
    </div>
  );
};

export default PagesPanel;
