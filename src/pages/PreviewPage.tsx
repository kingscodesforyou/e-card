import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, VolumeX, Download, Link, Mail, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store';
import { CardElement } from '../types';
import { getElementVisualStyle } from '../lib/elementStyle';

const PreviewPage = () => {
  const navigate = useNavigate();
  const { currentCard } = useEditorStore();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const bgAudioRef = useRef<HTMLAudioElement>(null);
  const pageAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!currentCard.templateId) {
      navigate('/editor');
    }
  }, [currentCard.templateId, navigate]);

  const currentPage = currentCard.pages[currentPageIndex];
  const totalPages = currentCard.pages.length;

  // 翻页处理
  const goToPage = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= totalPages || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrentPageIndex(newIndex);
      setTransitioning(false);
    }, 300);
  };

  // 播放页面专属音频
  useEffect(() => {
    if (pageAudioRef.current && currentPage?.audioUrl) {
      if (currentPage.audioAutoplay) {
        pageAudioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      if (pageAudioRef.current) {
        pageAudioRef.current.pause();
      }
    }
  }, [currentPageIndex, currentPage?.audioUrl, currentPage?.audioAutoplay]);

  // 播放背景音乐
  useEffect(() => {
    if (bgAudioRef.current) {
      if (isMuted) {
        bgAudioRef.current.pause();
      } else if (currentCard.backgroundMusicUrl) {
        bgAudioRef.current.play().catch(() => {});
      }
    }
  }, [isMuted, currentCard.backgroundMusicUrl]);

  if (!currentPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">贺卡加载中...</h3>
          <p className="text-gray-500">请稍候，正在加载贺卡内容</p>
        </div>
      </div>
    );
  }

  // 渲染页面元素
  const renderElement = (element: CardElement) => {
    const layoutStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      width: element.size ? `${element.size.width}%` : 'auto',
      height: element.size ? `${element.size.height}%` : 'auto',
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      zIndex: element.zIndex || 1,
    };
    const style = getElementVisualStyle(element, layoutStyle);

    if (element.type === 'text') {
      return (
        <div key={element.id} style={style} className={element.style.fontStyle === 'italic' ? 'italic' : ''}>
          {element.content}
        </div>
      );
    }

    if (element.type === 'image') {
      return (
        <img
          key={element.id}
          src={element.content}
          alt=""
          style={{ ...style, objectFit: 'cover' }}
        />
      );
    }

    if (element.type === 'shape') {
      return (
        <div
          key={element.id}
          style={style}
        />
      );
    }

    if (element.type === 'icon') {
      return (
        <div key={element.id} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {element.content}
        </div>
      );
    }

    return null;
  };

  // 翻页动画类
  const getTransitionClass = () => {
    if (!transitioning) return 'opacity-100 scale-100';
    const transition = currentCard.pages[currentPageIndex]?.transition;
    if (transition === 'fade') return 'opacity-0 scale-100';
    if (transition === 'zoom') return 'opacity-0 scale-95';
    if (transition === 'slide') return 'opacity-0 translate-x-4';
    return 'opacity-0';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pt-20 pb-8">
      {/* 背景音乐 */}
      {currentCard.backgroundMusicUrl && (
        <audio
          ref={bgAudioRef}
          src={currentCard.backgroundMusicUrl}
          loop={currentCard.backgroundMusicLoop !== false}
          autoPlay
        />
      )}

      {/* 页面专属音频 */}
      {currentPage.audioUrl && (
        <audio
          ref={pageAudioRef}
          src={currentPage.audioUrl}
          loop={currentPage.audioLoop || false}
        />
      )}

      <div className="max-w-4xl mx-auto px-4">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/editor')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回编辑</span>
          </button>

          <div className="flex items-center gap-3">
            {/* 页码指示器 */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-lg shadow-sm">
                <span className="text-sm text-gray-700 font-medium">
                  {currentPageIndex + 1} / {totalPages}
                </span>
              </div>
            )}

            {/* 背景音乐控制 */}
            {currentCard.backgroundMusicUrl && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                title={isMuted ? '开启背景音乐' : '关闭背景音乐'}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-gray-600" /> : <Volume2 className="w-5 h-5 text-purple-600" />}
              </button>
            )}

            {/* 页面音频控制 */}
            {currentPage.audioUrl && (
              <button
                onClick={() => {
                  if (pageAudioRef.current) {
                    if (isPlaying) {
                      pageAudioRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      pageAudioRef.current.play();
                      setIsPlaying(true);
                    }
                  }
                }}
                className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                title={isPlaying ? '暂停页面音频' : '播放页面音频'}
              >
                {isPlaying ? <Pause className="w-5 h-5 text-purple-600" /> : <Play className="w-5 h-5 text-purple-600" />}
              </button>
            )}

            <button
              onClick={() => navigate('/export')}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>
          </div>
        </div>

        {/* 贺卡展示区 */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div
              className={`rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${getTransitionClass()}`}
              style={{
                width: 'min(90vw, 400px)',
                height: 'min(120vw, 560px)',
                aspectRatio: '3/4',
                backgroundImage: currentPage.backgroundUrl ? `url(${currentPage.backgroundUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: currentPage.backgroundColor || '#ffffff',
              }}
            >
              {currentPage.elements.map(renderElement)}
            </div>

            {/* 翻页按钮 */}
            {totalPages > 1 && (
              <>
                {currentPageIndex > 0 && (
                  <button
                    onClick={() => goToPage(currentPageIndex - 1)}
                    className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                )}
                {currentPageIndex < totalPages - 1 && (
                  <button
                    onClick={() => goToPage(currentPageIndex + 1)}
                    className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                )}
              </>
            )}

            <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">预览</span>
            </div>
          </div>

          {/* 页码指示器（点状） */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4">
              {currentCard.pages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentPageIndex
                      ? 'w-8 bg-purple-500'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{currentCard.title}</h2>
            <p className="text-gray-500 mb-6">预览效果，确认无误后即可导出</p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Link className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">生成链接</span>
              </button>
              <button
                onClick={() => navigate('/export')}
                className="px-6 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">下载 PDF</span>
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <span>发送邮件</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
