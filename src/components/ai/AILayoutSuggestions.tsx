import { useState } from 'react';
import { LayoutDashboard, Loader2, Check, RefreshCw } from 'lucide-react';
import { ai } from '../../lib/ai';
import { useEditorStore } from '../../store';

const AILayoutSuggestions = () => {
  const { currentCard, updateElement } = useEditorStore();
  const [suggestions, setSuggestions] = useState<{
    suggestions: Array<{ elementId: string; reason: string; position: { x: number; y: number }; size: { width: number; height: number } }>;
    summary: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const currentPage = currentCard.pages[currentCard.currentPageIndex];
  const elements = currentPage?.elements || [];

  const handleAnalyze = async () => {
    if (elements.length === 0) return;

    setIsLoading(true);
    setError('');
    setSuggestions(null);

    const { data, error: err } = await ai.suggestLayout(elements);

    if (err) {
      setError(err.message || '分析失败');
    } else if (data) {
      setSuggestions(data);
    }
    setIsLoading(false);
  };

  const handleApply = (suggestion: { elementId: string; position: { x: number; y: number }; size: { width: number; height: number } }) => {
    updateElement(suggestion.elementId, {
      position: suggestion.position,
      size: suggestion.size,
    });
  };

  const handleApplyAll = () => {
    if (!suggestions) return;
    suggestions.suggestions.forEach((s) => {
      updateElement(s.elementId, {
        position: s.position,
        size: s.size,
      });
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="p-3 rounded-xl hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all"
        title="AI 布局建议"
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30" onClick={() => setIsVisible(false)}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900">AI 布局建议</h3>
          </div>
          <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              当前页面有 <span className="font-medium">{elements.length}</span> 个元素
            </p>
            <button
              onClick={handleAnalyze}
              disabled={isLoading || elements.length === 0}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              分析布局
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500">AI 正在分析页面布局...</p>
            </div>
          )}

          {suggestions && (
            <div>
              {/* 总结 */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                <p className="text-sm text-purple-800">{suggestions.summary}</p>
              </div>

              {/* 建议列表 */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-gray-500">
                  {suggestions.suggestions.length} 条优化建议
                </p>
                {suggestions.suggestions.map((s, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">
                          元素 {s.elementId.substring(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-700">{s.reason}</p>
                      </div>
                      <button
                        onClick={() => handleApply(s)}
                        className="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        应用
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 全部应用 */}
              <button
                onClick={handleApplyAll}
                className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                应用全部建议
              </button>
            </div>
          )}

          {/* 无元素提示 */}
          {!isLoading && !suggestions && !error && (
            <div className="text-center py-8 text-gray-400">
              <LayoutDashboard className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">点击「分析布局」获取 AI 优化建议</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AILayoutSuggestions;
