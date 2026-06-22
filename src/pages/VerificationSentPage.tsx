import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';

const VerificationSentPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">验证邮件已发送</h1>
            <p className="text-gray-500">
              我们已向您的邮箱发送了一封验证邮件
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">请查收邮件完成验证</h3>
                <p className="text-sm text-gray-600 mb-3">
                  点击邮件中的验证链接来激活您的账号。验证完成后，您就可以登录使用所有功能了。
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• 检查您的垃圾邮件文件夹</p>
                  <p>• 验证链接将在24小时后失效</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              to="/auth/login"
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              返回登录
            </Link>
            
            <Link
              to="/"
              className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              返回首页
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              没有收到邮件？
              <Link to="/auth/register" className="text-purple-600 hover:text-purple-700 font-medium ml-1">
                重新注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationSentPage;
