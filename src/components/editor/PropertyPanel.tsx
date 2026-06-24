import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronDown, ChevronRight, Lock, Unlock, HelpCircle, RotateCcw, Crop, Wand2, ImageIcon, Type, Sparkles, Link, Move, Search, Plus, Play, Trash2, GripVertical, ArrowUp, ArrowDown, ChevronUp } from 'lucide-react';
import { useEditorStore } from '../../store';
import { getFontDatabase, FONT_CATEGORIES, searchFonts, loadFontDatabase, type FontInfo, type FontCategory } from '../../lib/fonts';
import type { ElementAnimation, CardElement } from '../../types';


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
  const { currentCard, selectedElementId, updateElement, addAnimation, removeAnimation, updateAnimation, reorderAnimations } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'style' | 'animation' | 'trigger'>('style');
  const [expandedSections, setExpandedSections] = useState({
    function: true,
    border: false,
    shadow: false,
    size: false,
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // 加载字体数据库
  useEffect(() => {
    loadFontDatabase();
  }, []);

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
                    <input
                      type="color"
                      value={(() => {
                        const bs = selectedElement.style.boxShadow || '';
                        if (bs.startsWith('inset ')) return '#000000';
                        const m = bs.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
                        return m?.[1] || '#000000';
                      })()}
                      onChange={(e) => {
                        const color = e.target.value;
                        const cur = selectedElement.style.boxShadow || '';
                        if (cur.startsWith('inset ')) return;
                        const rest = cur.replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '').trim();
                        updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: rest ? `${rest} ${color}` : `2px 2px 4px ${color}` } });
                      }}
                      className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {presetColors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const cur = selectedElement.style.boxShadow || '';
                            if (cur.startsWith('inset ')) return;
                            const rest = cur.replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '').trim();
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: rest ? `${rest} ${color}` : `2px 2px 4px ${color}` } });
                          }}
                          className="w-4 h-4 rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">横向</label>
                      <input
                        type="number"
                        value={(() => {
                          const bs = selectedElement.style.boxShadow || '';
                          if (bs.startsWith('inset ')) return 0;
                          const m = bs.match(/(-?\d+)px/);
                          return m ? parseInt(m[1]) : 0;
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const bs = selectedElement.style.boxShadow || '0px 0px 0px #000';
                          if (bs.startsWith('inset ')) {
                            const parts = bs.split(' ');
                            parts[1] = `${v}px`;
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                          } else {
                            const parts = bs.split(' ');
                            parts[0] = `${v}px`;
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">纵向</label>
                      <input
                        type="number"
                        value={(() => {
                          const bs = selectedElement.style.boxShadow || '0px 0px 0px #000';
                          if (bs.startsWith('inset ')) return parseInt(bs.split(' ')[1] || '0');
                          return parseInt(bs.split(' ')[1] || '0');
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const bs = selectedElement.style.boxShadow || '0px 0px 0px #000';
                          if (bs.startsWith('inset ')) {
                            const parts = bs.split(' ');
                            parts[2] = `${v}px`;
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                          } else {
                            const parts = bs.split(' ');
                            parts[1] = `${v}px`;
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">模糊</label>
                      <input
                        type="number"
                        value={(() => {
                          const bs = selectedElement.style.boxShadow || '0px 0px 0px #000';
                          if (bs.startsWith('inset ')) return parseInt(bs.split(' ')[2] || '0');
                          return parseInt(bs.split(' ')[2] || '0');
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const bs = selectedElement.style.boxShadow || '0px 0px 0px #000';
                          if (bs.startsWith('inset ')) {
                            const parts = bs.split(' ');
                            parts[3] = `${v}px`;
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                          } else {
                            const parts = bs.split(' ');
                            parts[2] = `${v}px`;
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">内阴影</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={(() => {
                        const bs = selectedElement.style.boxShadow || '';
                        if (!bs.startsWith('inset ')) return '#000000';
                        const m = bs.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
                        return m?.[1] || '#000000';
                      })()}
                      onChange={(e) => {
                        const color = e.target.value;
                        const cur = selectedElement.style.boxShadow || '';
                        if (!cur.startsWith('inset ')) {
                          updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: `inset 2px 2px 4px ${color}` } });
                          return;
                        }
                        const rest = cur.replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '').trim();
                        updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: rest ? `${rest} ${color}` : `inset 2px 2px 4px ${color}` } });
                      }}
                      className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {presetColors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const cur = selectedElement.style.boxShadow || '';
                            if (!cur.startsWith('inset ')) {
                              updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: `inset 2px 2px 4px ${color}` } });
                              return;
                            }
                            const rest = cur.replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '').trim();
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: rest ? `${rest} ${color}` : `inset 2px 2px 4px ${color}` } });
                          }}
                          className="w-4 h-4 rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">横向</label>
                      <input
                        type="number"
                        value={(() => {
                          const bs = selectedElement.style.boxShadow || 'inset 0px 0px 0px #000';
                          if (!bs.startsWith('inset ')) return 0;
                          return parseInt(bs.split(' ')[1] || '0');
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const bs = selectedElement.style.boxShadow || 'inset 0px 0px 0px #000';
                          if (!bs.startsWith('inset ')) {
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: `inset ${v}px 0px 0px #000000` } });
                            return;
                          }
                          const parts = bs.split(' ');
                          parts[1] = `${v}px`;
                          updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">纵向</label>
                      <input
                        type="number"
                        value={(() => {
                          const bs = selectedElement.style.boxShadow || 'inset 0px 0px 0px #000';
                          if (!bs.startsWith('inset ')) return 0;
                          return parseInt(bs.split(' ')[2] || '0');
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const bs = selectedElement.style.boxShadow || 'inset 0px 0px 0px #000';
                          if (!bs.startsWith('inset ')) {
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: `inset 0px ${v}px 0px #000000` } });
                            return;
                          }
                          const parts = bs.split(' ');
                          parts[2] = `${v}px`;
                          updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">模糊</label>
                      <input
                        type="number"
                        value={(() => {
                          const bs = selectedElement.style.boxShadow || 'inset 0px 0px 0px #000';
                          if (!bs.startsWith('inset ')) return 0;
                          return parseInt(bs.split(' ')[3] || '0');
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const bs = selectedElement.style.boxShadow || 'inset 0px 0px 0px #000';
                          if (!bs.startsWith('inset ')) {
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: `inset 0px 0px ${v}px #000000` } });
                            return;
                          }
                          const parts = bs.split(' ');
                          parts[3] = `${v}px`;
                          updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newStyle = { ...selectedElement.style };
                    delete newStyle.boxShadow;
                    updateElement(selectedElementId, { style: newStyle });
                  }}
                  className="w-full py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                >
                  关闭阴影
                </button>
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
	            <label className="block text-sm font-medium text-gray-700 mb-2">文字内容</label>
	            <textarea
	              value={selectedElement.content}
	              onChange={(e) => updateElement(selectedElementId, { content: e.target.value })}
	              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
	              rows={3}
	            />
	          </div>
	          <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">字体样式</label>
                <button
                  onClick={() => { loadFontDatabase().then(() => setShowFontPicker(true)); }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  更多字体 &gt;
                </button>
              </div>
              <select
                value={selectedElement.style.fontFamily || 'Arial'}
                onChange={(e) => updateElement(selectedElementId, {
                  style: { ...selectedElement.style, fontFamily: e.target.value },
                })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2"
              >
                {getFontDatabase().map((font) => (
                  <option key={font.family} value={font.family}>
                    {font.displayName}
                  </option>
                ))}
              </select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">字号</label>
              <button
                onClick={() => {
                  const current = selectedElement.style.fontSize || 24;
                  updateElement(selectedElementId, {
                    style: { ...selectedElement.style, fontSize: Math.min(120, current + 2) },
                  });
                }}
                className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50"
              >
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
              <button
                onClick={() => {
                  const current = selectedElement.style.fontSize || 24;
                  updateElement(selectedElementId, {
                    style: { ...selectedElement.style, fontSize: Math.max(12, current - 2) },
                  });
                }}
                className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50"
              >
                <span className="text-lg font-bold">A⁻</span>
              </button>
              <button
                onClick={() => setShowColorPicker(true)}
                className="w-10 h-10 border border-gray-200 rounded"
                style={{ backgroundColor: selectedElement.style.color || '#FFD700' }}
                title="文字颜色"
              />
              <button className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-1">
            {[
              { label: '标题1', fontSize: 32, fontWeight: 'bold' },
              { label: '标题2', fontSize: 24, fontWeight: 'bold' },
              { label: '标题3', fontSize: 18, fontWeight: '600' },
              { label: '正文', fontSize: 14, fontWeight: 'normal' },
            ].map((preset, index) => (
              <button
                key={index}
                onClick={() => updateElement(selectedElementId, {
                  style: { ...selectedElement.style, fontSize: preset.fontSize, fontWeight: preset.fontWeight },
                })}
                className={`flex-1 py-2 px-3 rounded-lg text-sm ${
                  selectedElement.style.fontSize === preset.fontSize ? 'bg-blue-500 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {/* 第一行：B / I / U / S / 对齐 / 间距 / 字色 */}
            <div className="flex gap-1">
              <button
                onClick={() => updateElement(selectedElementId, {
                  style: {
                    ...selectedElement.style,
                    fontWeight: selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold',
                  },
                })}
                className={`flex-1 h-8 rounded flex items-center justify-center transition-colors ${
                  selectedElement.style.fontWeight === 'bold'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
                title="粗体"
              >
                <span className="font-bold">B</span>
              </button>
              <button
                onClick={() => updateElement(selectedElementId, {
                  style: {
                    ...selectedElement.style,
                    fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic',
                  },
                })}
                className={`flex-1 h-8 rounded flex items-center justify-center transition-colors ${
                  (selectedElement.style.fontStyle || 'normal') === 'italic'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
                title="斜体"
              >
                <span className="italic">I</span>
              </button>
              <button
                onClick={() => updateElement(selectedElementId, {
                  style: {
                    ...selectedElement.style,
                    textDecoration: selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline',
                  },
                })}
                className={`flex-1 h-8 rounded flex items-center justify-center transition-colors ${
                  selectedElement.style.textDecoration === 'underline'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
                title="下划线"
              >
                <span className="underline">U</span>
              </button>
              <button
                onClick={() => updateElement(selectedElementId, {
                  style: {
                    ...selectedElement.style,
                    textDecoration: selectedElement.style.textDecoration === 'line-through' ? 'none' : 'line-through',
                  },
                })}
                className={`flex-1 h-8 rounded flex items-center justify-center transition-colors ${
                  selectedElement.style.textDecoration === 'line-through'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
                title="删除线"
              >
                <span className="line-through">S</span>
              </button>
              <button
                onClick={() => {
                  const aligns: ('left' | 'center' | 'right' | 'justify')[] = ['left', 'center', 'right', 'justify'];
                  const cur = selectedElement.style.textAlign || 'center';
                  const next = aligns[(aligns.indexOf(cur) + 1) % aligns.length];
                  updateElement(selectedElementId, { style: { ...selectedElement.style, textAlign: next } });
                }}
                className="flex-1 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50 text-gray-600"
                title={`对齐：${selectedElement.style.textAlign || 'center'}`}
              >
                <span className="text-xs font-semibold">
                  {selectedElement.style.textAlign === 'left' && '左'}
                  {(selectedElement.style.textAlign === 'center' || !selectedElement.style.textAlign) && '中'}
                  {selectedElement.style.textAlign === 'right' && '右'}
                  {selectedElement.style.textAlign === 'justify' && '齐'}
                </span>
              </button>
              <button
                onClick={() => updateElement(selectedElementId, {
                  style: {
                    ...selectedElement.style,
                    letterSpacing: typeof selectedElement.style.letterSpacing === 'number'
                      ? (selectedElement.style.letterSpacing as number) === 0 ? 2 : 0
                      : 2,
                  },
                })}
                className={`flex-1 h-8 border rounded flex items-center justify-center transition-colors ${
                  selectedElement.style.letterSpacing && selectedElement.style.letterSpacing !== 0
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
                title="字间距"
              >
                <span className="text-xs font-medium">A A</span>
              </button>
              <button
                onClick={() => setShowColorPicker(true)}
                className="flex-1 h-8 border border-gray-200 rounded flex items-center justify-center hover:bg-gray-50"
                title="文字颜色"
              >
                <span
                  className="w-3.5 h-3.5 rounded-sm border border-gray-300"
                  style={{ backgroundColor: selectedElement.style.color || '#333333' }}
                />
              </button>
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
                  <select
                    value={
                      selectedElement.style.borderStyle === 'dashed' ? '虚线' :
                      selectedElement.style.borderStyle === 'dotted' ? '点线' : '直线'
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      const map: Record<string, 'solid' | 'dashed' | 'dotted'> = { '直线': 'solid', '虚线': 'dashed', '点线': 'dotted' };
                      updateElement(selectedElementId, { style: { ...selectedElement.style, borderStyle: map[v] || 'solid' } });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="直线">直线</option>
                    <option value="虚线">虚线</option>
                    <option value="点线">点线</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">边框颜色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.style.borderColor || '#000000'}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderColor: e.target.value } })}
                      className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {presetColors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => updateElement(selectedElementId, { style: { ...selectedElement.style, borderColor: color } })}
                          className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">边框尺寸</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min="0" max="20"
                      value={selectedElement.style.borderWidth || 0}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderWidth: Number(e.target.value) } })}
                      className="flex-1"
                    />
                    <input
                      type="number" min="0" max="20"
                      value={selectedElement.style.borderWidth || 0}
                      onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderWidth: Number(e.target.value) } })}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">圆角</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="number" min="0" max="50" placeholder="圆角"
                        value={selectedElement.style.borderRadius || 0}
                        onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, borderRadius: Number(e.target.value) } })}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
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
                  <label className="block text-xs text-gray-500 mb-1">文字阴影 (text-shadow)</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={(() => {
                        const m = (selectedElement.style.textShadow || '').match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
                        return m?.[1] || '#000000';
                      })()}
                      onChange={(e) => {
                        const color = e.target.value;
                        const cur = selectedElement.style.textShadow || '';
                        const rest = cur.replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '').trim();
                        updateElement(selectedElementId, { style: { ...selectedElement.style, textShadow: rest ? `${rest} ${color}` : `2px 2px 4px ${color}` } });
                      }}
                      className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {presetColors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const cur = selectedElement.style.textShadow || '';
                            const rest = cur.replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '').trim();
                            updateElement(selectedElementId, { style: { ...selectedElement.style, textShadow: rest ? `${rest} ${color}` : `2px 2px 4px ${color}` } });
                          }}
                          className="w-4 h-4 rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">横向</label>
                      <input
                        type="number"
                        value={(() => {
                          const m = (selectedElement.style.textShadow || '0px 0px 0px #000').match(/(-?\d+)px/);
                          return m ? parseInt(m[1]) : 0;
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const parts = (selectedElement.style.textShadow || '0px 0px 0px #000').split(' ');
                          parts[0] = `${v}px`;
                          updateElement(selectedElementId, { style: { ...selectedElement.style, textShadow: parts.join(' ') } });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">纵向</label>
                      <input
                        type="number"
                        value={(() => {
                          const parts = (selectedElement.style.textShadow || '0px 0px 0px #000').split(' ');
                          return parseInt(parts[1] || '0');
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const parts = (selectedElement.style.textShadow || '0px 0px 0px #000').split(' ');
                          parts[1] = `${v}px`;
                          updateElement(selectedElementId, { style: { ...selectedElement.style, textShadow: parts.join(' ') } });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">模糊</label>
                      <input
                        type="number"
                        value={(() => {
                          const parts = (selectedElement.style.textShadow || '0px 0px 0px #000').split(' ');
                          return parseInt(parts[2] || '0');
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const parts = (selectedElement.style.textShadow || '0px 0px 0px #000').split(' ');
                          parts[2] = `${v}px`;
                          updateElement(selectedElementId, { style: { ...selectedElement.style, textShadow: parts.join(' ') } });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">外阴影 (box-shadow)</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={(() => {
                        const m = (selectedElement.style.boxShadow || '').match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
                        return m?.[1] || '#000000';
                      })()}
                      onChange={(e) => {
                        const color = e.target.value;
                        const cur = selectedElement.style.boxShadow || '';
                        const rest = cur.replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '').trim();
                        updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: rest ? `${rest} ${color}` : `2px 2px 4px ${color}` } });
                      }}
                      className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {presetColors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const cur = selectedElement.style.boxShadow || '';
                            const rest = cur.replace(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g, '').trim();
                            updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: rest ? `${rest} ${color}` : `2px 2px 4px ${color}` } });
                          }}
                          className="w-4 h-4 rounded border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">横向</label>
                      <input
                        type="number"
                        value={(() => {
                          const m = (selectedElement.style.boxShadow || '0px 0px 0px #000').match(/(-?\d+)px/);
                          return m ? parseInt(m[1]) : 0;
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const parts = (selectedElement.style.boxShadow || '0px 0px 0px #000').split(' ');
                          parts[0] = `${v}px`;
                          updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">纵向</label>
                      <input
                        type="number"
                        value={(() => {
                          const parts = (selectedElement.style.boxShadow || '0px 0px 0px #000').split(' ');
                          return parseInt(parts[1] || '0');
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const parts = (selectedElement.style.boxShadow || '0px 0px 0px #000').split(' ');
                          parts[1] = `${v}px`;
                          updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">模糊</label>
                      <input
                        type="number"
                        value={(() => {
                          const parts = (selectedElement.style.boxShadow || '0px 0px 0px #000').split(' ');
                          return parseInt(parts[2] || '0');
                        })()}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          const parts = (selectedElement.style.boxShadow || '0px 0px 0px #000').split(' ');
                          parts[2] = `${v}px`;
                          updateElement(selectedElementId, { style: { ...selectedElement.style, boxShadow: parts.join(' ') } });
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newStyle = { ...selectedElement.style };
                    delete newStyle.textShadow;
                    delete newStyle.boxShadow;
                    updateElement(selectedElementId, { style: newStyle });
                  }}
                  className="w-full py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                >
                  关闭阴影
                </button>
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

    // 形状 / 图标 / 组合元素的属性面板
    if (selectedElement.type === 'shape' || selectedElement.type === 'icon' || selectedElement.type === 'group') {
      const isShape = selectedElement.type === 'shape';
      const isIcon = selectedElement.type === 'icon';

      return (
        <div className="space-y-4">
          {isIcon && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">图标内容</label>
              <div className="grid grid-cols-8 gap-1">
                {['⭐', '❤️', '🎈', '🎂', '🎁', '🌹', '🎄', '🎉', '🍀', '👑', '💍', '🎊', '✨', '🌟', '💝', '🎀'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => updateElement(selectedElementId, { content: emoji })}
                    className={`aspect-square text-xl rounded hover:bg-gray-100 ${
                      selectedElement.content === emoji ? 'bg-blue-50 ring-1 ring-blue-300' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isShape && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">填充颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(selectedElement.style.backgroundColor as string) || '#8B5CF6'}
                    onChange={(e) => updateElement(selectedElementId, {
                      style: { ...selectedElement.style, backgroundColor: e.target.value },
                    })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={(selectedElement.style.backgroundColor as string) || '#8B5CF6'}
                    onChange={(e) => updateElement(selectedElementId, {
                      style: { ...selectedElement.style, backgroundColor: e.target.value },
                    })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="#8B5CF6"
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {['#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#000000', '#FFFFFF'].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateElement(selectedElementId, {
                        style: { ...selectedElement.style, backgroundColor: c },
                      })}
                      className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">圆角</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={(selectedElement.style.borderRadius as number) || 0}
                    onChange={(e) => updateElement(selectedElementId, {
                      style: { ...selectedElement.style, borderRadius: Number(e.target.value) },
                    })}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={(selectedElement.style.borderRadius as number) || 0}
                    onChange={(e) => updateElement(selectedElementId, {
                      style: { ...selectedElement.style, borderRadius: Number(e.target.value) },
                    })}
                    className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">边框</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={(selectedElement.style.borderColor as string) || '#000000'}
                      onChange={(e) => updateElement(selectedElementId, {
                        style: { ...selectedElement.style, borderColor: e.target.value },
                      })}
                      className="w-10 h-8 rounded cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={(selectedElement.style.borderWidth as number) || 0}
                      onChange={(e) => updateElement(selectedElementId, {
                        style: { ...selectedElement.style, borderWidth: Number(e.target.value) },
                      })}
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                      placeholder="边框粗细"
                    />
                    <select
                      value={(selectedElement.style.borderStyle as string) || 'solid'}
                      onChange={(e) => updateElement(selectedElementId, {
                        style: { ...selectedElement.style, borderStyle: e.target.value as any },
                      })}
                      className="px-2 py-1 border border-gray-200 rounded text-sm"
                    >
                      <option value="solid">实线</option>
                      <option value="dashed">虚线</option>
                      <option value="dotted">点线</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {isIcon && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">图标颜色</label>
              <input
                type="color"
                value={(selectedElement.style.color as string) || '#F59E0B'}
                onChange={(e) => updateElement(selectedElementId, {
                  style: { ...selectedElement.style, color: e.target.value },
                })}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {selectedElement.type === 'group' && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p>组合元素 ({selectedElement.children?.length || 0} 个子元素)</p>
              <p className="text-xs text-gray-500 mt-1">使用 Ctrl+Shift+G 或工具栏拆分按钮可拆分</p>
            </div>
          )}

          {/* 透明度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">透明度</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={(selectedElement.style.opacity || 1) * 100}
                onChange={(e) => updateElement(selectedElementId, {
                  style: { ...selectedElement.style, opacity: Number(e.target.value) / 100 },
                })}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12 text-right">{Math.round((selectedElement.style.opacity || 1) * 100)}%</span>
            </div>
          </div>

          {/* 尺寸与位置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">尺寸与位置</label>
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
            <div className="mt-2">
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
            onChange={(e) => updateElement(selectedElementId, { style: { ...selectedElement.style, textAlign: e.target.value as 'left' | 'center' | 'right' | 'justify' } })}
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

// ===== 动画数据定义（模块级常量） =====
const animationLibrary: { category: string; items: { name: string; cssClass: string }[] }[] = [
  {
    category: '进入',
    items: [
      { name: '淡入', cssClass: 'fadeIn' },
      { name: '向右移入', cssClass: 'slideInRight' },
      { name: '向左移入', cssClass: 'slideInLeft' },
      { name: '向上移入', cssClass: 'slideInUp' },
      { name: '向下移入', cssClass: 'slideInDown' },
      { name: '翻转进入', cssClass: 'flipIn' },
      { name: '向右弹入', cssClass: 'bounceInRight' },
      { name: '向左弹入', cssClass: 'bounceInLeft' },
      { name: '向上弹入', cssClass: 'bounceInUp' },
      { name: '向下弹入', cssClass: 'bounceInDown' },
      { name: '翻开进入', cssClass: 'flipOpenIn' },
      { name: '向左翻滚', cssClass: 'rollInLeft' },
      { name: '向上翻滚', cssClass: 'rollInUp' },
      { name: '向右翻滚', cssClass: 'rollInRight' },
      { name: '向下翻滚', cssClass: 'rollInDown' },
      { name: '中心弹入', cssClass: 'bounceInCenter' },
      { name: '光速向右', cssClass: 'speedInRight' },
      { name: '光速向左', cssClass: 'speedInLeft' },
      { name: '光速向上', cssClass: 'speedInUp' },
      { name: '光速向下', cssClass: 'speedInDown' },
      { name: '中心放大', cssClass: 'scaleCenter' },
      { name: '魔幻向右', cssClass: 'magicRight' },
      { name: '魔幻向左', cssClass: 'magicLeft' },
      { name: '魔幻向上', cssClass: 'magicUp' },
      { name: '魔幻向下', cssClass: 'magicDown' },
      { name: '缩小进入', cssClass: 'shrinkIn' },
      { name: '向左旋转', cssClass: 'rotateInLeft' },
      { name: '向右旋转', cssClass: 'rotateInRight' },
      { name: '向上旋转', cssClass: 'rotateInUp' },
      { name: '向下旋转', cssClass: 'rotateInDown' },
    ],
  },
  {
    category: '强调',
    items: [
      { name: '闪烁', cssClass: 'flash' },
      { name: '脉冲', cssClass: 'pulse' },
      { name: '抖动', cssClass: 'shake' },
      { name: '弹跳', cssClass: 'bounce' },
      { name: '摇摆', cssClass: 'swing' },
      { name: '旋转', cssClass: 'spin' },
      { name: '缩放强调', cssClass: 'scaleEmphasis' },
    ],
  },
  {
    category: '退出',
    items: [
      { name: '淡出', cssClass: 'fadeOut' },
      { name: '滑出向右', cssClass: 'slideOutRight' },
      { name: '滑出向左', cssClass: 'slideOutLeft' },
      { name: '滑出向上', cssClass: 'slideOutUp' },
      { name: '滑出向下', cssClass: 'slideOutDown' },
    ],
  },
];

// 获取动画名称
const getAnimationName = (cssClass: string): string => {
  for (const cat of animationLibrary) {
    const found = cat.items.find((item) => item.cssClass === cssClass);
    if (found) return found.name;
  }
  return cssClass;
};

// 获取动画分类
const getAnimationCategory = (cssClass: string): string => {
  for (const cat of animationLibrary) {
    const found = cat.items.find((item) => item.cssClass === cssClass);
    if (found) return cat.category;
  }
  return '';
};

// ===== 添加动画弹窗组件 =====
const AddAnimationModal = ({
  onSelect,
  onClose,
}: {
  onSelect: (cssClass: string, name: string) => void;
  onClose: () => void;
}) => {
  const [activeCategory, setActiveCategory] = useState(animationLibrary[0]?.category || '进入');

  const currentCategory = animationLibrary.find((c) => c.category === activeCategory);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-800">选择动画效果</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* 分类标签 */}
        <div className="flex gap-1 px-4 py-2.5 border-b border-gray-100">
          {animationLibrary.map((cat) => (
            <button
              key={cat.category}
              onClick={() => setActiveCategory(cat.category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat.category
                  ? cat.category === '进入'
                    ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                    : cat.category === '强调'
                      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                      : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cat.category}
              <span className="ml-1 text-[10px] opacity-60">({cat.items.length})</span>
            </button>
          ))}
        </div>

        {/* 动画列表 */}
        <div className="overflow-y-auto max-h-[50vh] p-3">
          {currentCategory && (
            <div className="grid grid-cols-3 gap-2">
              {currentCategory.items.map((item) => (
                <button
                  key={item.cssClass}
                  onClick={() => onSelect(item.cssClass, item.name)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all hover:shadow-sm ${
                    activeCategory === '进入'
                      ? 'border-green-100 hover:border-green-300 hover:bg-green-50'
                      : activeCategory === '强调'
                        ? 'border-amber-100 hover:border-amber-300 hover:bg-amber-50'
                        : 'border-red-100 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-lg mb-1 ${
                      activeCategory === '进入'
                        ? 'bg-green-50 text-green-500'
                        : activeCategory === '强调'
                          ? 'bg-amber-50 text-amber-500'
                          : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {activeCategory === '进入' ? '✨' : activeCategory === '强调' ? '💫' : '💨'}
                  </div>
                  <span className="text-[11px] text-gray-600 text-center leading-tight">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== 动画页签组件（独立组件，支持 Hooks） =====
const AnimationTab = ({
  selectedElement,
  selectedElementId,
  addAnimation,
  removeAnimation,
  updateAnimation,
  reorderAnimations,
}: {
  selectedElement: CardElement | undefined;
  selectedElementId: string | null;
  addAnimation: (elementId: string, animation: Omit<ElementAnimation, 'id'>) => void;
  removeAnimation: (elementId: string, animationId: string) => void;
  updateAnimation: (elementId: string, animationId: string, updates: Partial<ElementAnimation>) => void;
  reorderAnimations: (elementId: string, startIndex: number, endIndex: number) => void;
}) => {
  const { animationExpanded, toggleAnimationExpanded } = useEditorStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragoverIndex, setDragoverIndex] = useState<number | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animContainerRef = useRef<HTMLDivElement>(null);

  const animations = selectedElement?.animations || [];

  // 清理预览定时器
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  // 预览单个动画
  const playSingleAnimation = useCallback((anim: ElementAnimation) => {
    if (!selectedElementId || !selectedElement) return;
    
    const el = document.getElementById(`canvas-element-${selectedElementId}`);
    if (!el) return;

    el.style.animation = 'none';
    el.style.animationDuration = '0ms';
    void el.offsetWidth;

    el.style.animation = `${anim.cssClass} ${anim.duration}ms ease ${anim.delay}ms`;
    if (anim.iterationCount === 'infinite') {
      el.style.animationIterationCount = 'infinite';
    } else {
      el.style.animationIterationCount = String(anim.iterationCount);
    }
    el.style.animationFillMode = 'forwards';
  }, [selectedElementId, selectedElement]);

  // 预览完整动画序列
  const playAnimationSequence = useCallback(async () => {
    if (!selectedElementId || !animations.length || !selectedElement) return;
    
    setPreviewing(true);
    const el = document.getElementById(`canvas-element-${selectedElementId}`);
    if (!el) {
      setPreviewing(false);
      return;
    }

    el.style.animation = 'none';
    el.style.animationDuration = '0ms';
    void el.offsetWidth;

    for (let i = 0; i < animations.length; i++) {
      const anim = animations[i];
      await new Promise<void>((resolve) => {
        el!.style.animation = `${anim.cssClass} ${anim.duration}ms ease ${anim.delay}ms`;
        if (anim.iterationCount === 'infinite') {
          el!.style.animationIterationCount = 'infinite';
        } else {
          el!.style.animationIterationCount = String(anim.iterationCount);
        }
        el!.style.animationFillMode = 'forwards';

        const totalDuration = anim.delay + anim.duration * (anim.iterationCount === 'infinite' ? 1 : (anim.iterationCount as number));
        previewTimeoutRef.current = setTimeout(() => {
          resolve();
        }, totalDuration);
      });
    }

    setPreviewing(false);
  }, [selectedElementId, animations, selectedElement]);

  // 添加动画
  const handleAddAnimation = (cssClass: string, name: string) => {
    if (!selectedElementId || !selectedElement) return;
    // 从动画目录查找分类信息
    const cat = animationLibrary.find(c => c.items.some(item => item.cssClass === cssClass));
    addAnimation(selectedElementId, {
      name,
      cssClass,
      duration: 1000,
      delay: 0,
      iterationCount: 1,
      category: (cat?.category === '进入' ? 'enter' : cat?.category === '强调' ? 'emphasis' : 'enter') as 'enter' | 'emphasis' | 'exit',
    });
    setShowAddModal(false);
  };

  // 删除动画
  const handleRemoveAnimation = (animId: string) => {
    if (!selectedElementId) return;
    removeAnimation(selectedElementId, animId);
  };

  // 上移
  const handleMoveUp = (index: number) => {
    if (!selectedElementId || index <= 0) return;
    reorderAnimations(selectedElementId, index, index - 1);
  };

  // 下移
  const handleMoveDown = (index: number) => {
    if (!selectedElementId || index >= animations.length - 1) return;
    reorderAnimations(selectedElementId, index, index + 1);
  };

  // 拖拽
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragoverIndex(index);
  };
  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index || !selectedElementId) {
      setDragIndex(null);
      setDragoverIndex(null);
      return;
    }
    reorderAnimations(selectedElementId, dragIndex, index);
    setDragIndex(null);
    setDragoverIndex(null);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragoverIndex(null);
  };

  // 更新动画参数
  const handleUpdateAnimParam = (animId: string, updates: Partial<ElementAnimation>) => {
    if (!selectedElementId) return;
    updateAnimation(selectedElementId, animId, updates);
  };

  // 展开/折叠
  const toggleExpand = (animId: string) => {
    toggleAnimationExpanded(animId);
  };

  // 选中元素变化时清除预览
  useEffect(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    setPreviewing(false);
  }, [selectedElementId]);

  const hasAnimations = animations.length > 0;

  return (
    <div className="space-y-3 p-3">
      {!selectedElement ? (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">选择一个元素以设置动画</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加动画
            </button>
            <button
              onClick={playAnimationSequence}
              disabled={!hasAnimations || previewing}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                !hasAnimations || previewing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              <Play className="w-4 h-4" />
              {previewing ? '播放中...' : '预览动画'}
            </button>
          </div>

          <div ref={animContainerRef}>
            {!hasAnimations ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <p className="text-gray-400 text-xs">暂无动画，点击上方"添加动画"</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {animations.map((anim, index) => (
                  <div
                    key={anim.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white border rounded-lg transition-all ${
                      dragoverIndex === index && dragIndex !== index
                        ? 'border-blue-400 shadow-md scale-[1.02]'
                        : dragIndex === index
                          ? 'opacity-50 border-blue-300'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-gray-400 w-4 font-mono">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-gray-700 truncate">{anim.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            getAnimationCategory(anim.cssClass) === '进入'
                              ? 'bg-green-50 text-green-600'
                              : getAnimationCategory(anim.cssClass) === '强调'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-red-50 text-red-600'
                          }`}>
                            {getAnimationCategory(anim.cssClass) || '动画'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {(anim.duration / 1000).toFixed(1)}s
                          {anim.delay > 0 ? ` / 延迟${(anim.delay / 1000).toFixed(1)}s` : ''}
                          {anim.iterationCount === 'infinite' ? ' / 循环' : ` / ${anim.iterationCount}次`}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => playSingleAnimation(anim)}
                          title="播放单个"
                          className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded transition-colors ${
                            index === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === animations.length - 1}
                          className={`p-1 rounded transition-colors ${
                            index === animations.length - 1 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleExpand(anim.id)}
                          className={`p-1 rounded transition-colors ${
                            animationExpanded[anim.id] ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {animationExpanded[anim.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleRemoveAnimation(anim.id)}
                          title="删除"
                          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {animationExpanded[anim.id] && (
                      <div className="px-3 pb-3 pt-1 border-t border-gray-100 mt-1 space-y-2">
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium">动画时长</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0.1"
                              max="5"
                              step="0.1"
                              value={anim.duration / 1000}
                              onChange={(e) => handleUpdateAnimParam(anim.id, { duration: Number(e.target.value) * 1000 })}
                              className="flex-1 h-1.5"
                            />
                            <span className="text-xs text-gray-500 w-10 text-right">{(anim.duration / 1000).toFixed(1)}s</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium">延迟时间</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="5"
                              step="0.1"
                              value={anim.delay / 1000}
                              onChange={(e) => handleUpdateAnimParam(anim.id, { delay: Number(e.target.value) * 1000 })}
                              className="flex-1 h-1.5"
                            />
                            <span className="text-xs text-gray-500 w-10 text-right">{(anim.delay / 1000).toFixed(1)}s</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 font-medium">重复次数</label>
                          <select
                            value={anim.iterationCount === 'infinite' ? 'infinite' : String(anim.iterationCount)}
                            onChange={(e) => handleUpdateAnimParam(anim.id, {
                              iterationCount: e.target.value === 'infinite' ? 'infinite' : Number(e.target.value),
                            })}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                          >
                            <option value="1">1次</option>
                            <option value="2">2次</option>
                            <option value="3">3次</option>
                            <option value="infinite">无限循环</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showAddModal && (
        <AddAnimationModal
          onSelect={handleAddAnimation}
          onClose={() => setShowAddModal(false)}
        />
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

  const ColorPickerPopup = () => {
    if (!selectedElement) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-4 w-72 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">文字颜色</span>
            <button
              onClick={() => setShowColorPicker(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <input
            type="color"
            value={selectedElement.style.color || '#333333'}
            onChange={(e) => {
              updateElement(selectedElementId, {
                style: { ...selectedElement.style, color: e.target.value },
              });
            }}
            className="w-full h-10 rounded cursor-pointer mb-3"
          />
          <div className="flex gap-1 flex-wrap">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  updateElement(selectedElementId, {
                    style: { ...selectedElement.style, color },
                  });
                  setShowColorPicker(false);
                }}
                className="w-7 h-7 rounded border border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const FontPickerPopup = () => {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<FontCategory>('all');
    const [fontsReady, setFontsReady] = useState(getFontDatabase().length > 0);

    // 如果字体尚未加载则触发加载
    useEffect(() => {
      if (!fontsReady) {
        loadFontDatabase().then(() => setFontsReady(true));
      }
    }, []);

    const filteredFonts = fontsReady ? searchFonts(search, activeCategory) : [];
    const currentFont = selectedElement?.style.fontFamily || '';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-4 w-96 max-h-[80vh] shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">选择字体</span>
            <button
              onClick={() => setShowFontPicker(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索字体..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {FONT_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {!fontsReady ? (
              <div className="text-center text-sm text-gray-400 py-8">加载字体中...</div>
            ) : filteredFonts.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-8">未找到匹配的字体</div>
            ) : (
              filteredFonts.map((font) => (
                <button
                  key={font.family}
                  onClick={() => {
                    updateElement(selectedElementId, {
                      style: { ...selectedElement.style, fontFamily: font.family },
                    });
                    setShowFontPicker(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    currentFont === font.family
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  <div className="text-base">{font.displayName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {font.family}
                    {' · '}
                    {FONT_CATEGORIES.find((c) => c.key === font.category)?.label || font.category}
                  </div>
                </button>
              ))
            )}
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
        {activeTab === 'style' && StyleTab()}
        {activeTab === 'animation' && (
          <AnimationTab
            selectedElement={selectedElement}
            selectedElementId={selectedElementId}
            addAnimation={addAnimation}
            removeAnimation={removeAnimation}
            updateAnimation={updateAnimation}
            reorderAnimations={reorderAnimations}
          />
        )}
        {activeTab === 'trigger' && TriggerTab()}
      </div>

      {showAdvancedSettings && <AdvancedSettings />}
      {showColorPicker && <ColorPickerPopup />}
      {showFontPicker && <FontPickerPopup />}
    </div>
  );
};

export default PropertyPanel;