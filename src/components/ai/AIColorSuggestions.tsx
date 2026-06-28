import { useState } from 'react';
import { Palette, Loader2, Check, RefreshCw } from 'lucide-react';
import { ai } from '../../lib/ai';
import { useEditorStore } from '../../store';

const AIColorSuggestions = () => {
  const { currentCard, updateElement } = useEditorStore();
  const [style, setStyle] = useState('');
  const [schemes, setSchemes] = useState<Array<{ name: string; colors: string[] }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  const currentPage = currentCard.pages[currentCard.currentPageIndex];
  const elements = currentPage?.elements || [];
  const hasTextElements = elements.some(el => el.type === 'text');
  const hasNonTextElements = elements.some(el => el.type !== 'text');

  const handleGenerate = async () => {
    if (!style.trim()) return;

    setIsGenerating(true);
    setError('');

    const { data, error: err } = await ai.suggestColorScheme(style);

    if (err) {
      setError(err.message || '生成失败');
    } else if (data) {
      setSchemes(data);
    }
    setIsGenerating(false);
  };

  const applyScheme = (index: number) => {
    const scheme = schemes[index];
    if (!scheme) return;

    setApplyingIndex(index);
    const [mainColor, secondaryColor, accentColor, bgColor, textColor] = scheme.colors;

    elements.forEach((el) => {
      if (el.type === 'text') {
        // 文字元素：应用文字色
        updateElement(el.id, {
          style: {
            ...el.style,
            color: el.style.color && el.style.color !== '#000000' && el.style.color !== '#333333'
              ? el.style.color // 保留已有非默认颜色
              : textColor || mainColor,
          },
        });
      } else if (el.type === 'shape' || el.type === 'icon') {
        // 形状/图标：应用主色或辅色
        updateElement(el.id, {
          style: {
            ...el.style,
            backgroundColor: secondaryColor || mainColor,
            color: accentColor,
          },
        });
      }
      // 图片元素不修改颜色
    });

    // 也可以设置页面背景色
    setApplyingIndex(null);
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-gray-900">AI 配色建议</h3>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            风格 / 关键词
          </label>
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="如：商务、春节、清新..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !style.trim()}
          className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Palette className="w-4 h-4" />
              生成配色方案
            </>
          )}
        </button>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* 配色方案列表 */}
      {schemes.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
          <p className="text-xs font-medium text-gray-500">
            点击「应用」将配色应用到当前页面元素
          </p>
          {schemes.map((scheme, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">{scheme.name}</span>
                <button
                  onClick={() => applyScheme(index)}
                  disabled={applyingIndex === index}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                  {applyingIndex === index ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  应用
                </button>
              </div>
              <div className="flex gap-1.5">
                {scheme.colors.map((color, ci) => (
                  <div key={ci} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                    <span className="text-[10px] text-gray-400 font-mono">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 无元素提示 */}
      {!isGenerating && schemes.length === 0 && !error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">输入风格关键词</p>
            <p className="text-xs mt-1">生成匹配的配色方案</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIColorSuggestions;
