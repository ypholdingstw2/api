根據您的架構需求，我整理出完整的部署方案。假設：

- **前端**：GitHub Pages 託管靜態檔案，域名 `ypascent.com.tw` 指向 GitHub Pages（透過 CNAME 記錄）。
- **後端**：有固定 IP 的伺服器（例如 `203.0.113.10`），執行 Django + 資料庫，並開放 API 端口（建議使用子域名如 `api.ypascent.com.tw` 指向該 IP）。

---

## 一、DNS 設定建議

| 記錄類型 | 主機名稱 | 值 | 說明 |
|---------|---------|-----|------|
| A | ypascent.com.tw | GitHub Pages IP (185.199.108.153 等) 或使用 CNAME | 指向 GitHub Pages |
| CNAME | www | ypascent.com.tw | 將 www 指向主域名 |
| A | api | 您的後端伺服器固定 IP | API 子域名 |
| CNAME | 可選 | 若使用 Cloudflare 等 | |

> **注意**：GitHub Pages 不支援自訂 IP，必須使用 CNAME 指向 `username.github.io`，或設定 A 記錄指向 GitHub 的 IP 清單（`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`）。建議使用 CNAME 方式。

---

## 二、前端（Vue）部署設定

### 1. 修改前端 API 基底路徑

在 Vue 專案中，根據環境變數切換 API 位址：

**`.env.production`**（放在 frontend 根目錄）
```bash
VITE_API_BASE_URL=https://api.ypascent.com.tw/api
```

**`src/api/index.js`** 修改為：
```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
})

// 其餘攔截器保持不變
```

### 2. 打包前端

```bash
cd frontend
npm run build
```

產生的 `dist/` 目錄即為靜態檔案。

### 3. 上傳到 GitHub Pages

- 建立 GitHub 倉庫，例如 `ypascent/frontend`
- 將 `dist/` 內所有檔案推送到倉庫的 `gh-pages` 分支（或設定 Pages 從 `main` 分支的 `/docs` 資料夾讀取）
- 在倉庫 Settings → Pages → 設定分支為 `gh-pages` /root
- 在 `dist/` 內加入 `CNAME` 檔案，內容為 `ypascent.com.tw`

**快速部署腳本**（在 frontend 目錄執行）：
```bash
npm run build
echo "ypascent.com.tw" > dist/CNAME
npx gh-pages -d dist -b gh-pages
```

### 4. GitHub Actions 自動部署（可選）

建立 `.github/workflows/deploy.yml`：
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: echo "ypascent.com.tw" > dist/CNAME
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

---

## 三、後端（Django）部署設定

後端伺服器規格：固定 IP，安裝 Python、Nginx、PostgreSQL（或 SQLite）、Gunicorn。

### 1. 環境變數設定（`.env`）

在後端專案根目錄建立 `.env`：
```bash
# Django 核心
DJANGO_SECRET_KEY=正式環境請用複雜密鑰
DEBUG=False
ALLOWED_HOSTS=api.ypascent.com.tw,203.0.113.10

# 資料庫（PostgreSQL 範例）
DB_NAME=eqwizard
DB_USER=eqwizard_user
DB_PASSWORD=強密碼
DB_HOST=localhost
DB_PORT=5432

# CORS：只允許前端域名
CORS_ALLOWED_ORIGINS=https://ypascent.com.tw,https://www.ypascent.com.tw

# API 路徑前綴（若使用子路徑）
API_PREFIX=api
```

### 2. 修改 `settings.py` 讀取環境變數

```python
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# 資料庫
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ['DB_PORT'],
    }
}
# 若使用 SQLite 則改為：
# DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}

# CORS
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
CORS_ALLOW_CREDENTIALS = True

# REST Framework 關閉開發測試用的 AllowAny，改為 Session + Token
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# 靜態文件收集
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_URL = '/static/'
```

