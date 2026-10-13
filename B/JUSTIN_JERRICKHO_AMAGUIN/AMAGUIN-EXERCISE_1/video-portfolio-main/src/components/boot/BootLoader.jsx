import { useEffect, useRef, useState } from 'react';
import { site } from '../../data/siteConfig';
import styles from './BootLoader.module.css';

/**
 * The cold-open render dialog (Phase 4 task 1) — `RENDERING PORTFOLIO… {n}%`
 * with a 4px orange bar, a codec readout, and a 3-line scrolling fake log in
 * Resolve deliver-page voice. Sibling above #grade-root, z-boot.
 *
 * Progress = max(fake ease → ~84%, real load), jumping to 100 on `window
 * load`. Min display 900ms, hard cap 2200ms. Exit is a hard cut (unmount).
 *
 * Skipped entirely when: sessionStorage.booted is set (set on first run),
 * reduced motion, or any hash deep-link is present (§task 1). Per-frame bar
 * and % updates are direct DOM writes — React state only flips on log lines
 * and the final unmount.
 */

const LOG_LINES = [
  'initializing color management…',
  'rendering optimized media…',
  'writing DaVinci YRGB tags…',
  'muxing moov atom…',
  'flattening timeline…',
];

const MIN_MS = 900;
const CAP_MS = 2200;

const shouldSkip = () =>
  sessionStorage.getItem('booted') === '1' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
  window.location.hash !== '';

export default function BootLoader() {
  const [active, setActive] = useState(() => !shouldSkip());
  const [logIndex, setLogIndex] = useState(0);
  const barRef = useRef(null);
  const pctRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    sessionStorage.setItem('booted', '1');

    const start = performance.now();
    let raf = 0;
    let loaded = document.readyState === 'complete';
    const onLoad = () => {
      loaded = true;
    };
    window.addEventListener('load', onLoad);

    const tick = (now) => {
      const t = now - start;
      // fake ease toward ~84%, then the real load snaps it to 100
      const fake = 84 * (1 - Math.exp(-t / 500));
      const real = loaded && t >= MIN_MS ? 100 : 0;
      const p = Math.min(100, Math.max(fake, real, t >= CAP_MS ? 100 : 0));

      if (barRef.current) barRef.current.style.width = `${p}%`;
      if (pctRef.current) pctRef.current.textContent = String(Math.round(p));

      if (p >= 100) {
        setActive(false); // hard cut — unmount, no fade
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const logTimer = setInterval(
      () => setLogIndex((i) => i + 1),
      Math.floor(CAP_MS / LOG_LINES.length / 1.6),
    );

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(logTimer);
      window.removeEventListener('load', onLoad);
    };
  }, [active]);

  if (!active) return null;

  // 3 visible lines, scrolling through the list
  const visibleLog = [0, 1, 2].map(
    (offset) => LOG_LINES[(logIndex + offset) % LOG_LINES.length],
  );

  return (
    <div className={styles.boot} role="status" aria-label="Loading portfolio">
      <div className={styles.column}>
        <p className={styles.line}>
          RENDERING PORTFOLIO… <span ref={pctRef}>0</span>%
        </p>
        <div className={styles.track}>
          <div ref={barRef} className={styles.fill} />
        </div>
        <p className={styles.codec}>
          H.264 · 1920×1080 · {site.fpsLabel} fps · HIGH@4.1 · 2-PASS VBR
        </p>
        <div className={styles.log} aria-hidden="true">
          {visibleLog.map((text, i) => (
            <p key={`${logIndex}-${i}`} className={styles.logLine}>
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
