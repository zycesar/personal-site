<script setup lang="ts">
import { useEnglishSpeech } from './useEnglishSpeech'

const { available, hasEnglishVoice, speechErrorText } = useEnglishSpeech()
</script>

<template>
  <p v-if="available && !hasEnglishVoice" class="speech-hint">
    <strong>没有检测到英文语音包</strong>，已改用系统默认音色朗读，口音偏重。装上英文语音包即可获得标准发音：Windows 走「设置 → 时间和语言 → 语言和区域 → English (United States) → 语言选项 → 语音」；macOS 走「系统设置 → 辅助功能 → 朗读内容 → 系统声音」。
  </p>
  <p v-if="speechErrorText" class="speech-hint is-error" role="status">{{ speechErrorText }}</p>
</template>

<style scoped>
.speech-hint {
  margin: 0;
  padding: 12px 16px;
  border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border));
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  color: var(--text);
  font-size: 14px;
  line-height: 1.7;
}
.speech-hint strong { color: var(--accent); }
.speech-hint.is-error { border-color: color-mix(in srgb, #d64545 45%, var(--border)); }
</style>
