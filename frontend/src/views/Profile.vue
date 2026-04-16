<template>
  <div class="profile">
    <div class="page-header">
      <button @click="goBack" class="back-btn">← 返回儀表板</button>
      <h2>👤 個人資料</h2>
    </div>
    
    <div v-if="userStore.currentUser">
      <form @submit.prevent="updateProfile">
        <div class="form-group">
          <label>使用者名稱</label>
          <input type="text" v-model="userStore.currentUser.username" disabled />
        </div>
        <div class="form-group">
          <label>電子郵件</label>
          <input type="email" v-model="editForm.email" />
        </div>
        <div class="form-group">
          <label>名字</label>
          <input type="text" v-model="editForm.first_name" />
        </div>
        <div class="form-group">
          <label>姓氏</label>
          <input type="text" v-model="editForm.last_name" />
        </div>
        <button type="submit" class="btn-primary">更新資料</button>
      </form>

      <hr />
      
      <h3>修改密碼</h3>
      <form @submit.prevent="changePassword">
        <div class="form-group">
          <label>舊密碼</label>
          <input type="password" v-model="passwordForm.old_password" />
        </div>
        <div class="form-group">
          <label>新密碼</label>
          <input type="password" v-model="passwordForm.new_password" />
        </div>
        <div class="form-group">
          <label>確認新密碼</label>
          <input type="password" v-model="passwordForm.new_password2" />
        </div>
        <button type="submit" class="btn-primary">修改密碼</button>
      </form>

      <hr />
      
      <button @click="deleteSelf" class="btn-danger">刪除帳號</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const editForm = ref({
  email: '',
  first_name: '',
  last_name: ''
})

const passwordForm = ref({
  old_password: '',
  new_password: '',
  new_password2: ''
})

const goBack = () => {
  router.push('/dashboard')
}

onMounted(async () => {
  await userStore.fetchProfile()
  editForm.value = {
    email: userStore.currentUser.email || '',
    first_name: userStore.currentUser.first_name || '',
    last_name: userStore.currentUser.last_name || ''
  }
})

const updateProfile = async () => {
  const result = await userStore.updateProfile(editForm.value)
  if (result.success) {
    alert('個人資料更新成功')
  } else {
    alert('更新失敗：' + JSON.stringify(result.message))
  }
}

const changePassword = async () => {
  const result = await userStore.changePassword(passwordForm.value)
  if (result.success) {
    alert('密碼修改成功，請重新登入')
    localStorage.removeItem('token')
    router.push('/login')
  } else {
    alert('修改失敗：' + JSON.stringify(result.message))
  }
}

const deleteSelf = async () => {
  if (confirm('確定要刪除自己的帳號嗎？此動作無法復原。')) {
    const result = await userStore.deleteSelf()
    if (result.success) {
      localStorage.removeItem('token')
      router.push('/login')
    } else {
      alert('刪除失敗：' + result.message)
    }
  }
}
</script>

<style scoped>
.profile {
  max-width: 500px;
  margin: 0 auto;
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-top: 2rem;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.back-btn:hover {
  background: #5a6268;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:disabled {
  background: #f5f5f5;
  color: #999;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: #0f3460;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #1a4a7a;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.btn-danger:hover {
  background: #c82333;
}

hr {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid #eee;
}
</style>