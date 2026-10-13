/**
 * Dual-project Firestore gateway — the single funnel for every Firestore
 * operation CASScan performs.
 *
 * CASScan talks to TWO Firebase projects:
 *   • primary — `db` from ../firebase (the original project)
 *   • backup  — a second project (VITE_FIREBACKUP_* env vars, see ../firebase)
 *     that takes over the moment the primary project's free daily quota runs
 *     out.
 *
 * Responsibilities:
 *   1. Quota accounting — every read/write/delete through the gateway is
 *      counted per project, persisted in localStorage, reset when the Firestore
 *      daily window rolls over (midnight Pacific Time — when Google resets the
 *      free-tier limits).
 *   2. Failover — crossing the SOFT threshold (80%) mirrors primary→backup so
 *      it is ready; crossing the HARD threshold (92%) — or a real
 *      `resource-exhausted` error — switches all reads/writes to backup until
 *      the quota resets. `restorePrimaryFromBackup()` brings failover data home.
 *   3. No-duplication sync — mirrored collections keep the SAME document ids
 *      (setDoc overwrites, never duplicates) and docs missing on the source are
 *      deleted from the target.
 *   4. Write echo — mutations emit `mut` events so shared caches stay fresh
 *      without extra reads.
 */
import {
  collection as fsCollection,
  doc as fsDoc,
  getDocs as fsGetDocs,
  getDocFromCache as fsGetDocFromCache,
  getDocFromServer as fsGetDocFromServer,
  getDocsFromCache as fsGetDocsFromCache,
  getCountFromServer as fsGetCountFromServer,
  onSnapshot as fsOnSnapshot,
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  writeBatch as fsWriteBatch,
  runTransaction as fsRunTransaction,
} from 'firebase/firestore'
import { db as primaryDb, getBackupDb, isBackupConfigured } from '../firebase'
import {
  fetchRealFirestoreUsage,
  fetchRealFirestoreUsageInteractive,
  isRealUsageConfigured,
} from './realUsage'

/* ------------------------------------------------------------------ *
 *  Configuration
 * ------------------------------------------------------------------ */

const env = import.meta.env || {}
const VITE_FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || null

/** Firestore free-tier daily limits (per project). */
export const QUOTA_LIMITS = { reads: 50000, writes: 20000, deletes: 20000 }

/** Soft threshold — mirror primary→backup + warn (80% of any limit). */
export const SOFT_RATIO = 0.8
/** Hard threshold — switch all traffic to the backup project (92%). */
export const HARD_RATIO = 0.92

/** Collections mirrored during a primary↔backup sync. */
export const SYNC_COLLECTIONS = ['students', 'admins', 'attendanceEvents', 'attendanceRecords', 'attendanceSummaries', 'meta', 'counters']

const LS = {
  usage: 'casscan_gateway_usage',
  active: 'casscan_gateway_active',
  failover: 'casscan_gateway_failover',
  manifest: 'casscan_sync_manifest',
  lastSync: 'casscan_last_sync_at',
}

/** Above this many docs the id-manifest is skipped (full target read instead). */
const MANIFEST_CAP = 20000
const BATCH_SIZE = 400

/* ------------------------------------------------------------------ *
 *  Small helpers
 * ------------------------------------------------------------------ */

