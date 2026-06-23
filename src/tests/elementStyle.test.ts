import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useEditorStore } from '../store';
import { getElementVisualStyle, getShapeVisualStyle, SHAPE_CONTENT, isShapeElement } from '../lib/elementStyle';
import type { CardElement } from '../types';

describe('Element Style Utilities', () => {
  describe('isShapeElement', () => {
    it('should return true for shape elements', () => {
      const el: CardElement = {
        id: '1', type: 'shape', content: SHAPE_CONTENT.circle,
        position: { x: 0, y: 0 }, style: { backgroundColor: '#fff' },
      };
      expect(isShapeElement(el)).toBe(true);
    });

    it('should return false for non-shape elements', () => {
      const el: CardElement = {
        id: '1', type: 'text', content: 'hello',
        position: { x: 0, y: 0 }, style: {},
      };
      expect(isShapeElement(el)).toBe(false);
    });
  });

  describe('getShapeVisualStyle', () => {
    it('should extract backgroundColor for rectangle shape', () => {
      const el: CardElement = {
        id: '1', type: 'shape', content: SHAPE_CONTENT.rectangle,
        position: { x: 0, y: 0 },
        style: { backgroundColor: '#ff0000', borderRadius: 8 },
      };
      const style = getShapeVisualStyle(el);
      expect(style.backgroundColor).toBe('#ff0000');
      expect(style.borderRadius).toBe(8);
    });

    it('should preserve clipPath for star shape', () => {
      const clipPath = 'polygon(50% 0%, 61% 35%)';
      const el: CardElement = {
        id: '1', type: 'shape', content: SHAPE_CONTENT.star,
        position: { x: 0, y: 0 },
        style: { backgroundColor: '#8B5CF6', clipPath },
      };
      const style = getShapeVisualStyle(el);
      // clipPath 通过索引签名透传
      expect((style as Record<string, unknown>).clipPath).toBe(clipPath);
      expect(style.backgroundColor).toBe('#8B5CF6');
    });

    it('should preserve border triangle technique for triangle shape', () => {
      const el: CardElement = {
        id: '1', type: 'shape', content: SHAPE_CONTENT.triangle,
        position: { x: 0, y: 0 },
        style: {
          borderBottom: '26px solid #8B5CF6',
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
        },
      };
      const style = getShapeVisualStyle(el);
      // 三个 border 属性都应被保留
      expect((style as Record<string, unknown>).borderBottom).toBe('26px solid #8B5CF6');
      expect((style as Record<string, unknown>).borderLeft).toBe('15px solid transparent');
      expect((style as Record<string, unknown>).borderRight).toBe('15px solid transparent');
    });

    it('should return empty object for non-shape element', () => {
      const el: CardElement = {
        id: '1', type: 'text', content: 'hello',
        position: { x: 0, y: 0 }, style: { backgroundColor: '#fff' },
      };
      expect(getShapeVisualStyle(el)).toEqual({});
    });
  });

  describe('getElementVisualStyle', () => {
    it('should merge base layout style with element visual style', () => {
      const el: CardElement = {
        id: '1', type: 'text', content: 'hello',
        position: { x: 10, y: 20 },
        style: { fontSize: 24, color: '#333', fontWeight: 'bold' },
      };
      const style = getElementVisualStyle(el, { position: 'absolute', left: '10%' });
      expect(style.position).toBe('absolute');
      expect(style.left).toBe('10%');
      expect(style.fontSize).toBe(24);
      expect(style.color).toBe('#333');
      expect(style.fontWeight).toBe('bold');
    });

    it('should include animationDuration in milliseconds when set as number', () => {
      const el: CardElement = {
        id: '1', type: 'text', content: 'x',
        position: { x: 0, y: 0 },
        style: { animation: 'fadeIn', animationDuration: 1500, animationDelay: 300 },
      };
      const style = getElementVisualStyle(el);
      expect(style.animationDuration).toBe('1500ms');
      expect(style.animationDelay).toBe('300ms');
    });

    it('should include fontStyle and textDecoration for text styling', () => {
      const el: CardElement = {
        id: '1', type: 'text', content: 'italic underline',
        position: { x: 0, y: 0 },
        style: { fontStyle: 'italic', textDecoration: 'underline' },
      };
      const style = getElementVisualStyle(el);
      expect(style.fontStyle).toBe('italic');
      expect(style.textDecoration).toBe('underline');
    });

    it('should apply shape visual style for shape elements', () => {
      const el: CardElement = {
        id: '1', type: 'shape', content: SHAPE_CONTENT.circle,
        position: { x: 0, y: 0 },
        style: { backgroundColor: '#ff0000', borderRadius: 50 },
      };
      const style = getElementVisualStyle(el, {});
      expect(style.backgroundColor).toBe('#ff0000');
      expect(style.borderRadius).toBe(50);
    });
  });
});

