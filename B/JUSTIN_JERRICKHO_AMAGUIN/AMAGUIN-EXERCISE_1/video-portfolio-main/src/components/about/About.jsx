import { useState } from 'react';
import { about } from '../../data/about';
import { site } from '../../data/siteConfig';
import { asset } from '../../lib/asset';
import { wavePoints } from '../../lib/waveform';
import PropertiesTable from './PropertiesTable';
import MeterList from './MeterList';
import styles from './About.module.css';

/* the A1 conceit: fake waveform divider, seeded so it never changes */
const WAVE = wavePoints(7, 96, 4, 42);

/**
 * The About section (Phase 4 task 8). Two columns ≥1024px, stacked below:
 * left = headshot in a source-monitor frame (top tab `SOURCE: {label}`,
 * corner ticks, NO TALENT MEDIA fallback); right = clip-properties table,
 * bio (≤65ch), software meters, services as EXPORT PRESETS, optional resume
 * row and live links. A teal waveform divider tops the section.
 */
export default function About() {
  const [headshotFailed, setHeadshotFailed] = useState(false);
  const liveLinks = site.links.filter((l) => l.url);

  return (
    <div>
      <svg
        className={styles.waveDivider}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline points={WAVE} />
      </svg>

      <div className={styles.columns}>
        {/* ---- left: source monitor ------------------------------------- */}
        <figure className={styles.sourceMonitor}>
          <figcaption className={styles.sourceTab}>
            SOURCE: {about.headshotLabel}
          </figcaption>
          <div className={styles.sourceFrame}>
            {headshotFailed ? (
              <div className={styles.noTalent}>
                <span>NO TALENT MEDIA</span>
              </div>
            ) : (
              <img
                className={styles.headshot}
                src={asset(about.headshot)}
                alt={`${about.properties.NAME} — headshot`}
                loading="lazy"
                onError={() => setHeadshotFailed(true)}
              />
            )}
            <div className={styles.frameTicks} aria-hidden="true" />
          </div>
        </figure>

        {/* ---- right: properties · bio · meters · presets ----------------- */}
        <div className={styles.details}>
          <PropertiesTable
            properties={about.properties}
            available={about.availability.available}
          />

          <div className={styles.bio}>
            {about.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <MeterList software={about.software} />

          <section aria-label="Export presets — services">
            <h2 className={styles.presetsHeader}>
              EXPORT PRESETS — what I can deliver
            </h2>
            <ul role="list" className={styles.presetList}>
              {about.services.map((service) => (
                <li key={service.name} className={styles.preset}>
                  <span className={styles.presetChip}>{service.name}</span>
                  <p className={styles.presetDesc}>{service.desc}</p>
                  <p className={styles.presetSpec}>{service.spec}</p>
                </li>
              ))}
            </ul>
          </section>

          {about.resume && (
            <a className={styles.resume} href={asset(about.resume)} download>
              RESUME.PDF ↓
            </a>
          )}

          {liveLinks.length > 0 && (
            <div className={styles.links}>
              {liveLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
