import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SendView from '../views/SendView.vue'
import QueryView from '../views/QueryView.vue'
import CommentView from '../views/CommentView.vue'
import MessageView from '../views/MessageView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/send',
      name: 'send',
      component: SendView
    },
    {
      path: '/query',
      name: 'query',
      component: QueryView
    },
    {
      path: '/comment',
      name: 'comment',
      component: CommentView
    },
    {
      path: '/message',
      name: 'message',
      component: MessageView
    }
  ]
})

export default router
