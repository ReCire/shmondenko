# Shmondenko — Soviet Periodisation Workout Timer

Mobile-first React PWA-style workout timer. Vite + React 19 + TypeScript, Tailwind v4 (via `@tailwindcss/vite`), Framer Motion, Zustand (persisted to localStorage), lucide-react.

## Commands

- `npm run dev` — dev server (http://localhost:5173)
- `npm run build` — `tsc -b && vite build` (typecheck + production bundle)
- `npm run lint` — oxlint

## Naming

The product is "Shmondenko Periodisation". Never reintroduce the old project codename (the directory name) anywhere in the codebase.

## Layout

- `src/data/` — types + `STOCK_WORKOUTS`: 27 stock workouts = 3 program tracks (`home` ⊂ `outdoors` ⊂ `gym`, by equipment) × 3 phases (Accumulation / Intensification / Realization) × 3 days. `PROGRAM_TRACKS` / `STOCK_PHASES` drive the Dashboard selector and grouping.
- `src/store/useAppStore.ts` — Zustand store: screen routing (dashboard / creator / preview / player / settings), `activeProgram` track, `manualPhaseOverride`, custom workouts, completion logs, sound toggle. Persisted under localStorage key `shmondenko-periodisation-v1` (screen is not persisted).
- `src/hooks/useWorkoutTimer.ts` — flattens a workout into work/rest steps, drives a rAF clock, exposes `progress` as a Framer `MotionValue` (no per-frame React re-renders), handles pause/skip/back/loop/completion + audio cues.
- `src/lib/audio.ts` — Web Audio beeps + `navigator.vibrate` cues. `unlockAudio()` must run from a user gesture (called in `start()`).
- `src/lib/utils.ts` — streak math (`computeStreak`), `computeCurrentPhase(logs, override)` (4-week mesocycles from first log; Settings override wins), clock formatting, ids.
- `src/components/` — `Dashboard` (tabs: stock / custom / fuel), `FuelGuide` (static nutrition directive), `WorkoutCard`, `WorkoutPreview` (session brief; cards route here, then to the player), `WorkoutCreator`, `WorkoutPlayer`, `Settings` (phase override, sound toggle, danger-zone reset).

## Player fill technique

`WorkoutPlayer` renders the scene twice: light type on the dark base, and ink type inside a full-screen gradient layer. The gradient layer is an `overflow:hidden` window translated by `(1 - progress) * 100%` with its content counter-translated, so the gradient rises bottom→top and text inverts exactly at the fill line. Both transforms are compositor-only.

## Verification

Headless Chrome enforces a ~500px minimum window width, so `--window-size=390,...` screenshots are cropped, not laid out at 390. Use `Emulation.setDeviceMetricsOverride` over CDP, or render inside a 390px iframe, to preview mobile layout.
