import type { ReactNode } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import type { WorkoutPhase } from '../data/types'
import { STOCK_PHASES, phaseTheme } from '../data/stockWorkouts'
import { useAppStore } from '../store/useAppStore'
import { cn, computeCurrentPhase, daysSinceFirstLog, PHASE_BOUNDARIES } from '../lib/utils'

const PREP_OPTIONS = [3, 5, 10] as const

const NUMERAL: Record<Exclude<WorkoutPhase, 'custom'>, string> = {
  accumulation: 'I',
  intensification: 'II',
  realization: 'III',
}

export function Settings() {
  const navigate = useAppStore((s) => s.navigate)
  const logs = useAppStore((s) => s.logs)
  const customWorkouts = useAppStore((s) => s.customWorkouts)
  const override = useAppStore((s) => s.manualPhaseOverride)
  const setPhaseOverride = useAppStore((s) => s.setPhaseOverride)
  const soundEnabled = useAppStore((s) => s.soundEnabled)
  const toggleSound = useAppStore((s) => s.toggleSound)
  const resetData = useAppStore((s) => s.resetData)
  const prepTime = useAppStore((s) => s.prepTime)
  const setPrepTime = useAppStore((s) => s.setPrepTime)

  const autoPhase = computeCurrentPhase(logs)
  const effectivePhase = computeCurrentPhase(logs, override)
  const days = daysSinceFirstLog(logs)

  const autoDescription =
    logs.length === 0
      ? 'Starts counting from your first logged session.'
      : `Day ${days} of the cycle · Block I ends day ${PHASE_BOUNDARIES.accumulation}, Block II day ${PHASE_BOUNDARIES.intensification}.`

  const confirmReset = () => {
    const summary = `${customWorkouts.length} custom workout${customWorkouts.length === 1 ? '' : 's'} and ${logs.length} logged session${logs.length === 1 ? '' : 's'}`
    if (confirm(`Erase ${summary}? Your streak resets to zero. This cannot be undone.`)) resetData()
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col safe-pt safe-pb">
      <header className="flex items-center gap-3 px-4 pb-6">
        <button
          type="button"
          onClick={() => navigate({ name: 'dashboard' })}
          aria-label="Back to dashboard"
          className="flex h-11 w-11 items-center justify-center text-paper/70 active:bg-paper/10"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="font-mono text-[11px] tracking-[0.35em] text-paper/45">CONTROL PANEL</p>
          <h1 className="text-2xl font-black uppercase leading-none tracking-tight">Settings</h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-10 px-6 pb-10">
        {/* Phase override */}
        <Section
          label="PHASE OVERRIDE"
          hint={override ? 'MANUAL' : 'AUTO'}
          description="The dashboard highlights the block you should be training. By default it follows the calendar; override it if your cycle is out of step."
        >
          <LayoutGroup id="phase-override">
            <div role="radiogroup" aria-label="Periodisation phase" className="flex flex-col border border-paper/15">
              <PhaseOption
                active={override === null}
                onSelect={() => setPhaseOverride(null)}
                numeral="A"
                title="Automatic"
                subtitle={`Currently Block ${NUMERAL[autoPhase]} · ${autoPhase}`}
              />
              {STOCK_PHASES.map((phase) => (
                <PhaseOption
                  key={phase}
                  active={override === phase}
                  onSelect={() => setPhaseOverride(phase)}
                  numeral={NUMERAL[phase]}
                  title={phase}
                  subtitle={phaseTheme(phase)}
                />
              ))}
            </div>
          </LayoutGroup>
          <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.15em] text-paper/40">
            {autoDescription.toUpperCase()}
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-[0.15em] text-paper/60">
            EFFECTIVE · BLOCK {NUMERAL[effectivePhase]} {effectivePhase.toUpperCase()}
          </p>
        </Section>

        {/* Prep countdown */}
        <Section label="PREPARATION TIME" hint={`${prepTime}S`} description="Countdown before the first exercise begins.">
          <LayoutGroup id="prep-time">
            <div role="radiogroup" aria-label="Preparation time" className="grid grid-cols-3 border border-paper/15">
              {PREP_OPTIONS.map((seconds, i) => {
                const active = seconds === prepTime
                return (
                  <button
                    key={seconds}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPrepTime(seconds)}
                    className={cn(
                      'relative flex h-16 flex-col items-center justify-center transition-colors',
                      i > 0 && 'border-l border-paper/15',
                      active ? 'text-ink' : 'text-paper/60 active:bg-paper/5',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="prep-time-pill"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        className="absolute inset-0 bg-paper"
                      />
                    )}
                    <span className="relative z-10 text-2xl font-black tabular tracking-tighter">{seconds}</span>
                    <span className={cn('relative z-10 font-mono text-[9px] tracking-[0.3em]', active ? 'text-ink/60' : 'text-paper/40')}>
                      SEC
                    </span>
                  </button>
                )
              })}
            </div>
          </LayoutGroup>
        </Section>

        {/* Audio */}
        <Section label="CUES" description="Countdown ticks for the last three seconds, distinct tones for work and rest.">
          <button
            type="button"
            onClick={toggleSound}
            role="switch"
            aria-checked={soundEnabled}
            className="flex w-full items-center justify-between border border-paper/15 px-4 py-4 active:bg-paper/5"
          >
            <span className="flex items-center gap-3">
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-paper/50" />}
              <span className="text-left">
                <span className="block text-base font-bold uppercase tracking-tight">Sound & haptics</span>
                <span className="block font-mono text-[10px] tracking-[0.2em] text-paper/45">{soundEnabled ? 'ENABLED' : 'MUTED'}</span>
              </span>
            </span>
            <Switch on={soundEnabled} />
          </button>
        </Section>

        {/* Danger zone */}
        <Section label="DANGER ZONE" hint="IRREVERSIBLE" accent>
          <div className="border border-soviet/60">
            <div className="flex items-start gap-3 border-b border-soviet/40 px-4 py-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-soviet" />
              <div>
                <p className="text-base font-bold uppercase tracking-tight">Erase all data</p>
                <p className="mt-1 text-sm text-paper/60">
                  Deletes {customWorkouts.length} custom workout{customWorkouts.length === 1 ? '' : 's'} and {logs.length} logged
                  session{logs.length === 1 ? '' : 's'}. Stock programs are untouched.
                </p>
              </div>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.985 }}
              onClick={confirmReset}
              className="w-full py-4 font-mono text-xs font-bold tracking-[0.3em] text-soviet active:bg-soviet active:text-paper"
            >
              CLEAR WORKOUTS & HISTORY
            </motion.button>
          </div>
        </Section>

        <p className="mt-auto pt-6 text-center font-mono text-[10px] tracking-[0.3em] text-paper/30">
          SHMONDENKO · PERIODISATION · DATA STAYS ON THIS DEVICE
        </p>
      </main>
    </div>
  )
}

