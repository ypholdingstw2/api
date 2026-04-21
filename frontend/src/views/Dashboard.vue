<template>
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="logo-area">
        <img src="/src/assets/logo.png" alt="Company Logo" class="logo" />
        <span class="company-name">YP Ascent</span>
      </div>
      <nav class="menu">
        <MenuItem
          v-for="item in menuTree"
          :key="item.id"
          :item="item"
          :current-path="currentPath"
          @navigate="goTo"
        />
      </nav>
      <div class="logout-btn" @click="logout">🚪 登出</div>
    </aside>
    <main class="main-content">
      <div class="content-header"><h1>歡迎，{{ userName }}</h1></div>
      <div class="content-body"><router-view /></div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import MenuItem from '../components/MenuItem.vue'

// 菜单树（所有叶子节点 path 均以 /dashboard 开头）
// const menuTree = [
//   {
//     id: 'account',
//     label: '帳戶管理',
//     icon: '👤',
//     children: [
//       {
//         id: 'trading_account',
//         label: '交易帳戶',
//         icon: '💳',
//         children: [
//           { id: 'trading_account_add', label: '新增', path: '/dashboard/account/trading-account/add', icon: '➕' },
//           { id: 'trading_account_edit', label: '修改', path: '/dashboard/account/trading-account/edit', icon: '✏️' },
//           { id: 'trading_account_delete', label: '刪除', path: '/dashboard/account/trading-account/delete', icon: '🗑️' },
//           { id: 'trading_account_query', label: '查詢', path: '/dashboard/account/trading-account/query', icon: '🔍' }
//         ]
//       }
//       // 其他二级、三级功能按相同格式补充，确保 path 以 /dashboard 开头
//     ]
//   }
//   // 其他一级功能同理
// ]

