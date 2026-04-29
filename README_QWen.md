# Vue 3 + Vite

## 需求確認修正與架構調整方案

### 📋 需求修正確認

| 項目 | 原理解 | 修正後理解 |
|------|--------|-----------|
| **指標數量** | 單一 TA001 (MA) | **30 個技術指標** (MA, MACD, RSI, KDJ, BOLL...)，各自有獨立批次邏輯 |
| **整合目標** | 單一模組 API 化 | **統一框架 + 插件式架構**：30 個指標共用同一套 API/進度/儲存機制 |
| **執行模式** | 單股票單指標 | **多股票 × 多指標 × 多參數組合** 的批次優化，需支援排隊與資源控制 |
| **進度回報** | 單一階段進度 | **多階段進度**：資料載入 → 參數生成 → 批次計算 → 結果寫入，每階段可獨立監控 |

---

### 🏗️ 核心架構：插件式指標優化框架

```
[前端 Vue] 
   ├─ POST /api/analysis/optimize/{indicator_code}/ → [Django API]
   └─ WebSocket /ws/analysis/progress/{task_id}/ ← [Celery Worker]
                                                      ↓
                                    [IndicatorPluginLoader] → [30 個指標插件]
                                                      ↓
                                          [eqwizard.db] + [Progress Cache]
```

#### 關鍵設計原則
1. **單一職責**：每個指標模組只負責「計算邏輯」，不處理 I/O、進度、儲存
2. **介面統一**：所有指標實現相同 `run_optimization()` 介面，支援進度回調
3. **熱插拔**：新增指標只需在 `analysis_engine/technical/optimizers/` 新增檔案，無需改動核心框架

---

### 🔧 第一部分：後端核心框架改動

#### 1️⃣ `backend/analysis_engine/technical/optimizers/base.py` - 指標插件基類
```python
"""
所有技術指標優化器的統一介面
30 個指標模組均需繼承此基類並實現 core_optimize 方法
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Callable
import pandas as pd
import numpy as np
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class IndicatorOptimizerBase(ABC):
    """技術指標參數優化器基類"""
    
    # 類別屬性：指標元數據（前端表單生成用）
    INDICATOR_CODE: str = ""  # 例: 'MA', 'MACD'
    INDICATOR_NAME: str = ""  # 例: '移動平均線', '平滑異同移動平均線'
    PARAM_SCHEMA: Dict[str, Any] = {}  # 參數定義，用於前端動態表單
    DEFAULT_CONFIG: Dict[str, Any] = {}  # 預設計算參數
    
    def __init__(self, progress_callback: Optional[Callable[[Dict], None]] = None):
        self.progress_callback = progress_callback
        self._total_steps = 0
        self._current_step = 0
    
    def _report_progress(self, stage: str, percent: float, detail: Dict = None):
        """統一進度回報介面"""
        if self.progress_callback:
            self.progress_callback({
                'stage': stage,
                'percent': round(percent, 2),
                'detail': detail or {},
                'indicator': self.INDICATOR_CODE
            })
    
    @abstractmethod
    def core_optimize(self, df: pd.DataFrame, params: Dict[str, Any], 
                     intervals: List[tuple]) -> List[Dict[str, Any]]:
        """
        核心優化邏輯（由子類實現）
        
        Args:
            df: 股票資料 (index: datetime, columns: ['close_price', ...])
            params: 參數組合 {'param1': value1, 'param2': value2, ...}
            intervals: 分析區間列表 [('2020-01-01', '2024-12-31'), ...]
        
        Returns:
            結果列表，每項為 {'param_config': {...}, 'metrics': {...}, 'interval': (...)}
        """
        pass
    
    def execute(self, stock_id: str, df: pd.DataFrame, 
                param_combinations: List[Dict], 
                intervals: List[tuple],
                pf_threshold: float = 0.5) -> List[Dict[str, Any]]:
        """
        模板方法：執行完整優化流程（不建議子類覆蓋）
        """
        try:
            # [階段 1] 參數組合生成 (10%)
            self._report_progress('generating_params', 10, {
                'total_combinations': len(param_combinations)
            })
            
            # [階段 2] 批次計算 (10% ~ 90%)
            results = []
            total = len(param_combinations)
            for idx, params in enumerate(param_combinations):
                chunk_results = self.core_optimize(df, params, intervals)
                
                # 過濾 + 收集結果
                for r in chunk_results:
                    if r['metrics'].get('Profit_Factor', 0) > pf_threshold:
                        results.append({
                            'Stock_ID': stock_id,
                            'indicator': self.INDICATOR_CODE,
                            'param_config': params,
                            'interval': r['interval'],
                            **r['metrics']
                        })
                
                # 每 5% 回報進度
                if total > 0 and idx % max(1, total // 20) == 0:
                    progress = 10 + (idx / total) * 80
                    self._report_progress('calculating', progress, {
                        'processed': idx,
                        'total': total,
                        'current_params': params
                    })
            
            # [階段 3] 結果彙總 (90% ~ 100%)
            self._report_progress('summarizing', 95, {'valid_results': len(results)})
            summary = self._generate_summary(results)
            self._report_progress('completed', 100, {
                'total_results': len(results),
                'summary': summary
            })
            
            return results
            
        except Exception as e:
            logger.error(f"[{self.INDICATOR_CODE}] 執行失敗: {str(e)}", exc_info=True)
            self._report_progress('error', 0, {'error': str(e)})
            raise
    
    def _generate_summary(self, results: List[Dict]) -> Dict[str, Any]:
        """產生結果摘要（預設實作，子類可覆蓋）"""
        if not results:
            return {'valid_count': 0}
        
        metrics_keys = [k for k in results[0].keys() 
                       if k not in ['Stock_ID', 'indicator', 'param_config', 'interval']]
        
        summary = {'valid_count': len(results)}
        for key in metrics_keys:
            values = [r[key] for r in results if isinstance(r.get(key), (int, float))]
            if values:
                summary[f'best_{key}'] = max(values)
                summary[f'avg_{key}'] = sum(values) / len(values)
        
        return summary
```

