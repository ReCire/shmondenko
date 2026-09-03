import type { ExerciseBlock, Workout } from './types'

const timeBlock = (id: string, name: string, workSeconds: number, restSeconds: number, sets: number): ExerciseBlock => ({
  id,
  name,
  mode: 'time',
  workSeconds,
  reps: 0,
  restSeconds,
  sets,
})

const repBlock = (id: string, name: string, reps: number, restSeconds: number, sets: number): ExerciseBlock => ({
  id,
  name,
  mode: 'reps',
  workSeconds: 0,
  reps,
  restSeconds,
  sets,
})

const workout = (
  id: string,
  name: string,
  subtitle: string,
  focus: string,
  phase: Workout['phase'],
  blocks: ExerciseBlock[],
): Workout => ({
  id,
  name,
  subtitle,
  focus,
  phase,
  loop: false,
  isStock: true,
  blocks,
})

/**
 * The Shmondenko Periodisation split.
 * Accumulation = Volume & Form (0–28 days)
 * Intensification = Strength & CNS (29–56 days)
 * Realization = Peak Power (57+ days)
 */
export const STOCK_WORKOUTS: Workout[] = [
  // ACCUMULATION (Weeks 1-4)
  workout(
    'stock-acc-push',
    'Day 1 — Push',
    'Accumulation · Heavy',
    'Heavy Pressing Volume',
    'accumulation',
    [
      repBlock('acc-p1', 'Flat Barbell Bench Press', 5, 120, 5),
      repBlock('acc-p2', 'Standing Overhead Press', 6, 90, 4),
      repBlock('acc-p3', 'Weighted Dips', 8, 90, 4),
      repBlock('acc-p4', 'Landmine Press', 10, 60, 3),
      repBlock('acc-p5', 'Barbell Skullcrushers', 12, 60, 3),
      timeBlock('acc-p6', 'Heavy Farmer Carries', 40, 90, 3),
    ],
  ),
  workout(
    'stock-acc-pull',
    'Day 2 — Pull',
    'Accumulation · Light & Volume',
    'Back & Biceps Volume',
    'accumulation',
    [
      repBlock('acc-l1', 'Weighted Pull-Ups', 10, 90, 4),
      repBlock('acc-l2', 'Strict Barbell Rows', 12, 60, 4),
      repBlock('acc-l3', 'Face Pulls', 15, 45, 3),
      repBlock('acc-l4', 'DB Hammer Curls', 15, 45, 3),
      timeBlock('acc-l5', 'Dead Hangs', 60, 60, 3),
    ],
  ),
  workout(
    'stock-acc-legs',
    'Day 3 — Legs',
    'Accumulation · Explosive',
    'Explosive Leg Power',
    'accumulation',
    [
      repBlock('acc-s1', 'Power Cleans', 3, 120, 4),
      repBlock('acc-s2', 'Weighted Jump Squats', 10, 60, 3),
      repBlock('acc-s3', 'Walking Lunges', 20, 60, 3),
      repBlock('acc-s4', 'Pistol Squats', 8, 60, 3),
    ],
  ),

  // INTENSIFICATION (Weeks 5-8)
  workout(
    'stock-int-push',
    'Day 1 — Push',
    'Intensification · Strength',
    'Heavy Load Pressing',
    'intensification',
    [
      repBlock('int-p1', 'Heavy Bench Press', 3, 180, 6),
      repBlock('int-p2', 'Push Press', 4, 150, 5),
      repBlock('int-p3', 'Close-Grip Bench', 5, 120, 5),
      repBlock('int-p4', 'Weighted Dips', 6, 120, 4),
      timeBlock('int-p5', 'Overhead Carry', 45, 90, 3),
    ],
  ),
  workout(
    'stock-int-pull',
    'Day 2 — Pull',
    'Intensification · Strength',
    'Heavy Back & Hinge',
    'intensification',
    [
      repBlock('int-l1', 'Weighted Pull-Ups', 5, 180, 5),
      repBlock('int-l2', 'Pendlay Rows', 5, 150, 5),
      repBlock('int-l3', 'Barbell Shrugs', 8, 120, 4),
      repBlock('int-l4', 'Barbell Curls', 8, 90, 4),
      repBlock('int-l5', 'Rack Deadlifts', 4, 180, 4),
    ],
  ),
  workout(
    'stock-int-legs',
    'Day 3 — Legs',
    'Intensification · Strength',
    'Maximal Leg Load',
    'intensification',
    [
      repBlock('int-s1', 'Front Squats', 4, 180, 5),
      repBlock('int-s2', 'Conventional Deadlifts', 3, 240, 5),
      repBlock('int-s3', 'Bulgarian Split Squats', 8, 120, 3),
      repBlock('int-s4', 'Barbell Hip Thrusts', 8, 120, 3),
      repBlock('int-s5', 'Standing Calf Raises', 12, 90, 4),
    ],
  ),

  // REALIZATION (Weeks 9+)
  workout(
    'stock-real-push',
    'Day 1 — Upper Power',
    'Realization · Peak Power',
    'Maximal Upper Output',
    'realization',
    [
      repBlock('rea-p1', 'Bench Heavy Singles', 1, 240, 6),
      repBlock('rea-p2', 'Push Jerks', 2, 180, 5),
      repBlock('rea-p3', 'Explosive Push-Ups', 8, 90, 3),
      timeBlock('rea-p4', 'Medicine Ball Throws', 20, 120, 3),
      repBlock('rea-p5', 'Weighted Dips', 5, 120, 3),
    ],
  ),
  workout(
    'stock-real-pull',
    'Day 2 — Posterior Power',
    'Realization · Peak Power',
    'Maximal Pull & Hinge Output',
    'realization',
    [
      repBlock('rea-l1', 'Deadlift Heavy Singles', 1, 300, 6),
      repBlock('rea-l2', 'Power Cleans', 2, 180, 5),
      repBlock('rea-l3', 'Weighted Pull-Ups', 4, 120, 4),
      repBlock('rea-l4', 'Barbell Rows', 5, 90, 3),
      timeBlock('rea-l5', 'Sled Pulls', 30, 180, 3),
    ],
  ),
  workout(
    'stock-real-legs',
    'Day 3 — Lower Power',
    'Realization · Peak Power',
    'Maximal Leg Output',
    'realization',
    [
      repBlock('rea-s1', 'Squat Heavy Singles', 1, 240, 6),
      repBlock('rea-s2', 'Jump Squats', 5, 120, 4),
      repBlock('rea-s3', 'Power Cleans', 2, 180, 4),
      timeBlock('rea-s4', 'Sled Pushes', 30, 180, 3),
      repBlock('rea-s5', 'Broad Jumps', 6, 120, 3),
    ],
  ),
]
