import { useEffect } from 'react';

/**
 * The scroll engine — single source of truth for 0..1 page progress (§2).
 *
 * One rAF-throttled scroll/resize listener (installed once by `Bay` via the
 * hook) writes each new progress value to:
 *   (a) a module-level value, read synchronously via `getScrollProgress()`,
 *   (b) the `--scroll-progress` custom property on <html> — the playhead
 *       tracks it with a pure-CSS `translateX(calc(var(--scroll-progress) …))`,
 *   (c) every `subscribeScrollProgress` callback (live timecode readout,
 *       aria-valuenow) — these write straight to the DOM via refs.
 *
 * No React state is touched per scroll frame (Global Rule / perf budget).
 */

let progress = 0;
const subscribers = new Set();

/** @returns {number} current 0..1 scroll progress */
export const getScrollProgress = () => progress;

/**
 * @param {(p: number) => void} fn  called with progress on each scroll frame
 * @returns {() => void} unsubscribe
 */
export function subscribeScrollProgress(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Total scrollable distance of the document (px). */
export const scrollableHeight = () =>
  document.documentElement.scrollHeight - window.innerHeight;

/** Install the engine. Call exactly once, at the page root. */
export function useScrollProgress() {
  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const scrollable = scrollableHeight();
      const p =
        scrollable > 0
          ? Math.min(1, Math.max(0, window.scrollY / scrollable))
          : 0;
      progress = p;
      document.documentElement.style.setProperty('--scroll-progress', String(p));
      subscribers.forEach((fn) => fn(p));
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
