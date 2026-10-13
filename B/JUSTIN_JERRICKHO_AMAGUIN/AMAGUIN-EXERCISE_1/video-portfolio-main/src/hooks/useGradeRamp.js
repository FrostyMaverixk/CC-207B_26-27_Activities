import { useEffect } from 'react';
import {
  getScrollProgress,
  subscribeScrollProgress,
} from './useScrollProgress';
import { useReducedMotion } from './useReducedMotion';

/* Owner override 2026-06-28: the hero read as "washed out" on first load, so the
   grade-in is disabled — the page starts fully graded (filter stays `none`).
   Flip GRADE_IN back to true to restore the Phase 4 task 2 log→graded ramp. */
const GRADE_IN = false;

/* Ungraded "log" start values (Phase 4 task 2): washed-out saturation, soft
   contrast, slightly lifted brightness, ramping to neutral over the first
   1.2 × innerHeight of scroll. */
const SAT_0 = 0.42;
const CON_0 = 0.84;
const BRI_0 = 1.06;
const RAMP_VIEWPORTS = 1.2;

/**
 * The scroll-grade effect: #grade-root carries a `filter` that interpolates
 * from log to graded as the user scrolls the first ~viewport. When the ramp
 * completes the filter is set to `none` (steady-state perf — no composited
 * filter at rest) and re-applied only if the user scrolls back up.
 *
 * Reduced motion or Save-Data → permanently graded (filter stays `none`).
 * Rides the existing scroll-engine rAF via subscription — no extra listener.
 * Global Rule 7 is why the fixed chrome lives OUTSIDE #grade-root: a filter
 * on an ancestor breaks position: fixed on descendants.
 */
export function useGradeRamp() {
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = document.getElementById('grade-root');
    if (!root) return undefined;

    const saveData = navigator.connection?.saveData === true;
    if (!GRADE_IN || reduced || saveData) {
      root.style.filter = 'none';
      return undefined;
    }

    let wasComplete = null; // tri-state so we only touch style on transitions

    const apply = () => {
      const t = Math.min(1, window.scrollY / (window.innerHeight * RAMP_VIEWPORTS));
      const complete = t >= 1;
      if (complete) {
        if (wasComplete !== true) root.style.filter = 'none';
        wasComplete = true;
        return;
      }
      wasComplete = false;
      const sat = SAT_0 + t * (1 - SAT_0);
      const con = CON_0 + t * (1 - CON_0);
      const bri = BRI_0 + t * (1 - BRI_0);
      root.style.filter = `saturate(${sat.toFixed(3)}) contrast(${con.toFixed(3)}) brightness(${bri.toFixed(3)})`;
    };

    apply(getScrollProgress());
    const unsubscribe = subscribeScrollProgress(apply);
    return () => {
      unsubscribe();
      root.style.filter = '';
    };
  }, [reduced]);
}
