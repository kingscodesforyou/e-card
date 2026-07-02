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
  {
    id: 'visual',
    name: '视觉',
    icon: <Eye className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    components: [
      {
        id: 'gallery',
        name: '拼图',
        icon: <Grid3X3 className="w-4 h-4" />,
        description: '多图拼接展示',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center animate-pulse"
                >
                  <Image className="w-6 h-6 text-white" />
                </div>
              ))}
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '拼图组件',
          position: { x: 25, y: 35 },
          size: { width: 50, height: 30 },
          style: { fontSize: 16, textAlign: 'center', color: '#333' },
        },
      },
      {
        id: 'chart',
        name: '数据图表',
        icon: <PieChart className="w-4 h-4" />,
        description: '可视化数据展示',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-end gap-2 h-20">
              {[60, 80, 45, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="w-4 bg-gradient-to-t from-purple-400 to-purple-600 rounded-t animate-[grow_1s_ease-out_infinite]"
                  style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '图表组件',
          position: { x: 30, y: 40 },
          size: { width: 40, height: 20 },
          style: { fontSize: 16, textAlign: 'center', color: '#666' },
        },
      },
      {
        id: 'carousel',
        name: '轮播图',
        icon: <Play className="w-4 h-4" />,
        description: '自动轮播图片',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-24 h-16 bg-gradient-to-r from-pink-400 to-pink-600 rounded-lg flex items-center justify-center relative overflow-hidden">
              <Image className="w-8 h-8 text-white" />
              <div className="absolute inset-0 bg-white/20 animate-[slideInRight_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '轮播图组件',
          position: { x: 25, y: 35 },
          size: { width: 50, height: 30 },
          style: { fontSize: 16, textAlign: 'center', color: '#333' },
        },
      },
      {
        id: 'calendar',
        name: '实时日期',
        icon: <Calendar className="w-4 h-4" />,
        description: '动态显示日期',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-500">2026年</div>
                <div className="text-lg font-bold text-gray-800">7月2日</div>
                <div className="text-xs text-gray-500">星期三</div>
              </div>
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
          position: { x: 30, y: 40 },
          size: { width: 40, height: 20 },
          style: { fontSize: 14, textAlign: 'center', color: '#333' },
        },
      },
      {
        id: 'location',
        name: '实时位置',
        icon: <MapPin className="w-4 h-4" />,
        description: '显示位置信息',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-green-400/30 rounded-full animate-ping" />
            </div>
          </div>
        ),
        elementData: {
          type: 'icon',
          content: '📍',
          position: { x: 40, y: 40 },
          size: { width: 20, height: 20 },
          style: { fontSize: 32, textAlign: 'center' },
        },
      },
    ],
  },
  {
    id: 'interaction',
    name: '交互',
    icon: <MousePointer className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    components: [
      {
        id: 'form',
        name: '留言板',
        icon: <MessageSquare className="w-4 h-4" />,
        description: '用户留言互动',
        preview: (
          <div className="w-full h-full flex flex-col justify-center p-4">
            <div className="space-y-2">
              <div className="h-6 bg-gray-100 rounded animate-pulse" />
              <div className="h-16 bg-gray-100 rounded animate-pulse" />
              <div className="flex justify-end">
                <button className="px-4 py-1.5 bg-green-500 text-white text-xs rounded-full">
                  发送
                </button>
              </div>
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '留言板组件',
          position: { x: 25, y: 35 },
          size: { width: 50, height: 30 },
          style: { fontSize: 16, textAlign: 'center', color: '#333' },
        },
      },
      {
        id: 'like',
        name: '点赞',
        icon: <Heart className="w-4 h-4" />,
        description: '点赞互动功能',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-2">
              <button className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors group">
                <Heart className="w-7 h-7 text-red-500 group-hover:scale-110 transition-transform" />
              </button>
              <span className="text-sm font-medium text-gray-700">128</span>
            </div>
          </div>
        ),
        elementData: {
          type: 'icon',
          content: '❤️',
          position: { x: 40, y: 40 },
          size: { width: 20, height: 20 },
          style: { fontSize: 36, textAlign: 'center' },
        },
      },
      {
        id: 'rating',
        name: '评分',
        icon: <Star className="w-4 h-4" />,
        description: '星级评分组件',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${i <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '⭐⭐⭐⭐☆',
          position: { x: 35, y: 45 },
          size: { width: 30, height: 10 },
          style: { fontSize: 20, textAlign: 'center' },
        },
      },
      {
        id: 'survey',
        name: '问答',
        icon: <ThumbsUp className="w-4 h-4" />,
        description: '投票问答互动',
        preview: (
          <div className="w-full h-full flex flex-col justify-center p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                <span className="text-sm text-gray-700">选项A</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span className="text-sm text-blue-700">选项B</span>
              </div>
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '问答组件',
          position: { x: 30, y: 40 },
          size: { width: 40, height: 20 },
          style: { fontSize: 16, textAlign: 'center', color: '#333' },
        },
      },
      {
        id: 'countdown',
        name: '倒计时',
        icon: <RotateCcw className="w-4 h-4" />,
        description: '活动倒计时',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex gap-2">
              {['02', '15', '30'].map((num, i) => (
                <div key={i} className="bg-gray-800 text-white px-2 py-1 rounded text-lg font-mono">
                  {num}
                </div>
              ))}
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '00:00:00',
          position: { x: 35, y: 45 },
          size: { width: 30, height: 10 },
          style: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#333' },
        },
      },
    ],
  },
  {
    id: 'fun',
    name: '趣味',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    components: [
      {
        id: 'avatar',
        name: '头像墙',
        icon: <User className="w-4 h-4" />,
        description: '用户头像展示',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600"
                >
                  <User className="w-5 h-5 text-white" />
                </div>
              ))}
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '👥',
          position: { x: 40, y: 40 },
          size: { width: 20, height: 20 },
          style: { fontSize: 32, textAlign: 'center' },
        },
      },
      {
        id: 'fireworks',
        name: '烟花特效',
        icon: <Zap className="w-4 h-4" />,
        description: '节日烟花效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4 relative overflow-hidden">
            <div className="text-center">
              <Zap className="w-10 h-10 text-orange-500 animate-pulse" />
              <div className="absolute inset-0">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-yellow-400 animate-[sparkle_1s_ease-out_infinite]"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ),
        elementData: {
          type: 'icon',
          content: '🎆',
          position: { x: 40, y: 40 },
          size: { width: 20, height: 20 },
          style: { fontSize: 40, textAlign: 'center' },
        },
      },
      {
        id: 'musicplayer',
        name: '音乐播放器',
        icon: <Music className="w-4 h-4" />,
        description: '音频播放控制',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center animate-spin">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-700">背景音乐</div>
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="w-10 h-full bg-pink-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ),
        elementData: {
          type: 'icon',
          content: '🎵',
          position: { x: 40, y: 40 },
          size: { width: 20, height: 20 },
          style: { fontSize: 36, textAlign: 'center' },
        },
      },
      {
        id: 'luckywheel',
        name: '抽奖转盘',
        icon: <RotateCcw className="w-4 h-4" />,
        description: '幸运大转盘',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold">GO</span>
              </div>
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-full w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gray-800" />
            </div>
          </div>
        ),
        elementData: {
          type: 'icon',
          content: '🎰',
          position: { x: 40, y: 40 },
          size: { width: 20, height: 20 },
          style: { fontSize: 36, textAlign: 'center' },
        },
      },
      {
        id: 'confetti',
        name: '彩带效果',
        icon: <Sparkles className="w-4 h-4" />,
        description: '庆祝彩带飘落',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4 relative overflow-hidden">
            <Sparkles className="w-8 h-8 text-purple-500" />
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-3 rounded-sm animate-[fall_2s_ease-in_infinite]"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 5],
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        ),
        elementData: {
          type: 'icon',
          content: '🎉',
          position: { x: 40, y: 40 },
          size: { width: 20, height: 20 },
          style: { fontSize: 36, textAlign: 'center' },
        },
      },
    ],
  },
  {
    id: 'effects',
    name: '特效',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    components: [
      {
        id: 'parallax',
        name: '视差滚动',
        icon: <PenTool className="w-4 h-4" />,
        description: '多层视差效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative w-24 h-16 overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-800 to-transparent" />
              <div className="absolute bottom-2 left-4 text-white text-xs">视差层</div>
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '视差滚动',
          position: { x: 35, y: 45 },
          size: { width: 30, height: 10 },
          style: { fontSize: 14, textAlign: 'center', color: '#333' },
        },
      },
      {
        id: 'blur',
        name: '模糊背景',
        icon: <Scan className="w-4 h-4" />,
        description: '高斯模糊效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative w-20 h-12 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-medium">模糊</span>
              </div>
            </div>
          </div>
        ),
        elementData: {
          type: 'shape',
          content: 'rectangle',
          position: { x: 30, y: 35 },
          size: { width: 40, height: 30 },
          style: { backgroundColor: 'rgba(139, 92, 246, 0.3)', borderRadius: 8 },
        },
      },
      {
        id: 'glow',
        name: '发光效果',
        icon: <Zap className="w-4 h-4" />,
        description: '霓虹灯发光',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4 bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-cyan-400" style={{ textShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee' }}>
              GLOW
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '发光文字',
          position: { x: 35, y: 45 },
          size: { width: 30, height: 10 },
          style: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: '#22d3ee', textShadow: '0 0 10px #22d3ee' },
        },
      },
      {
        id: 'shimmer',
        name: '渐变闪烁',
        icon: <Sparkles className="w-4 h-4" />,
        description: '流动渐变效果',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-20 h-8 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
          </div>
        ),
        elementData: {
          type: 'shape',
          content: 'rectangle',
          position: { x: 30, y: 40 },
          size: { width: 40, height: 10 },
          style: { background: 'linear-gradient(to right, #8B5CF6, #EC4899, #8B5CF6)', backgroundSize: '200% 100%', borderRadius: 4 },
        },
      },
      {
        id: 'audio',
        name: '音效',
        icon: <Volume2 className="w-4 h-4" />,
        description: '互动音效',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-[soundWave_0.8s_ease-in-out_infinite]"
                  style={{
                    height: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ),
        elementData: {
          type: 'icon',
          content: '🔊',
          position: { x: 40, y: 40 },
          size: { width: 20, height: 20 },
          style: { fontSize: 32, textAlign: 'center' },
        },
      },
    ],
  },
  {
    id: 'navigation',
    name: '导航',
    icon: <Navigation className="w-4 h-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    components: [
      {
        id: 'tabs',
        name: '分页切换',
        icon: <Menu className="w-4 h-4" />,
        description: '多页切换导航',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <button
                  key={i}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    i === 2 ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '1 2 3',
          position: { x: 35, y: 45 },
          size: { width: 30, height: 10 },
          style: { fontSize: 18, textAlign: 'center', color: '#333' },
        },
      },
      {
        id: 'menu',
        name: '底部菜单',
        icon: <Menu className="w-4 h-4" />,
        description: '导航菜单组件',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex gap-4 bg-gray-100 p-2 rounded-lg">
              {['首页', '消息', '我的'].map((item, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded ${
                    i === 1 ? 'bg-indigo-500 text-white' : 'text-gray-600'
                  }`}
                >
                  <Menu className="w-4 h-4" />
                  <span className="text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '底部菜单',
          position: { x: 35, y: 45 },
          size: { width: 30, height: 10 },
          style: { fontSize: 16, textAlign: 'center', color: '#333' },
        },
      },
      {
        id: 'breadcrumb',
        name: '面包屑',
        icon: <ChevronRight className="w-4 h-4" />,
        description: '层级导航路径',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-500">首页</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">分类</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-indigo-600 font-medium">详情</span>
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '首页 > 分类 > 详情',
          position: { x: 25, y: 45 },
          size: { width: 50, height: 10 },
          style: { fontSize: 14, textAlign: 'center', color: '#666' },
        },
      },
      {
        id: 'bookmark',
        name: '收藏夹',
        icon: <Bookmark className="w-4 h-4" />,
        description: '内容收藏管理',
        preview: (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-2">
              <Bookmark className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              <span className="text-sm text-gray-600">已收藏</span>
            </div>
          </div>
        ),
        elementData: {
          type: 'icon',
          content: '📌',
          position: { x: 40, y: 40 },
          size: { width: 20, height: 20 },
          style: { fontSize: 32, textAlign: 'center' },
        },
      },
      {
        id: 'directory',
        name: '目录',
        icon: <FolderOpen className="w-4 h-4" />,
        description: '内容目录列表',
        preview: (
          <div className="w-full h-full flex flex-col justify-center p-4">
            <div className="space-y-1 w-full">
              {['第一章', '第二章', '第三章'].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-1.5 rounded text-sm ${
                    i === 1 ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600'
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ),
        elementData: {
          type: 'text',
          content: '目录列表',
          position: { x: 35, y: 45 },
          size: { width: 30, height: 10 },
          style: { fontSize: 16, textAlign: 'center', color: '#333' },
        },
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
          className="absolute top-full left-0 mt-1 w-[560px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-[100]"
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
