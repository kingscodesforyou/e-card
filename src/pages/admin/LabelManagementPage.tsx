import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, AlertCircle, Tag } from 'lucide-react';
import { labelManagement, LabelItem } from '../../utils/supabase';

type LabelType = 'categories' | 'occasions' | 'styles';

const TAB_CONFIG: { key: LabelType; label: string }[] = [
  { key: 'categories', label: '分类' },
  { key: 'occasions', label: '场合' },
  { key: 'styles', label: '风格' },
];

const LabelManagementPage = () => {
  const [activeTab, setActiveTab] = useState<LabelType>('categories');
  const [items, setItems] = useState<LabelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LabelItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formAvailab, setFormAvailab] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error: err } = await labelManagement.getAll(activeTab);
    if (data) {
      setItems(data);
    } else if (err) {
      setError(err.message || '获取数据失败');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormSortOrder(items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 1);
    setFormAvailab(true);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (item: LabelItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormSortOrder(item.sort_order);
    setFormAvailab(item.availab);
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setError('名称不能为空');
      return;
    }

    if (editingItem) {
      const { error: err } = await labelManagement.update(activeTab, editingItem.id, {
        name: formName.trim(),
        sort_order: formSortOrder,
        availab: formAvailab,
      });
      if (err) {
        setError(err.message);
        return;
      }
    } else {
      const { error: err } = await labelManagement.create(activeTab, {
        name: formName.trim(),
        sort_order: formSortOrder,
        availab: formAvailab,
      });
      if (err) {
        setError(err.message);
        return;
      }
    }

    setShowModal(false);
    fetchItems();
  };

  const handleDelete = async (item: LabelItem) => {
    if (!confirm(`确定要删除「${item.name}」吗？`)) return;

    const { error: err } = await labelManagement.remove(activeTab, item.id);
    if (err) {
      setError(err.message);
      return;
    }
    fetchItems();
  };

  const handleToggleAvailab = async (item: LabelItem) => {
    const { error: err } = await labelManagement.update(activeTab, item.id, {
      availab: !item.availab,
    });
    if (err) {
      setError(err.message);
      return;
    }
    fetchItems();
  };

  const getTabLabel = (key: LabelType) => TAB_CONFIG.find(t => t.key === key)!.label;

  return (
    <div>
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">标签管理</h1>
          <p className="text-gray-500 mt-1">管理模板的分类、场合和风格标签</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增{getTabLabel(activeTab)}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 标签页切换 */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">名称</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">排序</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">可用性</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Tag className="w-8 h-8" />
                    <p>暂无{getTabLabel(activeTab)}标签</p>
                    <button onClick={openAddModal} className="text-purple-600 hover:text-purple-700 text-sm">
                      新增一个
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.sort_order}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleAvailab(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        item.availab
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.availab ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {item.availab ? '可用' : '已禁用'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 新增 / 编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? `编辑${getTabLabel(activeTab)}` : `新增${getTabLabel(activeTab)}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={`请输入${getTabLabel(activeTab)}名称`}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
                <input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">可用性</label>
                <button
                  onClick={() => setFormAvailab(!formAvailab)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formAvailab ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formAvailab ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-500">{formAvailab ? '可用' : '已禁用'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                {editingItem ? '保存' : '新增'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelManagementPage;
