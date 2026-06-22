import { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, Upload, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store';

const MusicPanel = () => {
  const { currentCard, setCurrentCard } = useEditorStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleMusicUrlChange = (url: string) => {
    setCurrentCard({ backgroundMusicUrl: url });
  };

  const handleLoopToggle = () => {
    setCurrentCard({ backgroundMusicLoop: !currentCard.backgroundMusicLoop });
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !currentCard.backgroundMusicUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRemove = () => {
    setCurrentCard({ backgroundMusicUrl: undefined });
    setIsPlaying(false);
  };

  // 预设音乐
  const presetMusic = [
    { name: '生日快乐', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_b0ee2d9cbe.mp3' },
    { name: '新年快乐', url: 'https://cdn.pixabay.com/audio/2022/01/26/audio_d0c6ff1bdd.mp3' },
    { name: '婚礼进行曲', url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_347111d564.mp3' },
    { name: '轻柔钢琴', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Music className="w-4 h-4" />
        背景音乐
      </h3>

      {/* 当前音乐 */}
      {currentCard.backgroundMusicUrl ? (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handlePlayPause}
              className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 truncate">
                {currentCard.backgroundMusicUrl.split('/').pop()?.slice(0, 30)}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 hover:bg-red-50 rounded"
              title="移除"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          </div>

          <audio
            ref={audioRef}
            src={currentCard.backgroundMusicUrl}
            loop={currentCard.backgroundMusicLoop !== false}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          {/* 音量控制 */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3 h-3" />
              ) : (
                <Volume2 className="w-3 h-3" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="flex-1"
            />
          </div>

          {/* 循环选项 */}
          <label className="flex items-center gap-2 mt-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={currentCard.backgroundMusicLoop !== false}
              onChange={handleLoopToggle}
              className="rounded"
            />
            循环播放
          </label>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400 text-xs">
          暂未设置背景音乐
        </div>
      )}

      {/* 自定义URL */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-1 block">
          音乐URL
        </label>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={currentCard.backgroundMusicUrl || ''}
            onChange={(e) => handleMusicUrlChange(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
          />
          <button
            className="p-1 bg-gray-100 rounded hover:bg-gray-200"
            title="上传音乐"
          >
            <Upload className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 预设音乐 */}
      <div>
        <label className="text-xs font-medium text-gray-700 mb-2 block">
          预设音乐
        </label>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {presetMusic.map((music) => (
            <button
              key={music.url}
              onClick={() => handleMusicUrlChange(music.url)}
              className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-purple-50 ${
                currentCard.backgroundMusicUrl === music.url
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-700'
              }`}
            >
              ♪ {music.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MusicPanel;