#### 2️⃣ `backend/analysis_engine/technical/optimizers/ma_optimizer.py` - MA 指標實作範例
```python
"""
MA 移動平均線指標優化器（繼承自 base.py）
此範例展示如何將原有 Ta001.py 邏輯遷移至插件架構
"""
from typing import List, Dict, Tuple
import pandas as pd
import numpy as np
from numba import njit
from .base import IndicatorOptimizerBase

# 匯入原有 Numba 函數（最小改動原則）
from Ta001 import IndicatorAgent_MA, BacktestAgent, generate_parameter_combinations_MA

class MAOptimizer(IndicatorOptimizerBase):
    INDICATOR_CODE = 'MA'
    INDICATOR_NAME = '移動平均線交叉策略'
    
    # 前端表單參數定義（用於動態生成 UI）
    PARAM_SCHEMA = {
        'short_ma': {
            'type': 'list',
            'item_type': 'integer',
            'min': 3, 'max': 90, 'step': 3,
            'default': [5, 10, 20],
            'label': '短週期均線'
        },
        'long_ma': {
            'type': 'list', 
            'item_type': 'integer',
            'min': 6, 'max': 255, 'step': 6,
            'default': [30, 60, 120],
            'label': '長週期均線'
        }
    }
    
    DEFAULT_CONFIG = {
        'initial_assets': 1_000_000,
        'lot_size': 1,
        'transaction_fee_rate': 0.001425,
        'tax_rate': 0.003,
        'pf_threshold': 0.5
    }
    
    def core_optimize(self, df: pd.DataFrame, params: Dict, 
                     intervals: List[Tuple[str, str]]) -> List[Dict]:
        """MA 指標核心優化邏輯"""
        indicator_agent = IndicatorAgent_MA()
        backtest_agent = BacktestAgent()
        results = []
        
        short_period = params['short_period']
        long_period = params['long_period']
        
        for interval_start, interval_end in intervals:
            try:
                # 區間切片
                subset = df.loc[interval_start:interval_end]
                if len(subset) < max(short_period, long_period):
                    continue
                
                # 指標計算 (Numba 加速)
                ma_df = indicator_agent.calculate_ma_crossover(
                    subset, short_period, long_period
                )
                if ma_df.empty:
                    continue
                
                # 訊號產生
                signal_df = indicator_agent.generate_ma_crossover_signals(ma_df)
                
                # 回測執行
                metrics = backtest_agent.backtest(
                    signal_df, float(self.DEFAULT_CONFIG['initial_assets'])
                )
                
                results.append({
                    'interval': (interval_start, interval_end),
                    'metrics': {
                        'param_config': {'short_ma': short_period, 'long_ma': long_period},
                        **metrics
                    }
                })
                
            except Exception as e:
                # 單區間失敗不影響整體
                continue
        
        return results
```

