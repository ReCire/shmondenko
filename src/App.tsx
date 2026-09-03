import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store/useAppStore'
import { Dashboard } from './components/Dashboard'
import { WorkoutCreator } from './components/WorkoutCreator'
import { WorkoutPlayer } from './components/WorkoutPlayer'

const screenTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
}

export default function App() {
  const screen = useAppStore((s) => s.screen)
  const getWorkout = useAppStore((s) => s.getWorkout)
  const navigate = useAppStore((s) => s.navigate)

  const workout = screen.name === 'player' ? getWorkout(screen.workoutId) : undefined

  // Guard against a stale player route (e.g. workout was deleted).
  useEffect(() => {
    if (screen.name === 'player' && !workout) navigate({ name: 'dashboard' })
  }, [screen, workout, navigate])

  return (
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
      {screen.name === 'player' && workout && (
        <motion.div key={`player-${workout.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <WorkoutPlayer workout={workout} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
