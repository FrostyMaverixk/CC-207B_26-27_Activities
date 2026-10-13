import { useState, useEffect } from 'react'
import { PERSONAL } from '../data'
import styles from './Hero.module.css'

export default function Hero() {
  const [typed, setTyped] = useState('')
  const [roleIdx, setRoleIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = PERSONAL.roles[roleIdx]
    const speed = deleting ? 40 : 80

    const timeout = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setTyped(current.slice(0, charIdx + 1))
        setCharIdx((c) => c + 1)
      } else if (!deleting && charIdx === current.length) {
        setTimeout(() => setDeleting(true), 1600)
      } else if (deleting && charIdx > 0) {
        setTyped(current.slice(0, charIdx - 1))
        setCharIdx((c) => c - 1)
      } else if (deleting && charIdx === 0) {
        setDeleting(false)
        setRoleIdx((i) => (i + 1) % PERSONAL.roles.length)
      }
    }, speed)

    return () => clearTimeout(timeout)
  }, [charIdx, deleting, roleIdx])

  return (
    <section id="home" className={styles.hero}>
      {/* Background glow */}
      <div className={styles.glow} />

      <div className={styles.content}>
        <p className={styles.eyebrow}></p>

        <h1 className={styles.name}>{PERSONAL.name}</h1>

        {/* Typewriter */}
        <div className={styles.typeRow}>
          <span className={styles.typed}>
            {typed}
            <span className={styles.cursor} />
          </span>
        </div>

        <p className={styles.tagline}>{PERSONAL.tagline}</p>

        {/* CTA Buttons */}
        <div className={styles.buttons}>
  <a href="#projects" className={styles.btnPrimary}>View Projects</a>
  <a href="#contact" className={styles.btnOutline}>Contact Me</a>
  <a href="/cv.pdf" download className={styles.btnOutline}>⬇ Download CV</a>
</div>
        {/* Stats */}
        <div className={styles.stats}>
          {PERSONAL.stats.map(({ value, label }) => (
            <div key={label} className={styles.stat}>
              <div className={styles.statValue}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
