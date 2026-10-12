<script setup lang="ts">
import { onMounted, ref } from 'vue'

import type { WordEntry } from '../../../english/schema'
import { useEnglishProgress, type WordMarkLevel } from './useEnglishProgress'

const props = withDefaults(defineProps<{ word: WordEntry, readOnly?: boolean }>(), { readOnly: false })

const { progress, markWord } = useEnglishProgress()
const speechAvailable = ref(false)

onMounted(() => {
  speechAvailable.value = typeof window !== 'undefined' && 'speechSynthesis' in window
})

const markOptions: Array<{ level: WordMarkLevel, label: string }> = [
  { level: 'known', label: '认识' },
  { level: 'fuzzy', label: '模糊' },
  { level: 'unknown', label: '不认识' },
]

function currentLevel(level: WordMarkLevel): boolean {
  return progress.value.wordMarks[props.word.id]?.level === level
}

function speak(): void {
  if (!speechAvailable.value || typeof window === 'undefined') return
  const utterance = new SpeechSynthesisUtterance(props.word.word)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
</script>

<template>
  <article class="word-card english-card">
    <p class="english-card-kicker">每日单词</p>
    <h3 class="word-card-term">{{ word.word }} <small class="word-card-phonetic">{{ word.phonetic }}</small></h3>
    <ul class="word-card-definitions">
      <li v-for="definition in word.definitions" :key="definition.pos + definition.meaning">
        {{ definition.pos }} {{ definition.meaning }}
      </li>
    </ul>
    <p class="word-card-example-en">{{ word.exampleEn }}</p>
    <p class="word-card-example-zh">{{ word.exampleZh }}</p>
    <div v-if="!readOnly" class="word-card-actions">
      <button type="button" class="speak-button" aria-label="播放单词发音" @click="speak">🔊 发音</button>
      <span class="word-card-marks" role="group" aria-label="标记熟悉度">
        <button
          v-for="option in markOptions"
          :key="option.level"
          type="button"
          class="mark-button"
          :aria-pressed="String(currentLevel(option.level))"
          @click="markWord(word.id, option.level)"
        >
          {{ option.label }}
        </button>
      </span>
    </div>
  </article>
</template>

<style scoped>
.english-card { padding: 24px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.english-card-kicker { margin: 0; color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.word-card-term { margin: 10px 0 4px; font-size: 28px; }
.word-card-phonetic { color: var(--muted); font-size: 15px; font-weight: 400; }
.word-card-definitions { margin: 8px 0 0; padding: 0; list-style: none; color: var(--text); }
.word-card-definitions li { margin: 2px 0; }
.word-card-example-en { margin: 14px 0 0; font-style: italic; }
.word-card-example-zh { margin: 4px 0 0; color: var(--muted); }
.word-card-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 16px; }
.word-card-actions button { padding: 6px 14px; border: 1px solid var(--border); border-radius: 999px; background: transparent; color: var(--text); cursor: pointer; }
.word-card-actions button:hover { border-color: var(--accent); }
.word-card-actions button[aria-pressed="true"] { border-color: var(--accent); color: var(--accent); font-weight: 700; }
@media (prefers-reduced-motion: reduce) {
  .word-card-actions button { transition: none; }
}
</style>
