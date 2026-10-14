import { useState } from 'react'
import { PERSONAL } from '../data'
import { useInView } from '../hooks/useInView'
import SectionLabel from './SectionLabel'
import styles from './Contact.module.css'

const FORMSPREE_URL = 'https://formspree.io/f/mojooydv'

export default function Contact() {
  const [ref, inView] = useInView()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all fields.')
      return
    }

    setSending(true)

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
        }),
      })

      if (res.ok) {
        setSent(true)
        setForm({ name: '', email: '', message: '' })
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.inner}>
        <SectionLabel>Get In Touch</SectionLabel>

        <div
          ref={ref}
          className={`${styles.content} ${inView ? styles.visible : ''}`}
        >
          <p className={styles.note}>{PERSONAL.contactNote}</p>

          {sent ? (
            <div className={styles.success}>
              <span className={styles.successIcon}>✅</span>
              <h3 className={styles.successTitle}>Message Sent!</h3>
              <p className={styles.successText}>I'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <input
                className={styles.field}
                type="text"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
              />
              <input
                className={styles.field}
                type="email"
                name="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
              />
              <textarea
                className={`${styles.field} ${styles.textarea}`}
                name="message"
                placeholder="Your Message"
                rows={5}
                value={form.message}
                onChange={handleChange}
              />
              {error && <p className={styles.error}>{error}</p>}
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}

          <div className={styles.infoRow}>
            <div className={styles.infoItem}>📧 {PERSONAL.email}</div>
            <div className={styles.infoItem}>📍 {PERSONAL.location}</div>
            <div className={styles.infoItem}>🎓 {PERSONAL.course}</div>
          </div>
        </div>
      </div>
    </section>
  )
}