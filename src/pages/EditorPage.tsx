import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Eye, Download, Mail, AlertCircle, ArrowLeft, Type, Image as ImageIcon, Sparkles, Trash2, Square, Circle as CircleIcon, Undo2, Redo2, ArrowRight as ArrowLeftIcon, ArrowRight, ArrowUp, ArrowDown, ChevronsLeftRight, ChevronsUpDown, Triangle, Minus, Star, Copy, Group, Ungroup, Layers } from 'lucide-react';
import { useEditorStore } from '../store';
import { useTemplatesStore } from '../store';
import { useUserStore } from '../store';
import { templates, cards } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import Canvas from '../components/editor/Canvas';
import PropertyPanel from '../components/editor/PropertyPanel';
import EditorSidebar from '../components/editor/EditorSidebar';
import ComponentPicker from '../components/editor/ComponentPicker';
import AILayoutSuggestions from '../components/ai/AILayoutSuggestions';
import { CardPage } from '../types';
import { SHAPE_CONTENT } from '../lib/elementStyle';

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
  const { setCurrentCard, currentCard, clearEditor, selectedElementId, deleteElement, updateElement, undo, redo, canUndo, canRedo, bringToFront, sendToBack, bringForward, sendBackward, groupElements, ungroupElement, addElement } = useEditorStore();
  const { setTemplates, templates: templateList } = useTemplatesStore();
  
  useKeyboardShortcuts();
  const [cardTitle, setCardTitle] = useState('我的贺卡');
  const [saveMessage, setSaveMessage] = useState('');
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const hasCreatedCard = useRef(false); // 跟踪是否已创建贺卡
  const [currentCardId, setCurrentCardId] = useState<string | null>(null); // 当前编辑的卡片ID
  const initializedRef = useRef(false); // 防止重复初始化

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const currentPage = currentCard.pages[currentCard.currentPageIndex];
    if (!selectedElementId || !currentPage) return;

    const selectedElement = currentPage.elements.find(el => el.id === selectedElementId);
    if (!selectedElement) return;

    let newPosition = { ...selectedElement.position };

    switch (alignment) {
      case 'left':
        newPosition.x = 0;
        break;
      case 'center':
        newPosition.x = 50 - (selectedElement.size?.width || 0) / 2;
        break;
      case 'right':
        newPosition.x = 100 - (selectedElement.size?.width || 0);
        break;
      case 'top':
        newPosition.y = 0;
        break;
      case 'middle':
        newPosition.y = 50 - (selectedElement.size?.height || 0) / 2;
        break;
      case 'bottom':
        newPosition.y = 100 - (selectedElement.size?.height || 0);
        break;
    }

    updateElement(selectedElementId, { position: newPosition });
  };

  const addText = () => {
    addElement({
      type: 'text',
      content: '双击编辑文字',
      position: { x: 30, y: 40 },
      size: { width: 40, height: 10 },
      style: {
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#333333',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
      },
    });
  };

  const compressImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new (window as any).Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const base64 = canvas.toDataURL(mimeType, quality);
          resolve(base64);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        }
      };
      img.onerror = () => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const compressedBase64 = await compressImage(file);
        addElement({
          type: 'image',
          content: compressedBase64,
          position: { x: 20, y: 20 },
          size: { width: 60, height: 40 },
          style: {},
        });
      } catch (error) {
        console.error('图片压缩失败:', error);
        const reader = new FileReader();
        reader.onload = (event) => {
          addElement({
            type: 'image',
            content: event.target?.result as string,
            position: { x: 20, y: 20 },
            size: { width: 60, height: 40 },
            style: {},
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'star';

  const addShape = (shape: ShapeType) => {
    const baseStyle = {
      backgroundColor: '#8B5CF6',
      borderRadius: shape === 'circle' ? 50 : 0,
    };

    const shapeConfigs: Record<ShapeType, { size: { width: number; height: number }; style: Record<string, unknown> }> = {
      rectangle: {
        size: { width: 30, height: 30 },
        style: { ...baseStyle, borderRadius: 0 },
      },
      circle: {
        size: { width: 30, height: 30 },
        style: { ...baseStyle, borderRadius: 50 },
      },
      triangle: {
        size: { width: 30, height: 30 },
        style: {
          backgroundColor: 'transparent',
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderBottom: '26px solid #8B5CF6',
        },
      },
      line: {
        size: { width: 50, height: 2 },
        style: {
          backgroundColor: '#8B5CF6',
          borderRadius: 1,
        },
      },
      arrow: {
        size: { width: 30, height: 20 },
        style: {
          backgroundColor: 'transparent',
          borderLeft: '15px solid #8B5CF6',
          borderTop: '10px solid transparent',
          borderBottom: '10px solid transparent',
        },
      },
      star: {
        size: { width: 30, height: 30 },
        style: {
          backgroundColor: '#8B5CF6',
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        },
      },
    };

    const config = shapeConfigs[shape];
    addElement({
      type: 'shape',
      content: SHAPE_CONTENT[shape],
      position: { x: 35, y: 35 },
      size: config.size,
      style: config.style as any,
    });
  };

  const addIcon = () => {
    addElement({
      type: 'icon',
      content: '⭐',
      position: { x: 40, y: 40 },
      size: { width: 20, height: 20 },
      style: {
        fontSize: 48,
        textAlign: 'center',
      },
    });
  };

  // 预加载背景图片，防止画布首次渲染时背景图加载导致的闪烁
  const preloadBackgroundImage = useCallback((url: string | undefined) => {
    if (!url) return;
    const img = new Image();
    img.src = url;
  }, []);

  useEffect(() => {
    // 确保编辑页面从顶部开始渲染，避免从其他页面跳转时保留滚动位置
    window.scrollTo(0, 0);

    // 防止重复初始化（fix: templateList 变化导致的效果重复执行）
    if (initializedRef.current) return;
    initializedRef.current = true;

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
            // 预加载背景图片
            const pages = existingCard.pages || [{
              id: generateId(),
              pageNumber: 1,
              elements: [],
              transition: 'fade',
              transitionDuration: 500,
            }];
            if (pages[0]?.backgroundUrl) preloadBackgroundImage(pages[0].backgroundUrl);
            setCurrentCard({
              title: existingCard.title,
              templateId: existingCard.template_id || '',
              pages,
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
          
            // 预加载背景图片
            if (initialPages[0]?.backgroundUrl) preloadBackgroundImage(initialPages[0].backgroundUrl);

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
        // 使用 requestAnimationFrame 确保在下一帧再切换，避免视觉闪烁
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsLoading(false);
          });
        });
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
            // 使用 setTimeout 避免在异步流程中触发同步的 store 更新导致中间渲染
            setTimeout(() => setTemplates(data), 0);
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

      // 预加载背景图片
      const bgUrl = initialPages[0]?.backgroundUrl;
      if (bgUrl) preloadBackgroundImage(bgUrl);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, searchParams]); // 精简依赖，移除 templateList 防止重复初始化

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
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0 z-[100] shadow-sm">
        {/* 左侧：返回 + 标题 */}
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

        {/* 中间：工具按钮组 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* 撤销/重做 */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className={`p-2 rounded-lg transition-all ${
                canUndo()
                  ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className={`p-2 rounded-lg transition-all ${
                canRedo()
                  ? 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="重做 (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* 添加元素 */}
          <div className="flex items-center gap-1 px-2 border-r border-gray-200">
            <button
              onClick={addText}
              className="p-2 rounded-lg hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all"
              title="添加文字"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={addImage}
              className="p-2 rounded-lg hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all"
              title="添加图片（自动压缩）"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={addIcon}
              className="p-2 rounded-lg hover:bg-purple-50 text-gray-600 hover:text-purple-600 transition-all"
              title="添加表情/图标"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <ComponentPicker />
          </div>

          {/* 形状菜单 */}
          <div className="flex items-center gap-1 px-2 border-r border-gray-200 relative">
            <button
              onClick={() => setShowShapeMenu(!showShapeMenu)}
              className="p-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all flex items-center gap-1"
              title="形状菜单"
            >
              <Square className="w-4 h-4" />
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showShapeMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[200]">
                <button
                  onClick={() => { addShape('rectangle'); setShowShapeMenu(false); }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                >
                  <Square className="w-4 h-4 text-gray-500" />
                  <span>矩形</span>
                </button>
                <button
                  onClick={() => { addShape('circle'); setShowShapeMenu(false); }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                >
                  <CircleIcon className="w-4 h-4 text-gray-500" />
                  <span>圆形</span>
                </button>
                <button
                  onClick={() => { addShape('triangle'); setShowShapeMenu(false); }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                >
                  <Triangle className="w-4 h-4 text-gray-500" />
                  <span>三角形</span>
                </button>
                <button
                  onClick={() => { addShape('line'); setShowShapeMenu(false); }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                >
                  <Minus className="w-4 h-4 text-gray-500" />
                  <span>线条</span>
                </button>
                <button
                  onClick={() => { addShape('arrow'); setShowShapeMenu(false); }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                >
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <span>箭头</span>
                </button>
                <button
                  onClick={() => { addShape('star'); setShowShapeMenu(false); }}
                  className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                >
                  <Star className="w-4 h-4 text-gray-500" />
                  <span>星形</span>
                </button>
              </div>
            )}
          </div>

          {/* 对齐工具 */}
          <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
            <button
              onClick={() => handleAlign('top')}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="顶部对齐"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAlign('middle')}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="垂直居中"
            >
              <ChevronsUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="底部对齐"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={() => handleAlign('left')}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="左对齐"
            >
              <ArrowLeftIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAlign('center')}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="水平居中"
            >
              <ChevronsLeftRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAlign('right')}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="右对齐"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* 图层与组合操作 */}
          <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
            <button
              onClick={() => selectedElementId && bringToFront(selectedElementId)}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="置顶 (Ctrl+Shift+])"
            >
              <Layers className="w-3 h-3" />
            </button>
            <button
              onClick={() => selectedElementId && sendToBack(selectedElementId)}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="置底 (Ctrl+Shift+[)"
            >
              <Layers className="w-3 h-3 rotate-180" />
            </button>
            <button
              onClick={() => selectedElementId && bringForward(selectedElementId)}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="上移一层 (Ctrl+])"
            >
              <ChevronsUpDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => selectedElementId && sendBackward(selectedElementId)}
              disabled={!selectedElementId}
              className={`p-1.5 rounded-md transition-all ${
                selectedElementId
                  ? 'hover:bg-indigo-50 text-gray-600 hover:text-indigo-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="下移一层 (Ctrl+[)"
            >
              <ChevronsUpDown className="w-3 h-3 rotate-180" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button
              onClick={() => {
                if (!selectedElementId) return;
                const currentPage = currentCard.pages[currentCard.currentPageIndex];
                if (!currentPage) return;
                const selected = currentPage.elements.find(el => el.id === selectedElementId);
                if (selected?.type === 'group') {
                  ungroupElement(selectedElementId);
                } else {
                  const multiSelected = currentPage.elements.filter(el => el.selected);
                  if (multiSelected.length >= 2) {
                    groupElements(multiSelected.map(el => el.id));
                  }
                }
              }}
              disabled={(() => {
                if (!selectedElementId) return true;
                const currentPage = currentCard.pages[currentCard.currentPageIndex];
                if (!currentPage) return true;
                const selected = currentPage.elements.find(el => el.id === selectedElementId);
                if (selected?.type === 'group') return false;
                const count = currentPage.elements.filter(el => el.selected).length;
                return count < 2;
              })()}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-orange-50 text-gray-600 hover:text-orange-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title={(() => {
                const currentPage = currentCard.pages[currentCard.currentPageIndex];
                const selected = currentPage?.elements.find(el => el.id === selectedElementId);
                if (selected?.type === 'group') return '拆分组合 (Ctrl+Shift+G)';
                const count = currentPage?.elements.filter(el => el.selected).length || 0;
                return count >= 2 ? `组合选中的 ${count} 个元素 (Ctrl+G)` : '组合选中元素 (Ctrl+G)';
              })()}
            >
              <Group className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (!selectedElementId) return;
                const currentPage = currentCard.pages[currentCard.currentPageIndex];
                const el = currentPage?.elements.find(e => e.id === selectedElementId);
                if (!el) return;
                addElement({
                  ...el,
                  position: { x: el.position.x + 3, y: el.position.y + 3 },
                  selected: false,
                });
              }}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="复制元素 (Ctrl+D)"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* 删除 */}
          <div className="flex items-center gap-1 px-2 border-r border-gray-200">
            <button
              onClick={() => deleteElement(selectedElementId!)}
              disabled={!selectedElementId}
              className={`p-2 rounded-lg transition-all ${
                selectedElementId
                  ? 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="删除选中元素"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* AI 布局建议 */}
          <div className="flex items-center gap-1 pl-2">
            <AILayoutSuggestions />
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
            title="保存贺卡"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">保存</span>
          </button>
          <button
            onClick={handlePreview}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
            title="预览贺卡"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">预览</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 text-sm"
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
	        <div className="flex-1 flex overflow-hidden pt-2 editor-main-content animate-fade-in">
          {/* 左侧：编辑侧边栏 */}
          <EditorSidebar />

          {/* 中间：画布 */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 pt-2">
            <Canvas />
          </div>

          {/* 右侧：属性面板 */}
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto p-4">
            <PropertyPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPage;
