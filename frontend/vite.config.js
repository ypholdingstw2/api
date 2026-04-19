import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  // 根据模式决定是否需要生产路径
  const isProduction = mode === 'production'
  
  return {
    plugins: [vue()],
    // 开发环境必须为 '/'，生产环境可设为 '/api/'（如果你部署在子路径）
    base: isProduction ? '/api/' : '/',
    server: {
      port: 5173,
      host: '0.0.0.0',        // 允许内网访问
      proxy: {
        '/api': {
          target: 'http://192.168.200.147:8000',   // 内网后端 IP
          changeOrigin: true,
          // 保持 /api 前缀，不重写路径
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // 生产环境可开启代码分割
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          }
        }
      }
    }
  }
})