import { createClient } from '@supabase/supabase-js';
import { mockTemplates } from '../data/mockTemplates';
import { Template, Card } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// 本地 API 配置（用于数据存储）
const useLocalApi = import.meta.env.VITE_USE_LOCAL_API === 'true';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// 是否使用 mock 数据
const isMockMode = !useLocalApi && import.meta.env.VITE_USE_MOCK === 'true';

// 创建 Supabase 客户端（用于认证）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Local API helper（用于数据存储）
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${apiBaseUrl}${endpoint}`;
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    ...options,
    headers,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

let mockCards: Card[] = [];
let currentMockUser: any = null;

// =====================================================
// 认证相关 - 使用 Supabase
// =====================================================

export const auth = {
  // 邮箱登录 - 使用 Supabase + 本地API获取管理员状态
  signIn: async (email: string, password: string) => {
    if (isMockMode) {
      const adminEmail = 'admin@example.com';
      const isAdmin = email === adminEmail;
      const user = {
        id: isAdmin ? 'admin-id' : 'mock-user-id',
        email,
        user_metadata: {
          name: email.split('@')[0],
          is_admin: isAdmin,
        },
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
      };
      currentMockUser = user;
      return { user, session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user && useLocalApi) {
      try {
        // 先尝试同步用户到本地数据库（处理之前注册但未同步的用户）
        const syncResult = await apiRequest('/api/auth/sync-user', {
          method: 'POST',
          body: JSON.stringify({
            supabase_id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || email.split('@')[0],
            is_email_verified: !!data.user.email_confirmed_at,
          }),
        });

        // 使用同步API返回的用户信息（包含管理员状态和禁用状态）
        if (syncResult.user) {
          data.user.user_metadata = data.user.user_metadata || {};
          data.user.user_metadata.is_admin = syncResult.user.is_admin;
          
          // 保存 JWT token 到 localStorage
          if (syncResult.token) {
            localStorage.setItem('token', syncResult.token);
          }
          
          // 检查用户是否被禁用
          if (syncResult.user.is_disabled) {
            await supabase.auth.signOut();
            localStorage.removeItem('token');
            return { user: null, session: null, error: { message: '用户已被禁用', code: 'user_disabled' } };
          }
        }
      } catch (e: any) {
        // 静默处理连接错误，避免控制台污染
        if (e?.name !== 'TypeError' && !e?.message?.includes('fetch')) {
          console.error('Failed to sync local user data:', e);
        }
      }
      currentMockUser = data.user;
    }
    return { user: data.user, session: data.session, error };
  },

  // 注册 - 使用 Supabase + 同步到本地数据库
  signUp: async (email: string, password: string, options?: { name?: string; data?: object }) => {
    if (isMockMode) {
      const user = {
        id: 'mock-user-' + Date.now(),
        email,
        user_metadata: {
          name: options?.name || email.split('@')[0],
          is_admin: false,
        },
        created_at: new Date().toISOString(),
        email_confirmed_at: null,
      };
      currentMockUser = null;
      return { user, session: null, error: null, needsEmailVerification: true };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: options ? { data: { name: options.name } } : undefined,
    });

    // 注册成功后同步用户到本地数据库
    if (!error && data.user && useLocalApi) {
      try {
        await apiRequest('/api/auth/sync-user', {
          method: 'POST',
          body: JSON.stringify({
            supabase_id: data.user.id,
            email: data.user.email,
            name: options?.name || email.split('@')[0],
            is_email_verified: !!data.user.email_confirmed_at,
          }),
        });
      } catch (syncError) {
        console.error('同步用户到本地数据库失败:', syncError);
        // 不影响注册流程，只记录错误
      }
    }

    return { user: data.user, session: data.session, error };
  },

  // 退出登录 - 使用 Supabase
  signOut: async () => {
    if (isMockMode) {
      currentMockUser = null;
      return { error: null };
    }

    currentMockUser = null;
    return await supabase.auth.signOut();
  },

  // 获取当前用户 - 使用 Supabase + 本地API获取管理员状态
  getUser: async () => {
    if (isMockMode) {
      return { user: currentMockUser, error: null };
    }

    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user && useLocalApi) {
      try {
        const sessionResult = await supabase.auth.getSession();
        if (sessionResult.data.session) {
          const localUser = await apiRequest(`/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${sessionResult.data.session.access_token}`,
            },
          });
          if (localUser.user) {
            data.user.user_metadata = data.user.user_metadata || {};
            data.user.user_metadata.is_admin = localUser.user.is_admin;
          }
        }
      } catch (e: any) {
        // 静默处理未授权等预期错误，避免控制台污染
        // 只在非预期错误时才输出日志
        const isExpectedError = 
          !e || 
          e.name === 'TypeError' || 
          (e.message && (e.message.includes('fetch') || e.message.includes('API request failed')));
        if (!isExpectedError) {
          console.error('Failed to fetch local user data:', e);
        }
      }
    }
    return { user: data.user, error };
  },

  // 获取会话 - 使用 Supabase
  getSession: async () => {
    if (isMockMode) {
      return { data: { session: currentMockUser ? { access_token: 'mock-token' } : null }, error: null };
    }

    return await supabase.auth.getSession();
  },

  // 发送密码重置邮件 - 使用 Supabase
  resetPasswordForEmail: async (email: string) => {
    if (isMockMode) {
      return { error: null };
    }

    return await supabase.auth.resetPasswordForEmail(email);
  },

  // 更新密码 - 使用 Supabase
  updateUser: async (attributes: { password?: string }) => {
    if (isMockMode) {
      if (currentMockUser) {
        currentMockUser = { ...currentMockUser };
      }
      return { user: currentMockUser, error: null };
    }

    return await supabase.auth.updateUser(attributes);
  },

  // 验证邮箱（通过链接）- 使用 Supabase
  verifyEmail: async (token: string) => {
    if (isMockMode) {
      if (currentMockUser) {
        currentMockUser.email_confirmed_at = new Date().toISOString();
      }
      return { user: currentMockUser, error: null };
    }

    return { user: null, error: { message: '请通过邮件链接验证' } };
  },
};

// =====================================================
// 模板管理 - 使用本地 API / PostgreSQL
// =====================================================

export const templates = {
  getAll: async () => {
    if (isMockMode) {
      return { data: mockTemplates, error: null };
    }

    if (useLocalApi) {
      try {
        const data = await apiRequest('/api/templates');
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    // Fallback: 使用 mock 数据
    return { data: mockTemplates, error: null };
  },

  // 按分类筛选（在前端过滤）
  getByFilter: async (category?: string, occasion?: string, style?: string) => {
    const { data, error } = await templates.getAll();
    if (error || !data) {
      return { data: null, error };
    }

    let filtered = data;
    if (category && category !== '全部') {
      filtered = filtered.filter((t: any) => t.category === category);
    }
    if (occasion && occasion !== '全部') {
      filtered = filtered.filter((t: any) => t.occasion === occasion);
    }
    if (style && style !== '全部') {
      filtered = filtered.filter((t: any) => t.style === style);
    }

    return { data: filtered, error: null };
  },

  getById: async (id: string) => {
    if (isMockMode) {
      const template = mockTemplates.find(t => t.id === id);
      return { data: template || null, error: null };
    }

    if (useLocalApi) {
      try {
        const data = await apiRequest(`/api/templates/${id}`);
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    const template = mockTemplates.find(t => t.id === id);
    return { data: template || null, error: null };
  },

  create: async (template: Partial<Template>) => {
    if (isMockMode) {
      const newTemplate = { ...template, id: 'template-' + Date.now(), created_at: new Date().toISOString() } as Template;
      mockTemplates.push(newTemplate);
      return { data: newTemplate, error: null };
    }

    if (useLocalApi) {
      try {
        const data = await apiRequest('/api/templates', {
          method: 'POST',
          body: JSON.stringify(template),
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    const newTemplate = { ...template, id: 'template-' + Date.now() } as Template;
    mockTemplates.push(newTemplate);
    return { data: newTemplate, error: null };
  },

  update: async (id: string, updates: Partial<Template>) => {
    if (isMockMode) {
      const index = mockTemplates.findIndex(t => t.id === id);
      if (index >= 0) {
        mockTemplates[index] = { ...mockTemplates[index], ...updates };
        return { data: mockTemplates[index], error: null };
      }
      return { data: null, error: { message: 'Template not found' } };
    }

    if (useLocalApi) {
      try {
        const data = await apiRequest(`/api/templates/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    const index = mockTemplates.findIndex(t => t.id === id);
    if (index >= 0) {
      mockTemplates[index] = { ...mockTemplates[index], ...updates };
      return { data: mockTemplates[index], error: null };
    }
    return { data: null, error: { message: 'Template not found' } };
  },

  delete: async (id: string) => {
    if (isMockMode) {
      const index = mockTemplates.findIndex(t => t.id === id);
      if (index >= 0) {
        mockTemplates.splice(index, 1);
        return { error: null };
      }
      return { error: { message: 'Template not found' } };
    }

    if (useLocalApi) {
      try {
        await apiRequest(`/api/templates/${id}`, { method: 'DELETE' });
        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    }

    const index = mockTemplates.findIndex(t => t.id === id);
    if (index >= 0) {
      mockTemplates.splice(index, 1);
      return { error: null };
    }
    return { error: { message: 'Template not found' } };
  },
};

