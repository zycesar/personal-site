<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <section class="not-found shell" aria-labelledby="not-found-title">
    <p class="eyebrow">404</p>
    <h1 id="not-found-title">这个页面不存在</h1>
    <p>它可能已被移动，或者从未在这里出现过。</p>
    <a class="button button-primary" :href="withBase('/')">返回首页</a>
  </section>
</template>
