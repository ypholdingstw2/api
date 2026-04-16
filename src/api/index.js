import axios from 'axios'

const api = axios.create({
  // 後端 API 網址（你 ERP 的位址）
  baseURL: '/api',
  timeout: 10000,
})

// 2. 請求攔截器：發送前自動帶 Token
api.interceptors.request.use(
  (config) => {
    // 從 localStorage 或 Pinia 拿 Token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 3. 回應攔截器：統一處理後端回傳 & 錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      console.error('未授權，請重新登入')
    }
    return Promise.reject(error)
  }
)

export default api