// =====================================================
// 贺卡管理 - 使用本地 API / PostgreSQL
// =====================================================

export const cards = {
  getAll: async (userId?: string) => {
    if (isMockMode) {
      const userCards = userId ? mockCards.filter(c => c.user_id === userId) : mockCards;
      return { data: userCards, error: null };
    }

    if (useLocalApi) {
      try {
        const endpoint = userId ? `/api/cards?user_id=${userId}` : '/api/cards';
        const data = await apiRequest(endpoint);
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    return { data: mockCards, error: null };
  },

  getById: async (id: string) => {
    if (isMockMode) {
      const card = mockCards.find(c => c.id === id);
      return { data: card || null, error: null };
    }

    if (useLocalApi) {
      try {
        const data = await apiRequest(`/api/cards/${id}`);
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    const card = mockCards.find(c => c.id === id);
    return { data: card || null, error: null };
  },

  create: async (card: Partial<Card> & { user_id: string }) => {
    if (isMockMode) {
      const newCard = {
        ...card,
        id: 'card-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Card;
      mockCards.push(newCard);
      return { data: newCard, error: null };
    }

    if (useLocalApi) {
      try {
        const data = await apiRequest('/api/cards', {
          method: 'POST',
          body: JSON.stringify(card),
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    const newCard = {
      ...card,
      id: 'card-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Card;
    mockCards.push(newCard);
    return { data: newCard, error: null };
  },

  update: async (id: string, updates: Partial<Card>) => {
    if (isMockMode) {
      const index = mockCards.findIndex(c => c.id === id);
      if (index >= 0) {
        mockCards[index] = { ...mockCards[index], ...updates, updated_at: new Date().toISOString() };
        return { data: mockCards[index], error: null };
      }
      return { data: null, error: { message: 'Card not found' } };
    }

    if (useLocalApi) {
      try {
        const data = await apiRequest(`/api/cards/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    const index = mockCards.findIndex(c => c.id === id);
    if (index >= 0) {
      mockCards[index] = { ...mockCards[index], ...updates, updated_at: new Date().toISOString() };
      return { data: mockCards[index], error: null };
    }
    return { data: null, error: { message: 'Card not found' } };
  },

  delete: async (id: string) => {
    if (isMockMode) {
      const index = mockCards.findIndex(c => c.id === id);
      if (index >= 0) {
        mockCards.splice(index, 1);
        return { error: null };
      }
      return { error: { message: 'Card not found' } };
    }

    if (useLocalApi) {
      try {
        await apiRequest(`/api/cards/${id}`, { method: 'DELETE' });
        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    }

    const index = mockCards.findIndex(c => c.id === id);
    if (index >= 0) {
      mockCards.splice(index, 1);
      return { error: null };
    }
    return { error: { message: 'Card not found' } };
  },
};

// =====================================================
// 收藏管理 - 使用本地 API / PostgreSQL
// =====================================================

export const favorites = {
  getByUser: async (userId: string) => {
    if (isMockMode) {
      return { data: [], error: null };
    }

    if (useLocalApi) {
      try {
        const data = await apiRequest(`/api/favorites?user_id=${userId}`);
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    return { data: [], error: null };
  },

  add: async (userId: string, templateId: string) => {
    if (isMockMode) {
      return { data: { user_id: userId, template_id: templateId }, error: null };
    }

    if (useLocalApi) {
      try {
        const data = await apiRequest('/api/favorites', {
          method: 'POST',
          body: JSON.stringify({ user_id: userId, template_id: templateId }),
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    return { data: { user_id: userId, template_id: templateId }, error: null };
  },

  remove: async (userId: string, templateId: string) => {
    if (isMockMode) {
      return { error: null };
    }

    if (useLocalApi) {
      try {
        await apiRequest(`/api/favorites?user_id=${userId}&template_id=${templateId}`, { method: 'DELETE' });
        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    }

    return { error: null };
  },
};

// =====================================================
// 管理员 API - 使用本地 API / PostgreSQL
// =====================================================

export const admin = {
  getAllUsers: async () => {
    if (isMockMode) {
      return { data: [], error: null };
    }

    if (useLocalApi) {
      try {
        const token = localStorage.getItem('token');
        const data = await apiRequest('/api/admin/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    return { data: [], error: null };
  },

  updateUser: async (userId: string, updates: { is_admin?: boolean; is_disabled?: boolean; name?: string }) => {
    if (isMockMode) {
      return { data: { id: userId, ...updates }, error: null };
    }

    if (useLocalApi) {
      try {
        const token = localStorage.getItem('token');
        const data = await apiRequest(`/api/admin/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // 禁用操作只在本地数据库进行，登录时会检查本地数据库的禁用状态

        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    return { data: { id: userId, ...updates }, error: null };
  },

  deleteUser: async (userId: string) => {
    if (isMockMode) {
      return { error: null };
    }

    if (useLocalApi) {
      try {
        const token = localStorage.getItem('token');
        await apiRequest(`/api/admin/users/${userId}`, { 
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        // 同步删除到 Supabase
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (supabaseError) {
          console.error('同步删除用户到 Supabase 失败:', supabaseError);
        }

        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    }

    return { error: null };
  },

  getStats: async () => {
    if (isMockMode) {
      return { data: { users: 0, templates: 12, cards: 0 }, error: null };
    }

    if (useLocalApi) {
      try {
        const token = localStorage.getItem('token');
        const data = await apiRequest('/api/admin/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    return { data: { users: 0, templates: 12, cards: 0 }, error: null };
  },

  createTemplate: async (template: Partial<Template>) => {
    if (isMockMode) {
      const newTemplate = { ...template, id: 'template-' + Date.now() } as Template;
      mockTemplates.push(newTemplate);
      return { data: newTemplate, error: null };
    }

    if (useLocalApi) {
      try {
        const token = localStorage.getItem('token');
        const data = await apiRequest('/api/admin/templates', {
          method: 'POST',
          body: JSON.stringify(template),
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    const newTemplate = { ...template, id: 'template-' + Date.now() } as Template;
    mockTemplates.push(newTemplate);
    return { data: newTemplate, error: null };
  },

  updateTemplate: async (id: string, updates: Partial<Template>) => {
    if (isMockMode) {
      const index = mockTemplates.findIndex(t => t.id === id);
      if (index >= 0) {
        mockTemplates[index] = { ...mockTemplates[index], ...updates };
        return { data: mockTemplates[index], error: null };
      }
      return { data: null, error: { message: 'Template not found' } };
    }

    if (useLocalApi) {
      try {
        const token = localStorage.getItem('token');
        const data = await apiRequest(`/api/admin/templates/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return { data, error: null };
      } catch (error: any) {
        return { data: null, error: { message: error.message } };
      }
    }

    const index = mockTemplates.findIndex(t => t.id === id);
    if (index >= 0) {
      mockTemplates[index] = { ...mockTemplates[index], ...updates };
      return { data: mockTemplates[index], error: null };
    }
    return { data: null, error: { message: 'Template not found' } };
  },

  deleteTemplate: async (templateId: string) => {
    if (isMockMode) {
      const index = mockTemplates.findIndex(t => t.id === templateId);
      if (index >= 0) {
        mockTemplates.splice(index, 1);
        return { error: null };
      }
      return { error: { message: 'Template not found' } };
    }

    if (useLocalApi) {
      try {
        const token = localStorage.getItem('token');
        await apiRequest(`/api/admin/templates/${templateId}`, { 
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    }

    const index = mockTemplates.findIndex(t => t.id === templateId);
    if (index >= 0) {
      mockTemplates.splice(index, 1);
      return { error: null };
    }
    return { error: { message: 'Template not found' } };
  },

  deleteCard: async (cardId: string) => {
    if (isMockMode) {
      const index = mockCards.findIndex(c => c.id === cardId);
      if (index >= 0) {
        mockCards.splice(index, 1);
        return { error: null };
      }
      return { error: { message: 'Card not found' } };
    }

    if (useLocalApi) {
      try {
        const token = localStorage.getItem('token');
        await apiRequest(`/api/admin/cards/${cardId}`, { 
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return { error: null };
      } catch (error: any) {
        return { error: { message: error.message } };
      }
    }

    const index = mockCards.findIndex(c => c.id === cardId);
    if (index >= 0) {
      mockCards.splice(index, 1);
      return { error: null };
    }
    return { error: { message: 'Card not found' } };
  },
};

// =====================================================
// 短信验证码 - 需要配置本地 API 或 Supabase
// =====================================================

export const sms = {
  sendCode: async (phone: string) => {
    if (isMockMode) {
      return { success: true, message: '验证码已发送（Mock模式：123456）' };
    }

    // 使用 Supabase 的短信服务
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: 'sms',
        },
      });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: '验证码已发送' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  verifyCode: async (phone: string, code: string) => {
    if (isMockMode) {
      if (code === '123456') {
        return { success: true, message: '验证成功' };
      }
      return { success: false, message: '验证码错误' };
    }

    // 使用 Supabase 的 OTP 验证
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms',
      });
      if (error) {
        return { success: false, message: error.message };
      }
      return { success: true, message: '验证成功' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },
};
