import { useEffect, useRef, useState } from 'react';
import { asset } from '../../lib/asset';
import OfflineSlate from './OfflineSlate';
import styles from './ClipStrip.module.css';

/**
 * One project = one wide filmstrip row (§3B.2).
 *
 * Load ladder (lazy, IntersectionObserver rootMargin 200px):
 *   out of view → flat --bg-2 block
 *   in view     → poster <img loading="lazy"> while the strip sprite preloads
 *   sprite ok   → scrubbable filmstrip (background-position hover-scrub)
 *   sprite AND poster 404 → OfflineSlate row, not clickable (Global Rule 6)
 *
 * The sprite renders at true 16:9 frame aspect (`background-size: cover`),
 * frames side by side like a timeline clip's thumbnails; rows show as many
 * frames as fit. Hover-scrub pans the filmstrip: percentage background
 * positioning maps cursor fraction → sprite overflow fraction, so the strip
 * slides under the cursor. Writes go straight to the DOM — no state per
 * pointer move. Touch: horizontal drag scrubs (touch-action: pan-y keeps
 * vertical scrolling native); a clean tap opens the monitor.
 *
 * @param {Object} props
 * @param {import('../../data/projects').Project} props.project
 * @param {import('../../data/projects').Track} props.track
 * @param {(project: Object, origin: HTMLElement) => void} props.onOpen
 */
export default function ClipStrip({ project, track, onOpen }) {
  const rowRef = useRef(null);
  const stripRef = useRef(null);
  const needleRef = useRef(null);
  const touchScrubbed = useRef(false);
  const [inView, setInView] = useState(false);
  const [stripState, setStripState] = useState('idle'); // idle (incl. loading) | ready | failed
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Preload the sprite once visible; only a successful load swaps it in.
  useEffect(() => {
    if (!inView) return undefined;
    const img = new Image();
    img.onload = () => setStripState('ready');
    img.onerror = () => setStripState('failed');
    img.src = asset(project.strip);
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [inView, project.strip]);

  const offline = stripState === 'failed' && posterFailed;

  const scrub = (e) => {
    const el = stripRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(rect.width, Math.max(0, e.clientX - rect.left));
    el.style.backgroundPositionX = `${(x / rect.width) * 100}%`;
    const needle = needleRef.current;
    if (needle) {
      needle.style.opacity = '1';
      needle.style.transform = `translateX(${x}px)`;
    }
    if (e.pointerType === 'touch') touchScrubbed.current = true;
  };

  const resetScrub = () => {
    if (stripRef.current) stripRef.current.style.backgroundPositionX = '0%';
    if (needleRef.current) needleRef.current.style.opacity = '0';
  };

  const onClick = (e) => {
    // a horizontal touch-scrub that ends on the row is a scrub, not a tap
    if (touchScrubbed.current) {
      touchScrubbed.current = false;
      return;
    }
    onOpen(project, e.currentTarget);
  };

  const meta = [
    `runtime ${project.runtime}`,
    `role: ${project.role}`,
    project.cuts != null ? `${project.cuts} cuts` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  if (offline) {
    return (
      <div className={styles.row} ref={rowRef} aria-disabled="true">
        <OfflineSlate path={project.video} />
        <p className={styles.meta}>{meta}</p>
      </div>
    );
  }

  return (
    <div
      className={styles.row}
      ref={rowRef}
      style={{ '--track-color': track.color }}
    >
      <button
        type="button"
        className={styles.button}
        aria-label={`Open ${project.title}, ${project.runtime}, ${track.label}`}
        onClick={onClick}
      >
        <div
          ref={stripRef}
          className={styles.strip}
          onPointerMove={stripState === 'ready' ? scrub : undefined}
          onPointerLeave={stripState === 'ready' ? resetScrub : undefined}
          style={
            stripState === 'ready'
              ? {
                  backgroundImage: `url(${asset(project.strip)})`,
                  backgroundSize: 'cover',
                }
              : undefined
          }
        >
          {stripState !== 'ready' && inView && !posterFailed && (
            <img
              className={styles.poster}
              src={asset(project.poster)}
              alt=""
              loading="lazy"
              onError={() => setPosterFailed(true)}
            />
          )}
          <span ref={needleRef} className={styles.needle} aria-hidden="true" />
          <span className={styles.filename}>{project.filename}</span>
          <span className={styles.runtime}>{project.runtime}</span>
        </div>
      </button>
      <p className={styles.meta}>{meta}</p>
    </div>
  );
}
