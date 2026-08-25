<script setup lang="ts">
import { withBase } from 'vitepress'

withDefaults(defineProps<{
  url: string
  title: string
  description: string
  date: string
  tags: string[]
  exampleLabel?: string
  headingLevel?: 2 | 3
}>(), {
  headingLevel: 3,
})

function readableDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return `${year}年${month}月${day}日`
}
</script>

<template>
  <a class="card content-card" :href="withBase(url)">
    <span v-if="exampleLabel" class="example-pill" data-example>{{ exampleLabel }}</span>
    <time :datetime="date">{{ readableDate(date) }}</time>
    <component :is="headingLevel === 2 ? 'h2' : 'h3'">{{ title }}</component>
    <p>{{ description }}</p>
    <ul class="tag-list" aria-label="标签">
      <li v-for="tag in tags" :key="tag">{{ tag }}</li>
    </ul>
  </a>
</template>
