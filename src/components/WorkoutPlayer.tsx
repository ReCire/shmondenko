import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useTransform } from 'framer-motion'
import { Check, ChevronsLeft, ChevronsRight, Pause, Play, Square, X } from 'lucide-react'
import type { Workout } from '../data/types'
import { findNextWorkStep, isPrepStep, useWorkoutTimer, type TimerStep, type WorkoutTimer } from '../hooks/useWorkoutTimer'
import { useAppStore } from '../store/useAppStore'
import { cn, formatClock, totalSets } from '../lib/utils'
import { getExerciseInfo, type ExerciseInfo } from '../data/exercises'
import { ExerciseDetail } from './ExerciseDetail'

/* ---------- Theme ---------- */

interface Theme {
  /** Unfilled background. */
  base: string
  /** Bottom -> top gradient of the fill. */
  gradient: string
  /** Colour used for the step-change flash. */
  flash: string
}

const THEMES: Record<'work' | 'rest' | 'idle' | 'finished', Theme> = {
  work: {
    base: '#0b0407',
    gradient: 'linear-gradient(to top, #b40f28 0%, #e11a2b 55%, #ff5a1f 100%)',
    flash: '#ff5a1f',
  },
  rest: {
    base: '#0d1218',
    gradient: 'linear-gradient(to top, #5b6e86 0%, #8ea3bd 55%, #c9d8e8 100%)',
    flash: '#c9d8e8',
  },
  idle: { base: '#050505', gradient: 'linear-gradient(to top, #1a1a1a, #2a2a2a)', flash: '#050505' },
  finished: {
    base: '#050505',
    gradient: 'linear-gradient(to top, #b40f28 0%, #e11a2b 55%, #ff5a1f 100%)',
    flash: '#ff5a1f',
  },
}

/* ---------- Player ---------- */

interface Props {
  workout: Workout
}