### 3. 安裝依賴與資料庫遷移

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 4. 使用 Gunicorn 執行 Django

```bash
pip install gunicorn
gunicorn --bind 127.0.0.1:8000 backend.wsgi:application
```

### 5. 設定 Nginx 反向代理（將外部請求轉發給 Gunicorn）

建立 `/etc/nginx/sites-available/api.ypascent.com.tw`：

```nginx
server {
    listen 80;
    server_name api.ypascent.com.tw;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /path/to/backend/staticfiles/;
    }
}
```

啟用站點並重啟 Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/api.ypascent.com.tw /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. 啟用 HTTPS（強烈建議）

使用 Let's Encrypt 取得 SSL 憑證：
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.ypascent.com.tw
```

自動續期。

---

## 四、資料庫與儲存

- **資料庫**：PostgreSQL 安裝在同台伺服器或獨立資料庫伺服器。
- **備份**：設定 crontab 定期備份資料庫。
- **媒體檔案**：若有用戶上傳檔案，需設定 `MEDIA_ROOT` 並由 Nginx 提供。

---

## 五、完整目錄結構（後端伺服器）

```
/home/user/eqwizard_backend/
├── .env
├── requirements.txt
├── manage.py
├── backend/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
├── orders/
│   ├── models.py
│   ├── views.py
│   └── ...
├── staticfiles/      # collectstatic 產生的靜態檔
├── db.sqlite3        # 若使用 SQLite
└── logs/             # 應用日誌
```

---

## 六、前端與後端整合測試

1. 前端部署後訪問 `https://ypascent.com.tw`
2. 前端 JavaScript 會呼叫 `https://api.ypascent.com.tw/api/orders/`
3. 確認 CORS 正確（後端已設定 `CORS_ALLOWED_ORIGINS` 包含前端域名）
4. 登入機制建議使用 Token 認證（DRF TokenAuth），前端將 Token 儲存在 localStorage 並在請求頭中加入 `Authorization: Token <token>`

---

## 七、安全強化檢查清單

- [ ] `DEBUG=False`
- [ ] `SECRET_KEY` 不在程式碼中，只存在環境變數
- [ ] 資料庫密碼強度高
- [ ] 使用 HTTPS（強制跳轉）
- [ ] 啟用 `CSRF_COOKIE_SECURE`、`SESSION_COOKIE_SECURE`
- [ ] 設定 `SECURE_HSTS_SECONDS`
- [ ] 限制 `ALLOWED_HOSTS` 只包含 `api.ypascent.com.tw`
- [ ] 定期更新套件

---

## 八、故障排除與日誌

- Django 日誌：可設定 `LOGGING` 輸出到檔案
- Nginx 存取日誌：`/var/log/nginx/access.log`
- 監控服務：使用 systemd 管理 Gunicorn，確保服務當機自動重啟

**Gunicorn systemd 服務範例**（`/etc/systemd/system/gunicorn.service`）：
```ini
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=your_user
Group=www-data
WorkingDirectory=/home/user/eqwizard_backend
EnvironmentFile=/home/user/eqwizard_backend/.env
ExecStart=/home/user/eqwizard_backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 backend.wsgi:application

[Install]
WantedBy=multi-user.target
```

啟動：
```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

---

以上設定可讓您的系統以前端 GitHub Pages + 後端自有伺服器的架構穩定運行。若需要特定環節的詳細指令（例如 PostgreSQL 安裝、SSL 申請），請告知，我會補充。






我們將基於現有架構，設計完整的登入機制，包含：

- 後端：使用 Django REST Framework 的 TokenAuthentication（或可選 JWT），提供登入、登出、用戶資訊 API。
- 前端：登入頁面、路由守衛、Pinia 儲存 token 與用戶資訊、axios 攔截器、登入後跳轉至主畫面（功能選單），再導向下單或訂單列表。
- 安全：密碼強度驗證、Token 過期處理（可選刷新）、HTTPS 強制（生產環境）、XSS/CSRF 防護。

---

## 一、後端實作（Django）

### 1. 安裝必要套件

```bash
pip install djangorestframework djangorestframework-simplejwt  # 若要用 JWT
# 本範例先使用 DRF 內建 Token，簡單實作
pip install djangorestframework
```

### 2. 修改 `settings.py`

```python
INSTALLED_APPS = [
    ...,
    'rest_framework',
    'rest_framework.authtoken',   # 加入 Token 認證
    'corsheaders',
    'orders',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',  # 全域需要登入
    ],
}