const menuTree = [
  {
    id: 'account',
    label: '帳戶管理',
    icon: '👤',
    children: [
      {
        id: 'trading_account',
        label: '交易帳戶',
        icon: '💳',
        children: [
          { id: 'trading_account_add', label: '新增', path: '/dashboard/account/trading-account/add', icon: '➕' },
          { id: 'trading_account_edit', label: '修改', path: '/dashboard/account/trading-account/edit', icon: '✏️' },
          { id: 'trading_account_delete', label: '刪除', path: '/dashboard/account/trading-account/delete', icon: '🗑️' },
          { id: 'trading_account_query', label: '查詢', path: '/dashboard/account/trading-account/query', icon: '🔍' }
        ]
      },
      {
        id: 'bank_account',
        label: '銀行帳戶',
        icon: '🏦',
        children: [
          { id: 'bank_account_add', label: '新增', path: '/dashboard/account/bank-account/add', icon: '➕' },
          { id: 'bank_account_edit', label: '修改', path: '/dashboard/account/bank-account/edit', icon: '✏️' },
          { id: 'bank_account_delete', label: '刪除', path: '/dashboard/account/bank-account/delete', icon: '🗑️' },
          { id: 'bank_account_query', label: '查詢', path: '/dashboard/account/bank-account/query', icon: '🔍' }
        ]
      },
      {
        id: 'broker_account',
        label: '券商帳戶',
        icon: '📈',
        children: [
          { id: 'broker_account_add', label: '新增', path: '/dashboard/account/broker-account/add', icon: '➕' },
          { id: 'broker_account_edit', label: '修改', path: '/dashboard/account/broker-account/edit', icon: '✏️' },
          { id: 'broker_account_delete', label: '刪除', path: '/dashboard/account/broker-account/delete', icon: '🗑️' },
          { id: 'broker_account_query', label: '查詢', path: '/dashboard/account/broker-account/query', icon: '🔍' }
        ]
      }
    ]
  },
  {
    id: 'data_pool',
    label: '資料池',
    icon: '🗄️',
    children: [
      {
        id: 'realtime_data',
        label: '即時資料',
        icon: '⚡',
        children: [
          { id: 'realtime_news', label: '即時新聞追蹤', path: '/dashboard/data-pool/realtime-data/news', icon: '📰' },
          { id: 'exchange_announce', label: '交易所公告', path: '/dashboard/data-pool/realtime-data/announce', icon: '📢' }
        ]
      },
      {
        id: 'batch_data',
        label: '批次資料',
        icon: '📦',
        children: [
          { id: 'batch_quote', label: '行情資料', path: '/dashboard/data-pool/batch-data/quote', icon: '📊' },
          { id: 'batch_news', label: '新聞資料', path: '/dashboard/data-pool/batch-data/news', icon: '📰' },
          { id: 'batch_financial', label: '財務資料', path: '/dashboard/data-pool/batch-data/financial', icon: '💰' },
          { id: 'batch_company', label: '公司資料', path: '/dashboard/data-pool/batch-data/company', icon: '🏢' }
        ]
      }
    ]
  },
  {
    id: 'analysis_engine',
    label: '分析引擎',
    icon: '⚙️',
    children: [
      {
        id: 'fundamental',
        label: '基本分析',
        icon: '📊',
        children: [
          { id: 'macro_economy', label: '宏觀經濟', path: '/dashboard/analysis-engine/fundamental/macro', icon: '🌍' },
          { id: 'industry_cycle', label: '產業循環', path: '/dashboard/analysis-engine/fundamental/industry-cycle', icon: '🔄' },
          { id: 'company_health', label: '公司體質', path: '/dashboard/analysis-engine/fundamental/company-health', icon: '🏥' },
          { id: 'event_analysis', label: '事件分析', path: '/dashboard/analysis-engine/fundamental/event', icon: '📅' }
        ]
      },
      {
        id: 'technical',
        label: '技術分析',
        icon: '📈',
        children: [
          { id: 'tech_dev', label: '技術指標開發', path: '/dashboard/analysis-engine/technical/dev', icon: '🛠️' },
          { id: 'tech_optimize', label: '技術指標優化', path: '/dashboard/analysis-engine/technical/optimize', icon: '⚡' },
          { id: 'tech_evaluate', label: '技術指標評價', path: '/dashboard/analysis-engine/technical/evaluate', icon: '⭐' }
        ]
      },
      {
        id: 'risk',
        label: '風險分析',
        icon: '⚠️',
        children: [
          { id: 'risk_single', label: '單一證券', path: '/dashboard/analysis-engine/risk/single', icon: '📄' },
          { id: 'risk_industry', label: '產業指標', path: '/dashboard/analysis-engine/risk/industry', icon: '🏭' },
          { id: 'risk_market', label: '整體市場', path: '/dashboard/analysis-engine/risk/market', icon: '📊' }
        ]
      }
    ]
  },
  {
    id: 'strategy',
    label: '策略目標組合',
    icon: '🎯',
    children: [
      {
        id: 'evaluation',
        label: '評價報告',
        icon: '📑',
        children: [
          { id: 'eval_macro', label: '宏觀經濟', path: '/dashboard/strategy/evaluation/macro', icon: '🌍' },
          { id: 'eval_industry', label: '產業循環', path: '/dashboard/strategy/evaluation/industry-cycle', icon: '🔄' },
          { id: 'eval_company', label: '公司體質', path: '/dashboard/strategy/evaluation/company-health', icon: '🏥' },
          { id: 'eval_event', label: '事件分析', path: '/dashboard/strategy/evaluation/event', icon: '📅' },
          { id: 'eval_tech', label: '技術指標評價', path: '/dashboard/strategy/evaluation/tech', icon: '⭐' }
        ]
      },
      {
        id: 'best_strategy',
        label: '最佳投資策略',
        icon: '💡',
        children: [
          { id: 'strategy_filter', label: '標的篩選', path: '/dashboard/strategy/best-strategy/filter', icon: '🔍' },
          { id: 'strategy_amount', label: '交易金額', path: '/dashboard/strategy/best-strategy/amount', icon: '💰' }
        ]
      }
    ]
  },
  {
    id: 'trading',
    label: '交易市場',
    icon: '🔄',
    children: [
      {
        id: 'auto_trade',
        label: '自動交易',
        icon: '🤖',
        children: [
          { id: 'auto_single', label: '單一策略監控', path: '/dashboard/trading/auto-trade/single', icon: '📊' },
          { id: 'auto_overall', label: '整體部位監控', path: '/dashboard/trading/auto-trade/overall', icon: '📈' }
        ]
      },
      {
        id: 'manual_trade',
        label: '人工交易',
        icon: '👤',
        children: [
          { id: 'manual_order', label: '下單操作', path: '/dashboard/trading/manual-trade/order', icon: '📝' }
        ]
      }
    ]
  },
  {
    id: 'performance',
    label: '績效分析報告',
    icon: '📊',
    children: [
      {
        id: 'evaluation',
        label: '績效評估',
        icon: '📈',
        children: [
          { id: 'perf_source', label: '績效來源', path: '/dashboard/performance/evaluation/source', icon: '🔍' },
          { id: 'perf_attribution', label: '績效歸屬', path: '/dashboard/performance/evaluation/attribution', icon: '📊' }
        ]
      },
      {
        id: 'report',
        label: '報表產生',
        icon: '📄',
        children: [
          { id: 'report_summary', label: '總列表', path: '/dashboard/performance/report/summary', icon: '📋' }
        ]
      }
    ]
  },
  {
    id: 'system',
    label: '系統管理',
    icon: '⚙️',
    children: [
      {
        id: 'user_mgt',
        label: '使用者管理',
        icon: '👥',
        children: [
          { id: 'user_add', label: '新增', path: '/dashboard/system/user-mgt/add', icon: '➕' },
          { id: 'user_edit', label: '修改', path: '/dashboard/system/user-mgt/edit', icon: '✏️' },
          { id: 'user_delete', label: '刪除', path: '/dashboard/system/user-mgt/delete', icon: '🗑️' },
          { id: 'user_query', label: '查詢', path: '/dashboard/system/user-mgt/query', icon: '🔍' }
        ]
      },
      {
        id: 'permission_mgt',
        label: '權限管理',
        icon: '🔒',
        children: [
          { id: 'perm_add', label: '新增', path: '/dashboard/system/permission-mgt/add', icon: '➕' },
          { id: 'perm_edit', label: '修改', path: '/dashboard/system/permission-mgt/edit', icon: '✏️' },
          { id: 'perm_delete', label: '刪除', path: '/dashboard/system/permission-mgt/delete', icon: '🗑️' },
          { id: 'perm_query', label: '查詢', path: '/dashboard/system/permission-mgt/query', icon: '🔍' }
        ]
      }
    ]
  }
]

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const userName = computed(() => userStore.currentUser?.username || '用戶')
const currentPath = ref(route.path)

