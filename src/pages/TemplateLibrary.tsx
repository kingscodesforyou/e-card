import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useTemplatesStore } from '../store';
import { templates } from '../utils/supabase';
import TemplateCard from '../components/templates/TemplateCard';
import FilterPanel from '../components/templates/FilterPanel';
import AIRecommendBar from '../components/ai/AIRecommendBar';
import { Template } from '../types';

const TemplateLibrary = () => {
  const {
    templates: templateList,
    setTemplates,
    selectedCategory,
    selectedOccasion,
    selectedStyle,
    loading,
    setLoading,
  } = useTemplatesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      const { data, error } = await templates.getByFilter(selectedCategory, selectedOccasion, selectedStyle);
      if (!error && data) {
        setTemplates(data);
      }
      setLoading(false);
    };

    fetchTemplates();
  }, [selectedCategory, selectedOccasion, selectedStyle, setTemplates, setLoading]);

  useEffect(() => {
    let result = templateList;
    if (searchQuery) {
      result = templateList.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.occasion.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredTemplates(result);
  }, [templateList, searchQuery]);

  const handleSelectTemplate = (template: Template) => {
    window.location.href = `/editor/${template.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">贺卡模板库</h1>
          <p className="text-gray-600">选择一个模板开始制作您的专属贺卡</p>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* AI 智能推荐条 */}
        <div className="mb-6">
          <AIRecommendBar />
        </div>

        <FilterPanel />

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的模板</h3>
            <p className="text-gray-500">尝试调整筛选条件或搜索关键词</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onSelect={handleSelectTemplate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;