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