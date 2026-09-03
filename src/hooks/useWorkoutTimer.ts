import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMotionValue, type MotionValue } from 'framer-motion'
import type { BlockMode, Workout } from '../data/types'
import { cueComplete, cueCountdown, cueWorkEnd, cueWorkStart, unlockAudio } from '../lib/audio'

export type StepKind = 'work' | 'rest'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

/** `blockIndex` of the synthetic "Get Ready" step that precedes the first exercise. */
export const PREP_BLOCK_INDEX = -1

export const isPrepStep = (step: TimerStep | null): boolean => step?.blockIndex === PREP_BLOCK_INDEX

export interface TimerStep {
  kind: StepKind
  /** Index into `workout.blocks`, or PREP_BLOCK_INDEX for the prep countdown. */
  blockIndex: number
  /** 0-based set index within the block. */
  setIndex: number
  exerciseName: string
  mode: BlockMode
  /** Seconds. 0 for open-ended rep-based work steps. */
  duration: number
  reps: number
  totalSets: number
}

export interface WorkoutTimer {
  status: TimerStatus
  step: TimerStep | null
  nextStep: TimerStep | null
  /** Whole seconds remaining in the current step (counts UP for rep steps). */
  remaining: number
  /** 0..1 fill for the current step. Motion value — no React re-renders. */
  progress: MotionValue<number>
  stepIndex: number
  totalSteps: number
  /** 1-based loop pass (only grows for `loop: true` workouts). */
  round: number
  /** Sets left in the current block, including the current one. */
  setsRemaining: number
  totalElapsedSeconds: number
  start: () => void
  pause: () => void
  resume: () => void
  skip: () => void
  back: () => void
  /** For rep-based work: user signals set is done. */
  completeReps: () => void
  finish: () => void
}

interface Options {
  soundEnabled?: boolean
  /** Seconds of "Get Ready" countdown before the first exercise. 0 disables it. */
  prepTime?: number
  onComplete?: (totalElapsedSeconds: number) => void
}

/** Flatten a workout into an ordered list of work/rest steps. */
export const buildSteps = (workout: Workout, prepTime = 0): TimerStep[] => {
  const steps: TimerStep[] = []
  workout.blocks.forEach((b, blockIndex) => {
    for (let setIndex = 0; setIndex < b.sets; setIndex++) {
      steps.push({
        kind: 'work',
        blockIndex,
        setIndex,
        exerciseName: b.name,
        mode: b.mode,
        duration: b.mode === 'time' ? b.workSeconds : 0,
        reps: b.reps,
        totalSets: b.sets,
      })
      const isLastOfWorkout = blockIndex === workout.blocks.length - 1 && setIndex === b.sets - 1
      // No trailing rest after the final set unless the workout loops.
      if (b.restSeconds > 0 && (!isLastOfWorkout || workout.loop)) {
        steps.push({
          kind: 'rest',
          blockIndex,
          setIndex,
          exerciseName: b.name,
          mode: 'time',
          duration: b.restSeconds,
          reps: 0,
          totalSets: b.sets,
        })
      }
    }
  })
  if (prepTime > 0 && steps.length > 0) {
    steps.unshift({
      kind: 'rest',
      blockIndex: PREP_BLOCK_INDEX,
      setIndex: -1,
      exerciseName: 'Get Ready',
      mode: 'time',
      duration: prepTime,
      reps: 0,
      totalSets: 0,
    })
  }
  return steps
}

