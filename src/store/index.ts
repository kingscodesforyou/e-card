import { create } from 'zustand';
import { CardElement, ElementAnimation, CardPage, Template, Card, User } from '../types';

// 生成唯一ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// 创建空白页
const createBlankPage = (pageNumber: number = 1): CardPage => ({
  id: generateId(),
  pageNumber,
  elements: [],
  transition: 'fade',
  transitionDuration: 500,
  audioAutoplay: false,
  audioLoop: false,
});

interface HistoryEntry {
  type: 'addElement' | 'updateElement' | 'deleteElement' | 'addPage' | 'deletePage' | 'duplicatePage' | 'updatePage' | 'reorderPages' | 'setCurrentCard';
  prevState: EditorState['currentCard'];
  nextState: EditorState['currentCard'];
}

interface EditorState {
  currentCard: {
    id?: string;
    title: string;
    templateId: string;
    pages: CardPage[];
    currentPageIndex: number;
    backgroundMusicUrl?: string;
    backgroundMusicLoop?: boolean;
  };
  selectedElementId: string | null;
  isPreviewMode: boolean;
  // 动画面板展开状态（按动画ID记录, UI 状态，持久化以应对组件重挂载）
  animationExpanded: Record<string, boolean>;
  // 历史记录
  history: HistoryEntry[];
  historyIndex: number;
  // 页面操作
  setCurrentCard: (card: Partial<EditorState['currentCard']>) => void;
  addPage: () => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  setCurrentPage: (pageIndex: number) => void;
  updatePage: (pageId: string, updates: Partial<CardPage>) => void;
  reorderPages: (startIndex: number, endIndex: number) => void;
  // 元素操作（针对当前页）
  addElement: (element: Omit<CardElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<CardElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  // 图层层级操作
  bringToFront: (elementId: string) => void;
  sendToBack: (elementId: string) => void;
  bringForward: (elementId: string) => void;
  sendBackward: (elementId: string) => void;
  toggleVisibility: (elementId: string) => void;
  toggleLock: (elementId: string) => void;
  // 组合操作
  groupElements: (elementIds: string[]) => void;
  ungroupElement: (groupId: string) => void;
  // 复制元素
  duplicateElement: (id: string) => void;
  // 动画序列管理
  addAnimation: (elementId: string, animation: Omit<ElementAnimation, 'id'>) => void;
  removeAnimation: (elementId: string, animationId: string) => void;
  updateAnimation: (elementId: string, animationId: string, updates: Partial<ElementAnimation>) => void;
  reorderAnimations: (elementId: string, startIndex: number, endIndex: number) => void;
  toggleAnimationExpanded: (id: string) => void;
  // 撤销/重做
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  // 其他
  setPreviewMode: (mode: boolean) => void;
  clearEditor: () => void;
  clearSelectedFlags: () => void;
}

interface TemplatesState {
  templates: Template[];
  categories: string[];
  occasions: string[];
  styles: string[];
  selectedCategory: string;
  selectedOccasion: string;
  selectedStyle: string;
  loading: boolean;
  setTemplates: (templates: Template[]) => void;
  setCategories: (categories: string[]) => void;
  setOccasions: (occasions: string[]) => void;
  setStyles: (styles: string[]) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedOccasion: (occasion: string) => void;
  setSelectedStyle: (style: string) => void;
  setLoading: (loading: boolean) => void;
}

interface UserState {
  user: User | null;
  designs: Card[];
  favorites: Template[];
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setDesigns: (designs: Card[]) => void;
  setFavorites: (favorites: Template[]) => void;
  setIsAuthenticated: (auth: boolean) => void;
  addDesign: (design: Card) => void;
  removeDesign: (id: string) => void;
  updateDesign: (design: Card) => void;
  addFavorite: (template: Template) => void;
  removeFavorite: (templateId: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => {
  const MAX_HISTORY = 50;
  
  const saveHistory = (type: HistoryEntry['type'], prevState: EditorState['currentCard'], nextState: EditorState['currentCard']) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({ type, prevState, nextState });
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  };

  return {
    currentCard: {
      title: '',
      templateId: '',
      pages: [createBlankPage(1)],
      currentPageIndex: 0,
      backgroundMusicLoop: true,
    },
    selectedElementId: null,
    isPreviewMode: false,
    animationExpanded: {},
    history: [],
    historyIndex: -1,
    // 设置当前卡片
    setCurrentCard: (updates) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const nextState = { ...state.currentCard, ...updates };
        saveHistory('setCurrentCard', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 添加新页面
    addPage: () =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPage = createBlankPage(state.currentCard.pages.length + 1);
        const nextState = {
          ...state.currentCard,
          pages: [...state.currentCard.pages, newPage],
          currentPageIndex: state.currentCard.pages.length,
        };
        saveHistory('addPage', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 删除页面
    deletePage: (pageId) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = state.currentCard.pages.filter((p) => p.id !== pageId);
        const reNumbered = newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        let newIndex = state.currentCard.currentPageIndex;
        if (newIndex >= reNumbered.length) {
          newIndex = Math.max(0, reNumbered.length - 1);
        }
        const nextState = {
          ...state.currentCard,
          pages: reNumbered,
          currentPageIndex: newIndex,
        };
        saveHistory('deletePage', prevState, nextState);
        return { currentCard: nextState, selectedElementId: null };
      }),
    // 复制页面
    duplicatePage: (pageId) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const pageIndex = state.currentCard.pages.findIndex((p) => p.id === pageId);
        if (pageIndex === -1) return state;
        const sourcePage = state.currentCard.pages[pageIndex];
        const newPage: CardPage = {
          ...sourcePage,
          id: generateId(),
          pageNumber: pageIndex + 2,
          elements: sourcePage.elements.map((el) => ({ ...el, id: generateId() })),
        };
        const newPages = [
          ...state.currentCard.pages.slice(0, pageIndex + 1),
          newPage,
          ...state.currentCard.pages.slice(pageIndex + 1).map((p, idx) => ({
            ...p,
            pageNumber: pageIndex + 2 + idx + 1,
          })),
        ];
        const nextState = {
          ...state.currentCard,
          pages: newPages,
          currentPageIndex: pageIndex + 1,
        };
        saveHistory('duplicatePage', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 切换到指定页
    setCurrentPage: (pageIndex) =>
      set((state) => ({
        currentCard: {
          ...state.currentCard,
          currentPageIndex: Math.max(0, Math.min(pageIndex, state.currentCard.pages.length - 1)),
        },
        selectedElementId: null,
      })),
    // 更新页面属性
    updatePage: (pageId, updates) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const nextState = {
          ...state.currentCard,
          pages: state.currentCard.pages.map((p) =>
            p.id === pageId ? { ...p, ...updates } : p
          ),
        };
        saveHistory('updatePage', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 拖拽排序页面
    reorderPages: (startIndex, endIndex) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = [...state.currentCard.pages];
        const [removed] = newPages.splice(startIndex, 1);
        newPages.splice(endIndex, 0, removed);
        const reNumbered = newPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
        const nextState = {
          ...state.currentCard,
          pages: reNumbered,
        };
        saveHistory('reorderPages', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 添加元素到当前页
    addElement: (element) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const currentPage = state.currentCard.pages[state.currentCard.currentPageIndex];
        if (!currentPage) return state;
        const newElement = { ...element, zIndex: element.zIndex ?? 1, id: generateId() };
        const newPages = state.currentCard.pages.map((p, idx) =>
          idx === state.currentCard.currentPageIndex
            ? { ...p, elements: [...p.elements, newElement] }
            : p
        );
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('addElement', prevState, nextState);
        return { currentCard: nextState, selectedElementId: newElement.id };
      }),
    // 更新元素
    updateElement: (id, updates) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = state.currentCard.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
        }));
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('updateElement', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 删除元素
    deleteElement: (id) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = state.currentCard.pages.map((p) => ({
          ...p,
          elements: p.elements.filter((el) => el.id !== id),
        }));
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('deleteElement', prevState, nextState);
        return { currentCard: nextState, selectedElementId: null };
      }),
    // 置顶
    bringToFront: (elementId) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const currentPage = state.currentCard.pages[state.currentCard.currentPageIndex];
        if (!currentPage) return state;
        const maxZIndex = Math.max(...currentPage.elements.map((el) => el.zIndex || 0));
        const newPages = state.currentCard.pages.map((p, idx) =>
          idx === state.currentCard.currentPageIndex
            ? {
                ...p,
                elements: p.elements.map((el) =>
                  el.id === elementId ? { ...el, zIndex: maxZIndex + 1 } : el
                ),
              }
            : p
        );
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('updateElement', prevState, nextState);
        return { currentCard: nextState };
      }),
	    // 置底
	    sendToBack: (elementId) =>
	      set((state) => {
	        const prevState = { ...state.currentCard };
	        const currentPage = state.currentCard.pages[state.currentCard.currentPageIndex];
	        if (!currentPage) return state;
	        const minZIndex = Math.min(...currentPage.elements.map((el) => el.zIndex || 0));
	        const newPages = state.currentCard.pages.map((p, idx) =>
	          idx === state.currentCard.currentPageIndex
	            ? {
	                ...p,
	                elements: p.elements.map((el) =>
	                  el.id === elementId ? { ...el, zIndex: Math.max(minZIndex - 1, 1) } : el
	                ),
	              }
	            : p
	        );
	        const nextState = { ...state.currentCard, pages: newPages };
	        saveHistory('updateElement', prevState, nextState);
	        return { currentCard: nextState };
	      }),
	    // 上移一层（与上面的元素交换 zIndex）
	    bringForward: (elementId) =>
	      set((state) => {
	        const prevState = { ...state.currentCard };
	        const currentPage = state.currentCard.pages[state.currentCard.currentPageIndex];
	        if (!currentPage) return state;
	        const sortedElements = [...currentPage.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
	        const targetIdx = sortedElements.findIndex((el) => el.id === elementId);
	        if (targetIdx === -1 || targetIdx >= sortedElements.length - 1) return state;
	        const aboveElement = sortedElements[targetIdx + 1];
	        const targetOldZIndex = sortedElements[targetIdx].zIndex ?? 0;
	        const aboveOldZIndex = aboveElement.zIndex ?? 0;
	        // 若 zIndex 相同则 target 需要 +1 才能在上方，否则交换
	        const targetZIndex = aboveOldZIndex === targetOldZIndex ? aboveOldZIndex + 1 : aboveOldZIndex;
	        const aboveNewZIndex = aboveOldZIndex === targetOldZIndex ? targetOldZIndex : targetOldZIndex;
	        const newPages = state.currentCard.pages.map((p, idx) =>
	          idx === state.currentCard.currentPageIndex
	            ? {
	                ...p,
	                elements: p.elements.map((el) =>
	                  el.id === elementId
	                    ? { ...el, zIndex: targetZIndex }
	                    : el.id === aboveElement.id
	                      ? { ...el, zIndex: aboveNewZIndex }
	                      : el
	                ),
	              }
	            : p
	        );
	        const nextState = { ...state.currentCard, pages: newPages };
	        saveHistory('updateElement', prevState, nextState);
	        return { currentCard: nextState };
	      }),
	    // 下移一层（与下面的元素交换 zIndex）
	    sendBackward: (elementId) =>
	      set((state) => {
	        const prevState = { ...state.currentCard };
	        const currentPage = state.currentCard.pages[state.currentCard.currentPageIndex];
	        if (!currentPage) return state;
	        const sortedElements = [...currentPage.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
	        const targetIdx = sortedElements.findIndex((el) => el.id === elementId);
	        if (targetIdx === -1 || targetIdx <= 0) return state;
	        const belowElement = sortedElements[targetIdx - 1];
	        const targetOldZIndex = sortedElements[targetIdx].zIndex ?? 0;
	        const belowOldZIndex = belowElement.zIndex ?? 0;
	        // 若 zIndex 相同则 target 需要 -1 才能在下方，否则交换
	        const targetZIndex = belowOldZIndex === targetOldZIndex
	          ? Math.max(belowOldZIndex - 1, 1)
	          : belowOldZIndex;
	        const belowNewZIndex = belowOldZIndex === targetOldZIndex ? targetOldZIndex : targetOldZIndex;
	        const newPages = state.currentCard.pages.map((p, idx) =>
	          idx === state.currentCard.currentPageIndex
	            ? {
	                ...p,
	                elements: p.elements.map((el) =>
	                  el.id === elementId
	                    ? { ...el, zIndex: targetZIndex }
	                    : el.id === belowElement.id
	                      ? { ...el, zIndex: belowNewZIndex }
	                      : el
	                ),
	              }
	            : p
	        );
	        const nextState = { ...state.currentCard, pages: newPages };
	        saveHistory('updateElement', prevState, nextState);
	        return { currentCard: nextState };
	      }),
    // 切换可见性
    toggleVisibility: (elementId) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = state.currentCard.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) =>
            el.id === elementId ? { ...el, visible: !(el.visible ?? true) } : el
          ),
        }));
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('updateElement', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 切换锁定
    toggleLock: (elementId) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = state.currentCard.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) =>
            el.id === elementId ? { ...el, locked: !(el.locked ?? false) } : el
          ),
        }));
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('updateElement', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 组合元素
    groupElements: (elementIds) =>
      set((state) => {
        if (elementIds.length < 2) return state;
        
        const prevState = { ...state.currentCard };
        const currentPage = state.currentCard.pages[state.currentCard.currentPageIndex];
        if (!currentPage) return state;

        const groupElements = currentPage.elements.filter((el) => elementIds.includes(el.id));
        if (groupElements.length < 2) return state;

        const minX = Math.min(...groupElements.map((el) => el.position.x));
        const minY = Math.min(...groupElements.map((el) => el.position.y));
        const maxX = Math.max(...groupElements.map((el) => el.position.x + (el.size?.width || 0)));
        const maxY = Math.max(...groupElements.map((el) => el.position.y + (el.size?.height || 0)));

        const group: CardElement = {
          id: generateId(),
          type: 'group',
          content: 'group',
          position: { x: minX, y: minY },
          size: { width: maxX - minX, height: maxY - minY },
          children: elementIds,
          childElements: [...groupElements],
          zIndex: Math.max(...groupElements.map((el) => el.zIndex || 0)) + 1,
          style: {},
        };

        const newPages = state.currentCard.pages.map((p, idx) =>
          idx === state.currentCard.currentPageIndex
            ? {
                ...p,
                elements: [...p.elements.filter((el) => !elementIds.includes(el.id)), group],
              }
            : p
        );

        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('updateElement', prevState, nextState);
        return { currentCard: nextState, selectedElementId: group.id };
      }),
    // 拆分组合
    ungroupElement: (groupId) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const currentPage = state.currentCard.pages[state.currentCard.currentPageIndex];
        if (!currentPage) return state;

        const group = currentPage.elements.find((el) => el.id === groupId);
        if (!group || group.type !== 'group' || !group.childElements) return state;

        const newPages = state.currentCard.pages.map((p, idx) => {
          if (idx !== state.currentCard.currentPageIndex) return p;

          const groupIndex = p.elements.findIndex((el) => el.id === groupId);
          if (groupIndex === -1) return p;

          const elementsBefore = p.elements.slice(0, groupIndex);
          const elementsAfter = p.elements.slice(groupIndex + 1);
          const ungroupedElements = group.childElements!.map((child) => ({
            ...child,
            position: {
              x: child.position.x,
              y: child.position.y,
            },
          }));

          return {
            ...p,
            elements: [...elementsBefore, ...ungroupedElements, ...elementsAfter],
          };
        });

        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('updateElement', prevState, nextState);
        return { currentCard: nextState, selectedElementId: null };
      }),
    // 复制元素到当前页（偏移3%避免重叠）
    duplicateElement: (id) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const currentPage = state.currentCard.pages[state.currentCard.currentPageIndex];
        if (!currentPage) return state;

        const source = currentPage.elements.find((el) => el.id === id);
        if (!source) return state;

        const copy: CardElement = {
          ...JSON.parse(JSON.stringify(source)),
          id: generateId(),
          position: { x: (source.position.x + 3) % 100, y: (source.position.y + 3) % 100 },
          selected: false,
          zIndex: (source.zIndex || 0) + 1,
        };

        const newPages = state.currentCard.pages.map((p, idx) =>
          idx === state.currentCard.currentPageIndex
            ? { ...p, elements: [...p.elements, copy] }
            : p
        );

        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('addElement', prevState, nextState);
        return { currentCard: nextState, selectedElementId: copy.id };
      }),
    // 添加动画到元素
    addAnimation: (elementId, animation) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = state.currentCard.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) => {
            if (el.id !== elementId) return el;
            const newAnim: ElementAnimation = {
              ...animation,
              id: generateId(),
            };
            return {
              ...el,
              animations: [...(el.animations || []), newAnim],
            };
          }),
        }));
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('updateElement', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 从元素移除动画
    removeAnimation: (elementId, animationId) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = state.currentCard.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) => {
            if (el.id !== elementId) return el;
            return {
              ...el,
              animations: (el.animations || []).filter((a) => a.id !== animationId),
            };
          }),
        }));
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('updateElement', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 更新动画配置
    updateAnimation: (elementId, animationId, updates) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = state.currentCard.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) => {
            if (el.id !== elementId) return el;
            return {
              ...el,
              animations: (el.animations || []).map((a) =>
                a.id === animationId ? { ...a, ...updates } : a
              ),
            };
          }),
        }));
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('updateElement', prevState, nextState);
        return { currentCard: nextState };
      }),
    // 重新排序动画
    reorderAnimations: (elementId, startIndex, endIndex) =>
      set((state) => {
        const prevState = { ...state.currentCard };
        const newPages = state.currentCard.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) => {
            if (el.id !== elementId) return el;
            const animations = [...(el.animations || [])];
            if (startIndex < 0 || startIndex >= animations.length || endIndex < 0 || endIndex >= animations.length) {
              return el;
            }
            const [removed] = animations.splice(startIndex, 1);
            animations.splice(endIndex, 0, removed);
            return { ...el, animations };
          }),
        }));
        const nextState = { ...state.currentCard, pages: newPages };
        saveHistory('reorderPages', prevState, nextState);
        return { currentCard: nextState };
      }),
    toggleAnimationExpanded: (id) =>
      set((state) => ({
        animationExpanded: {
          ...state.animationExpanded,
          [id]: !state.animationExpanded[id],
        },
      })),
    // 撤销
    undo: () =>
      set((state) => {
        if (state.historyIndex < 0) return state;
        const entry = state.history[state.historyIndex];
        return {
          currentCard: { ...entry.prevState },
          historyIndex: state.historyIndex - 1,
        };
      }),
    // 重做
    redo: () =>
      set((state) => {
        if (state.historyIndex >= state.history.length - 1) return state;
        const entry = state.history[state.historyIndex + 1];
        return {
          currentCard: { ...entry.nextState },
          historyIndex: state.historyIndex + 1,
        };
      }),
    // 是否可以撤销
    canUndo: () => {
      const state = get();
      return state.historyIndex >= 0;
    },
    // 是否可以重做
    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },
    selectElement: (id) => set({ selectedElementId: id }),
    setPreviewMode: (mode) => set({ isPreviewMode: mode }),
    clearEditor: () =>
      set({
        currentCard: {
          title: '',
          templateId: '',
          pages: [createBlankPage(1)],
          currentPageIndex: 0,
          backgroundMusicLoop: true,
        },
        selectedElementId: null,
        isPreviewMode: false,
        history: [],
        historyIndex: -1,
      }),
    clearSelectedFlags: () =>
      set((state) => {
        const currentPage = state.currentCard.pages[state.currentCard.currentPageIndex];
        if (!currentPage) return state;
        const hasSelected = currentPage.elements.some((el) => el.selected);
        if (!hasSelected) return state;
        const newPages = state.currentCard.pages.map((p, idx) =>
          idx === state.currentCard.currentPageIndex
            ? { ...p, elements: p.elements.map((el) => ({ ...el, selected: false })) }
            : p
        );
        return { currentCard: { ...state.currentCard, pages: newPages } };
      }),
  };
});

