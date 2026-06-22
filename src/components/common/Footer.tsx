import { Sparkles, Heart, Github, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                贺卡工坊
              </span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              贺卡工坊是一个功能完整的电子贺卡制作平台，让您轻松创建精美贺卡，传递温暖祝福。支持多种模板、自定义编辑和多种导出方式。
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-600 hover:text-purple-600 transition-colors">首页</a>
              </li>
              <li>
                <a href="/templates" className="text-gray-600 hover:text-purple-600 transition-colors">模板库</a>
              </li>
              <li>
                <a href="/editor" className="text-gray-600 hover:text-purple-600 transition-colors">开始制作</a>
              </li>
              <li>
                <a href="/user/profile" className="text-gray-600 hover:text-purple-600 transition-colors">个人中心</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">支持</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">帮助中心</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">使用指南</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">常见问题</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-purple-600 transition-colors">联系我们</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-gray-500 flex items-center justify-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500" /> by 贺卡工坊团队
          </p>
          <p className="text-gray-400 text-sm mt-2">
            © 2024 贺卡工坊. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;