export function useWorkoutTimer(
  workout: Workout,
  { soundEnabled = true, prepTime = 3, onComplete }: Options = {},
): WorkoutTimer {
  const steps = useMemo(() => buildSteps(workout, prepTime), [workout, prepTime])
  // Where a loop restarts: after the prep step, if there is one.
  const loopStartIndex = isPrepStep(steps[0] ?? null) ? 1 : 0

  const [status, setStatus] = useState<TimerStatus>('idle')
  const [stepIndex, setStepIndex] = useState(0)
  const [round, setRound] = useState(1)
  const [remaining, setRemaining] = useState(steps[0]?.duration ?? 0)
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0)
  const progress = useMotionValue(0)

  // Mutable timing state lives in refs so the rAF loop never goes stale.
  const stepStartRef = useRef(0) // performance.now() when current step began
  const pausedAtRef = useRef(0)
  const workoutStartRef = useRef(0)
  const pausedTotalRef = useRef(0)
  const lastCueSecondRef = useRef<number>(-1)
  const rafRef = useRef<number>(0)
  const completedRef = useRef(false)
  const stepIndexRef = useRef(0)
  const statusRef = useRef<TimerStatus>('idle')
  const soundRef = useRef(soundEnabled)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    soundRef.current = soundEnabled
    onCompleteRef.current = onComplete
  }, [soundEnabled, onComplete])

  const step = steps[stepIndex] ?? null
  const nextStep = steps[stepIndex + 1] ?? (workout.loop ? steps[loopStartIndex] ?? null : null)

  const setsRemaining = step && !isPrepStep(step) ? step.totalSets - step.setIndex : 0

  const cue = useCallback((fn: () => void) => {
    if (soundRef.current) fn()
  }, [])

  const finishWorkout = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    cancelAnimationFrame(rafRef.current)
    const now = performance.now()
    const elapsed = Math.round((now - workoutStartRef.current - pausedTotalRef.current) / 1000)
    setTotalElapsedSeconds(elapsed)
    progress.set(1)
    statusRef.current = 'finished'
    setStatus('finished')
    cue(cueComplete)
    onCompleteRef.current?.(elapsed)
  }, [cue, progress])

  /** Move to step `idx`, starting its clock at `startAt` (ms, performance.now scale). */
  const goToStep = useCallback(
    (idx: number, startAt: number, { announce = true } = {}) => {
      if (idx >= steps.length) {
        if (workout.loop) {
          idx = loopStartIndex
          setRound((r) => r + 1)
        } else {
          finishWorkout()
          return
        }
      }
      if (idx < 0) idx = 0
      const target = steps[idx]
      stepIndexRef.current = idx
      stepStartRef.current = startAt
      lastCueSecondRef.current = -1
      progress.set(target.mode === 'reps' ? 1 : 0)
      setStepIndex(idx)
      setRemaining(target.duration)
      // The prep countdown starts silently; its 3-2-1 ticks lead into the first work cue.
      if (announce && !isPrepStep(target)) cue(target.kind === 'work' ? cueWorkStart : cueWorkEnd)
    },
    [steps, workout.loop, loopStartIndex, finishWorkout, progress, cue],
  )

  // Main clock. Runs only while `status === 'running'`.
  useEffect(() => {
    if (status !== 'running') return
    let lastSecond = -1

    const tick = () => {
      const now = performance.now()
      const current = steps[stepIndexRef.current]
      if (!current) return
      const elapsed = (now - stepStartRef.current) / 1000

      if (current.mode === 'reps') {
        // Open-ended set: count up, keep screen fully "lit".
        const sec = Math.floor(elapsed)
        if (sec !== lastSecond) {
          lastSecond = sec
          setRemaining(sec)
        }
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const left = current.duration - elapsed
      progress.set(Math.min(1, Math.max(0, elapsed / current.duration)))

      if (left <= 0) {
        // Carry the overshoot into the next step so drift never accumulates.
        lastSecond = -1
        goToStep(stepIndexRef.current + 1, stepStartRef.current + current.duration * 1000)
        if (statusRef.current === 'running') rafRef.current = requestAnimationFrame(tick)
        return
      }

      const sec = Math.ceil(left)
      if (sec !== lastSecond) {
        lastSecond = sec
        setRemaining(sec)
        if (sec <= 3 && sec >= 1 && lastCueSecondRef.current !== sec) {
          lastCueSecondRef.current = sec
          cue(cueCountdown)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [status, steps, goToStep, progress, cue])

  // Keep the screen awake while a workout runs.
  useEffect(() => {
    if (status !== 'running' || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    navigator.wakeLock
      .request('screen')
      .then((s) => (sentinel = s))
      .catch(() => {})
    return () => {
      sentinel?.release().catch(() => {})
    }
  }, [status])

  const start = useCallback(() => {
    if (steps.length === 0) return
    void unlockAudio()
    const now = performance.now()
    workoutStartRef.current = now
    pausedTotalRef.current = 0
    completedRef.current = false
    setRound(1)
    goToStep(0, now)
    statusRef.current = 'running'
    setStatus('running')
  }, [steps.length, goToStep])

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return
    pausedAtRef.current = performance.now()
    statusRef.current = 'paused'
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return
    const pausedFor = performance.now() - pausedAtRef.current
    stepStartRef.current += pausedFor
    pausedTotalRef.current += pausedFor
    statusRef.current = 'running'
    setStatus('running')
  }, [])

  const skip = useCallback(() => {
    if (statusRef.current === 'idle' || statusRef.current === 'finished') return
    goToStep(stepIndexRef.current + 1, performance.now(), { announce: false })
  }, [goToStep])

  const back = useCallback(() => {
    if (statusRef.current === 'idle' || statusRef.current === 'finished') return
    goToStep(Math.max(0, stepIndexRef.current - 1), performance.now(), { announce: false })
  }, [goToStep])

  const completeReps = useCallback(() => {
    const current = steps[stepIndexRef.current]
    if (!current || current.mode !== 'reps' || statusRef.current !== 'running') return
    goToStep(stepIndexRef.current + 1, performance.now())
  }, [steps, goToStep])

  const finish = useCallback(() => {
    if (statusRef.current === 'idle') return
    if (statusRef.current === 'paused') pausedTotalRef.current += performance.now() - pausedAtRef.current
    finishWorkout()
  }, [finishWorkout])

  return {
    status,
    step,
    nextStep,
    remaining,
    progress,
    stepIndex,
    totalSteps: steps.length,
    round,
    setsRemaining,
    totalElapsedSeconds,
    start,
    pause,
    resume,
    skip,
    back,
    completeReps,
    finish,
  }
}
