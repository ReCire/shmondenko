import { useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Dumbbell, Flame, Home, Plus, Settings2, TreePine } from 'lucide-react'
import { PROGRAM_TRACKS, STOCK_PHASES, STOCK_WORKOUTS, phaseLabel, phaseTheme } from '../data/stockWorkouts'
import type { ProgramTrack, Workout } from '../data/types'
import { useAppStore } from '../store/useAppStore'
import { cn, computeCurrentPhase, computeStreak, localDateKey } from '../lib/utils'
import { WorkoutCard } from './WorkoutCard'
import { FuelGuide } from './FuelGuide'

type Tab = 'stock' | 'custom' | 'fuel'

const TRACK_ICONS: Record<ProgramTrack, typeof Home> = { home: Home, outdoors: TreePine, gym: Dumbbell }

export function Dashboard() {
  const [tab, setTab] = useState<Tab>('stock')
  const customWorkouts = useAppStore((s) => s.customWorkouts)
  const logs = useAppStore((s) => s.logs)
  const phaseOverride = useAppStore((s) => s.manualPhaseOverride)
  const navigate = useAppStore((s) => s.navigate)
  const deleteWorkout = useAppStore((s) => s.deleteWorkout)
  const requestConfirm = useAppStore((s) => s.requestConfirm)
  const activeProgram = useAppStore((s) => s.activeProgram)
  const setProgram = useAppStore((s) => s.setProgram)

  const streak = useMemo(() => computeStreak(logs), [logs])
  const trainedToday = useMemo(() => logs.some((l) => l.date === localDateKey()), [logs])
  const currentPhase = useMemo(() => computeCurrentPhase(logs, phaseOverride), [logs, phaseOverride])
  const last7 = useMemo(() => {
    const days = new Set(logs.map((l) => l.date))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return { key: localDateKey(d), done: days.has(localDateKey(d)), label: 'SMTWTFS'[d.getDay()] }
    })
  }, [logs])

  const stockForProgram = useMemo(
    () => STOCK_WORKOUTS.filter((w) => w.program === activeProgram),
    [activeProgram],
  )
  const list = tab === 'stock' ? stockForProgram : customWorkouts
  const activeTrack = PROGRAM_TRACKS.find((t) => t.key === activeProgram) ?? PROGRAM_TRACKS[0]

  const renderCard = (w: Workout, i: number) => (
    <WorkoutCard
      key={w.id}
      workout={w}
      index={i}
      onStart={() => navigate({ name: 'preview', workoutId: w.id })}
      onEdit={w.isStock ? undefined : () => navigate({ name: 'creator', editId: w.id })}
      onDelete={
        w.isStock
          ? undefined
          : () =>
              requestConfirm(
                `Delete ${w.name}?`,
                'This custom workout will be removed from this device. Your logged sessions are kept.',
                () => deleteWorkout(w.id),
              )
      }
    />
  )

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col safe-pt safe-pb">
      {/* Header */}
      <header className="flex items-start justify-between px-6 pb-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.35em] text-paper/45">ШМОНДЕНКО · PERIODISATION</p>
          <h1 className="mt-1 text-[clamp(2rem,9.5vw,3rem)] font-black uppercase leading-[0.9] tracking-tighter">
            Shmondenko
            <span className="text-soviet">.</span>
          </h1>
          <p className="mt-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-paper/55">
            <span className="h-1.5 w-1.5 bg-soviet" />
            CURRENT PHASE · {currentPhase.toUpperCase()}
            {phaseOverride && <span className="text-paper/35">· MANUAL</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate({ name: 'settings' })}
          aria-label="Settings"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center border border-paper/15 text-paper/60 active:bg-paper/10"
        >
          <Settings2 size={16} />
        </button>
      </header>

      {/* Program track selector */}
      <section className="mx-6 mb-4">
        <div className="flex items-baseline justify-between pb-2">
          <p className="font-mono text-[10px] tracking-[0.3em] text-paper/45">PROGRAM TRACK</p>
          <p className="font-mono text-[10px] tracking-[0.2em] text-paper/40">{activeTrack.description.toUpperCase()}</p>
        </div>
        <LayoutGroup id="program-track">
          <div role="radiogroup" aria-label="Program track" className="grid grid-cols-3 border border-paper/15">
            {PROGRAM_TRACKS.map((t, i) => {
              const Icon = TRACK_ICONS[t.key]
              const active = t.key === activeProgram
              return (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setProgram(t.key)}
                  className={cn(
                    'relative flex h-12 items-center justify-center gap-2 font-mono text-[11px] tracking-[0.25em] transition-colors',
                    i > 0 && 'border-l border-paper/15',
                    active ? 'text-ink' : 'text-paper/50 active:bg-paper/5',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="program-track-pill"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      className="absolute inset-0 bg-paper"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={13} strokeWidth={2.25} />
                    {t.label.toUpperCase()}
                  </span>
                </button>
              )
            })}
          </div>
        </LayoutGroup>
      </section>

      {/* Consistency */}
      <section className="mx-6 mb-8 border border-paper/15">
        <div className="flex items-stretch">
          <div className="flex flex-1 flex-col justify-between border-r border-paper/15 p-5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-paper/45">CONSISTENCY STREAK</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-7xl font-black leading-none tabular tracking-tighter">{streak}</span>
              <span className="mb-2 font-mono text-xs tracking-widest text-paper/60">{streak === 1 ? 'DAY' : 'DAYS'}</span>
            </div>
          </div>
          <div className="flex w-32 flex-col justify-between p-5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-paper/45">TOTAL</p>
            <div>
              <span className="text-4xl font-black leading-none tabular tracking-tighter">{logs.length}</span>
              <p className="mt-1 font-mono text-[10px] tracking-widest text-paper/60">SESSIONS</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-paper/15 px-5 py-3">
          <div className="flex gap-1.5">
            {last7.map((d) => (
              <div key={d.key} className="flex flex-col items-center gap-1">
                <div className={cn('h-2.5 w-2.5', d.done ? 'bg-soviet' : 'bg-paper/15')} />
                <span className="font-mono text-[9px] text-paper/40">{d.label}</span>
              </div>
            ))}
          </div>
          <p
            className={cn(
              'flex items-center gap-1.5 font-mono text-[10px] tracking-widest',
              trainedToday ? 'text-soviet' : 'text-paper/50',
            )}
          >
            <Flame size={12} fill={trainedToday ? 'currentColor' : 'none'} />
            {trainedToday ? 'TRAINED TODAY' : 'NO SESSION YET'}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <LayoutGroup>
        <nav className="mx-6 flex border-b border-paper/15">
          {(
            [
              ['stock', `STOCK · ${activeProgram.toUpperCase()}`],
              ['custom', `CUSTOM${customWorkouts.length ? ` · ${customWorkouts.length}` : ''}`],
              ['fuel', 'FUEL'],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'relative pb-3 font-mono text-[11px] tracking-[0.25em] transition-colors',
                key === 'fuel' ? 'w-16 shrink-0' : 'flex-1',
                tab === key ? 'text-paper' : 'text-paper/40',
              )}
            >
              {label}
              {tab === key && (
                <motion.span layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 bg-soviet" />
              )}
            </button>
          ))}
        </nav>
      </LayoutGroup>

      {/* Workout list */}
      <main className="flex flex-1 flex-col gap-3 px-6 pb-28 pt-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {tab === 'stock' ? (
            <motion.div
              key={`stock-${activeProgram}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8"
            >
              {STOCK_PHASES.map((phase) => {
                const days = stockForProgram.filter((w) => w.phase === phase)
                if (days.length === 0) return null
                return (
                  <section key={phase} className="flex flex-col gap-3">
                    <div className="flex items-baseline gap-3 border-b border-paper/15 pb-2">
                      <h2 className={cn('font-mono text-[11px] tracking-[0.2em]', phase === currentPhase ? 'text-paper' : 'text-paper/70')}>
                        {phaseLabel(phase).toUpperCase()}
                      </h2>
                      {phase === currentPhase && (
                        <span className="bg-soviet px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.2em] text-paper">CURRENT</span>
                      )}
                      <span className="ml-auto shrink-0 font-mono text-[10px] tracking-[0.15em] text-paper/40">{phaseTheme(phase).toUpperCase()}</span>
                    </div>
                    {days.map(renderCard)}
                  </section>
                )
              })}
            </motion.div>
          ) : tab === 'fuel' ? (
            <motion.div key="fuel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FuelGuide />
            </motion.div>
          ) : list.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center gap-4 border border-dashed border-paper/20 px-6 py-14 text-center"
            >
              <p className="text-xl font-bold uppercase tracking-tight">No custom workouts</p>
              <p className="max-w-[16rem] text-sm text-paper/50">Build your own loop. Time or reps, rest, sets. It saves on this device.</p>
              <button
                type="button"
                onClick={() => navigate({ name: 'creator' })}
                className="mt-2 border border-paper px-5 py-2.5 font-mono text-xs tracking-[0.25em] active:bg-paper active:text-ink"
              >
                CREATE ONE
              </button>
            </motion.div>
          ) : (
            list.map(renderCard)
          )}
        </AnimatePresence>
      </main>

      {/* FAB */}
      {tab !== 'fuel' && (
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => navigate({ name: 'creator' })}
        aria-label="Create custom workout"
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 flex h-16 w-16 items-center justify-center bg-soviet text-paper shadow-[0_12px_40px_-8px_rgba(200,16,46,0.7)]"
      >
        <Plus size={30} strokeWidth={2.5} />
      </motion.button>
      )}
    </div>
  )
}
