import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CompletionLog, ProgramTrack, Workout, WorkoutPhase } from '../data/types'
import { STOCK_WORKOUTS } from '../data/stockWorkouts'
import { localDateKey, uid } from '../lib/utils'

export type Screen =
  | { name: 'dashboard' }
  | { name: 'creator'; editId?: string }
  | { name: 'preview'; workoutId: string }
  | { name: 'player'; workoutId: string }
  | { name: 'settings' }

interface AppState {
  screen: Screen
  activeProgram: ProgramTrack
  /** When set, replaces the date-derived periodisation phase. */
  manualPhaseOverride: WorkoutPhase | null
  customWorkouts: Workout[]
  logs: CompletionLog[]
  soundEnabled: boolean
  /** Seconds of "Get Ready" countdown before the first exercise. */
  prepTime: number

  navigate: (screen: Screen) => void
  setProgram: (program: ProgramTrack) => void
  setPhaseOverride: (phase: WorkoutPhase | null) => void
  saveWorkout: (w: Omit<Workout, 'id' | 'isStock' | 'phase'> & { id?: string }) => Workout
  deleteWorkout: (id: string) => void
  logCompletion: (w: Workout, durationSeconds: number) => void
  toggleSound: () => void
  setPrepTime: (seconds: number) => void
  /** Danger zone: wipes custom workouts and the completion history. */
  resetData: () => void
  getWorkout: (id: string) => Workout | undefined
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: { name: 'dashboard' },
      activeProgram: 'home',
      manualPhaseOverride: null,
      customWorkouts: [],
      logs: [],
      soundEnabled: true,
      prepTime: 3,

      navigate: (screen) => set({ screen }),

      setProgram: (activeProgram) => set({ activeProgram }),

      setPhaseOverride: (manualPhaseOverride) => set({ manualPhaseOverride }),

      saveWorkout: (input) => {
        const existing = input.id ? get().customWorkouts.find((w) => w.id === input.id) : undefined
        const workout: Workout = {
          ...existing,
          ...input,
          id: existing?.id ?? uid(),
          phase: 'custom',
          isStock: false,
        }
        set((s) => ({
          customWorkouts: existing
            ? s.customWorkouts.map((w) => (w.id === workout.id ? workout : w))
            : [workout, ...s.customWorkouts],
        }))
        return workout
      },

      deleteWorkout: (id) =>
        set((s) => ({ customWorkouts: s.customWorkouts.filter((w) => w.id !== id) })),

      logCompletion: (w, durationSeconds) =>
        set((s) => ({
          logs: [
            {
              workoutId: w.id,
              workoutName: w.name,
              date: localDateKey(),
              completedAt: Date.now(),
              durationSeconds,
            },
            ...s.logs,
          ].slice(0, 500),
        })),

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      setPrepTime: (prepTime) => set({ prepTime: Math.max(0, Math.round(prepTime)) }),

      resetData: () => set({ customWorkouts: [], logs: [], manualPhaseOverride: null }),

      getWorkout: (id) =>
        STOCK_WORKOUTS.find((w) => w.id === id) ?? get().customWorkouts.find((w) => w.id === id),
    }),
    {
      name: 'shmondenko-periodisation-v1',
      storage: createJSONStorage(() => localStorage),
      // The active screen is session state; never persist it.
      partialize: (s) => ({
        activeProgram: s.activeProgram,
        manualPhaseOverride: s.manualPhaseOverride,
        customWorkouts: s.customWorkouts,
        logs: s.logs,
        soundEnabled: s.soundEnabled,
        prepTime: s.prepTime,
      }),
    },
  ),
)

export const selectAllWorkouts = (s: AppState): Workout[] => [...STOCK_WORKOUTS, ...s.customWorkouts]