#### 3️⃣ `backend/analysis_engine/technical/optimizers/plugin_loader.py` - 插件註冊與載入
```python
"""
指標插件動態載入器：自動掃描 optimizers/ 目錄並註冊可用指標
"""
import os
import importlib
from typing import Dict, Type, List
from .base import IndicatorOptimizerBase
import logging

logger = logging.getLogger(__name__)

class IndicatorPluginLoader:
    """技術指標插件管理器"""
    
    _registry: Dict[str, Type[IndicatorOptimizerBase]] = {}
    _initialized = False
    
    @classmethod
    def initialize(cls, optimizers_dir: str):
        """掃描並註冊所有指標插件（應用程式啟動時呼叫）"""
        if cls._initialized:
            return
        
        for filename in os.listdir(optimizers_dir):
            if filename.endswith('_optimizer.py') and not filename.startswith('_'):
                module_name = filename[:-3]  # 移除 .py
                try:
                    module = importlib.import_module(
                        f'analysis_engine.technical.optimizers.{module_name}'
                    )
                    # 自動尋找繼承自 IndicatorOptimizerBase 的類別
                    for attr_name in dir(module):
                        attr = getattr(module, attr_name)
                        if (isinstance(attr, type) and 
                            issubclass(attr, IndicatorOptimizerBase) and 
                            attr.INDICATOR_CODE):
                            cls._registry[attr.INDICATOR_CODE] = attr
                            logger.info(f"註冊指標插件: {attr.INDICATOR_CODE}")
                except Exception as e:
                    logger.error(f"載入插件 {filename} 失敗: {str(e)}")
        
        cls._initialized = True
        logger.info(f"共載入 {len(cls._registry)} 個指標插件: {list(cls._registry.keys())}")
    
    @classmethod
    def get_optimizer(cls, indicator_code: str, 
                     progress_callback=None) -> IndicatorOptimizerBase:
        """取得指標優化器實例"""
        if indicator_code not in cls._registry:
            raise ValueError(f"未找到指標: {indicator_code}. 可用指標: {list(cls._registry.keys())}")
        
        optimizer_class = cls._registry[indicator_code]
        return optimizer_class(progress_callback=progress_callback)
    
    @classmethod
    def get_available_indicators(cls) -> List[Dict[str, Any]]:
        """取得前端選單用的指標清單"""
        return [
            {
                'code': opt.INDICATOR_CODE,
                'name': opt.INDICATOR_NAME,
                'param_schema': opt.PARAM_SCHEMA,
                'default_config': opt.DEFAULT_CONFIG
            }
            for opt in cls._registry.values()
        ]
```

