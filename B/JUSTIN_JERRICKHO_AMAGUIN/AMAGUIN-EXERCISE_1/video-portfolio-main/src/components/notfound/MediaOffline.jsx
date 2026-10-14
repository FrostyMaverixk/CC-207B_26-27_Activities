import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { site } from '../../data/siteConfig';
import styles from './MediaOffline.module.css';

/**
 * Route `*` — the 404 slate, themed as an NLE "offline media" warning. This is
 * also the visual language Phase 3 reuses for any 404'd clip/poster, so it must
 * read as deliberate (Global Rule 6). Sets the document title to MEDIA OFFLINE
 * while mounted, then restores it.
 *
 * Phase 6 polish: a corner `tc 00:00:00:00` stamp, and a 1-in-5 chance the
 * slate renders the classic "?" film-slug texture variant (the giant question
 * mark old NLEs burned into unlinked clips).
 */
export default function MediaOffline() {
  // rolled once per mount — stable across re-renders
  const [slugVariant] = useState(() => Math.random() < 0.2);

  useEffect(() => {
    const prev = document.title;
    document.title = `MEDIA OFFLINE — ${site.name}`;
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <main className={styles.slate}>
      <span className={styles.cornerTc} aria-hidden="true">
        tc 00:00:00:00
      </span>
      {slugVariant && (
        <span className={styles.slug} aria-hidden="true">
          ?
        </span>
      )}
      <h1 className={styles.title}>MEDIA OFFLINE</h1>
      <p className={styles.subline}>
        The clip you&rsquo;re looking for has been moved, renamed, or deleted.
      </p>
      <Link to="/" className={styles.relink}>
        RELINK MEDIA →
      </Link>
      <p className={styles.whisper} aria-hidden="true">
        メディアオフライン · MÉDIA HORS LIGNE · MEDIEN OFFLINE
      </p>
    </main>
  );
}
