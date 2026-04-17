<template>
  <div class="page">
    <!--头部-->
    <header class="header">
      <div class="logo">
        <img width="100px" src="/assets/images/logo.png" height="100px" alt="logo" />
      </div>
      <p>把你的小秘密都藏到岛上来吧！</p>
    </header>

    <!--主体-->
    <main class="container">
      <div class="button-group">
        <button class="btn comment-btn" @click="goComment">评论留言</button>
        <button class="btn message-btn" @click="goMessage">暗号留言</button>
      </div>
      <div class="sub-buttons">
        <button class="sub-btn" @click="goQuery">查询暗号</button>
      </div>
    </main>

    <!--脚部-->
    <footer class="footer">
      <p>&copy2025 @hongjin</p>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goComment = () => {
  router.push('/comment')
}

const goMessage = () => {
  router.push('/message')
}

const goQuery = () => {
  router.push('/query')
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
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.button-group {
  display: flex;
  gap: 30px;
  margin-top: 50px;
}

.btn {
  width: 180px;
  padding: 25px 30px;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.comment-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.comment-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(41, 128, 185, 0.4);
}

.message-btn {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.message-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(155, 89, 182, 0.4);
}

.sub-buttons {
  margin-top: 40px;
}

.sub-btn {
  padding: 12px 30px;
  background: rgba(255, 255, 255, 0.9);
  color: #2980b9;
  border: 2px solid #2980b9;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sub-btn:hover {
  background: #2980b9;
  color: white;
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
