import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Eye, Download, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useEditorStore } from '../../store';
import { templates, admin } from '../../utils/supabase';
import Canvas from '../../components/editor/Canvas';
import Toolbar from '../../components/editor/Toolbar';
import PropertyPanel from '../../components/editor/PropertyPanel';
import EditorSidebar from '../../components/editor/EditorSidebar';
import { CardPage, Template, CardElement } from '../../types';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createBlankPage = (pageNumber: number = 1): CardPage => ({
  id: generateId(),
  pageNumber,
  elements: [],
  transition: 'fade',
  transitionDuration: 500,
  audioAutoplay: false,
  audioLoop: false,
});

// 模板转贺卡格式
const templateToPages = (template: Template): CardPage[] => {
  if (template.pages && template.pages.length > 0) {
    return template.pages;
  }
  return [{
    id: generateId(),
    pageNumber: 1,
    elements: template.default_elements || [],
    backgroundUrl: template.background_url,
    transition: 'fade',
    transitionDuration: 500,
  }];
};

// 贺卡格式转模板格式
const pagesToTemplateElements = (pages: CardPage[]): { default_elements: CardElement[]; background_url: string } => {
  const firstPage = pages[0];
  return {
    default_elements: firstPage?.elements || [],
    background_url: firstPage?.backgroundUrl || '',
  };
};

const TemplateEditorPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { setCurrentCard, currentCard, clearEditor } = useEditorStore();
  const [templateTitle, setTemplateTitle] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await templates.getById(templateId);
      if (!error && data) {
        const pages = templateToPages(data);
        setCurrentCard({
          title: data.name,
          templateId: data.id,
          pages,
          currentPageIndex: 0,
          backgroundMusicUrl: data.backgroundMusicUrl,
          backgroundMusicLoop: true,
        });
        setTemplateTitle(data.name);
      }
      setIsLoading(false);
    };

    fetchTemplate();

    return () => clearEditor();
  }, [templateId, setCurrentCard, clearEditor]);

  const handleSave = async () => {
    if (!templateId) return;

    const { default_elements, background_url } = pagesToTemplateElements(currentCard.pages);

    const result = await admin.updateTemplate(templateId, {
      name: templateTitle,
      default_elements,
      background_url,
      pages: currentCard.pages,
      backgroundMusicUrl: currentCard.backgroundMusicUrl,
    });

    if (!result.error) {
      setSaveMessage('模板保存成功！');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('保存失败，请重试');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handlePreview = () => {
    navigate(`/preview`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">加载中...</h3>
          <p className="text-gray-500">正在加载模板数据</p>
        </div>
      </div>
    );
  }

  if (!templateId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">模板不存在</h3>
          <button
            onClick={() => navigate('/admin/templates')}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            返回模板管理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/templates')}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">模板编辑</span>
            <input
              type="text"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none w-64"
              placeholder="模板标题"
            />
          </div>
          <span className="text-xs text-gray-500">
            共 {currentCard.pages.length} 页
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">保存模板</span>
          </button>
          <button
            onClick={handlePreview}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">预览</span>
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      {saveMessage && (
        <div className={`mx-4 mt-2 p-3 rounded-lg text-sm ${
          saveMessage.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* 主体三栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：编辑侧边栏 */}
        <EditorSidebar />

        {/* 中间：工具栏 + 画布 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4">
            <Toolbar />
          </div>
          <Canvas />
        </div>

        {/* 右侧：属性面板 */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-4">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorPage;
