import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, FileText, Eye } from 'lucide-react';
import { ai } from '../../lib/ai';
import { templateLabels } from '../../utils/supabase';
import { admin } from '../../utils/supabase';

interface AITemplateGeneratorProps {
  onSaved: () => void;
}

const AITemplateGenerator = ({ onSaved }: AITemplateGeneratorProps) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [error, setError] = useState('');
  const [labelOptions, setLabelOptions] = useState<{
    categories: string[];
    occasions: string[];
    styles: string[];
  }>({ categories: [], occasions: [], styles: [] });

  useEffect(() => {
    const fetchLabels = async () => {
      const [catRes, occRes, styRes] = await Promise.all([
        templateLabels.getCategories(),
        templateLabels.getOccasions(),
        templateLabels.getStyles(),
      ]);
      setLabelOptions({
        categories: catRes.data || [],
        occasions: occRes.data || [],
        styles: styRes.data || [],
      });
    };
    fetchLabels();
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('请输入模板描述');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGenerated(null);

    const { data, error: err } = await ai.generateTemplate(description, labelOptions);

    if (err) {
      setError(err.message || '生成失败');
    } else if (data) {
      setGenerated(data);
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!generated) return;

    setIsSaving(true);
    setError('');

    // 为 pages 和 elements 注入唯一 ID（AI 不会生成 id 字段）
    const injectIds = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => injectIds(item));
      }
      if (obj && typeof obj === 'object') {
        const result: any = { ...obj };
        // 页面和元素都需要 id
        if ((obj.elements || obj.pageNumber !== undefined) && !obj.id) {
          result.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        }
        if (obj.type && !obj.id) {
          // 这是元素
          result.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        }
        // 递归处理子字段
        Object.keys(result).forEach(key => {
          if (Array.isArray(result[key]) || (result[key] && typeof result[key] === 'object')) {
            result[key] = injectIds(result[key]);
          }
        });
        return result;
      }
      return obj;
    };

    const pagesWithIds = injectIds(generated.pages || []);

    // 构造模板数据保存到数据库
    const templateData = {
      name: generated.name || 'AI 生成的模板',
      category: generated.category || '其他',
      occasion: generated.occasion || '祝福问候',
      style: generated.style || '简约',
      thumbnail_url: '',
      background_url: '',  // 背景图 URL 留空，使用 pages[].backgroundColor
      pages: pagesWithIds,
      default_elements: pagesWithIds[0]?.elements || [],
    };

    const result = await admin.createTemplate(templateData);

    if (result.error) {
      setError('保存失败: ' + (result.error.message || '未知错误'));
    } else {
      onSaved();
      setGenerated(null);
      setDescription('');
    }
    setIsSaving(false);
  };

  const getPageSummary = (page: any, index: number) => {
    const elementTypes = page.elements?.map((el: any) => {
      if (el.type === 'text') return `「${(el.content || '').substring(0, 20)}」`;
      if (el.type === 'shape') return '[装饰]';
      return `[${el.type}]`;
    }).join(' ') || '空页面';
    return `第${index + 1}页: ${elementTypes}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-gray-900">AI 一键生成模板</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            描述您想要的模板
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：春节商务贺卡，3页，简约中国风，含祝福文案和金色装饰"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI 生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              生成模板
            </>
          )}
        </button>

        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* 生成结果预览 */}
      {generated && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-800">生成结果预览</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-12 flex-shrink-0">名称:</span>
              <span className="text-gray-800 font-medium">{generated.name || '未命名'}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-12 flex-shrink-0">分类:</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">{generated.category}</span>
              <span className="text-gray-400">/</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{generated.occasion}</span>
              <span className="text-gray-400">/</span>
              <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs rounded">{generated.style}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-12 flex-shrink-0">页数:</span>
              <span className="text-gray-800">{generated.pages?.length || 0} 页</span>
            </div>
            {generated.pages?.map((page: any, index: number) => (
              <div key={index} className="ml-12 p-2 bg-gray-50 rounded text-xs text-gray-600">
                {getPageSummary(page, index)}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              保存到模板库
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              重新生成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITemplateGenerator;
