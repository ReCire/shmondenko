import { useState, type ReactNode } from 'react'
import { AnimatePresence, Reorder, motion } from 'framer-motion'
import { ArrowLeft, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { ExerciseBlock } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { cn, estimateWorkoutSeconds, formatDuration, uid } from '../lib/utils'

const newBlock = (): ExerciseBlock => ({
  id: uid(),
  name: '',
  mode: 'time',
  workSeconds: 30,
  reps: 10,
  restSeconds: 60,
  sets: 3,
})

interface Props {
  editId?: string
}

export function WorkoutCreator({ editId }: Props) {
  const navigate = useAppStore((s) => s.navigate)
  const saveWorkout = useAppStore((s) => s.saveWorkout)
  const existing = useAppStore((s) => (editId ? s.customWorkouts.find((w) => w.id === editId) : undefined))

  const [name, setName] = useState(existing?.name ?? '')
  const [loop, setLoop] = useState(existing?.loop ?? false)
  const [blocks, setBlocks] = useState<ExerciseBlock[]>(existing?.blocks ?? [newBlock()])
  const [touched, setTouched] = useState(false)

  const updateBlock = (id: string, patch: Partial<ExerciseBlock>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const removeBlock = (id: string) => setBlocks((bs) => bs.filter((b) => b.id !== id))

  const errors = {
    name: name.trim().length === 0,
    blocks: blocks.length === 0 || blocks.some((b) => b.name.trim().length === 0),
  }
  const invalid = errors.name || errors.blocks

  const preview = estimateWorkoutSeconds({
    id: '',
    name,
    phase: 'custom',
    loop,
    blocks,
  })

  const submit = () => {
    setTouched(true)
    if (invalid) return
    saveWorkout({
      id: existing?.id,
      name: name.trim().toUpperCase(),
      loop,
      blocks: blocks.map((b) => ({ ...b, name: b.name.trim() })),
    })
    navigate({ name: 'dashboard' })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col safe-pt">
      <header className="flex items-center gap-3 px-4 pb-4">
        <button
          type="button"
          onClick={() => navigate({ name: 'dashboard' })}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center text-paper/70 active:bg-paper/10"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="font-mono text-[11px] tracking-[0.35em] text-paper/45">{existing ? 'EDIT' : 'NEW'} CUSTOM</p>
          <h1 className="text-2xl font-black uppercase leading-none tracking-tight">Workout Builder</h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-8 px-6 pb-40">
        {/* Global settings */}
        <section className="flex flex-col gap-4">
          <Field label="WORKOUT NAME" error={touched && errors.name ? 'Required' : undefined}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HYPERTROPHY B"
              autoFocus={!existing}
              className="w-full border-b-2 border-paper/25 bg-transparent pb-2 text-3xl font-black uppercase tracking-tight placeholder:text-paper/20 focus:border-soviet focus:outline-none"
            />
          </Field>

          <button
            type="button"
            onClick={() => setLoop((l) => !l)}
            role="switch"
            aria-checked={loop}
            className="flex items-center justify-between border border-paper/15 px-4 py-3.5 active:bg-paper/5"
          >
            <div className="text-left">
              <p className="font-mono text-[11px] tracking-[0.3em] text-paper/45">LOOP REPEAT</p>
              <p className="mt-0.5 text-sm text-paper/80">
                {loop ? 'Runs until you stop it' : 'Runs through once, then ends'}
              </p>
            </div>
            <span className={cn('relative h-7 w-12 border transition-colors', loop ? 'border-soviet bg-soviet' : 'border-paper/30')}>
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                className={cn('absolute top-0.5 h-5.5 w-5.5 bg-paper', loop ? 'left-[calc(100%-1.5rem)]' : 'left-0.5')}
              />
            </span>
          </button>
        </section>

        {/* Blocks */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] tracking-[0.3em] text-paper/45">EXERCISE BLOCKS</h2>
            <span className="font-mono text-[11px] tracking-widest text-paper/40">
              {blocks.length} · ~{formatDuration(preview).toUpperCase()}
            </span>
          </div>

          <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {blocks.map((b, i) => (
                <BlockEditor
                  key={b.id}
                  block={b}
                  index={i}
                  showError={touched && b.name.trim().length === 0}
                  canRemove={blocks.length > 1}
                  onChange={(patch) => updateBlock(b.id, patch)}
                  onRemove={() => removeBlock(b.id)}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>

          <button
            type="button"
            onClick={() => setBlocks((bs) => [...bs, newBlock()])}
            className="flex items-center justify-center gap-2 border border-dashed border-paper/30 py-4 font-mono text-xs tracking-[0.25em] text-paper/70 active:bg-paper/5"
          >
            <Plus size={14} /> ADD BLOCK
          </button>
        </section>
      </main>

      {/* Sticky save */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-lg bg-gradient-to-t from-ink via-ink/95 to-transparent px-6 pt-8 safe-pb">
        <motion.button
          type="button"
          whileTap={{ scale: 0.985 }}
          onClick={submit}
          className={cn(
            'w-full py-5 text-lg font-black uppercase tracking-[0.2em] transition-colors',
            invalid && touched ? 'bg-paper/20 text-paper/50' : 'bg-paper text-ink',
          )}
        >
          {existing ? 'Save Changes' : 'Save Workout'}
        </motion.button>
      </div>
    </div>
  )
}

/* ---------- Block editor ---------- */

interface BlockEditorProps {
  block: ExerciseBlock
  index: number
  showError: boolean
  canRemove: boolean
  onChange: (patch: Partial<ExerciseBlock>) => void
  onRemove: () => void
}

function BlockEditor({ block, index, showError, canRemove, onChange, onRemove }: BlockEditorProps) {
  return (
    <Reorder.Item
      value={block}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: -12 }}
      transition={{ duration: 0.22 }}
      className="relative border border-paper/15 bg-ink"
    >
      <div className="flex items-center gap-2 border-b border-paper/10 pl-2 pr-1">
        <span className="cursor-grab touch-none py-3 text-paper/30 active:cursor-grabbing">
          <GripVertical size={16} />
        </span>
        <span className="font-mono text-[11px] tracking-widest text-paper/40">{String(index + 1).padStart(2, '0')}</span>
        <input
          value={block.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Exercise name"
          className={cn(
            'min-w-0 flex-1 bg-transparent py-3 text-lg font-bold uppercase tracking-tight placeholder:font-normal placeholder:normal-case placeholder:text-paper/25 focus:outline-none',
            showError && 'placeholder:text-soviet',
          )}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove block"
            className="flex h-10 w-10 items-center justify-center text-paper/40 active:text-soviet"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-paper/10">
        <div className="flex flex-col p-3">
          <Segmented
            value={block.mode}
            onChange={(mode) => onChange({ mode })}
            options={[
              ['time', 'TIME'],
              ['reps', 'REPS'],
            ]}
          />
          {block.mode === 'time' ? (
            <NumberInput
              value={block.workSeconds}
              min={1}
              max={3600}
              step={5}
              suffix="s"
              onChange={(workSeconds) => onChange({ workSeconds })}
            />
          ) : (
            <NumberInput value={block.reps} min={1} max={999} step={1} suffix="×" onChange={(reps) => onChange({ reps })} />
          )}
        </div>
        <div className="flex flex-col p-3">
          <Label>REST</Label>
          <NumberInput
            value={block.restSeconds}
            min={0}
            max={3600}
            step={5}
            suffix="s"
            onChange={(restSeconds) => onChange({ restSeconds })}
          />
        </div>
        <div className="flex flex-col p-3">
          <Label>SETS</Label>
          <NumberInput value={block.sets} min={1} max={50} step={1} onChange={(sets) => onChange({ sets })} />
        </div>
      </div>
    </Reorder.Item>
  )
}

/* ---------- Primitives ---------- */

function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block h-5 font-mono text-[10px] leading-5 tracking-[0.25em] text-paper/45">{children}</span>
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex justify-between font-mono text-[11px] tracking-[0.3em] text-paper/45">
        {label}
        {error && <span className="text-soviet">{error.toUpperCase()}</span>}
      </span>
      {children}
    </label>
  )
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <div className="mb-1.5 flex h-5 border border-paper/20">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            'flex-1 font-mono text-[9px] tracking-widest transition-colors',
            v === value ? 'bg-paper text-ink' : 'text-paper/50',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function NumberInput({
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (v: number) => void
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)))
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        aria-label="Decrease"
        className="h-9 w-7 shrink-0 text-lg leading-none text-paper/50 active:text-paper"
      >
        −
      </button>
      <div className="relative flex min-w-0 flex-1 items-baseline justify-center">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (!Number.isNaN(n)) onChange(clamp(n))
          }}
          className="w-full min-w-0 bg-transparent text-center text-2xl font-black tabular focus:outline-none"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-0 top-0 font-mono text-[10px] text-paper/40">{suffix}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        aria-label="Increase"
        className="h-9 w-7 shrink-0 text-lg leading-none text-paper/50 active:text-paper"
      >
        +
      </button>
    </div>
  )
}
