import type { CSSProperties } from 'react';
import type { CardElement } from '../types';

/**
 * 形状的预设配置。
 * Toolbar 在创建形状元素时使用与该映射完全一致的 content 标识，
 * 这里集中维护形状的视觉表现，确保 Canvas / Preview / Export 三处渲染一致。
 */
export const SHAPE_CONTENT = {
  rectangle: 'rectangle',
  circle: 'circle',
  triangle: 'triangle',
  line: 'line',
  arrow: 'arrow',
  star: 'star',
} as const;

export type ShapeContent = (typeof SHAPE_CONTENT)[keyof typeof SHAPE_CONTENT];

export function isShapeElement(element: CardElement): boolean {
  return element.type === 'shape';
}

/**
 * 根据形状元素的 content（来自 Toolbar 的 addShape）返回形状专属样式。
 * 例如 triangle 使用 border 三角形技巧、star 使用 clip-path。
 * 这些样式存储在 element.style 中，但类型声明没有覆盖自定义键，
 * 因此需要在这里按 content 重建，避免被 CSSProperties 类型剥离。
 */
export function getShapeVisualStyle(element: CardElement): CSSProperties {
  if (!isShapeElement(element)) return {};

  const style = element.style;
  const merged: CSSProperties = {};

  // 透传所有 style 中已有且合法的 CSS 属性
  const directKeys: (keyof CSSProperties)[] = [
    'backgroundColor',
    'borderRadius',
    'borderWidth',
    'borderColor',
    'borderStyle',
    'opacity',
    'boxShadow',
  ];
  directKeys.forEach((key) => {
    const value = style[key as string];
    if (value !== undefined && value !== null && value !== '') {
      // @ts-expect-error 动态赋值，键名是受控白名单
      merged[key] = value;
    }
  });

  // 形状专属样式（这些自定义 CSS 属性用于三角形/箭头/星形等）
  const customKeys = [
    'borderLeft',
    'borderRight',
    'borderTop',
    'borderBottom',
    'clipPath',
  ];
  customKeys.forEach((key) => {
    const value = style[key];
    if (value !== undefined && value !== null && value !== '') {
      // 这些都是合法的 CSSProperties 键，需要断言赋值
      (merged as Record<string, unknown>)[key] = value;
    }
  });

  return merged;
}

/**
 * 将元素的可视化样式合并为基础 CSS 属性对象。
 * 用于 Canvas / Preview / Export 渲染元素时的样式计算。
 *
 * @param element     要渲染的元素
 * @param baseStyle   调用方提供的基础布局样式（position/left/top/width/height/transform 等）
 *                    会与元素自身的样式合并，且元素样式优先级更高
 */
export function getElementVisualStyle(
  element: CardElement,
  baseStyle: CSSProperties = {},
): CSSProperties {
  const { style } = element;

  // 使用字符串拼接而非模板字面量，避免 ${} 插值在工具链中被剥离
  const durMs = typeof style.animationDuration === 'number'
    ? String(style.animationDuration) + 'ms'
    : undefined;
  const delayMs = typeof style.animationDelay === 'number'
    ? String(style.animationDelay) + 'ms'
    : undefined;

  const visual: CSSProperties = {
    ...baseStyle,
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    color: style.color,
    opacity: style.opacity,
    fontWeight: style.fontWeight as CSSProperties['fontWeight'],
    fontStyle: style.fontStyle === 'italic' ? 'italic' : 'normal',
    textDecoration: style.textDecoration as CSSProperties['textDecoration'],
    textAlign: style.textAlign as CSSProperties['textAlign'],
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    backgroundColor: style.backgroundColor,
    borderRadius: style.borderRadius,
    borderWidth: style.borderWidth,
    borderColor: style.borderColor,
    borderStyle: style.borderStyle,
    textShadow: style.textShadow,
    boxShadow: style.boxShadow,
    overflow: 'hidden',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    animationName: style.animation,
    animationDuration: durMs,
    animationDelay: delayMs,
    animationIterationCount: style.animationIterationCount,
    animationFillMode: (style.animationFillMode as CSSProperties['animationFillMode']) || 'forwards',
    animationTimingFunction: (style.animationTimingFunction as CSSProperties['animationTimingFunction']) || 'ease',
    animationDirection: (style.animationDirection as CSSProperties['animationDirection']) || 'normal',
  };

  // 合并形状专属样式（clipPath / border 三角形等）
  if (isShapeElement(element)) {
    Object.assign(visual, getShapeVisualStyle(element));
  }

  return visual;
}