const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const safeGet = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private browsing / storage full — in-memory state still works */
  }
}
const safeRemove = (key) => {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/**
 * True when Firestore refused the op because the daily quota is exhausted.
 * This is the ONLY reliable way to know a project hit the limit — local
 * tallying is best-effort and never authoritative.
 */
export function isQuotaError(err) {
  if (!err) return false
  if (err.code === 'resource-exhausted') return true
  return /quota|resource-exhausted|exceeded/i.test(String(err.message || ''))
}

/** Which project is the real author of today's billed usage?
 *
 * On a real Firebase project (production, Cloudflare deploy, live mode) the
 * project-wide quota is the source of truth and the local tally is only an
 * ESTIMATE. On localhost WITHOUT a signed-in Firebase user, we cannot read the
 * project's real usage at all (admin SDK not available), so we rely on the
 * tally + Console (operator opens it manually).
 *
 * This function is stable across reloads and survives localStorage clearing —
 * the presence of REAL usage data on the running SDK is the only honest signal.
 */
export function isRealProject() {
  if (typeof window === 'undefined') return false
  return Boolean(VITE_FIREBASE_PROJECT_ID)
}

/**
 * Quota-monitor notes — stable strings the UI shows so the operator always
 * knows what the numbers mean, on localhost and on a deployed build.
 */
export const QUOTA_STATUS_NOTE = {
  LOCALHOST_NO_PROJECT: 'Local dev (no Firebase project id in environment) — this browser\u2019s tally is an estimate only. The real daily quota lives on Firebase Console \u2192 Firestore \u2192 Usage (project-wide, all devices).',
  DEPLOY: 'Deployed build — the Raw bar is this browser\u2019s tally; the Firebase bar is the project\u2019s real daily usage (authoritative). If they disagree, trust the Firebase bar.',
  REAL_UNAVAILABLE: 'Project is reachable but the browser SDK cannot read today\u2019s real usage — open Firebase Console \u2192 Firestore \u2192 Usage for the authoritative count.',
  REAL_AVAILABLE: 'Bars show the project\u2019s REAL billable usage — synced from Google Cloud Monitoring, the same source Firebase Console \u2192 Usage and billing renders (may lag a couple of minutes).',
  NEEDS_AUTH: 'One-time Google grant needed — click \u201cSync with Firebase\u201d to pull the REAL Usage-and-billing counts into these bars (read-only; project owner).',
  OAUTH_NOT_CONFIGURED: 'To see the REAL Usage-and-billing numbers here, add VITE_GOOGLE_OAUTH_CLIENT_ID to the environment (README \u2192 \u201cReal quota sync\u201d). Until then this bar is only this browser\u2019s tally.',
  SYNC_FAILED: 'Cloud Monitoring sync failed — Firebase Console \u2192 Usage stays authoritative.',
}

/* ------------------------------------------------------------------ *
 *  Pacific-time day bookkeeping (quota window = midnight PT)
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

/** ISO timestamp of the next midnight PT (when the daily quota resets). */
export function nextPacificMidnightIso() {
  const now = new Date()
  const day = pacificDayKey(now)
  if (nextPacificMidnightIso.cache?.day === day) return nextPacificMidnightIso.cache.iso
  // Walk forward in 30-min steps until the PT calendar day changes…
  let t = now.getTime()
  while (pacificDayKey(new Date(t)) === day) t += 30 * 60000
  // …then binary-refine to the minute (DST-safe).
  let lo = t - 30 * 60000
  let hi = t
  while (hi - lo > 60000) {
    const mid = Math.floor((lo + hi) / 2)
    if (pacificDayKey(new Date(mid)) === day) lo = mid
    else hi = mid
  }
  const iso = new Date(hi).toISOString()
  nextPacificMidnightIso.cache = { day, iso }
  return iso
}

/* ------------------------------------------------------------------ *
 *  Quota accounting
 * ------------------------------------------------------------------ */

let usageStore = (() => {
  try {
    const parsed = JSON.parse(safeGet(LS.usage) || '{}')
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    /* fall through to a fresh store */
  }
  return {}
})()

function usageEntry(backend) {
  if (!usageStore[backend]) usageStore[backend] = { day: '', reads: 0, writes: 0, deletes: 0 }
  return usageStore[backend]
}

/** Resets the counters when the Pacific-time day has rolled over. */
function ensureDay(entry) {
  const day = pacificDayKey()
  if (entry.day !== day) {
    entry.day = day
    entry.reads = 0
    entry.writes = 0
    entry.deletes = 0
    return true
  }
  return false
}

function ensureDayAll() {
  let rolled = ensureDay(usageEntry('primary'))
  rolled = ensureDay(usageEntry('backup')) || rolled
  if (rolled) persistUsage()
  return rolled
}

function persistUsage() {
  safeSet(LS.usage, JSON.stringify(usageStore))
}

/** Live usage for one project, with percentage helpers for the UI. */
export function getUsage(backend) {
  const entry = usageEntry(backend)
  ensureDay(entry)
  const pct = {
    reads: entry.reads / QUOTA_LIMITS.reads,
    writes: entry.writes / QUOTA_LIMITS.writes,
    deletes: entry.deletes / QUOTA_LIMITS.deletes,
  }
  pct.overall = Math.max(pct.reads, pct.writes, pct.deletes)
  return { ...entry, limits: QUOTA_LIMITS, resetsAt: nextPacificMidnightIso(), pct }
}

/** Real Firebase usage shape, when reachably available from the running SDK. */
export const REAL_USAGE_NA = null

/**
 * Pull TODAY's REAL billable counts (reads/writes/deletes) — the exact numbers
 * Firebase Console → Usage and billing shows. The Console itself is rendered
 * from Cloud Monitoring metrics, and those are queryable from the browser with
 * a read-only OAuth grant from the project owner (see utils/realUsage.js and
 * README → "Real quota sync"). No server, no Blaze plan, Cloudflare-friendly.
 *
 * Returns one of:
 *   { used:{reads,writes,deletes}, limit, pct, resetAt, note } → real numbers
 *   { needsAuth:true, used:null, …, note }                     → one click away
 *   { used:null, …, note }                                     → explains why not
 *   null                                                       → not applicable
 *
 * On success the LOCAL tally is snapped onto the real project-wide counts
 * (adoptRealUsage): the quota bars then literally show the Console numbers,
 * and the 80%/92% failover thresholds finally react to ALL devices' traffic
 * (the Console viewer and other stations included), not just this browser's.
 */
export async function getRealUsageIfAvailable() {
  if (!VITE_FIREBASE_PROJECT_ID) return REAL_USAGE_NA
  if (!isRealUsageConfigured()) {
    return {
      used: null,
      limit: QUOTA_LIMITS.reads,
      pct: null,
      resetAt: nextPacificMidnightIso(),
      note: QUOTA_STATUS_NOTE.OAUTH_NOT_CONFIGURED,
    }
  }
  try {
    const real = await fetchRealFirestoreUsage(VITE_FIREBASE_PROJECT_ID)
    if (!real) {
      // No token this session — the widget offers the one-click sync button.
      return {
        needsAuth: true,
        used: null,
        limit: QUOTA_LIMITS.reads,
        pct: null,
        resetAt: nextPacificMidnightIso(),
        note: QUOTA_STATUS_NOTE.NEEDS_AUTH,
      }
    }
    adoptRealUsage('primary', real)
    const reads = real.reads || 0
    return {
      used: { reads, writes: real.writes || 0, deletes: real.deletes || 0 },
      limit: QUOTA_LIMITS.reads,
      pct: Math.round((reads / QUOTA_LIMITS.reads) * 1000) / 10,
      resetAt: nextPacificMidnightIso(),
      syncedAt: real.at,
      note: QUOTA_STATUS_NOTE.REAL_AVAILABLE,
    }
  } catch (err) {
    return {
      used: null,
      limit: QUOTA_LIMITS.reads,
      pct: null,
      resetAt: nextPacificMidnightIso(),
      note: `${QUOTA_STATUS_NOTE.SYNC_FAILED} (${err?.message || err})`,
    }
  }
}

/** "Sync with Firebase" button flow — Google grant (once per session), then
 *  today's real counts. Throws with an operator-readable message. */
export async function syncRealUsageInteractive() {
  if (!VITE_FIREBASE_PROJECT_ID) throw new Error('No Firebase project id is configured.')
  const real = await fetchRealFirestoreUsageInteractive(VITE_FIREBASE_PROJECT_ID)
  adoptRealUsage('primary', real)
  return real
}

/**
 * Snap the local tally onto the REAL project-wide counts. The tally only ever
 * counted THIS browser, so the failover thresholds were blind to every other
 * device, the Firebase Console viewer, and any other client; adopting the
 * authoritative figure makes all devices converge on the same numbers, and
 * whichever crosses a threshold first fails the whole app over.
 * (Monitoring data lags the Console by a couple of minutes — same as the UI.)
 */
function adoptRealUsage(backend, real) {
  const entry = usageEntry(backend)
  ensureDay(entry)
  entry.reads = Math.round(real.reads || 0)
  entry.writes = Math.round(real.writes || 0)
  entry.deletes = Math.round(real.deletes || 0)
  persistUsage()
  emitChange()
  if (backend === 'primary') checkThresholds()
}

/** Counts n operations of `kind` against `backend` and runs threshold checks. */
function countOp(kind, n, backend = getActiveBackend()) {
  if (!n) return
  const entry = usageEntry(backend)
  entry[kind] = (entry[kind] || 0) + n
  persistUsage()
  emitChange()
  if (backend === 'primary') checkThresholds()
}

/** Bump a running tally by n, but never over the real project's authored limit.
 *
 * When we KNOW the real usage (from a successful fetch / SDK), we use it to
 * CAP the tally so a desync can only produce an UNDER-count, never an over-count.
 * Without a real figure we keep the tally as-is (best-effort estimate).
 */
export function capTallyAtRealUsage(backend, realReads, realWrites, realDeletes, realLimitReads) {
  const entry = usageEntry(backend)
  if (realReads !== null && realLimitReads > 0) {
    // Clip the reads tally to the real reads, floored at 0. Writes/deletes we
    // still estimate because they have real limits too, but the read number is
    // what hits the 50K cap first.
    const realRounded = Math.round(realReads)
    entry.reads = Math.min(entry.reads, realRounded)
  }
  if (realWrites !== null) entry.writes = Math.min(entry.writes, Math.round(realWrites))
  if (realDeletes !== null) entry.deletes = Math.min(entry.deletes, Math.round(realDeletes))
  persistUsage()
  emitChange()
}

const countReads = (backend, n) => countOp('reads', n, backend)
const countWrites = (backend, n) => countOp('writes', n, backend)
const countDeletes = (backend, n) => countOp('deletes', n, backend)

/* ------------------------------------------------------------------ *
 *  Change emitter (quota UI + caches subscribe here)
 * ------------------------------------------------------------------ */

const listeners = new Set()
export function onGatewayChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emitChange() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch {
      /* listener errors must never break the gateway */
    }
  })
}

