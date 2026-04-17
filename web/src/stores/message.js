import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMessages, queryMessages, postMessage } from '../api/message'

export const useMessageStore = defineStore('message', () => {
  const messages = ref([])
  const currentQueryMessages = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 获取留言列表
  async function loadMessages() {
    loading.value = true
    error.value = null
    try {
      const res = await fetchMessages()
      messages.value = res.messages || [res]
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // 按密语查询
  async function searchBySecret(secretCode) {
    loading.value = true
    error.value = null
    try {
      const res = await queryMessages(secretCode)
      currentQueryMessages.value = res.messages || [res]
      return currentQueryMessages.value
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // 提交留言
  async function submitMessage(data) {
    loading.value = true
    error.value = null
    try {
      const res = await postMessage(data)
      return res
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    messages,
    currentQueryMessages,
    loading,
    error,
    loadMessages,
    searchBySecret,
    submitMessage
  }
})
