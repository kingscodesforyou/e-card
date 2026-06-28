import { useState, useEffect } from 'react';
import { Sparkles, Wand2, Check, Loader2 } from 'lucide-react';
import { ai } from '../../lib/ai';
import { useEditorStore } from '../../store';
import { useTemplatesStore } from '../../store';
import { CardElement } from '../../types';

const AIGreetingPanel = () => {
  const { addElement } = useEditorStore();
  const { occasions } = useTemplatesStore();

  const [occasion, setOccasion] = useState('');
  const [recipient, setRecipient] = useState('');
  const [greetings, setGreetings] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // 默认选择第一个非"全部"的场合
  useEffect(() => {
    if (!occasion && occasions.length > 1) {
      const firstRealOccasion = occasions.find(o => o !== '全部');
      if (firstRealOccasion) setOccasion(firstRealOccasion);
    }
  }, [occasions, occasion]);

  const handleGenerate = async () => {
    if (!occasion) {
      setError('请选择场合');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSelectedIndex(null);

    const { data, error: err } = await ai.generateGreetings(occasion, recipient || undefined);
    
    if (err) {
      setError(err.message || '生成失败，请稍后重试');
    } else if (data) {
      setGreetings(data);
    }
    setIsGenerating(false);
  };

  const handleInsert = () => {
    if (selectedIndex === null || !greetings[selectedIndex]) return;

    const text = greetings[selectedIndex];
    const element: Omit<CardElement, 'id'> = {
      type: 'text',
      content: text,
      position: { x: 10, y: 30 },
      size: { width: 80, height: 15 },
      style: {
        fontSize: 28,
        fontFamily: 'Arial',
        color: '#333333',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        lineHeight: 1.6,
      },
    };

    addElement(element);
    setSelectedIndex(null);
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-gray-900">AI 祝福语生成</h3>
      </div>

      <div className="space-y-3 mb-4">
        {/* 场合选择 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">场合</label>
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="">请选择场合</option>
            {occasions.filter(o => o !== '全部').map((occ) => (
              <option key={occ} value={occ}>{occ}</option>
            ))}
          </select>
        </div>

        {/* 收卡人 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            收卡人 <span className="text-gray-400">（可选）</span>
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="如：老板、妈妈、朋友..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* 生成按钮 */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              生成祝福语
            </>
          )}
        </button>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>

      {/* 结果列表 */}
      {greetings.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mb-4">
          <p className="text-xs font-medium text-gray-500">选择一条祝福语插入画布：</p>
          {greetings.map((greeting, index) => (
            <div
              key={index}
              onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
              className={`p-3 rounded-lg border cursor-pointer transition-all text-sm leading-relaxed ${
                selectedIndex === index
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {selectedIndex === index ? (
                    <Check className="w-4 h-4 text-purple-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <span className="text-gray-700">{greeting}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 插入按钮 */}
      {selectedIndex !== null && (
        <button
          onClick={handleInsert}
          className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          插入到画布
        </button>
      )}
    </div>
  );
};

export default AIGreetingPanel;
