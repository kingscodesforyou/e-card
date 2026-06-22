import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Users, LayoutTemplate, Gift, LogOut, Menu, X, BarChart3, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const menuItems = [
    { icon: BarChart3, label: '仪表盘', path: '/admin' },
    { icon: Users, label: '用户管理', path: '/admin/users' },
    { icon: LayoutTemplate, label: '模板管理', path: '/admin/templates' },
    { icon: Gift, label: '贺卡管理', path: '/admin/cards' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <aside
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && <span className="font-bold text-lg">后台管理</span>}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <item.icon className="w-5 h-5 text-gray-400" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <Link
            to="/"
            className="block w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            {sidebarOpen && <span>返回前台</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors mt-2"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">后台管理系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0) || user?.email?.charAt(0)}
              </span>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;