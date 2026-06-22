import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Lock, Unlock, HelpCircle, RotateCcw, Crop, Wand2, ImageIcon, Type, Sparkles, Link, Move } from 'lucide-react';
import { useEditorStore } from '../../store';

const presetColors = ['#FFFFFF', '#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#87CEEB', '#800080', '#808080', '#000000'];

const shapePresets = [
  { name: '圆形', icon: 'circle' },
  { name: '直角矩形', icon: 'rect' },
  { name: '大圆角矩形', icon: 'rounded' },
  { name: '正六边形', icon: 'hexagon' },
  { name: '三角形', icon: 'triangle' },
  { name: '水滴形', icon: 'droplet' },
  { name: '不规则异形', icon: 'irregular' },
  { name: '胶囊形', icon: 'capsule' },
  { name: '不规则块', icon: 'blob' },
  { name: '拱门形', icon: 'arch' },
  { name: '横向长条', icon: 'bar' },
  { name: '云朵形', icon: 'cloud' },
  { name: '多瓣花形', icon: 'flower' },
  { name: '波浪矩形', icon: 'wave' },
];

const filters = ['原图', '清新', '鲜明', '星光闪闪'];
const moreFilters = ['鲜暖色', '质感', '落樱', '暗调'];

const PropertyPanel = () => {
  const { currentCard, selectedElementId, updateElement } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'style' | 'animation' | 'trigger'>('style');
  const [expandedSections, setExpandedSections] = useState({
    function: true,
    border: false,
    shadow: false,
    size: false,
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const currentPage = currentCard.pages[currentCard.currentPageIndex];
  const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const StyleTab = () => {
    if (!selectedElement) {
      return (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">选择一个元素以编辑其属性</p>
        </div>
      );
    }

    if (selectedElement.type === 'image') {
      return (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 h-32 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
                {selectedElement.content ? (
                  <img src={selectedElement.content} alt="" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50">
                <ImageIcon className="w-4 h-4" />
                换图
              </button>
              <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50">
                <Crop className="w-4 h-4" />
                裁切
              </button>
              <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-2 hover:bg-gray-50">
                <Wand2 className="w-4 h-4" />
                抠图
              </button>
            </div>
          </div>

          <div>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {shapePresets.map((shape, index) => (
                <button
                  key={index}
                  className="flex-shrink-0 w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50"
                  title={shape.name}
                >
                  {shape.icon === 'circle' && <div className="w-6 h-6 rounded-full border-2 border-gray-400" />}
                  {shape.icon === 'rect' && <div className="w-6 h-4 bg-gray-200 rounded" />}
                  {shape.icon === 'rounded' && <div className="w-6 h-4 bg-gray-200 rounded-lg" />}
                  {shape.icon === 'hexagon' && <div className="w-5 h-5 bg-gray-200" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />}
                  {shape.icon === 'triangle' && <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] border-l-transparent border-r-transparent border-b-gray-400" />}
                  {shape.icon === 'droplet' && <div className="w-5 h-6 bg-gray-200 rounded-full" style={{ borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%' }} />}
                  {shape.icon === 'capsule' && <div className="w-6 h-3 bg-gray-200 rounded-full" />}
                  {shape.icon === 'cloud' && <div className="w-7 h-4 bg-gray-200 rounded-full flex" style={{ transform: 'scale(0.8)' }} />}
                </button>
              ))}
              <button className="flex-shrink-0 w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 text-gray-500">
                ...
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">图片翻转</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-600">左右翻转</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-600">上下翻转</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">背景颜色</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  defaultValue=""
                />
                <button className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50">
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">滤镜</label>
                <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  更多 <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                {filters.map((filter, index) => (
                  <button
                    key={index}
                    className={`flex-1 h-16 rounded-lg border-2 flex flex-col items-center justify-center ${
                      index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded ${index === 0 ? 'bg-gray-300' : 'bg-gray-200'}`} />
                    <span className="text-xs mt-1 text-gray-600">{filter}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">透明度</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(selectedElement.style.opacity || 1) * 100}
                  onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, opacity: Number(e.target.value) / 100 } })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12 text-right">{Math.round((selectedElement.style.opacity || 1) * 100)}%</span>
              </div>
            </div>

            <button
              className="w-full py-2 border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50"
              onClick={() => setShowAdvancedSettings(true)}
            >
              更多高级设置
            </button>

            <button
              className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2"
              onClick={() => toggleSection('function')}
            >
              <span className="text-sm font-medium text-gray-700">功能设置</span>
              {expandedSections.function ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSections.function && (
              <div className="space-y-3 pl-4 pb-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">点击跳转</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option>无</option>
                    <option>链接</option>
                    <option>页面</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">重力感应</span>
                  <button className="w-12 h-6 rounded-full bg-gray-200 relative">
                    <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">设为变量</span>
                    <HelpCircle className="w-3 h-3 text-gray-400" />
                  </div>
                  <button className="w-12 h-6 rounded-full bg-gray-200 relative">
                    <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">查看原图</span>
                    <HelpCircle className="w-3 h-3 text-gray-400" />
                  </div>
                  <button className="w-12 h-6 rounded-full bg-gray-200 relative">
                    <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
              </div>
            )}

            <button
              className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2"
              onClick={() => toggleSection('border')}
            >
              <span className="text-sm font-medium text-gray-700">边框</span>
              {expandedSections.border ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSections.border && (
              <div className="space-y-3 pl-4 pb-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">边框样式</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option>直线</option>
                    <option>虚线</option>
                    <option>点线</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">边框颜色</label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 border border-gray-200 rounded" />
                    <div className="flex gap-1">
                      {presetColors.map((color, index) => (
                        <button
                          key={index}
                          className="w-5 h-5 rounded border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">边框尺寸</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min="0" max="20" value={selectedElement.style.borderWidth || 0} className="flex-1" />
                    <input type="number" min="0" max="20" value={selectedElement.style.borderWidth || 0} className="w-16 px-2 py-1 border border-gray-200 rounded text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">圆角</label>
                  <div className="flex items-center gap-2">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <input type="number" placeholder="左上" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue={selectedElement.style.borderRadius || 0} />
                      <input type="number" placeholder="右上" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue={selectedElement.style.borderRadius || 0} />
                      <input type="number" placeholder="左下" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue={selectedElement.style.borderRadius || 0} />
                      <input type="number" placeholder="右下" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue={selectedElement.style.borderRadius || 0} />
                    </div>
                    <button className="p-1 border border-gray-200 rounded">
                      {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2"
              onClick={() => toggleSection('shadow')}
            >
              <span className="text-sm font-medium text-gray-700">阴影</span>
              {expandedSections.shadow ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSections.shadow && (
              <div className="space-y-4 pl-4 pb-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">外阴影</label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-black rounded" />
                    <div className="flex gap-1">
                      {presetColors.map((color, index) => (
                        <button key={index} className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">横向</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">纵向</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">模糊</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">内阴影</label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gray-400 rounded" />
                    <div className="flex gap-1">
                      {presetColors.map((color, index) => (
                        <button key={index} className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">横向</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">纵向</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">模糊</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2"
              onClick={() => toggleSection('size')}
            >
              <span className="text-sm font-medium text-gray-700">尺寸与位置</span>
              {expandedSections.size ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSections.size && (
              <div className="space-y-3 pl-4 pb-2">
                <div className="flex gap-1">
                  {['left', 'center', 'right', 'top', 'middle', 'bottom'].map((align) => (
                    <button key={align} className="flex-1 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50">
                      {align === 'left' && <span className="text-xs">←</span>}
                      {align === 'center' && <span className="text-xs">⊜</span>}
                      {align === 'right' && <span className="text-xs">→</span>}
                      {align === 'top' && <span className="text-xs">↑</span>}
                      {align === 'middle' && <span className="text-xs">⊕</span>}
                      {align === 'bottom' && <span className="text-xs">↓</span>}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">宽</label>
                    <input
                      type="number"
                      value={selectedElement.size?.width || 0}
                      onChange={(e) => updateElement(selectedElementId, { size: { ...selectedElement.size, width: Number(e.target.value) } })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">高</label>
                    <input
                      type="number"
                      value={selectedElement.size?.height || 0}
                      onChange={(e) => updateElement(selectedElementId, { size: { ...selectedElement.size, height: Number(e.target.value) } })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={selectedElement.position.x}
                      onChange={(e) => updateElement(selectedElementId, { position: { ...selectedElement.position, x: Number(e.target.value) } })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={selectedElement.position.y}
                      onChange={(e) => updateElement(selectedElementId, { position: { ...selectedElement.position, y: Number(e.target.value) } })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">旋转</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={selectedElement.rotation || 0}
                      onChange={(e) => updateElement(selectedElementId, { rotation: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12 text-right">{selectedElement.rotation || 0}°</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (selectedElement.type === 'text') {
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">字体样式</label>
              <button className="text-sm text-blue-600 hover:text-blue-700">更多字体 &gt;</button>
            </div>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2">
              <option>字语飞扬行书</option>
              <option>宋体</option>
              <option>黑体</option>
              <option>楷体</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">字号</label>
              <button className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50">
                <span className="text-lg font-bold">A⁺</span>
              </button>
              <input
                type="number"
                min="12"
                max="120"
                value={selectedElement.style.fontSize || 56}
                onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, fontSize: Number(e.target.value) } })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center"
              />
              <button className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50">
                <span className="text-lg font-bold">A⁻</span>
              </button>
              <div className="w-10 h-10 border border-gray-200 rounded" style={{ backgroundColor: selectedElement.style.color || '#FFD700' }} />
              <button className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-1">
            {['标题1', '标题2', '标题3', '正文'].map((style, index) => (
              <button
                key={index}
                className={`flex-1 py-2 px-3 rounded-lg text-sm ${index === 0 ? 'bg-blue-500 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {style}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex gap-1">
              {['B', 'I', 'U', 'S', 'align', 'spacing', 'fill'].map((btn, index) => (
                <button key={index} className="flex-1 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50">
                  {btn === 'B' && <span className="font-bold">B</span>}
                  {btn === 'I' && <span className="italic">I</span>}
                  {btn === 'U' && <span className="underline">U</span>}
                  {btn === 'S' && <span className="line-through">S</span>}
                  {btn === 'align' && <span className="text-xs">⊜</span>}
                  {btn === 'spacing' && <span className="text-xs">A A</span>}
                  {btn === 'fill' && <span className="text-xs">AB</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {['indent', 'sub', 'super', 'edit'].map((btn, index) => (
                <button key={index} className="flex-1 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50">
                  {btn === 'indent' && <span className="text-xs">¶</span>}
                  {btn === 'sub' && <span className="text-xs">Aₓ</span>}
                  {btn === 'super' && <span className="text-xs">Aˣ</span>}
                  {btn === 'edit' && <span className="text-xs">✏</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">透明度</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement.style.opacity || 1) * 100}
                onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, opacity: Number(e.target.value) / 100 } })}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12 text-right">{Math.round((selectedElement.style.opacity || 1) * 100)}%</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2"
              onClick={() => toggleSection('function')}
            >
              <span className="text-sm font-medium text-gray-700">功能设置</span>
              {expandedSections.function ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSections.function && (
              <div className="pl-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">设为变量</span>
                    <HelpCircle className="w-3 h-3 text-gray-400" />
                  </div>
                  <button className="w-12 h-6 rounded-full bg-gray-200 relative">
                    <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
              </div>
            )}

            <button
              className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2"
              onClick={() => toggleSection('border')}
            >
              <span className="text-sm font-medium text-gray-700">边框</span>
              {expandedSections.border ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSections.border && (
              <div className="space-y-3 pl-4 pb-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">边框样式</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option>直线</option>
                    <option>虚线</option>
                    <option>点线</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">边框颜色</label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 border border-gray-200 rounded" />
                    <div className="flex gap-1">
                      {presetColors.map((color, index) => (
                        <button key={index} className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">边框尺寸</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min="0" max="20" value={selectedElement.style.borderWidth || 0} className="flex-1" />
                    <input type="number" min="0" max="20" value={selectedElement.style.borderWidth || 0} className="w-16 px-2 py-1 border border-gray-200 rounded text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">圆角</label>
                  <div className="flex items-center gap-2">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <input type="number" placeholder="左上" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue={selectedElement.style.borderRadius || 0} />
                      <input type="number" placeholder="右上" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue={selectedElement.style.borderRadius || 0} />
                      <input type="number" placeholder="左下" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue={selectedElement.style.borderRadius || 0} />
                      <input type="number" placeholder="右下" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue={selectedElement.style.borderRadius || 0} />
                    </div>
                    <button className="p-1 border border-gray-200 rounded">
                      {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2"
              onClick={() => toggleSection('shadow')}
            >
              <span className="text-sm font-medium text-gray-700">阴影</span>
              {expandedSections.shadow ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSections.shadow && (
              <div className="space-y-4 pl-4 pb-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">外阴影</label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-black rounded" />
                    <div className="flex gap-1">
                      {presetColors.map((color, index) => (
                        <button key={index} className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">横向</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">纵向</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">模糊</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">内阴影</label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gray-400 rounded" />
                    <div className="flex gap-1">
                      {presetColors.map((color, index) => (
                        <button key={index} className="w-4 h-4 rounded border border-gray-200" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">横向</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">纵向</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">模糊</label>
                      <input type="number" className="w-full px-2 py-1 border border-gray-200 rounded text-sm" defaultValue="0" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 rounded-lg px-2"
              onClick={() => toggleSection('size')}
            >
              <span className="text-sm font-medium text-gray-700">尺寸与位置</span>
              {expandedSections.size ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            {expandedSections.size && (
              <div className="space-y-3 pl-4 pb-2">
                <div className="flex gap-1">
                  {['left', 'center', 'right', 'top', 'middle', 'bottom'].map((align) => (
                    <button key={align} className="flex-1 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50">
                      {align === 'left' && <span className="text-xs">←</span>}
                      {align === 'center' && <span className="text-xs">⊜</span>}
                      {align === 'right' && <span className="text-xs">→</span>}
                      {align === 'top' && <span className="text-xs">↑</span>}
                      {align === 'middle' && <span className="text-xs">⊕</span>}
                      {align === 'bottom' && <span className="text-xs">↓</span>}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">宽</label>
                    <input
                      type="number"
                      value={selectedElement.size?.width || 0}
                      onChange={(e) => updateElement(selectedElementId, { size: { ...selectedElement.size, width: Number(e.target.value) } })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">高</label>
                    <input
                      type="number"
                      value={selectedElement.size?.height || 0}
                      onChange={(e) => updateElement(selectedElementId, { size: { ...selectedElement.size, height: Number(e.target.value) } })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">X</label>
                    <input
                      type="number"
                      value={selectedElement.position.x}
                      onChange={(e) => updateElement(selectedElementId, { position: { ...selectedElement.position, x: Number(e.target.value) } })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Y</label>
                    <input
                      type="number"
                      value={selectedElement.position.y}
                      onChange={(e) => updateElement(selectedElementId, { position: { ...selectedElement.position, y: Number(e.target.value) } })}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">旋转</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={selectedElement.rotation || 0}
                      onChange={(e) => updateElement(selectedElementId, { rotation: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12 text-right">{selectedElement.rotation || 0}°</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">文字内容</label>
          <textarea
            value={selectedElement.content}
            onChange={(e) => updateElement(selectedElementId, { content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">位置</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">X</label>
              <input
                type="number"
                value={selectedElement.position.x}
                onChange={(e) => updateElement(selectedElementId, { position: { ...selectedElement.position, x: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Y</label>
              <input
                type="number"
                value={selectedElement.position.y}
                onChange={(e) => updateElement(selectedElementId, { position: { ...selectedElement.position, y: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">高度</label>
              <input
                type="number"
                value={selectedElement.size?.height || 0}
                onChange={(e) => updateElement(selectedElementId, { size: { ...selectedElement.size, height: Number(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>
    );
  };

  const AnimationTab = () => {
    return (
      <div className="space-y-4 p-4">
        {!selectedElement ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">选择一个元素以设置动画</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">动画类型</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option>无</option>
                <option>淡入</option>
                <option>缩放</option>
                <option>旋转</option>
                <option>滑动</option>
                <option>弹跳</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">动画时长</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0.1" max="5" step="0.1" defaultValue="1" className="flex-1" />
                <span className="text-sm text-gray-600">1秒</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">延迟时间</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="5" step="0.1" defaultValue="0" className="flex-1" />
                <span className="text-sm text-gray-600">0秒</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">重复次数</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option>1次</option>
                <option>2次</option>
                <option>3次</option>
                <option>无限</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">循环播放</span>
              <button className="w-12 h-6 rounded-full bg-gray-200 relative">
                <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const TriggerTab = () => {
    return (
      <div className="space-y-4 p-4">
        {!selectedElement ? (
          <div className="text-center py-8">
            <Link className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">选择一个元素以设置触发条件</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">触发方式</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option>无</option>
                <option>点击</option>
                <option>进入页面</option>
                <option>离开页面</option>
                <option>定时</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">触发动作</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option>无</option>
                <option>播放动画</option>
                <option>跳转页面</option>
                <option>播放音频</option>
                <option>显示/隐藏</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">跳转目标</label>
              <input type="text" placeholder="输入页面ID或链接" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">单次触发</span>
              <button className="w-12 h-6 rounded-full bg-blue-500 relative">
                <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const AdvancedSettings = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-gray-200">
            <button onClick={() => setShowAdvancedSettings(false)} className="p-1 hover:bg-gray-100 rounded">
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="font-medium">高级设置</span>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">滤镜</label>
              <div className="grid grid-cols-4 gap-2">
                {[...filters, ...moreFilters].map((filter, index) => (
                  <button
                    key={index}
                    className={`h-12 rounded-lg border-2 flex flex-col items-center justify-center ${
                      index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded ${index === 0 ? 'bg-gray-300' : 'bg-gray-200'}`} />
                    <span className="text-xs mt-1 text-gray-600">{filter}</span>
                  </button>
                ))}
              </div>
              <button className="w-full mt-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                更多滤镜
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">透明度</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="100" defaultValue="53" className="flex-1" />
                <span className="text-sm text-gray-600">53%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">亮度</label>
              <div className="flex items-center gap-2">
                <input type="range" min="-100" max="100" defaultValue="37" className="flex-1" />
                <span className="text-sm text-gray-600">37</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">对比度</label>
              <div className="flex items-center gap-2">
                <input type="range" min="-100" max="100" defaultValue="0" className="flex-1" />
                <span className="text-sm text-gray-600">0</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">饱和度</label>
              <div className="flex items-center gap-2">
                <input type="range" min="-100" max="100" defaultValue="0" className="flex-1" />
                <span className="text-sm text-gray-600">0</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">色调</label>
              <div className="flex items-center gap-2">
                <input type="range" min="-180" max="180" defaultValue="0" className="flex-1" />
                <span className="text-sm text-gray-600">0</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">模糊</label>
              <div className="flex items-center gap-2">
                <input type="range" min="0" max="50" defaultValue="0" className="flex-1" />
                <span className="text-sm text-gray-600">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-800">组件设置</span>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { key: 'style', label: '样式' },
          { key: 'animation', label: '动画' },
          { key: 'trigger', label: '触发' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-3 text-sm font-medium relative ${
              activeTab === tab.key ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[700px] p-4">
        {activeTab === 'style' && <StyleTab />}
        {activeTab === 'animation' && <AnimationTab />}
        {activeTab === 'trigger' && <TriggerTab />}
      </div>

      {showAdvancedSettings && <AdvancedSettings />}
    </div>
  );
};

export default PropertyPanel;