/**
 * Notification chime generated with the Web Audio API.
 * No audio asset is shipped: nothing to 404, nothing to preload, and the tone
 * can be shaped per session type.
 */

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  if (!context) {
    try {
      context = new Ctor();
    } catch {
      return null;
    }
  }
  return context;
}

/**
 * Browsers only allow audio after a user gesture. Call this from a click/keypress
 * so the context is ready when a session later ends in a background tab.
 */
export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume().catch(() => undefined);
  }
}

function tone(ctx: AudioContext, freq: number, startAt: number, duration: number, gain: number) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startAt);
  env.gain.setValueAtTime(0, startAt);
  env.gain.linearRampToValueAtTime(gain, startAt + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(env);
  env.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Warm three-note arpeggio when focus ends, softer two-note when a break ends. */
export function playChime(kind: 'focusEnd' | 'breakEnd'): void {
  const ctx = getContext();
  if (!ctx) return;
  const start = () => {
    const t = ctx.currentTime + 0.02;
    if (kind === 'focusEnd') {
      tone(ctx, 587.33, t, 0.5, 0.16); // D5
      tone(ctx, 783.99, t + 0.13, 0.5, 0.14); // G5
      tone(ctx, 1046.5, t + 0.26, 0.7, 0.11); // C6
    } else {
      tone(ctx, 783.99, t, 0.45, 0.13); // G5
      tone(ctx, 523.25, t + 0.15, 0.6, 0.12); // C5
    }
  };
  if (ctx.state === 'suspended') {
    void ctx
      .resume()
      .then(start)
      .catch(() => undefined);
    return;
  }
  start();
}
