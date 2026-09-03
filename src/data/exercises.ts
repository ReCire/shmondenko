export interface ExerciseInfo {
  name: string
  category: string
  muscles: string[]
  description: string
  setup: string[]
  execution: string[]
  breathing?: string
  commonMistakes: string[]
  safety?: string[]
  easier?: string[]
  harder?: string[]
  cues?: string[]
  media?: {
    type: 'image' | 'animation'
    src: string
    alt: string
  }
}

export const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()

export const EXERCISES: ExerciseInfo[] = [
  {
    name: 'Pike Push-Ups',
    category: 'Bodyweight',
    muscles: ['Shoulders', 'Triceps'],
    description: 'An overhead pressing movement that uses a pike position to load the shoulders with bodyweight.',
    setup: ['Start in a high plank.', 'Walk your feet toward your hands.', 'Raise your hips into an inverted V.'],
    execution: ['Bend the elbows.', 'Lower your head diagonally toward the floor.', 'Press through the palms to return.'],
    breathing: 'Inhale on the way down, exhale as you press up.',
    commonMistakes: ['Flaring the elbows wide.', 'Dropping straight down instead of forward.'],
    safety: ['Stop if you feel shoulder impingement.', 'Keep the neck neutral.'],
    easier: ['Pike Push-Ups on an elevated surface.', 'Downward dog hold.'],
    harder: ['Elevated Pike Push-Ups', 'Handstand Push-Ups'],
    cues: ['Keep hips high.', 'Lower forward.', 'Elbows track back.'],
  },
]

const lookup = new Map<string, ExerciseInfo>()
for (const ex of EXERCISES) {
  lookup.set(normalizeName(ex.name), ex)
}

export function getExerciseInfo(name: string): ExerciseInfo | null {
  return lookup.get(normalizeName(name)) ?? null
}

export function getExerciseInfoOrFallback(name: string): ExerciseInfo {
  return (
    getExerciseInfo(name) ?? {
      name,
      category: 'UNKNOWN',
      muscles: [],
      description: '',
      setup: [],
      execution: [],
      commonMistakes: [],
      safety: [],
      easier: [],
      harder: [],
      cues: [],
    }
  )
}