# 若希望登入頁面也受保護，可另設
```

### 3. 建立登入 API（使用 DRF 內建）

在 `backend/urls.py` 中加入：

```python
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('orders.urls')),
    path('api/auth/', obtain_auth_token, name='api_token_auth'),   # 登入端點
    path('api/auth/logout/', views.LogoutView.as_view(), name='logout'),  # 自訂登出
]
```

### 4. 自訂登出 View（刪除 Token）

建立 `accounts` 應用或用 `orders/views.py` 新增：

```python
# orders/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 刪除用戶的 token
        request.user.auth_token.delete()
        return Response({"message": "登出成功"}, status=200)
```

並在 `orders/urls.py` 加入路由（或另建 `accounts/urls.py`）：

```python
from django.urls import path
from .views import LogoutView

urlpatterns += [
    path('auth/logout/', LogoutView.as_view(), name='logout'),
]
```

### 5. 獲取當前用戶資訊 API

```python
# orders/views.py
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
```

路由：
```python
path('user/info/', UserInfoView.as_view(), name='user_info'),
```

### 6. 修改訂單 API 權限

`OrderViewSet` 已設定 `permission_classes = [permissions.IsAuthenticated]`，不需要改。

### 7. 資料庫遷移

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 二、前端實作（Vue 3 + Pinia + Router）

### 1. 新增登入頁面 `Login.vue`

```vue
<!-- src/views/Login.vue -->
<template>
  <div class="login-container">
    <div class="login-card">
      <h2>投資交易系統登入</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>帳號</label>
          <input type="text" v-model="username" required autofocus />
        </div>
        <div class="form-group">
          <label>密碼</label>
          <input type="password" v-model="password" required />
        </div>
        <button type="submit" :disabled="loading">登入</button>
        <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await authStore.login(username.value, password.value)
    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err.response?.data?.non_field_errors?.[0] || '登入失敗，請檢查帳號密碼'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f0f2f5;
}
.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 350px;
}
.form-group {
  margin-bottom: 1rem;
}
input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: 0.7rem;
  background: #0f3460;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.error {
  color: red;
  margin-top: 1rem;
}
</style>
```

### 2. 主畫面（功能選單）`Dashboard.vue`

```vue
<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard">
    <h1>歡迎，{{ user?.username }}</h1>
    <div class="feature-grid">
      <div class="feature-card" @click="goTo('/order')">
        <div class="icon">📝</div>
        <h3>證券下單</h3>
        <p>即時委託下單</p>
      </div>
      <div class="feature-card" @click="goTo('/orders')">
        <div class="icon">📋</div>
        <h3>訂單查詢</h3>
        <p>查詢委託紀錄</p>
      </div>
      <div class="feature-card" @click="logout">
        <div class="icon">🚪</div>
        <h3>登出</h3>
        <p>安全退出系統</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const goTo = (path) => {
  router.push(path)
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}
.feature-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
</style>
```

### 3. 修改路由 `router/index.js`

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import OrderForm from '../views/OrderForm.vue'
import OrderList from '../views/OrderList.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { requiresGuest: true } },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/order', name: 'OrderForm', component: OrderForm, meta: { requiresAuth: true } },
  { path: '/orders', name: 'OrderList', component: OrderList, meta: { requiresAuth: true } },
  { path: '/', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守衛
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
```

