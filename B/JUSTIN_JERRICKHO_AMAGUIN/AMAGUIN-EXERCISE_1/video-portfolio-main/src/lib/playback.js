/**
 * "Only one <video> plays at a time" — module-level singleton (Global Rule 8).
 *
 * Every playable <video> registers on mount and unregisters on unmount.
 * `play(el)` pauses every OTHER registered element before starting `el`, so
 * opening the program monitor silences the hero, and vice versa.
 *
 * The wipe-compare's raw track is intentionally NOT registered — it is a
 * muted, slaved copy of its registered final; the pair counts as one program.
 */

/** @type {Set<HTMLVideoElement>} */
const registry = new Set();

/** @param {HTMLVideoElement} el */
export function register(el) {
  if (el) registry.add(el);
}

/** @param {HTMLVideoElement} el */
export function unregister(el) {
  registry.delete(el);
}

/**
 * Pause everything else, then play `el`.
 * @param {HTMLVideoElement} el
 * @returns {Promise<void>|undefined} the play() promise (caller should catch)
 */
export function play(el) {
  registry.forEach((v) => {
    if (v !== el && !v.paused) v.pause();
  });
  return el?.play?.();
}

/** Pause every registered element. */
export function pauseAll() {
  registry.forEach((v) => {
    if (!v.paused) v.pause();
  });
}
