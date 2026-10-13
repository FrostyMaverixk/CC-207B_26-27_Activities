import ClipStrip from './ClipStrip';
import OfflineSlate from './OfflineSlate';
import styles from './TrackGroup.module.css';

/**
 * One category lane in the bin: header row (color chip, V# LABEL, count,
 * solo/mute buttons) + its project strips. Visibility is decided by the
 * parent's NLE rule (any solo overrides all mutes); hidden tracks collapse
 * with a cut — the header stays so the state can be toggled back.
 *
 * Tracks with zero projects still render (owner decision, 2026-06-11): the
 * category shows a deliberate lost-media slate row instead of hiding.
 *
 * @param {Object} props
 * @param {import('../../data/projects').Track} props.track
 * @param {import('../../data/projects').Project[]} props.projects
 * @param {{ id: string, solo: boolean, muted: boolean }} props.state
 * @param {boolean} props.visible
 * @param {Function} props.dispatch
 * @param {Function} props.onOpen
 */
export default function TrackGroup({
  track,
  projects,
  state,
  visible,
  dispatch,
  onOpen,
}) {
  const groupClass = [
    styles.group,
    state.solo ? styles.solo : '',
    state.muted ? styles.muted : '',
  ]
    .join(' ')
    .trim();

  return (
    <section className={groupClass} aria-label={`${track.label} track`}>
      <header className={styles.header}>
        <span
          className={styles.chip}
          style={{ background: track.color }}
          aria-hidden="true"
        />
        <span className={styles.title}>
          {track.trackNo} {track.label}
        </span>
        <span className={styles.count}>
          {projects.length} {projects.length === 1 ? 'item' : 'items'}
        </span>
        <button
          type="button"
          className={`${styles.toggle} ${state.solo ? styles.toggleOn : ''}`}
          aria-pressed={state.solo}
          aria-label={`Solo ${track.label}`}
          onClick={() => dispatch({ type: 'toggleSolo', id: track.id })}
        >
          👁
        </button>
        <button
          type="button"
          className={`${styles.toggle} ${state.muted ? styles.toggleOn : ''}`}
          aria-pressed={state.muted}
          aria-label={`Mute ${track.label}`}
          onClick={() => dispatch({ type: 'toggleMute', id: track.id })}
        >
          M
        </button>
      </header>

      {visible && (
        <div className={styles.rows}>
          {projects.length === 0 ? (
            <OfflineSlate
              note={`lost media — no ${track.label.toLowerCase()} clips in the bin yet`}
            />
          ) : (
            projects.map((p) => (
              <ClipStrip key={p.id} project={p} track={track} onOpen={onOpen} />
            ))
          )}
        </div>
      )}
    </section>
  );
}
