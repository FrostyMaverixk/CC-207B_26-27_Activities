import styles from './Playhead.module.css';

/**
 * The orange playhead: 1px vertical line + ▼ grab handle spanning the nav.
 * Position is pure CSS — a full-width layer shifted by
 * `translateX(calc(var(--scroll-progress) * 100%))`, so it tracks the scroll
 * engine's custom property with zero per-frame JS in this component
 * (the rAF loop in useScrollProgress is the only writer).
 *
 * It is visual-only: dragging is handled by TimelineNav's nav-wide pointer
 * capture (which also gives the mobile strip its ≥44px touch target).
 */
export default function Playhead() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <div className={styles.head}>
        <span className={styles.handle}>▼</span>
      </div>
    </div>
  );
}