export function WorkoutPlayer({ workout }: Props) {
  const navigate = useAppStore((s) => s.navigate)
  const soundEnabled = useAppStore((s) => s.soundEnabled)
  const logCompletion = useAppStore((s) => s.logCompletion)
  const prepTime = useAppStore((s) => s.prepTime)
  const requestConfirm = useAppStore((s) => s.requestConfirm)

  const timer = useWorkoutTimer(workout, {
    soundEnabled,
    prepTime,
    onComplete: (secs) => logCompletion(workout, secs),
  })

  const [detailRequest, setDetailRequest] = useState<{ name: string; openedAt: number } | null>(null)

  // The detail overlay is only valid for the step it was opened on. If the timer
  // advances, the overlay unmounts without pausing, resetting, or touching the
  // workout state machine.
  const detailExercise = detailRequest?.openedAt === timer.stepIndex ? detailRequest.name : null
  const openDetail = useCallback(
    (name: string) => setDetailRequest({ name, openedAt: timer.stepIndex }),
    [timer.stepIndex],
  )
  const closeDetail = useCallback(() => setDetailRequest(null), [])

  // Auto-start: the Preview's BEGIN SESSION tap already unlocked audio, so the
  // session (and its "Get Ready" fill) begins the moment this screen mounts.
  const { status, start } = timer
  useEffect(() => {
    if (status === 'idle') start()
  }, [status, start])

  const themeKey = timer.status === 'idle' ? 'idle' : timer.status === 'finished' ? 'finished' : timer.step?.kind ?? 'work'
  const theme = THEMES[themeKey]

  // Fill window slides up; content counter-slides so it appears stationary.
  const windowY = useTransform(timer.progress, (p) => `${(1 - p) * 100}%`)
  const contentY = useTransform(timer.progress, (p) => `${-(1 - p) * 100}%`)

  // Keyboard shortcuts (desktop testing convenience).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        if (timer.status === 'running') timer.pause()
        else if (timer.status === 'paused') timer.resume()
      } else if (e.key === 'ArrowRight') timer.skip()
      else if (e.key === 'ArrowLeft') timer.back()
      else if (e.key === 'Enter') timer.completeReps()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [timer])

  const exit = () => {
    const isPrep = isPrepStep(timer.step)
    // Free exit if the timer hasn't started, is finished, or is still in the "Get Ready" countdown.
    if ((timer.status !== 'running' && timer.status !== 'paused') || isPrep) {
      navigate({ name: 'dashboard' })
      return
    }
    
    // The dialog is async: hold the clock while it's open, release it on cancel.
    const wasRunning = timer.status === 'running'
    if (wasRunning) timer.pause()
    requestConfirm(
      'Abandon session?',
      'Progress will be discarded and this session will not count toward your streak.',
      () => navigate({ name: 'dashboard' }),
      () => {
        if (wasRunning) timer.resume()
      },
    )
  }

  return (
    <div className="fixed inset-0">
      <motion.div
        className="theme-dark fixed inset-0 overflow-hidden select-none"
        animate={{ backgroundColor: theme.base }}
        transition={{ duration: 0.6 }}
      >
        {/* Layer A — unfilled: light type on dark */}
        <Scene timer={timer} workout={workout} variant="dark" onExit={exit} onViewTechnique={openDetail} />

        {/* Layer B — fill: gradient with ink type, revealed bottom-to-top */}
        <motion.div
          aria-hidden
          style={{ y: windowY, willChange: 'transform' }}
          className="absolute inset-0 overflow-hidden"
        >
          <motion.div
            style={{ y: contentY, background: theme.gradient, willChange: 'transform' }}
            className="absolute inset-0"
          >
            <Scene timer={timer} workout={workout} variant="light" onExit={exit} onViewTechnique={openDetail} />
          </motion.div>
        </motion.div>

        {/* Step-change flash */}
        <AnimatePresence>
          {timer.status === 'running' && (
            <motion.div
              key={`${timer.round}-${timer.stepIndex}`}
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              style={{ backgroundColor: theme.flash }}
              className="pointer-events-none absolute inset-0"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Exercise detail overlay — keeps the timer running while reading. */}
      <AnimatePresence>
        {detailExercise && (
          <motion.div
            key="exercise-detail"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="theme-dark fixed inset-0 z-50 overflow-y-auto"
          >
            <ExerciseDetail exerciseName={detailExercise} onBack={closeDetail} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------- Scene (rendered twice) ---------- */

interface SceneProps {
  timer: WorkoutTimer
  workout: Workout
  variant: 'dark' | 'light'
  onExit: () => void
  onViewTechnique: (name: string) => void
}

function Scene({ timer, workout, variant, onExit, onViewTechnique }: SceneProps) {
  const fg = variant === 'dark' ? 'text-paper' : 'text-ink'
  const muted = variant === 'dark' ? 'text-paper/70' : 'text-ink/70'
  const btn = variant === 'dark' ? 'border-paper/25 active:bg-paper/10' : 'border-ink/30 active:bg-ink/10'

  return (
    <div className={cn('absolute inset-0 flex flex-col safe-pt safe-pb', fg)}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4">
        <button
          type="button"
          onClick={onExit}
          aria-label="Exit"
          className="flex h-11 w-11 items-center justify-center active:opacity-60"
        >
          <X size={22} />
        </button>
        <div className="text-center">
          <p className={cn('font-mono font-semibold text-[10px] uppercase tracking-[0.25em]', muted)}>{workout.name}</p>
          {workout.loop && timer.status !== 'idle' && (
            <p className={cn('font-mono font-semibold text-[10px] tracking-[0.2em]', muted)}>ROUND {timer.round}</p>
          )}
        </div>
        <div className="w-11" />
      </div>

      {(timer.status === 'running' || timer.status === 'paused') && timer.step && (
        <ActiveScene
          timer={timer}
          step={timer.step}
          workout={workout}
          muted={muted}
          btn={btn}
          variant={variant}
          onExit={onExit}
          onViewTechnique={onViewTechnique}
        />
      )}
      {timer.status === 'finished' && <FinishedScene timer={timer} workout={workout} muted={muted} variant={variant} />}
    </div>
  )
}

/* ---------- Active ---------- */

function ActiveScene({
  timer,
  step,
  workout,
  muted,
  btn,
  variant,
  onExit,
  onViewTechnique,
}: {
  timer: WorkoutTimer
  step: TimerStep
  workout: Workout
  muted: string
  btn: string
  variant: 'dark' | 'light'
  onExit: () => void
  onViewTechnique: (name: string) => void
}) {
  const isPrep = isPrepStep(step)
  const isRest = step.kind === 'rest'
  const isReps = step.mode === 'reps'
  const paused = timer.status === 'paused'
  const next = timer.nextStep
  const prepTime = useAppStore((s) => s.prepTime)
  const nextWorkStep = useMemo(
    () => findNextWorkStep(workout, prepTime, timer.stepIndex),
    [workout, prepTime, timer.stepIndex],
  )
  const nextInfo = nextWorkStep ? getExerciseInfo(nextWorkStep.exerciseName) : null

  const nextLabel = useMemo(() => {
    if (!next) return 'FINISH'
    if (next.kind === 'rest') return 'REST'
    return next.exerciseName.toUpperCase()
  }, [next])

  const headline = isPrep ? 'Get Ready' : isRest ? 'Rest' : step.exerciseName
  const setLine = isPrep
    ? 'INITIALIZING'
    : isRest && nextWorkStep
      ? `SET ${nextWorkStep.setIndex + 1} OF ${nextWorkStep.totalSets} · ${nextWorkStep.totalSets - nextWorkStep.setIndex} LEFT`
      : `SET ${step.setIndex + 1} OF ${step.totalSets} · ${timer.setsRemaining} LEFT`

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.p
          key={`${step.kind}-${timer.stepIndex}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('font-mono text-xs tracking-[0.4em]', muted)}
        >
          {isPrep ? `PREPARE · ${nextLabel}` : isRest ? `UP NEXT · ${nextLabel}` : isReps ? `${step.reps} REPS` : 'WORK'}
        </motion.p>

        <motion.h1
          key={`h-${timer.stepIndex}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 max-w-[92vw] text-[clamp(2.25rem,9vw,4rem)] font-black uppercase leading-[0.95] tracking-tighter text-balance"
        >
          {headline}
        </motion.h1>

        <div className="relative mt-4 flex items-center justify-center">
          <span
            className={cn(
              'block text-[clamp(7rem,32vw,13rem)] font-black leading-none tabular tracking-tighter',
              paused && 'opacity-40',
            )}
          >
            {formatClock(timer.remaining)}
          </span>
          {paused && (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm tracking-[0.5em]">
              PAUSED
            </span>
          )}
        </div>

        <div className={cn('mt-4 flex flex-col items-center gap-1 font-mono text-xs tracking-[0.3em]', muted)}>
          <span>{setLine}</span>
          {!isRest && <span>NEXT · {nextLabel}</span>}
        </div>

        {isReps && !isRest && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={timer.completeReps}
            className={cn(
              'mt-8 flex items-center gap-3 px-8 py-4 text-base font-black uppercase tracking-[0.25em]',
              variant === 'dark' ? 'bg-paper text-ink' : 'bg-ink text-paper',
            )}
          >
            <Check size={18} strokeWidth={3} /> Set Done
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {isRest && !isPrep && nextWorkStep && (
            <RecoveryCard
              key={nextWorkStep.exerciseName}
              exerciseName={nextWorkStep.exerciseName}
              info={nextInfo}
              duration={step.duration}
              remaining={timer.remaining}
              onViewTechnique={() => onViewTechnique(nextWorkStep.exerciseName)}
              variant={variant}
              muted={muted}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="relative flex items-center justify-center gap-4 px-6 pb-2">
        <ControlButton onClick={timer.back} label="Previous" className={btn}>
          <ChevronsLeft size={22} />
        </ControlButton>
        <ControlButton
          onClick={paused ? timer.resume : timer.pause}
          label={paused ? 'Resume' : 'Pause'}
          className={cn('h-18 w-18', variant === 'dark' ? 'bg-paper text-ink' : 'bg-ink text-paper')}
        >
          {paused ? <Play size={26} fill="currentColor" /> : <Pause size={26} fill="currentColor" />}
        </ControlButton>
        <ControlButton onClick={timer.skip} label="Skip" className={btn}>
          <ChevronsRight size={22} />
        </ControlButton>
        <ControlButton onClick={onExit} label="Abandon workout" className={cn(btn, 'absolute right-6')}>
          <Square size={16} fill="currentColor" />
        </ControlButton>
      </div>
    </>
  )
}

function ControlButton({
  onClick,
  label,
  className,
  children,
}: {
  onClick: () => void
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
      className={cn('flex h-14 w-14 items-center justify-center border', className)}
    >
      {children}
    </motion.button>
  )
}

/* ---------- Recovery Card ---------- */

function RecoveryCard({
  exerciseName,
  info,
  duration,
  remaining,
  onViewTechnique,
  variant,
  muted,
}: {
  exerciseName: string
  info: ExerciseInfo | null
  duration: number
  remaining: number
  onViewTechnique: () => void
  variant: 'dark' | 'light'
  muted: string
}) {
  const fg = variant === 'dark' ? 'text-paper' : 'text-ink'

  const sections = useMemo(() => {
    if (!info) return []
    const out: { title: string; items: string[] }[] = []
    if (info.setup.length > 0) out.push({ title: 'SETUP', items: info.setup })
    if (info.execution.length > 0) out.push({ title: 'EXECUTION', items: info.execution })
    if (info.commonMistakes.length > 0) out.push({ title: 'COMMON ERRORS', items: info.commonMistakes })
    if (info.safety && info.safety.length > 0) out.push({ title: 'SAFETY', items: info.safety })
    return out
  }, [info])

  const sectionDuration = sections.length ? duration / sections.length : 0
  const elapsed = duration - remaining
  const sectionIndex = sections.length
    ? Math.min(sections.length - 1, Math.floor(elapsed / sectionDuration))
    : 0
  const section = sections[sectionIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'mt-6 w-full max-w-sm border p-4',
        variant === 'dark'
          ? 'border-paper/20 bg-ink/70 backdrop-blur-sm'
          : 'border-ink/25 bg-paper/80 backdrop-blur-sm',
      )}
    >
      <p className={cn('font-mono font-semibold text-[10px] tracking-[0.25em]', muted)}>NEXT MOVEMENT</p>
      <h3 className={cn('mt-1 text-2xl font-black uppercase leading-none tracking-tight', fg)}>{exerciseName}</h3>
      {info ? (
        <>
          <p className={cn('mt-1 font-mono font-semibold text-[10px] tracking-[0.2em]', muted)}>
            {info.muscles.slice(0, 3).join(' · ')} {info.category && `· ${info.category.toUpperCase()}`}
          </p>
          {section && (
            <div className={cn('mt-4 border-t pt-3', variant === 'dark' ? 'border-paper/15' : 'border-ink/15')}>
              <p className={cn('font-mono font-semibold text-[10px] tracking-[0.25em]', muted)}>TECHNICAL BRIEFING</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h4 className={cn('mt-1 font-mono font-semibold text-[11px] tracking-[0.25em]', fg)}>{section.title}</h4>
                  <div className="mt-2 flex justify-center gap-1.5">
                    {sections.map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full bg-current',
                          fg,
                          i === sectionIndex ? 'opacity-100' : 'opacity-30',
                        )}
                      />
                    ))}
                  </div>
                  <ol className="mt-2 space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-left">
                        <span className={cn('w-5 shrink-0 font-mono font-semibold text-[10px] tabular', muted)}>{String(i + 1).padStart(2, '0')}</span>
                        <span className={cn('text-sm font-medium leading-snug', fg)}>{item}</span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </>
      ) : (
        <p className={cn('mt-2 text-xs', muted)}>Detailed instructions unavailable.</p>
      )}
      <button
        type="button"
        onClick={onViewTechnique}
        aria-label={`View full technique for ${exerciseName}`}
        className={cn(
          'mt-4 w-full py-3 font-mono font-semibold text-[10px] uppercase tracking-[0.22em] transition-colors border',
          variant === 'dark'
            ? 'border-paper/25 text-paper hover:bg-paper/10'
            : 'border-ink/30 text-ink hover:bg-ink/10',
        )}
      >
        View Technique
      </button>
    </motion.div>
  )
}

/* ---------- Finished ---------- */

function FinishedScene({
  timer,
  workout,
  muted,
  variant,
}: {
  timer: WorkoutTimer
  workout: Workout
  muted: string
  variant: 'dark' | 'light'
}) {
  const navigate = useAppStore((s) => s.navigate)
  const logs = useAppStore((s) => s.logs)
  const m = Math.floor(timer.totalElapsedSeconds / 60)
  const s = timer.totalElapsedSeconds % 60

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn('font-mono text-xs tracking-[0.4em]', muted)}
        >
          SESSION COMPLETE
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-3 text-7xl font-black uppercase leading-[0.9] tracking-tighter"
        >
          Done<span className={variant === 'dark' ? 'text-soviet' : ''}>.</span>
        </motion.h1>
        <p className="mt-8 text-5xl font-black tabular tracking-tighter">
          {m}:{String(s).padStart(2, '0')}
        </p>
        <p className={cn('mt-2 font-mono text-xs tracking-[0.3em]', muted)}>
          {workout.name} · {totalSets(workout)} SETS{workout.loop ? ` · ${timer.round} ROUNDS` : ''}
        </p>
        <p className={cn('mt-10 font-mono text-xs tracking-[0.3em]', muted)}>{logs.length} TOTAL SESSIONS LOGGED</p>
      </div>
      <div className="px-8 pb-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate({ name: 'dashboard' })}
          className={cn(
            'w-full py-6 text-xl font-black uppercase tracking-[0.25em]',
            variant === 'dark' ? 'bg-paper text-ink' : 'bg-ink text-paper',
          )}
        >
          Back to Dashboard
        </motion.button>
      </div>
    </>
  )
}
