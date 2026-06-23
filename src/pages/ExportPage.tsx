import { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Download, Mail, Check, Link, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../store';
import { useTemplatesStore } from '../store';
import { useUserStore } from '../store';
import { cards } from '../utils/supabase';
import { useAuth } from '../hooks/useAuth';
import { exportToPDF, copyToClipboard, generateShareLink, sendEmail } from '../utils/export';
import { getElementVisualStyle, getShapeVisualStyle } from '../lib/elementStyle';
import type { CardElement } from '../types';

const ExportPage = () => {
  const navigate = useNavigate();
  const { currentCard } = useEditorStore();
  const { templates } = useTemplatesStore();
  const { user, addDesign } = useUserStore();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'link' | 'pdf' | 'email'>('link');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('电子贺卡');
  const [emailBody, setEmailBody] = useState('这是我为您制作的电子贺卡，请点击链接查看！');
  const [emailSent, setEmailSent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const template = templates.find((t) => t.id === currentCard.templateId);

  useEffect(() => {
    if (!currentCard.templateId) {
      navigate('/editor');
    }
  }, [currentCard.templateId, navigate]);

  useEffect(() => {
    if (currentCard.id) {
      setShareLink(generateShareLink(currentCard.id));
    }
  }, [currentCard.id]);

  const handleSaveAndGenerateLink = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }

    setIsSaving(true);

    if (currentCard.id) {
      const { data, error } = await cards.update(currentCard.id, {
        pages: currentCard.pages,
        background_music_url: currentCard.backgroundMusicUrl,
      });
      if (!error && data) {
        setShareLink(generateShareLink(data.id));
      }
    } else {
      const cardData = {
        user_id: user!.id,
        template_id: currentCard.templateId,
        title: currentCard.title || '我的贺卡',
        pages: currentCard.pages,
        background_music_url: currentCard.backgroundMusicUrl,
      };

      const { data, error } = await cards.create(cardData);
      if (!error && data) {
        addDesign(data);
        setShareLink(generateShareLink(data.id));
      }
    }

    setIsSaving(false);
  };

  const handleCopyLink = async () => {
    if (!shareLink) {
      await handleSaveAndGenerateLink();
    }
    if (shareLink) {
      const success = await copyToClipboard(shareLink);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await exportToPDF('card-canvas', currentCard.title || 'card');
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleSendEmail = () => {
    if (!shareLink) {
      handleSaveAndGenerateLink().then(() => {
        if (shareLink) {
          const mailtoUrl = sendEmail(emailTo, emailSubject, emailBody, shareLink);
          window.location.href = mailtoUrl;
          setEmailSent(true);
          setTimeout(() => setEmailSent(false), 3000);
        }
      });
    } else {
      const mailtoUrl = sendEmail(emailTo, emailSubject, emailBody, shareLink);
      window.location.href = mailtoUrl;
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }
  };

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">贺卡加载中...</h3>
          <p className="text-gray-500">请稍候，正在加载贺卡内容</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/editor')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回编辑</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">导出贺卡</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {/* 预览 - 多页 */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {currentCard.pages.map((page, idx) => (
                <div
                  key={page.id}
                  id={idx === 0 ? 'card-canvas' : undefined}
                  className="rounded-2xl shadow-xl overflow-hidden mx-auto"
                  style={{
                    width: '300px',
                    height: '420px',
                    backgroundImage: page.backgroundUrl ? `url(${page.backgroundUrl})` : template?.background_url ? `url(${template.background_url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: page.backgroundColor || '#ffffff',
                  }}
                >
                  {page.elements.map((element) => {
                    const scale = 0.75;
                    const layoutStyle: React.CSSProperties = {
                      position: 'absolute',
                      left: `${element.position.x * scale}%`,
                      top: `${element.position.y * scale}%`,
                      width: element.size ? `${element.size.width * scale}%` : 'auto',
                      height: element.size ? `${element.size.height * scale}%` : 'auto',
                      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                    };
                    const style = getElementVisualStyle(element, layoutStyle);

                    if (element.type === 'text') {
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...style,
                            fontSize: `${(element.style.fontSize || 24) * scale}px`,
                            padding: '6px 12px',
                            whiteSpace: 'pre-wrap',
                          }}
                          className={element.style.fontStyle === 'italic' ? 'italic' : ''}
                        >
                          {element.content}
                        </div>
                      );
                    }

                    if (element.type === 'image') {
                      return (
                        <img
                          key={element.id}
                          src={element.content}
                          alt=""
                          style={{
                            ...style,
                            objectFit: 'cover',
                            borderRadius: element.style.borderRadius ? `${element.style.borderRadius * scale}%` : '6px',
                          }}
                        />
                      );
                    }

                    if (element.type === 'shape') {
                      // 通过共享工具获取包含 clipPath/border 三角形等自定义属性的样式
                      const shapeStyle = getShapeVisualStyle(element);
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...style,
                            ...shapeStyle,
                            // 若未指定圆角则按 content 默认值
                            borderRadius: style.borderRadius ?? (element.content === 'circle' ? '50%' : 0),
                          }}
                        />
                      );
                    }

                    if (element.type === 'icon') {
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...style,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {element.content}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-4">{currentCard.title}</p>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'link' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Link className="w-4 h-4 inline mr-2" />
                  生成链接
                </button>
                <button
                  onClick={() => setActiveTab('pdf')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'pdf' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  下载 PDF
                </button>
                <button
                  onClick={() => setActiveTab('email')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    activeTab === 'email' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  发送邮件
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'link' && (
                  <div className="space-y-4">
                    {!isAuthenticated && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">需要登录</p>
                          <p className="text-sm text-yellow-700">登录后可以保存贺卡并生成分享链接</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">分享链接</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={shareLink || '点击下方按钮生成链接'}
                          readOnly
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={handleCopyLink}
                          disabled={isSaving}
                          className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          <span>{copied ? '已复制' : '复制'}</span>
                        </button>
                      </div>
                    </div>

                    {!shareLink && (
                      <button
                        onClick={handleSaveAndGenerateLink}
                        disabled={isSaving}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isSaving ? '保存中...' : '保存并生成链接'}
                      </button>
                    )}

                    <p className="text-sm text-gray-500">
                      生成的链接可以分享给任何人，对方无需登录即可查看您的贺卡
                    </p>
                  </div>
                )}

                {activeTab === 'pdf' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h3 className="text-sm font-medium text-blue-800 mb-1">下载选项</h3>
                      <p className="text-sm text-blue-700">贺卡将以 PDF 格式下载，保留所有设计元素和样式</p>
                    </div>

                    <button
                      onClick={handleDownloadPDF}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      下载 PDF
                    </button>

                    <p className="text-sm text-gray-500">
                      PDF 文件将包含您贺卡的完整设计，适合打印或通过邮件发送
                    </p>
                  </div>
                )}

                {activeTab === 'email' && (
                  <div className="space-y-4">
                    {!isAuthenticated && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">需要登录</p>
                          <p className="text-sm text-yellow-700">登录后可以生成贺卡链接并发送邮件</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">收件人邮箱</label>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="输入收件人邮箱地址"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">邮件主题</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="输入邮件主题"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">邮件正文</label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="输入邮件内容"
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    {emailSent ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-green-700">邮件已发送！</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleSendEmail}
                        disabled={!emailTo || isSaving}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Mail className="w-5 h-5" />
                        发送邮件
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;