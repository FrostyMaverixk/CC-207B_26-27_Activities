/**
 * Bulk scan buffer — the Zero-Waste write path for high-volume scanning.
 *
 * Scans are pushed into an in-memory queue (also persisted to localStorage so
 * nothing is lost on a crash/reload) and flushed to Firestore with writeBatch:
 *   • when the queue reaches `maxBatch` entries (400), or
 *   • after `maxWaitMs` of idle time, or
 *   • when the device comes back online (offline queueing for free).
 *
 * Batching turns N individual network round-trips into ⌈N/400⌉ commits. The
 * queue is durable: a failed flush goes back to the front and retries.
 */
import { scanStatusFor } from './attendanceLogic'

const KEY = 'casscan_scan_buffer'

/** Flush threshold — buffered scans leave only in batches of this size. */
export const MAX_BATCH = 100
/** Idle durability bound — a queued scan never waits longer than this. */
export const MAX_WAIT_MS = 60_000

const load = () => {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}
const save = (q) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(q))
  } catch {
    /* storage full/private mode — in-memory queue still works */
  }
}

/**
 * Flush implementation is resolved lazily via a dynamic import so this module
 * never statically depends on dbOps (which imports it back for the end-event
 * flush). The imported module is cached after the first flush.
 */
let flushFn = null
async function defaultFlush(batch) {
  if (!flushFn) {
    const { markPresentBatch } = await import('./dbOps')
    flushFn = markPresentBatch
  }
  return flushFn(batch)
}

let instance = null

/**
 * The page-lifetime scan buffer singleton — shared by the Scan tab (producer),
 * the Start Attendance tab (pending view + cancels) and the end-event job
 * (consumer). One call site, one queue, ZERO Firestore reads to observe it.
 */
export function getScanBuffer() {
  if (instance) return instance

  let queue = load()
  let timer = null
  let flushing = false
  let inflight = null

  const persist = () => save(queue)
  const subscribers = new Set()
  const notify = () => {
    const snap = queue.slice()
    subscribers.forEach((fn) => {
      try {
        fn(snap)
      } catch {
        /* subscriber errors must never break the queue */
      }
    })
  }
  const schedule = () => {
    if (!timer && queue.length) {
      timer = setTimeout(() => {
        timer = null
        flushNow().catch(() => {})
      }, MAX_WAIT_MS)
    }
  }

  /**
   * Flush up to MAX_BATCH scans in one writeBatch commit. If a flush is
   * already in flight, callers queue onto it instead of racing it — this is
   * what lets "End Attendance" await a fully drained queue.
   */
  function flushNow() {
    if (flushing) return inflight || Promise.resolve(0)
    if (queue.length === 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      return Promise.resolve(0)
    }
    flushing = true
    const batch = queue.splice(0, MAX_BATCH)
    inflight = (async () => {
      try {
        await defaultFlush(batch)
        persist()
        notify()
        return batch.length
      } catch (err) {
        queue = batch.concat(queue) // failed group goes back to the front
        persist()
        notify()
        throw err
      } finally {
        flushing = false
        inflight = null
        schedule()
      }
    })()
    return inflight
  }

  /** Drain the queue completely — used by "End Attendance" for integrity. */
  async function flushAll() {
    let total = 0
    for (;;) {
      const n = await flushNow() // throws on flush failure → caller aborts
      if (n === 0) break
      total += n
    }
    return total
  }

  function push(item) {
    queue.push(item)
    persist()
    notify()
    if (queue.length >= MAX_BATCH) flushNow().catch(() => {})
    else schedule()
  }

  /** Drop every pending scan for one student (used by "Cancel attendance"). */
  function removePending(eventId, studentId) {
    const before = queue.length
    queue = queue.filter(
      (it) => !(it.event?.eventId === eventId && it.student?.studentId === studentId),
    )
    if (queue.length !== before) {
      persist()
      notify()
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => flushNow().catch(() => {}))
    // Tab visible again (phone unlocked, laptop woken): flush scans queued
    // while hidden immediately instead of waiting out the 60s idle timer.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') flushNow().catch(() => {})
    })
    // App close / navigation away: persist + best-effort flush. If the flush
    // cannot finish in time the persisted queue is restored on next launch.
    window.addEventListener('pagehide', () => {
      if (queue.length) {
        save(queue)
        flushNow().catch(() => {})
      }
    })
    window.addEventListener('beforeunload', () => {
      if (queue.length) save(queue)
    })
  }
  notify()

  instance = {
    push,
    flushNow,
    flushAll,
    removePending,
    pendingCount: () => queue.length,
    getPending: () => queue.slice(),
    /** Subscribe to the live pending list (fires immediately with a snapshot). */
    subscribe: (fn) => {
      subscribers.add(fn)
      fn(queue.slice())
      return () => subscribers.delete(fn)
    },
    /** Re-arm the idle timer for scans restored from a previous session. */
    restorePending: () => {
      if (queue.length) schedule()
    },
  }
  return instance
}

/** Map a queued scan to the record shape the UI merges (shared by both tabs). */
export function pendingToRecord({ student, event, admin, time }) {
  return {
    id: `${event.eventId}__${student.studentId}`,
    eventId: event.eventId,
    studentId: student.studentId,
    studentNumber: student.studentNumber || '',
    fullName: student.fullName,
    program: student.program || '',
    yearLevel: student.yearLevel || '',
    section: student.section || '',
    status: scanStatusFor(event, time),
    time,
    scannedBy: admin?.operatorId || '',
    scannedByName: admin?.fullName || '',
  }
}