import styles from './GrainOverlay.module.css';

/**
 * Film grain (§3.3): a fixed full-viewport layer tiled with an inline SVG
 * feTurbulence noise (~140px tile), opacity 0.05, mix-blend-mode overlay,
 * stepped through 6 background positions at 12 steps/s via steps() keyframes.
 * Static (animation off, grain stays) under reduced motion — handled in CSS.
 * Sits above content, below the nav/modal (z-grain). Sibling of #grade-root.
 */
export default function GrainOverlay() {
  return <div className={styles.grain} aria-hidden="true" />;
}
