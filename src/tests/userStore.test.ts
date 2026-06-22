import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from '../store';

describe('User Store', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    created_at: '2024-01-01',
  };

  const mockTemplate = {
    id: 'template-1',
    name: 'Birthday Card',
    category: '生日',
    occasion: '生日',
    style: '简约',
    thumbnail_url: 'https://example.com/thumb.jpg',
    background_url: 'https://example.com/bg.jpg',
    default_elements: [],
    created_at: '2024-01-01',
  };

  const mockCard = {
    id: 'card-1',
    user_id: 'user-1',
    template_id: 'template-1',
    title: 'My Card',
    pages: [],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    useUserStore.setState({
      user: null,
      designs: [],
      favorites: [],
      isAuthenticated: false,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useUserStore.getState();
      expect(store.user).toBeNull();
      expect(store.designs).toEqual([]);
      expect(store.favorites).toEqual([]);
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('User Operations', () => {
    it('should set user', () => {
      useUserStore.getState().setUser(mockUser);
      
      const state = useUserStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.user?.email).toBe('test@example.com');
    });

    it('should set user to null', () => {
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().setUser(null);
      
      const state = useUserStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe('Authentication', () => {
    it('should set isAuthenticated to true', () => {
      useUserStore.getState().setIsAuthenticated(true);
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false', () => {
      useUserStore.getState().setIsAuthenticated(true);
      useUserStore.getState().setIsAuthenticated(false);
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Design Operations', () => {
    it('should set designs', () => {
      useUserStore.getState().setDesigns([mockCard]);
      
      const state = useUserStore.getState();
      expect(state.designs).toHaveLength(1);
      expect(state.designs[0].title).toBe('My Card');
    });

    it('should add a design to the beginning', () => {
      useUserStore.getState().setDesigns([mockCard]);
      const newCard = { ...mockCard, id: 'card-2', title: 'New Card' };
      useUserStore.getState().addDesign(newCard);
      
      const state = useUserStore.getState();
      expect(state.designs).toHaveLength(2);
      expect(state.designs[0].title).toBe('New Card');
    });

    it('should remove a design', () => {
      useUserStore.getState().setDesigns([mockCard]);
      useUserStore.getState().removeDesign('card-1');
      
      const state = useUserStore.getState();
      expect(state.designs).toHaveLength(0);
    });

    it('should update a design', () => {
      useUserStore.getState().setDesigns([mockCard]);
      const updatedCard = { ...mockCard, title: 'Updated Card' };
      useUserStore.getState().updateDesign(updatedCard);
      
      const state = useUserStore.getState();
      expect(state.designs[0].title).toBe('Updated Card');
    });

    it('should not fail when removing non-existent design', () => {
      useUserStore.getState().setDesigns([mockCard]);
      useUserStore.getState().removeDesign('non-existent');
      
      const state = useUserStore.getState();
      expect(state.designs).toHaveLength(1);
    });

    it('should not fail when updating non-existent design', () => {
      useUserStore.getState().setDesigns([mockCard]);
      const nonExistentCard = { ...mockCard, id: 'non-existent' };
      useUserStore.getState().updateDesign(nonExistentCard);
      
      const state = useUserStore.getState();
      expect(state.designs).toHaveLength(1);
    });
  });

  describe('Favorite Operations', () => {
    it('should set favorites', () => {
      useUserStore.getState().setFavorites([mockTemplate]);
      
      const state = useUserStore.getState();
      expect(state.favorites).toHaveLength(1);
      expect(state.favorites[0].name).toBe('Birthday Card');
    });

    it('should add a favorite to the beginning', () => {
      useUserStore.getState().setFavorites([mockTemplate]);
      const newTemplate = { ...mockTemplate, id: 'template-2', name: 'New Template' };
      useUserStore.getState().addFavorite(newTemplate);
      
      const state = useUserStore.getState();
      expect(state.favorites).toHaveLength(2);
      expect(state.favorites[0].name).toBe('New Template');
    });

    it('should remove a favorite', () => {
      useUserStore.getState().setFavorites([mockTemplate]);
      useUserStore.getState().removeFavorite('template-1');
      
      const state = useUserStore.getState();
      expect(state.favorites).toHaveLength(0);
    });

    it('should not fail when removing non-existent favorite', () => {
      useUserStore.getState().setFavorites([mockTemplate]);
      useUserStore.getState().removeFavorite('non-existent');
      
      const state = useUserStore.getState();
      expect(state.favorites).toHaveLength(1);
    });
  });

  describe('Combined Operations', () => {
    it('should handle user login flow', () => {
      useUserStore.getState().setIsAuthenticated(true);
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().setDesigns([mockCard]);
      useUserStore.getState().setFavorites([mockTemplate]);
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.designs).toHaveLength(1);
      expect(state.favorites).toHaveLength(1);
    });

    it('should handle user logout flow', () => {
      useUserStore.getState().setIsAuthenticated(true);
      useUserStore.getState().setUser(mockUser);
      useUserStore.getState().setDesigns([mockCard]);
      useUserStore.getState().setFavorites([mockTemplate]);
      
      useUserStore.getState().setIsAuthenticated(false);
      useUserStore.getState().setUser(null);
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.designs).toHaveLength(1);
      expect(state.favorites).toHaveLength(1);
    });
  });
});
