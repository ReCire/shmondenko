export type BlockMode = 'time' | 'reps'

export interface ExerciseBlock {
  id: string
  name: string
  mode: BlockMode
  /** Seconds of work. Used when mode === 'time'. */
  workSeconds: number
  /** Target reps. Used when mode === 'reps' (user taps to advance). */
  reps: number
  restSeconds: number
  sets: number
}

export type WorkoutPhase = 'accumulation' | 'intensification' | 'realization' | 'custom'

/**
 * Equipment availability track. Hierarchical:
 * home (bodyweight only) ⊂ outdoors (+ bars) ⊂ gym (+ weights).
 */
export type ProgramTrack = 'home' | 'outdoors' | 'gym'

export interface Workout {
  id: string
  name: string
  subtitle?: string
  focus?: string
  phase: WorkoutPhase
  /** Stock workouts belong to a track; custom workouts are track-agnostic. */
  program?: ProgramTrack
  blocks: ExerciseBlock[]
  loop: boolean
  isStock?: boolean
}

export interface CompletionLog {
  workoutId: string
  workoutName: string
  /** ISO date string (YYYY-MM-DD, local). */
  date: string
  completedAt: number
  durationSeconds: number
}
