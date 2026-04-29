<template>
  <div>
    <h2>技術指標優化</h2>
    <ul>
      <li v-for="indicator in indicators" :key="indicator.id">
        <router-link :to="`/dashboard/analysis-engine/technical/optimize/${indicator.id}`">
          {{ indicator.name }} ({{ indicator.description }})
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const indicators = ref([])
onMounted(async () => {
  const res = await api.get('/technical/indicators/')
  indicators.value = res.data
})
</script>