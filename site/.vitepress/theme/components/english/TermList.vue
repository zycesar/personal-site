<script setup lang="ts">
import { computed, ref } from 'vue'

import {
  TRACK_META,
  categoriesByTrack,
  filterTerms,
  type Track,
} from '../../../english/catalog'
import { terms } from '../../../english/load-data'
import EnglishSpeechHint from './EnglishSpeechHint.vue'
import TermCard from './TermCard.vue'
import { useEnglishProgress, type MarkLevel } from './useEnglishProgress'

const { progress, markTerm, masteredCount } = useEnglishProgress()

const currentTrack = ref<Track>('fullstack')
const currentCategory = ref<string | null>(null)
const onlyUnmastered = ref(false)

const categories = computed(() => categoriesByTrack(currentTrack.value))

const scopedTerms = computed(() =>
  filterTerms(terms, {
    track: currentTrack.value,
    category: currentCategory.value,
  }),
)

const visibleTerms = computed(() => {
  if (!onlyUnmastered.value) return scopedTerms.value
  const mastered = new Set(
    Object.entries(progress.value.termMarks)
      .filter(([, mark]) => mark.level === 'known')
      .map(([termId]) => termId),
  )
  return filterTerms(scopedTerms.value, {
    track: currentTrack.value,
    category: currentCategory.value,
    onlyUnmastered: true,
    masteredIds: mastered,
  })
})

const mastered = computed(() => masteredCount(scopedTerms.value.map((term) => term.id)))
const total = computed(() => scopedTerms.value.length)
const percent = computed(() => (total.value === 0 ? 0 : Math.round((mastered.value / total.value) * 100)))

function selectTrack(track: Track): void {
  currentTrack.value = track
  currentCategory.value = null
}

function selectCategory(category: string | null): void {
  currentCategory.value = category
}

function handleMark(termId: string, level: MarkLevel): void {
  markTerm(termId, level)
}
</script>

<template>
  <section class="term-list" aria-label="工程师英语术语卡">
    <EnglishSpeechHint />

    <div class="term-tracks" role="group" aria-label="学习方向">
      <button
        v-for="(meta, track) in TRACK_META"
        :key="track"
        type="button"
        class="term-track"
        :aria-pressed="String(currentTrack === track)"
        @click="selectTrack(track)"
      >
        <strong>{{ meta.title }}</strong>
        <span>{{ meta.subtitle }}</span>
      </button>
    </div>

    <div class="term-filters">
      <div class="term-categories" role="group" aria-label="按分类筛选">
        <button
          type="button"
          class="term-filter"
          :aria-pressed="String(currentCategory === null)"
          @click="selectCategory(null)"
        >
          全部
        </button>
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="term-filter"
          :aria-pressed="String(currentCategory === category)"
          @click="selectCategory(category)"
        >
          {{ category }}
        </button>
      </div>
      <button
        type="button"
        class="term-filter term-filter-toggle"
        :aria-pressed="String(onlyUnmastered)"
        @click="onlyUnmastered = !onlyUnmastered"
      >
        只看未掌握
      </button>
    </div>

    <div class="term-progress">
      <div class="term-progress-head">
        <div>
          <p class="term-kicker">TERMS · 术语卡</p>
          <h2>术语卡</h2>
        </div>
        <p class="term-progress-count">已掌握 {{ mastered }} / {{ total }}</p>
      </div>
      <div
        class="term-progress-bar"
        role="progressbar"
        :aria-valuenow="mastered"
        aria-valuemin="0"
        :aria-valuemax="total"
        :aria-label="`术语掌握进度：已掌握 ${mastered} / ${total}`"
      >
        <span :style="{ width: `${percent}%` }"></span>
      </div>
      <p class="term-progress-tip">点开一张卡：听术语、听例句，读懂并记住它。</p>
    </div>

    <div class="term-cards">
      <TermCard
        v-for="term in visibleTerms"
        :key="term.id"
        :term="term"
        :level="progress.termMarks[term.id]?.level"
        @mark="(level) => handleMark(term.id, level)"
      />
      <p v-if="visibleTerms.length === 0" class="term-empty">
        这个范围里已经全部掌握，换个分类或方向看看。
      </p>
    </div>
  </section>
</template>

<style scoped>
.term-list { display: grid; gap: 22px; }
.term-tracks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.term-track {
  display: grid;
  gap: 4px;
  padding: 14px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color .18s ease, background-color .18s ease;
}
.term-track strong { font-size: 17px; }
.term-track span { color: var(--muted); font-size: 13px; line-height: 1.5; }
.term-track:hover { border-color: color-mix(in srgb, var(--accent) 55%, var(--border)); }
.term-track[aria-pressed='true'] {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
}
.term-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
.term-categories { display: flex; flex-wrap: wrap; gap: 8px; }
.term-filter {
  padding: 5px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  transition: border-color .18s ease, color .18s ease;
}
.term-filter:hover { border-color: var(--accent); color: var(--text); }
.term-filter[aria-pressed='true'] { border-color: var(--accent); color: var(--accent); font-weight: 700; }
.term-filter-toggle { white-space: nowrap; }
.term-progress { display: grid; gap: 12px; }
.term-progress-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.term-kicker { margin: 0; color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.term-progress-head h2 { margin: 6px 0 0; font-size: 24px; }
.term-progress-count {
  margin: 0;
  padding: 5px 14px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}
.term-progress-bar {
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--border) 80%, transparent);
  overflow: hidden;
}
.term-progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width .28s ease;
}
.term-progress-tip { margin: 0; color: var(--muted); font-size: 14px; }
.term-cards { display: grid; gap: 12px; }
.term-empty { margin: 0; padding: 28px; border: 1px dashed var(--border); border-radius: var(--radius); color: var(--muted); text-align: center; }
@media (max-width: 640px) {
  .term-tracks { grid-template-columns: 1fr; }
  .term-filters { flex-direction: column; align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .term-track,
  .term-filter,
  .term-progress-bar span { transition: none; }
}
</style>
