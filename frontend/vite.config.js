

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'


export default defineConfig({
  plugins: [vue()],
  // base: 'ypholdingstw2/api/',  // 這裡放你的 GitHub 倉庫名稱
  // base: '/api/',  // 這裡放你的 GitHub 倉庫名稱
  base: '/',  // // 关键：使用自定义域名时设为 '/'，而非 '/api/'
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://114.34.157.56:8000',
        changeOrigin: true,
      }
    }
  }
})
