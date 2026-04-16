<template>
  <div class="dashboard">
    <h1 class="title">📊 投資交易系統</h1>
    <p class="welcome">歡迎，{{ userStore.currentUser?.username || '用戶' }}</p>
    
    <div class="function-grid">
      <div class="function-card" @click="goTo('/order')">
        <div class="icon">📝</div>
        <h3>證券下單</h3>
        <p>股票、ETF、期貨下單交易</p>
      </div>
      
      <div class="function-card" @click="goTo('/orders')">
        <div class="icon">📋</div>
        <h3>訂單查詢</h3>
        <p>查詢委託記錄與成交回報</p>
      </div>
      
      <div class="function-card" @click="goTo('/profile')">
        <div class="icon">👤</div>
        <h3>個人資料</h3>
        <p>修改個人資訊與密碼</p>
      </div>
      
      <div class="function-card" v-if="isAdmin" @click="goTo('/users')">
        <div class="icon">👥</div>
        <h3>使用者管理</h3>
        <p>管理系統使用者帳號</p>
      </div>
    </div>
    
    <div class="logout-section">
      <button @click="logout" class="logout-btn">🚪 登出系統</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const isAdmin = computed(() => {
  return userStore.currentUser?.is_staff === true
})

const goTo = (path) => {
  router.push(path)
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('isAdmin')
  userStore.currentUser = null
  router.push('/login')
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  font-size: 2rem;
  color: #1a1a2e;
  text-align: center;
  margin-bottom: 0.5rem;
}

.welcome {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.function-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.function-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.function-card h3 {
  font-size: 1.2rem;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.function-card p {
  font-size: 0.85rem;
  color: #666;
}

.logout-section {
  text-align: center;
  margin-top: 2rem;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #c82333;
}
</style>