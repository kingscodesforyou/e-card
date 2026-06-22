import { useState, useRef, useCallback, useEffect } from 'react';
import { Layers, Eye, EyeOff, Lock, Unlock, Trash2, GripVertical } from 'lucide-react';
import { useEditorStore } from '../../store';
import { CardElement } from '../../types';

export function LayersPanel() {
  const [expanded, setExpanded] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<{ index: number; position: 'above' | 'below' } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const debounceRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ index: number; position: 'above' | 'below' } | null>(null);
  
  const { currentCard, selectedElementId, selectElement, deleteElement, toggleVisibility, toggleLock, updateElement } = useEditorStore();

  const currentPage = currentCard.pages[currentCard.currentPageIndex];
  const elements = [...(currentPage?.elements || [])].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        cancelAnimationFrame(debounceRef.current);
      }
    };
  }, []);

  const getElementIcon = (element: CardElement) => {
    switch (element.type) {
      case 'text': return 'T';
      case 'image': return '🖼️';
      case 'shape': return '▢';
      case 'group': return '📦';
      case 'icon': return '⭐';
      default: return '◉';
    }
  };

  const getElementName = (element: CardElement) => {
    if (element.type === 'text') return element.content?.substring(0, 10) || '文字';
    if (element.type === 'shape') return element.content || '形状';
    if (element.type === 'image') return '图片';
    if (element.type === 'group') return `组合 (${element.children?.length || 0})`;
    if (element.type === 'icon') return '图标';
    return element.type;
  };

  const handleDragStart = useCallback((e: React.DragEvent, elementId: string) => {
    setDraggingId(elementId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', elementId);
    setDropPosition(null);
    setIsDragOver(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggingId || !isDragOver) return;
    
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const clientY = e.clientY;
    
    if (debounceRef.current) {
      cancelAnimationFrame(debounceRef.current);
    }
    
    debounceRef.current = requestAnimationFrame(() => {
      const allElements = currentPage?.elements || [];
      if (allElements.length === 0) return;
      
      const elementHeight = 44;
      const relativeY = clientY - rect.top;
      const itemIndex = Math.floor(relativeY / elementHeight);
      const itemOffset = (relativeY % elementHeight) / elementHeight;
      
      let targetIndex: number;
      let position: 'above' | 'below';
      
      if (itemIndex < 0) {
        targetIndex = 0;
        position = 'above';
      } else if (itemIndex >= allElements.length) {
        targetIndex = allElements.length - 1;
        position = 'below';
      } else {
        targetIndex = itemIndex;
        position = itemOffset < 0.5 ? 'above' : 'below';
      }
      
      const newPosition = { index: targetIndex, position };
      const lastPos = lastPositionRef.current;
      
      if (!lastPos || lastPos.index !== newPosition.index || lastPos.position !== newPosition.position) {
        lastPositionRef.current = newPosition;
        setDropPosition(newPosition);
      }
    });
  }, [draggingId, currentPage, isDragOver]);

  const handleDragExit = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      if (debounceRef.current) {
        cancelAnimationFrame(debounceRef.current);
      }
      setDropPosition(null);
      setIsDragOver(false);
      lastPositionRef.current = null;
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (debounceRef.current) {
      cancelAnimationFrame(debounceRef.current);
    }
    
    if (!draggingId || !dropPosition) {
      setDraggingId(null);
      setDropPosition(null);
      setIsDragOver(false);
      lastPositionRef.current = null;
      return;
    }

    const allElements = [...(currentPage?.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const draggedIdx = allElements.findIndex(el => el.id === draggingId);
    
    if (draggedIdx === -1) {
      setDraggingId(null);
      setDropPosition(null);
      setIsDragOver(false);
      lastPositionRef.current = null;
      return;
    }

    let finalTargetIndex = dropPosition.index;
    if (dropPosition.position === 'below') {
      finalTargetIndex = Math.min(finalTargetIndex + 1, allElements.length);
    }
    
    if (draggedIdx === finalTargetIndex) {
      setDraggingId(null);
      setDropPosition(null);
      setIsDragOver(false);
      lastPositionRef.current = null;
      return;
    }

    const currentMaxZIndex = Math.max(...allElements.map(el => el.zIndex || 0));
    const currentMinZIndex = Math.min(...allElements.map(el => el.zIndex || 0));
    
    let newZIndex: number;

    if (finalTargetIndex === 0) {
      newZIndex = currentMaxZIndex + 1;
    } else if (finalTargetIndex >= allElements.length) {
      newZIndex = currentMinZIndex - 1;
    } else {
      const targetElement = allElements[finalTargetIndex];
      const prevElement = allElements[finalTargetIndex - 1];
      const gap = ((targetElement.zIndex || 0) - (prevElement?.zIndex || 0)) / 2;
      
      newZIndex = (prevElement?.zIndex || 0) + gap;
    }

    updateElement(draggingId, { zIndex: newZIndex });
    
    setDraggingId(null);
    setDropPosition(null);
    setIsDragOver(false);
    lastPositionRef.current = null;
  }, [draggingId, dropPosition, currentPage, updateElement]);

  const handleDragEnd = useCallback(() => {
    if (debounceRef.current) {
      cancelAnimationFrame(debounceRef.current);
    }
    setDraggingId(null);
    setDropPosition(null);
    setIsDragOver(false);
    lastPositionRef.current = null;
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div 
        className="flex items-center justify-between cursor-pointer mb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-gray-800">图层</span>
          <span className="text-xs text-gray-400">{elements.length}</span>
        </div>
        <span className="text-xs text-gray-400">拖拽排序</span>
      </div>

      {expanded && (
        <div 
          className="space-y-0.5 max-h-64 overflow-y-auto min-h-[100px] relative"
          onDragOver={handleDragOver}
          onDragExit={handleDragExit}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        >
          {elements.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-4">暂无元素</div>
          ) : (
            elements.map((element, index) => {
              const isDragging = draggingId === element.id;
              const showLineAbove = dropPosition?.index === index && dropPosition?.position === 'above';
              const showLineBelow = dropPosition?.index === index && dropPosition?.position === 'below';
              const showLineAtEnd = dropPosition?.index === elements.length - 1 && dropPosition?.position === 'below' && index === elements.length - 1;
              
              return (
                <div key={element.id} className="relative">
                  {showLineAbove && (
                    <div 
                      className="h-1.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full mb-0.5 transition-opacity duration-150"
                      style={{ opacity: 0.9 }}
                    />
                  )}
                  
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, element.id)}
                    onClick={() => !isDragging && selectElement(element.id)}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-150
                      ${selectedElementId === element.id ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'}
                      ${isDragging ? 'opacity-50 scale-95 shadow-md' : 'shadow-sm'}
                      group
                    `}
                    style={{
                      zIndex: isDragging ? 100 : 1,
                      transition: isDragging ? 'opacity 0.15s, transform 0.15s' : 'all 0.15s'
                    }}
                  >
                    <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    <span className="text-sm w-5 text-center flex-shrink-0">
                      {getElementIcon(element)}
                    </span>
                    <span className={`flex-1 text-sm truncate ${
                      element.visible === false ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}>
                      {getElementName(element)}
                    </span>
                    
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(element.id); }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={element.visible === false ? '显示' : '隐藏'}
                      >
                        {element.visible === false ? (
                          <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLock(element.id); }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={element.locked ? '解锁' : '锁定'}
                      >
                        {element.locked ? (
                          <Lock className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteElement(element.id); }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  
                  {(showLineBelow || showLineAtEnd) && (
                    <div 
                      className="h-1.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full mt-0.5 transition-opacity duration-150"
                      style={{ opacity: 0.9 }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default LayersPanel;