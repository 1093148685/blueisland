import axios from 'axios';

const API_BASE_URL = 'http://localhost:5170/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  createMessage: (data) => api.post('/messages', data),
  unlockMessage: (data) => api.post('/messages/unlock', data),
  getDailyQuote: () => api.get('/messages/daily-quote'),
  analyzeMood: (context) => api.post('/messages/analyze-mood', { context }),

  // 管理员接口
  getAllMessagesForAdmin: (page = 1, pageSize = 20) =>
    api.get(`/messages/admin?page=${page}&pageSize=${pageSize}`),
  deleteMessage: (id) => api.delete(`/messages/admin/${id}`),
  updateMessage: (id, data) => api.put(`/messages/admin/${id}`, data),
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

export default api;
