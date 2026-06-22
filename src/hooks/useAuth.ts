import { useEffect } from 'react';
import { auth, cards, favorites } from '../utils/supabase';
import { useUserStore } from '../store';

export const useAuth = () => {
  const { setUser, setIsAuthenticated, setDesigns, setFavorites, user, isAuthenticated } = useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      const { user: currentUser, error } = await auth.getUser();
      
      // 如果 Supabase 没有用户，但有本地 token，尝试从本地API获取用户信息
      if ((!currentUser || error) && localStorage.getItem('token')) {
        try {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
          const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          
          if (response.ok) {
            const localUser = await response.json();
            setUser({
              id: localUser.id,
              email: localUser.email || '',
              name: localUser.name || '',
              created_at: localUser.created_at || '',
              is_admin: localUser.is_admin || false,
              is_email_verified: localUser.is_email_verified || false,
            });
            setIsAuthenticated(true);
            await fetchUserData(localUser.id);
            return;
          }
        } catch (localError) {
          console.error('Failed to get user from local API:', localError);
        }
      }

      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email || '',
          name: currentUser.user_metadata?.name || '',
          created_at: currentUser.created_at || '',
          is_admin: currentUser.user_metadata?.is_admin || false,
          is_email_verified: currentUser.email_confirmed_at ? true : false,
        });
        setIsAuthenticated(true);
        
        await fetchUserData(currentUser.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setDesigns([]);
        setFavorites([]);
      }
    };

    const fetchUserData = async (userId: string) => {
      const [designsResult, favoritesResult] = await Promise.all([
        cards.getAll(userId),
        favorites.getByUser(userId),
      ]);

      if (!designsResult.error) {
        setDesigns(designsResult.data || []);
      }
      if (!favoritesResult.error) {
        setFavorites(favoritesResult.data || []);
      }
    };

    fetchUser();

    // Supabase 认证状态监听
    const { data: subscription } = auth.getSession().then ? 
      { data: null } : { data: null };

    // 不再使用 onAuthStateChange，简化为手动检查
    return () => {
      // 清理
    };
  }, [setUser, setIsAuthenticated, setDesigns, setFavorites]);

  const signIn = async (email: string, password: string) => {
    const { user: authUser, error } = await auth.signIn(email, password);
    if (error) {
      return { success: false, error: typeof error === 'string' ? error : error.message };
    }
    if (authUser) {
      // 检查邮箱是否已验证（如果有邮箱）
      if (authUser.email && !authUser.email_confirmed_at) {
        setUser(null);
        setIsAuthenticated(false);
        return { 
          success: false, 
          error: '请先验证您的邮箱，点击登录按钮重发验证邮件。' ,
          needsEmailVerification: true
        };
      }
      
      // Supabase 返回的用户对象可能包含 phone 字段
      const userData = authUser as any;
      const isAdmin = authUser.user_metadata?.is_admin || false;
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        phone: userData.phone || '',
        name: authUser.user_metadata?.name || '',
        created_at: authUser.created_at || '',
        is_admin: isAdmin,
        is_email_verified: authUser.email_confirmed_at ? true : false,
      });
      setIsAuthenticated(true);
      
      await fetchUserData(authUser.id);
      return { success: true, isAdmin };
    }
    
    return { success: false, error: '登录失败' };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { user: newUser, error } = await auth.signUp(email, password, { name });
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (newUser) {
      // 检查是否需要邮箱验证
      if (!newUser.email_confirmed_at) {
        return { 
          success: true, 
          needsEmailVerification: true,
          message: '注册成功！请查收验证邮件完成注册。'
        };
      }
      
      setUser({
        id: newUser.id,
        email: newUser.email || '',
        name: newUser.user_metadata?.name || '',
        created_at: newUser.created_at || '',
        is_admin: newUser.user_metadata?.is_admin || false,
        is_email_verified: newUser.email_confirmed_at ? true : false,
      });
      setIsAuthenticated(true);
      return { success: true };
    }
    
    return { success: true, needsEmailVerification: true };
  };

  const signOut = async () => {
    // 先清理本地状态，确保即使 Supabase signOut 失败也能正确退出
    setUser(null);
    setIsAuthenticated(false);
    setDesigns([]);
    setFavorites([]);
    localStorage.removeItem('token');

    try {
      await auth.signOut();
    } catch (error) {
      console.error('Supabase signOut failed:', error);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await auth.resetPasswordForEmail(email);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  // 获取用户数据
  const fetchUserData = async (userId: string) => {
    const [designsResult, favoritesResult] = await Promise.all([
      cards.getAll(userId),
      favorites.getByUser(userId),
    ]);

    if (!designsResult.error) {
      setDesigns(designsResult.data || []);
    }
    if (!favoritesResult.error) {
      setFavorites(favoritesResult.data || []);
    }
  };

  // 判断是否为管理员
  const isAdmin = user?.is_admin || false;

  return {
    user,
    isAuthenticated,
    isAdmin,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshUser: fetchUserData,
  };
};