watch(() => route.path, (newPath) => {
  currentPath.value = newPath
}, { immediate: true })

// const goTo = (path) => {
//   console.log('Dashboard goTo path:', path)
//   router.push(path)
// }

const goTo = (path) => {
  console.log('Dashboard goTo path:', path)
  // 确保路径以 /dashboard 开头，如果不是则补全
  if (!path.startsWith('/dashboard')) {
    path = '/dashboard' + path
  }
  router.push(path).catch(err => console.error('路由跳转失败:', err))
}


const logout = () => {
  localStorage.removeItem('token')
  userStore.currentUser = null
  router.push('/login')
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f0f2f5;
}
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background-color: #001529;
  color: rgba(255,255,255,0.85);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  overflow-y: auto;
}
.logo-area {
  padding: 24px 16px;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 8px;
}
.company-name {
  font-size: 18px;
  font-weight: bold;
  display: block;
}
.menu {
  flex: 1;
  padding: 16px 0;
}
.logout-btn {
  margin: 16px;
  padding: 10px;
  text-align: center;
  background-color: #f5222d;
  border-radius: 4px;
  cursor: pointer;
}
.logout-btn:hover {
  background-color: #ff4d4f;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  overflow-y: auto;
}
.content-header {
  background-color: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
}
.content-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}
.content-body {
  padding: 24px;
  flex: 1;
  background-color: #fff;
  margin: 16px;
  border-radius: 8px;
}
</style>