import { PERSONAL } from '../data'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        © {new Date().getFullYear()} {PERSONAL.name} — Built with React.js
      </p>
      <a href="#home" className={styles.backTop}>↑ Back to top</a>
    </footer>
  )
}