/* ------------------------------------------------------------------ *
 *  Active-backend state + failover
 * ------------------------------------------------------------------ */

let activeBackend = safeGet(LS.active) === 'backup' ? 'backup' : 'primary'
let failoverReason = safeGet(LS.failover) || null
let softWarned = false
let hardHandled = false
let mirroring = null
let lastSyncAt = safeGet(LS.lastSync) || null

/** Which project serves traffic right now: 'primary' | 'backup'. */
export function getActiveBackend() {
  return isBackupConfigured() ? activeBackend : 'primary'
}

export function getFailoverInfo() {
  return { active: getActiveBackend(), reason: failoverReason, lastSyncAt, mirroring: !!mirroring }
}

const setFailover = (backend, reason) => {
  if (activeBackend === backend && failoverReason === reason) return
  activeBackend = backend
  failoverReason = reason
  if (backend === 'backup') {
    safeSet(LS.active, 'backup')
    safeSet(LS.failover, reason || 'quota')
  } else {
    safeRemove(LS.active)
    safeRemove(LS.failover)
  }
  console.warn(`[gateway] active backend → ${backend}${reason ? ` (${reason})` : ''}`)
  emitChange()
  // Live listeners keep streaming from the OLD project until resubscribed —
  // the simplest correct move is one reload so every page rebuilds its queries
  // against the new backend. The window flag guarantees a single reload.
  if (typeof window !== 'undefined' && !window.__casscanFailoverReload) {
    window.__casscanFailoverReload = true
    setTimeout(() => window.location.reload(), 1500)
  }
}

