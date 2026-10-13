import { EXPERIENCE } from '../data'
import { useInView } from '../hooks/useInView'
import SectionLabel from './SectionLabel'
import styles from './Experience.module.css'

export default function Experience() {
  const [ref, inView] = useInView()

  return (
    <section id="experience" className={styles.experience}>
      <div className={styles.inner}>
        <SectionLabel>Experience &amp; Education</SectionLabel>

        <div
          ref={ref}
          className={`${styles.timeline} ${inView ? styles.visible : ''}`}
        >
          {EXPERIENCE.map((item, i) => (
            <div key={i} className={styles.item}>
              {/* Left: year dot + connector line */}
              <div className={styles.dotCol}>
                <div className={`${styles.dot} ${item.current ? styles.dotCurrent : ''}`}>
                  {item.year}
                </div>
                {i < EXPERIENCE.length - 1 && <div className={styles.line} />}
              </div>

              {/* Right: content */}
              <div className={styles.content}>
                {item.current && <span className={styles.badge}>Current</span>}
                <h3 className={styles.title}>{item.title}</h3>
                <p className={styles.company}>{item.company}</p>
                <p className={styles.desc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
