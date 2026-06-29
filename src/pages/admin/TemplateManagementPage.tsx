import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, Image, X, Palette } from 'lucide-react';
import { admin, templates, templateLabels } from '../../utils/supabase';
import type { Template } from '../../types';
import AITemplateGenerator from '../../components/ai/AITemplateGenerator';

const TemplateManagementPage = () => {
  const navigate = useNavigate();
  const [templateList, setTemplateList] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: '',
    occasion: '',
    style: '',
    thumbnail_url: '',
    background_url: '',
  });
  const [error, setError] = useState('');

  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [occasionOptions, setOccasionOptions] = useState<string[]>([]);
  const [styleOptions, setStyleOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchTemplates();
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    const [catRes, occRes, styRes] = await Promise.all([
      templateLabels.getCategories(),
      templateLabels.getOccasions(),
      templateLabels.getStyles(),
    ]);
    if (catRes.data) setCategoryOptions(catRes.data);
    if (occRes.data) setOccasionOptions(occRes.data);
    if (styRes.data) setStyleOptions(styRes.data);
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    const result = await templates.getAll();
    if (result.data) {
      setTemplateList(result.data);
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredTemplates = templateList.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newTemplate.name || !newTemplate.category || !newTemplate.occasion || !newTemplate.style) {
      setError('请填写所有必填字段');
      return;
    }

    const result = await admin.createTemplate({
      ...newTemplate,
      default_elements: [],
    });

    if (!result.error) {
      fetchTemplates();
      setShowAddModal(false);
      setNewTemplate({
        name: '',
        category: '',
        occasion: '',
        style: '',
        thumbnail_url: '',
        background_url: '',
      });
      setError('');
    } else {
      setError('添加失败');
    }
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setShowEditModal(true);
  };

  const handleVisualEdit = (template: Template) => {
    navigate(`/admin/template-editor/${template.id}`);
  };

  const handleSaveEdit = async () => {
    if (!selectedTemplate) return;

    const result = await admin.updateTemplate(selectedTemplate.id, {
      name: selectedTemplate.name,
      category: selectedTemplate.category,
      occasion: selectedTemplate.occasion,
      style: selectedTemplate.style,
      thumbnail_url: selectedTemplate.thumbnail_url,
      background_url: selectedTemplate.background_url,
    });

    if (!result.error) {
      fetchTemplates();
      setShowEditModal(false);
      setSelectedTemplate(null);
    } else {
      setError('保存失败');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('确定要删除该模板吗？')) return;
    const result = await admin.deleteTemplate(templateId);
    if (!result.error) {
      fetchTemplates();
    } else {
      setError('删除失败');
    }
  };

  // 分类/场合/风格数据现在从 API 获取（见 fetchLabels）

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">模板管理</h2>
          <p className="text-gray-500 mt-1">管理贺卡模板</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          添加模板
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索模板名称或分类..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* AI 一键生成模板 */}
        <div className="px-4 pb-4">
          <AITemplateGenerator onSaved={fetchTemplates} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              没有找到模板
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-32 bg-gray-100">
                  {template.thumbnail_url ? (
                    <img
                      src={template.thumbnail_url}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                      {template.category}
                    </span>
                    <span className="px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded-full">
                      {template.occasion}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {template.style}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleVisualEdit(template)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
                      title="可视化编辑"
                    >
                      <Palette className="w-4 h-4" />
                      可视化编辑
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      元数据
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">添加新模板</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">模板名称 *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类 *</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">请选择分类</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">场合 *</label>
                <select
                  value={newTemplate.occasion}
                  onChange={(e) => setNewTemplate({ ...newTemplate, occasion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">请选择场合</option>
                  {occasionOptions.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">风格 *</label>
                <select
                  value={newTemplate.style}
                  onChange={(e) => setNewTemplate({ ...newTemplate, style: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">请选择风格</option>
                  {styleOptions.map((sty) => (
                    <option key={sty} value={sty}>{sty}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">缩略图URL</label>
                <input
                  type="text"
                  value={newTemplate.thumbnail_url}
                  onChange={(e) => setNewTemplate({ ...newTemplate, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">背景图URL</label>
                <input
                  type="text"
                  value={newTemplate.background_url}
                  onChange={(e) => setNewTemplate({ ...newTemplate, background_url: e.target.value })}
                  placeholder="https://example.com/background.jpg"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">编辑模板</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTemplate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">模板名称</label>
                <input
                  type="text"
                  value={selectedTemplate.name}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select
                  value={selectedTemplate.category}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">场合</label>
                <select
                  value={selectedTemplate.occasion}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, occasion: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {occasionOptions.map((occ) => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">风格</label>
                <select
                  value={selectedTemplate.style}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, style: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {styleOptions.map((sty) => (
                    <option key={sty} value={sty}>{sty}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">缩略图URL</label>
                <input
                  type="text"
                  value={selectedTemplate.thumbnail_url}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, thumbnail_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">背景图URL</label>
                <input
                  type="text"
                  value={selectedTemplate.background_url}
                  onChange={(e) =>
                    setSelectedTemplate({ ...selectedTemplate, background_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagementPage;