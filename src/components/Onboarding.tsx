import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BookOpen, Compass, Play, Settings2, Wrench } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/utils'

/**
 * First-run briefing. Step one explains periodisation — there is nothing on
 * screen to point at — and every step after it spotlights the real control it
 * describes, because "there is a gear icon in the corner" is not much use to
 * someone who could not find the gear icon.
 */

interface Step {
  key: string
  meta: string
  title: string
  Icon: typeof BookOpen
  body: ReactNode
  /** Element to cut out of the scrim. Absent = centred card. */
  target?: () => Element | null | undefined
}

const q = (sel: string) => () => document.querySelector(sel)

const STEPS: Step[] = [
  {
    key: 'method',
    meta: 'THE METHOD',
    title: 'Soviet Periodisation',
    Icon: BookOpen,
    body: (
      <>
        <p>You do not train the same way all year. The programme runs in three four-week blocks, each with a different job.</p>
        <dl className="mt-4 flex flex-col gap-2.5">
          <Block numeral="I" name="Accumulation">Volume and form. Long sets, short rest.</Block>
          <Block numeral="II" name="Intensification">Strength and CNS. Heavy sets, long rest.</Block>
          <Block numeral="III" name="Realization">Peak power. Few explosive reps, full recovery.</Block>
        </dl>
        <p className="mt-4">The dashboard counts from your first logged session and tells you which block you are in.</p>
      </>
    ),
  },
  {
    key: 'tracks',
    meta: 'STEP 01 · EQUIPMENT',
    title: 'Choose your arena',
    Icon: Compass,
    target: q('[data-tour="tracks"]'),
    body: (
      <>
        <p>Every stock workout exists in three versions. Pick what you have access to today — the exercises change, the periodisation does not.</p>
        <dl className="mt-4 flex flex-col gap-2.5">
          <Block numeral="H" name="Home">Bodyweight only. No equipment at all.</Block>
          <Block numeral="O" name="Outdoors">Adds pull-up and dip bars.</Block>
          <Block numeral="G" name="Gym">Adds barbells, dumbbells, cables.</Block>
        </dl>
      </>
    ),
  },
  {
    key: 'start',
    meta: 'STEP 02 · TRAINING',
    title: 'Start a session',
    Icon: Play,
    target: q('[data-tour="workout-card"]'),
    body: (
      <>
        <p>Tap any card for the session brief — the exercises, the sets, the duration.</p>
        <p className="mt-3">
          <span className="text-paper">BEGIN SESSION</span> starts the timer. From there it runs itself — work, rest, sets — with audio cues on the last three seconds.
        </p>
      </>
    ),
  },
  {
    key: 'create',
    meta: 'STEP 03 · YOUR OWN',
    title: 'Build a protocol',
    Icon: Wrench,
    target: q('[data-tour="create"]'),
    body: (
      <>
        <p>Time or reps, rest, sets — as many blocks as you want, looped or run once.</p>
        <p className="mt-3">
          Start typing an exercise name and the library from the stock programme opens underneath. Pick one and it fills in sensible work, rest and set counts for you.
        </p>
      </>
    ),
  },
  {
    key: 'settings',
    meta: 'STEP 04 · CONTROL',
    title: 'Prepare & execute',
    Icon: Settings2,
    target: q('[data-tour="settings"]'),
    body: (
      <>
        <p>Prep countdown, audio cues, light or dark for training in direct sun.</p>
        <p className="mt-3">
          <span className="text-paper">LARGE TYPE</span> lives here too, if the small labels are hard to read. So does this briefing — you can replay it any time.
        </p>
      </>
    ),
  },
]

function Block({ numeral, name, children }: { numeral: string; name: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-6 shrink-0 font-mono font-semibold text-caption leading-5 tracking-[0.15em] text-soviet-text">{numeral}</dt>
      <dd className="min-w-0 flex-1 leading-5">
        <span className="font-bold uppercase tracking-tight text-paper">{name}</span>{' '}
        <span className="text-paper/70">{children}</span>
      </dd>
    </div>
  )
}

/** Padding around the spotlit element, in px. */
const HALO = 8
/** Gap between the spotlight and the card. */
const GAP = 14
/** Minimum breathing room against the viewport edges. */
const MARGIN = 16

interface Spotlight {
  top: number
  left: number
  width: number
  height: number
}

interface CardPos {
  /** Absent = centred in the viewport. */
  top?: number
  maxHeight: number
}

