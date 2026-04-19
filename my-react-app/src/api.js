import axios from 'axios';
import CryptoJS from 'crypto-js';

// 使用相对路径，通过 nginx 代理到后端
const API_BASE_URL = '/api';

// 签名密钥（需与服务端一致）
const SIGNATURE_KEY = 'BlueIsland.Secret.Key.2024.Security';

// 生成 HMAC-SHA256 签名
const generateSignature = (path, timestamp) => {
  const dataToSign = `${path}:${timestamp}`;
  return CryptoJS.HmacSHA256(dataToSign, SIGNATURE_KEY).toString(CryptoJS.enc.Base64);
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token 和签名
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // POST/PUT/DELETE 请求添加签名
  if (['post', 'put', 'delete'].includes(config.method?.toLowerCase())) {
    const timestamp = Date.now().toString();
    // 使用完整的请求路径（包含 /api 前缀）
    const fullPath = config.baseURL + config.url;
    const signature = generateSignature(fullPath, timestamp);
    config.headers['X-Timestamp'] = timestamp;
    config.headers['X-Signature'] = signature;
  }

  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // 不要全局重定向，让各个页面自己处理 401
    }
    return Promise.reject(error);
  }
);

// 认证相关
export const authApi = {
  login: (data) => api.post('/login', data),
  initAdmin: (data) => api.post('/init-admin', data),
  getUserInfo: () => api.get('/user/info'),
  changePassword: (data) => api.post('/password/update', data),
};

// 留言相关
export const messageApi = {
  getMessages: () => api.get('/messages'),
  getMessagesBySecret: (secretCode) => api.get(`/messages/${secretCode}`),
  pickupMessages: () => api.get('/messages/pickup'),
  createMessage: (data) => api.post('/messages', data),
  unlockMessage: (data) => api.post('/messages/unlock', data),
  getDailyQuote: () => api.get('/messages/daily-quote'),
  analyzeMood: (context) => api.post('/messages/analyze-mood', { context }),

  // 管理员接口
  getAllMessagesForAdmin: (page = 1, pageSize = 20) =>
    api.get(`/messages/admin?page=${page}&pageSize=${pageSize}`),
  deleteMessage: (id) => api.delete(`/messages/admin/${id}`),
  updateMessage: (id, data) => api.put(`/messages/admin/${id}`, data),
  resetReportCount: (id) => api.put(`/messages/admin/${id}/reset-report`),
  addReply: (msgId, replyContent) => api.post(`/messages/${msgId}/reply`, { content: replyContent }),
  reportMessage: (msgId) => api.post(`/messages/${msgId}/report`),
  resonanceMessage: (msgId) => api.post(`/messages/${msgId}/resonance`),
};

// 岛屿之灵相关
export const spiritApi = {
  chat: (message) => api.post('/spirit/chat', { message }),
};

// AI 模型相关
export const aiModelApi = {
  getAiModels: () => api.get('/ai-models'),
  getDefaultAiModel: () => api.get('/ai-models/default'),
  createAiModel: (data) => api.post('/ai-models', data),
  updateAiModel: (data) => api.put('/ai-models', data),
  deleteAiModel: (id) => api.delete(`/ai-models/${id}`),
  testAiModel: (id) => api.post(`/ai-models/${id}/test`),
  // AI 审核配置
  getAiConfig: () => api.get('/ai-config'),
  saveAiConfig: (data) => api.post('/ai-config', data),
  auditMessage: (data) => api.post('/ai-config/audit', data),
  logFrontendBlocked: (data) => api.post('/ai-config/log-blocked', data),
  getAuditStats: () => api.get('/ai-config/stats'),
  getAuditLogs: (page, pageSize) => api.get(`/ai-config/logs?page=${page}&pageSize=${pageSize}`),
};

// GD Studio 音乐 API
const GD_MUSIC_API = 'https://music-api.gdstudio.xyz/api.php';

export const musicApi = {
  search: (name, source = 'netease') => api.get(GD_MUSIC_API, {
    params: { types: 'search', source, name, count: 20, pages: 1 }
  }),
  getUrl: (id, source = 'netease', br = 320) => api.get(GD_MUSIC_API, {
    params: { types: 'url', source, id, br }
  }),
  getLyric: (id, source = 'netease') => api.get(GD_MUSIC_API, {
    params: { types: 'lyric', source, id }
  }),
  // 音乐配置（管理员）
  getMusicConfig: () => api.get('/music-config'),
  saveMusicConfig: (data) => api.post('/music-config', data),
  getMusicStats: () => api.get('/music-config/stats'),
  getMusicLogs: (page, pageSize) => api.get(`/music-config/logs?page=${page}&pageSize=${pageSize}`),
  // 记录音乐操作（公开）
  logMusicAction: (data) => api.post('/music-config/log', data),
};

// 访问统计相关
export const accessApi = {
  getStats: () => api.get('/access/stats'),
  heartbeat: (page, sessionId) => api.post('/access/heartbeat', { page, sessionId }),
  getOnlineUsers: () => api.get('/access/online'),
};

// 邮箱配置相关
export const emailConfigApi = {
  getConfig: () => api.get('/email-config'),
  saveConfig: (data) => api.post('/email-config', data),
  testConfig: (data) => api.post('/email-config/test', data),
};

// 安全监控相关
export const securityApi = {
  getStats: () => api.get('/security/stats'),
  getLogs: (page, pageSize) => api.get(`/security/logs?page=${page}&pageSize=${pageSize}`),
  getSettings: () => api.get('/security/settings'),
  saveSettings: (data) => api.post('/security/settings', data),
  getBlockedIps: () => api.get('/security/blocked-ips'),
  unblockIp: (ip) => api.delete(`/security/blocked-ips/${ip}`),
  blockIp: (data) => api.post('/security/blocked-ips', data),
};

export default api;
