import { describe, expect, it } from 'vitest'

import { quizzes, sentences, words } from './load-data'
import { dailyPicks, PICK_OFFSETS } from './picks'
import { pickDaily } from './rotation'

describe('dailyPicks', () => {
  it('picks deterministic entries per kind', () => {
    const a = dailyPicks('2026-10-12')
    const b = dailyPicks('2026-10-12')
    expect(a.word.id).toBe(b.word.id)
    expect(a.sentence.id).toBe(b.sentence.id)
    expect(a.quiz.id).toBe(b.quiz.id)
  })

  it('uses the documented offsets against each pool', () => {
    const { word, sentence, quiz } = dailyPicks('2026-10-12')
    expect(word.id).toBe(pickDaily(words, '2026-10-12').id)
    expect(sentence.id).toBe(pickDaily(sentences, '2026-10-12', PICK_OFFSETS.sentence).id)
    expect(quiz.id).toBe(pickDaily(quizzes, '2026-10-12', PICK_OFFSETS.quiz).id)
  })

  it('advances to the next entries on the following day', () => {
    const a = dailyPicks('2026-10-12')
    const b = dailyPicks('2026-10-13')
    expect(b.word.id).not.toBe(a.word.id)
    expect(b.sentence.id).not.toBe(a.sentence.id)
    expect(b.quiz.id).not.toBe(a.quiz.id)
  })
})