/* ---------- Primitives ---------- */

function Section({
  label,
  hint,
  description,
  accent,
  children,
}: {
  label: string
  hint?: string
  description?: string
  accent?: boolean
  children: ReactNode
}) {
  return (
    <section>
      <div className={cn('flex items-baseline justify-between border-b pb-2', accent ? 'border-soviet/60' : 'border-paper/15')}>
        <h2 className={cn('font-mono text-[11px] tracking-[0.3em]', accent ? 'text-soviet' : 'text-paper/70')}>{label}</h2>
        {hint && <span className={cn('font-mono text-[10px] tracking-[0.2em]', accent ? 'text-soviet/70' : 'text-paper/40')}>{hint}</span>}
      </div>
      {description && <p className="mt-3 text-sm leading-relaxed text-paper/55">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function PhaseOption({
  active,
  onSelect,
  numeral,
  title,
  subtitle,
}: {
  active: boolean
  onSelect: () => void
  numeral: string
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        'relative flex items-center gap-4 border-b border-paper/15 px-4 py-4 text-left transition-colors last:border-b-0',
        active ? 'text-ink' : 'text-paper active:bg-paper/5',
      )}
    >
      {active && (
        <motion.span
          layoutId="phase-option-pill"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          className="absolute inset-0 bg-paper"
        />
      )}
      <span className="relative z-10 w-8 shrink-0 font-mono text-lg font-black tabular">{numeral}</span>
      <span className="relative z-10 min-w-0 flex-1">
        <span className="block text-base font-bold uppercase tracking-tight">{title}</span>
        <span className={cn('block font-mono text-[10px] tracking-[0.2em]', active ? 'text-ink/60' : 'text-paper/45')}>
          {subtitle.toUpperCase()}
        </span>
      </span>
      <span
        className={cn(
          'relative z-10 h-3 w-3 shrink-0 border-2',
          active ? 'border-ink bg-ink' : 'border-paper/40',
        )}
      />
    </button>
  )
}

function Switch({ on }: { on: boolean }) {
  return (
    <span className={cn('relative h-7 w-12 shrink-0 border transition-colors', on ? 'border-soviet bg-soviet' : 'border-paper/30')}>
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        className={cn('absolute top-0.5 h-5.5 w-5.5 bg-paper', on ? 'left-[calc(100%-1.5rem)]' : 'left-0.5')}
      />
    </span>
  )
}
