import { useState, useMemo, memo } from 'react';
import { useEditorStore } from '../../store';
import { CardElement } from '../../types';
import { getElementVisualStyle } from '../../lib/elementStyle';

const Canvas = memo(function Canvas() {
  const { 
    currentCard, 
    selectedElementId, 
    selectElement, 
    updateElement, 
    deleteElement,
    clearSelectedFlags
  } = useEditorStore();
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<string | null>(null);

  // 获取当前页，按 zIndex 升序排列（zIndex 越小越先渲染，显示在下层）
  const currentPage = currentCard.pages[currentCard.currentPageIndex];
  // 使用 useMemo 避免每次渲染都重新创建排序数组，减少子元素不必要的协调
  const elements = useMemo(
    () => [...(currentPage?.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [currentPage?.elements]
  );

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+Click: 切换多选标记，同时设为主选中
      const element = currentPage?.elements.find(el => el.id === elementId);
      if (element) {
        updateElement(elementId, { selected: !element.selected });
      }
      selectElement(elementId);
    } else {
      // 普通点击：清除多选标记，选中当前元素
      clearSelectedFlags();
      selectElement(elementId);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, element: CardElement) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+Click：不进入拖拽，让 click 事件处理多选切换
      return;
    }
    // 普通点击拖拽：清除多选标记，选中当前元素
    clearSelectedFlags();
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

      const clampedX = Math.max(0, Math.min(100, xPercent));
      const clampedY = Math.max(0, Math.min(100, yPercent));

      const draggedElement = elements.find(el => el.id === dragging);
      if (draggedElement?.type === 'group') {
        // 拖拽组元素：同时移动组和所有子元素
        const dx = clampedX - (draggedElement.position.x || 0);
        const dy = clampedY - (draggedElement.position.y || 0);
        const updatedChildren = (draggedElement.childElements || []).map((child) => ({
          ...child,
          position: {
            x: (child.position.x || 0) + dx,
            y: (child.position.y || 0) + dy,
          },
        }));
        updateElement(dragging, {
          position: { x: clampedX, y: clampedY },
          childElements: updatedChildren,
        });
      } else {
        updateElement(dragging, {
          position: { x: clampedX, y: clampedY },
        });
      }
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
    clearSelectedFlags();
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
    const layoutStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: element.size ? `${element.size.width}%` : 'auto',
      height: element.size ? `${element.size.height}%` : 'auto',
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      zIndex: Math.max(Math.round(element.zIndex || 1), 1),
      cursor: element.locked ? 'not-allowed' : 'move',
    };
    // 合并基础布局样式与元素视觉样式（包含形状专属的 clipPath/border 等）
    const style = getElementVisualStyle(element, layoutStyle);

    // 选中状态下的控制按钮（调整手柄 + 删除按钮）
    const selectedControls = isSelected && (
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
    );

    if (element.type === 'text') {
      return (
        <div
          key={element.id}
          id={`canvas-element-${element.id}`}
          style={style}
          onClick={(e) => handleElementClick(e, element.id)}
          onMouseDown={(e) => handleMouseDown(e, element)}
          className={`canvas-element ${isSelected ? 'ring-2 ring-purple-500' : element.selected ? 'ring-2 ring-cyan-400' : ''} px-2 py-1 select-none ${element.style.fontStyle === 'italic' ? 'italic' : ''}`}
        >
          {element.content}
          {selectedControls}
        </div>
      );
    }

    if (element.type === 'image') {
      return (
        <div
          key={element.id}
          id={`canvas-element-${element.id}`}
          style={style}
          onClick={(e) => handleElementClick(e, element.id)}
          onMouseDown={(e) => handleMouseDown(e, element)}
          className={`canvas-element ${isSelected ? 'ring-2 ring-purple-500' : element.selected ? 'ring-2 ring-cyan-400' : ''} select-none`}
        >
          <img
            src={element.content}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            draggable={false}
          />
          {selectedControls}
        </div>
      );
    }

    if (element.type === 'shape') {
      return (
        <div
          key={element.id}
          id={`canvas-element-${element.id}`}
          style={style}
          onClick={(e) => handleElementClick(e, element.id)}
          onMouseDown={(e) => handleMouseDown(e, element)}
          className={`canvas-element ${isSelected ? 'ring-2 ring-purple-500' : element.selected ? 'ring-2 ring-cyan-400' : ''} select-none`}
        >
          {selectedControls}
        </div>
      );
    }

    if (element.type === 'icon') {
      return (
        <div
          key={element.id}
          id={`canvas-element-${element.id}`}
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => handleElementClick(e, element.id)}
          onMouseDown={(e) => handleMouseDown(e, element)}
          className={`canvas-element ${isSelected ? 'ring-2 ring-purple-500' : element.selected ? 'ring-2 ring-cyan-400' : ''} select-none`}
        >
          {element.content}
          {selectedControls}
        </div>
      );
    }

    if (element.type === 'group') {
      const childElements = (element.childElements || []) as CardElement[];
      const gx = element.position.x || 0;
      const gy = element.position.y || 0;
      const gw = element.size?.width || 100;
      const gh = element.size?.height || 100;
      return (
        <div
          key={element.id}
          id={`canvas-element-${element.id}`}
          style={{
            ...style,
            border: isSelected ? '2px dashed #8b5cf6' : '1px dashed #94a3b8',
            borderRadius: '8px',
            background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'rgba(148, 163, 184, 0.05)',
            overflow: 'visible',
          }}
          onClick={(e) => handleElementClick(e, element.id)}
          onMouseDown={(e) => handleMouseDown(e, element)}
          className={`canvas-element ${isSelected ? 'ring-2 ring-purple-500' : element.selected ? 'ring-2 ring-cyan-400' : ''} select-none`}
        >
          {/* 渲染组内的子元素（按组尺寸换算百分比） */}
          {childElements.map((child) => {
            const childLayoutStyle: React.CSSProperties = {
              position: 'absolute',
              left: `${((child.position.x || 0) - gx) / gw * 100}%`,
              top: `${((child.position.y || 0) - gy) / gh * 100}%`,
              width: child.size ? `${child.size.width / gw * 100}%` : 'auto',
              height: child.size ? `${child.size.height / gh * 100}%` : 'auto',
              transform: child.rotation ? `rotate(${child.rotation}deg)` : undefined,
              zIndex: Math.max(Math.round(child.zIndex || 1), 1),
              pointerEvents: 'none',
              userSelect: 'none',
            };
            const childStyle = getElementVisualStyle(child, childLayoutStyle);

            if (child.type === 'image') {
              return (
                <img key={child.id} src={child.content} alt="" style={childStyle} className="pointer-events-none select-none object-cover" draggable={false} />
              );
            }
            if (child.type === 'shape') {
              return <div key={child.id} style={childStyle} className="pointer-events-none select-none" />;
            }
            // text / icon 等
            return (
              <div key={child.id} style={childStyle} className="pointer-events-none select-none">
                {child.content}
              </div>
            );
          })}
          {/* 组标签 */}
          {isSelected && (
            <div className="absolute -top-5 left-2">
              <span className="text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded shadow-sm">
                组合 ({element.children?.length || 0})
              </span>
            </div>
          )}
          {isSelected && (
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
          )}
        </div>
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
        className="relative bg-white shadow-2xl rounded-lg overflow-hidden will-change-transform"
        style={{
          width: 'min(90vw, 360px)',
          height: 'min(calc(90vw * 16/9), 640px)',
          aspectRatio: '9/16',
          backgroundImage: currentPage?.backgroundUrl ? `url(${currentPage.backgroundUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: currentPage?.backgroundColor || '#ffffff',
          transform: 'translateZ(0)', /* 强制 GPU 合成层，防止 paint 闪烁 */
          backfaceVisibility: 'hidden',
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
});

export default Canvas;
