import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, Shield, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { signUp, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/user/profile');
    }
  }, [isAuthenticated, navigate]);

  const checkPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  };

  const getPasswordStrengthLabel = (score: number) => {
    if (score <= 2) return { label: '弱', color: 'text-red-500', bg: 'bg-red-500' };
    if (score <= 3) return { label: '中', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    if (score <= 4) return { label: '强', color: 'text-blue-500', bg: 'bg-blue-500' };
    return { label: '非常强', color: 'text-green-500', bg: 'bg-green-500' };
  };

  const passwordStrength = checkPasswordStrength(password);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError('请填写所有字段');
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setError('密码强度不足，请使用更复杂的密码（至少8位，包含大小写字母和数字）');
      setIsLoading(false);
      return;
    }

    const result = await signUp(email, password, name);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || '注册失败');
    } else {
      // 注册成功，跳转到验证邮件提示页面
      navigate('/auth/verification-sent', { state: { email } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">创建账户</h1>
            <p className="text-gray-500 mt-2">注册账户，开始制作您的专属贺卡</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="输入您的用户名"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入您的邮箱"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入您的密码"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">密码强度</span>
                    <span className={`text-xs font-medium ${strengthInfo.color}`}>{strengthInfo.label}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full transition-all ${
                          level <= passwordStrength ? strengthInfo.bg : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 space-y-1">
                <div className={`flex items-center gap-2 text-xs ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                  {password.length >= 8 ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 border border-gray-300 rounded" />}
                  <span>至少8个字符</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${/(?=.*[a-z])/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {/(?=.*[a-z])/.test(password) ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 border border-gray-300 rounded" />}
                  <span>包含小写字母</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${/(?=.*[A-Z])/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {/(?=.*[A-Z])/.test(password) ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 border border-gray-300 rounded" />}
                  <span>包含大写字母</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${/(?=.*[0-9])/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                  {/(?=.*[0-9])/.test(password) ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 border border-gray-300 rounded" />}
                  <span>包含数字</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-200 focus:ring-purple-500'
                  }`}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500">两次密码输入不一致</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/auth/login"
                className="text-gray-600 hover:text-purple-600 font-medium transition-colors"
              >
                已有账户，立即登录
              </Link>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">
              注册即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;