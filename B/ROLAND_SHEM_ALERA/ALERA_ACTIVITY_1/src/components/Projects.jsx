import { PROJECTS } from '../data'
import { useInView } from '../hooks/useInView'
import SectionLabel from './SectionLabel'
import styles from './Projects.module.css'

export default function Projects() {
  const [ref, inView] = useInView()

  return (
    <section id="projects" className={styles.projects}>
      <div className={styles.inner}>
        <SectionLabel>Projects</SectionLabel>

        <div
          ref={ref}
          className={`${styles.grid} ${inView ? styles.visible : ''}`}
        >
          {PROJECTS.map((p, i) => (
            <a
              key={p.title}
              href={p.link}
              className={styles.card}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              {/* Accent glow corner */}
              <div
                className={styles.glow}
                style={{ background: `radial-gradient(circle at top right, ${p.color}22, transparent 70%)` }}
              />

              {/* UPDATED ICON LOGIC */}
              <div className={styles.icon}>
                {typeof p.icon === 'string' && p.icon.startsWith('/') ? (
                  <img 
                    src={p.icon} 
                    alt={p.title} 
                   className={styles.projectIconImage}
                />) : (
                  p.icon
                )}
              </div>

              <h3 className={styles.title}>{p.title}</h3>
              <p className={styles.desc}>{p.desc}</p>

              <div className={styles.tags}>
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    className={styles.tag}
                    style={{
                      background: `${p.color}18`,
                      border: `1px solid ${p.color}30`,
                      color: p.color,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}