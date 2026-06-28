import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Calendar, Heart, FileEdit, Trash2, Sparkles, Shield } from 'lucide-react';
import { useUserStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import { cards, favorites } from '../utils/supabase';
import { Card } from '../types';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, designs, favorites: userFavorites, removeDesign, setDesigns, removeFavorite } = useUserStore();
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'designs' | 'favorites'>('designs');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, navigate]);

  const handleEditDesign = (card: Card) => {
    navigate(`/editor?cardId=${card.id}`);
  };

  const handleDeleteDesign = async (cardId: string) => {
    setDeletingId(cardId);
    const { error } = await cards.delete(cardId);
    if (!error) {
      removeDesign(cardId);
    }
    setDeletingId(null);
  };

  const handleUseFavorite = (templateId: string) => {
    navigate(`/editor/${templateId}`);
  };

  const handleRemoveFavorite = async (templateId: string) => {
    if (!user) return;
    
    const { error } = await favorites.remove(user.id, templateId);
    if (!error) {
      removeFavorite(templateId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">请先登录</h3>
          <p className="text-gray-500">登录后可以查看您的个人中心</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{user.name || '用户'}</h1>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-sm text-gray-400 mt-1">加入于 {formatDate(user.created_at)}</p>
            </div>
            {isAdmin && (
              <Link to="/admin" className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>管理后台</span>
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('designs')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'designs' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileEdit className="w-4 h-4" />
              我的设计 ({designs.length})
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'favorites' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Heart className="w-4 h-4" />
              收藏模板 ({userFavorites.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'designs' && designs.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">还没有设计</h3>
                <p className="text-gray-500 mb-6">开始制作您的第一张贺卡吧</p>
                <button
                  onClick={() => navigate('/editor')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  开始制作
                </button>
              </div>
            )}

            {activeTab === 'designs' && designs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {designs.map((card) => (
                  <div
                    key={card.id}
                    className="bg-gray-50 rounded-xl p-4 flex flex-col"
                  >
                    <div className="aspect-[9/16] bg-white rounded-lg overflow-hidden shadow-sm mb-4 flex items-center justify-center">
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <FileEdit className="w-12 h-12 text-gray-300" />
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2 truncate">{card.title}</h3>
                    <p className="text-sm text-gray-400 mb-4 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(card.created_at)}
                    </p>
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleEditDesign(card)}
                        className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteDesign(card.id)}
                        disabled={deletingId === card.id}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'favorites' && userFavorites.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">还没有收藏</h3>
                <p className="text-gray-500 mb-6">浏览模板库，收藏您喜欢的模板</p>
                <button
                  onClick={() => navigate('/templates')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  浏览模板
                </button>
              </div>
            )}

            {activeTab === 'favorites' && userFavorites.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userFavorites.map((template) => (
                  <div
                    key={template.id}
                    className="bg-gray-50 rounded-xl overflow-hidden relative group"
                  >
                    {/* 收藏卡片右上角的爱心按钮 */}
                    <button
                      onClick={() => handleRemoveFavorite(template.id)}
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                      title="取消收藏"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                    
                    <div 
                      className="aspect-[9/16] overflow-hidden cursor-pointer"
                      onClick={() => handleUseFavorite(template.id)}
                    >
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2 truncate">{template.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">
                          {template.category}
                        </span>
                        <span className="px-2 py-0.5 bg-pink-50 text-pink-600 text-xs rounded-full">
                          {template.occasion}
                        </span>
                      </div>
                      <button
                        onClick={() => handleUseFavorite(template.id)}
                        className="w-full mt-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                      >
                        使用模板
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;