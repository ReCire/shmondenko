import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CompletionLog, Workout } from '../data/types'
import { STOCK_WORKOUTS } from '../data/stockWorkouts'
import { localDateKey, uid } from '../lib/utils'

export type Screen =
  | { name: 'dashboard' }
  | { name: 'creator'; editId?: string }
  | { name: 'player'; workoutId: string }

interface AppState {
  screen: Screen
  customWorkouts: Workout[]
  logs: CompletionLog[]
  soundEnabled: boolean

  navigate: (screen: Screen) => void
  saveWorkout: (w: Omit<Workout, 'id' | 'isStock' | 'phase'> & { id?: string }) => Workout
  deleteWorkout: (id: string) => void
  logCompletion: (w: Workout, durationSeconds: number) => void
  toggleSound: () => void
  getWorkout: (id: string) => Workout | undefined
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: { name: 'dashboard' },
      customWorkouts: [],
      logs: [],
      soundEnabled: true,

      navigate: (screen) => set({ screen }),

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

      getWorkout: (id) =>
        STOCK_WORKOUTS.find((w) => w.id === id) ?? get().customWorkouts.find((w) => w.id === id),
    }),
    {
      name: 'shmondenko-fitness-v1',
      storage: createJSONStorage(() => localStorage),
      // The active screen is session state; never persist it.
      partialize: (s) => ({
        customWorkouts: s.customWorkouts,
        logs: s.logs,
        soundEnabled: s.soundEnabled,
      }),
    },
  ),
)

export const selectAllWorkouts = (s: AppState): Workout[] => [...STOCK_WORKOUTS, ...s.customWorkouts]
