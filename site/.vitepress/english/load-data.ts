import { z } from 'zod'

import quizzesRaw from '../../../english-data/quizzes.json'
import sentencesRaw from '../../../english-data/sentences.json'
import termsRaw from '../../../english-data/terms.json'
import wordsRaw from '../../../english-data/words.json'
import { quizSchema, sentenceSchema, termSchema, wordSchema, type QuizEntry, type SentenceEntry, type TermEntry, type WordEntry } from './schema'

export function parsePool<T>(schema: z.ZodType<T>, raw: unknown, file: string): T[] {
  const result = schema.array().safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues
      .map(({ path, message }) => `条目 ${path.join('.')}: ${message}`)
      .join('；')
    throw new Error(`english-data/${file} 数据无效：${issues}`)
  }
  return result.data
}

export const words: WordEntry[] = parsePool(wordSchema, wordsRaw, 'words.json')
export const sentences: SentenceEntry[] = parsePool(sentenceSchema, sentencesRaw, 'sentences.json')
export const quizzes: QuizEntry[] = parsePool(quizSchema, quizzesRaw, 'quizzes.json')
export const terms: TermEntry[] = parsePool(termSchema, termsRaw, 'terms.json')