/**
 * Threshold watcher — runs after every primary op.
 *  • ≥80% of any limit → mirror primary→backup (once) + console warn.
 *  • ≥92% of any limit → switch to the backup project.
 */
function checkThresholds() {
  if (!isBackupConfigured()) return
  const usage = getUsage('primary')
  const worst = Math.max(usage.pct.reads, usage.pct.writes, usage.pct.deletes)

  if (worst >= HARD_RATIO && !hardHandled) {
    hardHandled = true
    softWarned = true
    void mirrorPrimaryToBackup().finally(() => setFailover('backup', 'quota-threshold'))
  } else if (worst >= SOFT_RATIO && !softWarned) {
    softWarned = true
    console.warn(
      `[gateway] primary quota at ${Math.round(worst * 100)}% — mirroring to backup project so failover is ready.`,
    )
    void mirrorPrimaryToBackup()
  }
}

/** Reset per-day threshold latches (called when the PT day rolls over). */
function resetThresholdLatches() {
  softWarned = false
  hardHandled = false
}

/** Manual escape hatch (Settings) — force traffic back onto the primary. */
export function forcePrimary() {
  resetThresholdLatches()
  setFailover('primary', null)
}

/* ------------------------------------------------------------------ *
 *  Primary ⇄ Backup sync engine (no duplication)
 * ------------------------------------------------------------------ */

/**
 * Mirror every collection from `sourceDb` into `targetDb` using IDENTICAL
 * document ids. setDoc overwrites whole documents (so re-running never
 * duplicates), and source documents that no longer exist are deleted from the
 * target — the target ends up an exact copy of the source.
 *
 * Reads/writes here are counted against the projects they actually hit, and
 * the manifest of synced ids is cached so an immediate re-sync skips reads.
 *
 * @param {{direction?: 'primary→backup'|'backup→primary', force?: boolean}} opts
 * @returns {{synced: number, deleted: number, perCollection: Object}}
 */