#### 4️⃣ `backend/backtest/tasks.py` - 通用 Celery 任務（支援 30 個指標）
```python
from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from django.conf import settings
from analysis_engine.technical.optimizers.plugin_loader import IndicatorPluginLoader
from analysis_engine.technical.optimizers.database import ResultsStorage
import logging

logger = logging.getLogger(__name__)

@shared_task(
    bind=True,
    name='analysis.run_indicator_optimization',
    max_retries=2,
    soft_time_limit=7200,  # 2 小時上限（可依指標調整）
    acks_late=True
)
def run_indicator_optimization_task(self, stock_id: str, indicator_code: str, params: dict):
    """
    通用指標優化任務：支援 30 個技術指標
    
    Args:
        stock_id: 股票代號
        indicator_code: 指標代碼 (例: 'MA', 'MACD', 'RSI')
        params: {
            'start_date': '2013-01-01',
            'end_date': '2024-12-31',
            'custom_params': {...},  # 依指標 PARAM_SCHEMA 定義
            'custom_intervals': [...],
            'pf_threshold': 0.5
        }
    """
    def progress_callback(update: dict):
        """Celery 進度回調 + WebSocket 推送"""
        self.update_state(state='PROGRESS', meta=update)
        # 可選：推送 WebSocket (見 consumers.py)
        # from .consumers import send_analysis_progress
        # send_analysis_progress(self.request.id, update)
    
    try:
        # 1. 載入對應指標插件
        optimizer = IndicatorPluginLoader.get_optimizer(
            indicator_code=indicator_code,
            progress_callback=progress_callback
        )
        
        # 2. 準備資料
        from analysis_engine.technical.optimizers.database import DatabaseAgent
        db_agent = DatabaseAgent(settings.MA_DB_PATH)
        df = db_agent.fetch_stock_data(int(stock_id), params['start_date'], params['end_date'])
        if df.empty:
            raise ValueError(f"股票 {stock_id} 無有效數據")
        
        # 3. 參數組合生成（支援自訂或預設）
        if params.get('custom_params'):
            param_combinations = self._generate_custom_params(
                params['custom_params'], 
                optimizer.PARAM_SCHEMA
            )
        else:
            # 預設：呼叫指標模組的預設生成函數
            if hasattr(optimizer, 'generate_default_params'):
                param_combinations = optimizer.generate_default_params()
            else:
                # fallback: 從 PARAM_SCHEMA 產生簡單組合
                param_combinations = self._generate_params_from_schema(optimizer.PARAM_SCHEMA)
        
        # 4. 執行優化
        intervals = params.get('custom_intervals') or [
            ('2013-01-01', '2015-12-31'),
            ('2016-01-01', '2019-12-31'), 
            ('2020-01-01', '2024-12-31')
        ]
        
        results = optimizer.execute(
            stock_id=stock_id,
            df=df,
            param_combinations=param_combinations,
            intervals=intervals,
            pf_threshold=params.get('pf_threshold', 0.5)
        )
        
        # 5. 儲存結果
        if results:
            storage = ResultsStorage(settings.MA_DB_PATH)
            storage.bulk_insert(results, indicator_code)
        
        return {
            'status': 'completed',
            'task_id': self.request.id,
            'stock_id': stock_id,
            'indicator': indicator_code,
            'results_count': len(results)
        }
        
    except SoftTimeLimitExceeded:
        logger.warning(f"任務超時: {self.request.id}")
        self.update_state(state='TIMEOUT', meta={'error': '計算超時'})
        raise
    except Exception as exc:
        logger.error(f"任務失敗: {exc}", exc_info=True)
        self.update_state(state='FAILURE', meta={'error': str(exc)})
        raise self.retry(exc=exc, countdown=120)
    
    def _generate_custom_params(self, custom: Dict, schema: Dict) -> List[Dict]:
        """從前端自訂參數生成參數組合（簡單笛卡爾積）"""
        from itertools import product
        
        param_lists = {}
        for key, config in schema.items():
            if key in custom and config['type'] == 'list':
                param_lists[key] = custom[key]
            else:
                # 使用預設值
                param_lists[key] = config.get('default', [None])
        
        # 生成笛卡爾積
        combinations = []
        for values in product(*param_lists.values()):
            combo = {k: v for k, v in zip(param_lists.keys(), values) if v is not None}
            # 簡單驗證：確保 short < long (MA 特例)
            if 'short_period' in combo and 'long_period' in combo:
                if combo['short_period'] >= combo['long_period']:
                    continue
            combinations.append(combo)
        
        return combinations
    
    def _generate_params_from_schema(self, schema: Dict) -> List[Dict]:
        """從 PARAM_SCHEMA 產生預設參數組合（fallback）"""
        # 簡單實作：取 default 的第一個值
        return [{k: v['default'][0] if isinstance(v.get('default'), list) else v.get('default') 
                for k, v in schema.items()}]
```

#### 5️⃣ `backend/analysis_engine/technical/optimizers/database.py` - 通用結果儲存
```python
"""
通用結果儲存模組：支援 30 個指標的結果寫入（避免 30 張表）
策略：單一結果表 + JSON 欄位儲存指標特定參數
"""
import sqlite3
import json
from typing import List, Dict, Any
from contextlib import contextmanager

class ResultsStorage:
    """技術指標優化結果儲存"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=30)
        conn.execute("PRAGMA journal_mode=WAL")
        try:
            yield conn
        finally:
            conn.close()
    
    def create_results_table(self):
        """建立通用結果表（只需執行一次）"""
        with self.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS indicator_optimization_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Stock_ID TEXT NOT NULL,
                    indicator_code TEXT NOT NULL,  -- 'MA', 'MACD', 'RSI'...
                    param_config TEXT NOT NULL,     -- JSON: {"short_ma": 10, "long_ma": 30}
                    interval_start TEXT NOT NULL,
                    interval_end TEXT NOT NULL,
                    -- 通用績效指標（所有指標共用）
                    Total_Trades INTEGER DEFAULT 0,
                    Profit_Factor REAL DEFAULT 0,
                    Max_Drawdown REAL DEFAULT 0,
                    Sharpe_Ratio REAL DEFAULT 0,
                    Win_Rate REAL DEFAULT 0,
                    Annualized_Return REAL DEFAULT 0,
                    -- 指標特定指標（JSON 儲存，避免欄位爆炸）
                    indicator_specific_metrics TEXT,  -- JSON: {"macd_histogram": {...}}
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(Stock_ID, indicator_code, param_config, interval_start, interval_end)
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_results_stock ON indicator_optimization_results (Stock_ID)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_results_indicator ON indicator_optimization_results (indicator_code)")
            conn.commit()
    
    def bulk_insert(self, results: List[Dict], indicator_code: str):
        """批次插入結果（支援 30 個指標）"""
        if not results:
            return
        
        with self.get_connection() as conn:
            conn.execute("BEGIN TRANSACTION")
            try:
                stmt = """
                    INSERT OR REPLACE INTO indicator_optimization_results (
                        Stock_ID, indicator_code, param_config,
                        interval_start, interval_end,
                        Total_Trades, Profit_Factor, Max_Drawdown,
                        Sharpe_Ratio, Win_Rate, Annualized_Return,
                        indicator_specific_metrics
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                conn.executemany(stmt, [
                    (
                        r['Stock_ID'],
                        indicator_code,
                        json.dumps(r['param_config'], ensure_ascii=False),
                        r['interval'][0], r['interval'][1],
                        r.get('Total_Trades', 0),
                        r.get('Profit_Factor', 0),
                        r.get('Max_Drawdown', 0),
                        r.get('Sharpe_Ratio', 0),
                        r.get('Win_Rate', 0),
                        r.get('Annualized_Return', 0),
                        json.dumps({k: v for k, v in r.items() 
                                   if k not in ['Stock_ID', 'indicator', 'param_config', 'interval',
                                               'Total_Trades', 'Profit_Factor', 'Max_Drawdown',
                                               'Sharpe_Ratio', 'Win_Rate', 'Annualized_Return']}, 
                                  ensure_ascii=False)
                    )
                    for r in results
                ])
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
```

---

### 🎨 第二部分：前端通用元件（支援 30 個指標）

#### `frontend/src/views/analysis_engine/technical/OptimizeDetail.vue` - 通用優化頁面
```vue
<template>
  <div class="indicator-optimizer">
    <h2>{{ indicatorInfo?.name || '技術指標參數優化' }}</h2>
    
    <!-- 動態參數表單（依指標 PARAM_SCHEMA 生成） -->
    <el-form :model="form" label-width="140px" v-if="indicatorInfo">
      <!-- 股票與日期（通用欄位） -->
      <el-form-item label="股票代號">
        <el-input v-model="form.stock_id" placeholder="例: 2330" />
      </el-form-item>
      <el-form-item label="分析區間">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
        />
      </el-form-item>
      
      <!-- 動態指標參數（依 PARAM_SCHEMA 渲染） -->
      <template v-for="(config, key) in indicatorInfo.param_schema" :key="key">
        <el-form-item :label="config.label || key">
          <el-select 
            v-if="config.type === 'list'"
            v-model="form.custom_params[key]"
            multiple
            collapse-tags
            :placeholder="`選擇 ${config.label || key}`"
          >
            <el-option
              v-for="val in generateOptions(config)"
              :key="val"
              :label="val"
              :value="val"
            />
          </el-select>
          <!-- 可擴充其他類型：slider, input-number... -->
        </el-form-item>
      </template>
      
      <el-form-item>
        <el-button 
          type="primary" 
          :loading="isCalculating"
          @click="handleCalculate"
        >
          {{ isCalculating ? '計算中...' : '啟動優化' }}
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 進度監控（通用） -->
    <ProgressMonitor 
      v-if="taskId" 
      :task-id="taskId" 
      :indicator-code="indicatorCode"
      @completed="handleCompleted"
    />

    <!-- 結果預覽 -->
    <ResultsPreview 
      v-if="completedResult" 
      :data="completedResult" 
      :indicator-code="indicatorCode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { analysisApi } from '@/api/analysis';
import ProgressMonitor from '@/components/analysis/ProgressMonitor.vue';
import ResultsPreview from '@/components/analysis/ResultsPreview.vue';

const route = useRoute();
const indicatorCode = ref(route.params.indicator as string);
const indicatorInfo = ref<any>(null);
const form = ref({
  stock_id: '',
  start_date: '',
  end_date: '',
  custom_params: {} as Record<string, any>
});

const dateRange = computed({
  get: () => [form.value.start_date, form.value.end_date],
  set: ([start, end]: [string, string]) => {
    form.value.start_date = start;
    form.value.end_date = end;
  }
});

const { 
  taskId, 
  isCalculating, 
  completedResult,
  startCalculation 
} = useIndicatorOptimization();

onMounted(async () => {
  // 載入指標元數據
  const indicators = await analysisApi.getAvailableIndicators();
  indicatorInfo.value = indicators.find((i: any) => i.code === indicatorCode.value);
  
  // 初始化表單預設值
  if (indicatorInfo.value?.param_schema) {
    Object.entries(indicatorInfo.value.param_schema).forEach(([key, config]: [string, any]) => {
      form.value.custom_params[key] = config.default || [];
    });
  }
});

const generateOptions = (config: any) => {
  // 依 config 產生下拉選項（例: range → 產生 [3,6,9,...,90]）
  if (config.min !== undefined && config.max !== undefined && config.step) {
    const options = [];
    for (let v = config.min; v <= config.max; v += config.step) {
      options.push(v);
    }
    return options;
  }
  return config.default || [];
};

const handleCalculate = async () => {
  if (!form.value.stock_id || !form.value.start_date || !form.value.end_date) {
    ElMessage.warning('請填寫完整參數');
    return;
  }
  
  await startCalculation({
    stock_id: form.value.stock_id,
    indicator_code: indicatorCode.value,
    start_date: form.value.start_date,
    end_date: form.value.end_date,
    custom_params: form.value.custom_params
  });
};

const handleCompleted = (result: any) => {
  completedResult.value = result;
  // 可選：自動導向結果分析頁面
  // router.push({ name: 'IndicatorResults', params: { indicator: indicatorCode.value, taskId } });
};
</script>
```

---

### ⚙️ 第三部分：整合檢查清單

