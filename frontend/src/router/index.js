import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import FuncPlaceholder from '../views/FuncPlaceholder.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const menuTree = [
  {
    id: 'account',
    label: '帳戶管理',
    icon: '👤',
    children: [
      {
        id: 'trading_account',
        label: '交易帳戶',
        icon: '💳',
        children: [
          { id: 'trading_account_add', label: '新增', path: '/dashboard/account/trading-account/add', icon: '➕' },
          { id: 'trading_account_edit', label: '修改', path: '/dashboard/account/trading-account/edit', icon: '✏️' },
          { id: 'trading_account_delete', label: '刪除', path: '/dashboard/account/trading-account/delete', icon: '🗑️' },
          { id: 'trading_account_query', label: '查詢', path: '/dashboard/account/trading-account/query', icon: '🔍' }
        ]
      }
    ]
  }
]

function collectLeafRoutes(items) {
  let routes = []
  for (const item of items) {
    if (item.children) {
      routes.push(...collectLeafRoutes(item.children))
    } else if (item.path) {
      const relativePath = item.path.replace(/^\/dashboard\//, '')
      routes.push({
        path: relativePath,
        name: item.id,
        component: FuncPlaceholder,
        props: { label: item.label, parentLabel: item.parentLabel || '' },
        meta: { requiresAuth: true }
      })
    }
  }
  return routes
}

function enrichParentLabel(items, parentLabel = '') {
  for (const item of items) {
    if (item.children) {
      enrichParentLabel(item.children, item.label)
    } else {
      item.parentLabel = parentLabel
    }
  }
}
enrichParentLabel(menuTree)

function getFirstLeafRelativePath(items) {
  for (const item of items) {
    if (item.children) {
      const childPath = getFirstLeafRelativePath(item.children)
      if (childPath) return childPath
    } else if (item.path) {
      return item.path.replace(/^\/dashboard\//, '')
    }
  }
  return 'account/trading-account/add'
}

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: Login, meta: { guestOnly: true } },
  { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      ...collectLeafRoutes(menuTree),
      { path: '', redirect: getFirstLeafRelativePath(menuTree) }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// 关键修复：路由守卫自动补全缺失的 /dashboard 前缀
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  // 公共路径不需要补全
  const publicPaths = ['/login', '/register']
  if (publicPaths.includes(to.path)) {
    if (to.meta.guestOnly && isAuthenticated) return '/dashboard'
    return true
  }

  // 如果访问的路径不以 /dashboard 开头，并且不是公共路径，则自动补全
  if (!to.path.startsWith('/dashboard')) {
    const correctedPath = '/dashboard' + to.path
    console.log(`[Router] 自动修正路径: ${to.path} -> ${correctedPath}`)
    return correctedPath
  }

  if (to.meta.requiresAuth && !isAuthenticated) return '/login'
  return true
})

export default router