export const useTemplatesStore = create<TemplatesState>((set) => ({
  templates: [],
  categories: ['全部'],
  occasions: ['全部'],
  styles: ['全部'],
  selectedCategory: '全部',
  selectedOccasion: '全部',
  selectedStyle: '全部',
  loading: false,
  setTemplates: (templates) => set({ templates }),
  setCategories: (categories) => set({ categories: ['全部', ...categories] }),
  setOccasions: (occasions) => set({ occasions: ['全部', ...occasions] }),
  setStyles: (styles) => set({ styles: ['全部', ...styles] }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedOccasion: (occasion) => set({ selectedOccasion: occasion }),
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  setLoading: (loading) => set({ loading }),
}));

export const useUserStore = create<UserState>((set) => ({
  user: null,
  designs: [],
  favorites: [],
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setDesigns: (designs) => set({ designs }),
  setFavorites: (favorites) => set({ favorites }),
  setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
  addDesign: (design) =>
    set((state) => ({
      designs: [design, ...state.designs],
    })),
  removeDesign: (id) =>
    set((state) => ({
      designs: state.designs.filter((d) => d.id !== id),
    })),
  updateDesign: (design) =>
    set((state) => ({
      designs: state.designs.map((d) => (d.id === design.id ? design : d)),
    })),
  addFavorite: (template) =>
    set((state) => ({
      favorites: [template, ...state.favorites],
    })),
  removeFavorite: (templateId) =>
    set((state) => ({
      favorites: state.favorites.filter((f) => f.id !== templateId),
    })),
}));
