import { z } from 'zod'

export const wordSchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  phonetic: z.string().min(1),
  definitions: z.array(z.object({
    pos: z.string().min(1),
    meaning: z.string().min(1),
  })).min(1),
  exampleEn: z.string().min(1),
  exampleZh: z.string().min(1),
  tags: z.array(z.string()).default([]),
}).strict()

export const sentenceSchema = z.object({
  id: z.string().min(1),
  en: z.string().min(1),
  zh: z.string().min(1),
  notes: z.array(z.string().min(1)).min(1),
  source: z.string().min(1).optional(),
}).strict()

export const quizSchema = z.object({
  id: z.string().min(1),
  stem: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  tags: z.array(z.string()).default([]),
}).strict()

export const TRACKS = ['fullstack', 'agent'] as const

export const CATEGORIES = [
  '前端',
  '后端',
  '接口',
  '数据库',
  '部署',
  '持续集成/持续交付',
  '架构',
  '测试',
  '可观测性',
  '性能',
  'LLM',
  'Prompt',
  'RAG',
  '工具调用',
  '评测',
] as const

export const termSchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  phonetic: z.string().min(1),
  meaning: z.string().min(1),
  category: z.enum(CATEGORIES),
  track: z.enum(TRACKS),
  sayAs: z.string().min(1).optional(),
  exampleEn: z.string().min(1),
  exampleZh: z.string().min(1),
  tags: z.array(z.string()).default([]),
}).strict()

export type WordEntry = z.infer<typeof wordSchema>
export type SentenceEntry = z.infer<typeof sentenceSchema>
export type QuizEntry = z.infer<typeof quizSchema>
export type TermEntry = z.infer<typeof termSchema>