export async function syncDatabases({ direction = 'primary→backup', force = false } = {}) {
  if (!isBackupConfigured()) throw new Error('Backup Firebase project is not configured.')
  if (mirroring && !force) return mirroring
  if (activeBackend === 'backup' && direction === 'primary→backup' && !force) {
    // Primary is over quota — mirroring FROM it would just burn more quota.
    return { synced: 0, deleted: 0, perCollection: {}, skipped: 'failover-active' }
  }

  const sourceDb = direction === 'backup→primary' ? getBackupDb() : primaryDb
  const targetDb = direction === 'backup→primary' ? primaryDb : getBackupDb()
  const sourceName = direction === 'backup→primary' ? 'backup' : 'primary'
  const targetName = direction === 'backup→primary' ? 'primary' : 'backup'

  mirroring = (async () => {
    const perCollection = {}
    let synced = 0
    let deleted = 0
    for (const coll of SYNC_COLLECTIONS) {
      const r = await syncCollection(sourceDb, targetDb, coll, sourceName, targetName, force)
      perCollection[coll] = r
      synced += r.synced
      deleted += r.deleted
    }
    lastSyncAt = new Date().toISOString()
    safeSet(LS.lastSync, lastSyncAt)
    emitChange()
    console.info(`[gateway] ${direction} sync done — ${synced} upserted, ${deleted} removed`, perCollection)
    return { synced, deleted, perCollection }
  })()

  try {
    return await mirroring
  } finally {
    mirroring = null
  }
}

/** Convenience wrapper used by the threshold watcher. */
export const mirrorPrimaryToBackup = (force = false) =>
  syncDatabases({ direction: 'primary→backup', force })

/**
 * After failover, push everything created on the backup project BACK into the
 * primary so the two stay consistent, then resume on the primary.
 */
export async function restorePrimaryFromBackup() {
  await syncDatabases({ direction: 'backup→primary', force: true })
  setFailover('primary', null)
  resetThresholdLatches()
}

async function syncCollection(sourceDb, targetDb, collName, sourceName, targetName, force) {
  const manifestKey = `${LS.manifest}:${direction_key(sourceName, targetName)}:${collName}`
  const cachedManifest = force ? null : readManifest(manifestKey)

  const srcSnap = await fsGetDocs(fsCollection(sourceDb, collName))
  countReads(sourceName, srcSnap.size || 1)

  const sourceDocs = srcSnap.docs.map((d) => ({ id: d.id, data: d.data() }))
  const sourceIds = new Set(sourceDocs.map((d) => d.id))
  let upserted = 0
  let deleted = 0

  // Which ids exist on the target? Prefer the cached manifest (0 reads);
  // otherwise — for small collections — read the target's ids once.
  let targetIds = cachedManifest
  if (!targetIds && srcSnap.size <= MANIFEST_CAP) {
    const tgtSnap = await fsGetDocs(fsCollection(targetDb, collName))
    countReads(targetName, tgtSnap.size || 1)
    targetIds = new Set(tgtSnap.docs.map((d) => d.id))
  }

  // 1) Upsert every source doc under the SAME id (overwrite = no duplicates).
  for (const group of chunk(sourceDocs, BATCH_SIZE)) {
    const batch = fsWriteBatch(targetDb)
    group.forEach((d) => batch.set(fsDoc(targetDb, collName, d.id), stripUndefined(d.data)))
    await batch.commit()
    countWrites(targetName, group.length)
    upserted += group.length
  }

  // 2) Delete target docs that no longer exist on the source.
  if (targetIds && targetIds.size) {
    const gone = [...targetIds].filter((id) => !sourceIds.has(id))
    for (const group of chunk(gone, BATCH_SIZE)) {
      const batch = fsWriteBatch(targetDb)
      group.forEach((id) => batch.delete(fsDoc(targetDb, collName, id)))
      await batch.commit()
      countDeletes(targetName, group.length)
      deleted += group.length
    }
  }

  writeManifest(manifestKey, sourceIds)
  return { synced: upserted, deleted, total: sourceDocs.length }
}

const direction_key = (from, to) => `${from}->${to}`

function readManifest(key) {
  try {
    const raw = safeGet(key)
    if (!raw) return null
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? new Set(arr) : null
  } catch {
    return null
  }
}

function writeManifest(key, idsSet) {
  try {
    safeSet(key, JSON.stringify([...idsSet]))
  } catch {
    /* manifest too big for localStorage — fine, next sync reads target ids */
  }
}

/** Firestore rejects `undefined` values — drop those keys before setDoc. */
function stripUndefined(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj || {})) if (v !== undefined) out[k] = v
  return out
}

