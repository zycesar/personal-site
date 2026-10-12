---
title: 每日英语 · 存档
description: 某一天的每日英语内容存档。
---

<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

import { data as dates } from './dates.data'
import { adjacentDates, isValidDateIso } from '../../.vitepress/english/rotation'
import DailyEnglishBoard from '../../.vitepress/theme/components/english/DailyEnglishBoard.vue'

const { params } = useData()
const dateIso = computed(() => String(params.value.date ?? ''))
const valid = computed(() => isValidDateIso(dateIso.value) && dates.includes(dateIso.value))
const neighbors = computed(() => (valid.value ? adjacentDates(dates, dateIso.value) : { previous: null, next: null }))
</script>

<h1 v-if="valid">每日英语 · {{ dateIso }}</h1>
<h1 v-else>没有这一天的存档</h1>

<DailyEnglishBoard v-if="valid" :date-iso="dateIso" />

<p v-if="valid" class="english-archive-nav">
  <a v-if="neighbors.previous" :href="withBase(`/english/archive/${neighbors.previous}`)">← {{ neighbors.previous }}</a>
  <a :href="withBase('/english/archive/')">返回往期</a>
  <a v-if="neighbors.next" :href="withBase(`/english/archive/${neighbors.next}`)">{{ neighbors.next }} →</a>
</p>
<p v-else>
  选择一个日期：<a :href="withBase('/english/archive/')">返回往期列表</a>。
</p>

<style>
.english-archive-nav { display: flex; gap: 16px; justify-content: space-between; }
</style>