export function Onboarding() {
  const hasSeen = useAppStore((s) => s.hasSeenOnboarding)
  const screen = useAppStore((s) => s.screen)
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const reduceMotion = useReducedMotion()

  const [index, setIndex] = useState(0)
  const [spot, setSpot] = useState<Spotlight | null>(null)
  const [pos, setPos] = useState<CardPos>({ maxHeight: 9999 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Only runs on the dashboard: every target lives there.
  const active = !hasSeen && screen.name === 'dashboard'
  const step = STEPS[index]
  const isLast = index === STEPS.length - 1

  const measure = useCallback(() => {
    const vh = window.innerHeight
    const el = step?.target?.()
    if (!el) {
      setSpot(null)
      setPos({ maxHeight: vh - MARGIN * 2 })
      return
    }
    const r = el.getBoundingClientRect()
    const top = r.top - HALO
    const bottom = r.bottom + HALO
    setSpot({ top, left: r.left - HALO, width: r.width + HALO * 2, height: r.height + HALO * 2 })

    // Always take the roomier side, and cap the card to that room. Both are
    // derived from geometry alone — never from the card's own height — so the
    // cap can't feed back into the measurement and oscillate. On a short screen
    // the card scrolls internally rather than sitting on top of the thing it is
    // pointing at.
    const roomBelow = vh - bottom - GAP - MARGIN
    const roomAbove = top - GAP - MARGIN
    const below = roomBelow >= roomAbove
    const room = Math.max(200, below ? roomBelow : roomAbove)
    const cardH = Math.min(cardRef.current?.offsetHeight ?? 320, room)
    const desired = below ? bottom + GAP : top - GAP - cardH
    setPos({ top: Math.min(Math.max(desired, MARGIN), Math.max(MARGIN, vh - MARGIN - cardH)), maxHeight: room })
  }, [step])

  useLayoutEffect(() => {
    if (!active) return
    // Park the target in the upper third rather than centring it, so there is
    // reliably room for the card underneath. Fixed elements (the FAB, the
    // settings button) can't be scrolled, so don't try.
    const el = step?.target?.()
    if (el && getComputedStyle(el).position !== 'fixed') {
      const delta = el.getBoundingClientRect().top - Math.min(120, window.innerHeight * 0.18)
      if (Math.abs(delta) > 8) window.scrollBy({ top: delta, behavior: 'smooth' })
    }
    // Measured off a frame rather than inline, then again once the smooth
    // scroll has settled — geometry is only knowable after layout.
    const raf = requestAnimationFrame(measure)
    const t = window.setTimeout(measure, 400)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [active, step, measure])

  const finish = useCallback(() => {
    setIndex(0)
    completeOnboarding()
  }, [completeOnboarding])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        finish()
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        setIndex((i) => (i >= STEPS.length - 1 ? (finish(), i) : i + 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setIndex((i) => Math.max(0, i - 1))
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [active, finish])

  if (!active) return null

  const cardPosition =
    pos.top === undefined ? { top: '50%', transform: 'translateY(-50%)' } : { top: pos.top }

  const slide = reduceMotion ? 0 : 28

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* The scrim is this element's box-shadow, so the target stays lit and
          un-dimmed inside the hole. Pointer events are swallowed by the
          wrapper above, not here. */}
      <motion.div
        key={spot ? 'spot' : 'no-spot'}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          top: spot?.top ?? window.innerHeight / 2,
          left: spot?.left ?? window.innerWidth / 2,
          width: spot?.width ?? 0,
          height: spot?.height ?? 0,
        }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 40 }}
        style={{ boxShadow: '0 0 0 9999px var(--tour-scrim)' }}
        className={cn('pointer-events-none fixed', spot && 'border-2 border-soviet-text')}
      />

      <div ref={cardRef} className="fixed inset-x-4 mx-auto max-w-md" style={cardPosition}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: slide }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -slide }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxHeight: pos.maxHeight }}
            className="flex flex-col border-[3px] border-paper bg-ink text-paper shadow-[0_32px_80px_-24px_rgba(0,0,0,0.85)]"
          >
            <div className="flex shrink-0 items-center justify-between border-b-[3px] border-paper px-4 py-2">
              <span className="font-mono font-semibold text-label tracking-[0.25em] text-paper/70">CLASSIFIED BRIEFING</span>
              <span className="font-mono font-semibold text-label tabular tracking-[0.2em] text-soviet-text">
                {index + 1} / {STEPS.length}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-4">
              <div className="flex items-center gap-2.5">
                <step.Icon size={16} className="shrink-0 text-soviet-text" strokeWidth={2.25} />
                <span className="font-mono font-semibold text-label tracking-[0.25em] text-paper/70">{step.meta}</span>
              </div>
              <h2 id="tour-title" className="mt-2 text-3xl font-black uppercase leading-[0.95] tracking-tighter text-balance">
                {step.title}
              </h2>
              <div className="mt-3 text-sm leading-relaxed text-paper/80">{step.body}</div>
            </div>

            {isLast ? (
              <button
                type="button"
                onClick={finish}
                className="w-full shrink-0 border-t-[3px] border-paper bg-soviet py-4 font-mono text-xs font-bold tracking-[0.25em] text-[#f4f1ea] transition-colors active:bg-soviet-deep"
              >
                COMMENCE TRAINING
              </button>
            ) : (
              <div className="grid shrink-0 grid-cols-[auto_1fr] border-t-[3px] border-paper">
                <button
                  type="button"
                  onClick={finish}
                  className="px-5 py-4 font-mono text-xs font-bold tracking-[0.25em] text-paper/70 transition-colors active:bg-paper/10"
                >
                  SKIP
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => i + 1)}
                  className="border-l-[3px] border-paper bg-soviet py-4 font-mono text-xs font-bold tracking-[0.25em] text-[#f4f1ea] transition-colors active:bg-soviet-deep"
                >
                  NEXT
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
