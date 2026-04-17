import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { authApi } from '../api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isInitMode, setIsInitMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isInitMode
        ? await authApi.initAdmin({ username, password })
        : await authApi.login({ username, password });

      if (result.code === 200) {
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        navigate('/admin');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError(err.response?.data?.message || '登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05162a] via-[#0a1f3d] to-[#05162a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-blue-400/30 rounded-full flex items-center justify-center mb-4 backdrop-blur-md shadow-inner border border-white/20">
              <div className="text-4xl">🌙</div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">BlueIsland</h1>
            <p className="text-sm text-blue-100/60">
              {isInitMode ? '初始化管理员账户' : '管理员登录'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs text-blue-100/60 mb-2 tracking-widest">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 rounded-xl p-3 text-sm text-white outline-none border border-white/5 focus:ring-2 focus:ring-blue-400 transition-all"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-blue-100/60 mb-2 tracking-widest">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 rounded-xl p-3 text-sm text-white outline-none border border-white/5 focus:ring-2 focus:ring-blue-400 transition-all"
                placeholder="请输入密码"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-medium text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                '处理中...'
              ) : isInitMode ? (
                <>
                  <UserPlus size={18} />
                  初始化管理员
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  登录
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsInitMode(!isInitMode);
                  setError('');
                }}
                className="text-xs text-blue-300 hover:text-blue-100 transition-colors"
              >
                {isInitMode ? '已有账户？返回登录' : '首次使用？初始化管理员'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-blue-100/40 hover:text-blue-100 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
