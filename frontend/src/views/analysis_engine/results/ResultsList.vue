<!-- frontend/src/views/analysis_engine/results/ResultsList.vue -->
<template>
  <div class="results-list">
    <!-- 篩選表單 -->
    <el-form :inline="true" :model="filters" class="filter-form">
      <el-form-item label="股票">
        <el-select v-model="filters.stock_ids" multiple placeholder="選擇股票">
          <el-option v-for="s in stockOptions" :key="s" :label="s" :value="s"/>
        </el-select>
      </el-form-item>
      <el-form-item label="指標">
        <el-select v-model="filters.indicator_codes" multiple>
          <el-option v-for="i in indicatorOptions" :key="i.code" :label="i.name" :value="i.code"/>
        </el-select>
      </el-form-item>
      <el-form-item label="最小 Profit Factor">
        <el-input-number v-model="filters.min_profit_factor" :min="0" :step="0.1"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetchResults">查詢</el-button>
        <el-button v-if="isResearcher" @click="handleExport">匯出 CSV</el-button>
      </el-form-item>
    </el-form>

    <!-- 結果表格 -->
    <el-table :data="results.data" border stripe>
      <el-table-column prop="Stock_ID" label="股票" width="80"/>
      <el-table-column prop="indicator_code" label="指標" width="100"/>
      <el-table-column label="參數">
        <template #default="{row}">
          {{ formatParams(row.param_config) }}
        </template>
      </el-table-column>
      <el-table-column prop="Profit_Factor" label="Profit Factor" sortable/>
      <el-table-column prop="Sharpe_Ratio" label="Sharpe" sortable/>
      <el-table-column prop="Win_Rate" label="勝率" sortable/>
    </el-table>

    <!-- 分頁 -->
    <el-pagination
      v-model:current-page="filters.page"
      v-model:page-size="filters.page_size"
      :total="results.total"
      @current-change="fetchResults"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { analysisApi } from '@/api/analysis';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const isResearcher = computed(() => userStore.currentUser?.role === 'researcher');

const filters = ref({
  stock_ids: [],
  indicator_codes: [],
  min_profit_factor: undefined,
  page: 1,
  page_size: 100
});

const results = ref({ total: 0, data: [] as any[] });
const stockOptions = ref(['2330', '2454', '2881']);  // 實際應用從 API 載入
const indicatorOptions = ref([
  { code: 'MA', name: '移動平均線' },
  { code: 'MACD', name: 'MACD' },
  // ... 從 /api/analysis/indicators/ 載入
]);

const fetchResults = async () => {
  const params = new URLSearchParams();
  if (filters.value.stock_ids.length) params.append('stock_ids', filters.value.stock_ids.join(','));
  if (filters.value.indicator_codes.length) params.append('indicator_codes', filters.value.indicator_codes.join(','));
  if (filters.value.min_profit_factor) params.append('min_profit_factor', filters.value.min_profit_factor.toString());
  params.append('page', filters.value.page.toString());
  params.append('page_size', filters.value.page_size.toString());
  
  const { data } = await analysisApi.getResults(`?${params.toString()}`);
  results.value = data;
};

const handleExport = async () => {
  try {
    const { data } = await analysisApi.exportResults({ filters: filters.value });
    // 下載 CSV
    const blob = new Blob([data.csv_content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = data.filename;
    link.click();
    ElMessage.success(`已匯出 ${data.row_count} 筆結果`);
  } catch (err) {
    ElMessage.error('匯出失敗');
  }
};

onMounted(() => {
  fetchResults();
});
</script>