import { useEffect, useRef, useState } from 'react';
import { site } from '../../data/siteConfig';
import { secondsToTC } from '../../lib/timecode';
import { play } from '../../lib/playback';
import styles from './Transport.module.css';

/**
 * Custom-lite monitor transport (Phase 4 task 7), replacing the native
 * controls: ▶/⏸, current/duration TC at site.fps, a seek bar styled as a
 * mini-timeline (orange played region), volume, and fullscreen on the panel.
 *
 * J/K/L inside the monitor: L plays (press again → ×2 playbackRate, cap ×4),
 * K pauses, J rewind-scrubs at ×2 while held. Ignored when focus is in a
 * text field. Per-frame TC/seek updates are direct DOM writes off
 * `timeupdate` — no React state per frame; state only flips on play/pause
 * and rate changes.
 *
 * @param {Object} props
 * @param {React.RefObject<HTMLVideoElement>} props.videoRef
 * @param {React.RefObject<HTMLElement>} props.panelRef  fullscreen target
 */
export default function Transport({ videoRef, panelRef }) {
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const currRef = useRef(null);
  const durRef = useRef(null);
  const seekRef = useRef(null);
  const seekingRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;

    const paintSeek = () => {
      const seek = seekRef.current;
      if (!seek || !v.duration) return;
      const p = (v.currentTime / v.duration) * 100;
      if (!seekingRef.current) seek.value = String(p);
      seek.style.setProperty('--played', `${p}%`);
    };

    const onTime = () => {
      if (currRef.current) {
        currRef.current.textContent = secondsToTC(v.currentTime, site.fps);
      }
      paintSeek();
    };
    const onMeta = () => {
      if (durRef.current) {
        durRef.current.textContent = secondsToTC(v.duration || 0, site.fps);
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onRate = () => setRate(v.playbackRate);

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('durationchange', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ratechange', onRate);
    onMeta();
    onTime();
    setPlaying(!v.paused);

    // ---- J/K/L shuttle, monitor-scoped --------------------------------------
    let rewindRaf = 0;
    let lastT = 0;
    const rewindStep = (now) => {
      const dt = lastT ? (now - lastT) / 1000 : 0;
      lastT = now;
      v.currentTime = Math.max(0, v.currentTime - 2 * dt);
      rewindRaf = requestAnimationFrame(rewindStep);
    };

    const isTyping = (e) =>
      /^(input|textarea|select)$/i.test(e.target?.tagName) &&
      e.target?.type !== 'range';

    const onKeyDown = (e) => {
      if (isTyping(e)) return;
      const key = e.key.toLowerCase();
      if (key === 'l') {
        e.preventDefault();
        if (v.paused) {
          v.playbackRate = 1;
          play(v)?.catch(() => {});
        } else {
          v.playbackRate = Math.min(4, v.playbackRate * 2);
        }
      } else if (key === 'k') {
        e.preventDefault();
        v.pause();
        v.playbackRate = 1;
      } else if (key === 'j' && !e.repeat && !rewindRaf) {
        e.preventDefault();
        v.pause();
        lastT = 0;
        rewindRaf = requestAnimationFrame(rewindStep);
      }
    };
    const onKeyUp = (e) => {
      if (e.key.toLowerCase() === 'j' && rewindRaf) {
        cancelAnimationFrame(rewindRaf);
        rewindRaf = 0;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('durationchange', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ratechange', onRate);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      if (rewindRaf) cancelAnimationFrame(rewindRaf);
    };
  }, [videoRef]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.playbackRate = 1;
      play(v)?.catch(() => {});
    } else {
      v.pause();
    }
  };

  const onSeekInput = (e) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    seekingRef.current = true;
    v.currentTime = (Number(e.target.value) / 100) * v.duration;
    e.target.style.setProperty('--played', `${e.target.value}%`);
  };

  const onVolume = (e) => {
    const v = videoRef.current;
    if (v) v.volume = Number(e.target.value);
  };

  const onFullscreen = () => {
    panelRef.current?.requestFullscreen?.().catch(() => {});
  };

  return (
    <div className={styles.transport}>
      <button
        type="button"
        className={styles.btn}
        onClick={togglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {rate > 1 && (
        <span className={styles.rate} aria-hidden="true">
          {rate}×
        </span>
      )}

      <span className={styles.tc}>
        <span ref={currRef}>00:00:00:00</span>
        <span className={styles.tcSep}> / </span>
        <span ref={durRef} className={styles.tcDur}>
          00:00:00:00
        </span>
      </span>

      <input
        ref={seekRef}
        className={styles.seek}
        type="range"
        min="0"
        max="100"
        step="0.1"
        defaultValue="0"
        aria-label="Seek"
        onInput={onSeekInput}
        onPointerUp={() => {
          seekingRef.current = false;
        }}
      />

      <input
        className={styles.volume}
        type="range"
        min="0"
        max="1"
        step="0.05"
        defaultValue="1"
        aria-label="Volume"
        onInput={onVolume}
      />

      <button
        type="button"
        className={styles.btn}
        onClick={onFullscreen}
        aria-label="Fullscreen"
      >
        ⛶
      </button>
    </div>
  );
}
