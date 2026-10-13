import { useEffect, useRef, useState } from 'react';
import { site } from '../../data/siteConfig';
import styles from './ExportDialog.module.css';

/**
 * The contact form as an NLE export dialog (Phase 4 task 9), plus the footer
 * micro-strip (task 10) — this component IS the contact section body.
 *
 * Delivery (decided): Netlify Forms. Submit runs the render-queue theater —
 * the button becomes a progress bar (`QUEUED → RENDERING {n}%`, eased ~1.4s)
 * while POSTing url-encoded to '/' with form-name=contact. Success stamps
 * `DELIVERED ✓` (teal) and resets after 4s; failure stamps `EXPORT FAILED —
 * RETRY?` (red) keeping field values. In dev there is no Netlify, so success
 * is simulated (console.info notes it). `formMode: 'mailto'` (GitHub Pages
 * mirror) finishes the bar then hands off to the visitor's mail app.
 *
 * The hidden static mirror form lives in index.html (Netlify build-time
 * detection needs it). Honeypot `b_field` renders visually hidden here too —
 * Netlify discards filled-honeypot submissions server-side.
 */

const RENDER_MS = 1400;

const encode = (data) => new URLSearchParams(data).toString();

export default function ExportDialog() {
  // idle | rendering | delivered | failed | handoff
  const [status, setStatus] = useState('idle');
  // controlled so picking "Other" can reveal the SPECIFY field
  const [preset, setPreset] = useState('Short-Form');
  const formRef = useRef(null);
  const pctRef = useRef(null);
  const fillRef = useRef(null);
  const timersRef = useRef([]);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    },
    [],
  );

  const runRenderBar = () =>
    new Promise((resolve) => {
      const start = performance.now();
      const tick = (now) => {
        const t = now - start;
        const p = Math.min(96, 96 * (1 - Math.exp(-t / 450)));
        if (pctRef.current) pctRef.current.textContent = String(Math.round(p));
        if (fillRef.current) fillRef.current.style.width = `${p}%`;
        if (t >= RENDER_MS) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

  const finishBar = () => {
    if (pctRef.current) pctRef.current.textContent = '100';
    if (fillRef.current) fillRef.current.style.width = '100%';
  };

  const post = async (fields) => {
    if (import.meta.env.DEV) {
      console.info('netlify form: simulated');
      return true;
    }
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encode({ 'form-name': 'contact', ...fields }),
    });
    return res.ok;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === 'rendering') return;

    const form = formRef.current;
    // form.elements, not form.<name>: `form.name` is the form's own name
    // attribute ('contact'), which shadows the input named "name".
    const els = form.elements;
    const fields = {
      preset: els.preset.value,
      preset_other: els.preset_other ? els.preset_other.value : '',
      name: els.name.value,
      email: els.email.value,
      notes: els.notes.value,
      b_field: els.b_field.value,
    };

    setStatus('rendering');

    if (site.formMode === 'mailto') {
      await runRenderBar();
      finishBar();
      const subject = `[${fields.preset_other || fields.preset}] from ${fields.name}`;
      const body = `${fields.notes}\n\nreply to: ${fields.email}`;
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus('handoff');
      return;
    }

    try {
      const [ok] = await Promise.all([post(fields), runRenderBar()]);
      finishBar();
      if (!ok) throw new Error('netlify rejected');
      setStatus('delivered');
      form.reset();
      setPreset('Short-Form');
      timersRef.current.push(setTimeout(() => setStatus('idle'), 4000));
    } catch {
      setStatus('failed'); // field values are kept — retry re-submits
    }
  };

  const statusLabel = {
    idle: null,
    rendering: null,
    delivered: 'DELIVERED ✓',
    failed: 'EXPORT FAILED — RETRY?',
    handoff: 'HANDED OFF TO MAIL APP',
  }[status];

  return (
    <div className={styles.wrap}>
      <form
        ref={formRef}
        name="contact"
        className={styles.dialog}
        onSubmit={onSubmit}
      >
        <h2 className={styles.title}>EXPORT SETTINGS</h2>

        <div className={styles.row}>
          <span className={styles.label}>FORMAT:</span>
          <span className={styles.static}>Email (H.264 not available)</span>
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="export-preset">
            PRESET (VIDEO TYPE):
          </label>
          <select
            id="export-preset"
            name="preset"
            className={styles.control}
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
          >
            <option value="Short-Form">Short-Form — Reels / TikTok / Shorts</option>
            <option value="Long-Form">Long-Form — YouTube / Short Film</option>
            <option value="Ad / Promo">Ad / Promo — product or brand video</option>
            <option value="AMV / Game Edit">AMV / Game Edit</option>
            <option value="Other">Other / Not Sure Yet</option>
          </select>
        </div>

        {preset === 'Other' && (
          <div className={styles.row}>
            <label className={styles.label} htmlFor="export-preset-other">
              SPECIFY:
            </label>
            <input
              id="export-preset-other"
              type="text"
              name="preset_other"
              required
              placeholder="what kind of video do you need?"
              className={styles.control}
            />
          </div>
        )}

        <div className={styles.row}>
          <label className={styles.label} htmlFor="export-name">
            SOURCE NAME:
          </label>
          <input
            id="export-name"
            type="text"
            name="name"
            required
            autoComplete="name"
            placeholder="your name"
            className={styles.control}
          />
        </div>

        <div className={styles.row}>
          <label className={styles.label} htmlFor="export-email">
            REPLY ADDRESS:
          </label>
          <input
            id="export-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            className={styles.control}
          />
        </div>

        <div className={`${styles.row} ${styles.rowTop}`}>
          <label className={styles.label} htmlFor="export-notes">
            NOTES:
          </label>
          <textarea
            id="export-notes"
            name="notes"
            rows={5}
            placeholder={
              'tell me about the project — rough length, deadline, ' +
              'links to footage or references, budget if you have one'
            }
            className={`${styles.control} ${styles.notes}`}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.label}>DESTINATION:</span>
          <span className={styles.static}>{site.email} (your inbox)</span>
        </div>

        {/* honeypot — visually hidden, never autofilled by humans */}
        <label className={styles.honeypot} aria-hidden="true">
          don&apos;t fill this in
          <input type="text" name="b_field" tabIndex={-1} autoComplete="off" />
        </label>

        <button
          type="submit"
          className={styles.submit}
          disabled={status === 'rendering'}
        >
          {status === 'rendering' ? (
            <>
              <span ref={fillRef} className={styles.submitFill} aria-hidden="true" />
              <span className={styles.submitLabel}>
                QUEUED → RENDERING <span ref={pctRef}>0</span>%
              </span>
            </>
          ) : (
            <span className={styles.submitLabel}>ADD TO RENDER QUEUE</span>
          )}
        </button>

        {site.messengerUrl && (
          <a
            className={styles.quickExport}
            href={site.messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            QUICK EXPORT → DM ON MESSENGER
          </a>
        )}

        <p className={styles.status} role="status" aria-live="polite">
          {statusLabel && (
            <span
              className={
                status === 'failed' ? styles.statusFailed : styles.statusOk
              }
            >
              {statusLabel}
            </span>
          )}
        </p>
      </form>

      {/* footer micro-strip (Phase 4 task 10) */}
      <footer className={styles.footer}>
        © {new Date().getFullYear()} {site.name} · cut + graded in davinci
        resolve · {site.fpsLabel} · 1920×1080 · J·K·L to shuttle
      </footer>
    </div>
  );
}
