import { motion } from 'framer-motion'
import { ChevronRight, Pencil, Repeat, Trash2 } from 'lucide-react'
import type { Workout } from '../data/types'
import { cn, estimateWorkoutSeconds, formatDuration, totalSets } from '../lib/utils'

const PHASE_ACCENT: Record<Workout['phase'], string> = {
  accumulation: 'bg-slate-cool',
  intensification: 'bg-soviet',
  realization: 'bg-ember',
  custom: 'bg-paper',
}

interface Props {
  workout: Workout
  index: number
  onStart: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function WorkoutCard({ workout, index, onStart, onEdit, onDelete }: Props) {
  const minutes = formatDuration(estimateWorkoutSeconds(workout))
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
      className="group relative overflow-hidden border border-paper/15 bg-ink"
    >
      <div className={cn('absolute inset-y-0 left-0 w-1.5', PHASE_ACCENT[workout.phase])} />
      <button
        type="button"
        onClick={onStart}
        className="flex w-full items-stretch gap-4 pl-6 pr-4 py-5 text-left active:bg-paper/5"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-[0.25em] text-paper/60">
              {workout.isStock ? `DAY ${index + 1}` : 'CUSTOM'}
            </span>
            {workout.loop && (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-label tracking-widest text-paper/60">
                <Repeat size={10} /> LOOP
              </span>
            )}
          </div>
          <h3 className="truncate text-2xl font-bold uppercase leading-none tracking-tight">{workout.name}</h3>
          {(workout.focus || workout.subtitle) && (
            <p className="truncate text-sm text-paper/65">{workout.focus ?? workout.subtitle}</p>
          )}
          <p className="mt-1 truncate font-mono text-xs text-paper/70">
            {workout.blocks.map((b) => b.name).join(' · ')}
          </p>
          <div className="mt-1 flex gap-4 font-mono text-xs tabular text-paper/60">
            <span>{workout.blocks.length} EX</span>
            <span>{totalSets(workout)} SETS</span>
            <span>~{minutes.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center text-paper/60 transition group-hover:text-paper">
          <ChevronRight size={22} strokeWidth={1.75} />
        </div>
      </button>
      {(onEdit || onDelete) && (
        <div className="flex border-t border-paper/10">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-2 py-3 font-mono text-xs tracking-widest text-paper/60 active:bg-paper/5"
            >
              <Pencil size={13} /> EDIT
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="flex flex-1 items-center justify-center gap-2 border-l border-paper/10 py-3 font-mono text-xs tracking-widest text-soviet-text active:bg-soviet/10"
            >
              <Trash2 size={13} /> DELETE
            </button>
          )}
        </div>
      )}
    </motion.article>
  )
}
