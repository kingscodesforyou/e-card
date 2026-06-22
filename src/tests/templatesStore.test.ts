import { describe, it, expect, beforeEach } from 'vitest';
import { useTemplatesStore } from '../store';

describe('Templates Store', () => {
  beforeEach(() => {
    useTemplatesStore.setState({
      templates: [],
      categories: ['全部'],
      occasions: ['全部'],
      styles: ['全部'],
      selectedCategory: '全部',
      selectedOccasion: '全部',
      selectedStyle: '全部',
      loading: false,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useTemplatesStore.getState();
      expect(store.templates).toEqual([]);
      expect(store.categories).toEqual(['全部']);
      expect(store.selectedCategory).toBe('全部');
      expect(store.loading).toBe(false);
    });
  });

  describe('Template Operations', () => {
    it('should set templates', () => {
      const mockTemplates = [
        { id: '1', name: 'Template 1', category: '生日', occasion: '生日', style: '简约', thumbnail_url: '', background_url: '', default_elements: [], created_at: '' },
        { id: '2', name: 'Template 2', category: '节日', occasion: '新年', style: '华丽', thumbnail_url: '', background_url: '', default_elements: [], created_at: '' },
      ];
      
      useTemplatesStore.getState().setTemplates(mockTemplates);
      
      const state = useTemplatesStore.getState();
      expect(state.templates).toEqual(mockTemplates);
      expect(state.templates.length).toBe(2);
    });
  });

  describe('Category Operations', () => {
    it('should set categories with "全部" prefix', () => {
      useTemplatesStore.getState().setCategories(['生日', '节日', '婚礼']);
      
      const state = useTemplatesStore.getState();
      expect(state.categories).toEqual(['全部', '生日', '节日', '婚礼']);
    });

    it('should set selected category', () => {
      useTemplatesStore.getState().setCategories(['生日', '节日']);
      useTemplatesStore.getState().setSelectedCategory('生日');
      
      const state = useTemplatesStore.getState();
      expect(state.selectedCategory).toBe('生日');
    });
  });

  describe('Occasion Operations', () => {
    it('should set occasions with "全部" prefix', () => {
      useTemplatesStore.getState().setOccasions(['新年', '春节', '情人节']);
      
      const state = useTemplatesStore.getState();
      expect(state.occasions).toEqual(['全部', '新年', '春节', '情人节']);
    });

    it('should set selected occasion', () => {
      useTemplatesStore.getState().setOccasions(['新年', '春节']);
      useTemplatesStore.getState().setSelectedOccasion('新年');
      
      const state = useTemplatesStore.getState();
      expect(state.selectedOccasion).toBe('新年');
    });
  });

  describe('Style Operations', () => {
    it('should set styles with "全部" prefix', () => {
      useTemplatesStore.getState().setStyles(['简约', '华丽', '卡通']);
      
      const state = useTemplatesStore.getState();
      expect(state.styles).toEqual(['全部', '简约', '华丽', '卡通']);
    });

    it('should set selected style', () => {
      useTemplatesStore.getState().setStyles(['简约', '华丽']);
      useTemplatesStore.getState().setSelectedStyle('简约');
      
      const state = useTemplatesStore.getState();
      expect(state.selectedStyle).toBe('简约');
    });
  });

  describe('Loading State', () => {
    it('should set loading to true', () => {
      useTemplatesStore.getState().setLoading(true);
      
      const state = useTemplatesStore.getState();
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      useTemplatesStore.getState().setLoading(true);
      useTemplatesStore.getState().setLoading(false);
      
      const state = useTemplatesStore.getState();
      expect(state.loading).toBe(false);
    });
  });

  describe('Combined Operations', () => {
    it('should handle multiple filter selections', () => {
      useTemplatesStore.getState().setCategories(['生日', '节日']);
      useTemplatesStore.getState().setSelectedCategory('生日');
      useTemplatesStore.getState().setOccasions(['新年', '生日']);
      useTemplatesStore.getState().setSelectedOccasion('新年');
      useTemplatesStore.getState().setStyles(['简约', '华丽']);
      useTemplatesStore.getState().setSelectedStyle('简约');
      useTemplatesStore.getState().setLoading(true);
      
      const state = useTemplatesStore.getState();
      expect(state.selectedCategory).toBe('生日');
      expect(state.selectedOccasion).toBe('新年');
      expect(state.selectedStyle).toBe('简约');
      expect(state.loading).toBe(true);
    });
  });
});
