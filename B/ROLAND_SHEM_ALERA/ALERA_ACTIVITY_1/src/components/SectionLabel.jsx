import styles from './SectionLabel.module.css'

export default function SectionLabel({ children }) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>── {children} ──</p>
    </div>
  )
}
