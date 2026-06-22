import { useState } from 'react';
import { Music, Image as ImageIcon, Settings, Upload, X } from 'lucide-react';
import { useEditorStore } from '../../store';

const PageSettingsPanel = () => {
  const { currentCard, updatePage } = useEditorStore();
  const currentPage = currentCard.pages[currentCard.currentPageIndex];
  
  const [bgTab, setBgTab] = useState<'color' | 'image'>('color');
  const [audioUrl, setAudioUrl] = useState(currentPage?.audioUrl || '');

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
