<template>
  <div class="page">
    <header class="header">
      <div class="logo">
        <img width="100px" src="/assets/images/logo.png" height="100px" alt="logo" @click="goHome" style="cursor: pointer;" />
      </div>
      <p>暗号留言 - 把秘密藏到这里</p>
    </header>

    <main class="container">
      <section class="message-form">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>暗号 *</label>
            <input
              type="text"
              v-model="form.secretCode"
              placeholder="设置一个暗号（查询密钥）"
              required
              minlength="2"
            />
            <div class="hint">设置一个只有你知道暗号，别人可以用它来查看你的留言</div>
          </div>

          <div class="form-group">
            <label>公开内容</label>
            <textarea
              v-model="form.content"
              placeholder="输入公开显示的内容（选填）"
              maxlength="300"
            ></textarea>
            <div class="word-count">{{ form.content.length }}/300</div>
          </div>

          <div class="form-group">
            <label>私密内容（暗号可见）</label>
            <textarea
              v-model="form.secretContent"
              placeholder="只有输入正确暗号才能看到的内容（选填）"
              maxlength="500"
            ></textarea>
            <div class="word-count">{{ form.secretContent.length }}/500</div>
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
            {{ submitting ? '提交中...' : '发布暗号留言' }}
          </button>

          <div v-if="status.show" class="status-message" :class="status.type">
            {{ status.message }}
          </div>
        </form>
      </section>

      <div class="nav-buttons">
        <button class="nav-btn" @click="goHome">首页</button>
        <button class="nav-btn" @click="goComment">评论留言</button>
        <button class="nav-btn" @click="goQuery">查询暗号</button>
      </div>
    </main>

    <footer class="footer">
      <p>&copy; 2025 @hongjin</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const API_BASE = '/api/messages'

// 表单数据
const form = reactive({
  secretCode: '',
  content: '',
  secretContent: ''
})

const avatarType = ref('anonymous')
const selectedAvatar = ref(1)
const qqNumber = ref('')
const qqAvatarUrl = ref('')

const submitting = ref(false)

const status = reactive({
  show: false,
  message: '',
  type: 'success'
})

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
  }, 5000)
}

const handleSubmit = async () => {
  if (!form.secretCode || form.secretCode.length < 2) {
    showStatus('暗号至少2个字符', 'error')
    return
  }

  if (!form.content && !form.secretContent) {
    showStatus('请填写公开内容或私密内容', 'error')
    return
  }

  submitting.value = true

  try {
    const requestData = {
      secretCode: form.secretCode,
      content: form.content || form.secretContent,
      secretContent: form.secretContent || form.content,
      avatarType: avatarType.value,
      avatarId: avatarType.value === 'anonymous' ? selectedAvatar.value.toString() : qqNumber.value,
      avatarUrl: avatarType.value === 'qq' ? qqAvatarUrl.value : null
    }

    await axios.post(API_BASE, requestData)

    showStatus('暗号留言发布成功！', 'success')
    form.secretCode = ''
    form.content = ''
    form.secretContent = ''
  } catch (error) {
    showStatus('发布失败，请稍后重试', 'error')
  } finally {
    submitting.value = false
  }
}

const goHome = () => router.push('/')
const goComment = () => router.push('/comment')
const goQuery = () => router.push('/query')

// 响应式表单内容字符数
import { computed } from 'vue'
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
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  flex: 1;
}

.message-form {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.9);
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2980b9;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.word-count {
  text-align: right;
  color: #666;
  font-size: 12px;
  margin-top: 5px;
}

.hint {
  color: #888;
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
  width: 45px;
  height: 45px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
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
  width: 45px;
  height: 45px;
  border-radius: 50%;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #2980b9, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(41, 128, 185, 0.3);
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1a5276, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(41, 128, 185, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.status-message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}

.status-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.nav-buttons {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #2980b9;
  border: 2px solid #2980b9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #2980b9;
  color: white;
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
