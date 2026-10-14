import { wavePoints } from '../../lib/waveform';
import styles from './TimelineClip.module.css';

/**
 * One section rendered on the timeline nav, by kind:
 *   'clip'   → filled bar with the section label (V1 lane)
 *   'audio'  → teal bar with a tiny fake waveform (A1 lane)
 *   'marker' → a red marker flag at the boundary, no width (ruler-level)
 *
 * Geometry (left/width as 0..1 fractions of the nav) comes from the parent's
 * boundary math. Pointer handling lives on the nav (capture-drag + tap), so
 * this is presentational: `data-clip` carries the index back to the handler.
 *
 * @param {Object} props
 * @param {import('../../data/sections').Section} props.section
 * @param {number} props.index
 * @param {number} props.left   0..1
 * @param {number} props.width  0..1
 * @param {boolean} props.active
 */
export default function TimelineClip({ section, index, left, width, active }) {
  const pos = { left: `${left * 100}%` };

  if (section.kind === 'marker') {
    return (
      <div
        className={styles.marker}
        style={pos}
        data-clip={index}
        aria-current={active || undefined}
        title={section.label}
      >
        <span className={styles.flag} aria-hidden="true" />
      </div>
    );
  }

  const kindClass = section.kind === 'audio' ? styles.audio : styles.video;
  return (
    <div
      className={`${styles.clip} ${kindClass} ${active ? styles.active : ''}`}
      style={{ ...pos, width: `${width * 100}%` }}
      data-clip={index}
      aria-current={active || undefined}
    >
      {section.kind === 'audio' && (
        <svg
          className={styles.wave}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline points={WAVE_POINTS} />
        </svg>
      )}
      <span className={styles.label}>{section.label}</span>
    </div>
  );
}

/* Fake waveform polyline — seeded constant (§3A: "generated once, seeded
   constant"), shared with the About divider via lib/waveform. */
const WAVE_POINTS = wavePoints(24, 48, 8, 46);
