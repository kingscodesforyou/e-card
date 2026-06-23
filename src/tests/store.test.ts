import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useEditorStore } from '../store';

describe('Editor Store', () => {
  beforeEach(() => {
    useEditorStore.getState().clearEditor();
  });

  afterEach(() => {
    useEditorStore.getState().clearEditor();
  });

  describe('Initial State', () => {
    it('should have initial state with one page', () => {
      const store = useEditorStore.getState();
      expect(store.currentCard.pages.length).toBe(1);
      expect(store.currentCard.currentPageIndex).toBe(0);
      expect(store.currentCard.pages[0].elements.length).toBe(0);
    });
  });

  describe('Element Operations', () => {
    it('should add an element', () => {
      const store = useEditorStore.getState();
      store.addElement({
        type: 'text',
        content: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 20, height: 10 },
        style: {},
      });
      
      const newState = useEditorStore.getState();
      const currentPage = newState.currentCard.pages[newState.currentCard.currentPageIndex];
      expect(currentPage.elements.length).toBe(1);
      expect(currentPage.elements[0].content).toBe('Test');
    });

    it('should update an element', () => {
      const store = useEditorStore.getState();
      store.addElement({
        type: 'text',
        content: 'Original',
        position: { x: 10, y: 10 },
        size: { width: 20, height: 10 },
        style: {},
      });
      
      const stateAfterAdd = useEditorStore.getState();
      const elementId = stateAfterAdd.currentCard.pages[0].elements[0].id;
      store.updateElement(elementId, { content: 'Updated' });
      
      const stateAfterUpdate = useEditorStore.getState();
      const updatedElement = stateAfterUpdate.currentCard.pages[0].elements[0];
      expect(updatedElement.content).toBe('Updated');
    });

    it('should delete an element', () => {
      const store = useEditorStore.getState();
      store.addElement({
        type: 'text',
        content: 'Test',
        position: { x: 10, y: 10 },
        size: { width: 20, height: 10 },
        style: {},
      });
      
      const stateAfterAdd = useEditorStore.getState();
      const elementId = stateAfterAdd.currentCard.pages[0].elements[0].id;
      store.deleteElement(elementId);
      
      const stateAfterDelete = useEditorStore.getState();
      expect(stateAfterDelete.currentCard.pages[0].elements.length).toBe(0);
    });
  });

  describe('Layer Operations', () => {
    it('should bring element to front', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'First', position: { x: 10, y: 10 }, style: {} });
      store.addElement({ type: 'text', content: 'Second', position: { x: 20, y: 20 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const firstElement = stateAfterAdd.currentCard.pages[0].elements[0];
      
      store.bringToFront(firstElement.id);
      
      const stateAfterBring = useEditorStore.getState();
      const updatedElements = [...stateAfterBring.currentCard.pages[0].elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      expect(updatedElements[updatedElements.length - 1].id).toBe(firstElement.id);
    });

    it('should send element to back', () => {
      const store = useEditorStore.getState();

      store.addElement({ type: 'text', content: 'First', position: { x: 10, y: 10 }, style: {} });
      store.addElement({ type: 'text', content: 'Second', position: { x: 20, y: 20 }, style: {} });

      const stateAfterAdd = useEditorStore.getState();
      const firstElement = stateAfterAdd.currentCard.pages[0].elements[0];
      const secondElement = stateAfterAdd.currentCard.pages[0].elements[1];

      store.sendToBack(secondElement.id);

      const stateAfterSend = useEditorStore.getState();
      const updatedFirst = stateAfterSend.currentCard.pages[0].elements.find(el => el.id === firstElement.id);
      const updatedSecond = stateAfterSend.currentCard.pages[0].elements.find(el => el.id === secondElement.id);

      // 确保所有元素的 zIndex >= 1（不会低于背景层）
      expect((updatedFirst?.zIndex || 0)).toBeGreaterThanOrEqual(1);
      expect((updatedSecond?.zIndex || 0)).toBeGreaterThanOrEqual(1);
      // 被置底的元素应位于或低于原来的最底层
      expect((updatedSecond?.zIndex || 0)).toBeLessThanOrEqual((updatedFirst?.zIndex || 0));
    });

    it('should toggle visibility', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'Test', position: { x: 10, y: 10 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const elementId = stateAfterAdd.currentCard.pages[0].elements[0].id;
      
      store.toggleVisibility(elementId);
      const stateAfterToggle1 = useEditorStore.getState();
      expect(stateAfterToggle1.currentCard.pages[0].elements[0].visible).toBe(false);
      
      store.toggleVisibility(elementId);
      const stateAfterToggle2 = useEditorStore.getState();
      expect(stateAfterToggle2.currentCard.pages[0].elements[0].visible).toBe(true);
    });

    it('should toggle lock', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'Test', position: { x: 10, y: 10 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const elementId = stateAfterAdd.currentCard.pages[0].elements[0].id;
      
      store.toggleLock(elementId);
      const stateAfterToggle1 = useEditorStore.getState();
      expect(stateAfterToggle1.currentCard.pages[0].elements[0].locked).toBe(true);
      
      store.toggleLock(elementId);
      const stateAfterToggle2 = useEditorStore.getState();
      expect(stateAfterToggle2.currentCard.pages[0].elements[0].locked).toBe(false);
    });

    it('should bring element forward', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, style: {} });
      store.addElement({ type: 'text', content: 'B', position: { x: 20, y: 20 }, style: {} });
      store.addElement({ type: 'text', content: 'C', position: { x: 30, y: 30 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const elementA = stateAfterAdd.currentCard.pages[0].elements[0];
      const elementB = stateAfterAdd.currentCard.pages[0].elements[1];
      
      store.bringForward(elementA.id);
      
      const stateAfterBring = useEditorStore.getState();
      const elementAUpdated = stateAfterBring.currentCard.pages[0].elements.find(el => el.id === elementA.id);
      const elementBUpdated = stateAfterBring.currentCard.pages[0].elements.find(el => el.id === elementB.id);
      
      expect((elementAUpdated?.zIndex || 0)).toBeGreaterThan((elementBUpdated?.zIndex || 0));
    });

    it('should send element backward', () => {
      const store = useEditorStore.getState();

      // 用不同的 zIndex 创建三个元素
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, style: {}, zIndex: 1 });
      store.addElement({ type: 'text', content: 'B', position: { x: 20, y: 20 }, style: {}, zIndex: 2 });
      store.addElement({ type: 'text', content: 'C', position: { x: 30, y: 30 }, style: {}, zIndex: 3 });

      const stateAfterAdd = useEditorStore.getState();
      const elementB = stateAfterAdd.currentCard.pages[0].elements.find(el => el.content === 'B');
      const elementC = stateAfterAdd.currentCard.pages[0].elements.find(el => el.content === 'C');

      store.sendBackward(elementC.id);

      const stateAfterSend = useEditorStore.getState();
      const elementBUpdated = stateAfterSend.currentCard.pages[0].elements.find(el => el.id === elementB.id);
      const elementCUpdated = stateAfterSend.currentCard.pages[0].elements.find(el => el.id === elementC.id);

      // 确保所有元素的 zIndex >= 1（不会低于背景层）
      expect((elementBUpdated?.zIndex || 0)).toBeGreaterThanOrEqual(1);
      expect((elementCUpdated?.zIndex || 0)).toBeGreaterThanOrEqual(1);
      // 下移后的元素应低于其上方的元素
      expect((elementCUpdated?.zIndex || 0)).toBeLessThan((elementBUpdated?.zIndex || 0));
    });
  });

  describe('Group Operations', () => {
    it('should group elements', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, size: { width: 10, height: 10 }, style: {} });
      store.addElement({ type: 'text', content: 'B', position: { x: 20, y: 20 }, size: { width: 10, height: 10 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const elementIds = stateAfterAdd.currentCard.pages[0].elements.map(el => el.id);
      
      store.groupElements(elementIds);
      
      const stateAfterGroup = useEditorStore.getState();
      const currentPage = stateAfterGroup.currentCard.pages[0];
      expect(currentPage.elements.length).toBe(1);
      expect(currentPage.elements[0].type).toBe('group');
      expect(currentPage.elements[0].children).toEqual(elementIds);
    });

    it('should not group with less than 2 elements', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const initialLength = stateAfterAdd.currentCard.pages[0].elements.length;
      
      store.groupElements([stateAfterAdd.currentCard.pages[0].elements[0].id]);
      
      const stateAfterGroup = useEditorStore.getState();
      expect(stateAfterGroup.currentCard.pages[0].elements.length).toBe(initialLength);
    });

    it('should ungroup elements', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'A', position: { x: 10, y: 10 }, size: { width: 10, height: 10 }, style: {} });
      store.addElement({ type: 'text', content: 'B', position: { x: 20, y: 20 }, size: { width: 10, height: 10 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const elementIds = stateAfterAdd.currentCard.pages[0].elements.map(el => el.id);
      store.groupElements(elementIds);
      
      const stateAfterGroup = useEditorStore.getState();
      const groupId = stateAfterGroup.currentCard.pages[0].elements[0].id;
      store.ungroupElement(groupId);
      
      const stateAfterUngroup = useEditorStore.getState();
      expect(stateAfterUngroup.currentCard.pages[0].elements.length).toBe(2);
    });
  });

  describe('Undo/Redo', () => {
    it('should undo an action', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'Test', position: { x: 10, y: 10 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      expect(stateAfterAdd.currentCard.pages[0].elements.length).toBe(1);
      
      expect(store.canUndo()).toBe(true);
      store.undo();
      
      const stateAfterUndo = useEditorStore.getState();
      expect(stateAfterUndo.currentCard.pages[0].elements.length).toBe(0);
    });

    it('should redo an action', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'Test', position: { x: 10, y: 10 }, style: {} });
      store.undo();
      
      expect(store.canRedo()).toBe(true);
      store.redo();
      
      const stateAfterRedo = useEditorStore.getState();
      expect(stateAfterRedo.currentCard.pages[0].elements.length).toBe(1);
    });
  });

  describe('Page Operations', () => {
    it('should add a page', () => {
      const store = useEditorStore.getState();
      
      store.addPage();
      
      const stateAfterAdd = useEditorStore.getState();
      expect(stateAfterAdd.currentCard.pages.length).toBe(2);
    });

    it('should delete a page', () => {
      const store = useEditorStore.getState();
      
      store.addPage();
      
      const stateAfterAdd = useEditorStore.getState();
      const pageId = stateAfterAdd.currentCard.pages[1].id;
      
      store.deletePage(pageId);
      
      const stateAfterDelete = useEditorStore.getState();
      expect(stateAfterDelete.currentCard.pages.length).toBe(1);
    });

    it('should duplicate a page', () => {
      const store = useEditorStore.getState();
      
      store.addElement({ type: 'text', content: 'Test', position: { x: 10, y: 10 }, style: {} });
      
      const stateAfterAdd = useEditorStore.getState();
      const pageId = stateAfterAdd.currentCard.pages[0].id;
      
      store.duplicatePage(pageId);
      
      const stateAfterDuplicate = useEditorStore.getState();
      expect(stateAfterDuplicate.currentCard.pages.length).toBe(2);
      expect(stateAfterDuplicate.currentCard.pages[1].elements.length).toBe(1);
    });

    it('should set current page', () => {
      const store = useEditorStore.getState();
      
      store.addPage();
      store.setCurrentPage(1);
      
      const stateAfterSet = useEditorStore.getState();
      expect(stateAfterSet.currentCard.currentPageIndex).toBe(1);
    });
  });
});
