/**
 * Per-event attendance-records cache — the Zero-Waste replacement for live
 * record listeners on the records collections.
 *
 * Why: every Firestore onSnapshot listener bills ONE read per document it
 * delivers. With listeners on the active event, a device merely PARKED on
 * Overview/Scan/Start paid ~1 read per scan made by ANY station (~1,000 per
 * event), every tab bounce re-paid the full snapshot, and re-opening an event
 * detail re-read all ~1,000 records. This store makes records PULL-based:
 *   • first touch of an event  → one full fetch (R reads, cached forever after)
 *   • tab switches / reloads   → served from cache, ZERO reads
 *   • explicit "Sync" button   → delta fetch (only records newer than the last
 *     full sync — needs the (eventId,time) composite index; falls back to a
 *     full fetch if the index is missing)
 *   • own-device scans         → merged into the cache by dbOps after each
 *     writeBatch commit (never advancing the sync anchor, so the delta anchor
 *     stays correct for cross-station records)
 *
 * The cache persists in localStorage (per device) and re-broadcasts to other
 * open tabs via the `storage` event — same-device tabs stay consistent with
 * zero reads. localStorage is best-effort: in private mode or over quota the
 * in-memory copy still works for the session.
 */
import { query, where } from 'firebase/firestore'
import { collection, getDocs } from './firestoreGateway'
import { db } from '../firebase'

const PREFIX = 'casscan_records_'
/** Skip persisting enormous snapshots to localStorage (memory still works). */
const MAX_PERSIST = 2000
/** Clock-skew guard for the delta anchor — re-read a 60s overlap window. */
const SKEW_MS = 60_000

const mem = new Map() // eventId → { at, records }
const subs = new Set()
let wired = false

const keyOf = (eventId) => PREFIX + eventId
const recKey = (r) => r.id || `${r.eventId}__${r.studentId}`
const stampOf = (r) => r.updatedAt || r.time || ''

const notify = (eventId) => {
  subs.forEach((fn) => {
    try {
      fn(eventId)
    } catch {
      /* a broken subscriber must never break the cache */
    }
  })
}

function wireStorage() {
  if (wired || typeof window === 'undefined') return
  wired = true
  // Same device, another tab wrote records → reload that event's cache entry
  // from localStorage and re-render whoever is subscribed. Zero reads.
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith(PREFIX)) return
    const eventId = e.key.slice(PREFIX.length)
    mem.delete(eventId)
    notify(eventId)
  })
}

/** Cached snapshot for an event: { at (last full/delta sync ms), records } | null. */
export function getSnapshot(eventId) {
  if (!eventId) return null
  if (mem.has(eventId)) return mem.get(eventId)
  try {
    const raw = localStorage.getItem(keyOf(eventId))
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.records)) {
        const entry = { at: Number(parsed.at) || 0, records: parsed.records }
        mem.set(eventId, entry)
        return entry
      }
    }
  } catch {
    /* corrupted entry or blocked storage → treat as a cache miss */
  }
  return null
}

/**
 * Merge records into the cache (newest `updatedAt` wins — idempotent for
 * re-scans and repeated flushes). `advanceAt` is TRUE only for server fetches:
 * local writes must NOT move the delta anchor forward, or records written by
 * other stations between our last sync and now would fall through the gap.
 */
export function putSnapshot(eventId, incoming, advanceAt = false) {
  if (!eventId || !Array.isArray(incoming) || incoming.length === 0) return
  const cur = getSnapshot(eventId) || { at: 0, records: [] }
  const byKey = new Map(cur.records.map((r) => [recKey(r), r]))
  incoming.forEach((r) => {
    const k = recKey(r)
    const prev = byKey.get(k)
    if (!prev || stampOf(r) >= stampOf(prev)) byKey.set(k, r)
  })
  const entry = {
    at: advanceAt ? Date.now() : cur.at,
    records: [...byKey.values()],
  }
  mem.set(eventId, entry)
  if (entry.records.length <= MAX_PERSIST) {
    try {
      localStorage.setItem(keyOf(eventId), JSON.stringify(entry))
    } catch {
      /* storage full/private — session memory still holds it */
    }
  } else {
    // Oversized event — surfaced so operators know a reload will re-fetch.
    console.warn(
      `[records] event ${eventId} has ${entry.records.length} records (>${MAX_PERSIST}) — kept in memory only; a reload will re-fetch (${entry.records.length} reads).`,
    )
  }
  notify(eventId)
}

/** Remove records for specific students (after a cancel/delete). */
export function removeFromSnapshot(eventId, studentIds) {
  if (!eventId || !Array.isArray(studentIds) || studentIds.length === 0) return
  const cur = getSnapshot(eventId)
  if (!cur) return
  const gone = new Set(studentIds.map(String))
  const records = cur.records.filter(
    (r) => !gone.has(String(r.studentId)) && !gone.has(String(recKey(r))),
  )
  if (records.length === cur.records.length) return
  const entry = { at: cur.at, records }
  mem.set(eventId, entry)
  try {
    localStorage.setItem(keyOf(eventId), JSON.stringify(entry))
  } catch {
    /* memory only */
  }
  notify(eventId)
}

/** Drop an event's cache entirely (event deleted / reopened from scratch). */
export function dropSnapshot(eventId) {
  if (!eventId) return
  mem.delete(eventId)
  try {
    localStorage.removeItem(keyOf(eventId))
  } catch {
    /* nothing to clean up */
  }
  notify(eventId)
}

/** Subscribe to cache changes for any event. Returns an unsubscribe fn. */
export function subscribe(fn) {
  wireStorage()
  subs.add(fn)
  return () => subs.delete(fn)
}

/**
 * Authoritative FULL fetch of one event's records — used on first touch, by
 * the Sync fallback, and by End Attendance (the integrity anchor).
 * Costs R reads (R = records in the event), then caches the result.
 */
export async function fetchRecords(eventId) {
  const snap = await getDocs(
    query(collection(db, 'attendanceRecords'), where('eventId', '==', eventId)),
  )
  const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  putSnapshot(eventId, records, true)
  return records
}

/**
 * Delta fetch — only records with time > anchor reach the network, so a
 * re-sync of an event you already have costs ~0 reads instead of R. Requires
 * the composite index attendanceRecords(eventId ASC, time ASC); without it
 * Firestore throws failed-precondition and the caller falls back to
 * fetchRecords (correct, just costs R once).
 */
export async function fetchRecordsSince(eventId, anchorMs) {
  const anchor = new Date(Math.max(0, anchorMs - SKEW_MS)).toISOString()
  const snap = await getDocs(
    query(
      collection(db, 'attendanceRecords'),
      where('eventId', '==', eventId),
      where('time', '>', anchor),
    ),
  )
  const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  putSnapshot(eventId, records, true)
  return getSnapshot(eventId).records
}
