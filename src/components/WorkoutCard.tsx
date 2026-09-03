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

const PHASE_LABEL: Record<Workout['phase'], string> = {
  accumulation: 'ACCUMULATION',
  intensification: 'INTENSIFICATION',
  realization: 'REALIZATION',
  custom: 'CUSTOM',
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

interface Props {
  workout: Workout
  index: number
  onStart: () => void
  onEdit?: () => void
  onDelete?: () => void
  recommended?: boolean
}

export function WorkoutCard({ workout, index, onStart, onEdit, onDelete, recommended = false }: Props) {
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
      {recommended && (
        <div className="absolute right-0 top-0 bg-soviet px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.25em] text-paper">
          CURRENT PHASE
        </div>
      )}
      <button
        type="button"
        onClick={onStart}
        className="flex w-full items-stretch gap-4 pl-6 pr-4 py-5 text-left active:bg-paper/5"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-[0.25em] text-paper/40">
              {workout.isStock ? `BLOCK ${ROMAN[index] ?? index + 1}` : PHASE_LABEL[workout.phase]}
            </span>
            {workout.loop && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-paper/50">
                <Repeat size={10} /> LOOP
              </span>
            )}
          </div>
          <h3 className="truncate text-2xl font-bold uppercase leading-none tracking-tight">{workout.name}</h3>
          {(workout.focus || workout.subtitle) && (
            <p className="truncate text-sm text-paper/55">{workout.focus ?? workout.subtitle}</p>
          )}
          <p className="mt-1 truncate font-mono text-xs text-paper/45">
            {workout.blocks.map((b) => b.name).join(' · ')}
          </p>
          <div className="mt-1 flex gap-4 font-mono text-xs tabular text-paper/60">
            <span>{workout.blocks.length} EX</span>
            <span>{totalSets(workout)} SETS</span>
            <span>~{minutes.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center text-paper/40 transition group-hover:text-paper">
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
              className="flex flex-1 items-center justify-center gap-2 border-l border-paper/10 py-3 font-mono text-xs tracking-widest text-soviet active:bg-soviet/10"
            >
              <Trash2 size={13} /> DELETE
            </button>
          )}
        </div>
      )}
    </motion.article>
  )
}
