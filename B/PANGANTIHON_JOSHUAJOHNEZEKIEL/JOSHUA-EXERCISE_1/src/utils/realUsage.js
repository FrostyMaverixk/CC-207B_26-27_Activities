/**
 * Real Firestore usage — the exact numbers Firebase Console → Usage and
 * billing shows.
 *
 * Firestore exposes NO browser API for daily usage, but the Usage dashboard is
 * itself rendered from Cloud Monitoring metrics
 * (`firestore.googleapis.com/document/read_count|write_count|delete_count`),
 * and those CAN be queried from the browser with an OAuth access token granted
 * by the project owner:
 *
 *   1. A Google OAuth **Web client ID** is configured for this app (see
 *      README → "Real quota sync") with authorized origins for localhost AND
 *      the Cloudflare Pages domain.
 *   2. The operator clicks "Sync with Firebase" in the quota monitor once per
 *      session — a Google popup grants the read-only `monitoring.read` scope.
 *      The token (~1h) is kept in sessionStorage and reused silently.
 *   3. We sum today's (Pacific-time) time series → the exact billable counts.
 *
 * No service account, no server, no Blaze plan — works on Cloudflare Pages.
 */
const SCOPE = 'https://www.googleapis.com/auth/monitoring.read'
const TOKEN_KEY = 'casscan_usage_token'
const GSI_SRC = 'https://accounts.google.com/gsi/client'

const METRIC_TYPES = {
  reads: 'firestore.googleapis.com/document/read_count',
  writes: 'firestore.googleapis.com/document/write_count',
  deletes: 'firestore.googleapis.com/document/delete_count',
}

/** True when the app ships a Google OAuth client id (usage sync enabled). */
export function isRealUsageConfigured() {
  return Boolean(import.meta.env?.VITE_GOOGLE_OAUTH_CLIENT_ID)
}

/* ------------------------------------------------------------------ *
 *  Pacific-time helpers (the quota day rolls at midnight PT)
 * ------------------------------------------------------------------ */

/** 'YYYY-MM-DD' of the current moment in America/Los_Angeles. */
export function pacificDayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** UTC ms of midnight PT for a 'YYYY-MM-DD' day key (DST-safe). */
function ptMidnightUtcMs(dayKey) {
  for (const off of ['-08:00', '-07:00']) {
    const t = new Date(`${dayKey}T00:00:00${off}`).getTime()
    if (!Number.isNaN(t) && pacificDayKey(new Date(t)) === dayKey) return t
  }
  return new Date(`${dayKey}T00:00:00-08:00`).getTime()
}

/* ------------------------------------------------------------------ *
 *  Google Identity Services token (read-only monitoring.read)
 * ------------------------------------------------------------------ */

let gsiPromise = null
function loadGsi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No browser window.'))
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GSI_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        gsiPromise = null
        reject(new Error('Could not load Google sign-in — check the network.'))
      }
      document.head.appendChild(script)
    })
  }
  return gsiPromise
}

function cachedToken() {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.token && parsed?.exp > Date.now()) return parsed.token
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* private mode / blocked storage — interactive flow still works */
  }
  return null
}

function storeToken(token, expiresInSec) {
  try {
    sessionStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ token, exp: Date.now() + Math.max(60, (expiresInSec || 3600) - 120) * 1000 }),
    )
  } catch {
    /* memory-only */
  }
}

/** True when a usable monitoring.read token is already in sessionStorage. */
export function hasCachedUsageToken() {
  return Boolean(cachedToken())
}

/** Popup flow — MUST run inside a user gesture (the Sync button). */
async function requestTokenInteractive() {
  await loadGsi()
  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
        scope: SCOPE,
        callback: (resp) => {
          if (resp?.access_token) {
            storeToken(resp.access_token, resp.expires_in)
            resolve(resp.access_token)
          } else {
            reject(new Error(resp?.error || 'Google sign-in was cancelled.'))
          }
        },
        error_callback: (err) =>
          reject(new Error(err?.message || err?.type || 'Google sign-in failed or was closed.')),
      })
      client.requestAccessToken({ prompt: '' })
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

/* ------------------------------------------------------------------ *
 *  Cloud Monitoring query — today's billable Firestore counts
 * ------------------------------------------------------------------ */

async function fetchMetricTotal(token, projectId, metricType, startIso, endIso) {
  const params = new URLSearchParams({
    filter: `metric.type="${metricType}"`,
    'interval.startTime': startIso,
    'interval.endTime': endIso,
    // The window is always < 24h, so one 24h ALIGN_SUM bucket covers it.
    'aggregation.alignmentPeriod': '86400s',
    'aggregation.perSeriesAligner': 'ALIGN_SUM',
  })
  const resp = await fetch(
    `https://monitoring.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/timeSeries?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (resp.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY)
    throw new Error('Google token expired — sync again.')
  }
  if (resp.status === 403) {
    throw new Error(
      'Google denied the read (403). Sign in as the project owner, make sure the Cloud Monitoring API is enabled, and this app\u2019s origin is in the OAuth client.',
    )
  }
  if (!resp.ok) throw new Error(`Cloud Monitoring returned ${resp.status}.`)
  const body = await resp.json()
  let total = 0
  for (const series of body.timeSeries || []) {
    for (const point of series.points || []) {
      total += Number(point.value?.int64Value ?? point.value?.doubleValue ?? 0)
    }
  }
  return total
}

/**
 * Today's (PT) real counts using a CACHED token. Returns `null` when no token
 * is stored yet (run the interactive flow), or
 * `{ reads, writes, deletes, dayKey, at }` on success. Throws on failure.
 */
export async function fetchRealFirestoreUsage(projectId) {
  if (!isRealUsageConfigured()) return null
  const token = cachedToken()
  if (!token) return null

  const dayKey = pacificDayKey()
  const startIso = new Date(ptMidnightUtcMs(dayKey)).toISOString()
  const endIso = new Date().toISOString()

  const out = {}
  for (const [kind, metricType] of Object.entries(METRIC_TYPES)) {
    out[kind] = await fetchMetricTotal(token, projectId, metricType, startIso, endIso)
  }
  return { ...out, dayKey, at: Date.now() }
}

/**
 * One-click flow for the "Sync with Firebase" button: loads Google Identity
 * Services, pops the consent/token window when there is no cached token, then
 * fetches today's real counts. Throws with an operator-readable message.
 */
export async function fetchRealFirestoreUsageInteractive(projectId) {
  if (!isRealUsageConfigured()) {
    throw new Error('Set VITE_GOOGLE_OAUTH_CLIENT_ID to enable the real usage sync (README → "Real quota sync").')
  }
  await loadGsi()
  if (!cachedToken()) await requestTokenInteractive()
  const usage = await fetchRealFirestoreUsage(projectId)
  if (!usage) throw new Error('Google returned no token — try again.')
  return usage
}
