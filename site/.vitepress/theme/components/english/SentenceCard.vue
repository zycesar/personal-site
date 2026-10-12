<script setup lang="ts">
import type { SentenceEntry } from '../../../english/schema'
import { useEnglishSpeech } from './useEnglishSpeech'

withDefaults(defineProps<{ sentence: SentenceEntry, readOnly?: boolean }>(), { readOnly: false })

const { available: speechAvailable, speak } = useEnglishSpeech()
</script>

<template>
  <article class="sentence-card english-card">
    <p class="english-card-kicker">每日一句</p>
    <blockquote class="sentence-card-en">{{ sentence.en }}</blockquote>
    <p class="sentence-card-zh">{{ sentence.zh }}</p>
    <div class="sentence-card-notes">
      <p class="sentence-card-notes-title">语言点</p>
      <ul>
        <li v-for="note in sentence.notes" :key="note">{{ note }}</li>
      </ul>
    </div>
    <p v-if="sentence.source" class="sentence-card-source">—— {{ sentence.source }}</p>
    <div v-if="!readOnly && speechAvailable" class="sentence-card-actions">
      <button type="button" class="speak-button" aria-label="播放句子发音" @click="speak(sentence.en)">🔊 发音</button>
    </div>
  </article>
</template>

<style scoped>
.english-card { padding: 24px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.english-card-kicker { margin: 0; color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.sentence-card-en { margin: 12px 0 0; padding: 0; font-size: 19px; line-height: 1.7; }
.sentence-card-zh { margin: 8px 0 0; color: var(--muted); }
.sentence-card-notes { margin-top: 14px; }
.sentence-card-notes-title { margin: 0; font-size: 13px; font-weight: 700; color: var(--text); }
.sentence-card-notes ul { margin: 6px 0 0; padding-left: 18px; color: var(--muted); }
.sentence-card-notes li { margin: 2px 0; }
.sentence-card-source { margin: 12px 0 0; color: var(--muted); font-size: 14px; text-align: right; }
.sentence-card-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 16px; }
.sentence-card-actions button { padding: 6px 14px; border: 1px solid var(--border); border-radius: 999px; background: transparent; color: var(--text); cursor: pointer; }
.sentence-card-actions button:hover { border-color: var(--accent); }
@media (prefers-reduced-motion: reduce) {
  .sentence-card-actions button { transition: none; }
}
</style>
