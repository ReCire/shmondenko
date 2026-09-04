import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion'
import { ArrowLeft, GripVertical, Library, Plus, Trash2 } from 'lucide-react'
import type { ExerciseBlock } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import {
  cn,
  estimateWorkoutSeconds,
  formatDuration,
  searchExerciseLibrary,
  uid,
  type LibraryExercise,
} from '../lib/utils'

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
  /** Block whose name field should grab focus (and pop the library) on mount. */
  const [focusId, setFocusId] = useState<string | null>(null)

  const updateBlock = (id: string, patch: Partial<ExerciseBlock>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const removeBlock = (id: string) => setBlocks((bs) => bs.filter((b) => b.id !== id))
  const addBlock = () => {
    const b = newBlock()
    setBlocks((bs) => [...bs, b])
    setFocusId(b.id)
  }

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
                  autoFocus={b.id === focusId}
                  onChange={(patch) => updateBlock(b.id, patch)}
                  onRemove={() => removeBlock(b.id)}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>

          <button
            type="button"
            onClick={addBlock}
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
  autoFocus: boolean
  onChange: (patch: Partial<ExerciseBlock>) => void
  onRemove: () => void
}

function BlockEditor({ block, index, showError, canRemove, autoFocus, onChange, onRemove }: BlockEditorProps) {
  // Drag is bound to the grip only, so typing / picking never nudges the order.
  const dragControls = useDragControls()
  const containerRef = useRef<HTMLLIElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)

  const matches = useMemo(() => searchExerciseLibrary(block.name), [block.name])

  // Blocks added via ADD BLOCK land focused, which pops the library straight away.
  const shouldAutoFocus = useRef(autoFocus)
  useEffect(() => {
    if (shouldAutoFocus.current) inputRef.current?.focus()
  }, [])

  const pick = (ex: LibraryExercise) => {
    onChange({
      name: ex.name,
      mode: ex.mode,
      workSeconds: ex.workSeconds,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
      sets: ex.sets,
    })
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <Reorder.Item
      ref={containerRef}
      value={block}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: -12 }}
      transition={{ duration: 0.22 }}
      className={cn(
        'relative border bg-ink transition-colors scroll-mt-[120px]',
        open ? 'border-paper/60' : 'border-paper/15',
      )}
    >
      <div ref={rowRef} className="flex items-center gap-2 border-b border-paper/10 pl-2 pr-1">
        <span
          onPointerDown={(e) => {
            setOpen(false)
            dragControls.start(e)
          }}
          aria-label="Drag to reorder"
          className="cursor-grab touch-none py-3 text-paper/30 active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </span>
        <span className="font-mono text-[11px] tracking-widest text-paper/40">{String(index + 1).padStart(2, '0')}</span>
        <input
          ref={inputRef}
          value={block.name}
          onChange={(e) => {
            onChange({ name: e.target.value })
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            // iOS lifts the page for the soft keyboard, which can push this row
            // off the top. Once the keyboard has settled, pull the block back to
            // the top of the viewport (scroll-mt keeps it clear of the header).
            window.setTimeout(() => {
              containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 300)
          }}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`lib-${block.id}`}
          autoComplete="off"
          placeholder="Search library or type"
          className={cn(
            'min-w-0 flex-1 bg-transparent py-3 text-lg font-bold uppercase tracking-tight placeholder:font-normal placeholder:normal-case placeholder:text-paper/25 focus:outline-none',
            showError && 'placeholder:text-soviet',
          )}
        />
        <button
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false)
            } else {
              inputRef.current?.focus()
              setOpen(true)
            }
          }}
          aria-label="Exercise library"
          className={cn(
            'flex h-10 w-9 shrink-0 items-center justify-center transition-colors',
            open ? 'bg-paper text-ink' : 'text-paper/40 active:text-paper',
          )}
        >
          <Library size={16} />
        </button>
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

      <ExercisePalette
        id={`lib-${block.id}`}
        open={open}
        query={block.name}
        matches={matches}
        anchorRef={rowRef}
        inputRef={inputRef}
        onPick={pick}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
      />

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

/* ---------- Exercise library palette ---------- */

/** Rendered rows are capped so a blank query stays instant on a phone. */
const MAX_ROWS = 32

interface Anchor {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
  placement: 'below' | 'above'
}

interface PaletteProps {
  id: string
  open: boolean
  query: string
  matches: LibraryExercise[]
  anchorRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  onPick: (ex: LibraryExercise) => void
  onOpen: () => void
  onClose: () => void
}

/**
 * Command-palette dropdown glued to the block's name row. Rendered in a portal
 * so it escapes the Reorder.Item stacking context, and positioned `fixed` from
 * a live measurement of the anchor — it stays welded to the row while the page
 * scrolls or the soft keyboard resizes the visual viewport.
 */
