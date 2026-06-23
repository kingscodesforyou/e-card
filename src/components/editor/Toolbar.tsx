import { Type, ImageIcon, Sparkles, Trash2, Square, Circle as CircleIcon, Undo2, Redo2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ChevronsLeftRight, ChevronsUpDown, Triangle, Minus, ArrowRight as ArrowRightIcon, Star, Copy, Group, Ungroup, Layers } from 'lucide-react';
import { useState } from 'react';
import { useEditorStore } from '../../store';
import { SHAPE_CONTENT } from '../../lib/elementStyle';

const Toolbar = () => {
  const { selectedElementId, deleteElement, currentCard, updateElement, undo, redo, canUndo, canRedo, bringToFront, sendToBack, bringForward, sendBackward, groupElements, ungroupElement } = useEditorStore();
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const currentPage = currentCard.pages[currentCard.currentPageIndex];
    if (!selectedElementId || !currentPage) return;

    const selectedElement = currentPage.elements.find(el => el.id === selectedElementId);
    if (!selectedElement) return;

    let newPosition = { ...selectedElement.position };

    switch (alignment) {
      case 'left':
        newPosition.x = 0;
        break;
      case 'center':
        newPosition.x = 50 - (selectedElement.size?.width || 0) / 2;
        break;
      case 'right':
        newPosition.x = 100 - (selectedElement.size?.width || 0);
        break;
      case 'top':
        newPosition.y = 0;
        break;
      case 'middle':
        newPosition.y = 50 - (selectedElement.size?.height || 0) / 2;
        break;
      case 'bottom':
        newPosition.y = 100 - (selectedElement.size?.height || 0);
        break;
    }

    updateElement(selectedElementId, { position: newPosition });
  };

  const addText = () => {
    useEditorStore.getState().addElement({
      type: 'text',
      content: '双击编辑文字',
      position: { x: 30, y: 40 },
      size: { width: 40, height: 10 },
      style: {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#333333',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
      },
    });
  };

  const compressImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new (window as any).Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const base64 = canvas.toDataURL(mimeType, quality);
          resolve(base64);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        }
      };
      img.onerror = () => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const compressedBase64 = await compressImage(file);
        useEditorStore.getState().addElement({
          type: 'image',
          content: compressedBase64,
          position: { x: 20, y: 20 },
          size: { width: 60, height: 40 },
          style: {},
        });
      } catch (error) {
        console.error('图片压缩失败:', error);
        // 压缩失败时使用原始图片
        const reader = new FileReader();
        reader.onload = (event) => {
          useEditorStore.getState().addElement({
            type: 'image',
            content: event.target?.result as string,
            position: { x: 20, y: 20 },
            size: { width: 60, height: 40 },
            style: {},
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'star';

  const addShape = (shape: ShapeType) => {
    const baseStyle = {
      backgroundColor: '#8B5CF6',
      borderRadius: shape === 'circle' ? 50 : 0,
    };

    const shapeConfigs: Record<ShapeType, { size: { width: number; height: number }; style: Record<string, unknown> }> = {
      rectangle: {
        size: { width: 30, height: 30 },
        style: { ...baseStyle, borderRadius: 0 },
      },
      circle: {
        size: { width: 30, height: 30 },
        style: { ...baseStyle, borderRadius: 50 },
      },
      triangle: {
        size: { width: 30, height: 30 },
        style: {
          backgroundColor: 'transparent',
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderBottom: '26px solid #8B5CF6',
        },
      },
      line: {
        size: { width: 50, height: 2 },
        style: {
          backgroundColor: '#8B5CF6',
          borderRadius: 1,
        },
      },
      arrow: {
        size: { width: 30, height: 20 },
        style: {
          backgroundColor: 'transparent',
          borderLeft: '15px solid #8B5CF6',
          borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent',
        },
      },
      star: {
        size: { width: 30, height: 30 },
        style: {
          backgroundColor: '#8B5CF6',
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        },
      },
    };

    const config = shapeConfigs[shape];
    useEditorStore.getState().addElement({
      type: 'shape',
      content: SHAPE_CONTENT[shape],
      position: { x: 35, y: 35 },
      size: config.size,
      style: config.style as any,
    });
  };

  const addIcon = () => {
    useEditorStore.getState().addElement({
      type: 'icon',
      content: '⭐',
      position: { x: 40, y: 40 },
      size: { width: 20, height: 20 },
      style: {
        fontSize: 48,
        textAlign: 'center',
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* 撤销/重做 */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={`p-3 rounded-xl transition-all ${
              canUndo()
                ? 'hover:bg-gray-50 text-gray-600 hover:text-gray-800'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className={`p-3 rounded-xl transition-all ${
              canRedo()
                ? 'hover:bg-gray-50 text-gray-600 hover:text-gray-800'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="重做 (Ctrl+Y)"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        {/* 添加元素 */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
          <button
            onClick={addText}
            className="p-3 rounded-xl hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all"
            title="添加文字"
          >
            <Type className="w-5 h-5" />
          </button>
          <button
            onClick={addImage}
            className="p-3 rounded-xl hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all"
            title="添加图片（自动压缩）"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <button
            onClick={addIcon}
            className="p-3 rounded-xl hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all"
            title="添加表情/图标"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* 形状 */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-200 relative">
          <button
            onClick={() => setShowShapeMenu(!showShapeMenu)}
            className="p-3 rounded-xl hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all flex items-center gap-1"
            title="形状菜单"
          >
            <Square className="w-5 h-5" />
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showShapeMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={() => { addShape('rectangle'); setShowShapeMenu(false); }}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
              >
                <Square className="w-4 h-4 text-gray-500" />
                <span>矩形</span>
              </button>
              <button
                onClick={() => { addShape('circle'); setShowShapeMenu(false); }}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
              >
                <CircleIcon className="w-4 h-4 text-gray-500" />
                <span>圆形</span>
              </button>
              <button
                onClick={() => { addShape('triangle'); setShowShapeMenu(false); }}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
              >
                <Triangle className="w-4 h-4 text-gray-500" />
                <span>三角形</span>
              </button>
              <button
                onClick={() => { addShape('line'); setShowShapeMenu(false); }}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
              >
                <Minus className="w-4 h-4 text-gray-500" />
                <span>线条</span>
              </button>
              <button
                onClick={() => { addShape('arrow'); setShowShapeMenu(false); }}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
              >
                <ArrowRightIcon className="w-4 h-4 text-gray-500" />
                <span>箭头</span>
              </button>
              <button
                onClick={() => { addShape('star'); setShowShapeMenu(false); }}
                className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
              >
                <Star className="w-4 h-4 text-gray-500" />
                <span>星形</span>
              </button>
            </div>
          )}
        </div>

        {/* 对齐工具 */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handleAlign('top')}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="顶部对齐"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAlign('middle')}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="垂直居中"
            >
              <ChevronsUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="底部对齐"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handleAlign('left')}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="左对齐"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAlign('center')}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="水平居中"
            >
              <ChevronsLeftRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAlign('right')}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="右对齐"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 图层与组合操作 */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => selectedElementId && bringToFront(selectedElementId)}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="置顶 (Ctrl+Shift+])"
            >
              <Layers className="w-3 h-3" />
            </button>
            <button
              onClick={() => selectedElementId && sendToBack(selectedElementId)}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="置底 (Ctrl+Shift+[)"
            >
              <Layers className="w-3 h-3 rotate-180" />
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => selectedElementId && bringForward(selectedElementId)}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="上移一层 (Ctrl+])"
            >
              <ChevronsUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => selectedElementId && sendBackward(selectedElementId)}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="下移一层 (Ctrl+[)"
            >
              <ChevronsUpDown className="w-3 h-3 rotate-180" />
            </button>
          </div>
          <button
            onClick={() => {
              if (!selectedElementId) return;
              const currentPage = currentCard.pages[currentCard.currentPageIndex];
              if (!currentPage) return;
              const selected = currentPage.elements.find(el => el.id === selectedElementId);
              if (selected?.type === 'group') {
                ungroupElement(selectedElementId);
              } else {
                const multiSelected = currentPage.elements.filter(el => el.selected);
                if (multiSelected.length >= 2) {
                  groupElements(multiSelected.map(el => el.id));
                }
              }
            }}
            disabled={(() => {
              if (!selectedElementId) return true;
              const currentPage = currentCard.pages[currentCard.currentPageIndex];
              if (!currentPage) return true;
              const selected = currentPage.elements.find(el => el.id === selectedElementId);
              if (selected?.type === 'group') return false;
              const count = currentPage.elements.filter(el => el.selected).length;
              return count < 2;
            })()}
            className={`p-3 rounded-xl transition-all ${
              selectedElementId
                ? 'hover:bg-orange-50 text-gray-600 hover:text-orange-600'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={(() => {
              const currentPage = currentCard.pages[currentCard.currentPageIndex];
              const selected = currentPage?.elements.find(el => el.id === selectedElementId);
              if (selected?.type === 'group') return '拆分组合 (Ctrl+Shift+G)';
              const count = currentPage?.elements.filter(el => el.selected).length || 0;
              return count >= 2 ? `组合选中的 ${count} 个元素 (Ctrl+G)` : '组合选中元素 (Ctrl+G)';
            })()}
          >
            <Group className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (!selectedElementId) return;
              const currentPage = currentCard.pages[currentCard.currentPageIndex];
              const el = currentPage?.elements.find(e => e.id === selectedElementId);
              if (!el) return;
              useEditorStore.getState().addElement({
                ...el,
                position: { x: el.position.x + 3, y: el.position.y + 3 },
                selected: false,
              });
            }}
            disabled={!selectedElementId}
            className={`p-3 rounded-xl transition-all ${
              selectedElementId
                ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="复制元素 (Ctrl+D)"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        {/* 删除 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => deleteElement(selectedElementId!)}
            disabled={!selectedElementId}
            className={`p-3 rounded-xl transition-all ${
              selectedElementId
                ? 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="删除选中元素"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
