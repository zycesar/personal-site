import { describe, expect, it } from 'vitest'

import { parsePool, quizzes, sentences, terms, words } from './load-data'
import { quizSchema, sentenceSchema, termSchema, wordSchema } from './schema'

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

describe('term schema', () => {
  it('rejects a term with unknown extra fields', () => {
    expect(termSchema.safeParse({
      id: 't-x', term: 'frontend', phonetic: '/x/', meaning: '前端',
      category: '前端', track: 'fullstack',
      exampleEn: 'The frontend calls the API.', exampleZh: '前端调用接口。',
      tags: [], extra: 1,
    }).success).toBe(false)
  })

  it('rejects an unknown track', () => {
    expect(termSchema.safeParse({
      id: 't-x', term: 'frontend', phonetic: '/x/', meaning: '前端',
      category: '前端', track: 'devops',
      exampleEn: 'The frontend calls the API.', exampleZh: '前端调用接口。',
      tags: [],
    }).success).toBe(false)
  })

  it('rejects a category outside the controlled set', () => {
    expect(termSchema.safeParse({
      id: 't-x', term: 'frontend', phonetic: '/x/', meaning: '前端',
      category: '不存在的分类', track: 'fullstack',
      exampleEn: 'The frontend calls the API.', exampleZh: '前端调用接口。',
      tags: [],
    }).success).toBe(false)
  })

  it('requires both example sentences to be non-empty', () => {
    expect(termSchema.safeParse({
      id: 't-x', term: 'frontend', phonetic: '/x/', meaning: '前端',
      category: '前端', track: 'fullstack',
      exampleEn: '', exampleZh: '前端调用接口。', tags: [],
    }).success).toBe(false)
  })
})

describe('term pool', () => {
  it('loads 120 terms with unique ids', () => {
    expect(terms).toHaveLength(120)
    expect(new Set(terms.map((entry) => entry.id)).size).toBe(120)
  })

  it('splits the pool into 80 fullstack and 40 agent terms', () => {
    expect(terms.filter((entry) => entry.track === 'fullstack')).toHaveLength(80)
    expect(terms.filter((entry) => entry.track === 'agent')).toHaveLength(40)
  })

  it('gives every category a non-trivial number of terms', () => {
    const counts = new Map<string, number>()
    for (const term of terms) {
      counts.set(term.category, (counts.get(term.category) ?? 0) + 1)
    }
    expect(counts.size).toBeGreaterThanOrEqual(15)
    for (const count of counts.values()) expect(count).toBeGreaterThanOrEqual(4)
  })

  it('has no duplicate term text', () => {
    const words = terms.map((entry) => entry.term.toLowerCase())
    expect(new Set(words).size).toBe(words.length)
  })

  it('includes the key term in every example sentence', () => {
    for (const term of terms) {
      expect(term.exampleEn.toLowerCase()).toContain(term.term.toLowerCase())
    }
  })
})
