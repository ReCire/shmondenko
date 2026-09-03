# Shmondenko — Soviet Periodisation Workout Timer

Mobile-first React PWA-style workout timer. Vite + React 19 + TypeScript, Tailwind v4 (via `@tailwindcss/vite`), Framer Motion, Zustand (persisted to localStorage), lucide-react.

## Commands

- `npm run dev` — dev server (http://localhost:5173)
- `npm run build` — `tsc -b && vite build` (typecheck + production bundle)
- `npm run lint` — oxlint

## Layout

- `src/data/` — types + `STOCK_WORKOUTS` (Shmondenko Accumulation / Intensification / Realization split)
- `src/store/useAppStore.ts` — Zustand store: screen routing, custom workouts, completion logs, sound toggle. Persisted under localStorage key `shmondenko-fitness-v1` (screen is not persisted).
- `src/hooks/useWorkoutTimer.ts` — flattens a workout into work/rest steps, drives a rAF clock, exposes `progress` as a Framer `MotionValue` (no per-frame React re-renders), handles pause/skip/back/loop/completion + audio cues. Uses `navigator.wakeLock` while running.
- `src/lib/audio.ts` — Web Audio beeps + `navigator.vibrate` cues. `unlockAudio()` must run from a user gesture (called in `start()`).
- `src/lib/utils.ts` — streak math (`computeStreak`), current phase detection (`computeCurrentPhase`), clock formatting, ids.
- `src/components/` — `Dashboard`, `WorkoutCard`, `WorkoutCreator`, `WorkoutPlayer`.

## Phase detection

`computeCurrentPhase(logs)` returns the user's current Soviet block based on days since their first logged workout:

- 0–28 days → `accumulation`
- 29–56 days → `intensification`
- 57+ days → `realization`

The Dashboard highlights stock workouts matching this phase with a `CURRENT PHASE` badge.

## Player fill technique

`WorkoutPlayer` renders the scene twice: light type on the dark base, and ink type inside a full-screen gradient layer. The gradient layer is an `overflow:hidden` window translated by `(1 - progress) * 100%` with its content counter-translated, so the gradient rises bottom→top and text inverts exactly at the fill line. Both transforms are compositor-only.

## Verification

Headless Chrome enforces a ~500px minimum window width, so `--window-size=390,...` screenshots are cropped, not laid out at 390. Use `Emulation.setDeviceMetricsOverride` over CDP, or render inside a 390px iframe, to preview mobile layout.
