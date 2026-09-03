import type { ExerciseBlock, ProgramTrack, Workout, WorkoutPhase } from './types'

type StockPhase = Exclude<WorkoutPhase, 'custom'>

/** [name, workSeconds, restSeconds, sets] */
type BlockSpec = [string, number, number, number]

const PHASE_META: Record<StockPhase, { numeral: string; title: string; theme: string; focus: string }> = {
  accumulation: { numeral: 'I', title: 'Accumulation', theme: 'Volume & Form', focus: 'High Volume' },
  intensification: { numeral: 'II', title: 'Intensification', theme: 'Strength & CNS', focus: 'Heavy Load' },
  realization: { numeral: 'III', title: 'Realization', theme: 'Peak Power', focus: 'Max Output' },
}

const PROGRAM_PREFIX: Record<ProgramTrack, string> = { home: 'home', outdoors: 'out', gym: 'gym' }

const toBlocks = (id: string, specs: BlockSpec[]): ExerciseBlock[] =>
  specs.map(([name, workSeconds, restSeconds, sets], i) => ({
    id: `${id}-b${i + 1}`,
    name,
    mode: 'time',
    workSeconds,
    reps: 0,
    restSeconds,
    sets,
  }))

const workout = (
  program: ProgramTrack,
  phase: StockPhase,
  day: 1 | 2 | 3,
  emphasis: string,
  specs: BlockSpec[],
): Workout => {
  const meta = PHASE_META[phase]
  const id = `${PROGRAM_PREFIX[program]}-${phase.slice(0, 3)}-${day}`
  return {
    id,
    name: `${meta.title} ${day}`,
    subtitle: `Block ${meta.numeral} · Day ${day} — ${meta.theme}`,
    focus: `${emphasis} · ${meta.focus}`,
    phase,
    program,
    loop: false,
    isStock: true,
    blocks: toBlocks(id, specs),
  }
}

/**
 * The Shmondenko Periodisation Routine.
 *
 * Three mesocycle blocks (Accumulation -> Intensification -> Realization),
 * three training days per block, across three equipment tracks.
 *
 * Track hierarchy:
 *   HOME      - strictly bodyweight, no bars, no weights.
 *   OUTDOORS  - HOME + pull-up / dip bars. No weights.
 *   GYM       - OUTDOORS + barbells, dumbbells, cables, sleds.
 */
