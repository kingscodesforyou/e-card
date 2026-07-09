import { useState, useRef, useEffect, useCallback } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Pipette, X, Check } from 'lucide-react';
import './ColorPicker.css';

// ============================================================
// 颜色工具函数
// ============================================================

const isValidHexColor = (color: string): boolean => {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
};

const normalizeHexColor = (color: string): string => {
  if (!color) return '#000000';
  const c = color.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(c)) {
    return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  }
  if (/^#[0-9a-f]{6}$/.test(c) || /^#[0-9a-f]{8}$/.test(c)) {
    return c;
  }
  return '#000000';
};

// ============================================================
// 预设颜色
// ============================================================

export const PRESET_COLORS = [
  '#000000', '#434343', '#666666', '#999999',
  '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef',
  '#f3f3f3', '#ffffff', '#980000', '#ff0000',
  '#ff9900', '#ffff00', '#00ff00', '#00ffff',
  '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc',
  '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3',
  '#d9d2e9', '#ead1dc', '#dd7e6b', '#ea9999',
  '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9',
  '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
];

// ============================================================
// EyeDropper API 类型声明
// ============================================================

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperConstructor {
  new (): { open(): Promise<EyeDropperResult> };
}

declare global {
  interface Window {
    EyeDropper?: EyeDropperConstructor;
  }
}

// ============================================================
// 组件 Props
// ============================================================

interface ColorPickerProps {
  /** 当前颜色值（hex 格式） */
  value: string;
  /** 颜色确认回调 —— 仅在用户点击"确认"时触发一次 */
  onChange: (color: string) => void;
  /** 预设颜色列表（可选，默认使用 PRESET_COLORS） */
  presetColors?: string[];
  /** 是否显示预设颜色 */
  showPresets?: boolean;
  /** 是否显示吸管工具按钮 */
  showEyedropper?: boolean;
  /** 是否显示 HEX 文本输入 */
  showHexInput?: boolean;
  /** 预设颜色区域的预设数量（默认 12 个） */
  presetCount?: number;
  /** 自定义类名 */
  className?: string;
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文本 */
  placeholder?: string;
}

// ============================================================
// ColorPicker 组件
// ============================================================
//
// 【核心设计理念】两阶段提交：选择 → 确认
//
// 阶段 1（选择期）：
//   - 用户拖拽色板、输入 HEX、点击预设、使用吸管
//   - 所有操作仅更新组件内部的 draftColor 状态
//   - 绝不调用 onChange → 零 store 更新 → 零父组件重渲染
//   - 即使拖拽 60fps 也不会触发任何 store 操作
//
// 阶段 2（确认期）：
//   - 用户点击"确认"按钮
//   - 此时才调用 onChange(draftColor) → 触发一次 store 更新
//   - store 更新 → 父组件重渲染 → ColorPicker 收到新 value
//   - 一切正常，因为弹窗已经关闭
//
// 取消机制：
//   - 点击"取消"按钮 → 丢弃 draft，关闭弹窗，不触发 onChange
//   - 点击弹窗外部 → 同"取消"
//   - 按 ESC → 同"取消"
//
// 【为什么这能彻底解决卡死问题】
// 原方案：每次拖拽 onChange → updatePage → saveHistory(嵌套set) → 120次set/秒 → 卡死
// 新方案：拖拽仅更新 local state → 0次set → 不卡死
//         确认时 onChange → updatePage → saveHistory(单次set) → 1次set → 正常
// ============================================================