/* ------------------------------------------------------------------ *
 *  Firestore API proxy — drop-in replacement for firebase/firestore
 *
 *  Pages import these instead of the raw SDK functions. Everything binds to
 *  the ACTIVE project at call time, counts quota, and fails over on real
 *  `resource-exhausted` errors. Non-db helpers (query, where, orderBy, limit,
 *  serverTimestamp, …) stay imported from 'firebase/firestore' directly.
 * ------------------------------------------------------------------ */

/** Firestore instance of the active backend (primary, or backup in failover). */
export function active() {
  ensureDayAll()
  return getActiveBackend() === 'backup' ? getBackupDb() : primaryDb
}

/** True while traffic is served by the backup project. */
export const isFailoverActive = () => getActiveBackend() === 'backup'

/** Rebuild a document ref against the ACTIVE project (failover-safe). */
function toActiveRef(ref) {
  if (ref && typeof ref.path === 'string' && ref.path) {
    return fsDoc(active(), ...ref.path.split('/'))
  }
  return ref
}

/**
 * Runs `op`, and if Firestore reports the daily quota is exhausted, switches to
 * the backup project (mirroring first) and retries there once.
 */
async function withFailover(op) {
  try {
    return await op()
  } catch (err) {
    if (isQuotaError(err) && isBackupConfigured() && getActiveBackend() === 'primary') {
      hardHandled = true
      softWarned = true
      try {
        await mirrorPrimaryToBackup()
      } catch {
        /* mirror is best-effort — failover must still proceed */
      }
      setFailover('backup', 'resource-exhausted')
      return op() // retry on the (new) active backend
    }
    throw err
  }
}

/* ---- mutation echo (cache invalidation) ---- */

const mutListeners = new Set()
export function onMutation(fn) {
  mutListeners.add(fn)
  return () => mutListeners.delete(fn)
}
function emitMutation(type, meta) {
  mutListeners.forEach((fn) => {
    try {
      fn({ type, ...meta })
    } catch {
      /* ignore listener errors */
    }
  })
}
const collFromPath = (path) => (path ? String(path).split('/')[0] : null)

/* ---- read APIs ---- */

export function collection(_dbArg, ...pathSegments) {
  return fsCollection(active(), ...pathSegments)
}

export function doc(_dbArg, ...pathSegments) {
  return fsDoc(active(), ...pathSegments)
}

/** One-shot read — counts the documents returned. */
export async function getDocs(queryOrRef) {
  const res = await withFailover(() => fsGetDocs(queryOrRef))
  countReads(getActiveBackend(), res.size || 0)
  emitMutation('read', { collection: guessColl(queryOrRef) })
  return res
}

/**
 * COUNT() aggregate — answers "how many documents match?" for a fraction of
 * the cost: Firestore bills one read per 1000 matched index entries instead of
 * one read per document. Counting 50k records costs ~50 reads, not 50,000.
 */
export async function getCountFromServer(queryArg) {
  const snap = await withFailover(() => fsGetCountFromServer(queryArg))
  const n = snap?.data?.().count || 0
  // Firestore bills COUNT() at ~1 read per 1000 matched index entries.
  // Use the conservative upper bound (n/1000) so our tally never
  // under-reports and surprises the operator.
  countReads(getActiveBackend(), Math.max(1, Math.ceil(n / 1000)))
  return snap
}

/**
 * Reconcile: compare our local tally against the real Firebase project's daily
 * usage, when the SDK can actually report it. The real figure is authoritative;
 * the tally is only fallbacks when we cannot reach it.
 *
 * Call this once per page load (or more often) to refresh `getGatewayStatus()`
 * with the true project figure. Returns { real: null | {reads,writes,deletes,limit,reset}, diff: ... }.
 */
