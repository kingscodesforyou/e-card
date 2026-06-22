export interface CardElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'audio' | 'video' | 'icon' | 'group';
  content: string;
  position: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;
  zIndex?: number;
  visible?: boolean;
  locked?: boolean;
  children?: string[];
  childElements?: CardElement[];
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    opacity?: number;
    transform?: string;
    animation?: string;
    animationDuration?: number;
    animationDelay?: number;
    fontWeight?: string;
    textAlign?: string;
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    textShadow?: string;
    boxShadow?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      angle?: number;
      stops?: number[];
    };
  };
}

// 贺卡的单页
export interface CardPage {
  id: string;
  pageNumber: number;
  backgroundUrl?: string;        // 页面背景图
  backgroundColor?: string;      // 页面背景色
  elements: CardElement[];       // 页面元素
  audioUrl?: string;             // 页面专属音频
  audioLoop?: boolean;           // 音频是否循环
  audioAutoplay?: boolean;       // 音频是否自动播放
  transition?: 'none' | 'fade' | 'slide' | 'zoom' | 'flip'; // 页面切换动画
  transitionDuration?: number;   // 动画时长
}

export interface Template {
  id: string;
  name: string;
  category: string;
  occasion: string;
  style: string;
  thumbnail_url: string;
  background_url: string;
  default_elements: CardElement[];
  pages?: CardPage[];             // 多页模板（可选）
  backgroundMusicUrl?: string;    // 模板背景音乐
  created_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  template_id: string;
  title: string;
  pages: CardPage[];              // 多页贺卡
  background_music_url?: string;  // 全局背景音乐
  backgroundMusicLoop?: boolean;
  cover?: string;                 // 贺卡封面
  description?: string;           // 贺卡描述
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  created_at: string;
  is_admin?: boolean;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  is_disabled?: boolean;
  last_login_at?: string;
  login_attempts?: number;
  locked_until?: string;
}

export interface AdminActionLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export type CategoryType = '节日' | '生日' | '婚礼' | '感谢' | '祝福' | '其他';
export type OccasionType = '新年' | '春节' | '情人节' | '母亲节' | '父亲节' | '圣诞节' | '生日' | '婚礼' | '毕业' | '祝福' | '慰问';
export type StyleType = '简约' | '华丽' | '卡通' | '复古' | '手绘' | '现代';

export interface EditorState {
  currentCard: {
    id?: string;
    title: string;
    templateId: string;
    pages: CardPage[];
    currentPageIndex: number;     // 当前编辑页索引
    backgroundMusicUrl?: string;
    backgroundMusicLoop?: boolean;
  };
  selectedElementId: string | null;
  isPreviewMode: boolean;
}

export interface TemplatesState {
  templates: Template[];
  categories: string[];
  occasions: string[];
  styles: string[];
  selectedCategory: string;
  selectedOccasion: string;
  selectedStyle: string;
}

export interface UserState {
  user: User | null;
  designs: Card[];
  favorites: Template[];
}