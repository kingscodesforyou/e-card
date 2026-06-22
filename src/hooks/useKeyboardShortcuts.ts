import { useEffect, useCallback } from 'react';
import { useEditorStore } from '../store';

type ShortcutHandler = () => void;

interface ShortcutMap {
  [key: string]: ShortcutHandler;
}

export const useKeyboardShortcuts = () => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    deleteElement,
    selectedElementId,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    toggleVisibility,
    toggleLock,
    selectElement,
    groupElements,
    ungroupElement,
    currentCard,
  } = useEditorStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    if (isInput) return;

    const keys: string[] = [];
    if (e.ctrlKey || e.metaKey) keys.push('ctrl');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    keys.push(e.key.toLowerCase());

    const shortcut = keys.join('+');

    const shortcutMap: ShortcutMap = {
      'ctrl+z': () => canUndo() && undo(),
      'ctrl+y': () => canRedo() && redo(),
      'ctrl+shift+z': () => canRedo() && redo(),
      'delete': () => selectedElementId && deleteElement(selectedElementId),
      'backspace': () => selectedElementId && deleteElement(selectedElementId),
      'ctrl+]': () => selectedElementId && bringForward(selectedElementId),
      'ctrl+[': () => selectedElementId && sendBackward(selectedElementId),
      'ctrl+shift+]': () => selectedElementId && bringToFront(selectedElementId),
      'ctrl+shift+[': () => selectedElementId && sendToBack(selectedElementId),
      'ctrl+shift+v': () => selectedElementId && toggleVisibility(selectedElementId),
      'ctrl+shift+l': () => selectedElementId && toggleLock(selectedElementId),
      'escape': () => selectElement(null),
      'ctrl+g': () => {
        const currentPage = currentCard.pages[currentCard.currentPageIndex];
        if (currentPage) {
          const selectedElements = currentPage.elements.filter(el => el.selected);
          if (selectedElements.length >= 2) {
            groupElements(selectedElements.map(el => el.id));
          }
        }
      },
      'ctrl+shift+g': () => selectedElementId && ungroupElement(selectedElementId),
    };

    const handler = shortcutMap[shortcut];
    if (handler) {
      e.preventDefault();
      handler();
    }
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    deleteElement,
    selectedElementId,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    toggleVisibility,
    toggleLock,
    selectElement,
    groupElements,
    ungroupElement,
    currentCard,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return null;
};

export const SHORTCUTS_LIST = [
  { keys: ['Ctrl', 'Z'], description: '撤销' },
  { keys: ['Ctrl', 'Y'], description: '重做' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: '重做' },
  { keys: ['Delete'], description: '删除选中元素' },
  { keys: ['Backspace'], description: '删除选中元素' },
  { keys: ['Ctrl', ']'], description: '上移一层' },
  { keys: ['Ctrl', '['], description: '下移一层' },
  { keys: ['Ctrl', 'Shift', ']'], description: '置顶' },
  { keys: ['Ctrl', 'Shift', '['], description: '置底' },
  { keys: ['Ctrl', 'Shift', 'V'], description: '切换可见性' },
  { keys: ['Ctrl', 'Shift', 'L'], description: '切换锁定' },
  { keys: ['Escape'], description: '取消选择' },
  { keys: ['Ctrl', 'G'], description: '组合选中元素' },
  { keys: ['Ctrl', 'Shift', 'G'], description: '拆分组合' },
];
