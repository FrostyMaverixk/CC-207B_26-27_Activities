import { site } from '../../data/siteConfig';
import styles from './Wordmark.module.css';

/**
 * Brand lockup: the orange playhead mark (the favicon's artwork, transparent
 * background, sized to the text) + `name — tagline`. Inherits font styling
 * from its container by default (the hero byline supplies its own); the
 * module css only sets layout and the mark color. Drop it anywhere a
 * signature is needed — hero, footer, dialogs.
 */
export default function Wordmark() {
  return (
    <span className={styles.lockup}>
      <svg
        className={styles.mark}
        viewBox="20 4 24 56"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M20 4h24v12L32 27 20 16z" />
        <rect x="30" y="4" width="4" height="56" />
      </svg>
      {site.name} — {site.tagline}
    </span>
  );
}