export const STOCK_WORKOUTS: Workout[] = [
  /* ------------------------------------------------------------------ */
  /* HOME — zero equipment                                               */
  /* ------------------------------------------------------------------ */
  workout('home', 'accumulation', 1, 'Push Volume', [
    ['Pike Push-Ups', 45, 60, 4],
    ['Slow Tempo Push-Ups', 45, 45, 4],
    ['Diamond Push-Ups', 45, 45, 4],
    ['Chair Dips', 45, 60, 4],
  ]),
  workout('home', 'accumulation', 2, 'Legs & Core', [
    ['Bulgarian Split Squats', 45, 60, 4],
    ['Jump Squats', 45, 60, 4],
    ['Walking Lunges', 45, 45, 4],
    ['Hollow Body Hold', 40, 45, 4],
  ]),
  workout('home', 'accumulation', 3, 'Posterior Chain', [
    ['Superman Holds', 40, 45, 4],
    ['Reverse Snow Angels', 45, 45, 4],
    ['Single-Leg Glute Bridges', 45, 45, 4],
    ['Nordic Curl Negatives', 30, 60, 4],
  ]),

  workout('home', 'intensification', 1, 'Heavy Push', [
    ['Archer Push-Ups', 20, 120, 5],
    ['Pseudo Planche Push-Ups', 20, 90, 5],
    ['Elevated Pike Push-Ups', 20, 90, 5],
    ['Decline Diamond Push-Ups', 15, 90, 4],
  ]),
  workout('home', 'intensification', 2, 'Unilateral Legs', [
    ['Pistol Squat Negatives', 20, 120, 5],
    ['Shrimp Squats', 20, 90, 5],
    ['Sissy Squats', 20, 90, 5],
    ['Single-Leg Wall Sit', 30, 90, 4],
  ]),
  workout('home', 'intensification', 3, 'Core Strength', [
    ['Dragon Flag Negatives', 20, 120, 5],
    ['Floor L-Sit Hold', 15, 90, 5],
    ['Single-Leg Romanian Deadlift', 20, 90, 5],
    ['Copenhagen Plank', 20, 90, 4],
  ]),

  workout('home', 'realization', 1, 'Explosive Push', [
    ['Clap Push-Ups', 15, 90, 3],
    ['Plyo Pike Push-Ups', 15, 90, 3],
    ['Broad Jumps', 15, 120, 3],
    ['Tuck Jumps', 15, 120, 3],
  ]),
  workout('home', 'realization', 2, 'Max Skill Singles', [
    ['One-Arm Push-Up Negatives', 10, 180, 3],
    ['Pistol Squats', 10, 180, 3],
    ['Wall Handstand Hold', 30, 120, 3],
    ['Full Dragon Flag', 10, 180, 3],
  ]),
  workout('home', 'realization', 3, 'Peak Power Circuit', [
    ['Jump Lunges', 20, 90, 3],
    ['Plyo Push-Ups', 15, 90, 3],
    ['Sprawl to Jump', 20, 120, 3],
    ['Squat Jump Holds', 15, 120, 3],
  ]),

  /* ------------------------------------------------------------------ */
  /* OUTDOORS — bodyweight + bars                                        */
  /* ------------------------------------------------------------------ */
  workout('outdoors', 'accumulation', 1, 'Push Volume', [
    ['Strict Bar Dips', 45, 60, 4],
    ['Straight Bar Dips', 45, 60, 4],
    ['Pike Push-Ups', 45, 45, 4],
    ['Diamond Push-Ups', 45, 45, 4],
  ]),
  workout('outdoors', 'accumulation', 2, 'Pull Volume', [
    ['Wide Grip Pull-Ups', 45, 60, 4],
    ['Chin-Ups', 45, 60, 4],
    ['Hanging Leg Raises', 45, 45, 4],
    ['Dead Hangs', 40, 45, 4],
  ]),
  workout('outdoors', 'accumulation', 3, 'Legs & Core', [
    ['Bench Bulgarian Split Squats', 45, 60, 4],
    ['Jump Squats', 45, 60, 4],
    ['Bench Step-Ups', 45, 45, 4],
    ['Hanging Knee Raises', 45, 45, 4],
  ]),

  workout('outdoors', 'intensification', 1, 'Heavy Push', [
    ['Slow Eccentric Bar Dips', 20, 120, 5],
    ['Korean Dips', 20, 90, 5],
    ['Archer Push-Ups', 20, 90, 5],
    ['Pseudo Planche Push-Ups', 15, 90, 4],
  ]),
  workout('outdoors', 'intensification', 2, 'Heavy Pull', [
    ['Archer Pull-Ups', 20, 120, 5],
    ['Chest-to-Bar Pull-Ups', 20, 120, 5],
    ['Tuck Front Lever Hold', 15, 90, 5],
    ['Toes-to-Bar', 20, 90, 4],
  ]),
  workout('outdoors', 'intensification', 3, 'Legs & Skill', [
    ['Bar-Assisted Pistol Squats', 20, 120, 5],
    ['Shrimp Squats', 20, 90, 5],
    ['Skin the Cat', 20, 90, 5],
    ['Hanging Windshield Wipers', 20, 90, 4],
  ]),

  workout('outdoors', 'realization', 1, 'Explosive Bar Work', [
    ['Muscle-Up Transitions', 15, 150, 3],
    ['Explosive Bar Dips', 15, 120, 3],
    ['Plyo Pull-Ups', 15, 120, 3],
    ['Clap Push-Ups', 15, 90, 3],
  ]),
  workout('outdoors', 'realization', 2, 'Max Skill Singles', [
    ['Front Lever Raises', 10, 180, 3],
    ['One-Arm Pull-Up Negatives', 10, 180, 3],
    ['Straight Bar Muscle-Ups', 10, 180, 3],
    ['L-Sit Pull-Ups', 15, 120, 3],
  ]),
  workout('outdoors', 'realization', 3, 'Lower Body Power', [
    ['Broad Jumps', 15, 120, 3],
    ['Bench Depth Jumps', 15, 120, 3],
    ['Jump Lunges', 20, 90, 3],
    ['Sprint Intervals', 20, 120, 3],
  ]),

  /* ------------------------------------------------------------------ */
  /* GYM — full weights                                                  */
  /* ------------------------------------------------------------------ */
  workout('gym', 'accumulation', 1, 'Push Volume', [
    ['Flat Barbell Bench', 45, 60, 4],
    ['Standing OHP', 45, 60, 4],
    ['Bar Dips', 45, 45, 4],
    ['Skullcrushers', 45, 45, 4],
  ]),
  workout('gym', 'accumulation', 2, 'Pull Volume', [
    ['Weighted Pull-Ups', 45, 60, 4],
    ['Barbell Rows', 45, 60, 4],
    ['Face Pulls', 45, 45, 4],
    ['DB Curls', 45, 45, 4],
  ]),
  workout('gym', 'accumulation', 3, 'Leg Volume', [
    ['Back Squats', 45, 60, 4],
    ['Romanian Deadlifts', 45, 60, 4],
    ['Leg Press', 45, 45, 4],
    ['Walking DB Lunges', 45, 45, 4],
  ]),

  workout('gym', 'intensification', 1, 'Heavy Push', [
    ['Heavy Bench Press', 20, 120, 5],
    ['Push Press', 20, 120, 5],
    ['Close-Grip Bench', 20, 90, 5],
    ['Weighted Dips', 15, 90, 4],
  ]),
  workout('gym', 'intensification', 2, 'Heavy Pull', [
    ['Heavy Deadlifts', 20, 150, 5],
    ['Pendlay Rows', 20, 120, 5],
    ['Weighted Chin-Ups', 20, 90, 5],
    ['Seated Cable Rows', 20, 90, 4],
  ]),
  workout('gym', 'intensification', 3, 'Heavy Legs', [
    ['Heavy Back Squats', 20, 150, 5],
    ['Front Squats', 20, 120, 5],
    ['Barbell Hip Thrusts', 20, 90, 5],
    ['Power Cleans', 15, 90, 4],
  ]),

  workout('gym', 'realization', 1, 'Upper Body Power', [
    ['Speed Bench', 15, 120, 3],
    ['Push Jerk', 10, 150, 3],
    ['Plyo Push-Ups', 15, 90, 3],
    ['Med Ball Chest Pass', 15, 90, 3],
  ]),
  workout('gym', 'realization', 2, 'Pull Power', [
    ['Deadlift Heavy Singles', 10, 180, 3],
    ['Power Cleans', 15, 120, 3],
    ['Kettlebell Swings', 20, 90, 3],
    ['Box Jumps', 15, 120, 3],
  ]),
  workout('gym', 'realization', 3, 'Peak Output', [
    ['Squat Heavy Singles', 10, 180, 3],
    ['Jump Squats', 15, 60, 3],
    ['Sled Pushes', 30, 120, 3],
    ['Trap Bar Jumps', 15, 120, 3],
  ]),
]

export const PROGRAM_TRACKS: { key: ProgramTrack; label: string; description: string }[] = [
  { key: 'home', label: 'Home', description: 'Bodyweight only' },
  { key: 'outdoors', label: 'Outdoors', description: 'Calisthenics & bars' },
  { key: 'gym', label: 'Gym', description: 'Full weights' },
]

export const STOCK_PHASES: StockPhase[] = ['accumulation', 'intensification', 'realization']

export const phaseLabel = (phase: StockPhase): string => `${PHASE_META[phase].numeral} · ${PHASE_META[phase].title}`
export const phaseTheme = (phase: StockPhase): string => PHASE_META[phase].theme
