<template>
  <div class="func-placeholder">
    <h2>{{ fullTitle }}</h2>
    <p>功能路徑: {{ parentLabel }} / {{ label }}</p>
    <p>此功能正在建置中，請稍後再試。</p>
    <div class="mock-icon">🛠️</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  parentLabel: String
})

const fullTitle = computed(() => `${props.parentLabel} / ${props.label}`)
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