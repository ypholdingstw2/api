// frontend/src/api/client.js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', //  fallback 機制
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // 若需攜帶 Cookie/Session
})

// 可選：加入請求/回應攔截器用於除錯或 Token 注入
apiClient.interceptors.request.use(config => {
  console.debug('[API Request]', config.method?.toUpperCase(), config.url)
  return config
})

export default apiClient