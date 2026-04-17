<template>
  <div class="page">
    <!--头部-->
    <header class="header">
      <div class="logo">
        <img width="100px" src="/assets/images/logo.png" height="100px" alt="logo" @click="goHome" style="cursor: pointer;" />
      </div>
      <p>把你的小秘密都藏到岛上来吧！</p>
    </header>

    <main class="container">
      <section class="message-form">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="messageContent">留言内容：</label>
            <textarea
              id="messageContent"
              v-model="formData.content"
              placeholder="提笔落墨，心事可寄于此..."
              @input="updateWordCount"
              required
            ></textarea>
            <div id="wordCount" :class="{ 'limit-exceeded': wordCount > 300 }">{{ wordCount }}/300</div>
            <div id="contentError" class="error-message" v-if="errors.content">{{ errors.content }}</div>
          </div>

          <div class="form-group">
            <label for="secretCode">名字/密语：</label>
            <input
              type="text"
              id="secretCode"
              v-model="formData.secret_code"
              placeholder="她（他）的名字或密语"
            />
            <div id="secretCodeError" class="error-message" v-if="errors.secret_code">{{ errors.secret_code }}</div>
          </div>

          <div class="form-group">
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
            <div v-show="avatarType === 'anonymous'" id="anonymousAvatars">
              <div class="avatar-options">
                <img
                  v-for="i in 5"
                  :key="i"
                  :src="`/assets/images/avatars/anonymous/anonymous${i}.jpg`"
                  class="avatar-option"
                  :class="{ selected: selectedAvatar === i }"
                  @click="selectedAvatar = i"
                />
              </div>
              <input type="hidden" v-model="formData.avatar_id" />
            </div>

            <!-- QQ头像输入 -->
            <div v-show="avatarType === 'qq'" id="qqAvatar" class="qq-avatar-container">
              <div style="display: flex; align-items: center;">
                <input
                  type="number"
                  id="qqNumber"
                  v-model="qqNumber"
                  placeholder="输入QQ号获取头像"
                  @blur="fetchQQAvatar"
                />
                <button type="button" id="fetchQQAvatar" @click="fetchQQAvatar">获取</button>
              </div>
              <div class="status-message" id="qqStatus">{{ qqStatus }}</div>
              <img
                v-if="qqAvatarPreview"
                id="qqAvatarPreview"
                class="qq-avatar-preview"
                :src="qqAvatarPreview"
                alt="QQ头像预览"
              />
            </div>
          </div>

          <div class="form-group">
            <button type="submit" class="submit-btn" :disabled="submitting">
              <span v-if="submitting" class="loading-spinner"></span>
              {{ submitting ? '提交中...' : '提交留言' }}
            </button>
            <div id="submitStatus" class="status-message" :class="submitStatus.type" v-if="submitStatus.show">
              {{ submitStatus.message }}
            </div>
          </div>
        </form>
      </section>

      <div class="queryImg">
        <router-link to="/query">
          <img src="/assets/images/query.png" alt="查询" />
        </router-link>
      </div>
    </main>

    <!--脚部-->
    <footer class="footer">
      <p>&copy2025 @hongjin</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessageStore } from '../stores/message'
import { getQQAvatar } from '../api/message'

const router = useRouter()
const messageStore = useMessageStore()

// 表单数据
const formData = reactive({
  content: '',
  secret_code: '',
  avatar_id: '1'
})

// 头像类型
const avatarType = ref('anonymous')
const selectedAvatar = ref(1)
const qqNumber = ref('')
const qqAvatarPreview = ref('')
const qqStatus = ref('')

// 字数统计
const wordCount = ref(0)

// 错误信息
const errors = reactive({
  content: '',
  secret_code: ''
})

// 提交状态
const submitting = ref(false)
const submitStatus = reactive({
  show: false,
  message: '',
  type: ''
})

// 敏感词检测规则
const SENSITIVE_WORDS = [
  '枪支', '毒品', '赌博', '诈骗', '发票', '代考',
  '约炮', '裸聊', '成人', '情色', '包养', '招嫖',
  '领导人', '政府', '中共', '共产党', '国家机密',
  '杀人', '自杀', '爆炸', '恐怖袭击'
]

