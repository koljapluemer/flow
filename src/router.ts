import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'practice', component: () => import('./pages/practice/PagePractice.vue') },
    { path: '/topics', name: 'topics', component: () => import('./pages/topics/PageTopics.vue') }
  ]
})

export default router
