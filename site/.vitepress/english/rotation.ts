export const ENGLISH_LAUNCH_DATE = '2026-10-12'
export const ARCHIVE_CAP_DAYS = 180

const MS_PER_DAY = 86_400_000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateIso(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const utc = new Date(Date.UTC(year!, month! - 1, day!))
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month! - 1 && utc.getUTCDate() === day
}

export function dayNumber(dateIso: string): number {
  if (!isValidDateIso(dateIso)) throw new Error(`无效日期：${dateIso}`)
  const [year, month, day] = dateIso.split('-').map(Number)
  return Math.floor(Date.UTC(year!, month! - 1, day!) / MS_PER_DAY)
}

export function dateFromDayNumber(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10)
}

export function shiftDate(dateIso: string, days: number): string {
  return dateFromDayNumber(dayNumber(dateIso) + days)
}

export function todayIso(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function pickDaily<T>(pool: readonly T[], dateIso: string, offset = 0): T {
  if (pool.length === 0) throw new Error('pickDaily 的内容池不能为空')
  const index = ((dayNumber(dateIso) + offset) % pool.length + pool.length) % pool.length
  return pool[index]
}

export function listArchiveDates(
  today: string,
  launch: string = ENGLISH_LAUNCH_DATE,
  cap: number = ARCHIVE_CAP_DAYS,
): string[] {
  if (!isValidDateIso(today) || !isValidDateIso(launch) || cap <= 0) return []
  const start = dayNumber(launch)
  const last = Math.min(dayNumber(today), start + cap - 1)
  const dates: string[] = []
  for (let day = start; day <= last; day += 1) dates.push(dateFromDayNumber(day))
  return dates
}

export function adjacentDates(
  dates: readonly string[],
  dateIso: string,
): { previous: string | null, next: string | null } {
  const index = dates.indexOf(dateIso)
  if (index === -1) return { previous: null, next: null }
  return {
    previous: index > 0 ? dates[index - 1]! : null,
    next: index < dates.length - 1 ? dates[index + 1]! : null,
  }
}
