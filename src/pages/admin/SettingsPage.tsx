import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, CheckCircle, AlertCircle, Edit3, X } from 'lucide-react';
import { admin } from '../../utils/supabase';

interface SystemConfig {
  key: string;
  value: any;
  type: string;
  description: string;
  group_name: string;
  created_at?: string;
  updated_at?: string;
}

const typeLabels: Record<string, string> = {
  integer: '整数',
  string: '字符串',
  boolean: '布尔值',
  json: 'JSON',
  float: '浮点数',
};

const SettingsPage = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const result = await admin.getConfigs();
      if (result.data) {
        setConfigs(result.data);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: '获取配置列表失败: ' + (error.message || '未知错误') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (config: SystemConfig) => {
    setEditingKey(config.key);
    setEditValue(String(config.value));
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
    setMessage(null);
  };

  const handleSave = async (config: SystemConfig) => {
    setSavingKey(config.key);
    setMessage(null);

    try {
      // 根据类型进行基本验证
      if (config.type === 'integer' || config.type === 'int') {
        const num = parseInt(editValue, 10);
        if (isNaN(num) || num < 1) {
          setMessage({ type: 'error', text: '请输入有效的正整数' });
          setSavingKey(null);
          return;
        }
      }

      const result = await admin.updateConfig(config.key, {
        value: editValue,
      });

      if (result.data?.success) {
        setMessage({ type: 'success', text: `配置 "${config.key}" 已更新，修改已实时生效` });
        setEditingKey(null);
        // 刷新配置列表
        fetchConfigs();
      } else {
        setMessage({ type: 'error', text: result.error?.message || '更新失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: '更新配置失败: ' + (error.message || '未知错误') });
    } finally {
      setSavingKey(null);
    }
  };

  // 按分组归类
  const groupedConfigs = configs.reduce<Record<string, SystemConfig[]>>((acc, config) => {
    const group = config.group_name || 'general';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(config);
    return acc;
  }, {});

  const groupLabels: Record<string, string> = {
    ai: 'AI 服务',
    system: '系统设置',
    security: '安全设置',
    email: '邮件服务',
    general: '通用',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">系统设置</h2>
          <p className="text-gray-500 mt-1">管理系统运行参数，修改后实时生效</p>
        </div>
        <button
          onClick={fetchConfigs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 提示消息 */}
      {message && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">加载配置中...</span>
          </div>
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无系统配置</p>
        </div>
      ) : (
        // 按分组展示配置
        Object.entries(groupedConfigs).map(([group, groupConfigs]) => (
          <div key={group} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {groupLabels[group] || group}
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {groupConfigs.map((config) => (
                <div key={config.key} className="px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-6">
                      {/* 配置键和描述 */}
                      <div className="flex items-center gap-3 mb-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {config.key}
                        </code>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          {typeLabels[config.type] || config.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{config.description || '无描述'}</p>

                      {/* 编辑区域 */}
                      {editingKey === config.key ? (
                        <div className="mt-3 flex items-start gap-3">
                          <input
                            type={config.type === 'integer' ? 'number' : 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                            placeholder="输入新值"
                            min={config.type === 'integer' ? 1 : undefined}
                          />
                          <button
                            onClick={() => handleSave(config)}
                            disabled={savingKey === config.key}
                            className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
                          >
                            {savingKey === config.key ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        /* 当前值展示 */
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-lg font-semibold text-gray-900">
                            {config.type === 'boolean'
                              ? config.value
                                ? 'true'
                                : 'false'
                              : String(config.value)}
                          </span>
                          {config.key === 'model_api_rate_limit' && (
                            <span className="text-sm text-gray-400">次/分钟</span>
                          )}
                          {/* 最后更新时间 */}
                          {config.updated_at && (
                            <span className="text-xs text-gray-400">
                              最后更新: {new Date(config.updated_at).toLocaleString('zh-CN')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 编辑按钮 */}
                    {editingKey !== config.key && (
                      <button
                        onClick={() => handleEdit(config)}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        编辑
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 使用说明</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>修改配置后无需重启服务，修改会实时生效</li>
          <li>限流值单位为"次/分钟"(rpm)，建议设置在 1-100 之间</li>
          <li>当 API 调用超出限制时，系统会返回 429 状态码</li>
          <li>配置读取失败时会自动使用默认值，确保系统可用性</li>
          <li>系统会定期清理过期的限流记录，防止内存泄漏</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPage;
