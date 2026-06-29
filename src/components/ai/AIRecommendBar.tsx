import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { ai } from '../../lib/ai';
import { useTemplatesStore } from '../../store';

interface AIRecommendBarProps {
  onRecommend?: (result: { category: string; occasion: string; style: string }) => void;
  placeholder?: string;
}

const AIRecommendBar = ({ onRecommend, placeholder }: AIRecommendBarProps) => {
  const { categories, occasions, styles, setSelectedCategory, setSelectedOccasion, setSelectedStyle } = useTemplatesStore();
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRecommend = async () => {
    if (!description.trim()) {
      setError('请输入描述');
      return;
    }

    setIsLoading(true);
    setError('');

    // 过滤掉 '全部' 选项
    const labelOptions = {
      categories: categories.filter(c => c !== '全部'),
      occasions: occasions.filter(o => o !== '全部'),
      styles: styles.filter(s => s !== '全部'),
    };

    const { data, error: err } = await ai.recommendTemplate(description, labelOptions);

    if (err) {
      setError(err.message || '推荐失败，请稍后重试');
      setIsLoading(false);
      return;
    }

    if (data) {
      // 设置筛选条件
      setSelectedCategory(data.category);
      setSelectedOccasion(data.occasion);
      setSelectedStyle(data.style);

      // 回调通知父组件
      onRecommend?.(data);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleRecommend();
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || '描述您想要的贺卡，例如：给老板的春节商务贺卡'}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          />
        </div>
        <button
          onClick={handleRecommend}
          disabled={isLoading}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              AI 推荐
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>
      )}
      <p className="text-xs text-gray-400 mt-1 ml-1">
        输入自然语言描述，AI 将自动匹配最合适的分类、场合和风格
      </p>
    </div>
  );
};

export default AIRecommendBar;
