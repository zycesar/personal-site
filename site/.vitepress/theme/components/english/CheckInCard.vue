<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { todayIso } from '../../../english/rotation'
import { useEnglishProgress } from './useEnglishProgress'

const props = defineProps<{ dateIso: string }>()

const { checkIn, isCheckedIn, streakCount } = useEnglishProgress()
const ready = ref(false)

onMounted(() => {
  ready.value = true
})

const checked = computed(() => ready.value && isCheckedIn(props.dateIso))
const streak = computed(() => (ready.value ? streakCount(todayIso()) : 0))

function handleCheckIn(): void {
  checkIn(props.dateIso)
}
</script>

<template>
  <div class="checkin-card english-card">
    <div class="checkin-copy">
      <p class="english-card-kicker">坚持打卡</p>
      <p v-if="ready && streak > 0" class="checkin-streak">已连续打卡 {{ streak }} 天</p>
      <p v-else class="checkin-streak checkin-streak-muted">{{ ready ? '今天从一次打卡开始。' : '' }}</p>
    </div>
    <button
      type="button"
      class="checkin-button"
      aria-label="今日打卡"
      :disabled="checked"
      @click="handleCheckIn"
    >
      {{ checked ? '已打卡 ✅' : '打卡' }}
    </button>
  </div>
</template>

<style scoped>
.english-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 24px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
.english-card-kicker { margin: 0; color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .12em; }
.checkin-streak { margin: 6px 0 0; font-weight: 700; }
.checkin-streak-muted { color: var(--muted); font-weight: 400; min-height: 1.4em; }
.checkin-button { min-width: 112px; padding: 10px 22px; border: 1px solid var(--accent); border-radius: 999px; background: var(--accent); color: #fff; font-weight: 700; cursor: pointer; }
.checkin-button:disabled { opacity: .75; cursor: default; }
@media (prefers-reduced-motion: reduce) {
  .checkin-button { transition: none; }
}
</style>
