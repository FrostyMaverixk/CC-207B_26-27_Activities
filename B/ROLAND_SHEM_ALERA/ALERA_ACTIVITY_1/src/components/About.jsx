import { PERSONAL } from '../data'
import { useInView } from '../hooks/useInView'
import SectionLabel from './SectionLabel'
import styles from './About.module.css'

export default function About() {
  const [ref, inView] = useInView()

  return (
    <section id="about" className={styles.about}>
      <SectionLabel>About Me</SectionLabel>

      <div
        ref={ref}
        className={`${styles.grid} ${inView ? styles.visible : ''}`}
      >
        {/* Avatar card */}
        <div className={styles.avatarCard}>
         <img src="/Profile.jpg" alt="Roland Shem" className={styles.avatarPhoto} />
          <p className={styles.avatarCourse}>{PERSONAL.course}</p>
          <div className={styles.avatarBadge}>
            <span className={styles.badgeLabel}>Currently studying</span>
            <span className={styles.badgeValue}>{PERSONAL.location}</span>
          </div>
        </div>

        {/* Text content */}
        <div className={styles.textContent}>
          <h2 className={styles.headline}>
            {PERSONAL.aboutHeadline}<br />
            <span className={styles.accent}>{PERSONAL.aboutHeadlineAccent}</span>
          </h2>
          <p className={styles.para}>{PERSONAL.aboutP1}</p>
          <p className={styles.para}>{PERSONAL.aboutP2}</p> 
        </div>
      </div>
    </section>
  )
}
