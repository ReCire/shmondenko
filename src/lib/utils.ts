import { getExerciseInfo } from '../data/exercises'
import { STOCK_WORKOUTS } from '../data/stockWorkouts'
import type { BlockMode, CompletionLog, ProgramTrack, Workout, WorkoutPhase } from '../data/types'

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/** Local calendar date as YYYY-MM-DD. */
export const localDateKey = (d: Date = new Date()): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const shiftDate = (key: string, days: number): string => {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return localDateKey(dt)
}

/**
 * Consecutive-day streak. Counts back from today (or yesterday, if today
 * has not yet been logged so an in-progress day doesn't break the chain).
 */
export const computeStreak = (logs: CompletionLog[]): number => {
  if (logs.length === 0) return 0
  const days = new Set(logs.map((l) => l.date))
  const today = localDateKey()
  let cursor = days.has(today) ? today : shiftDate(today, -1)
  if (!days.has(cursor)) return 0
  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = shiftDate(cursor, -1)
  }
  return streak
}

/** Days elapsed from the first log to today, using local calendar days. */
export const daysSinceFirstLog = (logs: CompletionLog[]): number => {
  if (logs.length === 0) return 0
  const first = new Date(Math.min(...logs.map((l) => l.completedAt)))
  const now = new Date()
  const start = new Date(first.getFullYear(), first.getMonth(), first.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000))
}

/** 4-week mesocycles: days 0-28 accumulation, 29-56 intensification, then realization. */
export const PHASE_BOUNDARIES = { accumulation: 28, intensification: 56 } as const

/**
 * Smart periodisation phase detection, based on days since the user's first
 * logged workout. A manual override (from Settings) always wins.
 */
export const computeCurrentPhase = (
  logs: CompletionLog[],
  override: WorkoutPhase | null = null,
): Exclude<WorkoutPhase, 'custom'> => {
  if (override && override !== 'custom') return override
  const days = daysSinceFirstLog(logs)
  if (days <= PHASE_BOUNDARIES.accumulation) return 'accumulation'
  if (days <= PHASE_BOUNDARIES.intensification) return 'intensification'
  return 'realization'
}

/** Formats seconds as MM:SS when >= 60, otherwise as plain seconds. */
export const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.ceil(totalSeconds))
  if (s < 60) return String(s)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export const formatDuration = (totalSeconds: number): string => {
  const m = Math.round(totalSeconds / 60)
  return m < 1 ? '<1 min' : `${m} min`
}

/** Estimated duration of one pass through the workout, in seconds. */
export const estimateWorkoutSeconds = (w: Workout): number =>
  w.blocks.reduce((acc, b) => {
    const work = b.mode === 'time' ? b.workSeconds : b.reps * 3
    return acc + b.sets * (work + b.restSeconds) - b.restSeconds
  }, 0)

export const totalSets = (w: Workout): number => w.blocks.reduce((a, b) => a + b.sets, 0)

export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/* Exercise library — building blocks mined from the stock programme    */
/* ------------------------------------------------------------------ */

/** A unique exercise pulled out of the stock workouts, with typical prescription. */
export interface LibraryExercise {
  name: string
  mode: BlockMode
  workSeconds: number
  reps: number
  restSeconds: number
  sets: number
  /** Equipment tracks that programme this exercise. */
  tracks: ProgramTrack[]
  /** Category + muscles from the knowledge base, lowercased, for search. */
  tags: string[]
  /** Number of stock blocks that use it — doubles as a popularity rank. */
  uses: number
}

/** Lowercase, alphanumerics only. "Pike Push-Ups" -> "pikepushups". */
export const collapse = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const median = (ns: number[]): number => {
  const sorted = [...ns].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

/** Seconds snap to the 5s grid the block steppers move on. */
const round5 = (n: number): number => Math.round(n / 5) * 5

const mostCommon = <T,>(xs: T[]): T => {
  const counts = new Map<T, number>()
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * Collapses every block of every workout into a de-duplicated exercise list.
 * Numeric defaults are medians across occurrences, so an exercise that is
 * programmed at 45s in accumulation and 20s in intensification lands on a
 * sane middle rather than whichever workout happened to be first.
 */
export const buildExerciseLibrary = (workouts: Workout[]): LibraryExercise[] => {
  interface Acc {
    name: string
    modes: BlockMode[]
    work: number[]
    reps: number[]
    rest: number[]
    sets: number[]
    tracks: Set<ProgramTrack>
    uses: number
  }
  const byKey = new Map<string, Acc>()

  for (const w of workouts) {
    for (const b of w.blocks) {
      const key = collapse(b.name)
      if (!key) continue
      let acc = byKey.get(key)
      if (!acc) {
        acc = { name: b.name, modes: [], work: [], reps: [], rest: [], sets: [], tracks: new Set(), uses: 0 }
        byKey.set(key, acc)
      }
      acc.modes.push(b.mode)
      if (b.workSeconds > 0) acc.work.push(b.workSeconds)
      if (b.reps > 0) acc.reps.push(b.reps)
      acc.rest.push(b.restSeconds)
      acc.sets.push(b.sets)
      if (w.program) acc.tracks.add(w.program)
      acc.uses += 1
    }
  }

  return [...byKey.values()]
    .map((acc) => {
      const info = getExerciseInfo(acc.name)
      return {
        name: acc.name,
        mode: mostCommon(acc.modes),
        workSeconds: acc.work.length ? Math.max(5, round5(median(acc.work))) : 30,
        reps: acc.reps.length ? median(acc.reps) : 10,
        restSeconds: round5(median(acc.rest)),
        sets: median(acc.sets),
        tracks: (['home', 'outdoors', 'gym'] as ProgramTrack[]).filter((t) => acc.tracks.has(t)),
        tags: info ? [info.category, ...info.muscles].map((t) => t.toLowerCase()) : [],
        uses: acc.uses,
      }
    })
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
}

/** Every unique exercise in the stock programme, most-programmed first. */
export const EXERCISE_LIBRARY: LibraryExercise[] = buildExerciseLibrary(STOCK_WORKOUTS)

/**
 * Ranks the library against a query. Tiers: name prefix, word prefix,
 * name substring, then tag (category / muscle) match. Unmatched are dropped.
 */
export const searchExerciseLibrary = (
  query: string,
  library: LibraryExercise[] = EXERCISE_LIBRARY,
): LibraryExercise[] => {
  const q = collapse(query)
  if (!q) return library

  const scored: { item: LibraryExercise; tier: number }[] = []
  for (const item of library) {
    const name = collapse(item.name)
    const words = item.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
    let tier: number | null = null

    if (name.startsWith(q)) tier = 0
    else if (words.some((w) => w.startsWith(q))) tier = 1
    else if (name.includes(q)) tier = 2
    else if (item.tags.some((t) => collapse(t).includes(q))) tier = 3
    else {
      // Multi-word queries: every token must land somewhere in name or tags.
      const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      const haystack = name + collapse(item.tags.join(' '))
      if (tokens.length > 1 && tokens.every((t) => haystack.includes(collapse(t)))) tier = 4
    }

    if (tier !== null) scored.push({ item, tier })
  }

  return scored
    .sort((a, b) => a.tier - b.tier || b.item.uses - a.item.uses || a.item.name.localeCompare(b.item.name))
    .map((s) => s.item)
}
