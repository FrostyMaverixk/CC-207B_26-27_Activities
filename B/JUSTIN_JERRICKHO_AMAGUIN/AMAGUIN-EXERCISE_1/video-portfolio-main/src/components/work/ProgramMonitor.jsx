import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { asset } from '../../lib/asset';
import { register, unregister, play } from '../../lib/playback';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import OfflineSlate from './OfflineSlate';
import WipeCompare from './WipeCompare';
import Transport from './Transport';
import styles from './ProgramMonitor.module.css';

/**
 * The program monitor (§3B.3) — modal via createPortal(document.body), so it
 * sits outside #grade-root (Global Rule 7).
 *
 * Behavior: focus trapped inside (Escape / scrim click / ✕ close), body
 * scroll locked with scrollbar-gutter compensation, video registered with the
 * playback manager (autoplay on open silences the hero; the hero resumes on
 * the 'pgm-close' event fired at unmount). Video error → in-monitor
 * OfflineSlate. When `project.raw` exists a RAW ⇄ GRADE toggle swaps between
 * normal playback (with audio) and the WipeCompare.
 *
 * Focus return to the originating strip is handled by WorkBin's close().
 *
 * @param {Object} props
 * @param {import('../../data/projects').Project} props.project
 * @param {() => void} props.onClose
 */
export default function ProgramMonitor({ project, onClose }) {
  const panelRef = useRef(null);
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [compare, setCompare] = useState(false);

  useFocusTrap(panelRef, true);

  // Escape closes (document-level: works wherever focus sits in the trap).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Body scroll lock + scrollbar-gutter compensation.
  useEffect(() => {
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, []);

  // Register + autoplay the program video (pauses the hero — Global Rule 8).
  // In compare mode the WipeCompare manages its own pair.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    register(v);
    play(v)?.catch(() => {});
    return () => unregister(v);
  }, [compare, videoFailed]);

  // Tell the hero it can resume once the monitor unmounts.
  useEffect(
    () => () => window.dispatchEvent(new Event('pgm-close')),
    [],
  );

  const onScrimPointerDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const metaRows = [
    ['RUNTIME', project.runtime],
    ['ROLE', project.role],
    ['CUTS', project.cuts != null ? String(project.cuts) : null],
    ['YEAR', project.year != null ? String(project.year) : null],
    ['TOOLS', project.tools?.join(' · ')],
  ].filter(([, value]) => value);

  return createPortal(
    <div className={styles.scrim} onPointerDown={onScrimPointerDown}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={project.filename}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <span className={styles.filename}>{project.filename}</span>
          {project.raw && !videoFailed && (
            <button
              type="button"
              className={`${styles.compareToggle} ${compare ? styles.compareOn : ''}`}
              aria-pressed={compare}
              onClick={() => setCompare((c) => !c)}
            >
              RAW ⇄ GRADE
            </button>
          )}
          <button
            type="button"
            className={styles.close}
            aria-label="Close monitor"
            data-autofocus
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <div className={styles.screen}>
          {videoFailed ? (
            <OfflineSlate path={project.video} fill />
          ) : compare ? (
            <WipeCompare project={project} />
          ) : (
            <video
              ref={videoRef}
              className={styles.video}
              src={asset(project.video)}
              poster={asset(project.poster)}
              playsInline
              preload="metadata"
              onError={() => setVideoFailed(true)}
            />
          )}
        </div>

        {!videoFailed && !compare && (
          <Transport videoRef={videoRef} panelRef={panelRef} />
        )}

        <footer className={styles.meta}>
          {metaRows.map(([key, value]) => (
            <div key={key} className={styles.metaItem}>
              <span className={styles.metaKey}>{key}</span>
              <span className={styles.metaValue}>{value}</span>
            </div>
          ))}
          {project.description && (
            <p className={styles.description}>{project.description}</p>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
