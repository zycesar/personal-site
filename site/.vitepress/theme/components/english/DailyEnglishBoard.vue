<script setup lang="ts">
import { computed } from 'vue'

import { dailyPicks } from '../../../english/picks'
import CheckInCard from './CheckInCard.vue'
import QuizCard from './QuizCard.vue'
import SentenceCard from './SentenceCard.vue'
import WordCard from './WordCard.vue'

const props = withDefaults(defineProps<{ dateIso: string, interactive?: boolean }>(), { interactive: false })

const picks = computed(() => dailyPicks(props.dateIso))
</script>

<template>
  <section class="english-board" aria-label="每日英语">
    <WordCard :word="picks.word" :read-only="!interactive" />
    <SentenceCard :sentence="picks.sentence" :read-only="!interactive" />
    <QuizCard :quiz="picks.quiz" :read-only="!interactive" />
    <CheckInCard v-if="interactive" :date-iso="dateIso" />
  </section>
</template>

<style scoped>
.english-board { display: grid; gap: 16px; }
@media (min-width: 900px) {
  .english-board { grid-template-columns: 1fr 1fr; align-items: start; }
  .english-board > :first-child { grid-row: span 2; }
  .english-board > :last-child { grid-column: 1 / -1; }
}
</style>
