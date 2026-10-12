import { quizzes, sentences, words, type QuizEntry, type SentenceEntry, type WordEntry } from './load-data'
import { pickDaily } from './rotation'

export const PICK_OFFSETS = { sentence: 7, quiz: 13 } as const

export interface DailyPicks {
  word: WordEntry
  sentence: SentenceEntry
  quiz: QuizEntry
}

export function dailyPicks(dateIso: string): DailyPicks {
  return {
    word: pickDaily(words, dateIso),
    sentence: pickDaily(sentences, dateIso, PICK_OFFSETS.sentence),
    quiz: pickDaily(quizzes, dateIso, PICK_OFFSETS.quiz),
  }
}
