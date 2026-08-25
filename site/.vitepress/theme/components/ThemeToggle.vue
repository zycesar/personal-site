<script setup lang="ts">
import { useData } from 'vitepress'

const { isDark } = useData()

function toggleTheme() {
  isDark.value = !isDark.value
}
</script>

<template>
  <button
    type="button"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    @click="toggleTheme"
  >
    <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
  </button>
</template>
