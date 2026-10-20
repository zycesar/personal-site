import { ref, type Ref } from 'vue'

import { shiftDate, todayIso } from '../../../english/rotation'

export const ENGLISH_PROGRESS_KEY = 'wyz:english-progress:v1'

export type MarkLevel = 'known' | 'fuzzy' | 'unknown'
export type WordMarkLevel = MarkLevel

export interface EnglishProgress {
  checkins: Record<string, true>
  wordMarks: Record<string, { level: WordMarkLevel, at: string }>
  termMarks: Record<string, { level: MarkLevel, at: string }>
  quizResults: Record<string, { picked: number, correct: boolean, at: string }>
}

function emptyProgress(): EnglishProgress {
  return { checkins: {}, wordMarks: {}, termMarks: {}, quizResults: {} }
}

function nowIso(): string {
  return new Date().toISOString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readProgress(): EnglishProgress {
  if (typeof window === 'undefined') return emptyProgress()
  try {
    const raw = window.localStorage.getItem(ENGLISH_PROGRESS_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw) as Partial<EnglishProgress>
    return {
      checkins: isRecord(parsed.checkins) ? parsed.checkins as EnglishProgress['checkins'] : {},
      wordMarks: isRecord(parsed.wordMarks) ? parsed.wordMarks as EnglishProgress['wordMarks'] : {},
      termMarks: isRecord(parsed.termMarks) ? parsed.termMarks as EnglishProgress['termMarks'] : {},
      quizResults: isRecord(parsed.quizResults) ? parsed.quizResults as EnglishProgress['quizResults'] : {},
    }
  } catch {
    return emptyProgress()
  }
}

export function useEnglishProgress() {
  const progress = ref<EnglishProgress>(readProgress()) as Ref<EnglishProgress>

  function persist(): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ENGLISH_PROGRESS_KEY, JSON.stringify(progress.value))
  }

  function checkIn(dateIso: string): void {
    if (dateIso !== todayIso()) return
    if (progress.value.checkins[dateIso]) return
    progress.value.checkins[dateIso] = true
    persist()
  }

  function isCheckedIn(dateIso: string): boolean {
    return Boolean(progress.value.checkins[dateIso])
  }

  function streakCount(referenceDate: string): number {
    let cursor = referenceDate
    if (!isCheckedIn(cursor)) {
      cursor = shiftDate(cursor, -1)
      if (!isCheckedIn(cursor)) return 0
    }
    let streak = 0
    while (isCheckedIn(cursor)) {
      streak += 1
      cursor = shiftDate(cursor, -1)
    }
    return streak
  }

  function markWord(wordId: string, level: WordMarkLevel, at: string = nowIso()): void {
    progress.value.wordMarks[wordId] = { level, at }
    persist()
  }

  function recordQuiz(quizId: string, picked: number, correct: boolean, at: string = nowIso()): void {
    progress.value.quizResults[quizId] = { picked, correct, at }
    persist()
  }

  function markTerm(termId: string, level: MarkLevel, at: string = nowIso()): void {
    progress.value.termMarks[termId] = { level, at }
    persist()
  }

  function isTermMastered(termId: string): boolean {
    return progress.value.termMarks[termId]?.level === 'known'
  }

  function masteredCount(termIds: readonly string[]): number {
    return termIds.filter((termId) => isTermMastered(termId)).length
  }

  return {
    progress,
    checkIn,
    isCheckedIn,
    streakCount,
    markWord,
    recordQuiz,
    markTerm,
    isTermMastered,
    masteredCount,
  }
}
