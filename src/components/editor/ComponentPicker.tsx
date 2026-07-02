import { useState, useEffect, useRef } from 'react';
import { Grid3X3, Eye, MousePointer, Sparkles, Zap, Navigation, Image, PieChart, Calendar, MapPin, User, MessageSquare, Heart, ThumbsUp, Star, Play, RotateCcw, PenTool, Scan, Volume2, Music, Bookmark, FolderOpen, Menu, ChevronRight, Plus } from 'lucide-react';
import { useEditorStore } from '../../store';
import type { ComponentConfig, CardElement } from '../../types';

interface ComponentItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  preview: React.ReactNode;
  componentConfig: ComponentConfig;
  elementData: Omit<CardElement, 'id'>;
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
        description: '多图拼接展示，可配置行列和间距',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="grid grid-cols-3 gap-0.5 w-20 h-20">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="rounded-sm bg-gradient-to-br from-purple-400 to-pink-400" style={{ opacity: 1 - i * 0.08 }} />
              ))}
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'puzzle',
          puzzleCols: 3,
          puzzleGap: 2,
          puzzleImages: [],
        },
        elementData: {
          type: 'image',
          content: '',
          position: { x: 5, y: 20 },
          size: { width: 90, height: 55 },
          style: { backgroundColor: '#f0f0f0', borderRadius: 8 },
        },
      },
      {
        id: 'visual-carousel',
        name: '轮播图',
        icon: <Play className="w-4 h-4" />,
        description: '自动轮播展示多张图片',
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
        componentConfig: {
          componentType: 'carousel',
          carouselImages: [],
          carouselInterval: 3000,
          carouselAutoPlay: true,
        },
        elementData: {
          type: 'image',
          content: '',
          position: { x: 5, y: 20 },
          size: { width: 90, height: 50 },
          style: { backgroundColor: '#f5f5f5', borderRadius: 8 },
        },
      },
      {
        id: 'visual-chart',
        name: '数据图表',
        icon: <PieChart className="w-4 h-4" />,
        description: '可视化数据柱状图/饼图展示',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-end gap-1.5 h-16">
              {[40, 65, 85, 55, 70].map((h, i) => (
                <div key={i} className="w-4 bg-gradient-to-t from-purple-400 to-purple-600 rounded-t" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'chart',
          chartType: 'bar',
          chartData: [
            { label: 'A', value: 40, color: '#8B5CF6' },
            { label: 'B', value: 65, color: '#EC4899' },
            { label: 'C', value: 85, color: '#06B6D4' },
            { label: 'D', value: 55, color: '#F59E0B' },
            { label: 'E', value: 70, color: '#10B981' },
          ],
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 10, y: 25 },
          size: { width: 80, height: 50 },
          style: { backgroundColor: '#ffffff', borderRadius: 8 },
        },
      },
      {
        id: 'visual-cube',
        name: '立体魔方',
        icon: <Grid3X3 className="w-4 h-4" />,
        description: '3D立体魔方旋转效果',
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
        componentConfig: {
          componentType: 'cube',
          cubeFaces: ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 35, y: 30 },
          size: { width: 30, height: 30 },
          style: {},
        },
      },
      {
        id: 'visual-wechat-avatar',
        name: '微信头像',
        icon: <User className="w-4 h-4" />,
        description: '微信风格圆形头像',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-md flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'wechatAvatar',
        },
        elementData: {
          type: 'image',
          content: '',
          position: { x: 38, y: 35 },
          size: { width: 24, height: 24 },
          style: { borderRadius: 9999, backgroundColor: '#e5e7eb' },
        },
      },
      {
        id: 'visual-avatar-wall',
        name: '头像墙',
        icon: <User className="w-4 h-4" />,
        description: '多人头像展示墙',
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
        componentConfig: {
          componentType: 'avatarWall',
          avatarUrls: [],
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 15, y: 38 },
          size: { width: 70, height: 15 },
          style: {},
        },
      },
      {
        id: 'visual-dynamic-number',
        name: '动态数字',
        icon: <PieChart className="w-4 h-4" />,
        description: '数字滚动动画效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">88</span>
              <span className="text-xs text-green-500">+12%</span>
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'dynamicNumber',
          dynamicNumberTarget: 88,
          dynamicNumberDuration: 2000,
        },
        elementData: {
          type: 'text',
          content: '0',
          position: { x: 35, y: 40 },
          size: { width: 30, height: 15 },
          style: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', color: '#8B5CF6' },
        },
      },
      {
        id: 'visual-weather',
        name: '天气',
        icon: <Sparkles className="w-4 h-4" />,
        description: '实时天气信息显示',
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
        componentConfig: {
          componentType: 'weather',
          weatherCity: '北京',
        },
        elementData: {
          type: 'text',
          content: '☀️ 26° 晴',
          position: { x: 35, y: 42 },
          size: { width: 30, height: 12 },
          style: { fontSize: 14, textAlign: 'center', color: '#333', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' },
        },
      },
      {
        id: 'visual-real-date',
        name: '实时日期',
        icon: <Calendar className="w-4 h-4" />,
        description: '动态显示当前日期',
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
        componentConfig: {
          componentType: 'realDate',
        },
        elementData: {
          type: 'text',
          content: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
          position: { x: 25, y: 35 },
          size: { width: 50, height: 20 },
          style: { fontSize: 14, textAlign: 'center', color: '#333', backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' },
        },
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
        componentConfig: {
          componentType: 'realLocation',
          mapAddress: '北京市朝阳区',
        },
        elementData: {
          type: 'text',
          content: '📍 北京市朝阳区',
          position: { x: 25, y: 42 },
          size: { width: 50, height: 12 },
          style: { fontSize: 12, textAlign: 'center', color: '#333', backgroundColor: '#fef2f2', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', borderStyle: 'solid' },
        },
      },
      {
        id: 'visual-timer',
        name: '计时器',
        icon: <RotateCcw className="w-4 h-4" />,
        description: '正计时/倒计时功能',
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
        componentConfig: {
          componentType: 'timer',
          timerStartFrom: 0,
          timerCountUp: true,
          timerRunning: true,
        },
        elementData: {
          type: 'text',
          content: '00:00',
          position: { x: 30, y: 38 },
          size: { width: 40, height: 15 },
          style: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#333', fontFamily: 'monospace' },
        },
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
        description: '自由涂鸦绘画画板',
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
        componentConfig: {
          componentType: 'drawingBoard',
          canvasBgColor: '#ffffff',
          canvasBrushColor: '#8B5CF6',
          canvasBrushSize: 4,
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 5, y: 25 },
          size: { width: 90, height: 45 },
          style: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' },
        },
      },
      {
        id: 'interact-screenshot',
        name: '点击截图',
        icon: <Image className="w-4 h-4" />,
        description: '点击按钮保存当前画面',
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
        componentConfig: {
          componentType: 'screenshot',
          screenshotLabel: '保存贺卡',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 35, y: 40 },
          size: { width: 30, height: 20 },
          style: { backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0', borderStyle: 'solid' },
        },
      },
      {
        id: 'interact-message-board',
        name: '留言板',
        icon: <MessageSquare className="w-4 h-4" />,
        description: '用户留言互动区',
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
        componentConfig: {
          componentType: 'messageBoard',
          messages: [
            { name: '小明', content: '好漂亮的贺卡！', time: '刚刚' },
            { name: '小红', content: '谢谢 😊', time: '1分钟前' },
          ],
          messagePlaceholder: '写下你的祝福...',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 5, y: 25 },
          size: { width: 90, height: 50 },
          style: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' },
        },
      },
      {
        id: 'interact-barrage',
        name: '弹幕',
        icon: <MessageSquare className="w-4 h-4" />,
        description: '滚动弹幕效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden">
            <div className="relative w-full">
              <div className="text-xs text-purple-500 whitespace-nowrap">祝生日快乐！🎂</div>
              <div className="text-xs text-pink-500 whitespace-nowrap mt-1">永远开心！🎉</div>
              <div className="text-xs text-blue-500 whitespace-nowrap mt-1">万事如意！✨</div>
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'barrage',
          barrageMessages: ['祝生日快乐！🎂', '永远开心！🎉', '万事如意！✨', '天天好心情！💖'],
          barrageSpeed: 8,
          barrageColor: '#8B5CF6',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 5, y: 20 },
          size: { width: 90, height: 60 },
          style: {},
        },
      },
      {
        id: 'interact-like',
        name: '点赞',
        icon: <Heart className="w-4 h-4" />,
        description: '可点击的点赞按钮',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-1">
              <Heart className="w-8 h-8 text-red-500" />
              <span className="text-sm font-medium text-gray-700">128</span>
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'like',
          likeCount: 0,
          likeEnabled: true,
        },
        elementData: {
          type: 'icon',
          content: '❤️',
          position: { x: 42, y: 40 },
          size: { width: 16, height: 16 },
          style: { fontSize: 32, textAlign: 'center' },
        },
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
        componentConfig: {
          componentType: 'viewCount',
          viewCount: 0,
        },
        elementData: {
          type: 'text',
          content: '浏览 0 次',
          position: { x: 35, y: 45 },
          size: { width: 30, height: 8 },
          style: { fontSize: 12, textAlign: 'center', color: '#999' },
        },
      },
      {
        id: 'interact-voice',
        name: '语音',
        icon: <Volume2 className="w-4 h-4" />,
        description: '语音录制与播放',
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
        componentConfig: {
          componentType: 'voice',
          audioSrc: '',
          audioDuration: 0,
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 38, y: 38 },
          size: { width: 24, height: 24 },
          style: { backgroundColor: '#f3e8ff', borderRadius: 9999, borderWidth: 1, borderColor: '#e9d5ff', borderStyle: 'solid' },
        },
      },
      {
        id: 'interact-photo',
        name: '照片',
        icon: <Image className="w-4 h-4" />,
        description: '拍照上传功能入口',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
              <Image className="w-8 h-8 text-purple-300" />
              <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-0.5 rounded text-[10px] text-gray-500">点击拍照</div>
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'photo',
          photoUrl: '',
        },
        elementData: {
          type: 'image',
          content: '',
          position: { x: 5, y: 20 },
          size: { width: 90, height: 55 },
          style: { backgroundColor: '#e0e7ff', borderRadius: 12 },
        },
      },
      {
        id: 'interact-sound-effect',
        name: '音效',
        icon: <Volume2 className="w-4 h-4" />,
        description: '点击触发音效播放',
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
        componentConfig: {
          componentType: 'soundEffect',
          soundEffectSrc: '',
          soundEffectVolume: 0.8,
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 38, y: 42 },
          size: { width: 24, height: 12 },
          style: { backgroundColor: '#f3e8ff', borderRadius: 24, borderWidth: 1, borderColor: '#e9d5ff', borderStyle: 'solid' },
        },
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
        componentConfig: {
          componentType: 'map',
          mapLat: 39.9042,
          mapLng: 116.4074,
          mapZoom: 14,
          mapAddress: '北京市',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 5, y: 25 },
          size: { width: 90, height: 50 },
          style: { backgroundColor: '#ecfdf5', borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0', borderStyle: 'solid' },
        },
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
        description: '趣味年龄变化动画',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-white font-bold text-sm">18</div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">25</div>
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'ageChange',
          ageFrom: 18,
          ageTo: 25,
        },
        elementData: {
          type: 'text',
          content: '18 → 25',
          position: { x: 30, y: 40 },
          size: { width: 40, height: 15 },
          style: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#8B5CF6' },
        },
      },
      {
        id: 'fun-face-recognition',
        name: '人脸识别',
        icon: <Scan className="w-4 h-4" />,
        description: '人脸识别检测区域',
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
        componentConfig: {
          componentType: 'faceRecognition',
          faceImageUrl: '',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 35, y: 30 },
          size: { width: 30, height: 30 },
          style: { backgroundColor: '#f3e8ff', borderRadius: 9999, borderWidth: 2, borderColor: '#e9d5ff', borderStyle: 'dashed' },
        },
      },
      {
        id: 'fun-face-merge',
        name: '人脸融合',
        icon: <User className="w-4 h-4" />,
        description: '趣味人脸融合效果',
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
        componentConfig: {
          componentType: 'faceMerge',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 20, y: 38 },
          size: { width: 60, height: 20 },
          style: { backgroundColor: '#fdf2f8', borderRadius: 24, borderWidth: 1, borderColor: '#fbcfe8', borderStyle: 'solid' },
        },
      },
      {
        id: 'fun-simulate-chat',
        name: '模拟对话',
        icon: <MessageSquare className="w-4 h-4" />,
        description: '模拟微信聊天对话',
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
        componentConfig: {
          componentType: 'simulateChat',
          chatMessages: [
            { sender: 'TA', content: '你好呀！', isMe: false },
            { sender: '我', content: '节日快乐！', isMe: true },
          ],
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 5, y: 25 },
          size: { width: 90, height: 50 },
          style: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' },
        },
      },
      {
        id: 'fun-voice-assistant',
        name: '语音助手',
        icon: <Volume2 className="w-4 h-4" />,
        description: '语音交互助手入口',
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
        componentConfig: {
          componentType: 'voiceAssistant',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 38, y: 38 },
          size: { width: 24, height: 24 },
          style: { backgroundColor: '#eff6ff', borderRadius: 16, borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'solid' },
        },
      },
      {
        id: 'fun-random-event',
        name: '随机事件',
        icon: <Sparkles className="w-4 h-4" />,
        description: '点击随机抽取结果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="bg-purple-50 px-3 py-1.5 rounded-lg text-xs text-purple-600 font-medium mb-1">今日运势</div>
              <div className="text-[10px] text-gray-400">点击随机</div>
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'randomEvent',
          randomOptions: ['大吉', '中吉', '小吉', '末吉', '凶'],
          randomResult: '',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 30, y: 38 },
          size: { width: 40, height: 20 },
          style: { backgroundColor: '#f3e8ff', borderRadius: 12, borderWidth: 1, borderColor: '#e9d5ff', borderStyle: 'solid' },
        },
      },
      {
        id: 'fun-flash',
        name: '快闪',
        icon: <Zap className="w-4 h-4" />,
        description: '文字快闪展示效果',
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
        componentConfig: {
          componentType: 'flash',
          flashTexts: ['惊喜', '快乐', '幸福', '美好'],
          flashInterval: 800,
        },
        elementData: {
          type: 'text',
          content: '惊喜',
          position: { x: 30, y: 38 },
          size: { width: 40, height: 20 },
          style: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#f59e0b' },
        },
      },
      {
        id: 'fun-pip',
        name: '画中画',
        icon: <Image className="w-4 h-4" />,
        description: '主画面+子画面嵌套效果',
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
        componentConfig: {
          componentType: 'pip',
          pipMainImage: '',
          pipSubImage: '',
        },
        elementData: {
          type: 'image',
          content: '',
          position: { x: 5, y: 20 },
          size: { width: 90, height: 55 },
          style: { backgroundColor: '#f3f4f6', borderRadius: 12 },
        },
      },
      {
        id: 'fun-word-art',
        name: '自说字画',
        icon: <PenTool className="w-4 h-4" />,
        description: '手写风格字画展示',
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
        componentConfig: {
          componentType: 'wordArt',
          wordArtText: '字画',
          wordArtStyle: 'handwriting',
        },
        elementData: {
          type: 'text',
          content: '字画',
          position: { x: 30, y: 35 },
          size: { width: 40, height: 25 },
          style: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#8B5CF6', fontStyle: 'italic' },
        },
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
        description: '涂抹擦除揭示效果',
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
        componentConfig: {
          componentType: 'scratch',
          scratchBgColor: '#8B5CF6',
          scratchRevealImage: '',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 10, y: 25 },
          size: { width: 80, height: 45 },
          style: { backgroundColor: '#8B5CF6', borderRadius: 12 },
        },
      },
      {
        id: 'effect-fingerprint',
        name: '指纹',
        icon: <Scan className="w-4 h-4" />,
        description: '指纹识别动效',
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
        componentConfig: {
          componentType: 'fingerprint',
          fingerprintLabel: '请按指纹',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 38, y: 38 },
          size: { width: 24, height: 24 },
          style: { backgroundColor: '#f3e8ff', borderRadius: 9999 },
        },
      },
      {
        id: 'effect-falling',
        name: '飘落物',
        icon: <Sparkles className="w-4 h-4" />,
        description: '飘落动画粒子效果',
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
        componentConfig: {
          componentType: 'falling',
          fallingType: 'confetti',
          fallingItems: ['🎉', '🎊', '✨', '💫', '🌟'],
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          style: { pointerEvents: 'none' },
        },
      },
      {
        id: 'effect-gradient',
        name: '渐变',
        icon: <Sparkles className="w-4 h-4" />,
        description: '渐变色彩背景效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 shadow-md flex items-center justify-center">
              <span className="text-white text-xs font-medium">渐变</span>
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'gradient',
          gradientColors: ['#8B5CF6', '#EC4899', '#06B6D4'],
          gradientDirection: 'to bottom right',
        },
        elementData: {
          type: 'shape',
          content: 'rectangle',
          position: { x: 5, y: 15 },
          size: { width: 90, height: 65 },
          style: { backgroundColor: '#8B5CF6', borderRadius: 16 },
        },
      },
      {
        id: 'effect-gravity',
        name: '重力感应',
        icon: <RotateCcw className="w-4 h-4" />,
        description: '随设备倾斜移动元素',
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
        componentConfig: {
          componentType: 'gravity',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 38, y: 38 },
          size: { width: 24, height: 24 },
          style: {},
        },
      },
      {
        id: 'effect-break-glass',
        name: '砸玻璃',
        icon: <Zap className="w-4 h-4" />,
        description: '点击碎裂玻璃效果',
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
        componentConfig: {
          componentType: 'breakGlass',
          glassImageUrl: '',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 35, y: 35 },
          size: { width: 30, height: 30 },
          style: { backgroundColor: '#e0f2fe', borderRadius: 16 },
        },
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
        description: '点击跳转到指定页面',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-2 bg-teal-50 px-3 py-2 rounded-xl">
              <span className="text-xs text-teal-600">前往</span>
              <ChevronRight className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-teal-600 font-medium">下一页</span>
            </div>
          </div>
        ),
        componentConfig: {
          componentType: 'pageJump',
          jumpTargetPage: 1,
          jumpLabel: '前往下一页',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 30, y: 42 },
          size: { width: 40, height: 10 },
          style: { backgroundColor: '#f0fdfa', borderRadius: 12, borderWidth: 1, borderColor: '#99f6e4', borderStyle: 'solid' },
        },
      },
      {
        id: 'nav-document',
        name: '文档',
        icon: <Bookmark className="w-4 h-4" />,
        description: '文档内容展示组件',
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
        componentConfig: {
          componentType: 'document',
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 5, y: 25 },
          size: { width: 90, height: 50 },
          style: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' },
        },
      },
      {
        id: 'nav-toc',
        name: '目录',
        icon: <FolderOpen className="w-4 h-4" />,
        description: '页面内容目录导航',
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
        componentConfig: {
          componentType: 'toc',
          tocItems: [
            { title: '封面', pageIndex: 0 },
            { title: '祝福语', pageIndex: 1 },
            { title: '回忆', pageIndex: 2 },
            { title: '寄语', pageIndex: 3 },
          ],
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 10, y: 25 },
          size: { width: 35, height: 45 },
          style: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' },
        },
      },
      {
        id: 'nav-bottom-menu',
        name: '底部菜单',
        icon: <Menu className="w-4 h-4" />,
        description: '底部导航菜单栏',
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
        componentConfig: {
          componentType: 'bottomMenu',
          menuItems: [
            { label: '首页', icon: 'home', target: 'page1' },
            { label: '发现', icon: 'compass', target: 'page2' },
            { label: '我的', icon: 'user', target: 'page3' },
          ],
        },
        elementData: {
          type: 'icon',
          content: '',
          position: { x: 0, y: 88 },
          size: { width: 100, height: 12 },
          style: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' },
        },
      },
    ],
  },
];

const ComponentPicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);
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
    const elementWithConfig = {
      ...component.elementData,
      componentConfig: component.componentConfig,
    };
    addElement(elementWithConfig);
    setIsOpen(false);
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
          className="absolute top-full left-0 mt-1 w-[960px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[200] max-h-[500px]"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="grid grid-cols-[220px_repeat(5,1fr)] gap-0 pt-4 overflow-y-auto h-full">
            <div className="border-r border-gray-100 bg-gray-50 px-4 pb-4">
              <div className="text-xs font-medium text-gray-500 mb-3 px-1">组件预览</div>
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

            {categories.map(category => (
              <div key={category.id} className="px-3 pb-4 border-r border-gray-100 last:border-r-0">
                <div className={`px-3 py-2 text-xs font-medium flex items-center gap-2 rounded-lg mb-2 ${category.bgColor} ${category.color}`}>
                  {category.icon}
                  {category.name}
                  <span className="text-xs opacity-60 ml-auto">{category.components.length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {category.components.map(component => (
                    <button
                      key={component.id}
                      onClick={() => handleComponentSelect(component)}
                      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md text-xs transition-all ${
                        selectedComponent?.id === component.id
                          ? `${category.bgColor} ${category.color} shadow-sm`
                          : 'hover:bg-gray-50 text-gray-600'
                      }`}
                      onMouseEnter={() => handleComponentHover(component)}
                    >
                      <span className="opacity-80">{component.icon}</span>
                      <span className="truncate text-center max-w-full">{component.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentPicker;
