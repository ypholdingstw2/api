// frontend/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import OrderForm from '../views/OrderForm.vue'
import OrderList from '../views/OrderList.vue'
import Register from '../views/Register.vue'
import Login from '../views/Login.vue'
import Profile from '../views/Profile.vue'
import UserList from '../views/UserList.vue'

const routes = [
  // 登入後的首頁改為儀表板
  { 
    path: '/', 
    redirect: '/dashboard' 
  },
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  { 
    path: '/order', 
    name: 'OrderForm', 
    component: OrderForm,
    meta: { requiresAuth: true }
  },
  { 
    path: '/orders', 
    name: 'OrderList', 
    component: OrderList,
    meta: { requiresAuth: true }
  },
  { 
    path: '/profile', 
    name: 'Profile', 
    component: Profile,
    meta: { requiresAuth: true }
  },
  { 
    path: '/users', 
    name: 'UserList', 
    component: UserList,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/register', 
    name: 'Register', 
    component: Register,
    meta: { guestOnly: true }
  },
  { 
    path: '/login', 
    name: 'Login', 
    component: Login,
    meta: { guestOnly: true }
  },
]

const router = createRouter({
  history: createWebHashHistory(),  // 使用 hash 模式，非 createWebHistory
  routes
})

// 路由守衛
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.guestOnly && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router


// import { createRouter, createWebHistory } from 'vue-router'
// import OrderForm from '../views/OrderForm.vue'
// import OrderList from '../views/OrderList.vue'
// import Register from '../views/Register.vue'
// import Login from '../views/Login.vue'
// import Profile from '../views/Profile.vue'
// import UserList from '../views/UserList.vue'

// const routes = [
//   { path: '/', redirect: '/order' },
//   { path: '/order', name: 'OrderForm', component: OrderForm, meta: { requiresAuth: true } },
//   { path: '/orders', name: 'OrderList', component: OrderList, meta: { requiresAuth: true } },
//   { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
//   { path: '/login', name: 'Login', component: Login, meta: { guestOnly: true } },
//   { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
//   { path: '/users', name: 'UserList', component: UserList, meta: { requiresAuth: true, requiresAdmin: true } },
// ]

// const router = createRouter({
//   history: createWebHistory(),
//   routes
// })

// // 路由守衛
// router.beforeEach((to, from, next) => {
//   const token = localStorage.getItem('token')
//   const isAdmin = localStorage.getItem('isAdmin') === 'true'  // 需自行設定

//   if (to.meta.requiresAuth && !token) {
//     next('/login')
//   } else if (to.meta.guestOnly && token) {
//     next('/')
//   } else if (to.meta.requiresAdmin && !isAdmin) {
//     next('/')
//   } else {
//     next()
//   }
// })


// export default router