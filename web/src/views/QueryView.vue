<template>
  <div class="page">
    <header class="header">
      <div class="logo">
        <img width="100" src="/assets/images/logo.png" height="100" alt="logo" @click="goHome" style="cursor: pointer;" />
      </div>
      <p>通过暗语查询你的秘密留言</p>
    </header>

    <main class="container">
      <div class="search-container">
        <input
          type="text"
          class="search-input"
          v-model="searchKeyword"
          placeholder="输入密语..."
          @keypress.enter="searchMessage"
        />
        <button class="search-button" @click="searchMessage">🔍</button>
      </div>

      <div id="statusMessage" class="status-message" :class="status.type" v-if="status.show">
        {{ status.message }}
      </div>

      <section class="message-list-container">
        <!-- 空状态插画 -->
        <div v-if="!loading && messages.length === 0 && showEmpty" id="illustrationContainer" class="illustration">
          <img src="/assets/images/search.png" alt="搜索插画" />
          <div class="empty-message">
            <i class="icon-feather">✒️</i>
            <p>锦字藏心，待君密语启芳音</p>
            <p class="subtext">暂未寻得云中锦字</p>
          </div>
        </div>

        <!-- 留言列表 -->
        <ul v-if="messages.length > 0" class="message-list" id="messageList">
          <li class="message-stats">
            <div class="stats-content">
              <i class="fas fa-comment-dots"></i>
              <span>留言字条（{{ messages.length }}）</span>
            </div>
          </li>
          <li v-for="message in paginatedMessages" :key="message.id" class="message-item">
            <div class="message-header">
              <img
                :src="getAvatarUrl(message)"
                :alt="message.avatar_type === 'qq' ? 'QQ头像' : '匿名头像'"
                class="message-avatar"
                @error="handleAvatarError"
              />
              <div class="message-user-info">
                <strong>{{ message.avatar_type === 'qq' ? 'QQ用户' : '匿名用户' }}</strong>
                <span class="post-time" :title="formatDate(message.created_at)">
                  {{ formatRelativeTime(new Date(message.created_at)) }}
                </span>
              </div>
            </div>
            <div class="message-content">{{ message.content }}</div>
          </li>
        </ul>

        <!-- 分页控件 -->
        <div v-if="totalPages > 1" class="pagination-controls">
          <button
            class="pagination-btn"
            :class="{ disabled: currentPage === 1 }"
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
          >
            <i class="fas fa-chevron-left"></i> 上一页
          </button>
          <span class="page-info">{{ currentPage }}/{{ totalPages }}</span>
          <button
            class="pagination-btn"
            :class="{ disabled: currentPage === totalPages }"
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
          >
            下一页 <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>

      <!-- 音乐播放器 -->
      <MusicPlayer />

      <div class="sendImg">
        <router-link to="/send">
          <img src="/assets/images/write.png" alt="写留言" />
        </router-link>
      </div>
    </main>

    <footer class="footer">
      <p>&copy; 2025 @hongjin-晓看天色暮看云，行也思君坐也思君</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessageStore } from '../stores/message'
import MusicPlayer from '../components/MusicPlayer.vue'

const router = useRouter()
const messageStore = useMessageStore()

const searchKeyword = ref('')
const messages = ref([])
const loading = ref(false)
const showEmpty = ref(true)
const currentPage = ref(1)
const PAGE_SIZE = 5

const status = reactive({
  show: false,
  message: '',
  type: ''
})

const totalPages = computed(() => Math.ceil(messages.value.length / PAGE_SIZE))

const paginatedMessages = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return messages.value.slice(start, end)
})

const getAvatarUrl = (message) => {
  if (message.avatar_type === 'qq') {
    return message.avatar_url || `https://q1.qlogo.cn/g?b=qq&nk=${message.avatar_id}&s=100`
  }
  return `/assets/images/avatars/anonymous/anonymous${message.avatar_id || 1}.jpg`
}

