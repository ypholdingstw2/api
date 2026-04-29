// frontend/src/composables/useIndicatorOptimization.ts
export const useIndicatorOptimization = () => {
  const taskId = ref<string | null>(null);
  const taskState = ref<'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'>('PENDING');
  const isCalculating = ref(false);
  
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const startCalculation = async (params: OptimizeParams) => {
    try {
      isCalculating.value = true;
      const { data } = await api.post('/api/analysis/optimize/start/', params);
      taskId.value = data.task_id;
      
      // 開始輪詢狀態（每 5 秒）
      startPolling(data.task_id);
      return { success: true, task_id: data.task_id };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || '啟動失敗' };
    }
  };

  const startPolling = (id: string, interval = 5000) => {
    pollTimer = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/analysis/tasks/${id}/`);
        taskState.value = mapState(data.state);  // STARTED→RUNNING, SUCCESS→COMPLETED
        
        if (['COMPLETED', 'FAILED'].includes(taskState.value)) {
          cleanup();
          isCalculating.value = false;
          // 可選：自動刷新結果列表
          if (taskState.value === 'COMPLETED') {
            emit('completed', data);
          }
        }
      } catch (err) {
        console.error('輪詢失敗:', err);
      }
    }, interval);
  };

  const cleanup = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  onUnmounted(() => cleanup());

  return {
    taskId,
    taskState,
    isCalculating,
    startCalculation,
    cancel: cleanup
  };
};