// frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  // 🔑 載入環境變數（.env, .env.production 等）
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue()],
    
    // 🔑 關鍵修正：自訂網域 (api.ypascent.com.tw) 應設為 '/'
    // 若設為 '/api/'，瀏覽器會請求 /api/assets/xxx.js → 404
    base: '/',
    
    // 明確定義環境變數給前端使用
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL)
    },
    
    // ⚠️ server.proxy 僅在 "npm run dev" 開發環境生效，生產環境自動忽略
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://114.34.157.56:8000', // 開發用後端 IP
          changeOrigin: true,
          secure: false, // 若後端為 HTTP 需設 false
          // 可選：重寫路徑，若 Django 不需要 /api 前綴
          // rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    
    // 🔒 構建優化：避免 console.log 洩漏敏感資訊
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'axios']
          }
        }
      }
    }
  }
})
