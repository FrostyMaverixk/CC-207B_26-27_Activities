import { useEffect, useState } from 'react';

/**
 * Reactive `prefers-reduced-motion` reader. Returns `true` when the user has
 * asked the OS to minimize motion — Phase 4 uses this to skip the boot loader,
 * pre-apply the grade, freeze the grain, and disable the cut-flash. Updates live
 * if the setting changes mid-session.
 *
 * @returns {boolean}
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
