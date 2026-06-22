import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Eye, Download, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useEditorStore } from '../store';
import { useTemplatesStore } from '../store';
import { useUserStore } from '../store';
import { templates, cards } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import Canvas from '../components/editor/Canvas';
import Toolbar from '../components/editor/Toolbar';
import PropertyPanel from '../components/editor/PropertyPanel';
import EditorSidebar from '../components/editor/EditorSidebar';
import { CardPage } from '../types';

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

const EditorPage = () => {
  const { templateId } = useParams<{ templateId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { user, addDesign, updateDesign } = useUserStore();
  const { setCurrentCard, currentCard, clearEditor } = useEditorStore();
  const { setTemplates, templates: templateList } = useTemplatesStore();
  
  useKeyboardShortcuts();
  const [cardTitle, setCardTitle] = useState('我的贺卡');
  const [saveMessage, setSaveMessage] = useState('');
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const hasCreatedCard = useRef(false); // 跟踪是否已创建贺卡
  const [currentCardId, setCurrentCardId] = useState<string | null>(null); // 当前编辑的卡片ID

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadProgress(10);

        // 检查是否是编辑现有卡片
        const cardIdFromUrl = searchParams.get('cardId');
        
        if (cardIdFromUrl) {
          // 编辑现有卡片
          setLoadProgress(20);
          const { data: existingCard, error } = await cards.getById(cardIdFromUrl);
          
          if (!error && existingCard) {
            setLoadProgress(70);
            setCurrentCardId(existingCard.id);
            setCurrentCard({
              title: existingCard.title,
              templateId: existingCard.template_id || '',
              pages: existingCard.pages || [{
                id: generateId(),
                pageNumber: 1,
                elements: [],
                transition: 'fade',
                transitionDuration: 500,
              }],
              currentPageIndex: 0,
              backgroundMusicUrl: existingCard.background_music_url || '',
              backgroundMusicLoop: existingCard.background_music_loop !== undefined ? existingCard.background_music_loop : true,
            });
            setCardTitle(existingCard.title);
            setLoadProgress(90);
          } else {
            console.error('加载现有卡片失败:', error);
            await loadDefaultTemplate();
          }
        } else if (templateId) {
          // 从模板创建新卡片
          setLoadProgress(20);
          const start = Date.now();
          const { data, error } = await templates.getById(templateId);
          console.log(`模板加载耗时: ${Date.now() - start}ms`);
          
          if (!error && data) {
            setLoadProgress(60);
            const initialPages: CardPage[] = data.pages && data.pages.length > 0
              ? data.pages
              : [{
                  id: generateId(),
                  pageNumber: 1,
                  elements: data.default_elements || [],
                  backgroundUrl: data.background_url,
                  transition: 'fade',
                  transitionDuration: 500,
                }];
          
            setCurrentCard({
              title: data.name,
              templateId: data.id,
              pages: initialPages,
              currentPageIndex: 0,
              backgroundMusicUrl: data.backgroundMusicUrl,
              backgroundMusicLoop: true,
            });
            setCardTitle(data.name);

            // 如果用户已登录，自动创建贺卡记录
            if (isAuthenticated && user && !hasCreatedCard.current) {
              hasCreatedCard.current = true; // 标记为已创建
              setLoadProgress(70);
              try {
                const cardData: any = {
                  user_id: user.id,
                  template_id: data.id,
                  title: data.name,
                  pages: initialPages,
                };

                if (data.backgroundMusicUrl) {
                  cardData.background_music_url = data.backgroundMusicUrl;
                }

                const { data: newCard, error: createError } = await cards.create(cardData);
                if (!createError && newCard) {
                  setCurrentCardId(newCard.id);
                  addDesign(newCard);
                  console.log('已自动创建贺卡:', newCard.id);
                }
              } catch (e) {
                console.error('自动创建贺卡失败:', e);
              }
            }
            
            setLoadProgress(80);
          } else {
            console.error('模板加载失败:', error);
            await loadDefaultTemplate();
          }
        } else {
          await loadDefaultTemplate();
        }
      } catch (err) {
        console.error('加载异常:', err);
        await loadDefaultTemplate();
      } finally {
        setLoadProgress(100);
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    const loadDefaultTemplate = async () => {
      try {
        setLoadProgress(30);
        if (templateList.length > 0) {
          setLoadProgress(60);
          const defaultTemplate = templateList[0];
          initTemplate(defaultTemplate);
        } else {
          setLoadProgress(40);
          const { data, error } = await templates.getAll();
          if (!error && data && data.length > 0) {
            setLoadProgress(70);
            setTemplates(data);
            initTemplate(data[0]);
          } else {
            setLoadProgress(80);
            initBlankCard();
          }
        }
      } catch (err) {
        console.error('加载默认模板失败:', err);
        initBlankCard();
      }
    };

    const initTemplate = (template: any) => {
      const initialPages: CardPage[] = template.pages && template.pages.length > 0
        ? template.pages
        : [{
            id: generateId(),
            pageNumber: 1,
            elements: template.default_elements || [],
            backgroundUrl: template.background_url,
            transition: 'fade',
            transitionDuration: 500,
          }];

      setCurrentCard({
        title: template.name,
        templateId: template.id,
        pages: initialPages,
        currentPageIndex: 0,
        backgroundMusicUrl: template.backgroundMusicUrl,
        backgroundMusicLoop: true,
      });
      setCardTitle(template.name);
    };

    const initBlankCard = () => {
      setCurrentCard({
        title: '新建贺卡',
        templateId: '',
        pages: [createBlankPage(1)],
        currentPageIndex: 0,
        backgroundMusicLoop: true,
      });
      setCardTitle('新建贺卡');
    };

    fetchData();

    return () => clearEditor();
  }, [templateId, searchParams, setCurrentCard, setTemplates, clearEditor, templateList, isAuthenticated, user]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      setShowAuthWarning(true);
      setTimeout(() => setShowAuthWarning(false), 3000);
      return;
    }

    // 只发送数据库中确定存在的字段，避免写入不存在的列
    const cardData: any = {
      user_id: user!.id,
      template_id: currentCard.templateId,
      title: cardTitle,
      // pages 是新增字段，如果数据库中存在则发送
      pages: currentCard.pages,
      background_music_loop: currentCard.backgroundMusicLoop,
    };

    // 可选字段（数据库中可能不存在）
    if (currentCard.backgroundMusicUrl) {
      cardData.background_music_url = currentCard.backgroundMusicUrl;
    }

    try {
      // 检查数据大小
      const dataSize = JSON.stringify(cardData).length;
      console.log('卡片数据大小:', dataSize, 'bytes');

      if (dataSize > 10 * 1024 * 1024) {
        setSaveMessage('数据过大（超过10MB），请减少图片或使用更小的图片');
        setTimeout(() => setSaveMessage(''), 5000);
        return;
      }

      let result;
      
      if (currentCardId) {
        // 更新现有卡片
        result = await cards.update(currentCardId, cardData);
      } else {
        // 创建新卡片
        result = await cards.create(cardData);
      }
      
      const { data, error } = result;

      if (error) {
        console.error('保存错误:', error);
        let errorMessage = '保存失败';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.code) {
          errorMessage = `错误码: ${error.code}`;
        }
        setSaveMessage(`保存失败: ${errorMessage}`);
      } else if (data) {
        if (currentCardId) {
          // 更新现有设计
          updateDesign(data);
          setSaveMessage('贺卡更新成功！');
        } else {
          // 添加新设计
          addDesign(data);
          setCurrentCardId(data.id); // 设置卡片ID，下次保存就是更新
          setSaveMessage('贺卡保存成功！');
        }
      } else {
        setSaveMessage('保存失败：未返回数据');
      }
    } catch (e) {
      console.error('保存异常:', e);
      setSaveMessage(`保存异常: ${(e as Error).message || '未知错误'}`);
    }
    setTimeout(() => setSaveMessage(''), 5000);
  };

  const handlePreview = () => {
    navigate('/preview');
  };

  const handleExport = () => {
    navigate('/export');
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* 顶部工具栏 - 添加 z-index 确保不被遮挡 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <input
            type="text"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none max-w-xs md:max-w-sm lg:max-w-md"
            placeholder="贺卡标题"
          />
          <span className="text-xs text-gray-500 hidden sm:inline">
            共 {currentCard.pages.length} 页
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
            title="保存贺卡"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">保存</span>
          </button>
          <button
            onClick={handlePreview}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
            title="预览贺卡"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">预览</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
            title="导出贺卡"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导出</span>
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      {showAuthWarning && (
        <div className="px-4 flex-shrink-0">
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-700">请先登录以保存贺卡</span>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="px-4 flex-shrink-0">
          <div className={`mt-2 p-3 rounded-lg text-sm ${
            saveMessage.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {saveMessage}
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 mb-2">加载模板中...</p>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{loadProgress}%</p>
          </div>
        </div>
      )}

      {/* 主体三栏布局 */}
      {!isLoading && (
        <div className="flex-1 flex overflow-hidden pt-2">
          {/* 左侧：编辑侧边栏 */}
          <EditorSidebar />

          {/* 中间：工具栏 + 画布 */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-4 flex-shrink-0">
              <Toolbar />
            </div>
            <Canvas />
          </div>

          {/* 右侧：属性面板 */}
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-4">
            <PropertyPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPage;
