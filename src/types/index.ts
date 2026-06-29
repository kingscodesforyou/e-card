// 单个动画配置
export interface ElementAnimation {
  id: string;
  name: string;           // 动画名称（如：淡入、缩放等）
  cssClass: string;       // CSS动画类名
  duration: number;       // 动画时长（毫秒）
  delay: number;          // 延迟时间（毫秒）
  iterationCount: number | 'infinite';  // 重复次数
  category: 'enter' | 'emphasis' | 'exit';
}

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
  selected?: boolean;
  animations?: ElementAnimation[];  // 动画序列
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
    animationIterationCount?: string | number;
    fontWeight?: string;
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline' | 'line-through';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: number | string;
    letterSpacing?: number | string;
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
    textShadow?: string;
    boxShadow?: string;
    // 形状专属：通过 CSS 三角形技巧或 clip-path 实现的形状外观
    [key: string]: unknown;
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

// 模板标签项（分类/场合/风格）
export interface TemplateLabel {
  id: string;
  name: string;
  sort_order: number;
  availab?: boolean;
  created_at: string;
}

export type CategoryType = '金融理财' | '教育培训' | '政务融媒' | '医疗保健' | '美容健身' | '餐饮美食' | '房产装修' | '旅游出行' | '休闲娱乐' | '汽车行业' | '生活服务' | '商超百货' | '其他';
export type OccasionType = '商务邀请' | '活动邀请' | '宴会邀请' | '人才招聘' | '招生培训' | '党建公益' | '营销卖货' | '企业介绍' | '企业期刊' | '企业庆典' | '行政办公' | '总结汇报' | '通知公告' | '祝福问候' | '日签打卡' | '个人简历' | '纪念相册' | '攻略指南' | '新闻资讯' | '建党节' | '建军节' | '七夕' | '小暑' | '大暑' | '立秋' | '处暑' | '国际禁毒日' | '香港回归纪念日' | '接吻日' | '七七抗战纪念日' | '全国保险公众宣传日' | '世界人口日' | '中国航海日' | '夏三伏' | '那达慕' | '全国海洋宣传日' | '全国特奥日' | '人类月球日' | '世界肝炎日';
export type StyleType = '简约' | '商务' | '中国风' | '手绘' | '卡通' | '时尚' | '清新' | '奢华' | '复古' | '立体' | '科技' | '国潮' | '炫酷' | '喜庆' | '插画' | '孟菲斯' | '炫彩' | '玻璃风' | '膨胀风' | '毛绒风' | '酸性' | '漫画' | '搞笑' | '拼接风' | 'Y2K' | '赛博朋克';

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