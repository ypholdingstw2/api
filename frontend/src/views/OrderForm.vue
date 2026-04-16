<template>
  <div class="order-form">
    <div class="page-header">
      <button @click="goBack" class="back-btn">← 返回儀表板</button>
      <h1 class="page-title">📝 證券下單</h1>
    </div>
    
    <div class="form-card">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>交易標的 *</label>
          <input 
            type="text" 
            v-model="form.symbol" 
            placeholder="請輸入股票代碼，如 2330.TW"
            required
          />
        </div>

        <div class="form-group">
          <label>買賣方向 *</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" value="BUY" v-model="form.order_type" />
              <span class="buy">📈 買入</span>
            </label>
            <label class="radio-label">
              <input type="radio" value="SELL" v-model="form.order_type" />
              <span class="sell">📉 賣出</span>
            </label>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>價格 *</label>
            <div class="input-with-unit">
              <input 
                type="number" 
                step="0.01" 
                v-model.number="form.price" 
                placeholder="請輸入價格"
                required
              />
              <span class="unit">元</span>
            </div>
          </div>

          <div class="form-group">
            <label>數量 *</label>
            <div class="input-with-unit">
              <input 
                type="number" 
                step="1000" 
                v-model.number="form.quantity" 
                placeholder="請輸入數量"
                required
              />
              <span class="unit">股</span>
            </div>
          </div>
        </div>

        <div class="order-preview" v-if="form.price && form.quantity">
          <h3>💰 訂單預覽</h3>
          <div class="preview-item">
            <span>預估金額：</span>
            <strong class="amount">NT$ {{ computedAmount.toLocaleString() }}</strong>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="resetForm">🔄 重置</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '提交中...' : '✅ 確認下單' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="message" class="alert" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderStore } from '../stores/order'

const router = useRouter()
const orderStore = useOrderStore()
const loading = ref(false)
const message = ref('')
const messageType = ref('success')

const form = ref({
  symbol: '',
  order_type: 'BUY',
  price: null,
  quantity: null
})

const computedAmount = computed(() => {
  if (form.value.price && form.value.quantity) {
    return form.value.price * form.value.quantity
  }
  return 0
})

const goBack = () => {
  router.push('/dashboard')
}

const resetForm = () => {
  form.value = {
    symbol: '',
    order_type: 'BUY',
    price: null,
    quantity: null
  }
  message.value = ''
}

const handleSubmit = async () => {
  if (!form.value.symbol) {
    showMessage('請輸入交易標的', 'error')
    return
  }
  if (form.value.price <= 0) {
    showMessage('請輸入有效的價格', 'error')
    return
  }
  if (form.value.quantity <= 0) {
    showMessage('請輸入有效的數量', 'error')
    return
  }

  loading.value = true
  message.value = ''

  try {
    const result = await orderStore.createOrder({
      symbol: form.value.symbol,
      order_type: form.value.order_type,
      price: form.value.price,
      quantity: form.value.quantity
    })

    if (result.success) {
      showMessage(`✅ 訂單提交成功！訂單號：${result.data.data.order_id}`, 'success')
      resetForm()
    } else {
      showMessage(result.message || '下單失敗，請稍後重試', 'error')
    }
  } catch (error) {
    showMessage('網路錯誤，請檢查連線', 'error')
  } finally {
    loading.value = false
  }
}

const showMessage = (msg, type) => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}
</script>

<style scoped>
.order-form {
  max-width: 700px;
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

.form-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

.form-group input[type="text"],
.form-group input[type="number"] {
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.radio-group {
  display: flex;
  gap: 2rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-label .buy {
  color: #e74c3c;
  font-weight: 500;
}

.radio-label .sell {
  color: #2ecc71;
  font-weight: 500;
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.input-with-unit input {
  flex: 1;
}

.unit {
  color: #666;
  min-width: 40px;
}

.order-preview {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.order-preview h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #555;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  font-size: 1.2rem;
  color: #e74c3c;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.3s;
}

.btn:hover {
  opacity: 0.9;
}

.btn-primary {
  background: #0f3460;
  color: white;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.alert {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 6px;
}

.alert.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>