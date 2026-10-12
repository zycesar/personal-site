---
title: 每日英语 · 往期
description: 按日期回看每日英语的历史内容。
---

<script setup>
import { withBase } from 'vitepress'

import { data as dates } from './dates.data'

function formatLabel(date) {
  const [year, month, day] = date.split('-')
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
}
</script>

# 每日英语 · 往期

<p v-if="dates.length === 0">存档从 2026 年 10 月 12 日开始，敬请期待。</p>

<ul v-else class="english-archive-list">
  <li v-for="date in [...dates].reverse()" :key="date">
    <a :href="withBase(`/english/archive/${date}`)">{{ formatLabel(date) }}</a>
  </li>
</ul>

<style>
.english-archive-list { padding-left: 0; list-style: none; }
.english-archive-list li { margin: 6px 0; }
</style>
