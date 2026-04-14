<!-- frontend/src/views/Login.vue -->

<template>
  <div class="login-container">
    <div class="login-card">
      <h2>🔐 系統登入</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>使用者名稱</label>
          <input 
            type="text" 
            v-model="username" 
            placeholder="請輸入使用者名稱"
            required 
            autofocus
          />
        </div>
        <div class="form-group">
          <label>密碼</label>
          <input 
            type="password" 
            v-model="password" 
            placeholder="請輸入密碼"
            required 
          />
        </div>
        <button type="submit" :disabled="loading" class="login-btn">
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </form>
      
      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>
      
      <div class="register-link">
        還沒有帳號？ <router-link to="/register">立即註冊</router-link>
      </div>
      
      <div class="demo-info" v-if="showDemoInfo">
        <hr />
        <p>測試帳號：</p>
        <p><strong>testuser</strong> / <strong>test1234</strong></p>
        <p class="hint">請先註冊帳號，或使用上方測試帳號登入</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showDemoInfo = ref(true)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // 呼叫後端 API 取得 Token
    const response = await axios.post('/api-token-auth/', {
      username: username.value,
      password: password.value
    })
    
    const token = response.data.token
    localStorage.setItem('token', token)
    
    // 取得使用者資料
    await userStore.fetchProfile()
    
    // 儲存管理員狀態
    if (userStore.currentUser?.is_staff) {
      localStorage.setItem('isAdmin', 'true')
    } else {
      localStorage.removeItem('isAdmin')
    }
    
    // 跳轉到首頁
    router.push('/')
    
  } catch (err) {
    console.error('登入錯誤:', err)
    if (err.response?.status === 400) {
      error.value = '請輸入使用者名稱和密碼'
    } else if (err.response?.status === 401) {
      error.value = '使用者名稱或密碼錯誤'
    } else {
      error.value = '無法連線到伺服器，請確認後端是否啟動'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: #f5f5f5;
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 400px;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #1a1a2e;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #0f3460;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: #0f3460;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.login-btn:hover:not(:disabled) {
  background: #1a4a7a;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  text-align: center;
}

.register-link {
  margin-top: 1.5rem;
  text-align: center;
}

.register-link a {
  color: #0f3460;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.demo-info {
  margin-top: 1.5rem;
}

.demo-info hr {
  margin: 1rem 0;
  border: none;
  border-top: 1px solid #eee;
}

.demo-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #666;
}

.demo-info .hint {
  font-size: 0.8rem;
  color: #999;
}
</style>