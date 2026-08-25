<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useData } from 'vitepress'

const { isDark } = useData()
const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

function toggleTheme() {
  isDark.value = !isDark.value
}
</script>

<template>
  <button
    type="button"
    :aria-label="mounted ? (isDark ? '切换到浅色模式' : '切换到深色模式') : '切换颜色模式'"
    @click="toggleTheme"
  >
    <span aria-hidden="true">{{ mounted ? (isDark ? '☀' : '☾') : '◐' }}</span>
  </button>
</template>
