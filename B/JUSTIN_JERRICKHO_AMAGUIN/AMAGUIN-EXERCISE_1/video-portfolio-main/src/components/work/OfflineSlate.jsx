import styles from './OfflineSlate.module.css';

/**
 * The red MEDIA OFFLINE state (Global Rule 6) — rendered wherever an
 * image/video 404s: as a bin row replacement and inside the program monitor.
 * It prints the expected public path so dropping the file in is self-evident.
 * This is the intentional pre-media dev look; it must read as deliberate.
 * Empty tracks reuse it as a deliberate lost-media slate via `note`.
 *
 * @param {Object} props
 * @param {string} [props.path]   expected asset path (e.g. project.video)
 * @param {string} [props.note]   custom subline replacing the relink path
 * @param {boolean} [props.fill]  true → fill parent (monitor 16:9 area);
 *                                false → bin-row height
 */
export default function OfflineSlate({ path, note, fill = false }) {
  return (
    <div className={`${styles.slate} ${fill ? styles.fill : styles.row}`}>
      <span className={styles.title}>MEDIA OFFLINE</span>
      <span className={styles.path}>{note ?? `relink: public/${path}`}</span>
    </div>
  );
}
