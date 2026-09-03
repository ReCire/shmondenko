/**
 * Minimal Web Audio beeper. The AudioContext is created lazily and must be
 * unlocked from a user gesture (we call `unlock()` from the Start button).
 */
let ctx: AudioContext | null = null

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

export const unlockAudio = async (): Promise<void> => {
  const c = getContext()
  if (!c) return
  // On mobile browsers the context can be 'suspended' or 'interrupted' after a
  // user gesture or backgrounding. Resume whenever it is not already running.
  if (c.state !== 'running' && c.state !== 'closed') {
    try {
      await c.resume()
    } catch {
      /* ignore — browser refused without gesture */
    }
  }
}

// Re-attempt to resume the audio context when the tab returns to the
// foreground — it may have been suspended while the app was backgrounded.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void unlockAudio()
  })
}

interface BeepOptions {
  frequency?: number
  duration?: number
  volume?: number
  type?: OscillatorType
}

export const beep = ({ frequency = 880, duration = 0.12, volume = 0.25, type = 'square' }: BeepOptions = {}): void => {
  const c = getContext()
  if (!c || c.state !== 'running') return
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = frequency
  const t = c.currentTime
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

export const vibrate = (pattern: number | number[]): void => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      /* unsupported */
    }
  }
}

/** "3... 2... 1..." — short tick. */
export const cueCountdown = (): void => {
  beep({ frequency: 880, duration: 0.1 })
  vibrate(40)
}

/** Long BEEP when work ends and rest begins. */
export const cueWorkEnd = (): void => {
  beep({ frequency: 523, duration: 0.45, volume: 0.3, type: 'sawtooth' })
  vibrate([80, 40, 80])
}

/** Sharp high tone when rest ends and the next exercise begins. */
export const cueWorkStart = (): void => {
  beep({ frequency: 1318, duration: 0.35, volume: 0.3 })
  vibrate(120)
}

/** Triumphant two-tone when the workout completes. */
export const cueComplete = (): void => {
  beep({ frequency: 784, duration: 0.2 })
  setTimeout(() => beep({ frequency: 1175, duration: 0.5, volume: 0.3 }), 180)
  vibrate([100, 60, 100, 60, 240])
}
