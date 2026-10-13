import { useEffect, useRef } from 'react';
import { site } from '../../data/siteConfig';
import { secondsToTC, tcToSeconds } from '../../lib/timecode';
import styles from './LiveTimecode.module.css';

/**
 * The monitor's running timecode, top-right inside the hero frame: master
 * start (01:00:00:00) + video.currentTime at site.fps. Driven by
 * requestVideoFrameCallback when the browser has it, else rAF. Writes the
 * string straight to a span — no React state per frame. The steady `▶ PGM`
 * tag says playback, not record (no blinking dot, by design).
 *
 * @param {Object} props
 * @param {React.RefObject<HTMLVideoElement>} props.videoRef
 */
export default function LiveTimecode({ videoRef }) {
  const tcRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const offset = tcToSeconds(site.masterStart, site.fps);
    let handle = 0;
    let cancelled = false;
    const hasRVFC = typeof video.requestVideoFrameCallback === 'function';

    const write = () => {
      if (tcRef.current) {
        tcRef.current.textContent = secondsToTC(
          offset + video.currentTime,
          site.fps,
        );
      }
    };

    const loop = () => {
      if (cancelled) return;
      write();
      handle = hasRVFC
        ? video.requestVideoFrameCallback(loop)
        : requestAnimationFrame(loop);
    };

    write();
    loop();

    return () => {
      cancelled = true;
      if (hasRVFC) video.cancelVideoFrameCallback?.(handle);
      else cancelAnimationFrame(handle);
    };
  }, [videoRef]);

  return (
    <div className={styles.readout} aria-hidden="true">
      <span className={styles.pgm}>▶ PGM</span>
      <span ref={tcRef} className={styles.tc} />
    </div>
  );
}