const FORBIDDEN_RULES = {
  basic: /[<>"\\]/g,
  emoji: /[\uD800-\uDFFF]|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g,
  control: /[\x00-\x1F\x7F-\x9F]/g,
  sensitive: new RegExp(SENSITIVE_WORDS.join('|'), 'i'),
  url: /(http|https):\/\/[^\s]+/g,
  phone: /(\+?86)?1[3-9]\d{9}/g,
  idCard: /[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g
}

// 监听头像类型变化
watch(avatarType, (newType) => {
  if (newType === 'anonymous') {
    formData.avatar_id = selectedAvatar.value.toString()
  } else {
    formData.avatar_id = qqNumber.value
  }
})

watch(selectedAvatar, (val) => {
  formData.avatar_id = val.toString()
})

watch(qqNumber, (val) => {
  formData.avatar_id = val
})

const updateWordCount = () => {
  wordCount.value = formData.content.length
  checkForbiddenChars('content')
}

const checkForbiddenChars = (field) => {
  const value = formData[field === 'content' ? 'content' : 'secret_code']
  let message = ''
  let matchedText = ''

  for (const [type, rule] of Object.entries(FORBIDDEN_RULES)) {
    const match = value.match(rule)
    if (match) {
      matchedText = match[0].substring(0, 10) + (match[0].length > 10 ? '...' : '')
      switch (type) {
        case 'basic':
          message = `包含非法字符: ${matchedText}`
          break
        case 'emoji':
          message = '暂不支持表情符号'
          break
        case 'control':
          message = '包含不可见控制字符'
          break
        case 'sensitive':
          message = `包含敏感词: ${matchedText}`
          break
        case 'url':
          message = '不能包含网址链接'
          break
        case 'phone':
          message = '不能包含手机号码'
          break
        case 'idCard':
          message = '不能包含身份证号'
          break
      }
      break
    }
  }

  errors[field] = message
  return !message
}

const fetchQQAvatar = async () => {
  const qq = qqNumber.value.trim()

  if (!qq || !/^[1-9][0-9]{4,11}$/.test(qq)) {
    qqStatus.value = '请输入有效的QQ号码(5-12位数字)'
    return
  }

  qqStatus.value = '正在获取QQ头像...'

  try {
    const avatarUrl = getQQAvatar(qq)
    await loadImage(avatarUrl)
    qqAvatarPreview.value = avatarUrl
    qqStatus.value = 'QQ头像获取成功！'
    formData.avatar_id = qq
  } catch (error) {
    qqStatus.value = '获取QQ头像失败，请检查QQ号是否正确'
  }
}

const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

const showStatus = (message, type) => {
  submitStatus.message = message
  submitStatus.type = type
  submitStatus.show = true

  setTimeout(() => {
    submitStatus.show = false
  }, 3000)
}

const validateForm = () => {
  let isValid = true

  if (!formData.content) {
    errors.content = '请输入留言内容'
    isValid = false
  } else if (formData.content.length < 6) {
    errors.content = '留言内容不能低于6个字'
    isValid = false
  } else if (formData.content.length > 300) {
    errors.content = '留言内容不能超过300个字'
    isValid = false
  } else if (!checkForbiddenChars('content')) {
    isValid = false
  }

  if (!formData.secret_code) {
    errors.secret_code = '请输入暗语'
    isValid = false
  } else if (formData.secret_code.length < 2) {
    errors.secret_code = '暗语至少需要2个字符'
    isValid = false
  } else if (!checkForbiddenChars('secret_code')) {
    isValid = false
  }

  if (avatarType.value === 'qq' && !/^\d+$/.test(formData.avatar_id)) {
    errors.secret_code = 'QQ号码必须为数字'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  errors.content = ''
  errors.secret_code = ''

  if (!validateForm()) {
    return
  }

  submitting.value = true

  setTimeout(async () => {
    try {
      const requestData = {
        content: formData.content.trim(),
        secret_code: formData.secret_code.trim(),
        avatar_type: avatarType.value,
        avatar_id: formData.avatar_id
      }

      await messageStore.submitMessage(requestData)

      showStatus('留言提交成功！', 'success')

      // 重置表单
      formData.content = ''
      formData.secret_code = ''
      wordCount.value = 0
      selectedAvatar.value = 1
      qqNumber.value = ''
      qqAvatarPreview.value = ''
    } catch (error) {
      showStatus(error.message || '提交失败，请稍后重试', 'error')
    } finally {
      submitting.value = false
    }
  }, 500)
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

.message-form {
  width: 275px;
  margin: 10px auto;
  padding: 20px;
  background-color: rgb(59, 101, 128);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #fff;
}

textarea, input[type="text"], input[type="number"] {
  width: 95%;
  padding: 10px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 13px;
  background: transparent;
  color: #fff;
}

textarea {
  max-height: 200px;
  min-height: 150px;
  resize: vertical;
}

input:focus, textarea:focus {
  outline: none;
  border-color: inherit;
  box-shadow: none;
}

#wordCount {
  text-align: right;
  color: #666;
  font-size: 0.8em;
  margin-top: 5px;
}

#wordCount.limit-exceeded {
  color: red;
}

#anonymousAvatars {
  display: flex;
  flex-direction: row;
}

.avatar-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 10px;
  max-height: 80px;
  overflow-y: auto;
}

.avatar-option {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.avatar-option:hover, .avatar-option.selected {
  border-color: #2980b9;
}

.qq-avatar-container {
  margin-top: 15px;
  display: none;
  height: 80px;
}

#qqNumber {
  width: calc(100% - 100px);
  margin-right: 10px;
  color: #333;
}

#fetchQQAvatar {
  padding: 10px 15px;
  background-color: rgb(70, 113, 173);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
}

#fetchQQAvatar:hover {
  background-color: #69b0d7;
}

.qq-avatar-preview {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  margin-top: 10px;
  display: none;
}

.avatar-toggle {
  margin: 15px 0;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.5);
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  color: #333;
}

.toggle-btn.active {
  background-color: rgb(70, 113, 173);
  color: white;
}

.submit-btn {
  background-color: rgb(70, 113, 173);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  width: 100%;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #69b0d7;
}

.submit-btn:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-message {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  display: none;
}

.status-message.success {
  background-color: #e6f4ea;
  color: #34a853;
  display: block;
}

.status-message.error {
  background-color: #fce8e6;
  color: #d93025;
  font-size: 13px;
  display: block;
}

.error-message {
  color: #ff6b6b;
  font-size: 0.8em;
  margin-top: 4px;
  padding: 4px;
  display: block;
}

.error-message i {
  color: #ffa500;
}

.queryImg {
  position: fixed;
  bottom: 45px;
  right: 45px;
  z-index: 1000;
}

.queryImg img {
  width: 60px;
  height: 60px;
  background-size: 16px;
  border-radius: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