### 4. Pinia Store `stores/auth.js`

```javascript
import { defineStore } from 'pinia'
import api from '../api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(username, password) {
      const response = await api.post('/auth/', { username, password })  // 端點 /api/auth/
      const token = response.data.token
      this.token = token
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Token ${token}`
      await this.fetchUser()
    },
    async fetchUser() {
      const response = await api.get('/user/info/')
      this.user = response.data
    },
    async logout() {
      await api.post('/auth/logout/').catch(() => {}) // 忽略錯誤
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    },
    initialize() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        api.defaults.headers.common['Authorization'] = `Token ${token}`
        this.fetchUser().catch(() => {
          // token 無效，清除
          this.logout()
        })
      }
    },
  },
})
```

### 5. 修改 `main.js` 初始化 auth

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 初始化認證狀態
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')
```

### 6. 修改 `api/index.js` 加入 token 攔截器（已做）

注意：原本已有請求攔截器加入 token，不需改。

### 7. 修改 `App.vue` 只保留 router-view，移除導航欄（導航欄可放在 Dashboard 之後）

建議將導航欄獨立為組件，僅在登入後顯示。可調整 `App.vue`：

```vue
<template>
  <div id="app">
    <NavBar v-if="authStore.isAuthenticated" />
    <router-view />
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import NavBar from './components/NavBar.vue'

const authStore = useAuthStore()
</script>
```

並建立 `components/NavBar.vue` 包含原本的導航選單（下單、訂單列表、登出按鈕）。

### 8. 調整原有下單頁面和訂單列表頁面，移除模擬登入的 localStorage 設定

原本 `App.vue` 的 `onMounted` 中有 `localStorage.setItem('token', 'test-token-12345')`，請刪除。

---

## 三、安全強化措施

### 後端

- 密碼儲存：Django 預設使用 PBKDF2 雜湊，安全。
- Token 儲存：資料庫中 Token 是雜湊值，無法反向。
- 強制 HTTPS（生產環境）：
  ```python
  SECURE_SSL_REDIRECT = True
  SESSION_COOKIE_SECURE = True
  CSRF_COOKIE_SECURE = True
  ```
- 限制 CORS 只允許前端域名：
  ```python
  CORS_ALLOWED_ORIGINS = ["https://ypascent.com.tw", "https://www.ypascent.com.tw"]
  ```
- 啟用 CSRF 保護（對於 Session 認證，但 Token 認證不受 CSRF 影響，可忽略）。
- 限制登入嘗試次數（使用 `django-ratelimit` 或 `axes`）。

### 前端

- 登入表單防止 XSS（Vue 自動轉義）。
- Token 儲存在 localStorage，注意 XSS 風險（可考慮 httpOnly cookie，但需配合後端設定）。為簡化，先使用 localStorage。
- 路由守衛防止未授權訪問。
- 登出時清除本地 token。

---

## 四、完整檔案結構（新增部分）

```
frontend/src/
├── api/
│   ├── index.js
│   └── order.js
├── components/
│   └── NavBar.vue          # 導航欄
├── stores/
│   ├── auth.js             # 新增
│   └── order.js
├── views/
│   ├── Login.vue           # 新增
│   ├── Dashboard.vue       # 新增
│   ├── OrderForm.vue
│   └── OrderList.vue
├── router/
│   └── index.js            # 修改
├── main.js                 # 修改
└── App.vue                 # 修改
```

---

## 五、測試流程

1. 後端啟動，執行 `python manage.py createsuperuser` 建立測試帳號。
2. 前端啟動，訪問 `http://localhost:5173`，自動跳轉至 `/login`。
3. 輸入正確帳號密碼，登入成功後跳轉至 `/dashboard` 主畫面。
4. 點擊「證券下單」進入下單頁面，可正常下單。
5. 點擊「訂單查詢」可看到訂單列表。
6. 點擊「登出」返回登入頁。

---

