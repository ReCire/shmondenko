import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight, Pencil, Play, Repeat } from 'lucide-react'
import type { Workout } from '../data/types'
import { PROGRAM_TRACKS } from '../data/stockWorkouts'
import { useAppStore } from '../store/useAppStore'
import { unlockAudio } from '../lib/audio'
import { cn, estimateWorkoutSeconds, formatDuration, totalSets } from '../lib/utils'

const PHASE_LABEL: Record<Workout['phase'], string> = {
  accumulation: 'Block I · Accumulation',
  intensification: 'Block II · Intensification',
  realization: 'Block III · Realization',
  custom: 'Custom Session',
}

const PHASE_ACCENT: Record<Workout['phase'], string> = {
  accumulation: 'bg-slate-cool',
  intensification: 'bg-soviet',
  realization: 'bg-ember',
  custom: 'bg-paper',
}

const list = { animate: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }
const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
}

interface Props {
  workout: Workout
}

export function WorkoutPreview({ workout }: Props) {
  const navigate = useAppStore((s) => s.navigate)
  const track = PROGRAM_TRACKS.find((t) => t.key === workout.program)
  const seconds = estimateWorkoutSeconds(workout)
  const sets = totalSets(workout)
  const workSeconds = workout.blocks.reduce(
    (acc, b) => acc + b.sets * (b.mode === 'time' ? b.workSeconds : b.reps * 3),
    0,
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col safe-pt">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pb-2">
        <button
          type="button"
          onClick={() => navigate({ name: 'dashboard' })}
          aria-label="Back to dashboard"
          className="flex h-11 w-11 items-center justify-center text-paper/70 active:bg-paper/10"
        >
          <ArrowLeft size={22} />
        </button>
        <p className="font-mono font-semibold text-label tracking-[0.25em] text-paper/70">SESSION BRIEF</p>
        {workout.isStock ? (
          <div className="w-11" />
        ) : (
          <button
            type="button"
            onClick={() => navigate({ name: 'creator', editId: workout.id })}
            aria-label="Edit workout"
            className="flex h-11 w-11 items-center justify-center text-paper/70 active:bg-paper/10"
          >
            <Pencil size={18} />
          </button>
        )}
      </header>

      <motion.main variants={list} initial="initial" animate="animate" className="flex flex-1 flex-col px-6 pb-44">
        {/* Title block */}
        <motion.section variants={item} className="relative border-l-[6px] pl-5">
          <span className={cn('absolute -left-[6px] inset-y-0 w-[6px]', PHASE_ACCENT[workout.phase])} />
          <p className="font-mono font-semibold text-caption tracking-[0.22em] text-paper/70">{PHASE_LABEL[workout.phase].toUpperCase()}</p>
          <h1 className="mt-2 text-[clamp(2rem,9.5vw,3.5rem)] font-black uppercase leading-[0.9] tracking-tighter text-balance">
            {workout.name}
          </h1>
          {workout.focus && <p className="mt-3 text-lg text-paper/60">{workout.focus}</p>}
        </motion.section>

        {/* Meta strip */}
        <motion.section variants={item} className="mt-8 grid grid-cols-3 border border-paper/15">
          <Stat label="TRACK" value={track ? track.label.toUpperCase() : 'ANY'} />
          <Stat label="SETS" value={String(sets)} className="border-l border-paper/15" />
          <Stat label="EST. TIME" value={formatDuration(seconds).toUpperCase()} className="border-l border-paper/15" />
        </motion.section>

        {/* Block list */}
        <motion.section variants={item} className="mt-8">
          <div className="flex items-baseline justify-between border-b border-paper/15 pb-2">
            <h2 className="font-mono font-semibold text-caption tracking-[0.22em] text-paper/70">PROTOCOL</h2>
            <span className="font-mono font-semibold text-label tracking-[0.2em] text-paper/60">
              {workout.blocks.length} EXERCISES · {formatDuration(workSeconds).toUpperCase()} UNDER LOAD
            </span>
          </div>
          <ol className="divide-y divide-paper/15">
            {workout.blocks.map((b, i) => (
              <motion.li key={b.id} variants={item} className="flex items-stretch gap-4 py-4">
                <span className="w-8 shrink-0 pt-1 font-mono text-xs tabular text-paper/60">{String(i + 1).padStart(2, '0')}</span>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        name: 'exercise',
                        exerciseName: b.name,
                        returnTo: { name: 'preview', workoutId: workout.id },
                      })
                    }
                    aria-label={`Open technique for ${b.name}`}
                    className="group flex w-full items-center gap-1 text-left transition-colors hover:text-paper/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-paper/50"
                  >
                    <span className="text-2xl font-bold uppercase leading-none tracking-tight">{b.name}</span>
                    <ChevronRight size={18} className="text-paper/60 transition-transform group-active:translate-x-1" />
                  </button>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono font-semibold text-caption tabular text-paper/65">
                    <span>
                      <span className="text-paper">{b.sets}</span> SETS
                    </span>
                    <span>
                      <span className="text-paper">{b.mode === 'time' ? `${b.workSeconds}s` : `${b.reps}×`}</span>{' '}
                      {b.mode === 'time' ? 'WORK' : 'REPS'}
                    </span>
                    <span>
                      <span className="text-paper">{b.restSeconds}s</span> REST
                    </span>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.section>

        {workout.loop && (
          <motion.p variants={item} className="mt-6 inline-flex items-center gap-2 font-mono font-semibold text-caption tracking-[0.2em] text-paper/60">
            <Repeat size={12} /> LOOPS UNTIL YOU STOP IT
          </motion.p>
        )}
      </motion.main>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-lg bg-gradient-to-t from-ink via-ink/95 to-transparent px-6 pt-10 safe-pb">
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          whileTap={{ scale: 0.985 }}
          onClick={async () => {
            // The player auto-starts, so this tap is the user gesture that
            // unlocks Web Audio. Give resume() a brief moment to settle, then
            // navigate so the gesture has already been consumed in the unlock call.
            await Promise.race([unlockAudio(), new Promise<void>((resolve) => setTimeout(resolve, 500))]).catch(() => {})
            navigate({ name: 'player', workoutId: workout.id })
          }}
          className="flex w-full items-center justify-center gap-3 bg-soviet py-6 text-xl font-black uppercase tracking-[0.25em] text-[#f4f1ea] shadow-[0_16px_48px_-12px_rgba(200,16,46,0.8)]"
        >
          <Play size={20} fill="currentColor" /> Begin Session
        </motion.button>
      </div>
    </div>
  )
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 p-4', className)}>
      <span className="font-mono font-semibold text-label tracking-[0.2em] text-paper/70">{label}</span>
      <span className="truncate text-xl font-black tabular tracking-tight">{value}</span>
    </div>
  )
}
