import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const devRoutes: RouteRecordRaw[] = [
  {
    path: '/dev/exercise/:id(.*)',
    name: 'exercise-preview',
    component: () => import('./pages/exercise-preview/PageExercisePreview.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'practice', component: () => import('./pages/practice/PagePractice.vue') },
    { path: '/topics', name: 'topics', component: () => import('./pages/topics/PageTopics.vue') },
    ...(import.meta.env.DEV ? devRoutes : [])
  ]
})

export default router
