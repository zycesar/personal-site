import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ENGLISH_PROGRESS_KEY, useEnglishProgress } from './useEnglishProgress'

const today = '2026-10-12'

beforeEach(() => {
  window.localStorage.clear()
  // "只许当天打卡"的规则依赖系统时间；用假时钟固定到 2026-10-12（本地时区），测试才稳定
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 12, 9, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useEnglishProgress', () => {
  it('starts empty and tolerates corrupted storage', () => {
    expect(useEnglishProgress().progress.value.checkins).toEqual({})

    window.localStorage.setItem(ENGLISH_PROGRESS_KEY, '{broken json')
    expect(useEnglishProgress().progress.value.checkins).toEqual({})

    window.localStorage.setItem(ENGLISH_PROGRESS_KEY, JSON.stringify({ checkins: 'nope' }))
    expect(useEnglishProgress().progress.value.checkins).toEqual({})
  })

  it('checks in only for today and persists the record', () => {
    const store = useEnglishProgress()
    store.checkIn(today)
    expect(store.isCheckedIn(today)).toBe(true)
    expect(useEnglishProgress().isCheckedIn(today)).toBe(true)
    expect(JSON.parse(window.localStorage.getItem(ENGLISH_PROGRESS_KEY)!).checkins[today]).toBe(true)

    store.checkIn('2026-10-11')
    store.checkIn('2026-10-13')
    expect(store.isCheckedIn('2026-10-11')).toBe(false)
    expect(store.isCheckedIn('2026-10-13')).toBe(false)
  })

  it('counts the streak ending today, with a grace day', () => {
    // 历史打卡直接写入存储（checkIn 只允许当天，无法用来造历史数据）
    window.localStorage.setItem(ENGLISH_PROGRESS_KEY, JSON.stringify({
      checkins: { '2026-10-10': true, '2026-10-11': true },
      wordMarks: {},
      quizResults: {},
    }))

    const fresh = useEnglishProgress()
    expect(fresh.streakCount(today)).toBe(2)

    fresh.checkIn(today)
    expect(fresh.streakCount(today)).toBe(3)
    expect(useEnglishProgress().streakCount('2026-10-14')).toBe(0)
  })

  it('stores word marks and quiz results', () => {
    const store = useEnglishProgress()
    store.markWord('w-001', 'known')
    store.markWord('w-001', 'fuzzy')
    store.recordQuiz('q-001', 2, false)

    const fresh = useEnglishProgress()
    expect(fresh.progress.value.wordMarks['w-001']).toMatchObject({ level: 'fuzzy' })
    expect(fresh.progress.value.quizResults['q-001']).toMatchObject({ picked: 2, correct: false })
  })

  it('stores term marks independently from word marks', () => {
    const store = useEnglishProgress()
    store.markWord('w-001', 'known')
    store.markTerm('t-001', 'known')
    store.markTerm('t-002', 'fuzzy')

    const fresh = useEnglishProgress()
    expect(fresh.progress.value.wordMarks['w-001']).toMatchObject({ level: 'known' })
    expect(fresh.progress.value.termMarks['t-001']).toMatchObject({ level: 'known' })
    expect(fresh.progress.value.termMarks['t-002']).toMatchObject({ level: 'fuzzy' })
    expect(fresh.isTermMastered('t-001')).toBe(true)
    expect(fresh.isTermMastered('t-002')).toBe(false)
    expect(fresh.masteredCount(['t-001', 't-002', 't-003'])).toBe(1)
  })

  it('keeps existing progress when termMarks is absent from storage', () => {
    window.localStorage.setItem(ENGLISH_PROGRESS_KEY, JSON.stringify({
      checkins: { '2026-10-12': true },
    }))
    const store = useEnglishProgress()
    expect(store.progress.value.checkins['2026-10-12']).toBe(true)
    expect(store.progress.value.termMarks).toEqual({})
    expect(store.masteredCount(['t-001'])).toBe(0)
  })

  it('persists term marks to local storage', () => {
    const store = useEnglishProgress()
    store.markTerm('t-001', 'known')
    const stored = JSON.parse(window.localStorage.getItem(ENGLISH_PROGRESS_KEY)!)
    expect(stored.termMarks['t-001'].level).toBe('known')
  })
})
