<script setup lang="ts">
import { computed, ref } from 'vue'

import type { TermEntry } from '../../../english/schema'
import type { MarkLevel } from './useEnglishProgress'
import { useEnglishSpeech } from './useEnglishSpeech'

const props = withDefaults(defineProps<{
  term: TermEntry
  readOnly?: boolean
  level?: MarkLevel | undefined
}>(), { readOnly: false, level: undefined })

const emit = defineEmits<{ mark: [level: MarkLevel] }>()

const expanded = ref(false)
const panelId = computed(() => `term-panel-${props.term.id}`)

const { available: speechAvailable, speak } = useEnglishSpeech()

const markOptions: Array<{ level: MarkLevel, label: string }> = [
  { level: 'known', label: '认识' },
  { level: 'fuzzy', label: '模糊' },
  { level: 'unknown', label: '不认识' },
]

const levelLabel = computed(() => {
  if (props.level === 'known') return '已掌握'
  if (props.level === 'fuzzy') return '模糊'
  if (props.level === 'unknown') return '不认识'
  return ''
})

function toggle(): void {
  expanded.value = !expanded.value
}

function handleMark(level: MarkLevel): void {
  emit('mark', level)
}
</script>

<template>
  <article class="term-card" :class="{ 'is-mastered': level === 'known' }">
    <button
      type="button"
      class="term-card-head"
      :aria-expanded="expanded"
      :aria-controls="panelId"
      @click="toggle"
    >
      <span class="term-card-term">
        {{ term.term }}
        <small class="term-card-phonetic">{{ term.phonetic }}</small>
      </span>
      <span class="term-card-meaning">{{ term.meaning }}</span>
      <span class="term-card-meta">
        <span class="term-card-category">{{ term.category }}</span>
        <span v-if="levelLabel" class="term-card-badge" :class="{ 'is-muted': level !== 'known' }">
          {{ levelLabel }}
        </span>
      </span>
    </button>

    <div v-if="expanded" :id="panelId" class="term-card-panel">
      <p class="term-card-example">{{ term.exampleEn }}</p>
      <p class="term-card-example-zh">{{ term.exampleZh }}</p>
      <div v-if="speechAvailable" class="term-card-actions">
        <button
          type="button"
          class="speak-button"
          :aria-label="`听术语：${term.term}`"
          @click="speak(term.sayAs ?? term.term)"
        >
          🔊 听术语
        </button>
        <button
          type="button"
          class="speak-button"
          :aria-label="`听例句：${term.term}`"
          @click="speak(term.exampleEn)"
        >
          🔊 听例句
        </button>
      </div>
      <div v-if="!readOnly" class="term-card-marks" role="group" aria-label="标记熟悉度">
        <button
          v-for="option in markOptions"
          :key="option.level"
          type="button"
          class="mark-button"
          :aria-pressed="String(level === option.level)"
          @click="handleMark(option.level)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.term-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
  transition: border-color .18s ease;
}
.term-card:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--border)); }
.term-card.is-mastered { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }
.term-card-head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 16px;
  width: 100%;
  padding: 18px 22px;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.term-card-term { display: block; font-size: 22px; font-weight: 800; letter-spacing: -.01em; }
.term-card-phonetic { margin-left: 8px; color: var(--muted); font-size: 14px; font-weight: 400; }
.term-card-meaning { display: block; color: var(--muted); font-size: 15px; }
.term-card-meta { display: flex; align-items: center; gap: 8px; grid-row: 1 / span 2; grid-column: 2; }
.term-card-category {
  padding: 3px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.term-card-badge {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.term-card-badge.is-muted { background: color-mix(in srgb, var(--muted) 22%, transparent); color: var(--muted); }
.term-card-panel { padding: 0 22px 20px; border-top: 1px dashed var(--border); }
.term-card-example { margin: 16px 0 0; font-size: 17px; line-height: 1.75; }
.term-card-example-zh { margin: 6px 0 0; color: var(--muted); }
.term-card-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.term-card-marks { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 14px; }
.term-card-actions button,
.term-card-marks button {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
}
.term-card-actions button:hover,
.term-card-marks button:hover { border-color: var(--accent); }
.term-card-marks button[aria-pressed='true'] { border-color: var(--accent); color: var(--accent); font-weight: 700; }
@media (max-width: 560px) {
  .term-card-head { grid-template-columns: 1fr; }
  .term-card-meta { grid-row: auto; grid-column: 1; margin-top: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .term-card { transition: none; }
}
</style>
