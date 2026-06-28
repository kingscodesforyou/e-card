import { useState } from 'react';
import { Sparkles, Loader2, Check, RefreshCw } from 'lucide-react';
import { ai } from '../../lib/ai';

interface AITextActionsProps {
  text: string;
  elementId: string;
  onUpdate: (newContent: string) => void;
}

type ActionType = 'polish' | 'expand' | 'shorten' | 'translate_en';

const actionLabels: Record<ActionType, string> = {
  polish: '润色',
  expand: '扩写',
  shorten: '缩短',
  translate_en: '译英',
};

const AITextActions = ({ text, onUpdate }: AITextActionsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<ActionType>('polish');
  const [error, setError] = useState('');

  const handleAction = async (action: ActionType) => {
    if (!text.trim()) return;

    setCurrentAction(action);
    setIsProcessing(true);
    setError('');
    setResult(null);

    const { data, error: err } = await ai.polishText(text, action);

    if (err) {
      setError(err.message || '处理失败');
    } else if (data) {
      setResult(data);
    }
    setIsProcessing(false);
  };

  const handleApply = () => {
    if (result) {
      onUpdate(result);
      setResult(null);
      setShowActions(false);
    }
  };

  const handleCancel = () => {
    setResult(null);
  };

  // 如果没有文本，不显示
  if (!text.trim()) return null;

  return (
    <div>
      {/* AI 操作按钮 */}
      {!showActions && !result && (
        <button
          onClick={() => setShowActions(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI 处理
        </button>
      )}

      {/* 操作选择 */}
      {showActions && !isProcessing && !result && (
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(actionLabels) as ActionType[]).map((action) => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-purple-100 hover:text-purple-600 transition-colors"
            >
              {actionLabels[action]}
            </button>
          ))}
          <button
            onClick={() => setShowActions(false)}
            className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-600"
          >
            取消
          </button>
        </div>
      )}

      {/* 加载中 */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
          <span>
            {currentAction === 'polish' && '润色中...'}
            {currentAction === 'expand' && '扩写中...'}
            {currentAction === 'shorten' && '精简中...'}
            {currentAction === 'translate_en' && '翻译中...'}
          </span>
        </div>
      )}

      {/* 结果预览 */}
      {result && (
        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-700">
              {actionLabels[currentAction]}结果
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3 leading-relaxed">{result}</p>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              应用
            </button>
            <button
              onClick={() => handleAction(currentAction)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新生成
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default AITextActions;
