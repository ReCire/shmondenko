import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { getExerciseInfo, EXERCISES, normalizeName } from '../data/exercises'
import { cn } from '../lib/utils'

interface Props {
  exerciseName: string
  onBack: () => void
}

export function ExerciseDetail({ exerciseName, onBack }: Props) {
  const info = getExerciseInfo(exerciseName)
  const index = EXERCISES.findIndex((e) => normalizeName(e.name) === normalizeName(exerciseName))

  return (
    <div className={cn('min-h-dvh bg-ink text-paper safe-pt safe-pb', 'flex flex-col')}>
      <header className="flex items-center justify-between px-4 pb-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center text-paper/70 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-paper/50"
        >
          <ArrowLeft size={22} />
        </button>
        <p className="font-mono font-semibold text-[10px] tracking-[0.25em] text-paper/70">TECHNICAL MANUAL</p>
        <div className="w-11" />
      </header>

      <main className="flex-1 px-6 pb-8 pt-2">
        {info ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-8 border-b border-paper/15 pb-6">
              <p className="font-mono font-semibold text-[10px] tracking-[0.25em] text-paper/70">
                EXERCISE {index >= 0 ? ` / ${String(index + 1).padStart(3, '0')}` : ''}
              </p>
              <h1 className="mt-2 text-[clamp(2.25rem,9vw,3.5rem)] font-black uppercase leading-[0.9] tracking-tighter text-balance">
                {info.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono font-semibold text-[11px] tracking-[0.2em] text-paper/60">
                <span>{info.muscles.join(' · ')}</span>
                {info.category && <span className="text-paper/60">{info.category.toUpperCase()}</span>}
              </div>
            </div>

            {info.description && (
              <section className="mb-8">
                <p className="text-paper/80 leading-relaxed">{info.description}</p>
              </section>
            )}

            <StepSection label="SETUP" steps={info.setup} />
            <StepSection label="EXECUTION" steps={info.execution} />

            {info.commonMistakes.length > 0 && (
              <section className="mt-8 border-t border-paper/15 pt-6">
                <h2 className="mb-4 font-mono font-semibold text-[11px] tracking-[0.25em] text-soviet">COMMON ERRORS</h2>
                <ul className="space-y-4">
                  {info.commonMistakes.map((m, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <AlertTriangle size={14} className="mt-1 shrink-0 text-soviet" />
                      <span className="text-paper/80">{m}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {info.safety && info.safety.length > 0 && (
              <section className="mt-8 border-t border-paper/15 pt-6">
                <h2 className="mb-4 font-mono font-semibold text-[11px] tracking-[0.25em] text-paper/60">SAFETY</h2>
                <ul className="space-y-3">
                  {info.safety.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-paper/80">
                      <span className="font-mono text-paper/60">{String(i + 1).padStart(2, '0')}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(info.easier?.length || info.harder?.length) && (
              <section className="mt-8 border-t border-paper/15 pt-6">
                <h2 className="mb-4 font-mono font-semibold text-[11px] tracking-[0.25em] text-paper/60">PROGRESSION</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {info.easier && info.easier.length > 0 && (
                    <div className="border border-paper/15 p-4">
                      <p className="mb-2 font-mono font-semibold text-[10px] tracking-[0.2em] text-paper/70">EASIER</p>
                      <ul className="list-disc space-y-1 pl-4 text-sm text-paper/80">
                        {info.easier.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {info.harder && info.harder.length > 0 && (
                    <div className="border border-paper/15 p-4">
                      <p className="mb-2 font-mono font-semibold text-[10px] tracking-[0.2em] text-paper/70">HARDER</p>
                      <ul className="list-disc space-y-1 pl-4 text-sm text-paper/80">
                        {info.harder.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {info.breathing && (
              <section className="mt-8 border-t border-paper/15 pt-6">
                <h2 className="mb-2 font-mono font-semibold text-[11px] tracking-[0.25em] text-paper/60">BREATHING</h2>
                <p className="text-paper/80">{info.breathing}</p>
              </section>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-10"
          >
            <p className="font-mono font-semibold text-[10px] tracking-[0.25em] text-paper/70">TECHNICAL NOTE</p>
            <h1 className="mt-2 text-4xl font-black uppercase leading-[0.9] tracking-tighter">{exerciseName}</h1>
            <p className="mt-6 border-l-2 border-soviet pl-4 text-paper/80">
              Detailed instructions unavailable for this movement.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}

function StepSection({ label, steps }: { label: string; steps: string[] }) {
  if (steps.length === 0) return null
  return (
    <section className="mt-8 border-t border-paper/15 pt-6">
      <h2 className="mb-4 font-mono font-semibold text-[11px] tracking-[0.25em] text-paper/60">{label}</h2>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-4">
            <span className="w-6 shrink-0 font-mono text-xs tabular text-paper/60">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-paper/80">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
