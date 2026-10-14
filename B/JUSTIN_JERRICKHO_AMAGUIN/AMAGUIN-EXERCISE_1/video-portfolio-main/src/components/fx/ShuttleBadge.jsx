import styles from './ShuttleBadge.module.css';

/**
 * The shuttle speed readout (Phase 6 task 4) — a mono badge floating just
 * above the timeline nav while J-K-L shuttling: `▶▶ 2×` / `◀ 1×`. Purely
 * visual feedback for a keyboard gesture, so it's hidden from the
 * accessibility tree.
 *
 * @param {Object} props
 * @param {number} props.velocity  current shuttle velocity (−4..4, 0 = hidden)
 */
export default function ShuttleBadge({ velocity }) {
  if (!velocity) return null;
  const speed = Math.abs(velocity);
  const glyph = velocity > 0 ? (speed > 1 ? '▶▶' : '▶') : speed > 1 ? '◀◀' : '◀';
  return (
    <div className={styles.badge} aria-hidden="true">
      {glyph} {speed}×
    </div>
  );
}