export async function reconcileWithRealUsage(_backend = getActiveBackend()) {
  if (!isRealProject()) return { real: null, diff: null, note: 'localhost-no-project-id: cannot read real usage (no Firebase Admin / signed-in user). Open Firebase Console for the true count.' }
  try {
    // The browser SDK exposes usage via the REST usage endpoint only when a user
    // is signed in with an Admin-ish role (or via an API key with restricted usage
    // read access). We try the REST metadata endpoint; on failure we return null.
    const projectId = VITE_FIREBASE_PROJECT_ID
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:search?pageSize=1`
    const resp = await fetch(url, { method: 'GET', mode: 'cors' })
    if (!resp.ok) throw new Error(`usage endpoint returned ${resp.status} (${resp.statusText})`)
    const body = await resp.json()
    // Firestore REST usage docs don't expose a simple readsToday field — instead
    // the Console's usage API serves daily-usage records; we use what we can get.
    // If we reach this far we still mark 'real' as reachable.
    if (body && body.typicalCounters) {
      // This shape exists on some endpoints but we keep the attempt conservative.
      return { real: null, diff: null, note: `project ${projectId} reachable via REST, but daily read count not exposed — check Firebase Console → Firestore → Usage for the true count.` }
    }
    return { real: null, diff: null, note: `project ${projectId} reachable but no usable usage shape returned — check Firebase Console → Firestore → Usage for the true count.` }
  } catch (err) {
    return { real: null, diff: null, note: `could not reach real usage endpoint: ${err?.message || err}` }
  }
}

/**
 * Zero-Waste cache-first reads. Local persistence (IndexedDB) costs ZERO
 * billed reads — the network is only touched on a cache miss, and the miss is
 * what gets counted against the daily quota.
 */

/** Single document: cache first, server fallback (counts 1 read on miss). */
export async function getDocCached(ref) {
  try {
    const snap = await fsGetDocFromCache(toActiveRef(ref))
    if (snap.exists()) return snap
  } catch {
    /* not in cache — fall through to the server */
  }
  const snap = await withFailover(() => fsGetDocFromServer(toActiveRef(ref)))
  countReads(getActiveBackend(), 1)
  return snap
}
/**
 * Single document: SERVER first — the authoritative read for explicit
 * refreshes where cross-device staleness matters (a roster updated on another
 * device must reach this one). Falls back to the local cache when the network
 * is unreachable (offline boot/refresh). Counts 1 read on a server hit.
 * getDocCached stays the zero-billed warm-boot path; this is the fresh twin.
 */
export async function getDocFresh(ref) {
  try {
    const snap = await withFailover(() => fsGetDocFromServer(toActiveRef(ref)))
    countReads(getActiveBackend(), 1)
    return snap
  } catch {
    // Offline / server unreachable — serve whatever the local cache holds.
    return fsGetDocFromCache(toActiveRef(ref))
  }
}

/** Collection/query: cache first; only an empty/failed cache hits the server. */

/** Collection/query: cache first; only an empty/failed cache hits the server. */
export async function getDocsCached(queryArg) {
  try {
    const snap = await fsGetDocsFromCache(queryArg)
    if (snap.size > 0) return snap
  } catch {
    /* not in cache — fall through to the server */
  }
  const snap = await withFailover(() => fsGetDocs(queryArg))
  countReads(getActiveBackend(), snap.size || 0)
  return snap
}

/** Live listener — counts the docs in every delivered snapshot. */
export function onSnapshot(reference, ...rest) {
  const wrapped = rest.map((arg) => {
    if (typeof arg !== 'function') return arg
    return (snapOrDoc) => {
      try {
        // Only snapshot deliveries bill reads — error callbacks arrive here
        // too (a FirestoreError has no .size/.exists) and must NOT count,
        // or every transient listener error would inflate the quota tally.
        const isSnapshot =
          snapOrDoc && (typeof snapOrDoc.exists === 'function' || typeof snapOrDoc.size === 'number')
        if (isSnapshot) {
          const n = typeof snapOrDoc.size === 'number' ? snapOrDoc.size : 1
          countReads(getActiveBackend(), n)
        }
      } catch {
        /* counting must never break the listener */
      }
      return arg(snapOrDoc)
    }
  })
  return fsOnSnapshot(reference, ...wrapped)
}

function guessColl(q) {
  try {
    // Query objects expose their path via internal fields; this is only used
    // for cache invalidation labels, so any failure is harmless.
    const p = q?._query?.path?.segments?.join('/') || q?.path
    return collFromPath(p) || 'unknown'
  } catch {
    return 'unknown'
  }
}

    /* ---- write APIs ---- */

export function setDoc(ref, data, options) {
  return withFailover(() => fsSetDoc(toActiveRef(ref), data, options)).then((res) => {
    countWrites(getActiveBackend(), 1)
    emitMutation('set', { collection: collFromPath(ref?.path), path: ref?.path })
    return res
  })
}

export function updateDoc(ref, data) {
  return withFailover(() => fsUpdateDoc(toActiveRef(ref), data)).then((res) => {
    countWrites(getActiveBackend(), 1)
    emitMutation('update', { collection: collFromPath(ref?.path), path: ref?.path })
    return res
  })
}

export function deleteDoc(ref) {
  return withFailover(() => fsDeleteDoc(toActiveRef(ref))).then((res) => {
    countDeletes(getActiveBackend(), 1)
    emitMutation('delete', { collection: collFromPath(ref?.path), path: ref?.path })
    return res
  })
}

/**
 * Batch proxy — refs are remapped onto the active project (so a batch built
 * with refs from one backend still commits correctly after a failover) and
 * writes/deletes are counted on commit.
 */
export function writeBatch(_dbArg) {
  const batch = fsWriteBatch(active())
  let writes = 0
  let deletes = 0
  const colls = new Set()
  const proxy = {
    set(ref, data, options) {
      writes += 1
      if (ref?.path) colls.add(collFromPath(ref.path))
      batch.set(toActiveRef(ref), data, options)
      return proxy
    },
    update(ref, data) {
      writes += 1
      if (ref?.path) colls.add(collFromPath(ref.path))
      batch.update(toActiveRef(ref), data)
      return proxy
    },
    delete(ref) {
      deletes += 1
      if (ref?.path) colls.add(collFromPath(ref.path))
      batch.delete(toActiveRef(ref))
      return proxy
    },
    async commit() {
      const res = await withFailover(() => batch.commit())
      countWrites(getActiveBackend(), writes)
      countDeletes(getActiveBackend(), deletes)
      emitMutation('batch', { collection: [...colls].join(','), writes, deletes })
      return res
    },
  }
  return proxy
}

/**
 * Transaction proxy — the update function receives a tx whose get/set/update/
 * delete are remapped onto the active project and counted.
 */
export function runTransaction(dbArg, updateFunction) {
  return withFailover(() =>
    fsRunTransaction(active(), async (tx) => {
      const txProxy = {
        get: async (ref) => {
          const snap = await tx.get(toActiveRef(ref))
          countReads(getActiveBackend(), 1)
          return snap
        },
        set: (ref, data, options) => {
          tx.set(toActiveRef(ref), data, options)
          return txProxy
        },
        update: (ref, data) => {
          tx.update(toActiveRef(ref), data)
          return txProxy
        },
        delete: (ref) => {
          tx.delete(toActiveRef(ref))
          return txProxy
        },
      }
      return updateFunction(txProxy)
    }),
  ).then((res) => {
    emitMutation('transaction', { collection: 'unknown' })
    return res
  })
}

/* ------------------------------------------------------------------ *
 *  Day rollover + status snapshot (for the quota UI)
 * ------------------------------------------------------------------ */

/**
 * Call periodically (App ticks every minute): rolls counters when the
 * Pacific-time day changes, re-arms thresholds, and — after a quota failover —
 * pushes backup data home and returns to the primary now that quota is fresh.
 */
export async function rollDayIfNeeded() {
  const rolled = ensureDayAll()
  if (!rolled) return false
  resetThresholdLatches()
  emitChange()
  if (getActiveBackend() === 'backup' && isBackupConfigured() && failoverReason !== 'manual') {
    try {
      await syncDatabases({ direction: 'backup→primary', force: true })
      setFailover('primary', null)
      console.info('[gateway] new quota day — restored backup data to primary and switched back.')
    } catch (err) {
      console.warn('[gateway] auto-restore after rollover failed; staying on backup.', err)
    }
  }
  return true
}

/** Everything the Settings/monitor UI needs, in one object. */
export function getGatewayStatus() {
  return {
    configured: isBackupConfigured(),
    active: getActiveBackend(),
    reason: failoverReason,
    lastSyncAt,
    mirroring: !!mirroring,
    primary: getUsage('primary'),
    backup: isBackupConfigured() ? getUsage('backup') : null,
    resetsAt: nextPacificMidnightIso(),
    real: null,
    realNote: null,
    realGap: null,
  }
}

/** Manual escape hatch — force all traffic onto the backup project now. */
export function forceBackup(reason = 'manual') {
  if (!isBackupConfigured()) throw new Error('Backup Firebase project is not configured.')
  hardHandled = true
  softWarned = true
  setFailover('backup', reason)
}

/**
 * Manual switch used by the quota monitor's "Use backup now": FIRST mirror
 * every primary collection into the backup (so no change made on the primary
 * is lost), THEN flip traffic. Throws when the mirror fails — the caller must
 * stay on the primary rather than half-switching.
 */
export async function switchToBackupWithSync() {
  if (!isBackupConfigured()) throw new Error('Backup Firebase project is not configured.')
  await syncDatabases({ direction: 'primary→backup', force: true })
  hardHandled = true
  softWarned = true
  setFailover('backup', 'manual')
}
