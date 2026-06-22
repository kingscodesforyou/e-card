import { Palette, Type, ImageIcon, Square, Sparkles } from 'lucide-react';
import { useEditorStore } from '../../store';
import { CardElement } from '../../types';

const PropertyPanel = () => {
  const { currentCard, selectedElementId, updateElement } = useEditorStore();
  
  const currentPage = currentCard.pages[currentCard.currentPageIndex];
  const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
        <Palette className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-medium text-gray-800">属性</span>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {!selectedElement ? (
            <div className="text-center py-8">
              <Palette className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">选择一个元素以编辑其属性</p>
            </div>
        ) : (
            <>
              {selectedElement.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">文字内容</label>
                    <textarea
                      value={selectedElement.content}
                      onChange={(e) => updateElement(selectedElementId, { content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">字体大小</label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={selectedElement.style.fontSize || 24}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, fontSize: Number(e.target.value) } })}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{selectedElement.style.fontSize || 24}px</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">字体颜色</label>
                    <input
                      type="color"
                      value={selectedElement.style.color || '#333333'}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, color: e.target.value } })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">字体粗细</label>
                    <select
                      value={selectedElement.style.fontWeight || 'normal'}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, fontWeight: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="normal">正常</option>
                      <option value="bold">粗体</option>
                      <option value="lighter">细体</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">对齐方式</label>
                    <select
                      value={selectedElement.style.textAlign || 'center'}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, textAlign: e.target.value } })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                  </div>
                </>
              )}

              {selectedElement.type === 'image' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">透明度</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(selectedElement.style.opacity || 1) * 100}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, opacity: Number(e.target.value) / 100 } })}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{Math.round((selectedElement.style.opacity || 1) * 100)}%</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">圆角</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={selectedElement.style.borderRadius || 0}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderRadius: Number(e.target.value) } })}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{selectedElement.style.borderRadius || 0}%</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">边框</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="宽度"
                        value={selectedElement.style.borderWidth || 0}
                        onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderWidth: Number(e.target.value) } })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <input
                        type="color"
                        value={selectedElement.style.borderColor || '#000000'}
                        onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderColor: e.target.value } })}
                        className="w-16 h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedElement.type === 'shape' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">填充颜色</label>
                    <input
                      type="color"
                      value={selectedElement.style.backgroundColor || '#8B5CF6'}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, backgroundColor: e.target.value } })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">边框</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        placeholder="宽度"
                        value={selectedElement.style.borderWidth || 0}
                        onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderWidth: Number(e.target.value) } })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <input
                        type="color"
                        value={selectedElement.style.borderColor || '#000000'}
                        onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderColor: e.target.value } })}
                        className="w-16 h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">圆角</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={selectedElement.style.borderRadius || 0}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderRadius: Number(e.target.value) } })}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{selectedElement.style.borderRadius || 0}%</span>
                  </div>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">位置</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={selectedElement.position.x}
                      onChange={(e) => updateElement(selectedElementId, { position: { ...selectedElement.position, x: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={selectedElement.position.y}
                      onChange={(e) => updateElement(selectedElementId, { position: { ...selectedElement.position, y: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">尺寸</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">宽度</label>
                    <input
                      type="number"
                      value={selectedElement.size?.width || 0}
                      onChange={(e) => updateElement(selectedElementId, { size: { ...selectedElement.size, width: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">高度</label>
                    <input
                      type="number"
                      value={selectedElement.size?.height || 0}
                      onChange={(e) => updateElement(selectedElementId, { size: { ...selectedElement.size, height: Number(e.target.value) } })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">旋转</label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedElement.rotation || 0}
                  onChange={(e) => updateElement(selectedElementId, { rotation: Number(e.target.value) })}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{selectedElement.rotation || 0}°</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">透明度</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(selectedElement.style.opacity || 1) * 100}
                  onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, opacity: Number(e.target.value) / 100 } })}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{Math.round((selectedElement.style.opacity || 1) * 100)}%</span>
              </div>
            </>
        )}
      </div>
    </div>
  );
};

export default PropertyPanel;