## 六、補充：JWT 選項（替代 Token）

若希望 Token 有過期時間，可改用 `djangorestframework-simplejwt`。安裝後修改 `settings.py`：

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

登入端點改為 `token/` 取得 access/refresh，前端需實作 refresh 機制。本範例暫以簡單 Token 為主。

---

以上完整登入機制已可整合至現有系統。請按照步驟新增檔案，即可實現安全登入與功能選單主畫面。





功能選單頁面需對接 50 個以上不同類型的 API（同步計算、非同步流程），架構上除了基本的登入與權限管理外，還需額外考慮以下幾個層面，以確保系統的穩定性、效能與可維護性。

---

## 一、API 分類與對應的處理模式

| 類型 | 特徵 | 前端互動方式 | 後端建議技術 |
|------|------|--------------|--------------|
| **同步計算型 API**（如財務模型即時計算） | 請求後需等待結果，耗時數秒至數十秒 | 發送請求 → 顯示 Loading → 接收結果 → 更新頁面 | Django REST Framework (DRF) + 優化計算（快取、非同步執行緒） |
| **非同步流程型 API**（如批次風險計算、報表產生） | 觸發後不即時返回結果，需背景執行 | 請求後立即獲得 task_id → 輪詢或 WebSocket 接收進度/結果 | DRF + **Celery** + Redis/RabbitMQ |
| **混合型**（部分計算可同步，部分需拆分） | 複雜計算可拆解為多個步驟 | 先同步取得預覽，再觸發背景完整計算 | 同步 + 非同步結合 |

---

## 二、後端架構擴充建議

### 1. 非同步任務佇列（Celery）

```bash
pip install celery redis
```

- 所有耗時超過 5 秒或可能失敗重試的 API 都改為非同步模式。
- 提供端點：
  - `POST /api/calc/async/` → 返回 `{"task_id": "uuid"}`
  - `GET /api/calc/status/<task_id>/` → 返回狀態（PENDING/STARTED/SUCCESS/FAILURE）與結果（若完成）
- Celery Worker 可水平擴充，避免阻塞 Django 請求。

### 2. 同步 API 的效能優化

- **快取**：財務模型參數相同時，使用 Redis 快取結果（TTL 依模型更新頻率設定）。
- **非阻塞計算**：若計算為 CPU 密集型，使用 `concurrent.futures.ThreadPoolExecutor` 或 Celery 同步調用（但會佔用 worker）。
- **資料庫讀取優化**：使用 `select_related`、`only`、索引。

### 3. API 版本管理

```python
# urls.py
path('api/v1/', include('api_v1.urls')),
path('api/v2/', include('api_v2.urls')),
```

- 前端可指定版本，未來升級不影響舊版。

### 4. 限流（Rate Limiting）

防止單一用戶過度呼叫昂貴計算 API：

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '100/hour',      # 每小時 100 次
        'calc_sync': '20/hour',  # 昂貴計算限流
    }
}
```

### 5. 任務狀態與結果儲存

- Celery 結果後端使用 Redis（適合暫存）或資料庫（持久化）。
- 重要計算結果應存入 Django 模型（例如 `CalculationResult`），供歷史查詢。

---

## 三、前端設計考量

### 1. 統一呼叫層（Service Layer）

建立 `src/services/calculation.js`：

```javascript
// 同步呼叫
export async function syncCalculate(params) {
  const response = await api.post('/calc/sync/', params)
  return response.data
}

// 非同步呼叫 + 輪詢
export async function asyncCalculate(params) {
  const { task_id } = await api.post('/calc/async/', params)
  return pollTaskStatus(task_id)
}

