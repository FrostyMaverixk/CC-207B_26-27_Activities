import { useEffect, useRef } from 'react';
import { CUT_EVENT } from '../../lib/cut';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './CutFlash.module.css';

/**
 * One "flash frame": a full-viewport white overlay that cuts to 10% opacity
 * for ~70ms on the window-level 'cut' event (dispatched via lib/cut.flash()),
 * then cuts back to nothing. No easing — it's a frame, not a fade. Skipped
 * entirely under reduced motion. Sibling of #grade-root (Global Rule 7).
 */
export default function CutFlash() {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return undefined;
    let timer = 0;
    const onCut = () => {
      const el = ref.current;
      if (!el) return;
      el.classList.add(styles.on);
      clearTimeout(timer);
      timer = setTimeout(() => el.classList.remove(styles.on), 70);
    };
    window.addEventListener(CUT_EVENT, onCut);
    return () => {
      window.removeEventListener(CUT_EVENT, onCut);
      clearTimeout(timer);
    };
  }, [reduced]);

  return <div ref={ref} className={styles.flash} aria-hidden="true" />;
}
