<template>
  <div class="user-list">
    <div class="page-header">
      <button @click="goBack" class="back-btn">← 返回儀表板</button>
      <h2>👥 使用者管理</h2>
    </div>
    
    <div v-if="userStore.loading">載入中...</div>
    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>使用者名稱</th>
            <th>Email</th>
            <th>姓名</th>
            <th>註冊時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in userStore.users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.first_name }} {{ user.last_name }}</td>
            <td>{{ new Date(user.date_joined).toLocaleString() }}</td>
            <td>
              <button @click="deleteUser(user.id)" class="btn-delete">刪除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const goBack = () => {
  router.push('/dashboard')
}

onMounted(() => {
  userStore.fetchAllUsers()
})

const deleteUser = async (id) => {
  if (confirm('確定刪除此使用者？')) {
    await userStore.deleteUser(id)
  }
}
</script>

<style scoped>
.user-list {
  max-width: 1000px;
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

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: left;
}

th {
  background: #f2f2f2;
  font-weight: 600;
}

tr:hover {
  background: #f8f9fa;
}

.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-delete:hover {
  background: #c82333;
}
</style>