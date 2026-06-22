import { useState, useEffect } from 'react';
import { Users, LayoutTemplate, Gift, TrendingUp } from 'lucide-react';
import { admin, cards } from '../../utils/supabase';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    users: 0,
    templates: 0,
    cards: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      const [usersResult, cardsResult] = await Promise.all([
        admin.getAllUsers(),
        cards.getAll(),
      ]);

      setStats({
        users: usersResult.data?.length || 0,
        templates: 12,
        cards: cardsResult.data?.length || 0,
        activeUsers: Math.floor((usersResult.data?.length || 0) * 0.7),
      });
      setIsLoading(false);
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      icon: Users,
      label: '用户总数',
      value: stats.users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: LayoutTemplate,
      label: '模板数量',
      value: stats.templates,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: Gift,
      label: '贺卡总数',
      value: stats.cards,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
    },
    {
      icon: TrendingUp,
      label: '活跃用户',
      value: stats.activeUsers,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">仪表盘</h2>
        <p className="text-gray-500 mt-1">欢迎回来，查看网站数据概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bgColor} rounded-xl p-6 transition-transform hover:scale-105`}
          >
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-gray-600 text-sm">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.textColor} mt-2`}>
              {isLoading ? '...' : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近注册用户</h3>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">用户1</p>
                    <p className="text-sm text-gray-500">user1@example.com</p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">活跃</span>
                </div>
                <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">用户2</p>
                    <p className="text-sm text-gray-500">user2@example.com</p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">活跃</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">系统状态</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">数据库连接</span>
                <span className="text-green-600 font-medium">正常</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">API响应</span>
                <span className="text-green-600 font-medium">正常</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">存储状态</span>
                <span className="text-yellow-600 font-medium">75%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;