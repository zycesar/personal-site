import { describe, expect, it } from 'vitest'

import { parsePool, quizzes, sentences, words } from './load-data'
import { quizSchema, sentenceSchema, wordSchema } from './schema'

describe('english schema', () => {
  it('rejects a word with unknown extra fields', () => {
    expect(wordSchema.safeParse({
      id: 'w-x', word: 'test', phonetic: '/test/', definitions: [{ pos: 'n.', meaning: '测试' }],
      exampleEn: 'This is a test.', exampleZh: '这是一个测试。', tags: [], extra: 1,
    }).success).toBe(false)
  })

  it('rejects a quiz whose options are not exactly four strings', () => {
    const bad = quizSchema.safeParse({
      id: 'q-x', stem: '题干', options: ['A', 'B', 'C'], answerIndex: 0, explanation: '解析', tags: [],
    })
    expect(bad.success).toBe(false)
  })

  it('rejects a quiz whose answerIndex is out of range', () => {
    const bad = quizSchema.safeParse({
      id: 'q-x', stem: '题干', options: ['A', 'B', 'C', 'D'], answerIndex: 4, explanation: '解析', tags: [],
    })
    expect(bad.success).toBe(false)
  })

  it('reports the file name when parsePool fails', () => {
    expect(() => parsePool(sentenceSchema, [{ id: 's-x' }], 'sentences.json'))
      .toThrow(/english-data\/sentences\.json/)
  })
})

describe('english pools', () => {
  it('loads at least 30 entries of each kind with unique ids', () => {
    expect(words.length).toBeGreaterThanOrEqual(30)
    expect(sentences.length).toBeGreaterThanOrEqual(30)
    expect(quizzes.length).toBeGreaterThanOrEqual(30)
    for (const pool of [words, sentences, quizzes]) {
      expect(new Set(pool.map((entry) => entry.id)).size).toBe(pool.length)
    }
  })

  it('keeps quiz answers in range', () => {
    for (const quiz of quizzes) {
      expect(quiz.answerIndex).toBeGreaterThanOrEqual(0)
      expect(quiz.answerIndex).toBeLessThan(quiz.options.length)
    }
  })
})
