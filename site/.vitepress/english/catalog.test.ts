import { describe, expect, it } from 'vitest'

import { CATEGORIES, TRACKS, type TermEntry } from './schema'
import { TRACK_META, categoriesByTrack, filterTerms, termsByTrack } from './catalog'

function term(id: string, track: TermEntry['track'], category: string): TermEntry {
  return {
    id,
    term: id,
    phonetic: '/x/',
    meaning: '释义',
    category,
    track,
    exampleEn: 'Example.',
    exampleZh: '例子。',
    tags: [],
  }
}

describe('catalog', () => {
  it('describes both tracks', () => {
    expect(Object.keys(TRACK_META).sort()).toEqual([...TRACKS].sort())
    expect(TRACK_META.fullstack.title).toBe('全栈工程师')
    expect(TRACK_META.agent.title).toBe('Agent 工程师')
  })

  it('filters terms by track', () => {
    const fullstack = termsByTrack('fullstack')
    expect(fullstack.length).toBeGreaterThan(0)
    expect(fullstack.every((entry) => entry.track === 'fullstack')).toBe(true)
  })

  it('lists categories in the declared order and only those in use', () => {
    const categories = categoriesByTrack('agent')
    expect(categories).toEqual(CATEGORIES.filter((category) => categories.includes(category)))
    expect(categories.every((category) => CATEGORIES.includes(category as never))).toBe(true)
    expect(categories).toContain('RAG')
  })

  it('filters by track and category together', () => {
    const source = [term('t-1', 'fullstack', '前端'), term('t-2', 'agent', '前端')]
    expect(filterTerms(source, { track: 'fullstack', category: '前端' }).map((t) => t.id)).toEqual(['t-1'])
    expect(filterTerms(source, { track: 'agent', category: '前端' }).map((t) => t.id)).toEqual(['t-2'])
  })

  it('keeps every term of a track when no category is given', () => {
    const source = [term('t-1', 'fullstack', '前端'), term('t-2', 'fullstack', '后端')]
    expect(filterTerms(source, { track: 'fullstack' })).toHaveLength(2)
  })

  it('drops mastered terms when only unmastered is requested', () => {
    const source = [term('t-1', 'fullstack', '前端'), term('t-2', 'fullstack', '前端')]
    const mastered = new Set(['t-1'])
    expect(filterTerms(source, { track: 'fullstack', onlyUnmastered: true, masteredIds: mastered })
      .map((t) => t.id)).toEqual(['t-2'])
    expect(filterTerms(source, { track: 'fullstack', onlyUnmastered: false, masteredIds: mastered }))
      .toHaveLength(2)
  })

  it('returns an empty array when nothing matches', () => {
    const source = [term('t-1', 'fullstack', '前端')]
    expect(filterTerms(source, { track: 'agent' })).toEqual([])
    expect(filterTerms(source, { track: 'fullstack', category: '评测' })).toEqual([])
  })
})
