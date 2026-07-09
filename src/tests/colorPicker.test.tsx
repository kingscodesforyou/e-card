import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import ColorPicker, { PRESET_COLORS } from '../components/common/ColorPicker';

// Mock react-colorful
vi.mock('react-colorful', () => ({
  HexColorPicker: ({ color, onChange }: { color: string; onChange: (c: string) => void }) => (
    <div data-testid="hex-color-picker" data-color={color}>
      <button data-testid="picker-change" onClick={() => onChange('#ff0000')}>
        Change Color
      </button>
    </div>
  ),
  HexColorInput: ({ color, onChange, onBlur }: { color: string; onChange: (v: string) => void; onBlur: () => void }) => (
    <input
      data-testid="hex-color-input"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Pipette: () => <span data-testid="pipette-icon" />,
  X: () => <span data-testid="x-icon" />,
  Check: () => <span data-testid="check-icon" />,
}));

describe('ColorPicker - 颜色选择器完整流程测试', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    cleanup();
  });

  // ============================================================
  // 1. 基本渲染测试
  // ============================================================
  describe('基本渲染', () => {
    it('应该渲染颜色预览按钮', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      const button = screen.getByRole('button', { name: /当前颜色/i });
      expect(button).toBeInTheDocument();
    });

    it('预览按钮应该显示当前颜色', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      const button = screen.getByRole('button', { name: /当前颜色/i });
      expect(button).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('弹窗初始状态应该关闭', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  // ============================================================
  // 2. 打开/关闭弹窗测试
  // ============================================================
  describe('打开/关闭弹窗', () => {
    it('点击预览按钮应该打开弹窗', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      const button = screen.getByRole('button', { name: /当前颜色/i });
      fireEvent.click(button);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('点击取消按钮应该关闭弹窗', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));
      fireEvent.click(screen.getByText('取消'));
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('点击确认按钮应该关闭弹窗', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));
      fireEvent.click(screen.getByText('确认'));
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  // ============================================================
  // 3. 两阶段提交机制测试 —— 核心修复验证
  // ============================================================
  describe('两阶段提交机制（核心修复）', () => {
    it('选择颜色期间不应该触发 onChange', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));

      // 模拟拖拽色板
      fireEvent.click(screen.getByTestId('picker-change'));

      // onChange 不应该被调用 —— 这是修复的关键
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('点击确认按钮才应该触发 onChange', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));

      // 选择颜色
      fireEvent.click(screen.getByTestId('picker-change'));

      // 点击确认
      fireEvent.click(screen.getByText('确认'));

      // 现在才触发 onChange
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('#ff0000');
    });

    it('点击取消按钮不应该触发 onChange', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));

      // 选择颜色
      fireEvent.click(screen.getByTestId('picker-change'));

      // 点击取消
      fireEvent.click(screen.getByText('取消'));

      // 不应该触发 onChange
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('多次拖拽色板只触发一次 onChange（确认时）', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));

      // 模拟多次拖拽
      fireEvent.click(screen.getByTestId('picker-change'));
      fireEvent.click(screen.getByTestId('picker-change'));
      fireEvent.click(screen.getByTestId('picker-change'));
      fireEvent.click(screen.getByTestId('picker-change'));
      fireEvent.click(screen.getByTestId('picker-change'));

      // 拖拽期间不触发
      expect(mockOnChange).not.toHaveBeenCalled();

      // 确认时只触发一次
      fireEvent.click(screen.getByText('确认'));
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // 4. 预设颜色测试
  // ============================================================
  describe('预设颜色', () => {
    it('应该显示预设颜色', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} showPresets={true} presetCount={6} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));

      const presetButtons = screen.getAllByRole('button', { name: /选择颜色/i });
      expect(presetButtons.length).toBe(6);
    });

    it('点击预设颜色不应该触发 onChange（仅更新 draft）', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} showPresets={true} presetCount={6} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));

      const presetButtons = screen.getAllByRole('button', { name: /选择颜色/i });
      fireEvent.click(presetButtons[0]);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('点击预设颜色后确认应该触发 onChange', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} showPresets={true} presetCount={6} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));

      const presetButtons = screen.getAllByRole('button', { name: /选择颜色/i });
      fireEvent.click(presetButtons[0]);
      fireEvent.click(screen.getByText('确认'));

      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // 5. HEX 输入测试
  // ============================================================
  describe('HEX 文本输入', () => {
    it('应该显示 HEX 输入框', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} showHexInput={true} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));
      expect(screen.getByTestId('hex-color-input')).toBeInTheDocument();
    });

    it('输入 HEX 不应该触发 onChange', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} showHexInput={true} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));

      const input = screen.getByTestId('hex-color-input');
      fireEvent.change(input, { target: { value: '#00ff00' } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 6. 禁用状态测试
  // ============================================================
  describe('禁用状态', () => {
    it('禁用时点击不应该打开弹窗', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} disabled={true} />);
      const button = screen.getByRole('button', { name: /当前颜色/i });
      fireEvent.click(button);
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  // ============================================================
  // 7. 尺寸变体测试
  // ============================================================
  describe('尺寸变体', () => {
    it('sm 尺寸应该正确渲染', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} size="sm" />);
      const button = screen.getByRole('button', { name: /当前颜色/i });
      expect(button.className).toContain('w-6');
    });

    it('lg 尺寸应该正确渲染', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} size="lg" />);
      const button = screen.getByRole('button', { name: /当前颜色/i });
      expect(button.className).toContain('w-10');
    });
  });

  // ============================================================
  // 8. 异常场景测试
  // ============================================================
  describe('异常场景', () => {
    it('无效颜色值应该回退到默认值', () => {
      render(<ColorPicker value="invalid" onChange={mockOnChange} />);
      const button = screen.getByRole('button', { name: /当前颜色/i });
      // backgroundColor 应该是规范化的默认值 #000000
      expect(button).toHaveStyle({ backgroundColor: '#000000' });
    });

    it('空值应该回退到默认值', () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);
      const button = screen.getByRole('button', { name: /当前颜色/i });
      expect(button).toHaveStyle({ backgroundColor: '#000000' });
    });

    it('3位 HEX 应该正确处理', () => {
      render(<ColorPicker value="#fff" onChange={mockOnChange} />);
      // 不应该崩溃
      expect(screen.getByRole('button', { name: /当前颜色/i })).toBeInTheDocument();
    });

    it('确认按钮应该提交规范化后的颜色', () => {
      render(<ColorPicker value="#fff" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));
      fireEvent.click(screen.getByText('确认'));

      expect(mockOnChange).toHaveBeenCalledWith('#ffffff');
    });
  });

  // ============================================================
  // 9. 回归测试 —— 模拟高频拖拽场景
  // ============================================================
  describe('回归测试：高频拖拽', () => {
    it('60fps 拖拽 1 秒不应该卡死（零 store 更新）', () => {
      const { container } = render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));

      // 模拟 60 次快速颜色变化（1 秒的 60fps 拖拽）
      for (let i = 0; i < 60; i++) {
        fireEvent.click(screen.getByTestId('picker-change'));
      }

      // 整个过程中 onChange 不应该被调用
      expect(mockOnChange).not.toHaveBeenCalled();

      // 确认后只触发一次
      fireEvent.click(screen.getByText('确认'));
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('打开-取消-打开-确认流程应该正常工作', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);

      // 第一次打开
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));
      fireEvent.click(screen.getByTestId('picker-change'));
      fireEvent.click(screen.getByText('取消'));
      expect(mockOnChange).not.toHaveBeenCalled();

      // 第二次打开
      fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));
      fireEvent.click(screen.getByText('确认'));
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('连续 10 次选择-确认应该正常工作', () => {
      render(<ColorPicker value="#ff0000" onChange={mockOnChange} />);

      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByRole('button', { name: /当前颜色/i }));
        fireEvent.click(screen.getByTestId('picker-change'));
        fireEvent.click(screen.getByText('确认'));
      }

      expect(mockOnChange).toHaveBeenCalledTimes(10);
    });
  });
});
