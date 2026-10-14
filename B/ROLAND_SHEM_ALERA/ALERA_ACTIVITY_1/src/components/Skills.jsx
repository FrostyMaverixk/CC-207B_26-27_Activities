import { SKILLS } from '../data.js'
import { useInView } from '../hooks/useInView'
import SectionLabel from './SectionLabel'
import styles from './Skills.module.css'

export default function Skills() {
  const [ref, inView] = useInView()

  return (
    <section id="skills" className={styles.skills}>
      <div className={styles.inner}>
        <SectionLabel>Skills &amp; Expertise</SectionLabel>

        <div
          ref={ref}
          className={`${styles.grid} ${inView ? styles.visible : ''}`}
        >
          {SKILLS.map((group, i) => (
            <div
              key={group.category}
              className={styles.card}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className={styles.logoStrip}>
                {group.icon && (
                  <img
                    src={group.icon}
                    alt={`${group.category} icons`}
                    className={styles.logoStripImg}
                  />
                )}
                {group.extraIcons && group.extraIcons.map((extra, index) => (
                 <img
  key={`${extra.alt}-${index}`}
  src={extra.src}
  alt={extra.alt}
  className={styles.extraIcon}
  style={extra.alt === 'Canva' ? { mixBlendMode: 'normal', borderRadius: '50%' } : {}}
/>
                ))}
              </div>
              <h3 className={styles.category}>{group.category}</h3>
              <div className={styles.tags}>
                {group.items.map((item) => (
                  <span key={item} className={styles.tag}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}