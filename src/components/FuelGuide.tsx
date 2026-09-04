import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const list = { animate: { transition: { staggerChildren: 0.06 } } }
const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
}

/** Static nutrition protocol, styled as a declassified training directive. */
export function FuelGuide() {
  return (
    <motion.article variants={list} initial="initial" animate="animate" className="flex flex-col gap-6">
      {/* Document header */}
      <motion.header variants={item} className="relative border-2 border-paper/80 p-5">
        <span className="absolute -top-2.5 left-4 bg-ink px-2 font-mono font-semibold text-[10px] tracking-[0.25em] text-soviet">
          DIRECTIVE 03 · NUTRITION
        </span>
        <span className="absolute right-4 top-3 -rotate-6 border-2 border-soviet px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.22em] text-soviet">
          DECLASSIFIED
        </span>
        <p className="mt-3 font-mono font-semibold text-[10px] tracking-[0.22em] text-paper/70">ДИРЕКТИВА · ПИТАНИЕ</p>
        <h2 className="mt-2 text-[clamp(1.75rem,8vw,2.5rem)] font-black uppercase leading-[0.9] tracking-tighter text-balance">
          The Shmondenko
          <br />
          Meat-Free Protocol
        </h2>
        <div className="mt-4 flex items-end justify-between border-t border-paper/20 pt-3">
          <div>
            <p className="font-mono font-semibold text-[10px] tracking-[0.22em] text-paper/70">DAILY TARGET</p>
            <p className="whitespace-nowrap text-[clamp(1.5rem,7vw,1.875rem)] font-black tabular tracking-tighter">
              3,200<span className="text-paper/60">–</span>3,500
              <span className="ml-2 font-mono text-xs font-normal tracking-widest text-paper/60">KCAL</span>
            </p>
          </div>
          <p className="max-w-[9rem] text-right font-mono font-semibold text-[9px] leading-relaxed tracking-[0.15em] text-paper/60">
            FOR STRENGTH ATHLETES IN ACCUMULATION & INTENSIFICATION
          </p>
        </div>
      </motion.header>

      {/* Principles */}
      <Clause variants={item} index="§1" title="Principles">
        <ol className="divide-y divide-paper/15 border-y border-paper/15">
          <Principle n="1.1" head="Complete plant proteins">
            Pair legumes with grains at every meal. Soy, quinoa, and buckwheat stand alone.
          </Principle>
          <Principle n="1.2" head="Nut butters">
            Calorie density without volume. Two to four heaped spoons daily, minimum.
          </Principle>
          <Principle n="1.3" head="Heavy carb loading">
            Oats, rice, potatoes, pasta. Glycogen is the fuel of the bar. Do not train empty.
          </Principle>
        </ol>
      </Clause>

      {/* Shake */}
      <Clause variants={item} index="§2" title="The Blender Battle Shake">
        <div className="border border-paper/15">
          <p className="border-b border-paper/15 px-4 py-3 font-mono font-semibold text-[10px] tracking-[0.2em] text-paper/70">
            CONSUME POST-SESSION · OR AS MEAL 2
          </p>
          <ul className="grid grid-cols-2 divide-x divide-y divide-paper/15 font-bold uppercase tracking-tight [&>li:nth-child(-n+2)]:border-t-0 [&>li:nth-child(odd)]:border-l-0">
            <Ingredient qty="120 g" name="Oats" />
            <Ingredient qty="2" name="Bananas" />
            <Ingredient qty="3 tbsp" name="Peanut butter" />
            <Ingredient qty="40 g" name="Plant protein" />
            <Ingredient qty="2 tbsp" name="Flaxseed" />
            <Ingredient qty="500 ml" name="Soy milk / water" />
          </ul>
          <p className="border-t border-paper/15 px-4 py-3 font-mono font-semibold text-[10px] tracking-[0.2em] text-paper/60">
            ≈ 1,100 KCAL · 55 G PROTEIN · BLEND UNTIL SMOOTH
          </p>
        </div>
      </Clause>

      {/* Meals */}
      <Clause variants={item} index="§3" title="Ration Plan">
        <ol className="divide-y divide-paper/15 border-y border-paper/15">
          <Meal time="MIDDAY" name="Quinoa & black bean salad">
            Quinoa, black beans, roasted peppers, pumpkin seeds, olive oil, lime.
          </Meal>
          <Meal time="EVENING" name="Lentil pasta with tofu crumble">
            Red lentil pasta, pan-fried tofu crumble, tomato, garlic, nutritional yeast.
          </Meal>
          <Meal time="LATE NIGHT" name="Cottage or soy yogurt">
            Slow-digesting casein or soy protein before sleep. Add walnuts and honey.
          </Meal>
        </ol>
      </Clause>

      {/* Footer stamp */}
      <motion.footer variants={item} className="flex items-center justify-between border-t border-paper/15 pt-4">
        <p className="font-mono font-semibold text-[9px] tracking-[0.22em] text-paper/55">FOR TRAINING PERSONNEL ONLY</p>
        <p className="font-mono font-semibold text-[9px] tracking-[0.22em] text-paper/55">ФОРМА № 3 · СССР</p>
      </motion.footer>
    </motion.article>
  )
}

/* ---------- Primitives ---------- */

function Clause({
  index,
  title,
  variants,
  children,
}: {
  index: string
  title: string
  variants: typeof item
  children: ReactNode
}) {
  return (
    <motion.section variants={variants}>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-mono text-xs font-bold tracking-widest text-soviet">{index}</span>
        <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
      </div>
      {children}
    </motion.section>
  )
}

function Principle({ n, head, children }: { n: string; head: string; children: ReactNode }) {
  return (
    <li className="flex gap-4 py-3">
      <span className="w-8 shrink-0 pt-0.5 font-mono text-xs tabular text-paper/60">{n}</span>
      <div>
        <p className="text-base font-bold uppercase tracking-tight">{head}</p>
        <p className="mt-1 text-sm leading-relaxed text-paper/60">{children}</p>
      </div>
    </li>
  )
}

function Ingredient({ qty, name }: { qty: string; name: string }) {
  return (
    <li className="flex flex-col gap-0.5 px-4 py-3">
      <span className="font-mono text-[10px] font-normal tabular tracking-[0.2em] text-paper/70">{qty.toUpperCase()}</span>
      <span className="text-sm">{name}</span>
    </li>
  )
}

function Meal({ time, name, children }: { time: string; name: string; children: ReactNode }) {
  return (
    <li className="py-3">
      <p className="font-mono font-semibold text-[10px] tracking-[0.22em] text-paper/70">{time}</p>
      <p className="mt-1 text-base font-bold uppercase tracking-tight">{name}</p>
      <p className="mt-1 text-sm leading-relaxed text-paper/60">{children}</p>
    </li>
  )
}
