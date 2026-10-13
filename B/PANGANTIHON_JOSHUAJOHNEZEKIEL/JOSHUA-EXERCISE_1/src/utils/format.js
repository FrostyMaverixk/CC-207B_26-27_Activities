/** Date / time / string formatting helpers. */

const p2 = (n) => String(n).padStart(2, '0')

export const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

export const fmtHM = (iso) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export const fmtDateTime = (iso) => (iso ? `${fmtDate(iso)} · ${fmtHM(iso)}` : '—')

/** "2026-08-23" style key used for grouping by day. */
export const dayKey = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
}

/** Value for <input type="datetime-local"> (local time). Defaults to now. */
export const toLocalInput = (iso) => {
  const d = iso ? new Date(iso) : new Date()
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`
}

/** datetime-local value -> ISO string */
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null)

export const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?'

/** Deterministic pleasant hue from a string, used for avatar colors. */
export const hueOf = (str = '') => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360
  return h
}
