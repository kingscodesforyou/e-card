import { useState } from 'react';
import { useEditorStore } from '../../store';
import { CardElement } from '../../types';

const Canvas = () => {
  const { 
    currentCard, 
    selectedElementId, 
    selectElement, 
    updateElement, 
    deleteElement 
  } = useEditorStore();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<string | null>(null);

  // 获取当前页，按 zIndex 升序排列（zIndex 越小越先渲染，显示在下层）
  const currentPage = currentCard.pages[currentCard.currentPageIndex];
  const elements = [...(currentPage?.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    selectElement(elementId);
  };

  const handleMouseDown = (e: React.MouseEvent, element: CardElement) => {
    e.stopPropagation();
    selectElement(element.id);
    setDragging(element.id);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleResizeStart = (e: React.MouseEvent, element: CardElement) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing(element.id);
    setDragging(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const canvas = document.getElementById('card-canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      // 转换为百分比
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      updateElement(dragging, { 
        position: { 
          x: Math.max(0, Math.min(100, xPercent)), 
          y: Math.max(0, Math.min(100, yPercent)) 
        } 
      });
    } else if (resizing) {
      const canvas = document.getElementById('card-canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const element = elements.find(el => el.id === resizing);
      if (!element) return;

      const x = e.clientX - rect.left - (rect.width * element.position.x / 100);
      const y = e.clientY - rect.top - (rect.height * element.position.y / 100);

      const widthPercent = Math.max(5, Math.min(100, (x / rect.width) * 100));
      const heightPercent = Math.max(5, Math.min(100, (y / rect.height) * 100));

      updateElement(resizing, {
        size: {
          width: widthPercent,
          height: heightPercent,
        }
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  const handleCanvasClick = () => {
    selectElement(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedElementId && (e.key === 'Delete' || e.key === 'Backspace')) {
      // 避免在文本编辑时误删
      if ((e.target as HTMLElement).tagName !== 'INPUT' && 
          (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        deleteElement(selectedElementId);
      }
    }
  };

  const renderElement = (element: CardElement) => {
    const isSelected = selectedElementId === element.id;
    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: element.size ? `${element.size.width}%` : 'auto',
      height: element.size ? `${element.size.height}%` : 'auto',
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      zIndex: Math.round(element.zIndex || 1),
      cursor: 'move',
      // 仅保留 CSSProperties 支持的字段
      fontSize: element.style.fontSize,
      fontFamily: element.style.fontFamily,
      color: element.style.color,
      opacity: element.style.opacity,
      fontWeight: element.style.fontWeight as any,
      textAlign: element.style.textAlign as any,
      backgroundColor: element.style.backgroundColor,
      borderRadius: element.style.borderRadius,
      borderWidth: element.style.borderWidth,
      borderColor: element.style.borderColor,
      animation: element.style.animation,
      animationDuration: typeof element.style.animationDuration === 'number' ? `${element.style.animationDuration}ms` : undefined,
      animationDelay: typeof element.style.animationDelay === 'number' ? `${element.style.animationDelay}ms` : undefined,
    };

    if (element.type === 'text') {
      return (
        <div
          key={element.id}
          style={style}
          onClick={(e) => handleElementClick(e, element.id)}
          onMouseDown={(e) => handleMouseDown(e, element)}
          className={`${isSelected ? 'ring-2 ring-purple-500' : ''} px-2 py-1 select-none transition-shadow`}
        >
          {element.content}
          {isSelected && (
            <>
              <div
                onMouseDown={(e) => handleResizeStart(e, element)}
                className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 border-2 border-white rounded-full cursor-se-resize"
                style={{ transform: 'translate(50%, 50%)' }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(element.id);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                style={{ transform: 'translate(50%, -50%)' }}
              >
                ×
              </button>
            </>
          )}
        </div>
      );
    }

    if (element.type === 'image') {
      return (
        <img
          key={element.id}
          src={element.content}
          alt=""
          style={style}
          onClick={(e) => handleElementClick(e, element.id)}
          onMouseDown={(e) => handleMouseDown(e, element)}
          className={`${isSelected ? 'ring-2 ring-purple-500' : ''} select-none object-cover transition-shadow`}
          draggable={false}
        />
      );
    }

    if (element.type === 'shape') {
      return (
        <div
          key={element.id}
          style={style}
          onClick={(e) => handleElementClick(e, element.id)}
          onMouseDown={(e) => handleMouseDown(e, element)}
          className={`${isSelected ? 'ring-2 ring-purple-500' : ''} select-none`}
        />
      );
    }

    return null;
  };

  return (
    <div 
      className="flex-1 flex items-center justify-center p-8 bg-gray-100 overflow-hidden min-h-0"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        id="card-canvas"
        onClick={handleCanvasClick}
        className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
        style={{
          width: 'min(90vw, 540px)',
          height: 'min(calc(90vw * 4/3), 720px)',
          aspectRatio: '3/4',
          backgroundImage: currentPage?.backgroundUrl ? `url(${currentPage.backgroundUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: currentPage?.backgroundColor || '#ffffff',
        }}
      >
        {/* 渲染所有元素 */}
        {elements.map(renderElement)}

        {/* 页面提示 */}
        {elements.length === 0 && !currentPage?.backgroundUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm pointer-events-none">
            <div className="text-center">
              <p>第 {currentCard.currentPageIndex + 1} 页</p>
              <p className="mt-1 text-xs">从左侧工具栏添加元素</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
