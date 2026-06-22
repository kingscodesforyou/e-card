import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Search, Menu, X, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUserStore } from '../../store';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, signOut } = useAuth();
  const { user } = useUserStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/templates?search=${searchQuery}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              贺卡工坊
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
              首页
            </Link>
            <Link to="/templates" className="text-gray-700 hover:text-purple-600 transition-colors font-medium">
              模板库
            </Link>
            <Link to="/editor" className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
              开始制作
            </Link>
          </nav>

          <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索贺卡模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </form>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <Shield className="w-4 h-4" />
                    <span>管理后台</span>
                  </Link>
                )}
                <Link to="/user/profile" className="hidden sm:flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                  <User className="w-5 h-5" />
                  <span className="font-medium">{user?.name || user?.email}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出</span>
                </button>
                <Link to="/user/profile" className="sm:hidden">
                  <User className="w-6 h-6 text-gray-700" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="hidden sm:block text-gray-700 hover:text-purple-600 transition-colors font-medium">
                  登录
                </Link>
                <Link to="/auth/register" className="hidden sm:block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
                  注册
                </Link>
              </>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            <Link to="/" className="block py-2 text-gray-700 hover:text-purple-600">首页</Link>
            <Link to="/templates" className="block py-2 text-gray-700 hover:text-purple-600">模板库</Link>
            <Link to="/editor" className="block py-2 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">开始制作</Link>
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="block py-2 text-gray-700 hover:text-purple-600 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    管理后台
                  </Link>
                )}
                <Link to="/user/profile" className="block py-2 text-gray-700 hover:text-purple-600">个人中心</Link>
                <button onClick={handleSignOut} className="w-full py-2 text-left text-gray-700 hover:text-red-500">退出登录</button>
              </>
            ) : (
              <>
                <Link to="/auth/login" className="block py-2 text-gray-700 hover:text-purple-600">登录</Link>
                <Link to="/auth/register" className="block py-2 text-gray-700 hover:text-purple-600">注册</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;