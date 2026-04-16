<template>
  <div class="order-list">
    <div class="page-header">
      <button @click="goBack" class="back-btn">← 返回儀表板</button>
      <h1 class="page-title">📋 訂單列表</h1>
    </div>
    
    <div class="filter-bar">
      <select v-model="statusFilter" @change="loadOrders">
        <option value="">全部訂單</option>
        <option value="0">待處理</option>
        <option value="1">已確認</option>
        <option value="2">已成交</option>
        <option value="3">已取消</option>
        <option value="4">已拒絕</option>
      </select>
      <button @click="loadOrders" class="btn-refresh">🔄 刷新</button>
    </div>

    <div v-if="orderStore.loading" class="loading">
      ⏳ 載入中...
    </div>

    <div v-else class="table-container">
      <table class="order-table">
        <thead>
          <tr>
            <th>訂單號</th>
            <th>交易標的</th>
            <th>買賣方向</th>
            <th>價格</th>
            <th>數量</th>
            <th>金額</th>
            <th>狀態</th>
            <th>下單時間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orderStore.orders" :key="order.id">
            <td class="order-id">{{ order.order_id }}</td>
            <td><strong>{{ order.symbol }}</strong></td>
            <td>
              <span :class="order.order_type === 'BUY' ? 'buy-text' : 'sell-text'">
                {{ order.order_type_display }}
              </span>
            </td>
            <td>{{ formatPrice(order.price) }}</td>
            <td>{{ formatNumber(order.quantity) }}</td>
            <td>{{ formatNumber(order.amount) }}</td>
            <td>
              <span :class="getStatusClass(order.status)">
                {{ order.status_display }}
              </span>
            </td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>
              <button 
                v-if="order.status === 0" 
                @click="handleCancel(order.id)"
                class="btn-cancel"
              >
                取消
              </button>
              <span v-else class="no-action">-</span>
            </td>
          </tr>
          <tr v-if="orderStore.orders.length === 0">
            <td colspan="9" class="empty-state">📭 暫無訂單數據</td>
          </tr>
        </tbody>
       </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore } from '../stores/order'

const router = useRouter()
const orderStore = useOrderStore()
const statusFilter = ref('')

const goBack = () => {
  router.push('/dashboard')
}

const loadOrders = async () => {
  const params = {}
  if (statusFilter.value) {
    params.status = statusFilter.value
  }
  await orderStore.fetchOrders(params)
}

const handleCancel = async (orderId) => {
  if (confirm('確定要取消這筆訂單嗎？')) {
    const result = await orderStore.cancelOrder(orderId)
    if (result.success) {
      alert('✅ 訂單已取消')
      await loadOrders()
    } else {
      alert(result.message || '取消訂單失敗')
    }
  }
}

const formatPrice = (price) => {
  return `NT$ ${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

const formatNumber = (num) => {
  return parseFloat(num).toLocaleString()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-TW')
}

const getStatusClass = (status) => {
  const classes = {
    0: 'status-pending',
    1: 'status-confirmed',
    2: 'status-filled',
    3: 'status-cancelled',
    4: 'status-rejected'
  }
  return classes[status] || 'status-default'
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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

.page-title {
  font-size: 1.8rem;
  color: #1a1a2e;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-bar select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background: #0f3460;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.order-table th,
.order-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.order-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.order-table tr:hover {
  background: #f8f9fa;
}

.order-id {
  font-family: monospace;
  font-size: 0.85rem;
}

.buy-text {
  color: #e74c3c;
  font-weight: 500;
}

.sell-text {
  color: #2ecc71;
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.status-confirmed {
  background: #cce5ff;
  color: #004085;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.status-filled {
  background: #d4edda;
  color: #155724;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.status-cancelled {
  background: #f8d7da;
  color: #721c24;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.status-rejected {
  background: #f8d7da;
  color: #721c24;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.btn-cancel {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-cancel:hover {
  background: #c82333;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 3rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.no-action {
  color: #999;
}
</style>