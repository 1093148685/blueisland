<template>
  <div class="page">
    <header class="header">
      <div class="logo">
        <img width="100px" src="/assets/images/logo.png" height="100px" alt="logo" @click="goHome" style="cursor: pointer;" />
      </div>
      <p>评论留言 - 说说你想说的话</p>
    </header>

    <main class="container">
      <!-- 留言表单 -->
      <section class="comment-form">
        <h3>发表评论</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>昵称 *</label>
            <input type="text" v-model="form.nickname" placeholder="你的昵称" required />
          </div>

          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="form.mail" placeholder="你的邮箱（选填）" />
          </div>

          <div class="form-group">
            <label>留言内容 *</label>
            <textarea
              v-model="form.content"
              placeholder="说说你想说的话..."
              maxlength="300"
              required
            ></textarea>
            <div class="word-count">{{ form.content.length }}/300</div>
          </div>

          <div class="form-group">
            <label>头像</label>
            <div class="avatar-section">
              <div class="avatar-toggle">
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ active: avatarType === 'anonymous' }"
                  @click="avatarType = 'anonymous'"
                >
                  匿名头像
                </button>
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ active: avatarType === 'qq' }"
                  @click="avatarType = 'qq'"
                >
                  QQ头像
                </button>
              </div>

              <!-- 匿名头像选择 -->
              <div v-show="avatarType === 'anonymous'" class="avatar-options">
                <img
                  v-for="i in 5"
                  :key="i"
                  :src="`/assets/images/avatars/anonymous/anonymous${i}.jpg`"
                  class="avatar-option"
                  :class="{ selected: selectedAvatar === i }"
                  @click="selectedAvatar = i"
                />
              </div>

              <!-- QQ头像输入 -->
              <div v-show="avatarType === 'qq'" class="qq-input">
                <input
                  type="number"
                  v-model="qqNumber"
                  placeholder="输入QQ号"
                  @blur="fetchQQAvatar"
                />
                <button type="button" @click="fetchQQAvatar">获取</button>
                <img v-if="qqAvatarUrl" :src="qqAvatarUrl" class="qq-avatar-preview" alt="QQ头像" />
              </div>
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="submitting">
            {{ submitting ? '提交中...' : '发布评论' }}
          </button>

          <div v-if="status.show" class="status-message" :class="status.type">
            {{ status.message }}
          </div>
        </form>
      </section>

      <!-- 留言列表 -->
      <section class="comment-list">
        <h3>评论列表 ({{ comments.length }})</h3>

        <div v-if="loading" class="loading">加载中...</div>

        <div v-else-if="comments.length === 0" class="empty-state">
          <p>暂无评论，来说两句吧~</p>
        </div>

        <div v-else class="comment-items">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <img
                :src="getAvatarUrl(comment)"
                :alt="comment.nickname"
                class="comment-avatar"
              />
              <div class="comment-info">
                <span class="comment-nickname">{{ comment.nickname }}</span>
                <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
              </div>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
        </div>
      </section>

      <!-- 快捷导航 -->
      <div class="nav-buttons">
        <button class="nav-btn" @click="goHome">首页</button>
        <button class="nav-btn" @click="goMessage">暗号留言</button>
      </div>
    </main>

    <footer class="footer">
      <p>&copy; 2025 @hongjin</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const API_BASE = '/api/api'

// 表单数据
const form = reactive({
  nickname: '',
  mail: '',
  content: ''
})

const avatarType = ref('anonymous')
const selectedAvatar = ref(1)
const qqNumber = ref('')
const qqAvatarUrl = ref('')

// 留言列表
const comments = ref([])
const loading = ref(false)
const submitting = ref(false)

const status = reactive({
  show: false,
  message: '',
  type: 'success'
})

