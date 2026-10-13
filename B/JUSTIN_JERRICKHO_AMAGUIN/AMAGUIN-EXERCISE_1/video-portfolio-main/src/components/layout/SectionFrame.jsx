import styles from './SectionFrame.module.css';

/**
 * Shared wrapper for every page section. Renders the scroll target
 * (`<section id data-section>` — consumed by hash deep-links and the boundary
 * math in §2) and prints the NLE header row: master timecode + label + a track
 * badge. The bottom border is the literal "cut" divider between sections.
 *
 * Hero gets `100svh`; every other section is `auto` height with generous
 * padding. Styling here is structural only — the signature pass is Phase 4.
 *
 * @param {Object} props
 * @param {import('../../data/sections').Section} props.section
 * @param {React.ReactNode} props.children
 */
export default function SectionFrame({ section, children }) {
  const { id, label, tc, track, kind } = section;
  const isHero = id === 'hero';
  // Phase 6 task 3: skip off-screen rendering work for the below-the-fold
  // sections — but NOT `work`, whose live size feeds the timeline boundary
  // math (and `hero` is the first paint).
  const skippable = id === 'about' || id === 'contact';

  return (
    <section
      id={id}
      data-section
      className={[
        styles.section,
        isHero ? styles.hero : '',
        skippable ? styles.skippable : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
    >
      <header className={styles.header}>
        <span className={styles.tc}>{tc}</span>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.badge} ${styles[kind] ?? ''}`}>{track}</span>
      </header>

      <div className={styles.body}>{children}</div>
    </section>
  );
}
