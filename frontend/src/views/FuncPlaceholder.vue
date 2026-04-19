<template>
  <div class="func-placeholder">
    <h2>功能 {{ funcId }} - 開發中</h2>
    <p>此功能正在建置中，請稍後再試。</p>
    <div class="mock-icon">🛠️</div>
  </div>
</template>

<script setup>
defineProps({
  funcId: Number
})
</script>

<style scoped>
.func-placeholder {
  text-align: center;
  padding: 3rem;
  background: #f9f9f9;
  border-radius: 12px;
}
.mock-icon {
  font-size: 4rem;
  margin-top: 2rem;
}
</style>