const getAvatarUrl = (comment) => {
  if (comment.avatarType === 'qq' || comment.avatar) {
    return comment.avatar || `https://q1.qlogo.cn/g?b=qq&nk=${comment.avatarId}&s=100`
  }
  return `/assets/images/avatars/anonymous/anonymous${comment.avatarId || 1}.jpg`
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`
  return date.toLocaleDateString('zh-CN')
}

const fetchQQAvatar = () => {
  const qq = qqNumber.value.trim()
  if (!qq || !/^[1-9][0-9]{4,11}$/.test(qq)) return
  qqAvatarUrl.value = `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`
}

const showStatus = (message, type = 'success') => {
  status.message = message
  status.type = type
  status.show = true
  setTimeout(() => {
    status.show = false
  }, 3000)
}

const loadComments = async () => {
  loading.value = true
  try {
    const res = await axios.post(`${API_BASE}/message-wall/comments`, { routerUrl: '/comment' })
    if (res.data.code === 200) {
      // 只显示公开评论（非私密）
      comments.value = (res.data.data?.comments || []).filter(c => !c.isSecret)
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!form.nickname || !form.content) {
    showStatus('请填写昵称和内容', 'error')
    return
  }

  if (form.content.length < 2) {
    showStatus('内容至少2个字符', 'error')
    return
  }

  submitting.value = true

  try {
    const requestData = {
      content: form.content,
      nickname: form.nickname,
      mail: form.mail || `${form.nickname}@comment.com`,
      routerUrl: '/comment',
      avatarType: avatarType.value,
      avatarId: avatarType.value === 'anonymous' ? selectedAvatar.value.toString() : qqNumber.value,
      avatar: avatarType.value === 'qq' ? qqAvatarUrl.value : null,
      status: 2 // 直接审核通过
    }

    await axios.post(`${API_BASE}/message-wall/publish`, requestData)

    showStatus('评论发布成功！', 'success')
    form.content = ''
    loadComments()
  } catch (error) {
    showStatus('发布失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

const goHome = () => router.push('/')
const goMessage = () => router.push('/message')

onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-image: url('/assets/images/background1.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-color: #ffffff;
}

.header {
  margin: 15px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.header img {
  width: 100px;
  height: 100px;
  border-radius: 60px;
}

.header p {
  margin-left: 15px;
  text-align: center;
  color: rgb(70, 113, 173);
  font-weight: bolder;
  font-size: 1.1em;
  font-family: '微软雅黑', Arial, sans-serif;
}

.container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
  flex: 1;
}

.comment-form {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.comment-form h3 {
  margin: 0 0 15px;
  color: #2980b9;
  font-size: 18px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.8);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.word-count {
  text-align: right;
  color: #666;
  font-size: 12px;
  margin-top: 5px;
}

.avatar-section {
  margin-top: 10px;
}

.avatar-toggle {
  margin-bottom: 10px;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #ddd;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  font-size: 13px;
}

.toggle-btn.active {
  background: #2980b9;
  color: white;
  border-color: #2980b9;
}

.avatar-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.avatar-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.avatar-option:hover,
.avatar-option.selected {
  border-color: #2980b9;
  transform: scale(1.1);
}

.qq-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qq-input input {
  width: 150px;
}

.qq-input button {
  padding: 8px 15px;
  background: #2980b9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.qq-avatar-preview {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #2980b9;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #1a5276;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.status-message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
}

.comment-list {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.comment-list h3 {
  margin: 0 0 15px;
  color: #2980b9;
  font-size: 18px;
}

.loading,
.empty-state {
  text-align: center;
  padding: 30px;
  color: #666;
}

.comment-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  border: 1px solid #eee;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.comment-info {
  display: flex;
  flex-direction: column;
}

.comment-nickname {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.comment-time {
  color: #999;
  font-size: 12px;
}

.comment-content {
  color: #333;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.nav-buttons {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  justify-content: center;
}

.nav-btn {
  padding: 10px 25px;
  background: #2980b9;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: #1a5276;
}

.footer {
  text-align: center;
  padding: 5px;
  margin-top: auto;
}

.footer p {
  color: #666;
  font-family: '楷体', 'STKaiti', serif;
}
</style>
