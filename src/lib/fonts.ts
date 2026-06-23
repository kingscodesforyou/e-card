/**
 * 字体数据库 & 加载工具
 *
 * 字体数据从本地 API（PostgreSQL fonts 表）获取，
 * 通过模块级缓存避免重复请求。
 */

import { fonts as fontsApi } from '../utils/supabase';

// ============ 类型定义 ============

export type FontCategory = 'all' | 'sans-serif' | 'serif' | 'handwriting' | 'cursive' | 'display' | 'monospace';

export const FONT_CATEGORIES: { key: FontCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'sans-serif', label: '无衬线' },
  { key: 'serif', label: '衬线' },
  { key: 'handwriting', label: '手写体' },
  { key: 'cursive', label: '书法体' },
  { key: 'display', label: '装饰体' },
  { key: 'monospace', label: '等宽' },
];

export interface FontInfo {
  /** 数据库 ID */
  id?: string;
  /** CSS font-family 值 */
  family: string;
  /** UI 中显示的名称 */
  displayName: string;
  /** 字体类别 */
  category: FontCategory;
  /** Google Fonts API 名称（用于自托管字体文件加载） */
  googleFontName?: string;
  /** 可用的字重 */
  weights?: number[];
  /** 排序序号 */
  sortOrder?: number;
}

// ============ 模块级缓存 ============

/** 缓存数据库中的字体列表 */
let cachedFonts: FontInfo[] = [];

/** 是否已从 API 加载完成 */
let fontsLoaded = false;

/** 加载中 Promise（防止并发重复请求） */
let loadingPromise: Promise<void> | null = null;

/**
 * 从后端 API 加载字体数据到缓存
 * 多次调用只发一次请求，后续直接返回缓存
 */
export async function loadFontDatabase(): Promise<void> {
  if (fontsLoaded) return;

  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const { data } = await fontsApi.getAll();
      if (data) {
        cachedFonts = data.map(mapDbRowToFontInfo);
        fontsLoaded = true;
      }
    } catch (e) {
      console.error('加载字体失败:', e);
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

/**
 * 数据库行 → FontInfo 转换
 */
function mapDbRowToFontInfo(row: any): FontInfo {
  return {
    id: row.id,
    family: row.family,
    displayName: row.display_name,
    category: row.category as FontCategory,
    googleFontName: row.google_font_name || undefined,
    weights: row.weights || [400],
    sortOrder: row.sort_order || 0,
  };
}

// ============ 导出（同步兼容） ============

/**
 * 获取字体数据库（同步，可能为空 — 调用方需确保已调用 loadFontDatabase）
 */
export function getFontDatabase(): FontInfo[] {
  return cachedFonts;
}

/** 兼容旧代码的导出名 */
export const fontDatabase = cachedFonts;

// ============ 查询函数 ============

/**
 * 获取当前字体在数据库中的完整信息
 */
export function getFontInfo(family: string): FontInfo | undefined {
  return cachedFonts.find((f) => f.family === family);
}

/**
 * 按类别过滤字体
 */
export function getFontsByCategory(category: FontCategory): FontInfo[] {
  if (category === 'all') return cachedFonts;
  return cachedFonts.filter((f) => f.category === category);
}

/**
 * 搜索字体（按显示名 + CSS family 搜索）
 */
export function searchFonts(query: string, category: FontCategory): FontInfo[] {
  const lowerQuery = query.toLowerCase();
  const fonts = getFontsByCategory(category);
  return fonts.filter(
    (f) =>
      f.displayName.toLowerCase().includes(lowerQuery) ||
      f.family.toLowerCase().includes(lowerQuery),
  );
}
