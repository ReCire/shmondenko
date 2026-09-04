import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store/useAppStore'
import { Dashboard } from './components/Dashboard'
import { WorkoutCreator } from './components/WorkoutCreator'
import { WorkoutPreview } from './components/WorkoutPreview'
import { WorkoutPlayer } from './components/WorkoutPlayer'
import { Settings } from './components/Settings'
import { ExerciseDetail } from './components/ExerciseDetail'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Onboarding } from './components/Onboarding'

const screenTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
}

/** Applies `.theme-light` to <html> based on the stored preference and the OS setting. */
function useThemeClass() {
  const theme = useAppStore((s) => s.theme)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const light = theme === 'light' || (theme === 'system' && !media.matches)
      document.documentElement.classList.toggle('theme-light', light)
      // Keep the browser chrome / PWA title bar in step with the app background.
      document
        .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
        .forEach((m) => (m.content = light ? '#f4f1ea' : '#050505'))
    }
    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}

/** Applies `.type-large` to <html> for the opt-in readability scale. */
function useTypeScaleClass() {
  const largeType = useAppStore((s) => s.largeType)
  useEffect(() => {
    document.documentElement.classList.toggle('type-large', largeType)
  }, [largeType])
}

export default function App() {
  const screen = useAppStore((s) => s.screen)
  const getWorkout = useAppStore((s) => s.getWorkout)
  const navigate = useAppStore((s) => s.navigate)
  useThemeClass()
  useTypeScaleClass()

  const needsWorkout = screen.name === 'player' || screen.name === 'preview'
  const workout = needsWorkout ? getWorkout(screen.workoutId) : undefined

  // Guard against a stale route (e.g. workout was deleted).
  useEffect(() => {
    if (needsWorkout && !workout) navigate({ name: 'dashboard' })
  }, [needsWorkout, workout, navigate])

  return (
    <>
      <AnimatePresence mode="wait">
        {screen.name === 'dashboard' && (
          <motion.div key="dashboard" {...screenTransition}>
            <Dashboard />
          </motion.div>
        )}
        {screen.name === 'creator' && (
          <motion.div key={`creator-${screen.editId ?? 'new'}`} {...screenTransition}>
            <WorkoutCreator editId={screen.editId} />
          </motion.div>
        )}
        {screen.name === 'preview' && workout && (
          <motion.div key={`preview-${workout.id}`} {...screenTransition}>
            <WorkoutPreview workout={workout} />
          </motion.div>
        )}
        {screen.name === 'player' && workout && (
          <motion.div key={`player-${workout.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WorkoutPlayer workout={workout} />
          </motion.div>
        )}
        {screen.name === 'settings' && (
          <motion.div key="settings" {...screenTransition}>
            <Settings />
          </motion.div>
        )}
        {screen.name === 'exercise' && (
          <motion.div key={`exercise-${screen.exerciseName}`} {...screenTransition}>
            <ExerciseDetail exerciseName={screen.exerciseName} onBack={() => navigate(screen.returnTo)} />
          </motion.div>
        )}
      </AnimatePresence>
      <Onboarding />
      <ConfirmDialog />
    </>
  )
}
