import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

const MAX_SPEED = 4;

/**
 * J-K-L page shuttle (Phase 6 task 4) — the editor's transport keys, applied
 * to the whole page. L steps velocity through +1×/+2×/+4×, J the negatives,
 * K stops. Velocity scrolls `window.scrollBy(0, v * innerHeight * 0.8 * dt)`
 * in a rAF loop.
 *
 * Ignored while typing (input/textarea/select/contenteditable) and while the
 * program monitor is open (it has its own J/K/L on the video). Any manual
 * wheel / touch / pointer input cancels the shuttle, as does hitting either
 * end of the document. Disabled entirely under reduced motion.
 *
 * Documented nowhere except the footer hint — it's for editors to find.
 *
 * @returns {number} current shuttle velocity (−4..4, 0 = stopped)
 */
export function useJKLShuttle() {
  const [velocity, setVelocity] = useState(0);
  const reduced = useReducedMotion();

  // If reduced motion turns on mid-session, stop any running shuttle. The
  // reset lives in the media-query callback (an external-system event), not
  // the effect body.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => {
      if (e.matches) setVelocity(0);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Key handling. Velocity is React state — it only changes on key steps
  // (a few times per session), never per scroll frame.
  useEffect(() => {
    if (reduced) return undefined;

    const isTyping = (el) =>
      el instanceof Element &&
      (el.matches('input, textarea, select') || el.isContentEditable);

    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key !== 'j' && key !== 'k' && key !== 'l') return;
      if (isTyping(e.target)) return;
      // the monitor owns J/K/L while it's open
      if (document.querySelector('[aria-modal="true"]')) return;

      if (key === 'k') setVelocity(0);
      else if (key === 'l')
        setVelocity((v) => (v <= 0 ? 1 : Math.min(v * 2, MAX_SPEED)));
      else setVelocity((v) => (v >= 0 ? -1 : Math.max(v * 2, -MAX_SPEED)));
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reduced]);

  // The shuttle loop, (re)started per velocity change.
  useEffect(() => {
    if (!velocity) return undefined;

    let raf = 0;
    let last = performance.now();

    const tick = (now) => {
      // clamp dt so a backgrounded tab doesn't teleport the page on return
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const before = window.scrollY;
      const delta = velocity * window.innerHeight * 0.8 * dt;
      window.scrollBy(0, delta);
      // hit the top/bottom of the document → stop, like K
      if (Math.abs(delta) >= 1 && window.scrollY === before) {
        setVelocity(0);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // any manual scroll input takes the controls back
    const cancel = () => setVelocity(0);
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('pointerdown', cancel, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('pointerdown', cancel, true);
    };
  }, [velocity]);

  return velocity;
}
