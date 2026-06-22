import { Link } from 'react-router-dom';
import { Sparkles, Heart, Gift, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTemplatesStore } from '../store';
import { templates } from '../utils/supabase';
import TemplateCard from '../components/templates/TemplateCard';
import { Template } from '../types';

const HomePage = () => {
  const { setTemplates, setCategories, setOccasions, setStyles, templates: templateList, loading, setLoading } = useTemplatesStore();
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      const { data, error } = await templates.getAll();
      if (!error && data) {
        setTemplates(data);
        
        const categories = [...new Set(data.map((t: Template) => t.category))] as string[];
        const occasions = [...new Set(data.map((t: Template) => t.occasion))] as string[];
        const styles = [...new Set(data.map((t: Template) => t.style))] as string[];
        
        setCategories(categories);
        setOccasions(occasions);
        setStyles(styles);
        
        setFeaturedTemplates(data.slice(0, 6));
      }
      setLoading(false);
    };

    fetchTemplates();
  }, [setTemplates, setCategories, setOccasions, setStyles, setLoading]);

  const handleSelectTemplate = (template: Template) => {
    window.location.href = `/editor/${template.id}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full opacity-30 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200 rounded-full opacity-30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-200 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">创建精美贺卡，传递温暖祝福</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            制作属于你的
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              专属贺卡
            </span>
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            海量精美模板，简单易用的编辑工具，让您轻松创建独一无二的电子贺卡。
            支持分享链接、PDF下载、邮件发送等多种导出方式。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/editor"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              立即开始制作
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/templates"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              浏览模板库
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span>500+ 精美模板</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              <span>10万+ 用户选择</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span>简单易用</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">热门模板</h2>
            <p className="text-gray-600">精选热门贺卡模板，满足各种场合需求</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} onSelect={handleSelectTemplate} />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/templates"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
            >
              查看更多模板
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择我们</h2>
            <p className="text-gray-600">功能强大，使用简单</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">丰富模板</h3>
              <p className="text-gray-600">涵盖节日、生日、婚礼等各种场合，风格多样任您选择</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">简单编辑</h3>
              <p className="text-gray-600">拖拽式操作，轻松添加文字、图片、音乐和动画效果</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">多种导出</h3>
              <p className="text-gray-600">支持生成分享链接、PDF下载和邮件发送</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">准备好开始了吗？</h2>
          <p className="text-white/80 mb-8">创建您的第一张电子贺卡，给亲朋好友一个惊喜</p>
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors"
          >
            开始制作贺卡
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;