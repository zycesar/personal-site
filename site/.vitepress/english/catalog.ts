import { CATEGORIES, TRACKS, type TermEntry } from './schema'
import { terms } from './load-data'

export type Track = (typeof TRACKS)[number]

export interface TrackMeta {
  title: string
  subtitle: string
}

export const TRACK_META: Record<Track, TrackMeta> = {
  fullstack: {
    title: '全栈工程师',
    subtitle: '前后端、数据库、部署、Code Review',
  },
  agent: {
    title: 'Agent 工程师',
    subtitle: 'LLM、Prompt、RAG、Tool calling、Evals',
  },
}

export function termsByTrack(track: Track): TermEntry[] {
  return terms.filter((term) => term.track === track)
}

export function categoriesByTrack(track: Track): string[] {
  const used = new Set(termsByTrack(track).map((term) => term.category))
  return CATEGORIES.filter((category) => used.has(category))
}

export interface TermFilterOptions {
  track: Track
  category?: string | null
  onlyUnmastered?: boolean
  masteredIds?: ReadonlySet<string>
}

export function filterTerms(
  source: readonly TermEntry[],
  { track, category = null, onlyUnmastered = false, masteredIds }: TermFilterOptions,
): TermEntry[] {
  return source.filter((term) => {
    if (term.track !== track) return false
    if (category && term.category !== category) return false
    if (onlyUnmastered && masteredIds?.has(term.id)) return false
    return true
  })
}
