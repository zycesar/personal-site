import { describe, expect, it } from 'vitest'

import {
  adjacentDates,
  dateFromDayNumber,
  dayNumber,
  isValidDateIso,
  listArchiveDates,
  pickDaily,
  shiftDate,
  todayIso,
} from './rotation'

describe('date helpers', () => {
  it('validates ISO dates strictly', () => {
    expect(isValidDateIso('2026-10-12')).toBe(true)
    expect(isValidDateIso('2026-02-30')).toBe(false)
    expect(isValidDateIso('2026-10-12T00:00:00Z')).toBe(false)
    expect(isValidDateIso('10-12')).toBe(false)
  })

  it('computes stable day numbers and reconstructs dates', () => {
    expect(dayNumber('1970-01-01')).toBe(0)
    expect(dayNumber('1970-01-02')).toBe(1)
    expect(dateFromDayNumber(0)).toBe('1970-01-01')
    expect(dateFromDayNumber(dayNumber('2026-10-12'))).toBe('2026-10-12')
    expect(() => dayNumber('2026-02-30')).toThrow()
  })

  it('shifts dates across month boundaries', () => {
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28')
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('formats the local date, not UTC', () => {
    expect(todayIso(new Date(2026, 9, 12, 23, 30))).toBe('2026-10-12')
  })
})

describe('pickDaily', () => {
  const pool = ['a', 'b', 'c']
  const first = dayNumber('2026-10-12') % 3

  it('is deterministic for the same date', () => {
    expect(pickDaily(pool, '2026-10-12')).toBe(pickDaily(pool, '2026-10-12'))
  })

  it('rotates with the date and wraps around the pool', () => {
    expect(pickDaily(pool, '2026-10-12')).toBe(pool[first])
    expect(pickDaily(pool, '2026-10-13')).toBe(pool[(first + 1) % 3])
    expect(pickDaily(pool, '2026-10-14')).toBe(pool[(first + 2) % 3])
    expect(pickDaily(pool, '2026-10-15')).toBe(pool[first])
  })

  it('supports offsets so the three kinds diverge', () => {
    expect(pickDaily(pool, '2026-10-12', 1)).toBe(pool[(first + 1) % 3])
    expect(pickDaily(pool, '2026-10-12', 2)).toBe(pool[(first + 2) % 3])
  })

  it('throws on an empty pool', () => {
    expect(() => pickDaily([], '2026-10-12')).toThrow()
  })
})

describe('listArchiveDates', () => {
  it('lists launch..today ascending', () => {
    expect(listArchiveDates('2026-10-14')).toEqual(['2026-10-12', '2026-10-13', '2026-10-14'])
  })

  it('is empty before launch', () => {
    expect(listArchiveDates('2026-10-11')).toEqual([])
  })

  it('caps the window at 180 days ending today', () => {
    const dates = listArchiveDates('2027-06-01')
    expect(dates).toHaveLength(180)
    expect(dates[0]).toBe('2026-10-12')
    expect(dates.at(-1)).toBe('2027-04-09')
  })
})

describe('adjacentDates', () => {
  const dates = ['2026-10-12', '2026-10-13', '2026-10-14']

  it('returns neighbors inside the list', () => {
    expect(adjacentDates(dates, '2026-10-13')).toEqual({ previous: '2026-10-12', next: '2026-10-14' })
  })

  it('returns null at the edges and for unknown dates', () => {
    expect(adjacentDates(dates, '2026-10-12')).toEqual({ previous: null, next: '2026-10-13' })
    expect(adjacentDates(dates, '2026-10-14')).toEqual({ previous: '2026-10-13', next: null })
    expect(adjacentDates(dates, '2020-01-01')).toEqual({ previous: null, next: null })
  })
})
