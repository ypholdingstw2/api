<template>
  <div class="register-container">
    <div class="register-card">
      <h2>註冊新帳號</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>使用者名稱 *</label>
          <input type="text" v-model="form.username" required />
        </div>
        <div class="form-group">
          <label>電子郵件</label>
          <input type="email" v-model="form.email" />
        </div>
        <div class="form-group">
          <label>名字</label>
          <input type="text" v-model="form.first_name" />
        </div>
        <div class="form-group">
          <label>姓氏</label>
          <input type="text" v-model="form.last_name" />
        </div>
        <div class="form-group">
          <label>密碼 *</label>
          <input type="password" v-model="form.password" required />
        </div>
        <div class="form-group">
          <label>確認密碼 *</label>
          <input type="password" v-model="form.password2" required />
        </div>
        <button type="submit" :disabled="loading">註冊</button>
      </form>
      <p class="message" v-if="message" :class="messageType">{{ message }}</p>
      <p>已有帳號？ <router-link to="/login">登入</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const loading = ref(false)
const message = ref('')
const messageType = ref('')

const form = ref({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  password2: ''
})

const handleRegister = async () => {
  loading.value = true
  message.value = ''
  const result = await userStore.register(form.value)
  if (result.success) {
    message.value = '註冊成功！請登入'
    messageType.value = 'success'
    setTimeout(() => router.push('/login'), 2000)
  } else {
    message.value = Object.values(result.message).flat().join(', ')
    messageType.value = 'error'
  }
  loading.value = false
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}
.register-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 400px;
}
.form-group {
  margin-bottom: 1rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: 0.75rem;
  background: #0f3460;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.message {
  margin-top: 1rem;
  text-align: center;
}
.success { color: green; }
.error { color: red; }
</style>