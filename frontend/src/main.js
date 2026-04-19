// import { createApp } from 'vue'
// import './style.css'
// import App from './App.vue'

// createApp(App).mount('#app')


// frontend/src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')



// import { createApp } from 'vue'
// import { createPinia } from 'pinia'
// import App from './App.vue'
// import router from './router'

// // 先建立 app
// const app = createApp(App)

// // 依序註冊 Pinia 和 Router
// app.use(createPinia())  // Pinia 必須先註冊
// app.use(router)         // 然後註冊 Router
// app.config.errorHandler = (err) => console.error(err)

// // 掛載 app
// app.mount('#app')

// console.log('Vue app mounted successfully')