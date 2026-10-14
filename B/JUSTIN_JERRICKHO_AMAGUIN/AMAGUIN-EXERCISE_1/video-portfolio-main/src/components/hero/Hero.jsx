import { useEffect, useRef, useState } from 'react';
import { site } from '../../data/siteConfig';
import { about } from '../../data/about';
import { SECTIONS } from '../../data/sections';
import { asset } from '../../lib/asset';
import { register, unregister, play } from '../../lib/playback';
import { flash } from '../../lib/cut';
import LiveTimecode from './LiveTimecode';
import Wordmark from '../brand/Wordmark';
import ProgramMonitor from '../work/ProgramMonitor';
import styles from './Hero.module.css';

/**
 * The functional hero (§3C): a full-bleed program monitor playing the muted
 * reel loop. Poster paints first (LCP), the video just starts — no fade.
 *
 * Playback rules: registered with the playback manager (the program monitor
 * silences it on open; it resumes on 'pgm-close' if still in view) and paused
 * whenever it scrolls out of view (IntersectionObserver).
 *
 * Offline fallback: if BOTH poster and video 404, the frame renders CSS SMPTE
 * color bars + `NO SIGNAL` — the site demos well with an empty assets folder.
 */
export default function Hero() {
  const videoRef = useRef(null);
  const inViewRef = useRef(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [reelOpen, setReelOpen] = useState(false);

  // Probe the poster (it's a CSS-side attribute, so 404s are silent otherwise).
  useEffect(() => {
    const img = new Image();
    img.onerror = () => setPosterFailed(true);
    img.src = asset(site.heroPoster);
    return () => {
      img.onerror = null;
    };
  }, []);

  const offline = videoFailed && posterFailed;

  // Live availability — single source of truth in about.availability.
  const { available, labelAvailable, labelBooked } = about.availability;
  const statusLabel = available ? labelAvailable : labelBooked;

  // Register + viewport-pause + resume-after-monitor.
  useEffect(() => {
    if (offline) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;

    register(video);
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) play(video)?.catch(() => {});
        else video.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(video);

    const onPgmClose = () => {
      if (inViewRef.current) play(video)?.catch(() => {});
    };
    window.addEventListener('pgm-close', onPgmClose);

    return () => {
      io.disconnect();
      window.removeEventListener('pgm-close', onPgmClose);
      unregister(video);
    };
  }, [offline]);

  // Scroll hint cuts to the next section in the registry (data-driven).
  const next = SECTIONS[1];
  const cutToNext = () => {
    const el = document.getElementById(next.id);
    if (!el) return;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY,
      behavior: 'auto',
    });
    flash();
  };

  return (
    <div className={styles.hero}>
      <div className={styles.monitor}>
        {offline ? (
          <div className={styles.bars}>
            <p className={styles.noSignal}>
              NO SIGNAL — drop reel into public/assets/hero/
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className={styles.video}
              src={asset(site.heroVideo)}
              poster={posterFailed ? undefined : asset(site.heroPoster)}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              onError={() => setVideoFailed(true)}
            />
            <LiveTimecode videoRef={videoRef} />
          </>
        )}

        {/* safe-area guides (90% action / 80% title) + frame corner ticks */}
        <div className={styles.safeArea} aria-hidden="true">
          <div className={styles.actionSafe} />
          <div className={styles.titleSafe} />
        </div>
        <div className={styles.frameTicks} aria-hidden="true" />

        <div className={styles.titleBlock}>
          <h1 className={styles.filename}>
            {site.heroFilename}
            <span className={styles.caret} aria-hidden="true">
              _
            </span>
          </h1>
          <p className={styles.byline}>
            <Wordmark />
          </p>
          <p
            className={`${styles.status} ${
              available ? styles.statusOpen : styles.statusBooked
            }`}
          >
            <span className={styles.statusDot} aria-hidden="true">
              ●
            </span>
            {statusLabel}
          </p>
        </div>

        <div className={styles.metaRow} aria-hidden="true">
          <span>{site.fpsLabel}</span>
          <span>1080P</span>
          <span>DAVINCI YRGB</span>
          <span>REC.709</span>
        </div>

        {/* Whole monitor opens the reel in the program monitor (bigger + sound) */}
        {!offline && (
          <button
            type="button"
            className={styles.expand}
            onClick={() => setReelOpen(true)}
            aria-label="Open the showreel — larger view with sound"
          >
            <span className={styles.expandBadge} aria-hidden="true">
              ▶ WATCH WITH SOUND
            </span>
          </button>
        )}
      </div>

      <button type="button" className={styles.hint} onClick={cutToNext}>
        ⌄ {next.tc} {next.label}
      </button>

      {reelOpen && (
        <ProgramMonitor project={site.reel} onClose={() => setReelOpen(false)} />
      )}
    </div>
  );
}
