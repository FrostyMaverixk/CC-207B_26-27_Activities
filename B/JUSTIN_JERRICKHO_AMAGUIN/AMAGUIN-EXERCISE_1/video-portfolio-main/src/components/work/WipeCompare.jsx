import { useEffect, useRef, useState } from 'react';
import { asset } from '../../lib/asset';
import { register, unregister, play } from '../../lib/playback';
import styles from './WipeCompare.module.css';

/**
 * Raw-vs-grade wipe (§3B.4) — only reachable when `project.raw` exists.
 * Two stacked muted videos: raw underneath, final on top clipped to the left
 * of the wipe line via `clip-path: inset(0 calc(100% - var(--wipe)) 0 0)`.
 *
 * Sync contract: play/pause drive both; on each final `timeupdate`, if the
 * pair drifts > 0.08s the raw is reseeked. Only the final registers with the
 * playback manager — the raw is its muted slave, the pair is one program.
 *
 * The wipe position lives in a CSS var + slider aria attrs (direct DOM
 * writes — no state per pointer move). Handle: pointer drag + ←/→ keys.
 *
 * @param {Object} props
 * @param {import('../../data/projects').Project} props.project
 */
export default function WipeCompare({ project }) {
  const wrapRef = useRef(null);
  const handleRef = useRef(null);
  const rawRef = useRef(null);
  const finalRef = useRef(null);
  const wipeRef = useRef(50);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const final = finalRef.current;
    const raw = rawRef.current;
    if (!final || !raw) return undefined;

    register(final);
    play(final)?.catch(() => {});
    raw.play()?.catch(() => {});

    const onTime = () => {
      if (Math.abs(raw.currentTime - final.currentTime) > 0.08) {
        raw.currentTime = final.currentTime;
      }
    };
    const onPlay = () => {
      raw.play()?.catch(() => {});
      setPlaying(true);
    };
    const onPause = () => {
      raw.pause();
      setPlaying(false);
    };
    final.addEventListener('timeupdate', onTime);
    final.addEventListener('play', onPlay);
    final.addEventListener('pause', onPause);

    return () => {
      final.removeEventListener('timeupdate', onTime);
      final.removeEventListener('play', onPlay);
      final.removeEventListener('pause', onPause);
      unregister(final);
    };
  }, []);

  const setWipe = (pct) => {
    const clamped = Math.min(100, Math.max(0, pct));
    wipeRef.current = clamped;
    wrapRef.current?.style.setProperty('--wipe', `${clamped}%`);
    handleRef.current?.setAttribute('aria-valuenow', String(Math.round(clamped)));
  };

  const onHandlePointerDown = (e) => {
    e.stopPropagation();
    handleRef.current.setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e) => {
    if (!handleRef.current.hasPointerCapture?.(e.pointerId)) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setWipe(((e.clientX - rect.left) / rect.width) * 100);
  };

  const onHandleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setWipe(wipeRef.current - 2);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setWipe(wipeRef.current + 2);
    }
  };

  const togglePlay = () => {
    const final = finalRef.current;
    if (!final) return;
    if (final.paused) play(final)?.catch(() => {});
    else final.pause();
  };

  return (
    <div className={styles.frame} ref={wrapRef}>
        <video
          ref={rawRef}
          className={styles.video}
          src={asset(project.raw)}
          muted
          playsInline
          preload="metadata"
        />
        <video
          ref={finalRef}
          className={`${styles.video} ${styles.final}`}
          src={asset(project.video)}
          poster={asset(project.poster)}
          muted
          playsInline
          preload="metadata"
        />
        <span className={`${styles.corner} ${styles.cornerLeft}`}>
          GRADE · NODE 12
        </span>
        <span className={`${styles.corner} ${styles.cornerRight}`}>
          LOG · BYPASS
        </span>
        <div
          ref={handleRef}
          className={styles.handle}
          role="slider"
          tabIndex={0}
          aria-label="Wipe position"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onKeyDown={onHandleKeyDown}
        >
          <span className={styles.grip} aria-hidden="true">
            ⟨⟩
          </span>
        </div>
        <button
          type="button"
          className={styles.playToggle}
          onClick={togglePlay}
          aria-label={playing ? 'Pause comparison' : 'Play comparison'}
        >
          {playing ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
      </div>
  );
}
