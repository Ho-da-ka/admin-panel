import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '../utils/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true, title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'students',
        name: 'students',
        component: () => import('../views/students/StudentListView.vue'),
        meta: { title: '学员管理' }
      },
      {
        path: 'courses',
        name: 'courses',
        component: () => import('../views/courses/CourseListView.vue'),
        meta: { title: '课程管理' }
      },
      {
        path: 'attendances',
        name: 'attendances',
        component: () => import('../views/attendances/AttendanceView.vue'),
        meta: { title: '考勤管理' }
      },
      {
        path: 'fitness-tests',
        name: 'fitness-tests',
        component: () => import('../views/fitness/FitnessView.vue'),
        meta: { title: '体测管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  if (!to.meta.public && !isLoggedIn()) {
    return { name: 'login' }
  }
  if (to.name === 'login' && isLoggedIn()) {
    return { name: 'dashboard' }
  }
  return true
})

router.afterEach((to) => {
  document.title = `ZF管理后台 - ${to.meta.title || '工作台'}`
})

export default router
