---
title: 每日英语
description: 每天一个单词、一句英文和一组小练习，把英语学习变成站点的日常。
---

<script setup>
import { withBase } from 'vitepress'

import { data as today } from './today.data'
import DailyEnglishBoard from '../.vitepress/theme/components/english/DailyEnglishBoard.vue'
</script>

# 每日英语

每天更新一个单词、一句值得记住的英文和一组小练习。学习记录保存在你自己的浏览器里，不会上传。

<DailyEnglishBoard :date-iso="today" interactive />

<p class="english-meta">内容日期：{{ today }} · <a :href="withBase('/english/archive/')">查看往期 →</a></p>

<style>
.english-meta { color: var(--vp-c-text-2); font-size: 14px; }
</style>
