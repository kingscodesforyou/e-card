/**
 * 组件属性编辑面板 - 为组件库中的每种高级组件提供专属配置界面
 * 在 PropertyPanel 中集成使用
 */
import { useState } from 'react';
import { useEditorStore } from '../../store';
import type { CardElement, ComponentConfig } from '../../types';

interface ComponentPropertyEditorProps {
  element: CardElement;
}

// ============================================================
// 拼图属性编辑
// ============================================================
export function PuzzlePropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'puzzle' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">列数</label>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => updateConfig({ puzzleCols: n })}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                config.puzzleCols === n ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {n}×{n}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">间距 (px)</label>
        <input
          type="range"
          min="0"
          max="8"
          value={config.puzzleGap || 2}
          onChange={(e) => updateConfig({ puzzleGap: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">添加图片</label>
        <button
          className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-purple-300 hover:text-purple-500"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.onchange = async (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (!files) return;
              const urls: string[] = [];
              for (const file of Array.from(files)) {
                const url = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target?.result as string);
                  reader.readAsDataURL(file);
                });
                urls.push(url);
              }
              updateConfig({ puzzleImages: [...(config.puzzleImages || []), ...urls] });
            };
            input.click();
          }}
        >
          + 添加拼图图片
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 轮播图属性编辑
// ============================================================
export function CarouselPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'carousel' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">轮播间隔 (秒)</label>
        <input
          type="number"
          min="1"
          max="10"
          value={Math.round((config.carouselInterval || 3000) / 1000)}
          onChange={(e) => updateConfig({ carouselInterval: Number(e.target.value) * 1000 })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">自动播放</span>
        <button
          onClick={() => updateConfig({ carouselAutoPlay: !(config.carouselAutoPlay !== false) })}
          className={`w-10 h-6 rounded-full relative transition-colors ${config.carouselAutoPlay !== false ? 'bg-purple-500' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${config.carouselAutoPlay !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">添加轮播图片</label>
        <button
          className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-purple-300 hover:text-purple-500"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.onchange = async (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (!files) return;
              const urls: string[] = [];
              for (const file of Array.from(files)) {
                const url = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => resolve(e.target?.result as string);
                  reader.readAsDataURL(file);
                });
                urls.push(url);
              }
              updateConfig({ carouselImages: [...(config.carouselImages || []), ...urls] });
            };
            input.click();
          }}
        >
          + 添加轮播图片
        </button>
      </div>
      {(config.carouselImages || []).length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(config.carouselImages || []).map((img: string, idx: number) => (
            <div key={idx} className="relative flex-shrink-0">
              <img src={img} alt="" className="w-16 h-12 object-cover rounded-lg border border-gray-200" />
              <button
                onClick={() => {
                  const newImages = [...(config.carouselImages || [])];
                  newImages.splice(idx, 1);
                  updateConfig({ carouselImages: newImages });
                }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 弹幕属性编辑
// ============================================================
export function BarragePropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'barrage' };
  const [newMessage, setNewMessage] = useState('');

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  const addMessage = () => {
    if (!newMessage.trim()) return;
    updateConfig({ barrageMessages: [...(config.barrageMessages || []), newMessage.trim()] });
    setNewMessage('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">弹幕颜色</label>
        <div className="flex gap-2">
          {['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#FFFFFF'].map((c) => (
            <button
              key={c}
              onClick={() => updateConfig({ barrageColor: c })}
              className={`w-7 h-7 rounded-full border-2 ${config.barrageColor === c ? 'border-gray-800 scale-110' : 'border-gray-200'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">弹幕速度</label>
        <input
          type="range"
          min="3"
          max="15"
          value={config.barrageSpeed || 8}
          onChange={(e) => updateConfig({ barrageSpeed: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">弹幕内容</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMessage()}
            placeholder="输入弹幕内容"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button onClick={addMessage} className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600">
            添加
          </button>
        </div>
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {(config.barrageMessages || []).map((msg: string, idx: number) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-xs">
              <span className="truncate">{msg}</span>
              <button
                onClick={() => {
                  const msgs = [...(config.barrageMessages || [])];
                  msgs.splice(idx, 1);
                  updateConfig({ barrageMessages: msgs });
                }}
                className="text-red-400 hover:text-red-600 ml-2"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 留言板属性编辑
// ============================================================
export function MessageBoardPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'messageBoard' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">输入框占位文字</label>
        <input
          type="text"
          value={config.messagePlaceholder || '写下你的祝福...'}
          onChange={(e) => updateConfig({ messagePlaceholder: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">预设留言</label>
        {(config.messages || []).map((msg: { name: string; content: string; time: string }, idx: number) => (
          <div key={idx} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-xs mb-1">
            <span className="font-medium">{msg.name}:</span>
            <span className="truncate flex-1 ml-2">{msg.content}</span>
            <button
              onClick={() => {
                const msgs = [...(config.messages || [])];
                msgs.splice(idx, 1);
                updateConfig({ messages: msgs });
              }}
              className="text-red-400 hover:text-red-600 ml-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 计时器属性编辑
// ============================================================
export function TimerPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'timer' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">计时方向</span>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => updateConfig({ timerCountUp: true })}
            className={`px-3 py-1 text-xs rounded-md ${config.timerCountUp !== false ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}
          >
            正计时
          </button>
          <button
            onClick={() => updateConfig({ timerCountUp: false })}
            className={`px-3 py-1 text-xs rounded-md ${config.timerCountUp === false ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}
          >
            倒计时
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">起始值 (秒)</label>
        <input
          type="number"
          min="0"
          value={config.timerStartFrom || 0}
          onChange={(e) => updateConfig({ timerStartFrom: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
    </div>
  );
}

// ============================================================
// 数据图表属性编辑
// ============================================================
export function ChartPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'chart' };
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  const addDataPoint = () => {
    if (!newLabel.trim() || !newValue) return;
    const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#EF4444'];
    const idx = (config.chartData || []).length;
    updateConfig({
      chartData: [...(config.chartData || []), { label: newLabel.trim(), value: Number(newValue), color: colors[idx % colors.length] }],
    });
    setNewLabel('');
    setNewValue('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">图表类型</label>
        <div className="flex gap-2">
          {(['bar', 'pie', 'line'] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateConfig({ chartType: t })}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                config.chartType === t ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-gray-200 text-gray-600'
              }`}
            >
              {t === 'bar' ? '柱状图' : t === 'pie' ? '饼图' : '折线图'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">数据项</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="标签"
            className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm"
          />
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="数值"
            className="w-20 px-2 py-1.5 border border-gray-200 rounded text-sm"
          />
          <button onClick={addDataPoint} className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg">+</button>
        </div>
        <div className="space-y-1">
          {(config.chartData || []).map((item: { label: string; value: number; color?: string }, idx: number) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color || '#8B5CF6' }} />
              <span>{item.label}</span>
              <span className="font-medium ml-auto">{item.value}</span>
              <button
                onClick={() => {
                  const data = [...(config.chartData || [])];
                  data.splice(idx, 1);
                  updateConfig({ chartData: data });
                }}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 随机事件属性编辑
// ============================================================
export function RandomEventPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'randomEvent' };
  const [newOption, setNewOption] = useState('');

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  const addOption = () => {
    if (!newOption.trim()) return;
    updateConfig({ randomOptions: [...(config.randomOptions || []), newOption.trim()] });
    setNewOption('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">选项列表</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addOption()}
            placeholder="输入选项"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button onClick={addOption} className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg">添加</button>
        </div>
        <div className="flex flex-wrap gap-1">
          {(config.randomOptions || []).map((opt: string, idx: number) => (
            <div key={idx} className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-full text-xs">
              {opt}
              <button
                onClick={() => {
                  const opts = [...(config.randomOptions || [])];
                  opts.splice(idx, 1);
                  updateConfig({ randomOptions: opts });
                }}
                className="text-purple-400 hover:text-purple-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 快闪属性编辑
// ============================================================
export function FlashPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'flash' };
  const [newText, setNewText] = useState('');

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  const addText = () => {
    if (!newText.trim()) return;
    updateConfig({ flashTexts: [...(config.flashTexts || []), newText.trim()] });
    setNewText('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">切换间隔 (ms)</label>
        <input
          type="number"
          min="200"
          max="3000"
          step="100"
          value={config.flashInterval || 800}
          onChange={(e) => updateConfig({ flashInterval: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">快闪文字</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addText()}
            placeholder="输入文字"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button onClick={addText} className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg">添加</button>
        </div>
        <div className="flex flex-wrap gap-1">
          {(config.flashTexts || []).map((text: string, idx: number) => (
            <div key={idx} className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-xs">
              {text}
              <button
                onClick={() => {
                  const texts = [...(config.flashTexts || [])];
                  texts.splice(idx, 1);
                  updateConfig({ flashTexts: texts });
                }}
                className="text-orange-400 hover:text-orange-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 飘落物属性编辑
// ============================================================
export function FallingPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'falling' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">飘落类型</label>
        <div className="grid grid-cols-3 gap-2">
          {(['snow', 'confetti', 'hearts', 'stars', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => updateConfig({ fallingType: t })}
              className={`px-2 py-1.5 rounded-lg text-xs border ${
                config.fallingType === t ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-gray-200 text-gray-600'
              }`}
            >
              {t === 'snow' ? '❄️ 雪花' : t === 'confetti' ? '🎉 彩带' : t === 'hearts' ? '❤️ 爱心' : t === 'stars' ? '⭐ 星星' : '自定义'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 模拟对话属性编辑
// ============================================================
export function SimulateChatPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'simulateChat' };
  const [sender, setSender] = useState('');
  const [content, setContent] = useState('');
  const [isMe, setIsMe] = useState(false);

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  const addMessage = () => {
    if (!sender.trim() || !content.trim()) return;
    updateConfig({
      chatMessages: [...(config.chatMessages || []), { sender: sender.trim(), content: content.trim(), isMe }],
    });
    setSender('');
    setContent('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">对话内容</label>
        <div className="space-y-2 mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="发送者"
              className="w-24 px-2 py-1.5 border border-gray-200 rounded text-sm"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMe(false)}
                className={`px-2 py-1 text-xs rounded ${!isMe ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}
              >
                对方
              </button>
              <button
                onClick={() => setIsMe(true)}
                className={`px-2 py-1 text-xs rounded ${isMe ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'}`}
              >
                我
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMessage()}
              placeholder="消息内容"
              className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
            />
            <button onClick={addMessage} className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg">添加</button>
          </div>
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {(config.chatMessages || []).map((msg: { sender: string; content: string; isMe: boolean }, idx: number) => (
            <div key={idx} className={`flex gap-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[80%] ${
                msg.isMe ? 'bg-purple-100 text-purple-700 rounded-br-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'
              }`}>
                <span className="font-medium text-[10px] opacity-60">{msg.sender}</span>
                <p>{msg.content}</p>
              </div>
              <button
                onClick={() => {
                  const msgs = [...(config.chatMessages || [])];
                  msgs.splice(idx, 1);
                  updateConfig({ chatMessages: msgs });
                }}
                className="text-red-400 hover:text-red-600 self-start"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 目录属性编辑
// ============================================================
export function TocPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement, currentCard } = useEditorStore();
  const config = element.componentConfig || { componentType: 'toc' };
  const [newTitle, setNewTitle] = useState('');

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  const addItem = () => {
    if (!newTitle.trim()) return;
    updateConfig({
      tocItems: [...(config.tocItems || []), { title: newTitle.trim(), pageIndex: (config.tocItems || []).length }],
    });
    setNewTitle('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">目录项</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="目录标题"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button onClick={addItem} className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg">添加</button>
        </div>
        <div className="space-y-1">
          {(config.tocItems || []).map((item: { title: string; pageIndex: number }, idx: number) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded text-xs">
              <span className="text-teal-500">📄</span>
              <span className="flex-1">{item.title}</span>
              <span className="text-gray-400">第{item.pageIndex + 1}页</span>
              <button
                onClick={() => {
                  const items = [...(config.tocItems || [])];
                  items.splice(idx, 1);
                  updateConfig({ tocItems: items });
                }}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 底部菜单属性编辑
// ============================================================
export function BottomMenuPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'bottomMenu' };
  const [newLabel, setNewLabel] = useState('');

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  const addItem = () => {
    if (!newLabel.trim()) return;
    const icons = ['home', 'compass', 'heart', 'star', 'user'];
    updateConfig({
      menuItems: [...(config.menuItems || []), { label: newLabel.trim(), icon: icons[(config.menuItems || []).length % icons.length], target: `page${(config.menuItems || []).length + 1}` }],
    });
    setNewLabel('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">菜单项</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="菜单名称"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <button onClick={addItem} className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg">添加</button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {(config.menuItems || []).map((item: { label: string; icon: string }, idx: number) => (
            <div key={idx} className="flex items-center gap-1 bg-teal-50 text-teal-600 px-2 py-1 rounded-full text-xs">
              {item.label}
              <button
                onClick={() => {
                  const items = [...(config.menuItems || [])];
                  items.splice(idx, 1);
                  updateConfig({ menuItems: items });
                }}
                className="text-teal-400 hover:text-teal-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 页面跳转属性编辑
// ============================================================
export function PageJumpPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement, currentCard } = useEditorStore();
  const config = element.componentConfig || { componentType: 'pageJump' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">跳转目标页</label>
        <select
          value={config.jumpTargetPage || 1}
          onChange={(e) => updateConfig({ jumpTargetPage: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          {currentCard.pages.map((_: unknown, idx: number) => (
            <option key={idx} value={idx + 1}>第 {idx + 1} 页</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">按钮文字</label>
        <input
          type="text"
          value={config.jumpLabel || '前往下一页'}
          onChange={(e) => updateConfig({ jumpLabel: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">或输入跳转链接</label>
        <input
          type="text"
          value={config.jumpTargetUrl || ''}
          onChange={(e) => updateConfig({ jumpTargetUrl: e.target.value })}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
    </div>
  );
}

// ============================================================
// 天气属性编辑
// ============================================================
export function WeatherPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'weather' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">城市</label>
        <input
          type="text"
          value={config.weatherCity || '北京'}
          onChange={(e) => updateConfig({ weatherCity: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
      <p className="text-xs text-gray-400">* 预览时将显示模拟天气数据</p>
    </div>
  );
}

// ============================================================
// 动态数字属性编辑
// ============================================================
export function DynamicNumberPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'dynamicNumber' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">目标数字</label>
        <input
          type="number"
          value={config.dynamicNumberTarget || 0}
          onChange={(e) => updateConfig({ dynamicNumberTarget: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">动画时长 (ms)</label>
        <input
          type="number"
          min="500"
          max="10000"
          step="500"
          value={config.dynamicNumberDuration || 2000}
          onChange={(e) => updateConfig({ dynamicNumberDuration: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      </div>
    </div>
  );
}

// ============================================================
// 年龄改变属性编辑
// ============================================================
export function AgeChangePropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'ageChange' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">起始年龄</label>
          <input
            type="number"
            min="1"
            max="120"
            value={config.ageFrom || 18}
            onChange={(e) => updateConfig({ ageFrom: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">目标年龄</label>
          <input
            type="number"
            min="1"
            max="120"
            value={config.ageTo || 25}
            onChange={(e) => updateConfig({ ageTo: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 画板属性编辑
// ============================================================
export function DrawingBoardPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'drawingBoard' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">背景颜色</label>
        <input
          type="color"
          value={config.canvasBgColor || '#ffffff'}
          onChange={(e) => updateConfig({ canvasBgColor: e.target.value })}
          className="w-10 h-10 border border-gray-200 rounded cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">默认画笔颜色</label>
        <input
          type="color"
          value={config.canvasBrushColor || '#8B5CF6'}
          onChange={(e) => updateConfig({ canvasBrushColor: e.target.value })}
          className="w-10 h-10 border border-gray-200 rounded cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">默认画笔大小</label>
        <input
          type="range"
          min="1"
          max="12"
          value={config.canvasBrushSize || 4}
          onChange={(e) => updateConfig({ canvasBrushSize: Number(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
}

// ============================================================
// 渐变属性编辑
// ============================================================
export function GradientPropertyEditor({ element }: ComponentPropertyEditorProps) {
  const { updateElement } = useEditorStore();
  const config = element.componentConfig || { componentType: 'gradient' };

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    updateElement(element.id, {
      componentConfig: { ...config, ...updates },
    });
  };

  const addColor = () => {
    const colors = [...(config.gradientColors || []), '#8B5CF6'];
    updateConfig({ gradientColors: colors });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">渐变方向</label>
        <select
          value={config.gradientDirection || 'to bottom right'}
          onChange={(e) => updateConfig({ gradientDirection: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="to right">水平 →</option>
          <option value="to bottom">垂直 ↓</option>
          <option value="to bottom right">对角线 ↘</option>
          <option value="to bottom left">对角线 ↙</option>
          <option value="to top">向上 ↑</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">渐变色</label>
        <div className="flex gap-2 flex-wrap mb-2">
          {(config.gradientColors || ['#8B5CF6', '#EC4899', '#06B6D4']).map((color: string, idx: number) => (
            <div key={idx} className="flex items-center gap-1">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  const colors = [...(config.gradientColors || [])];
                  colors[idx] = e.target.value;
                  updateConfig({ gradientColors: colors });
                }}
                className="w-8 h-8 border border-gray-200 rounded cursor-pointer"
              />
              {(config.gradientColors || []).length > 2 && (
                <button
                  onClick={() => {
                    const colors = [...(config.gradientColors || [])];
                    colors.splice(idx, 1);
                    updateConfig({ gradientColors: colors });
                  }}
                  className="text-red-400 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button onClick={addColor} className="w-8 h-8 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm hover:border-purple-300">
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 主入口：根据 componentType 返回对应的属性编辑器
// ============================================================
export function getComponentPropertyEditor(element: CardElement): React.ReactNode | null {
  const componentType = element.componentConfig?.componentType;

  if (!componentType) return null;

  switch (componentType) {
    case 'puzzle':
      return <PuzzlePropertyEditor element={element} />;
    case 'carousel':
      return <CarouselPropertyEditor element={element} />;
    case 'barrage':
      return <BarragePropertyEditor element={element} />;
    case 'messageBoard':
      return <MessageBoardPropertyEditor element={element} />;
    case 'timer':
      return <TimerPropertyEditor element={element} />;
    case 'chart':
      return <ChartPropertyEditor element={element} />;
    case 'randomEvent':
      return <RandomEventPropertyEditor element={element} />;
    case 'flash':
      return <FlashPropertyEditor element={element} />;
    case 'falling':
      return <FallingPropertyEditor element={element} />;
    case 'simulateChat':
      return <SimulateChatPropertyEditor element={element} />;
    case 'toc':
      return <TocPropertyEditor element={element} />;
    case 'bottomMenu':
      return <BottomMenuPropertyEditor element={element} />;
    case 'pageJump':
      return <PageJumpPropertyEditor element={element} />;
    case 'weather':
      return <WeatherPropertyEditor element={element} />;
    case 'dynamicNumber':
      return <DynamicNumberPropertyEditor element={element} />;
    case 'ageChange':
      return <AgeChangePropertyEditor element={element} />;
    case 'drawingBoard':
      return <DrawingBoardPropertyEditor element={element} />;
    case 'gradient':
      return <GradientPropertyEditor element={element} />;
    default:
      return null;
  }
}
