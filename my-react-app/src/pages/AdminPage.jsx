import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, Settings, Trash2, Edit2, Save, X, LayoutDashboard, Shield } from 'lucide-react';
import { messageApi, aiModelApi, authApi } from '../api';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [messages, setMessages] = useState([]);
  const [aiModels, setAiModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testingModelId, setTestingModelId] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingModel, setEditingModel] = useState(null);
  const [newModel, setNewModel] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [aiConfig, setAiConfig] = useState({
    systemPrompt: '你是岛屿守护灵，语气治愈且神秘。',
    auditPrompt: '如果是违规内容（色情、暴力、仇恨言论），请输出具体的违规原因；如果是安全的，仅输出 "safe"。',
    autoAudit: true,
    temperature: 0.7,
    maxTokens: 200,
    autoReply: true
  });
  const [auditStats, setAuditStats] = useState({ total: 0, violated: 0, frontendBlocked: 0, backendBlocked: 0, passed: 0 });

  useEffect(() => {
    checkAuth();
    if (activeTab === 'dashboard') {
      loadAuditStats();
    } else if (activeTab === 'messages') {
      loadMessages();
    } else if (activeTab === 'ai-models') {
      loadAiModels();
    } else if (activeTab === 'ai-audit') {
      loadAiConfig();
    }
  }, [activeTab]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await authApi.getUserInfo();
    } catch (error) {
      navigate('/login');
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const result = await messageApi.getAllMessagesForAdmin();
      if (result.code === 200) {
        setMessages(result.data.messages);
      }
    } catch (error) {
      console.error('加载留言失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditStats = async () => {
    try {
      const result = await aiModelApi.getAuditStats();
      if (result.code === 200) {
        setAuditStats(result.data);
      }
    } catch (error) {
      console.error('加载审核统计失败:', error);
    }
  };

  const loadAiConfig = async () => {
    try {
      const result = await aiModelApi.getAiConfig();
      if (result.code === 200) {
        setAiConfig({
          systemPrompt: result.data.systemPrompt || '你是岛屿守护灵，语气治愈且神秘。',
          auditPrompt: result.data.auditPrompt || '如果是违规内容（色情、暴力、仇恨言论），请输出具体的违规原因；如果是安全的，仅输出 "safe"。',
          autoAudit: result.data.autoAudit ?? true,
          temperature: result.data.temperature ?? 0.7,
          maxTokens: result.data.maxTokens ?? 200,
          autoReply: result.data.autoReply ?? true
        });
      }
    } catch (error) {
      console.error('加载AI配置失败:', error);
    }
  };

  const filteredMessages = () => {
    if (!searchText) return messages;
    const ft = searchText.toLowerCase();
    return messages.filter(m =>
      m.content?.toLowerCase().includes(ft) ||
      m.avatarType?.toLowerCase().includes(ft) ||
      m.secretCode?.toLowerCase().includes(ft)
    );
  };

  const loadAiModels = async () => {
    setLoading(true);
    try {
      const result = await aiModelApi.getAiModels();
      if (result.code === 200) {
        setAiModels(result.data);
      }
    } catch (error) {
      console.error('加载AI模型失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!confirm('确定要删除这条留言吗？')) return;
    try {
      await messageApi.deleteMessage(id);
      loadMessages();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleUpdateMessage = async (id, content) => {
    try {
      await messageApi.updateMessage(id, { content });
      setEditingMessage(null);
      loadMessages();
    } catch (error) {
      alert('更新失败');
    }
  };

  const handleTestModel = async (model) => {
    setTestingModelId(model.id);
    try {
      const result = await aiModelApi.testAiModel(model.id);
      if (result.code === 200) {
        alert(`测试成功！\n\n模型: ${model.name}\n响应: ${result.data}`);
      } else {
        alert(`测试失败: ${result.message}`);
      }
    } catch (error) {
      alert(`测试失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setTestingModelId(null);
    }
  };

  const handleSaveModel = async (model) => {
    try {
      if (model.id) {
        await aiModelApi.updateAiModel(model);
      } else {
        await aiModelApi.createAiModel(model);
      }
      setEditingModel(null);
      setNewModel(null);
      loadAiModels();
    } catch (error) {
      alert('保存失败');
    }
  };

  const handleDeleteModel = async (id) => {
    if (!confirm('确定要删除这个AI模型吗？')) return;
    try {
      await aiModelApi.deleteAiModel(id);
      loadAiModels();
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleSaveAiConfig = async () => {
    try {
      await aiModelApi.saveAiConfig(aiConfig);
      alert('配置保存成功！');
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05162a] via-[#0a1f3d] to-[#05162a] text-white">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">BlueIsland 管理后台</h1>
            <p className="text-blue-100/60 text-sm">欢迎回来，管理员</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-500/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <LayoutDashboard size={20} />
            仪表盘
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activeTab === 'messages'
                ? 'bg-blue-500/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <MessageSquare size={20} />
            留言管理
          </button>
          <button
            onClick={() => setActiveTab('ai-models')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activeTab === 'ai-models'
                ? 'bg-blue-500/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <Settings size={20} />
            AI模型设置
          </button>
          <button
            onClick={() => setActiveTab('ai-audit')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              activeTab === 'ai-audit'
                ? 'bg-blue-500/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <Shield size={20} />
            AI审核
          </button>
        </div>

        {activeTab === 'messages' && (
          <div className="space-y-4">
            {/* 搜索框 */}
            <div className="mb-6">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索关键词、作者或暗号..."
                className="w-full bg-white/5 rounded-2xl py-4 px-6 text-sm outline-none focus:bg-white/10 transition-all border border-white/5"
              />
            </div>

            {/* 筛选后的留言 */}
            {loading ? (
              <div className="text-center py-12 text-blue-100/60">加载中...</div>
            ) : filteredMessages().length === 0 ? (
              <div className="text-center py-12 text-blue-100/60">暂无留言</div>
            ) : (
              filteredMessages().map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                >
                  {editingMessage?.id === msg.id ? (
                    <div className="space-y-4">
                      <textarea
                        value={editingMessage.content}
                        onChange={(e) =>
                          setEditingMessage({ ...editingMessage, content: e.target.value })
                        }
                        className="w-full bg-black/20 rounded-xl p-4 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-blue-400 resize-none"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateMessage(msg.id, editingMessage.content)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-all"
                        >
                          <Save size={16} />
                          保存
                        </button>
                        <button
                          onClick={() => setEditingMessage(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 rounded-xl transition-all"
                        >
                          <X size={16} />
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={msg.avatarUrl}
                            alt=""
                            className="w-12 h-12 rounded-xl border border-white/20"
                          />
                          <div>
                            <div className="font-medium">
                              {msg.avatarType === 'qq' ? `QQ用户(${msg.avatarId})` : '匿名岛民'}
                            </div>
                            <div className="text-xs text-blue-100/60">
                              {new Date(msg.createTime).toLocaleString()} • {msg.ipLocation} • {msg.browser}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingMessage(msg)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-blue-50/90 whitespace-pre-wrap">{msg.content}</p>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <p className="text-blue-100/60 text-xs font-bold uppercase tracking-wider mb-2">审核总数</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-4xl font-bold">{auditStats.total}</h3>
                  <span className="text-green-400 text-xs font-medium">Total</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-red-500/10">
                <p className="text-blue-100/60 text-xs font-bold uppercase tracking-wider mb-2">拦截数</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-4xl font-bold text-red-400">{auditStats.frontendBlocked}</h3>
                  <span className="text-red-400/50 text-xs font-medium">
                    {auditStats.total > 0 ? Math.round((auditStats.frontendBlocked / auditStats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-green-500/10">
                <p className="text-blue-100/60 text-xs font-bold uppercase tracking-wider mb-2">通过数</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-4xl font-bold text-green-400">{auditStats.passed}</h3>
                  <span className="text-green-400/50 text-xs font-medium">
                    {auditStats.total > 0 ? Math.round((auditStats.passed / auditStats.total) * 100) : 100}%
                  </span>
                </div>
              </div>
            </div>

            {/* 内容审核图表 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h4 className="font-bold mb-4">内容审核概览</h4>
              <div className="flex items-center justify-center gap-8">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="40"
                      stroke="rgba(59, 130, 246, 0.2)"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="50" cy="50" r="40"
                      stroke="#22c55e"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(auditStats.total > 0 ? (auditStats.passed / auditStats.total) * 251.2 : 0)} 251.2`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {auditStats.total > 0 ? Math.round((auditStats.passed / auditStats.total) * 100) : 100}%
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm">通过 ({auditStats.passed})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm">拦截 ({auditStats.frontendBlocked})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 最新留言预览 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h4 className="font-bold mb-4">最新留言预览</h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.slice(0, 5).map((msg) => (
                  <div key={msg.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <img src={msg.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{msg.content}</p>
                      <p className="text-[10px] text-blue-100/40">{msg.createTime ? new Date(msg.createTime).toLocaleString() : '刚刚'}</p>
                    </div>
                    {msg.isViolated && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded uppercase">Violated</span>
                    )}
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-8 text-blue-100/40">暂无留言数据</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-models' && (
          <div className="space-y-4">
            <button
              onClick={() =>
                setNewModel({
                  name: '',
                  type: 'openai',
                  apiKey: '',
                  apiUrl: '',
                  model: '',
                  isDefault: false,
                  isEnabled: true,
                  remark: '',
                })
              }
              className="px-6 py-3 bg-blue-500/50 hover:bg-blue-500/60 rounded-xl transition-all"
            >
              + 添加新模型
            </button>

            {newModel && (
              <ModelForm
                model={newModel}
                onChange={setNewModel}
                onSave={() => handleSaveModel(newModel)}
                onCancel={() => setNewModel(null)}
              />
            )}

            {loading ? (
              <div className="text-center py-12 text-blue-100/60">加载中...</div>
            ) : (
              aiModels.map((model) =>
                editingModel?.id === model.id ? (
                  <ModelForm
                    key={model.id}
                    model={editingModel}
                    onChange={setEditingModel}
                    onSave={() => handleSaveModel(editingModel)}
                    onCancel={() => setEditingModel(null)}
                  />
                ) : (
                  <div
                    key={model.id}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">{model.name}</h3>
                          {model.isDefault && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-lg">
                              默认
                            </span>
                          )}
                          {!model.isEnabled && (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-lg">
                              已禁用
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-blue-100/60 space-y-1">
                          <div>类型: {model.type}</div>
                          <div>模型: {model.model}</div>
                          <div>API地址: {model.apiUrl}</div>
                          {model.remark && <div>备注: {model.remark}</div>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTestModel(model)}
                          disabled={testingModelId === model.id}
                          className={`px-3 py-1 text-xs rounded-lg transition-all ${
                            testingModelId === model.id
                              ? 'bg-green-500/10 text-green-300/50 cursor-not-allowed'
                              : 'bg-green-500/20 hover:bg-green-500/30'
                          }`}
                        >
                          {testingModelId === model.id ? '测试中...' : '测试'}
                        </button>
                        <button
                          onClick={() => setEditingModel(model)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteModel(model.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        )}

        {activeTab === 'ai-audit' && (
          <div className="max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 左侧：人格和审核 */}
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
                  <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-4">系统人格 (System Instruction)</label>
                  <textarea
                    value={aiConfig.systemPrompt}
                    onChange={(e) => setAiConfig({ ...aiConfig, systemPrompt: e.target.value })}
                    rows={8}
                    className="w-full bg-white/[0.03] rounded-2xl p-4 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all resize-none leading-relaxed"
                    placeholder="例如：你是一个温暖的岛屿守护者..."
                  />
                  <p className="mt-3 text-[10px] opacity-20 italic">提示：此内容将作为 AI 回响的基本行为准则。</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
                  <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-4">审核策略</label>
                  <textarea
                    value={aiConfig.auditPrompt}
                    onChange={(e) => setAiConfig({ ...aiConfig, auditPrompt: e.target.value })}
                    rows={6}
                    className="w-full bg-white/[0.03] rounded-2xl p-4 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all resize-none"
                    placeholder="如果是违规内容，请输出违规原因；如果是安全的，输出 'safe'..."
                  />
                </div>
              </div>

              {/* 右侧：参数设置 */}
              <div className="space-y-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Temperature (随机性)</label>
                    <span className="text-blue-400 font-mono text-sm">{aiConfig.temperature}</span>
                  </div>
                  <input
                    type="range"
                    value={aiConfig.temperature}
                    onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                    min="0"
                    max="2"
                    step="0.1"
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer mb-2"
                  />
                  <div className="flex justify-between text-[8px] opacity-20 font-bold uppercase tracking-tighter">
                    <span>精确/严谨</span>
                    <span>平衡</span>
                    <span>狂野/创意</span>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Max Output Tokens</label>
                    <span className="text-blue-400 font-mono text-sm">{aiConfig.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    value={aiConfig.maxTokens}
                    onChange={(e) => setAiConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) })}
                    min="50"
                    max="500"
                    step="10"
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
                  <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-4">响应触发规则</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                      <span className="text-xs opacity-60">自动回响新留言</span>
                      <button
                        onClick={() => setAiConfig({ ...aiConfig, autoReply: !aiConfig.autoReply })}
                        className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
                          aiConfig.autoReply ? 'bg-blue-600' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                          style={{ transform: aiConfig.autoReply ? 'translateX(20px)' : 'none' }}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                      <span className="text-xs opacity-60">启用 AI 实时审核</span>
                      <button
                        onClick={() => setAiConfig({ ...aiConfig, autoAudit: !aiConfig.autoAudit })}
                        className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
                          aiConfig.autoAudit ? 'bg-blue-600' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                          style={{ transform: aiConfig.autoAudit ? 'translateX(20px)' : 'none' }}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveAiConfig}
                  className="w-full py-4 bg-white text-blue-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                >
                  保存 AI 配置到岛屿
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModelForm({ model, onChange, onSave, onCancel }) {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-blue-100/60 mb-2">模型名称</label>
          <input
            type="text"
            value={model.name}
            onChange={(e) => onChange({ ...model, name: e.target.value })}
            className="w-full bg-black/20 rounded-xl p-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs text-blue-100/60 mb-2">类型</label>
          <select
            value={model.type}
            onChange={(e) => onChange({ ...model, type: e.target.value })}
            className="w-full bg-black/20 rounded-xl p-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-blue-400"
          >
            <option value="openai">OpenAI</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="other">其他</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-blue-100/60 mb-2">API Key</label>
        <input
          type="password"
          value={model.apiKey}
          onChange={(e) => onChange({ ...model, apiKey: e.target.value })}
          className="w-full bg-black/20 rounded-xl p-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-blue-100/60 mb-2">API地址</label>
          <input
            type="text"
            value={model.apiUrl}
            onChange={(e) => onChange({ ...model, apiUrl: e.target.value })}
            className="w-full bg-black/20 rounded-xl p-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs text-blue-100/60 mb-2">模型名称</label>
          <input
            type="text"
            value={model.model}
            onChange={(e) => onChange({ ...model, model: e.target.value })}
            className="w-full bg-black/20 rounded-xl p-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-blue-100/60 mb-2">备注</label>
        <input
          type="text"
          value={model.remark}
          onChange={(e) => onChange({ ...model, remark: e.target.value })}
          className="w-full bg-black/20 rounded-xl p-3 text-sm outline-none border border-white/5 focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={model.isDefault}
            onChange={(e) => onChange({ ...model, isDefault: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm">设为默认</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={model.isEnabled}
            onChange={(e) => onChange({ ...model, isEnabled: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-sm">启用</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-all"
        >
          <Save size={16} />
          保存
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 rounded-xl transition-all"
        >
          <X size={16} />
          取消
        </button>
      </div>
    </div>
  );
}