function ExercisePalette({ id, open, query, matches, anchorRef, inputRef, onPick, onOpen, onClose }: PaletteProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [active, setActive] = useState(0)
  const [lastQuery, setLastQuery] = useState(query)
  const listRef = useRef<HTMLDivElement>(null)

  // Re-typing restarts the highlight at the top match, adjusted during render
  // rather than in an effect so the list never paints a stale selection.
  if (lastQuery !== query) {
    setLastQuery(query)
    setActive(0)
  }

  const shown = matches.slice(0, MAX_ROWS)

  const measure = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vv = window.visualViewport
    const viewTop = vv?.offsetTop ?? 0
    const viewBottom = viewTop + (vv?.height ?? window.innerHeight)
    const gap = 8
    const below = viewBottom - r.bottom - gap
    const above = r.top - viewTop - gap
    const useBelow = below >= 190 || below >= above
    setAnchor({
      left: r.left,
      width: r.width,
      top: useBelow ? r.bottom + gap : undefined,
      bottom: useBelow ? undefined : window.innerHeight - r.top + gap,
      maxHeight: Math.max(150, Math.min(340, useBelow ? below : above)),
      placement: useBelow ? 'below' : 'above',
    })
  }, [anchorRef])

  useLayoutEffect(() => {
    if (!open) return
    measure()
    const onViewport = () => {
      // Freeze the position once focus leaves the input (i.e. the user is
      // reaching into the list) so a closing keyboard can't yank rows away
      // from under their finger mid-tap.
      if (document.activeElement === inputRef.current) measure()
    }
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', onViewport)
    window.visualViewport?.addEventListener('scroll', onViewport)
    return () => {
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', onViewport)
      window.visualViewport?.removeEventListener('scroll', onViewport)
    }
  }, [open, measure, inputRef])

  // Focus moving to another control (Tab, or another block's field) dismisses.
  // A null relatedTarget — a touch landing on a non-focusable node — is left to
  // the pointer listener below, so tapping a suggestion still registers.
  useEffect(() => {
    const el = inputRef.current
    if (!open || !el) return
    const onBlur = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null
      if (!next) return
      if (anchorRef.current?.contains(next) || listRef.current?.parentElement?.contains(next)) return
      onClose()
    }
    el.addEventListener('blur', onBlur)
    return () => el.removeEventListener('blur', onBlur)
  }, [open, anchorRef, inputRef, onClose])

  // Dismiss on any pointer landing outside the row and the palette.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (anchorRef.current?.contains(t) || listRef.current?.parentElement?.contains(t)) return
      onClose()
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [open, anchorRef, onClose])

  // Keyboard driving: ↑/↓ walk the list, Enter fills, Esc dismisses.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!open) return
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }
      if (!open) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setActive(0)
          onOpen()
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => Math.min(shown.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        if (shown[active]) {
          e.preventDefault()
          onPick(shown[active])
        } else {
          onClose()
        }
      }
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [open, shown, active, onPick, onOpen, onClose, inputRef])

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && anchor && (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: anchor.placement === 'below' ? -10 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          // pointerEvents is dropped the instant it starts leaving, so a tap can
          // never land on a palette that is only still on screen for the fade.
          exit={{ opacity: 0, y: anchor.placement === 'below' ? -6 : 6, pointerEvents: 'none' }}
          transition={{ type: 'spring', stiffness: 780, damping: 46, mass: 0.5 }}
          style={{
            left: anchor.left,
            width: anchor.width,
            top: anchor.top,
            bottom: anchor.bottom,
            maxHeight: anchor.maxHeight,
          }}
          className="fixed z-40 flex flex-col border-[3px] border-paper bg-ink shadow-[0_32px_80px_-24px_rgba(0,0,0,0.9)]"
        >
          <div className="flex shrink-0 items-center justify-between border-b-[3px] border-paper px-3 py-1.5">
            <span className="font-mono text-[10px] tracking-[0.3em] text-paper/60">
              {query.trim() ? `MATCHES · ${matches.length}` : `LIBRARY · ${matches.length}`}
            </span>
            <span className="font-mono text-[10px] tracking-[0.3em] text-soviet">TAP TO FILL</span>
          </div>

          <div ref={listRef} id={id} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {shown.length === 0 ? (
              <p className="px-3 py-5 font-mono text-[11px] leading-relaxed tracking-[0.2em] text-paper/45">
                NO MATCH IN LIBRARY.
                <br />
                KEEP TYPING — CUSTOM NAMES ARE FINE.
              </p>
            ) : (
              shown.map((ex, i) => (
                <motion.button
                  key={ex.name}
                  type="button"
                  data-idx={i}
                  role="option"
                  aria-selected={i === active}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.16, delay: Math.min(i, 8) * 0.014 }}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => onPick(ex)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 border-b border-paper/10 px-3 py-2.5 text-left transition-colors',
                    i === active ? 'bg-paper text-ink' : 'text-paper active:bg-paper/10',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold uppercase leading-tight tracking-tight">
                      <Highlight text={ex.name} query={query} />
                    </span>
                    <span
                      className={cn(
                        'mt-0.5 block truncate font-mono text-[10px] tracking-[0.18em]',
                        i === active ? 'text-ink/60' : 'text-paper/40',
                      )}
                    >
                      {ex.mode === 'time' ? `${ex.workSeconds}S` : `${ex.reps} REPS`} · ×{ex.sets} · REST {ex.restSeconds}S
                      {ex.tags[0] ? ` · ${ex.tags[0].toUpperCase()}` : ''}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-mono text-[10px] tracking-[0.2em]',
                      i === active ? 'text-ink/50' : 'text-paper/30',
                    )}
                  >
                    {ex.tracks.map((t) => t[0].toUpperCase()).join('')}
                  </span>
                </motion.button>
              ))
            )}
            {matches.length > shown.length && (
              <p className="px-3 py-2 font-mono text-[10px] tracking-[0.25em] text-paper/30">
                +{matches.length - shown.length} MORE · REFINE SEARCH
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Marks the matched span of the query inside a library name. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <span className="text-soviet">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
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
