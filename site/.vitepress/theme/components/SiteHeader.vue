<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'

import ThemeToggle from './ThemeToggle.vue'

const open = ref(false)
const links = [
  { label: '项目', href: '/projects/' },
  { label: '文章', href: '/posts/' },
  { label: '关于', href: '/about' },
]
</script>

<template>
  <header>
    <a :href="withBase('/')" aria-label="王永忠首页">WYZ.</a>

    <button
      type="button"
      :aria-label="open ? '关闭导航菜单' : '打开导航菜单'"
      :aria-expanded="open"
      aria-controls="primary-navigation"
      @click="open = !open"
    >
      <span aria-hidden="true">☰</span>
    </button>

    <nav id="primary-navigation" aria-label="主导航" :data-open="String(open)">
      <a
        v-for="link in links"
        :key="link.href"
        :href="withBase(link.href)"
        @click="open = false"
      >
        {{ link.label }}
      </a>
    </nav>

    <ThemeToggle />
  </header>
</template>