#### ✅ 後端必改檔案
| 檔案路徑 | 改動內容 | 優先級 |
|---------|---------|--------|
| `backend/analysis_engine/technical/optimizers/base.py` | 新增：指標插件基類 | 🔴 高 |
| `backend/analysis_engine/technical/optimizers/plugin_loader.py` | 新增：插件註冊與載入 | 🔴 高 |
| `backend/analysis_engine/technical/optimizers/database.py` | 新增：通用結果儲存 | 🔴 高 |
| `backend/backtest/tasks.py` | 修改：`run_indicator_optimization_task` 支援多指標 | 🔴 高 |
| `backend/backtest/views.py` | 修改：`/optimize/{indicator_code}/` 動態路由 | 🟡 中 |
| `backend/analysis_engine/technical/optimizers/ma_optimizer.py` | 遷移：原有 Ta001 邏輯（範例） | 🟡 中 |
| `backend/requirements.txt` | 新增：`celery>=5.3.0`, `channels>=4.0.0` | 🟢 低 |

#### ✅ 前端必改檔案
| 檔案路徑 | 改動內容 | 優先級 |
|---------|---------|--------|
| `frontend/src/api/analysis.js` | 新增：`getAvailableIndicators()`, `optimizeIndicator()` | 🔴 高 |
| `frontend/src/views/analysis_engine/technical/OptimizeDetail.vue` | 重構：支援動態參數表單 | 🔴 高 |
| `frontend/src/components/analysis/ProgressMonitor.vue` | 新增：通用進度監控元件 | 🟡 中 |
| `frontend/src/components/analysis/ResultsPreview.vue` | 新增：通用結果預覽元件 | 🟡 中 |
| `frontend/src/router/index.js` | 確認：`/analysis/technical/optimize/:indicator` 路由參數 | 🟢 低 |

#### ✅ 環境設定
```bash
# backend/.env 新增
MA_DB_PATH=./eqwizard.db
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# 啟動命令
# 終端 1: Django
cd backend && python manage.py runserver 0.0.0.0:8000

# 終端 2: Celery Worker
cd backend && celery -A backend worker -l info -c 2

# 終端 3: Celery Beat (可選，用於排程任務)
cd backend && celery -A backend beat -l info
```

---

### 💡 Qwen 觀點

> **關鍵成功因素不在技術，而在「標準化」**：
> 1. **先定義介面，再實作邏輯**：確保 30 個指標模組都遵守 `IndicatorOptimizerBase` 規範，避免後續整合地獄
> 2. **進度回報要「可視化」而非「技術化」**：前端顯示「處理中: 15/300 參數組合」比「階段: calculating, percent: 42.3」更直觀
> 3. **結果儲存採用「寬表 + JSON」策略**：避免為每個指標建表，但需確保查詢效能（建議對 `indicator_code + Stock_ID` 建複合索引）
>
> **風險預警**：若 30 個指標同時被觸發，Celery queue 可能爆滿。建議：
> - 前端限制「同時執行任務數 ≤ 3」
> - 後端 Celery 設定 `worker_prefetch_multiplier=1` + `task_acks_late=True`
> - 重要指標（如 MA）可設定獨立 queue：`queue='high_priority'`

---

### ❓ 需您確認的關鍵細節

為完成最終整合，請確認：

1. **30 個指標的參數差異**：是否所有指標都適用「參數組合 → 回測 → 過濾」模式？有無特殊流程（如機器學習類指標）？
2. **結果查詢需求**：前端需要「即時查詢某股票某指標的最佳參數」，還是「批次匯出所有結果」？(影響 API 設計)
3. **權限控制**：是否需區分「研究員可執行優化」vs「交易員僅可查看結果」？
4. **既有邏輯相容性**：30 個指標模組中，有無使用 `print`/`sys.stdout` 直接輸出？需先改為 `logging` 以相容 Celery

確認後，我可產出：
- ✅ 完整的 `urls.py` 動態路由設定
- ✅ 30 個指標遷移檢查表（含 Numba 相容性驗證）
- ✅ 壓力測試腳本 (locust) 模擬多用戶同時觸發優化

請指示優先處理項目。