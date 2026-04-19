import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import FuncPlaceholder from '../views/FuncPlaceholder.vue'
import OrderForm from '../views/OrderForm.vue'
import OrderList from '../views/OrderList.vue'
import Profile from '../views/Profile.vue'
import UserList from '../views/UserList.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: Login, meta: { guestOnly: true } },
  { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
  
  // ✅ 添加独立 /func1 重定向到 /dashboard/func1，消除警告
  { path: '/func1', redirect: '/dashboard/func1' },
  
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      { path: 'func1', name: 'Func1', component: FuncPlaceholder, props: { funcId: 1 } },
      { path: 'func2', name: 'Func2', component: FuncPlaceholder, props: { funcId: 2 } },
      { path: 'func3', name: 'Func3', component: FuncPlaceholder, props: { funcId: 3 } },
      { path: 'func4', name: 'Func4', component: FuncPlaceholder, props: { funcId: 4 } },
      { path: 'func5', name: 'Func5', component: FuncPlaceholder, props: { funcId: 5 } },
      { path: 'func6', name: 'Func6', component: FuncPlaceholder, props: { funcId: 6 } },
      { path: 'func7', name: 'Func7', component: FuncPlaceholder, props: { funcId: 7 } },
      { path: 'func8', name: 'Func8', component: FuncPlaceholder, props: { funcId: 8 } },
      { path: 'func9', name: 'Func9', component: FuncPlaceholder, props: { funcId: 9 } },
      { path: 'func10', name: 'Func10', component: FuncPlaceholder, props: { funcId: 10 } },
      { path: 'order', name: 'OrderForm', component: OrderForm },
      { path: 'orders', name: 'OrderList', component: OrderList },
      { path: 'profile', name: 'Profile', component: Profile },
      { path: 'users', name: 'UserList', component: UserList },
      { path: '', redirect: 'func1' }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }
  if (to.meta.guestOnly && isAuthenticated) {
    return '/dashboard'
  }
  return true
})

export default router