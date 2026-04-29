<template>
  <div class="ma-optimization">
    <h2>移动平均线(MA)参数优化</h2>
    <form @submit.prevent="startOptimization">
      <div class="form-group">
        <label>初始资金 (元)</label>
        <input type="number" v-model.number="form.initial_assets" step="10000" min="0" />
      </div>
      <div class="form-group">
        <label>交易手续费率</label>
        <input type="number" v-model.number="form.transaction_fee_rate" step="0.0001" min="0" max="0.1" />
      </div>
      <div class="form-group">
        <label>证券交易税率</label>
        <input type="number" v-model.number="form.tax_rate" step="0.0001" min="0" max="0.1" />
      </div>
      <div class="form-group">
        <label>短期MA范围</label>
        <input type="text" v-model="form.short_ma_range" placeholder="例如: 3,92,3" />
        <small>格式: start,stop,step (半角逗号)</small>
      </div>
      <div class="form-group">
        <label>长期MA范围</label>
        <input type="text" v-model="form.long_ma_range" placeholder="例如: 6,256,6" />
        <small>格式: start,stop,step</small>
      </div>
      <div class="form-group">
        <label>Profit Factor 阈值</label>
        <input type="number" v-model.number="form.pf_threshold" step="0.1" min="0" />
      </div>
      <div class="form-group">
        <label>回测区间</label>
        <div v-for="(interval, idx) in form.intervals" :key="idx" class="interval-row">
          <input type="date" v-model="interval.start" required />
          <span>至</span>
          <input type="date" v-model="interval.end" required />
          <button type="button" @click="removeInterval(idx)" v-if="form.intervals.length > 1">删除</button>
        </div>
        <button type="button" @click="addInterval">添加区间</button>
      </div>
      <div class="form-group">
        <label>股票代码 (留空则处理所有股票，耗时很长)</label>
        <input type="text" v-model="form.stock_id" placeholder="例如 2330 或 2330.TW" />
      </div>
      <div class="form-actions">
        <button type="submit" :disabled="loading">开始优化</button>
      </div>
    </form>

    <div v-if="taskId" class="task-status">
      <h3>任务状态</h3>
      <p>任务ID: {{ taskId }}</p>
      <p>状态: {{ status }}</p>
      <p v-if="progressMessage">{{ progressMessage }}</p>
      <div v-if="progressPercent !== null" class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <div v-if="result" class="result">
      <h3>优化结果摘要</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'

// 默认参数
const form = reactive({
  initial_assets: 1000000,
  transaction_fee_rate: 0.001425,
  tax_rate: 0.003,
  short_ma_range: '3,92,3',
  long_ma_range: '6,256,6',
  pf_threshold: 0.5,
  intervals: [
    { start: '2013-01-01', end: '2015-12-31' },
    { start: '2016-01-01', end: '2019-12-31' },
    { start: '2020-01-01', end: '2024-12-31' }
  ],
  stock_id: ''
})

const loading = ref(false)
const taskId = ref(null)
const status = ref('')
const progressMessage = ref('')
const progressPercent = ref(null)
const result = ref(null)
let pollInterval = null

// 解析 "start,stop,step" 字符串为数组
const parseRange = (rangeStr) => {
  const parts = rangeStr.split(',').map(Number)
  if (parts.length !== 3) throw new Error('范围格式必须为 start,stop,step')
  const [start, stop, step] = parts
  const arr = []
  for (let i = start; i < stop; i += step) arr.push(i)
  return arr
}

const addInterval = () => {
  form.intervals.push({ start: '', end: '' })
}

const removeInterval = (idx) => {
  form.intervals.splice(idx, 1)
}

const startOptimization = async () => {
  loading.value = true
  taskId.value = null
  status.value = ''
  progressMessage.value = ''
  progressPercent.value = null
  result.value = null
  if (pollInterval) clearInterval(pollInterval)

  try {
    // 构建请求参数
    const payload = {
      stock_id: form.stock_id || null,
      initial_assets: form.initial_assets,
      transaction_fee_rate: form.transaction_fee_rate,
      tax_rate: form.tax_rate,
      short_ma_range: parseRange(form.short_ma_range),
      long_ma_range: parseRange(form.long_ma_range),
      pf_threshold: form.pf_threshold,
      intervals: form.intervals.map(i => [i.start, i.end])
    }
    const res = await axios.post('/api/backtest/ma-optimize/', payload)
    taskId.value = res.data.task_id
    pollStatus()
  } catch (err) {
    console.error(err)
    alert('启动任务失败: ' + (err.response?.data?.error || err.message))
  } finally {
    loading.value = false
  }
}

const pollStatus = () => {
  pollInterval = setInterval(async () => {
    if (!taskId.value) return
    try {
      const res = await axios.get(`/api/backtest/task-status/${taskId.value}/`)
      status.value = res.data.status
      if (res.data.info) {
        progressMessage.value = res.data.info.message || ''
        if (res.data.info.current !== undefined && res.data.info.total !== undefined) {
          progressPercent.value = Math.round((res.data.info.current / res.data.info.total) * 100)
        }
      }
      if (res.data.status === 'SUCCESS') {
        result.value = res.data.result
        clearInterval(pollInterval)
      } else if (res.data.status === 'FAILURE') {
        clearInterval(pollInterval)
      }
    } catch (err) {
      console.error(err)
    }
  }, 2000)
}
</script>

<style scoped>
.ma-optimization {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}
.form-group input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.interval-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}
.interval-row input {
  flex: 1;
}
small {
  font-size: 12px;
  color: #666;
}
.form-actions {
  margin-top: 20px;
}
button {
  background-color: #0f3460;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
}
.task-status {
  margin-top: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}
.progress-bar {
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  height: 20px;
  margin-top: 8px;
}
.progress-fill {
  background-color: #0f3460;
  height: 100%;
  width: 0%;
}
.result {
  margin-top: 20px;
  background: #fafafa;
  padding: 10px;
  border-radius: 4px;
}
</style>