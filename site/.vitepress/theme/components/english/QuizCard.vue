<script setup lang="ts">
import { computed, ref } from 'vue'

import type { QuizEntry } from '../../../english/schema'
import { useEnglishProgress } from './useEnglishProgress'

const props = withDefaults(defineProps<{ quiz: QuizEntry, readOnly?: boolean }>(), { readOnly: false })

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const
const { recordQuiz } = useEnglishProgress()

const picked = ref<number | null>(null)
const answered = computed(() => picked.value !== null || props.readOnly)

const feedback = computed(() => {
  const answer = `正确答案：${OPTION_LABELS[props.quiz.answerIndex]}`
  if (picked.value === null) return `${answer}　${props.quiz.explanation}`
  const correct = picked.value === props.quiz.answerIndex
  return `${correct ? '回答正确 🎉' : '回答错误'}　${answer}　${props.quiz.explanation}`
})

function choose(index: number): void {
  if (answered.value) return
  picked.value = index
  recordQuiz(props.quiz.id, index, index === props.quiz.answerIndex)
}
</script>

<template>
  <article class="quiz-card english-card">
    <p class="english-card-kicker">每日一练</p>
    <p class="quiz-card-stem">{{ quiz.stem }}</p>
    <div class="quiz-card-options">
      <button
        v-for="(option, index) in quiz.options"
        :key="option"
        type="button"
        class="quiz-option"
        :class="{
          'is-correct': answered && index === quiz.answerIndex,
          'is-wrong': picked === index && index !== quiz.answerIndex,
        }"
        :aria-label="`选项${OPTION_LABELS[index]}`"
        :disabled="answered"
        @click="choose(index)"
      >
        {{ OPTION_LABELS[index] }}. {{ option }}
      </button>
    </div>
    <p class="quiz-feedback" role="status">{{ feedback }}</p>
  </article>
</template>

<style scoped>
.english-card { padding: 24px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.english-card-kicker { margin: 0; color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.quiz-card-stem { margin: 10px 0 0; font-size: 17px; }
.quiz-card-options { display: grid; gap: 8px; margin-top: 14px; }
.quiz-option { padding: 10px 14px; border: 1px solid var(--border); border-radius: 10px; background: transparent; color: var(--text); text-align: left; cursor: pointer; }
.quiz-option:hover:not(:disabled) { border-color: var(--accent); }
.quiz-option:disabled { cursor: default; }
.quiz-option.is-correct { border-color: #2e9e6b; color: #2e9e6b; font-weight: 700; }
.quiz-option.is-wrong { border-color: #c8553d; color: #c8553d; }
.quiz-feedback { margin: 14px 0 0; padding: 10px 12px; border-radius: 10px; background: color-mix(in srgb, var(--accent) 8%, transparent); color: var(--text); }
@media (prefers-reduced-motion: reduce) {
  .quiz-option { transition: none; }
}
</style>
