<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="logo-area">
        <img src="/src/assets/logo.png" alt="Company Logo" class="logo" />
        <span class="company-name">YP Ascent</span>
      </div>
      <nav class="menu">
        <MenuItem
          v-for="item in menuTree"
          :key="item.id"
          :item="item"
          :current-path="currentPath"
          @navigate="goTo"
        />
      </nav>
      <div class="logout-btn" @click="logout">🚪 登出</div>
    </aside>
    <main class="main-content">
      <div class="content-header"><h1>歡迎，{{ userName }}</h1></div>
      <div class="content-body"><router-view /></div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import MenuItem from '../components/MenuItem.vue'

// 菜单树（所有叶子节点 path 均以 /dashboard 开头）
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
      // 其他二级、三级功能按相同格式补充，确保 path 以 /dashboard 开头
    ]
  }
  // 其他一级功能同理
]

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const userName = computed(() => userStore.currentUser?.username || '用戶')
const currentPath = ref(route.path)

watch(() => route.path, (newPath) => {
  currentPath.value = newPath
}, { immediate: true })

// const goTo = (path) => {
//   console.log('Dashboard goTo path:', path)
//   router.push(path)
// }

const goTo = (path) => {
  console.log('Dashboard goTo path:', path)
  // 确保路径以 /dashboard 开头，如果不是则补全
  if (!path.startsWith('/dashboard')) {
    path = '/dashboard' + path
  }
  router.push(path).catch(err => console.error('路由跳转失败:', err))
}


const logout = () => {
  localStorage.removeItem('token')
  userStore.currentUser = null
  router.push('/login')
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f0f2f5;
}
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background-color: #001529;
  color: rgba(255,255,255,0.85);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  overflow-y: auto;
}
.logo-area {
  padding: 24px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 8px;
}
.company-name {
  font-size: 18px;
  font-weight: bold;
  display: block;
}
.menu {
  flex: 1;
  padding: 16px 0;
}
.logout-btn {
  margin: 16px;
  padding: 10px;
  text-align: center;
  background-color: #f5222d;
  border-radius: 4px;
  cursor: pointer;
}
.logout-btn:hover {
  background-color: #ff4d4f;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  overflow-y: auto;
}
.content-header {
  background-color: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
}
.content-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}
.content-body {
  padding: 24px;
  flex: 1;
  background-color: #fff;
  margin: 16px;
  border-radius: 8px;
}
</style>