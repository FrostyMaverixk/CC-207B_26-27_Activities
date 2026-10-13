import styles from './MeterList.module.css';

/**
 * Software levels as audio-meter bars (Phase 4 task 8): each row = name,
 * horizontal meter (track --bg-2; fill is teal with the top 15% of the SCALE
 * going orange, like a meter near clipping), and a micro note. The gradient
 * spans the full track and the fill is revealed by clip-path, so the orange
 * zone only lights up on levels that actually reach it.
 *
 * @param {Object} props
 * @param {{name: string, level: number, note: string}[]} props.software
 */
export default function MeterList({ software }) {
  return (
    <ul role="list" className={styles.list}>
      {software.map(({ name, level, note }) => (
        <li key={name} className={styles.row}>
          <span className={styles.name}>{name}</span>
          <span
            className={styles.meter}
            role="img"
            aria-label={`${name} level ${Math.round(level * 100)}%`}
          >
            <span
              className={styles.fill}
              style={{ clipPath: `inset(0 ${100 - level * 100}% 0 0)` }}
            />
          </span>
          <span className={styles.note}>{note}</span>
        </li>
      ))}
    </ul>
  );
}
