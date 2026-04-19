import { createRouter, createWebHashHistory } from 'vue-router'   // ✅ 必须导入 createWebHashHistory
import OrderForm from '../views/OrderForm.vue'
import OrderList from '../views/OrderList.vue'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import UserList from '../views/UserList.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/order', name: 'OrderForm', component: OrderForm, meta: { requiresAuth: true } },
  { path: '/orders', name: 'OrderList', component: OrderList, meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/users', name: 'UserList', component: UserList, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/login', name: 'Login', component: Login, meta: { guestOnly: true } },
  { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
]

const router = createRouter({
  history: createWebHashHistory(),   // 使用 hash 模式，避免刷新 404
  routes,
})

export default router