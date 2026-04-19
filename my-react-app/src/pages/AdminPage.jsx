import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MessageSquare, Settings, Trash2, Edit2, Save, X, LayoutDashboard, Shield, Music, BarChart3, Users, Eye, RefreshCw, Mail, ShieldAlert, Ghost } from 'lucide-react';
import { messageApi, aiModelApi, authApi, musicApi, accessApi, emailConfigApi, securityApi } from '../api';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [messages, setMessages] = useState([]);
  const [aiModels, setAiModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
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
  const [musicConfig, setMusicConfig] = useState({
    defaultPlaybackMode: 'loop',
    defaultVolume: 70,
    enabled: true,
    ambientEnabled: true,
    ambientVolume: 50,
    ambientWavesUrl: '',
    ambientRainUrl: '',
    ambientFireUrl: '',
    remark: ''
  });
  const [musicStats, setMusicStats] = useState({
    totalSearches: 0,
    totalPlays: 0,
    totalErrors: 0,
    todaySearches: 0,
    todayPlays: 0,
    recentLogs: []
  });
  const [accessStats, setAccessStats] = useState({
    totalVisits: 0,
    todayVisits: 0,
    onlineUsers: 0,
    uniqueIps: 0,
    recentUsers: [],
    pageOnlineUsers: {}
  });
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: '',
    smtpPort: 587,
    enableSsl: true,
    fromEmail: '',
    fromName: '',
    smtpUsername: '',
    smtpPassword: '',
    enabled: false,
    remark: ''
  });
  const [securitySettings, setSecuritySettings] = useState({
    maxRequestsPerMinute: 100,
    violationThreshold: 3,
    banDurationMinutes: 5,
    enableSignatureCheck: true,
    enableRefererCheck: false,
    allowedRefererDomains: '',
    enableIpBlockList: true
  });
  const [securityStats, setSecurityStats] = useState({ totalLogs: 0, todayLogs: 0, eventTypes: {}, topIps: {} });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [blockedIps, setBlockedIps] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  // 心跳 - 保持在线状态
  useEffect(() => {
    const getSessionId = () => {
      let sessionId = localStorage.getItem('visitorSessionId');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('visitorSessionId', sessionId);
      }
      return sessionId;
    };

    const sendHeartbeat = async () => {
      try {
        const sessionId = getSessionId();
        await accessApi.heartbeat('admin', sessionId);
      } catch (error) {
        console.error('心跳失败:', error);
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (activeTab === 'dashboard') {
      loadAuditStats();
    } else if (activeTab === 'messages') {
      loadMessages();
    } else if (activeTab === 'ai-models') {
      loadAiModels();
    } else if (activeTab === 'ai-audit') {
      loadAiConfig();
    } else if (activeTab === 'music-settings') {
      loadMusicConfig();
      loadMusicStats();
    } else if (activeTab === 'access-stats') {
      loadAccessStats();
    } else if (activeTab === 'email-settings') {
      loadEmailConfig();
    } else if (activeTab === 'reports') {
      loadMessages();
    } else if (activeTab === 'security') {
      loadSecurityStats();
      loadSecurityLogs();
      loadBlockedIps();
      loadSecuritySettings();
    }
  }, [activeTab, authChecked]);

  // 当在访问统计页面时，定时静默刷新数据
  useEffect(() => {
    if (activeTab !== 'access-stats') return;

    const interval = setInterval(() => {
      loadAccessStats();
    }, 10000); // 每10秒刷新一次

    return () => clearInterval(interval);
  }, [activeTab]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthChecked(true);
      navigate('/login');
      return;
    }
    try {
      const result = await authApi.getUserInfo();
      setAuthChecked(true);
      if (result.code !== 200) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (error) {
      setAuthChecked(true);
      console.error('验证失败:', error);
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

  const handleResetReportCount = async (id) => {
    if (!confirm('确定要忽略该留言的举报吗？')) return;
    try {
      await messageApi.resetReportCount(id);
      loadMessages();
    } catch (error) {
      alert('操作失败');
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

  const loadMusicConfig = async () => {
    try {
      const result = await musicApi.getMusicConfig();
      if (result.code === 200) {
        setMusicConfig({
          defaultPlaybackMode: result.data.defaultPlaybackMode || 'loop',
          defaultVolume: result.data.defaultVolume || 70,
          enabled: result.data.enabled ?? true,
          ambientEnabled: result.data.ambientEnabled ?? true,
          ambientVolume: result.data.ambientVolume ?? 50,
          ambientWavesUrl: result.data.ambientWavesUrl || '',
          ambientRainUrl: result.data.ambientRainUrl || '',
          ambientFireUrl: result.data.ambientFireUrl || '',
          remark: result.data.remark || ''
        });
      }
    } catch (error) {
      console.error('加载音乐配置失败:', error);
    }
  };

  const loadMusicStats = async () => {
    try {
      const result = await musicApi.getMusicStats();
      if (result.code === 200) {
        setMusicStats(result.data);
      }
    } catch (error) {
      console.error('加载音乐统计失败:', error);
    }
  };

  const handleSaveMusicConfig = async () => {
    try {
      await musicApi.saveMusicConfig(musicConfig);
      alert('音乐配置保存成功！');
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  const loadAccessStats = async () => {
    try {
      const result = await accessApi.getStats();
      if (result.code === 200) {
        setAccessStats({
          totalVisits: result.data.totalVisits || 0,
          todayVisits: result.data.todayVisits || 0,
          onlineUsers: result.data.onlineUsers || 0,
          uniqueIps: result.data.uniqueIps || 0,
          recentUsers: result.data.recentUsers || [],
          pageOnlineUsers: result.data.pageOnlineUsers || {}
        });
      }
    } catch (error) {
      console.error('加载访问统计失败:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const loadEmailConfig = async () => {
    try {
      const result = await emailConfigApi.getConfig();
      if (result.code === 200) {
        setEmailConfig({
          smtpHost: result.data.smtpHost || '',
          smtpPort: result.data.smtpPort || 587,
          enableSsl: result.data.enableSsl ?? true,
          fromEmail: result.data.fromEmail || '',
          fromName: result.data.fromName || '',
          smtpUsername: result.data.smtpUsername || '',
          smtpPassword: result.data.smtpPassword || '',
          enabled: result.data.enabled ?? false,
          remark: result.data.remark || ''
        });
      }
    } catch (error) {
      console.error('加载邮箱配置失败:', error);
    }
  };

  const handleSaveEmailConfig = async () => {
    try {
      await emailConfigApi.saveConfig(emailConfig);
      alert('邮箱配置保存成功！');
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  const handleTestEmailConfig = async () => {
    try {
      const result = await emailConfigApi.testConfig(emailConfig);
      if (result.code === 200) {
        alert('测试成功！' + (result.message || ''));
      } else {
        alert('测试失败: ' + (result.message || '未知错误'));
      }
    } catch (error) {
      alert('测试失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 安全相关
  const loadSecurityStats = async () => {
    try {
      const result = await securityApi.getStats();
      if (result.code === 200) {
        setSecurityStats({
          totalLogs: result.data.totalLogs || 0,
          todayLogs: result.data.todayLogs || 0,
          eventTypes: result.data.eventTypes || {},
          topIps: result.data.topIps || {}
        });
      }
    } catch (error) {
      console.error('加载安全统计失败:', error);
    }
  };

  const loadSecurityLogs = async (page = 1, pageSize = 50) => {
    try {
      const result = await securityApi.getLogs(page, pageSize);
      if (result.code === 200) {
        setSecurityLogs(result.data.list || []);
      }
    } catch (error) {
      console.error('加载安全日志失败:', error);
    }
  };

  const loadBlockedIps = async () => {
    try {
      const result = await securityApi.getBlockedIps();
      if (result.code === 200) {
        setBlockedIps(result.data || []);
      }
    } catch (error) {
      console.error('加载封禁IP失败:', error);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const result = await securityApi.getSettings();
      if (result.code === 200) {
        setSecuritySettings({
          maxRequestsPerMinute: result.data.maxRequestsPerMinute || 100,
          violationThreshold: result.data.violationThreshold || 3,
          banDurationMinutes: result.data.banDurationMinutes || 5,
          enableSignatureCheck: result.data.enableSignatureCheck ?? true,
          enableRefererCheck: result.data.enableRefererCheck ?? false,
          allowedRefererDomains: result.data.allowedRefererDomains || '',
          enableIpBlockList: result.data.enableIpBlockList ?? true
        });
      }
    } catch (error) {
      console.error('加载安全设置失败:', error);
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      await securityApi.saveSettings(securitySettings);
      alert('安全设置保存成功！');
    } catch (error) {
      alert('保存失败，请重试');
    }
  };

  const handleUnblockIp = async (ip) => {
    if (!confirm(`确定要解封 IP ${ip} 吗？`)) return;
    try {
      await securityApi.unblockIp(ip);
      loadBlockedIps();
      alert('解封成功');
    } catch (error) {
      alert('解封失败');
    }
  };

  const handleBlockIp = async () => {
    const ip = prompt('请输入要封禁的 IP 地址:');
    if (!ip) return;
    const reason = prompt('请输入封禁原因 (可选):') || '';
    try {
      await securityApi.blockIp({ ipAddress: ip, reason });
      loadBlockedIps();
      alert('封禁成功');
    } catch (error) {
      alert('封禁失败');
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#05162a] via-[#0a1f3d] to-[#05162a] flex items-center justify-center">
        <div className="text-blue-100/60">验证中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030b16] text-white flex p-6 font-sans">
      {/* 侧边栏 - 浮空大圆角设计 */}
      <nav className="fixed left-6 top-6 bottom-6 w-64 bg-[#081220]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] flex flex-col p-6 shadow-2xl z-50">
        {/* Logo 区 */}
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Ghost size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider">BlueIsland</span>
            <span className="text-[10px] opacity-40 uppercase">管理后台</span>
          </div>
        </div>

        {/* 菜单列表 */}
        <div className="flex-1 space-y-2">
          <div className="text-[10px] text-white/20 font-bold tracking-[0.2em] mb-4 px-2 uppercase">Main Menu</div>
          {[
            { id: 'dashboard', label: '仪表盘', icon: <LayoutDashboard size={20} /> },
            { id: 'messages', label: '留言管理', icon: <MessageSquare size={20} /> },
            { id: 'ai-models', label: 'AI模型设置', icon: <Settings size={20} /> },
            { id: 'ai-audit', label: 'AI审核', icon: <Shield size={20} /> },
            { id: 'music-settings', label: '音乐设置', icon: <Music size={20} /> },
            { id: 'email-settings', label: '邮箱设置', icon: <Mail size={20} /> },
            { id: 'access-stats', label: '访问统计', icon: <BarChart3 size={20} /> },
            { id: 'reports', label: '举报审核', icon: <ShieldAlert size={20} /> },
            { id: 'security', label: '安全监控', icon: <Shield size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium tracking-wide">{item.label}</span>
              {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
            </button>
          ))}
        </div>

        {/* 底部退出 */}
        <div className="mt-auto pt-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">退出登录</span>
          </button>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="flex-1 ml-72 animate-in fade-in duration-700">
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

        {activeTab === 'music-settings' && (
          <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">总搜索次数</div>
                <div className="text-3xl font-bold text-blue-400">{musicStats.totalSearches}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">总播放次数</div>
                <div className="text-3xl font-bold text-green-400">{musicStats.totalPlays}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">今日搜索</div>
                <div className="text-3xl font-bold text-purple-400">{musicStats.todaySearches}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">今日播放</div>
                <div className="text-3xl font-bold text-orange-400">{musicStats.todayPlays}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 左侧：音乐配置 */}
              <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 space-y-6">
                <h3 className="text-sm font-bold">音乐功能设置</h3>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                  <span className="text-xs opacity-60">启用音乐功能</span>
                  <button
                    onClick={() => setMusicConfig({ ...musicConfig, enabled: !musicConfig.enabled })}
                    className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
                      musicConfig.enabled ? 'bg-blue-600' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                      style={{ transform: musicConfig.enabled ? 'translateX(20px)' : 'none' }}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                  <span className="text-xs opacity-60">启用白噪音功能</span>
                  <button
                    onClick={() => setMusicConfig({ ...musicConfig, ambientEnabled: !musicConfig.ambientEnabled })}
                    className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
                      musicConfig.ambientEnabled ? 'bg-blue-600' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                      style={{ transform: musicConfig.ambientEnabled ? 'translateX(20px)' : 'none' }}
                    />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">默认播放模式</label>
                  </div>
                  <div className="flex gap-2">
                    {['loop', 'sequential', 'random'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setMusicConfig({ ...musicConfig, defaultPlaybackMode: mode })}
                        className={`flex-1 py-2 rounded-xl text-xs transition-all ${
                          musicConfig.defaultPlaybackMode === mode
                            ? 'bg-blue-500 shadow-md'
                            : 'bg-white/5 opacity-40 hover:opacity-100'
                        }`}
                      >
                        {mode === 'loop' ? '🔁 循环' : mode === 'sequential' ? '🔂 顺序' : '🔀 随机'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">默认音量</label>
                    <span className="text-blue-400 font-mono text-sm">{musicConfig.defaultVolume}%</span>
                  </div>
                  <input
                    type="range"
                    value={musicConfig.defaultVolume}
                    onChange={(e) => setMusicConfig({ ...musicConfig, defaultVolume: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                    step="5"
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">白噪音音量</label>
                    <span className="text-blue-400 font-mono text-sm">{musicConfig.ambientVolume}%</span>
                  </div>
                  <input
                    type="range"
                    value={musicConfig.ambientVolume}
                    onChange={(e) => setMusicConfig({ ...musicConfig, ambientVolume: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                    step="5"
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">白噪音链接 (MP3)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60 w-12">🌊 海浪</span>
                    <input
                      type="text"
                      value={musicConfig.ambientWavesUrl || ''}
                      onChange={(e) => setMusicConfig({ ...musicConfig, ambientWavesUrl: e.target.value })}
                      className="flex-1 bg-white/[0.03] rounded-xl px-3 py-2 text-xs outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60 w-12">🌧️ 雨声</span>
                    <input
                      type="text"
                      value={musicConfig.ambientRainUrl || ''}
                      onChange={(e) => setMusicConfig({ ...musicConfig, ambientRainUrl: e.target.value })}
                      className="flex-1 bg-white/[0.03] rounded-xl px-3 py-2 text-xs outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-60 w-12">🔥 篝火</span>
                    <input
                      type="text"
                      value={musicConfig.ambientFireUrl || ''}
                      onChange={(e) => setMusicConfig({ ...musicConfig, ambientFireUrl: e.target.value })}
                      className="flex-1 bg-white/[0.03] rounded-xl px-3 py-2 text-xs outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-3">备注</label>
                  <textarea
                    value={musicConfig.remark || ''}
                    onChange={(e) => setMusicConfig({ ...musicConfig, remark: e.target.value })}
                    rows={3}
                    className="w-full bg-white/[0.03] rounded-2xl p-4 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all resize-none"
                    placeholder="音乐功能备注信息..."
                  />
                </div>

                <button
                  onClick={handleSaveMusicConfig}
                  className="w-full py-4 bg-white text-blue-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                >
                  保存音乐配置
                </button>
              </div>

              {/* 右侧：操作日志 */}
              <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={18} className="text-blue-400" />
                  <h3 className="text-sm font-bold">最近操作记录</h3>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {musicStats.recentLogs && musicStats.recentLogs.length > 0 ? (
                    musicStats.recentLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-white/[0.02] text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold ${
                            log.action === 'search' ? 'text-purple-400' :
                            log.action === 'play' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {log.action === 'search' ? '🔍 搜索' : log.action === 'play' ? '▶️ 播放' : '❌ 错误'}
                          </span>
                          <span className="opacity-40">{log.CreateTime ? new Date(log.CreateTime).toLocaleString() : ''}</span>
                        </div>
                        <div className="opacity-60 truncate">{log.songName || '未知歌曲'}</div>
                        {log.errorMessage && (
                          <div className="text-red-400/60 text-[10px] mt-1 truncate">{log.errorMessage}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 opacity-40 text-xs">暂无操作记录</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access-stats' && (
          <div className="space-y-6">
            {/* 标题和刷新按钮 */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">访问统计</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-40">自动刷新中</span>
                <button
                  onClick={loadAccessStats}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-all flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  刷新
                </button>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">总访问量</div>
                <div className="text-3xl font-bold text-blue-400">{accessStats.totalVisits}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">今日访问</div>
                <div className="text-3xl font-bold text-green-400">{accessStats.todayVisits}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">当前在线</div>
                <div className="text-3xl font-bold text-purple-400">{accessStats.onlineUsers}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">今日独立IP</div>
                <div className="text-3xl font-bold text-orange-400">{accessStats.uniqueIps}</div>
              </div>
            </div>

            {/* 各页面在线人数 */}
            {accessStats.pageOnlineUsers && Object.keys(accessStats.pageOnlineUsers).length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-4">各页面在线人数</div>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(accessStats.pageOnlineUsers).map(([page, count]) => (
                    <div key={page} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                      <span className="text-xs opacity-60">{page === 'home' ? '🏠 首页' : page === 'admin' ? '⚙️ 管理后台' : page}</span>
                      <span className="text-lg font-bold text-blue-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 在线用户列表 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <Users size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold">最近活跃用户</h3>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {accessStats.recentUsers && accessStats.recentUsers.length > 0 ? (
                  accessStats.recentUsers.map((user, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.02] text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye size={12} className="opacity-40" />
                        <span className="font-mono">{user.ipAddress}</span>
                        {user.country && (
                          <span className="text-[9px] opacity-50">{user.country} {user.province} {user.city}</span>
                        )}
                      </div>
                      <span className="opacity-40 text-[10px]">
                        {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 opacity-40 text-xs">暂无数据</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email-settings' && (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <Mail size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold">邮箱 SMTP 配置</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">SMTP 服务器</label>
                    <input
                      type="text"
                      value={emailConfig.smtpHost}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                      className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">SMTP 端口</label>
                    <input
                      type="number"
                      value={emailConfig.smtpPort}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) })}
                      className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                      placeholder="587"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-xs opacity-60">启用 SSL</span>
                    <button
                      onClick={() => setEmailConfig({ ...emailConfig, enableSsl: !emailConfig.enableSsl })}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
                        emailConfig.enableSsl ? 'bg-blue-600' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                        style={{ transform: emailConfig.enableSsl ? 'translateX(20px)' : 'none' }}
                      />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">发件人邮箱</label>
                    <input
                      type="email"
                      value={emailConfig.fromEmail}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                      className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                      placeholder="noreply@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">发件人名称</label>
                    <input
                      type="text"
                      value={emailConfig.fromName}
                      onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                      className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                      placeholder="BlueIsland"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">SMTP 用户名</label>
                    <input
                      type="text"
                      value={emailConfig.smtpUsername}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpUsername: e.target.value })}
                      className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                      placeholder="your email"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">SMTP 密码</label>
                    <input
                      type="password"
                      value={emailConfig.smtpPassword}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                      className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                      placeholder="your password"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">备注</label>
                <textarea
                  value={emailConfig.remark || ''}
                  onChange={(e) => setEmailConfig({ ...emailConfig, remark: e.target.value })}
                  rows={3}
                  className="w-full bg-white/[0.03] rounded-2xl p-4 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all resize-none"
                  placeholder="邮箱配置备注信息..."
                />
              </div>

              <div className="flex items-center justify-between mt-6 p-3 rounded-xl bg-white/[0.02]">
                <span className="text-xs opacity-60">启用邮箱通知</span>
                <button
                  onClick={() => setEmailConfig({ ...emailConfig, enabled: !emailConfig.enabled })}
                  className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
                    emailConfig.enabled ? 'bg-blue-600' : 'bg-white/10'
                  }`}
                >
                  <div
                    className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                    style={{ transform: emailConfig.enabled ? 'translateX(20px)' : 'none' }}
                  />
                </button>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSaveEmailConfig}
                  className="flex-1 py-4 bg-white text-blue-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                >
                  保存配置
                </button>
                <button
                  onClick={handleTestEmailConfig}
                  className="px-6 py-4 bg-green-500/20 hover:bg-green-500/30 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  测试连接
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">举报审核</h2>
            {loading ? (
              <div className="text-center py-12 text-blue-100/60">加载中...</div>
            ) : messages.filter(m => m.reportCount > 0).length === 0 ? (
              <div className="text-center py-12 text-blue-100/60">暂无被举报的留言</div>
            ) : (
              messages.filter(m => m.reportCount > 0).map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                >
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
                          {new Date(msg.createTime).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        举报 {msg.reportCount} 次
                      </span>
                      {msg.isHidden && (
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                          已屏蔽
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-blue-50/90 whitespace-pre-wrap mb-4">{msg.content}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResetReportCount(msg.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl transition-all text-sm"
                    >
                      <ShieldAlert size={16} />
                      忽略举报
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition-all text-sm"
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                    {msg.isHidden && (
                      <button
                        onClick={() => handleUpdateMessage(msg.id, msg.content)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-all text-sm"
                      >
                        <Eye size={16} />
                        取消屏蔽
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">总安全事件</div>
                <div className="text-3xl font-bold text-blue-400">{securityStats.totalLogs}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">今日事件</div>
                <div className="text-3xl font-bold text-orange-400">{securityStats.todayLogs}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">频率限制</div>
                <div className="text-3xl font-bold text-purple-400">{securityStats.eventTypes['RATE_LIMIT'] || 0}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">IP封禁</div>
                <div className="text-3xl font-bold text-red-400">{blockedIps.length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 左侧：安全设置 */}
              <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={18} className="text-blue-400" />
                  <h3 className="text-sm font-bold">安全策略设置</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">每分钟最大请求数</label>
                    <input
                      type="number"
                      value={securitySettings.maxRequestsPerMinute}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, maxRequestsPerMinute: parseInt(e.target.value) || 100 })}
                      className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">违规阈值</label>
                    <input
                      type="number"
                      value={securitySettings.violationThreshold}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, violationThreshold: parseInt(e.target.value) || 3 })}
                      className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">封禁时长（分钟）</label>
                  <input
                    type="number"
                    value={securitySettings.banDurationMinutes}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, banDurationMinutes: parseInt(e.target.value) || 5 })}
                    className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-xs opacity-60">启用签名校验</span>
                    <button
                      onClick={() => setSecuritySettings({ ...securitySettings, enableSignatureCheck: !securitySettings.enableSignatureCheck })}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
                        securitySettings.enableSignatureCheck ? 'bg-blue-600' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                        style={{ transform: securitySettings.enableSignatureCheck ? 'translateX(20px)' : 'none' }}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-xs opacity-60">启用 Referer 检查</span>
                    <button
                      onClick={() => setSecuritySettings({ ...securitySettings, enableRefererCheck: !securitySettings.enableRefererCheck })}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
                        securitySettings.enableRefererCheck ? 'bg-blue-600' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                        style={{ transform: securitySettings.enableRefererCheck ? 'translateX(20px)' : 'none' }}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                    <span className="text-xs opacity-60">启用 IP 黑名单</span>
                    <button
                      onClick={() => setSecuritySettings({ ...securitySettings, enableIpBlockList: !securitySettings.enableIpBlockList })}
                      className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
                        securitySettings.enableIpBlockList ? 'bg-blue-600' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all"
                        style={{ transform: securitySettings.enableIpBlockList ? 'translateX(20px)' : 'none' }}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">允许的 Referer 域名</label>
                  <input
                    type="text"
                    value={securitySettings.allowedRefererDomains}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, allowedRefererDomains: e.target.value })}
                    className="w-full bg-white/[0.03] rounded-xl px-4 py-3 text-sm outline-none border border-white/5 focus:border-blue-500/50 transition-all"
                    placeholder="localhost:5174,localhost:3000"
                  />
                </div>

                <button
                  onClick={handleSaveSecuritySettings}
                  className="w-full py-4 bg-white text-blue-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                >
                  保存安全设置
                </button>
              </div>

              {/* 右侧：封禁的 IP */}
              <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-red-400" />
                    <h3 className="text-sm font-bold">临时封禁 IP</h3>
                  </div>
                  <button
                    onClick={handleBlockIp}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-xs transition-all"
                  >
                    + 手动封禁
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {blockedIps.length > 0 ? (
                    blockedIps.map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.02] text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-red-400">{item.ip}</span>
                          <span className="opacity-40 ml-2">{item.reason}</span>
                        </div>
                        <button
                          onClick={() => handleUnblockIp(item.ip)}
                          className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-[10px] transition-all"
                        >
                          解封
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 opacity-40 text-xs">暂无封禁记录</div>
                  )}
                </div>

                <h4 className="text-xs font-bold mt-8 mb-4">Top 攻击 IP</h4>
                <div className="space-y-2">
                  {Object.entries(securityStats.topIps || {}).slice(0, 5).map(([ip, count]) => (
                    <div key={ip} className="p-3 rounded-xl bg-white/[0.02] text-xs flex items-center justify-between">
                      <span className="font-mono">{ip}</span>
                      <span className="text-red-400 font-bold">{count} 次</span>
                    </div>
                  ))}
                  {Object.keys(securityStats.topIps || {}).length === 0 && (
                    <div className="text-center py-4 opacity-40 text-[10px]">暂无数据</div>
                  )}
                </div>
              </div>
            </div>

            {/* 安全日志 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold">安全事件日志</h3>
                <button
                  onClick={() => loadSecurityLogs()}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-all flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  刷新
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {securityLogs.length > 0 ? (
                  securityLogs.map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-white/[0.02] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            log.eventType === 'RATE_LIMIT' ? 'text-orange-400' :
                            log.eventType === 'IP_BLOCKED' ? 'text-red-400' :
                            log.eventType === 'SIGNATURE_FAIL' ? 'text-purple-400' :
                            'text-blue-400'
                          }`}>
                            {log.eventType}
                          </span>
                          <span className="font-mono opacity-60">{log.ipAddress}</span>
                        </div>
                        <span className="opacity-40">{log.createTime ? new Date(log.createTime).toLocaleString() : ''}</span>
                      </div>
                      <div className="opacity-60 truncate">
                        <span className="text-[10px] text-blue-100/40">{log.path}</span>
                        {log.details && <span className="ml-2">{log.details}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 opacity-40 text-xs">暂无安全日志</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
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
