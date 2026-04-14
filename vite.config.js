// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [vue()],
// })


import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/api/', // 这里必须和你的GitHub仓库名一致，注意前后的斜杠
})