function pollTaskStatus(taskId, interval = 1000, maxAttempts = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const intervalId = setInterval(async () => {
      attempts++
      const { status, result, error } = await api.get(`/calc/status/${taskId}/`)
      if (status === 'SUCCESS') {
        clearInterval(intervalId)
        resolve(result)
      } else if (status === 'FAILURE') {
        clearInterval(intervalId)
        reject(new Error(error))
      } else if (attempts >= maxAttempts) {
        clearInterval(intervalId)
        reject(new Error('計算逾時'))
      }
    }, interval)
  })
}
```

### 2. 前端狀態管理（Pinia）

為每個計算功能建立獨立的 store 或共用一個 `calculation` store，管理 loading、錯誤、結果快取。

### 3. 使用者體驗

- 同步計算：顯示進度條或「計算中…」，超過 10 秒應提示可切換為非同步模式。
- 非同步流程：提供任務進度查詢頁面或 WebSocket 即時推送。
- 可選：使用 WebSocket 取代輪詢（適合大量併發任務）。

---

## 四、架構圖（文字描述）

```
[前端 Vue SPA] 
  │
  ├─ 同步 API ──→ Django REST API (限流、快取) ──→ 計算模組 (直接回傳)
  │
  └─ 非同步 API ─→ Django REST API ─→ 發送任務至 Celery Broker (Redis)
                                      │
                                      ↓
                               Celery Worker 執行計算
                                      │
                                      ↓
                               更新資料庫/Redis 結果
                                      │
                                      ↓
                    前端輪詢 task status API ←── Django 讀取結果
```

---

## 五、安全性與合規

- 所有 API 都需要 Token 認證（已實作）。
- 記錄每個計算 API 的呼叫日誌（使用者、時間、參數、結果摘要），用於審計。
- 對昂貴計算設定資源配額（每用戶每日配額）。
- 敏感計算結果（如投資建議）應加密儲存。

---

## 六、可觀測性與監控

- 使用 **Django Silk** 或 **django-debug-toolbar** 分析同步 API 效能。
- 使用 **Flower** 監控 Celery 任務隊列。
- 設定 **Sentry** 追蹤異常。
- 記錄每個 API 的 P99 延遲，超過閾值發送警報。

---

## 七、部署建議（針對 50+ API 的規模）

- **Django**：使用 Gunicorn + Uvicorn workers（非同步支援），搭配 Nginx。
- **Celery**：獨立 worker 容器，可依計算類型分為不同佇列（高優先級、低優先級）。
- **Redis**：作為 Broker 與結果後端，建議使用持久化設定。
- **資料庫**：PostgreSQL 為主，讀寫分離（若查詢量大）。
- **快取**：Redis 也用於快取同步計算結果。

---

## 八、API 設計範例（對應功能選單）

| 選單功能 | API 方法 | 類型 | 說明 |
|---------|----------|------|------|
| 夏普比率計算 | POST /api/v1/calc/sharpe/ | 同步 | 回傳數值 |
| 投資組合風險分析 | POST /api/v1/calc/risk/ | 非同步 | 回傳 task_id |
| 壓力測試 | POST /api/v1/calc/stress/ | 非同步 | 背景執行，結果存入報表 |
| 即時估值 | GET /api/v1/valuation/{symbol}/ | 同步（快取） | 每秒更新一次 |
| 匯出計算報表 | POST /api/v1/report/export/ | 非同步 | 完成後產生下載連結 |

---

## 九、總結架構需要考慮的重點

1. **區分同步與非同步**：避免長時間佔用 HTTP 連線。
2. **任務佇列**：Celery 是不可或缺的元件。
3. **前端輪詢/WebSocket**：非同步任務要有良好的用戶體驗。
4. **快取策略**：減少重複計算，提高同步 API 回應速度。
5. **限流與配額**：保護後端資源不被濫用。
6. **日誌與審計**：金融系統必備。
7. **可擴充性**：API 版本管理、微服務拆分（未來可能需要）。

依照上述架構，您可以安全地將 50 個計算 API 整合進現有系統，同時保持良好的擴展性與維護性。若需要特定環節（如 Celery 與 Django 整合的程式碼範例），請告訴我。