const ColorPicker = ({
  value,
  onChange,
  presetColors = PRESET_COLORS,
  showPresets = true,
  showEyedropper = true,
  showHexInput = true,
  presetCount = 12,
  className = '',
  size = 'md',
  disabled = false,
  placeholder = '#000000',
}: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // draftColor：选择期间的临时颜色，仅存在于组件内部
  const [draftColor, setDraftColor] = useState(() => normalizeHexColor(value));
  const containerRef = useRef<HTMLDivElement>(null);
  // 防止吸管工具重复打开
  const eyedropperActiveRef = useRef(false);

  // 当弹窗关闭时，同步外部 value 到 draftColor
  useEffect(() => {
    if (!isOpen) {
      setDraftColor(normalizeHexColor(value));
    }
  }, [value, isOpen]);

  // 打开弹窗：用当前 value 初始化 draft
  const handleOpen = useCallback(() => {
    if (disabled) return;
    setDraftColor(normalizeHexColor(value));
    setIsOpen(true);
  }, [disabled, value]);

  // 确认：提交 draftColor 到 onChange，关闭弹窗
  const handleConfirm = useCallback(() => {
    const normalized = normalizeHexColor(draftColor);
    onChange(normalized);
    setIsOpen(false);
  }, [draftColor, onChange]);

  // 取消：丢弃 draft，关闭弹窗
  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  // —— 以下所有操作仅更新 draftColor，绝不调用 onChange ——

  // 色板拖拽
  const handleColorChange = useCallback((color: string) => {
    setDraftColor(color);
  }, []);

  // HEX 文本输入
  const handleHexInputChange = useCallback((val: string) => {
    if (isValidHexColor(val)) {
      setDraftColor(normalizeHexColor(val));
    } else {
      // 允许不完整输入，仅更新显示
      setDraftColor(val);
    }
  }, []);

  const handleHexInputBlur = useCallback(() => {
    // 失焦时恢复为有效颜色
    setDraftColor((prev) => normalizeHexColor(prev));
  }, []);

  // 预设颜色点击
  const handlePresetClick = useCallback((color: string) => {
    setDraftColor(color);
  }, []);

  // 吸管工具
  const handleEyedropper = useCallback(async () => {
    if (!window.EyeDropper || eyedropperActiveRef.current) return;

    eyedropperActiveRef.current = true;
    // 先关闭弹窗，避免弹窗遮挡取色界面
    setIsOpen(false);

    // 使用 setTimeout 确保弹窗完全关闭后再启动吸管
    setTimeout(async () => {
      try {
        const eyeDropper = new window.EyeDropper!();
        const result = await eyeDropper.open();
        const color = result.sRGBHex;
        if (isValidHexColor(color)) {
          setDraftColor(normalizeHexColor(color));
        }
        // 取色完成，重新打开弹窗
        setIsOpen(true);
      } catch (err) {
        // 用户取消取色或发生错误，重新打开弹窗
        setIsOpen(true);
        if (err instanceof Error && err.name !== 'AbortError') {
          console.warn('[ColorPicker] 吸管取色失败:', err.message);
        }
      } finally {
        eyedropperActiveRef.current = false;
      }
    }, 100);
  }, []);

  // 点击外部关闭弹窗（视为取消）
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    // 延迟添加监听器，避免打开弹窗的同一次点击立即触发关闭
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 键关闭弹窗（视为取消）
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Enter 键确认
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleConfirm]);

  const sizeClasses = {
    sm: { btn: 'w-6 h-6', picker: 'w-48' },
    md: { btn: 'w-8 h-8', picker: 'w-56' },
    lg: { btn: 'w-10 h-10', picker: 'w-64' },
  };

  const sizes = sizeClasses[size];
  const displayColors = presetColors.slice(0, presetCount);
  const isEyeDropperSupported = typeof window !== 'undefined' && !!window.EyeDropper;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* 颜色预览按钮 */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`${sizes.btn} rounded border-2 border-gray-200 cursor-pointer transition-all hover:border-gray-400 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
        style={{ backgroundColor: normalizeHexColor(value) }}
        aria-label={`当前颜色 ${value}，点击打开颜色选择器`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      />

      {/* 颜色选择器弹窗 */}
      {isOpen && (
        <div
          className="absolute z-[9999] mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3"
          style={{ left: 0, top: '100%' }}
          role="dialog"
          aria-label="颜色选择器"
        >
          {/* react-colorful 选择器 —— onChange 仅更新 draft */}
          <div className={`${sizes.picker}`}>
            <HexColorPicker
              color={draftColor}
              onChange={handleColorChange}
              style={{ width: '100%', height: '160px' }}
            />
          </div>

          {/* HEX 输入 + 吸管按钮 */}
          <div className="flex items-center gap-2 mt-3">
            {showHexInput && (
              <div className="flex-1 relative">
                <HexColorInput
                  color={draftColor}
                  onChange={handleHexInputChange}
                  onBlur={handleHexInputBlur}
                  prefixed
                  alpha={false}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={placeholder}
                />
              </div>
            )}

            {/* 吸管工具按钮 */}
            {showEyedropper && isEyeDropperSupported && (
              <button
                type="button"
                onClick={handleEyedropper}
                className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors flex-shrink-0"
                title="从屏幕取色 (Eyedropper)"
                aria-label="从屏幕取色"
              >
                <Pipette className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>

          {/* 预设颜色 */}
          {showPresets && displayColors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-6 gap-1.5">
                {displayColors.map((color, idx) => (
                  <button
                    key={`${color}-${idx}`}
                    type="button"
                    onClick={() => handlePresetClick(color)}
                    className="w-6 h-6 rounded border border-gray-200 hover:scale-125 transition-transform cursor-pointer"
                    style={{ backgroundColor: color }}
                    title={color}
                    aria-label={`选择颜色 ${color}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 确认 / 取消 按钮 —— 核心修复 */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              确认
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