const handleAvatarError = (e) => {
  e.target.src = '/assets/images/default-avatar.png'
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const formatRelativeTime = (date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) return '刚刚'

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}小时前`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays}天前`

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) return `${diffInMonths}个月前`

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}年前`
}

const showStatusMessage = (message, type = 'error') => {
  status.message = message
  status.type = type
  status.show = true

  setTimeout(() => {
    status.show = false
  }, 3000)
}

const searchMessage = async () => {
  const secretCode = searchKeyword.value.trim()

  if (!secretCode) {
    searchKeyword.value.focus()
    return
  }

  showEmpty.value = false
  loading.value = true
  messages.value = []

  setTimeout(async () => {
    try {
      const result = await messageStore.searchBySecret(secretCode)
      messages.value = result || []
      currentPage.value = 1

      if (messages.value.length === 0) {
        showEmpty.value = true
      }
    } catch (error) {
      messages.value = []
      showEmpty.value = true
      showStatusMessage(error.response?.data?.detail || '查询失败，请稍后再试', 'error')
    } finally {
      loading.value = false
    }
  }, 500)
}

const changePage = (newPage) => {
  currentPage.value = newPage
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goHome = () => {
  router.push('/')
}
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

.search-container {
  position: relative;
  margin-bottom: 20px;
  max-width: 185px;
  min-width: 100px;
  margin-left: auto;
  margin-right: auto;
}

.search-input {
  width: 100%;
  padding: 12px 50px 12px 20px;
  font-size: 13px;
  border: 2px solid #4a6fa5;
  border-radius: 30px;
  outline: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #333;
}

.search-button {
  position: absolute;
  left: 285px;
  top: 12px;
  background: #4a6fa5;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover {
  width: 34px;
  height: 34px;
  background: #3a5b8c;
}

.status-message {
  padding: 8px 12px;
  margin: 0 auto;
  text-align: center;
  display: none;
  max-width: 80%;
  font-size: 14px;
  animation: fadeIn 0.3s;
}

.status-message.success {
  background: rgba(74, 111, 165, 0.1);
  color: #4a6fa5;
  border: 1px solid #4a6fa5;
  display: block;
}

.status-message.error {
  background: #f8d7da;
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.message-list-container {
  margin-top: 20px;
}

.illustration {
  text-align: center;
  margin: 40px 0;
}

.illustration img {
  max-width: 300px;
  opacity: 0.8;
}

.illustration p {
  color: rgb(146, 163, 175);
  margin-top: 15px;
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: #8c8c8c;
  font-family: '楷体', 'STKaiti', serif;
}

.empty-message .icon-feather {
  font-size: 3rem;
  opacity: 0.6;
}

.empty-message p {
  margin: 0.5rem 0;
  font-size: 1.2rem;
}

.empty-message .subtext {
  font-size: 0.9rem;
}

.message-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.message-stats {
  padding: 12px 15px;
  border-radius: 5px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
  background: rgba(25, 113, 228, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-content i {
  color: #4a6fa5;
  font-size: 16px;
}

.message-item {
  max-width: 490px;
  min-width: 200px;
  margin: 0 auto 15px;
  background: rgba(63, 103, 155, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.message-user-info {
  display: flex;
  flex-direction: column;
}

.message-user-info strong {
  color: #333;
  font-size: 14px;
}

.post-time {
  color: #888;
  font-size: 12px;
}

.message-content {
  color: #333;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
  padding: 10px 0;
  border-top: 1px solid #eee;
}

.pagination-btn {
  padding: 8px 15px;
  background-color: #4a6fa5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.pagination-btn:hover:not(.disabled) {
  background-color: #3a5a80;
}

.pagination-btn.disabled {
  background-color: #ddd;
  color: #999;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

.sendImg {
  position: fixed;
  right: 20px;
  bottom: 150px;
  z-index: 1000;
}

.sendImg img {
  width: 60px;
  height: 60px;
  cursor: pointer;
  transition: transform 0.3s;
  border-radius: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.sendImg img:hover {
  transform: scale(1.1);
}

.footer {
  text-align: center;
  padding: 5px;
}

.footer p {
  text-align: center;
  margin-top: 30px;
  color: #666;
  font-family: '楷体', 'STKaiti', serif;
}
</style>
