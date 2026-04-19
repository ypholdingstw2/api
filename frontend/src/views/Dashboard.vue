<template>
  <div class="dashboard-layout">
    <!-- 左侧菜单 -->
    <aside class="sidebar">
      <div class="logo-area">
        <img src="/src/assets/logo.png" alt="Company Logo" class="logo" />
        <span class="company-name">YP Ascent</span>
      </div>
      <nav class="menu">
        <div 
          v-for="item in filteredMenu" 
          :key="item.id"
          class="menu-item"
          :class="{ active: currentPath === item.path }"
          @click="goTo(item.path)"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
        </div>
      </nav>
      <div class="logout-btn" @click="logout">
        🚪 登出
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <main class="main-content">
      <div class="content-header">
        <h1>歡迎，{{ userName }}</h1>
      </div>
      <div class="content-body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const userName = computed(() => userStore.currentUser?.username || '用戶')

// 菜单项（10个临时功能 + 原有功能）
const menuItems = [
  { id: 1, label: '功能 1', path: '/dashboard/func1', icon: '📊' },
  { id: 2, label: '功能 2', path: '/dashboard/func2', icon: '📈' },
  { id: 3, label: '功能 3', path: '/dashboard/func3', icon: '💹' },
  { id: 4, label: '功能 4', path: '/dashboard/func4', icon: '💰' },
  { id: 5, label: '功能 5', path: '/dashboard/func5', icon: '📋' },
  { id: 6, label: '功能 6', path: '/dashboard/func6', icon: '🔍' },
  { id: 7, label: '功能 7', path: '/dashboard/func7', icon: '⚙️' },
  { id: 8, label: '功能 8', path: '/dashboard/func8', icon: '📎' },
  { id: 9, label: '功能 9', path: '/dashboard/func9', icon: '🗂️' },
  { id: 10, label: '功能 10', path: '/dashboard/func10', icon: '📌' },
  { id: 11, label: '證券下單', path: '/dashboard/order', icon: '📝' },
  { id: 12, label: '訂單查詢', path: '/dashboard/orders', icon: '📋' },
  { id: 13, label: '個人資料', path: '/dashboard/profile', icon: '👤' },
  { id: 14, label: '使用者管理', path: '/dashboard/users', icon: '👥', adminOnly: true }
]

// 过滤管理员菜单
const filteredMenu = computed(() => {
  const isAdmin = userStore.currentUser?.is_staff === true
  return menuItems.filter(item => !item.adminOnly || isAdmin)
})

const currentPath = ref(route.path)

watch(() => route.path, (newPath) => {
  currentPath.value = newPath
}, { immediate: true })

const goTo = (path) => {
  router.push(path)
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
  min-height: 100vh;
  background: #f0f2f5;
}

/* 侧边栏样式 */
.sidebar {
  width: 260px;
  background: #001529;
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
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

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  cursor: pointer;
  transition: all 0.3s;
  color: rgba(255,255,255,0.85);
}

.menu-item:hover {
  background: #1890ff;
  color: white;
}

.menu-item.active {
  background: #1890ff;
  color: white;
}

.menu-icon {
  font-size: 18px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.menu-label {
  font-size: 14px;
}

.logout-btn {
  margin: 16px;
  padding: 10px;
  text-align: center;
  background: #f5222d;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #ff4d4f;
}

/* 右侧主内容 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.content-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.content-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.content-body {
  padding: 24px;
  flex: 1;
}
</style>