import axios from 'axios'

const API_BASE_URL = '/api'

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// 获取留言列表
export function fetchMessages() {
  return instance.get('/messages/')
}

// 按密语查询留言
export function queryMessages(secretCode) {
  return instance.get(`/messages/${encodeURIComponent(secretCode)}`)
}

// 提交留言
export function postMessage(data) {
  return instance.post('/messages/', data)
}

// 获取 QQ 头像
export function getQQAvatar(qqNumber) {
  return `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=100`
}

export default instance
