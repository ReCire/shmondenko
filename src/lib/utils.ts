import type { CompletionLog, Workout, WorkoutPhase } from '../data/types'

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
const daysSinceFirstLog = (logs: CompletionLog[]): number => {
  if (logs.length === 0) return 0
  const first = Math.min(...logs.map((l) => l.completedAt))
  const firstDate = new Date(first)
  const now = new Date()
  const msPerDay = 1000 * 60 * 60 * 24
  const start = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / msPerDay))
}

/**
 * Smart periodisation phase detection.
 * Based on days since the user's first logged workout.
 */
export const computeCurrentPhase = (logs: CompletionLog[]): WorkoutPhase => {
  const days = daysSinceFirstLog(logs)
  if (days <= 28) return 'accumulation'
  if (days <= 56) return 'intensification'
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
    const work = b.mode === 'time' ? b.workSeconds : b.reps * 5
    return acc + b.sets * (work + b.restSeconds) - b.restSeconds
  }, 0)

export const totalSets = (w: Workout): number => w.blocks.reduce((a, b) => a + b.sets, 0)

export const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ')
