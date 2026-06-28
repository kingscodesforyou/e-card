import { useState } from 'react';
import { Music, Image as ImageIcon, Settings, Upload, X, Sparkles, Loader2 } from 'lucide-react';
import { useEditorStore } from '../../store';
import { ai } from '../../lib/ai';

const PageSettingsPanel = () => {
  const { currentCard, updatePage } = useEditorStore();
  const currentPage = currentCard.pages[currentCard.currentPageIndex];
  
  const [bgTab, setBgTab] = useState<'color' | 'image'>('color');
  const [audioUrl, setAudioUrl] = useState(currentPage?.audioUrl || '');
  const [aiBgDesc, setAiBgDesc] = useState('');
  const [aiBgGenerating, setAiBgGenerating] = useState(false);
  const [aiBgError, setAiBgError] = useState('');
  const [aiBgPreview, setAiBgPreview] = useState('');

  if (!currentPage) return null;

  const handleBackgroundColorChange = (color: string) => {
    updatePage(currentPage.id, { backgroundColor: color });
  };

  const handleBackgroundImageChange = (url: string) => {
    updatePage(currentPage.id, { backgroundUrl: url });
  };

  const handleAudioChange = (url: string) => {
    setAudioUrl(url);
    updatePage(currentPage.id, { audioUrl: url });
  };

  const handleAudioLoopToggle = () => {
    updatePage(currentPage.id, { audioLoop: !currentPage.audioLoop });
  };

  const handleAudioAutoplayToggle = () => {
    updatePage(currentPage.id, { audioAutoplay: !currentPage.audioAutoplay });
  };

  const handleTransitionChange = (transition: 'none' | 'fade' | 'slide' | 'zoom' | 'flip') => {
    updatePage(currentPage.id, { transition });
  };

  const handleRemoveBackground = () => {
    updatePage(currentPage.id, { backgroundUrl: undefined, backgroundColor: '#ffffff' });
  };

  const handleAiGenerateBackground = async () => {
    if (!aiBgDesc.trim()) return;
    setAiBgGenerating(true);
    setAiBgError('');
    setAiBgPreview('');

    const { data, error } = await ai.generateBackground(aiBgDesc);
    if (error) {
      setAiBgError(error.message || '生成失败');
    } else if (data) {
      setAiBgPreview(data);
    }
    setAiBgGenerating(false);
  };

  const handleApplyAiBackground = () => {
    if (aiBgPreview) {
      handleBackgroundImageChange(aiBgPreview);
      setAiBgPreview('');
      setAiBgDesc('');
    }
  };

  const handleRemoveAudio = () => {
    setAudioUrl('');
    updatePage(currentPage.id, { audioUrl: undefined });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        页面设置
      </h3>

      {/* 背景设置 */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          页面背景
        </label>
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setBgTab('color')}
            className={`flex-1 text-xs py-1 rounded ${
              bgTab === 'color'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            颜色
          </button>
          <button
            onClick={() => setBgTab('image')}
            className={`flex-1 text-xs py-1 rounded ${
              bgTab === 'image'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            图片
          </button>
        </div>

        {bgTab === 'color' ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentPage.backgroundColor || '#ffffff'}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={currentPage.backgroundColor || '#ffffff'}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="#ffffff"
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={currentPage.backgroundUrl || ''}
                onChange={(e) => handleBackgroundImageChange(e.target.value)}
                placeholder="图片URL"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              />
              <button
                className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                title="上传图片"
              >
                <Upload className="w-3 h-3" />
              </button>
            </div>
            {currentPage.backgroundUrl && (
              <button
                onClick={handleRemoveBackground}
                className="mt-1 text-xs text-red-600 hover:text-red-700"
              >
                移除背景图
              </button>
            )}

            {/* AI 背景图生成 */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                AI 生成背景图
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={aiBgDesc}
                  onChange={(e) => setAiBgDesc(e.target.value)}
                  placeholder="描述背景，如：金色烟花中国风"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  onKeyDown={(e) => e.key === 'Enter' && handleAiGenerateBackground()}
                />
                <button
                  onClick={handleAiGenerateBackground}
                  disabled={aiBgGenerating || !aiBgDesc.trim()}
                  className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {aiBgGenerating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  生成
                </button>
              </div>

              {aiBgError && (
                <p className="text-xs text-red-500 mt-1">{aiBgError}</p>
              )}

              {aiBgPreview && (
                <div className="mt-2">
                  <div className="relative">
                    <img
                      src={aiBgPreview}
                      alt="AI 生成背景"
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={handleApplyAiBackground}
                      className="flex-1 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                    >
                      应用为背景
                    </button>
                    <button
                      onClick={() => { setAiBgPreview(''); setAiBgDesc(''); }}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 音频设置 */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
          <Music className="w-3 h-3" />
          页面音频
        </label>
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={audioUrl}
              onChange={(e) => handleAudioChange(e.target.value)}
              placeholder="音频URL"
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <button
              className="p-1 bg-gray-100 rounded hover:bg-gray-200"
              title="上传音频"
            >
              <Upload className="w-3 h-3" />
            </button>
            {audioUrl && (
              <button
                onClick={handleRemoveAudio}
                className="p-1 bg-gray-100 rounded hover:bg-red-50"
                title="移除音频"
              >
                <X className="w-3 h-3 text-red-600" />
              </button>
            )}
          </div>
          {currentPage.audioUrl && (
            <>
              <audio src={currentPage.audioUrl} controls className="w-full h-8" />
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={currentPage.audioLoop || false}
                    onChange={handleAudioLoopToggle}
                    className="rounded"
                  />
                  循环播放
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={currentPage.audioAutoplay || false}
                    onChange={handleAudioAutoplayToggle}
                    className="rounded"
                  />
                  翻到此页自动播放
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 页面切换动画 */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-2 block">
          切换动画
        </label>
        <select
          value={currentPage.transition || 'none'}
          onChange={(e) => handleTransitionChange(e.target.value as any)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
        >
          <option value="none">无动画</option>
          <option value="fade">淡入淡出</option>
          <option value="slide">滑动</option>
          <option value="zoom">缩放</option>
          <option value="flip">翻转</option>
        </select>
      </div>
    </div>
  );
};

export default PageSettingsPanel;
