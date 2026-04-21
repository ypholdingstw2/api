<template>
  <div class="menu-item-wrapper">
    <div v-if="item.children" class="menu-item menu-item-parent" @click="toggle">
      <span class="menu-icon">{{ item.icon }}</span>
      <span class="menu-label">{{ item.label }}</span>
      <span class="menu-arrow">{{ expanded ? '▼' : '▶' }}</span>
    </div>
    <div v-else class="menu-item menu-item-leaf" :class="{ active: currentPath === item.path }" @click="goTo(item.path)">
      <span class="menu-icon">{{ item.icon }}</span>
      <span class="menu-label">{{ item.label }}</span>
    </div>
    <transition name="slide-fade">
      <div v-if="item.children && expanded" class="submenu">
        <MenuItem
          v-for="child in item.children"
          :key="child.id"
          :item="child"
          :current-path="currentPath"
          @navigate="goTo"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  item: Object,
  currentPath: String
})

const emit = defineEmits(['navigate'])

const expanded = ref(false)

watch(() => props.currentPath, (newPath) => {
  if (props.item.children) {
    const isActiveDescendant = props.item.children.some(child => 
      child.path === newPath || (child.children && child.children.some(grand => grand.path === newPath))
    )
    if (isActiveDescendant) expanded.value = true
  }
}, { immediate: true })

const toggle = () => {
  expanded.value = !expanded.value
}

const goTo = (path) => {
  console.log('MenuItem sending path:', path)
  emit('navigate', path)
}
</script>

<style scoped>
.menu-item-wrapper {
  width: 100%;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.3s;
  color: rgba(255,255,255,0.85);
}
.menu-item:hover {
  background-color: #1890ff;
  color: white;
}
.menu-item.active {
  background-color: #1890ff;
  color: white;
}
.menu-icon {
  font-size: 18px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}
.menu-label {
  font-size: 14px;
  flex: 1;
}
.menu-arrow {
  margin-left: auto;
  font-size: 12px;
}
.submenu {
  padding-left: 24px;
  background-color: rgba(0,0,0,0.2);
}
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>