describe('duplicateElement', () => {
  beforeEach(() => {
    useEditorStore.getState().clearEditor();
  });

  afterEach(() => {
    useEditorStore.getState().clearEditor();
  });

  it('should duplicate an element with a new id', () => {
    const store = useEditorStore.getState();
    store.addElement({
      type: 'text',
      content: 'Original',
      position: { x: 10, y: 10 },
      style: {},
    });

    const stateAfterAdd = useEditorStore.getState();
    const originalId = stateAfterAdd.currentCard.pages[0].elements[0].id;

    store.duplicateElement(originalId);

    const stateAfterDup = useEditorStore.getState();
    expect(stateAfterDup.currentCard.pages[0].elements.length).toBe(2);

    const duplicated = stateAfterDup.currentCard.pages[0].elements[1];
    expect(duplicated.id).not.toBe(originalId);
    expect(duplicated.content).toBe('Original');
  });

  it('should offset the duplicated element position', () => {
    const store = useEditorStore.getState();
    store.addElement({
      type: 'text',
      content: 'Test',
      position: { x: 50, y: 50 },
      style: {},
    });

    const originalId = useEditorStore.getState().currentCard.pages[0].elements[0].id;
    store.duplicateElement(originalId);

    const state = useEditorStore.getState();
    const duplicated = state.currentCard.pages[0].elements[1];
    expect(duplicated.position.x).toBe(53);
    expect(duplicated.position.y).toBe(53);
  });

  it('should select the duplicated element', () => {
    const store = useEditorStore.getState();
    store.addElement({
      type: 'text',
      content: 'Test',
      position: { x: 10, y: 10 },
      style: {},
    });

    const originalId = useEditorStore.getState().currentCard.pages[0].elements[0].id;
    store.duplicateElement(originalId);

    const state = useEditorStore.getState();
    expect(state.selectedElementId).not.toBe(originalId);
    expect(state.selectedElementId).not.toBeNull();
  });

  it('should handle non-existent element gracefully', () => {
    const store = useEditorStore.getState();
    store.duplicateElement('non-existent-id');

    const state = useEditorStore.getState();
    expect(state.currentCard.pages[0].elements.length).toBe(0);
  });

  it('should not carry over selected flag on duplicate', () => {
    const store = useEditorStore.getState();
    store.addElement({
      type: 'text',
      content: 'Test',
      position: { x: 10, y: 10 },
      style: {},
      selected: true,
    });

    const originalId = useEditorStore.getState().currentCard.pages[0].elements[0].id;
    store.duplicateElement(originalId);

    const state = useEditorStore.getState();
    const duplicated = state.currentCard.pages[0].elements[1];
    expect(duplicated.selected).toBeFalsy();
  });

  it('should be recorded in history', () => {
    const store = useEditorStore.getState();
    store.addElement({
      type: 'text',
      content: 'Test',
      position: { x: 10, y: 10 },
      style: {},
    });

    const originalId = useEditorStore.getState().currentCard.pages[0].elements[0].id;
    store.duplicateElement(originalId);

    const state = useEditorStore.getState();
    expect(state.canUndo()).toBe(true);

    // undo 应该移除复制的元素
    store.undo();
    const stateAfterUndo = useEditorStore.getState();
    expect(stateAfterUndo.currentCard.pages[0].elements.length).toBe(1);
  });
});
