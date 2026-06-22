import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useEditorStore } from '../store';

describe('Editor Store - Edge Cases', () => {
  beforeEach(() => {
    useEditorStore.getState().clearEditor();
  });

  afterEach(() => {
    useEditorStore.getState().clearEditor();
  });

  describe('Undo/Redo Edge Cases', () => {
    it('should not undo when history is empty', () => {
      const store = useEditorStore.getState();
      
      expect(store.canUndo()).toBe(false);
      store.undo();
      
      const stateAfterUndo = useEditorStore.getState();
      expect(stateAfterUndo.currentCard.pages.length).toBe(1);
    });

    it('should not redo when no actions to redo', () => {
      const store = useEditorStore.getState();
      
      expect(store.canRedo()).toBe(false);
      store.redo();
      
      const stateAfterRedo = useEditorStore.getState();
      expect(stateAfterRedo.currentCard.pages.length).toBe(1);
    });

    it('should handle multiple undo operations', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, style: {} });
      store.addElement({ type: 'text', content: 'B', position: { x: 20, y: 20 }, style: {} });
      
      let state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(2);
      
      store.undo();
      state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(1);
      
      store.undo();
      state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(0);
    });

    it('should handle multiple redo operations', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, style: {} });
      
      store.undo();
      store.undo();
      
      let state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(0);
      
      store.redo();
      state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(1);
    });
  });

  describe('Page Operations Edge Cases', () => {
    it('should allow deleting the last page', () => {
      const store = useEditorStore.getState();
      const pageId = useEditorStore.getState().currentCard.pages[0].id;
      
      store.deletePage(pageId);
      
      const state = useEditorStore.getState();
      expect(state.currentCard.pages.length).toBe(0);
    });

    it('should handle duplicate non-existent page', () => {
      const store = useEditorStore.getState();
      
      store.duplicatePage('non-existent-page-id');
      
      const state = useEditorStore.getState();
      expect(state.currentCard.pages.length).toBe(1);
    });

    it('should limit page index within bounds when setting current page', () => {
      const store = useEditorStore.getState();
      
      store.setCurrentPage(100);
      
      const state = useEditorStore.getState();
      expect(state.currentCard.currentPageIndex).toBe(0);
      
      store.setCurrentPage(-5);
      
      const state2 = useEditorStore.getState();
      expect(state2.currentCard.currentPageIndex).toBe(0);
    });

    it('should auto adjust current page index when deleting pages', () => {
      const store = useEditorStore.getState();
      
      store.addPage();
      store.addPage();
      
      let state = useEditorStore.getState();
      expect(state.currentCard.pages.length).toBe(3);
      expect(state.currentCard.currentPageIndex).toBe(2);
      
      store.setCurrentPage(1);
      
      const pageToDeleteId = state.currentCard.pages[2].id;
      store.deletePage(pageToDeleteId);
      
      state = useEditorStore.getState();
      expect(state.currentCard.pages.length).toBe(2);
      expect(state.currentCard.currentPageIndex).toBe(1);
    });
  });

  describe('Element Operations Edge Cases', () => {
    it('should handle update non-existent element', () => {
      const store = useEditorStore.getState();
      
      store.updateElement('non-existent-id', { content: 'Updated' });
      
      const state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(0);
    });

    it('should handle delete non-existent element', () => {
      const store = useEditorStore.getState();
      
      store.deleteElement('non-existent-id');
      
      const state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(0);
    });

    it('should clear editor completely', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'Test', position: { x: 10, y: 10 }, style: {} });
      store.addPage();
      
      let state = useEditorStore.getState();
      expect(state.currentCard.pages.length).toBe(2);
      expect(state.currentCard.pages[0].elements.length).toBe(1);
      
      store.clearEditor();
      
      state = useEditorStore.getState();
      expect(state.currentCard.pages.length).toBe(1);
      expect(state.currentCard.pages[0].elements.length).toBe(0);
      expect(state.history.length).toBe(0);
      expect(state.historyIndex).toBe(-1);
    });

    it('should select and deselect elements', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'Test', position: { x: 10, y: 10 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const elementId = stateAfterAdd.currentCard.pages[0].elements[0].id;
      
      store.selectElement(elementId);
      let state = useEditorStore.getState();
      expect(state.selectedElementId).toBe(elementId);
      
      store.selectElement(null);
      state = useEditorStore.getState();
      expect(state.selectedElementId).toBeNull();
    });
  });

  describe('Layer Operations Edge Cases', () => {
    it('should handle bringToFront for non-existent element', () => {
      const store = useEditorStore.getState();
      
      store.bringToFront('non-existent-id');
      
      const state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(0);
    });

    it('should handle sendToBack for non-existent element', () => {
      const store = useEditorStore.getState();
      
      store.sendToBack('non-existent-id');
      
      const state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(0);
    });

    it('should handle bringForward for first element', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, style: {} });
      store.addElement({ type: 'text', content: 'B', position: { x: 20, y: 20 }, style: {} });
      
      const state = useEditorStore.getState();
      const firstElementId = state.currentCard.pages[0].elements[0].id;
      
      store.bringForward(firstElementId);
      
      const stateAfter = useEditorStore.getState();
      expect(stateAfter.currentCard.pages[0].elements.length).toBe(2);
    });

    it('should handle sendBackward for last element', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, style: {} });
      store.addElement({ type: 'text', content: 'B', position: { x: 20, y: 20 }, style: {} });
      
      const state = useEditorStore.getState();
      const lastElementId = state.currentCard.pages[0].elements[1].id;
      
      store.sendBackward(lastElementId);
      
      const stateAfter = useEditorStore.getState();
      expect(stateAfter.currentCard.pages[0].elements.length).toBe(2);
    });
  });

  describe('Group Operations Edge Cases', () => {
    it('should not group with empty array', () => {
      const store = useEditorStore.getState();
      
      store.groupElements([]);
      
      const state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(0);
    });

    it('should handle ungroup non-existent group', () => {
      const store = useEditorStore.getState();
      
      store.ungroupElement('non-existent-group-id');
      
      const state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(0);
    });

    it('should handle ungroup a non-group element', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const elementId = stateAfterAdd.currentCard.pages[0].elements[0].id;
      
      store.ungroupElement(elementId);
      
      const state = useEditorStore.getState();
      expect(state.currentCard.pages[0].elements.length).toBe(1);
    });
  });

  describe('Preview Mode', () => {
    it('should set preview mode', () => {
      const store = useEditorStore.getState();
      
      store.setPreviewMode(true);
      
      let state = useEditorStore.getState();
      expect(state.isPreviewMode).toBe(true);
      
      store.setPreviewMode(false);
      
      state = useEditorStore.getState();
      expect(state.isPreviewMode).toBe(false);
    });

    it('should toggle preview mode', () => {
      const store = useEditorStore.getState();
      
      store.setPreviewMode(true);
      store.setPreviewMode(false);
      
      const state = useEditorStore.getState();
      expect(state.isPreviewMode).toBe(false);
    });
  });

  describe('setCurrentCard', () => {
    it('should update current card properties', () => {
      const store = useEditorStore.getState();
      
      store.setCurrentCard({ title: 'My Card' });
      
      let state = useEditorStore.getState();
      expect(state.currentCard.title).toBe('My Card');
      
      store.setCurrentCard({ templateId: 'template-1' });
      
      state = useEditorStore.getState();
      expect(state.currentCard.templateId).toBe('template-1');
      expect(state.currentCard.title).toBe('My Card');
    });
  });
});
