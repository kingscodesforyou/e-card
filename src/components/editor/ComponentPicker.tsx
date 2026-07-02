import { useState, useEffect, useRef } from 'react';
import { Grid3X3, Eye, MousePointer, Sparkles, Zap, Navigation, Image, PieChart, Calendar, MapPin, User, MessageSquare, Heart, ThumbsUp, Star, Play, RotateCcw, PenTool, Scan, Volume2, Music, Bookmark, FolderOpen, Menu, ChevronRight, Plus } from 'lucide-react';
import { useEditorStore } from '../../store';

interface ComponentItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  preview: React.ReactNode;
  elementData: {
    type: 'text' | 'image' | 'shape' | 'icon';
    content: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
    style: Record<string, unknown>;
  };
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  components: ComponentItem[];
}

const categories: Category[] = [
  // ═══════════════════════════════════════════════════════════════════
  //  视觉
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'visual',
    name: '视觉',
    icon: <Eye className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    components: [
      {
        id: 'visual-puzzle',
        name: '拼图',
        icon: <Grid3X3 className="w-4 h-4" />,
        description: '多图拼接展示',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="grid grid-cols-3 gap-0.5 w-20 h-20">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="rounded-sm bg-gradient-to-br from-purple-400 to-pink-400" style={{ opacity: 1 - i * 0.08 }} />
              ))}
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '拼图组件', position: { x: 25, y: 35 }, size: { width: 50, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'visual-carousel',
        name: '轮播图',
        icon: <Play className="w-4 h-4" />,
        description: '自动轮播图片',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-24 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center relative overflow-hidden">
              <Image className="w-8 h-8 text-white" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '轮播图组件', position: { x: 25, y: 35 }, size: { width: 50, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'visual-chart',
        name: '数据图表',
        icon: <PieChart className="w-4 h-4" />,
        description: '可视化数据展示',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-end gap-1.5 h-16">
              {[40, 65, 85, 55, 70].map((h, i) => (
                <div key={i} className="w-4 bg-gradient-to-t from-purple-400 to-purple-600 rounded-t" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '图表组件', position: { x: 30, y: 40 }, size: { width: 40, height: 20 }, style: { fontSize: 16, textAlign: 'center', color: '#666' } },
      },
      {
        id: 'visual-cube',
        name: '立体魔方',
        icon: <Grid3X3 className="w-4 h-4" />,
        description: '3D立体魔方效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-purple-400 rounded-lg opacity-70 translate-x-1 translate-y-1" />
              <div className="absolute inset-0 bg-pink-400 rounded-lg opacity-80 -translate-x-0.5 -translate-y-0.5" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                <Grid3X3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '魔方组件', position: { x: 30, y: 35 }, size: { width: 40, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'visual-wechat-avatar',
        name: '微信头像',
        icon: <User className="w-4 h-4" />,
        description: '微信风格头像',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-md flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        ),
        elementData: { type: 'icon', content: '👤', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 36, textAlign: 'center' } },
      },
      {
        id: 'visual-avatar-wall',
        name: '头像墙',
        icon: <User className="w-4 h-4" />,
        description: '用户头像展示',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex -space-x-3">
              {['bg-purple-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400'].map((color, i) => (
                <div key={i} className={`w-9 h-9 ${color} rounded-full border-2 border-white shadow-sm flex items-center justify-center`}>
                  <User className="w-4 h-4 text-white" />
                </div>
              ))}
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '👥', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 32, textAlign: 'center' } },
      },
      {
        id: 'visual-dynamic-number',
        name: '动态数字',
        icon: <PieChart className="w-4 h-4" />,
        description: '动态变化数字',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">88</span>
              <span className="text-xs text-green-500">+12%</span>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '88', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#8B5CF6' } },
      },
      {
        id: 'visual-weather',
        name: '天气',
        icon: <Sparkles className="w-4 h-4" />,
        description: '实时天气显示',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-2">
              <div className="text-3xl">☀️</div>
              <div>
                <div className="text-lg font-bold text-gray-800">26°</div>
                <div className="text-xs text-gray-400">晴</div>
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '☀️ 26° 晴', position: { x: 35, y: 40 }, size: { width: 30, height: 20 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'visual-real-date',
        name: '实时日期',
        icon: <Calendar className="w-4 h-4" />,
        description: '动态显示日期',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-sm p-2 border border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-500">2026年</div>
                <div className="text-lg font-bold text-gray-800">7月2日</div>
                <div className="text-xs text-gray-500">周四</div>
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }), position: { x: 30, y: 40 }, size: { width: 40, height: 20 }, style: { fontSize: 14, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'visual-real-location',
        name: '实时位置',
        icon: <MapPin className="w-4 h-4" />,
        description: '显示位置信息',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-xl">
              <MapPin className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-xs font-medium text-gray-700">当前定位</div>
                <div className="text-[10px] text-gray-400">北京市朝阳区</div>
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'icon', content: '📍', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 32, textAlign: 'center' } },
      },
      {
        id: 'visual-timer',
        name: '计时',
        icon: <RotateCcw className="w-4 h-4" />,
        description: '计时器功能',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl">⏱️</div>
              <div className="text-center">
                <div className="text-lg font-mono font-bold text-gray-800">05:32</div>
                <div className="text-[10px] text-gray-400">已用时</div>
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '00:00', position: { x: 40, y: 45 }, size: { width: 20, height: 10 }, style: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333' } },
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════
  //  交互
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'interaction',
    name: '交互',
    icon: <MousePointer className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    components: [
      {
        id: 'interact-drawing-board',
        name: '画板',
        icon: <PenTool className="w-4 h-4" />,
        description: '自由绘画画板',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full rounded-xl bg-white shadow-sm border border-gray-100 p-3">
              <div className="flex items-center gap-1 mb-2">
                {['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'].map((c) => (<div key={c} className={`w-3 h-3 rounded-full ${c}`} />))}
              </div>
              <div className="h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <PenTool className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '画板组件', position: { x: 25, y: 35 }, size: { width: 50, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'interact-screenshot',
        name: '点击截图',
        icon: <Image className="w-4 h-4" />,
        description: '截图保存功能',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-100 mx-auto mb-2 flex items-center justify-center">
                <Image className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-xs text-gray-400">点击截图</div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '截图组件', position: { x: 30, y: 35 }, size: { width: 40, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'interact-message-board',
        name: '留言板',
        icon: <MessageSquare className="w-4 h-4" />,
        description: '用户留言互动',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full space-y-2">
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-green-300 flex-shrink-0" />
                <div className="flex-1 bg-green-50 rounded-xl rounded-tl-none px-2 py-1.5">
                  <p className="text-[10px] text-gray-600">好漂亮的贺卡！</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="flex-1 bg-gray-50 rounded-xl rounded-tr-none px-2 py-1.5">
                  <p className="text-[10px] text-gray-600">谢谢 😊</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-pink-300 flex-shrink-0" />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '留言板组件', position: { x: 25, y: 35 }, size: { width: 50, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'interact-barrage',
        name: '弹幕',
        icon: <MessageSquare className="w-4 h-4" />,
        description: '滚动弹幕效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
            <div className="relative w-full">
              <div className="text-xs text-purple-500 whitespace-nowrap animate-[slideInRight_2s_linear_infinite]">祝生日快乐！🎂</div>
              <div className="text-xs text-pink-500 whitespace-nowrap animate-[slideInRight_2s_linear_infinite] mt-1" style={{ animationDelay: '0.8s' }}>永远开心！🎉</div>
              <div className="text-xs text-blue-500 whitespace-nowrap animate-[slideInRight_2s_linear_infinite] mt-1" style={{ animationDelay: '1.6s' }}>万事如意！✨</div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '弹幕组件', position: { x: 20, y: 30 }, size: { width: 60, height: 40 }, style: { fontSize: 14, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'interact-like',
        name: '点赞',
        icon: <Heart className="w-4 h-4" />,
        description: '点赞互动功能',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-1">
              <Heart className="w-8 h-8 text-red-500" />
              <span className="text-sm font-medium text-gray-700">128</span>
            </div>
          </div>
        ),
        elementData: { type: 'icon', content: '❤️', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 36, textAlign: 'center' } },
      },
      {
        id: 'interact-views',
        name: '浏览次数',
        icon: <Eye className="w-4 h-4" />,
        description: '显示浏览计数',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-6 h-6 text-gray-400" />
              <span className="text-lg font-bold text-gray-700">2,358</span>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '查看次数: 0', position: { x: 35, y: 45 }, size: { width: 30, height: 10 }, style: { fontSize: 14, textAlign: 'center', color: '#999' } },
      },
      {
        id: 'interact-voice',
        name: '语音',
        icon: <Volume2 className="w-4 h-4" />,
        description: '语音录制播放',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mx-auto mb-2 flex items-center justify-center shadow-md">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center justify-center gap-0.5">
                <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" />
                <div className="w-1 h-5 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'icon', content: '🎤', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 36, textAlign: 'center' } },
      },
      {
        id: 'interact-photo',
        name: '照片',
        icon: <Image className="w-4 h-4" />,
        description: '拍照上传功能',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
              <Image className="w-8 h-8 text-purple-300" />
              <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-0.5 rounded text-[10px] text-gray-500">点击拍照</div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '照片组件', position: { x: 25, y: 30 }, size: { width: 50, height: 40 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'interact-sound-effect',
        name: '音效',
        icon: <Volume2 className="w-4 h-4" />,
        description: '音效播放控制',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-3">
              <Volume2 className="w-7 h-7 text-purple-500" />
              <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'icon', content: '🔊', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 32, textAlign: 'center' } },
      },
      {
        id: 'interact-map',
        name: '地图',
        icon: <MapPin className="w-4 h-4" />,
        description: '地图位置展示',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-green-100 to-blue-100 relative flex items-center justify-center">
              <MapPin className="w-6 h-6 text-red-500" />
            </div>
          </div>
        ),
        elementData: { type: 'icon', content: '🗺️', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 36, textAlign: 'center' } },
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════
  //  趣味
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'fun',
    name: '趣味',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    components: [
      {
        id: 'fun-age-change',
        name: '年龄改变',
        icon: <User className="w-4 h-4" />,
        description: '趣味年龄变化',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-white font-bold text-sm">18</div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">25</div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '年龄改变组件', position: { x: 30, y: 40 }, size: { width: 40, height: 20 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'fun-face-recognition',
        name: '人脸识别',
        icon: <Scan className="w-4 h-4" />,
        description: '人脸识别检测',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border-2 border-dashed border-purple-300">
              <User className="w-7 h-7 text-purple-400" />
              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-purple-400" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-purple-400" />
              <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-purple-400" />
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-purple-400" />
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '人脸识别', position: { x: 30, y: 35 }, size: { width: 40, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'fun-face-merge',
        name: '人脸融合',
        icon: <User className="w-4 h-4" />,
        description: '趣味人脸融合',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-yellow-300 flex items-center justify-center text-sm">😊</div>
              <Plus className="w-3 h-3 text-gray-400" />
              <div className="w-9 h-9 rounded-full bg-blue-300 flex items-center justify-center text-sm">😎</div>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-300 to-blue-300 flex items-center justify-center text-sm">🤩</div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '人脸融合', position: { x: 30, y: 40 }, size: { width: 40, height: 20 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'fun-simulate-chat',
        name: '模拟对话',
        icon: <MessageSquare className="w-4 h-4" />,
        description: '模拟聊天对话',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full space-y-1.5">
              <div className="flex gap-1.5">
                <div className="w-4 h-4 rounded-full bg-purple-300 flex-shrink-0 mt-0.5" />
                <div className="bg-purple-50 rounded-xl rounded-tl-none px-2 py-1"><p className="text-[10px] text-gray-600">你好呀！</p></div>
              </div>
              <div className="flex gap-1.5 justify-end">
                <div className="bg-pink-50 rounded-xl rounded-tr-none px-2 py-1"><p className="text-[10px] text-gray-600">节日快乐！</p></div>
                <div className="w-4 h-4 rounded-full bg-pink-300 flex-shrink-0 mt-0.5" />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '模拟对话', position: { x: 25, y: 35 }, size: { width: 50, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'fun-voice-assistant',
        name: '语音助手',
        icon: <Volume2 className="w-4 h-4" />,
        description: '语音交互助手',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 mx-auto mb-2 flex items-center justify-center shadow-md">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs text-gray-400">语音助手</div>
              <div className="text-[10px] text-gray-300 mt-0.5">"有什么可以帮您？"</div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '语音助手', position: { x: 30, y: 35 }, size: { width: 40, height: 30 }, style: { fontSize: 14, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'fun-random-event',
        name: '随机事件',
        icon: <Sparkles className="w-4 h-4" />,
        description: '随机抽取结果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="bg-purple-50 px-3 py-1.5 rounded-lg text-xs text-purple-600 font-medium mb-1">今日运势</div>
              <div className="text-[10px] text-gray-400">点击随机</div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '随机事件', position: { x: 35, y: 40 }, size: { width: 30, height: 20 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'fun-flash',
        name: '快闪',
        icon: <Zap className="w-4 h-4" />,
        description: '快闪展示效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg flex items-center justify-center animate-pulse">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-2 -right-2"><Zap className="w-4 h-4 text-yellow-500" /></div>
            </div>
          </div>
        ),
        elementData: { type: 'icon', content: '⭐', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 36, textAlign: 'center' } },
      },
      {
        id: 'fun-pip',
        name: '画中画',
        icon: <Image className="w-4 h-4" />,
        description: '画中画效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-xs text-gray-400">主画面</div>
              <div className="absolute bottom-2 right-2 w-10 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 shadow-md flex items-center justify-center">
                <Image className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '画中画组件', position: { x: 25, y: 30 }, size: { width: 50, height: 40 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'fun-word-art',
        name: '自说字画',
        icon: <PenTool className="w-4 h-4" />,
        description: '手写字画创作',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent mb-1">字画</div>
              <div className="flex items-center justify-center gap-1">
                <PenTool className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] text-gray-400">自说字画</span>
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '字画创作', position: { x: 30, y: 35 }, size: { width: 40, height: 30 }, style: { fontSize: 18, textAlign: 'center', color: '#333' } },
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════
  //  特效
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'effects',
    name: '特效',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    components: [
      {
        id: 'effect-paint',
        name: '涂抹',
        icon: <PenTool className="w-4 h-4" />,
        description: '涂抹擦除效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative w-full h-full rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute w-10 h-10 bg-purple-400 rounded-full -top-2 -left-2" />
                <div className="absolute w-8 h-8 bg-pink-400 rounded-full top-6 right-3" />
                <div className="absolute w-6 h-6 bg-blue-400 rounded-full bottom-3 left-6" />
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 flex items-center gap-1">
                <PenTool className="w-3 h-3" /> 涂抹
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '涂抹组件', position: { x: 30, y: 35 }, size: { width: 40, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'effect-fingerprint',
        name: '指纹',
        icon: <Scan className="w-4 h-4" />,
        description: '指纹识别效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center">
                <Scan className="w-10 h-10 text-purple-500" />
              </div>
              <div className="text-[10px] text-gray-400">指纹验证</div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '指纹组件', position: { x: 35, y: 40 }, size: { width: 30, height: 20 }, style: { fontSize: 14, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'effect-falling',
        name: '飘落物',
        icon: <Sparkles className="w-4 h-4" />,
        description: '飘落动画效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
            <div className="relative w-full h-full">
              {['bg-purple-400', 'bg-pink-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400'].map((c, i) => (
                <div key={i} className={`absolute w-2 h-2 ${c} rounded-full`}
                  style={{ left: `${15 + i * 18}%`, top: '10%', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </div>
          </div>
        ),
        elementData: { type: 'icon', content: '❄️', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 32, textAlign: 'center' } },
      },
      {
        id: 'effect-gradient',
        name: '渐变',
        icon: <Sparkles className="w-4 h-4" />,
        description: '渐变色彩效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 shadow-md flex items-center justify-center">
              <span className="text-white text-xs font-medium">渐变</span>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '渐变效果', position: { x: 30, y: 35 }, size: { width: 40, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#fff' } },
      },
      {
        id: 'effect-gravity',
        name: '重力感应',
        icon: <RotateCcw className="w-4 h-4" />,
        description: '重力感应效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="relative w-14 h-14 mx-auto mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl animate-pulse flex items-center justify-center shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-xs text-gray-400">重力感应</div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '重力感应', position: { x: 35, y: 40 }, size: { width: 30, height: 20 }, style: { fontSize: 14, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'effect-break-glass',
        name: '砸玻璃',
        icon: <Zap className="w-4 h-4" />,
        description: '砸玻璃碎裂效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-300 to-cyan-400 shadow-md flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0">
                <div className="absolute top-1/2 left-0 w-full h-px bg-gray-300 rotate-45 origin-center" />
                <div className="absolute top-1/2 left-0 w-full h-px bg-gray-300 -rotate-45 origin-center" />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'icon', content: '💎', position: { x: 40, y: 40 }, size: { width: 20, height: 20 }, style: { fontSize: 36, textAlign: 'center' } },
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════
  //  导航
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'navigation',
    name: '导航',
    icon: <Navigation className="w-4 h-4" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    components: [
      {
        id: 'nav-page-jump',
        name: '页面跳转',
        icon: <ChevronRight className="w-4 h-4" />,
        description: '页面跳转导航',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-2 bg-teal-50 px-3 py-2 rounded-xl">
              <span className="text-xs text-teal-600">前往</span>
              <ChevronRight className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-teal-600 font-medium">下一页</span>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '页面跳转', position: { x: 30, y: 40 }, size: { width: 40, height: 20 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'nav-document',
        name: '文档',
        icon: <Bookmark className="w-4 h-4" />,
        description: '文档展示组件',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full rounded-xl bg-white shadow-sm border border-gray-100 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bookmark className="w-4 h-4 text-teal-500" />
                <span className="text-xs font-medium text-gray-700">贺卡文档</span>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-gray-100 rounded" />
                <div className="h-1.5 w-3/4 bg-gray-100 rounded" />
                <div className="h-1.5 w-5/6 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '文档组件', position: { x: 25, y: 30 }, size: { width: 50, height: 40 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'nav-toc',
        name: '目录',
        icon: <FolderOpen className="w-4 h-4" />,
        description: '内容目录导航',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full space-y-1.5">
              {['封面', '祝福语', '回忆', '寄语'].map((item, i) => (
                <div key={item} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${i === 1 ? 'bg-teal-100 text-teal-700 font-medium' : 'text-gray-500'}`}>
                  <FolderOpen className={`w-3 h-3 ${i === 1 ? 'text-teal-500' : 'text-gray-300'}`} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '目录组件', position: { x: 30, y: 35 }, size: { width: 40, height: 30 }, style: { fontSize: 16, textAlign: 'center', color: '#333' } },
      },
      {
        id: 'nav-bottom-menu',
        name: '底部菜单',
        icon: <Menu className="w-4 h-4" />,
        description: '底部导航菜单',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-10 flex items-center justify-center text-xs text-gray-300">内容区域</div>
              <div className="flex border-t border-gray-100 bg-gray-50">
                {['首页', '发现', '我的'].map((tab) => (
                  <div key={tab} className="flex-1 py-1.5 flex flex-col items-center gap-0.5">
                    <Menu className={`w-3 h-3 ${tab === '发现' ? 'text-teal-500' : 'text-gray-300'}`} />
                    <span className={`text-[10px] ${tab === '发现' ? 'text-teal-500 font-medium' : 'text-gray-400'}`}>{tab}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
        elementData: { type: 'text', content: '底部菜单', position: { x: 25, y: 35 }, size: { width: 50, height: 30 }, style: { fontSize: 14, textAlign: 'center', color: '#333' } },
      },
    ],
  },
];


const ComponentPicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>('visual');
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const addElement = useEditorStore((state) => state.addElement);

  useEffect(() => {
    if (categories[0]?.components[0]) {
      setSelectedComponent(categories[0].components[0]);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMenuMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleComponentHover = (component: ComponentItem) => {
    setSelectedComponent(component);
  };

  const handleComponentSelect = (component: ComponentItem) => {
    addElement(component.elementData);
    setIsOpen(false);
  };

  const handleCategoryHover = (categoryId: string) => {
    setExpandedCategory(categoryId);
    const category = categories.find(c => c.id === categoryId);
    if (category?.components[0]) {
      setSelectedComponent(category.components[0]);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="p-2 rounded-lg hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all"
        title="组件库"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-1 w-[560px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[200]"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="flex">
            <div className="w-52 border-r border-gray-100 bg-gray-50 p-4">
              <div className="text-xs font-medium text-gray-500 mb-2 px-1">组件预览</div>
              <div className="w-full h-56 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {selectedComponent ? (
                  selectedComponent.preview
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    悬停查看预览
                  </div>
                )}
              </div>
              {selectedComponent && (
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{selectedComponent.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{selectedComponent.description}</div>
                    </div>
                    <button
                      onClick={() => selectedComponent && handleComponentSelect(selectedComponent)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      添加
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 p-3">
              <div className="space-y-1">
                {categories.map(category => (
                  <div key={category.id} className="rounded-lg overflow-hidden border border-gray-100">
                    <div
                      className={`px-3 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                        expandedCategory === category.id
                          ? `${category.bgColor} ${category.color}`
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                      onMouseEnter={() => handleCategoryHover(category.id)}
                    >
                      {category.icon}
                      {category.name}
                      <span className="text-xs opacity-60 ml-auto">{category.components.length}</span>
                    </div>
                    {expandedCategory === category.id && (
                      <div className="px-2 py-2 bg-white">
                        <div className="grid grid-cols-3 gap-1.5">
                          {category.components.map(component => (
                            <button
                              key={component.id}
                              onClick={() => handleComponentSelect(component)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs text-left transition-all ${
                                selectedComponent?.id === component.id
                                  ? `${category.bgColor} ${category.color} shadow-sm`
                                  : 'hover:bg-gray-50 text-gray-600'
                              }`}
                              onMouseEnter={() => handleComponentHover(component)}
                            >
                              <span className="opacity-80">{component.icon}</span>
                              <span className="truncate">{component.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentPicker;
