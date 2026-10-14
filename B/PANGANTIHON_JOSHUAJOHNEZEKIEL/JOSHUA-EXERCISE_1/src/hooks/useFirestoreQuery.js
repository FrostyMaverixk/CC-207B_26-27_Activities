import { useCallback, useEffect, useRef, useState } from 'react'
import { onSnapshot, onMutation, getUsage, getActiveBackend, SOFT_RATIO } from '../utils/firestoreGateway'

/* ------------------------------------------------------------------ *
 *  Shared snapshot cache — the daily-quota optimiser.
 *
 *  Without a cache, every tab visit re-subscribes and re-reads entire
 *  collections (Students = 1 read/doc every visit). With the cache:
 *    • a hook whose cache entry is fresh (< TTL old) paints instantly and
 *      subscribes to NOTHING — zero reads;
 *    • it only goes live when (a) the cache is stale on mount, or (b) a write
 *      touches the same collection (gateway mutation bus), or (c) the caller
 *      opts out with { live: true } (e.g. the always-on active-event query);
 *    • every delivered snapshot refreshes the cache for the next mount.
 *  Keys follow the convention `collection:what` (e.g. "students:all") so
 *  mutation invalidation can match by collection name.
 * ------------------------------------------------------------------ */
const DEFAULT_TTL_MS = 60_000
const cache = new Map()

const cacheFresh = (key, ttl) => {
  const hit = cache.get(key)
  if (!hit) return null
  return Date.now() - hit.at <= ttl ? hit.data : null
}
const cachePut = (key, data) => cache.set(key, { data, at: Date.now() })

/** True when an entry exists but is older than the TTL. */
const cacheStale = (key, ttl) => {
  const hit = cache.get(key)
  return Boolean(hit) && Date.now() - hit.at > ttl
}

/** Manual escape hatch — drop every cached snapshot (used by tests). */
export const clearQueryCache = () => cache.clear()

/* One shared gateway listener fans mutations out to every mounted hook. */
let mutUnsub = null
const mutListeners = new Set()
const ensureMutBus = () => {
  if (!mutUnsub) mutUnsub = onMutation(() => mutListeners.forEach((fn) => fn()))
}

/**
 * Listener errors that a retry can NEVER fix. Resubscribing on these would
 * burn reads forever for nothing — we stop and keep whatever data we have.
 * Everything else (unavailable, network-request-failed, internal, aborted, …)
 * is transient: laptop sleep, Wi-Fi blip, backend hiccup during a long shift.
 */
const PERMANENT_CODES = new Set([
  'permission-denied',
  'unauthenticated',
  'failed-precondition',
  'invalid-argument',
  'not-found',
  'unimplemented',
  'already-exists',
])
/** Backoff schedule (ms) for transient listener failures — capped at 30s. */
const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 20_000, 30_000]

/**
 * Subscribe to a Firestore query/collection/doc reference (via the gateway, so
 * it binds to whichever project is active and counts quota).
 * Pass a memoised reference (useMemo) so the subscription survives re-renders;
 * pass `null` to subscribe to nothing (e.g. while no session is active).
 *
 *   useFirestoreQuery(q, 'students:all')          → cached (60s TTL)
 *   useFirestoreQuery(q, { cacheKey: 'students:all', ttlMs: 30000 })
 *   useFirestoreQuery(q, { live: true })          → always-on listener
 *
 * `loading` and `data` are DERIVED from "have we received a snapshot for the
 * current reference yet?" — so no state is ever set synchronously inside the
 * effect (no cascading renders).
 */
export default function useFirestoreQuery(refOrQuery, opts = {}) {
  const cacheKey = typeof opts === 'string' ? opts : opts?.cacheKey || null
  const live = Boolean(opts?.live)
  const wake = opts?.wake !== false
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS

  const [state, setState] = useState(() => {
    const hit = cacheKey ? cacheFresh(cacheKey, ttlMs) : null
    return hit
      ? { data: hit, error: null, loadedFor: refOrQuery }
      : { data: [], error: null, loadedFor: null }
  })

  const unsubRef = useRef(null)
  const retryTimerRef = useRef(null)
  const retryCountRef = useRef(0)
  const aliveRef = useRef(true)
  /** TRUE when this hook is SUPPOSED to hold a live subscription — only then
   *  may the visibility nudge reconnect it (cache-only hooks must stay
   *  silent, or nudging them would burn reads). */
  const wantLiveRef = useRef(false)
  const detach = () => {
    if (unsubRef.current) {
      unsubRef.current()
      unsubRef.current = null
    }
  }
  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }

  /**
   * Resilient subscription — the long-session fix.
   * Previously ANY listener error (Wi-Fi blip, sleep, backend hiccup) wiped
   * `data` to [] and never retried: the Scan tab's active event "vanished"
   * mid-session and scans were rejected until a full reload. Now:
   *   • the last delivered snapshot is KEPT (the error is only flagged);
   *   • transient errors resubscribe with bounded backoff (1s → 30s);
   *   • permanent errors (permission-denied, …) stop retrying but keep data.
   */
  /** Stable indirection for the deferred retry — the error callback needs to
   *  re-invoke this hook's own subscriber, and a self-capturing useCallback
   *  both trips the React Compiler and reads the variable mid-initialization
   *  (same pattern as ScanAttendance's handlerRef). */
  const resilientRef = useRef(null)
  const subscribeResilient = useCallback(() => {
    if (!refOrQuery || unsubRef.current) return
    clearRetryTimer()
    unsubRef.current = onSnapshot(
      refOrQuery,
      (snap) => {
        retryCountRef.current = 0 // healthy again → backoff resets
        const data = snap.docs
          ? snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          : snap.exists()
            ? [{ id: snap.id, ...snap.data() }]
            : []
        if (cacheKey) cachePut(cacheKey, data)
        setState({ data, error: null, loadedFor: refOrQuery })
      },
      (err) => {
        console.error('[query] listener error — keeping last data:', err?.code || err?.message || err)
        // WITH data already delivered: keep serving it (a parked Scan tab must
        // not lose its active event because the socket blipped). With nothing
        // delivered yet: the original contract — loading=false + error + [].
        // Either way transient errors resubscribe below.
        setState((prev) =>
          prev.loadedFor === refOrQuery
            ? { ...prev, error: err }
            : { data: [], error: err, loadedFor: refOrQuery },
        )
        const code = err?.code || ''
        if (PERMANENT_CODES.has(code)) return // retrying cannot succeed
        // Transient → detach and resubscribe with bounded backoff.
        detach()
        const delay = RETRY_DELAYS_MS[Math.min(retryCountRef.current, RETRY_DELAYS_MS.length - 1)]
        retryCountRef.current += 1
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null
          if (aliveRef.current && !unsubRef.current) resilientRef.current?.()
        }, delay)
      },
    )
  }, [refOrQuery, cacheKey])
  // Keep the indirection current on every commit (never write refs in render).
  useEffect(() => {
    resilientRef.current = subscribeResilient
  })

  /* ---- live subscription management ---- */
  useEffect(() => {
    aliveRef.current = true
    if (!refOrQuery) {
      wantLiveRef.current = false
      detach()
      clearRetryTimer()
      return undefined
    }

    // Fresh cache + not forced live → paint from cache and read nothing.
    const fresh = cacheKey ? cacheFresh(cacheKey, ttlMs) : null
    if (fresh && !live) {
      wantLiveRef.current = false
      setState({ data: fresh, error: null, loadedFor: refOrQuery })
      return undefined
    }

    // Stale-while-over-quota: once the active backend is past the soft
    // threshold, DON'T spend reads refreshing a stale cache — serve it as-is
    // so reads stop before the daily limit is reached. (Failover to the backup
    // project reloads the page on fresh quota, which restores refreshes.)
    if (cacheKey && !live && cacheStale(cacheKey, ttlMs)) {
      const overQuota = getUsage(getActiveBackend()).pct.overall >= SOFT_RATIO
      if (overQuota) {
        console.info('[quota] over soft threshold — serving stale cache for', cacheKey)
        wantLiveRef.current = false
        setState({ data: cache.get(cacheKey)?.data || [], error: null, loadedFor: refOrQuery })
        return undefined
      }
    }

    wantLiveRef.current = true
    retryCountRef.current = 0
    subscribeResilient()
    return () => {
      aliveRef.current = false
      detach()
      clearRetryTimer()
    }
  }, [refOrQuery, cacheKey, live, ttlMs, subscribeResilient])

  /* ---- cache-only hooks wake up when a matching write lands ---- */
  useEffect(() => {
    // wake:false — high-volume collections (attendanceRecords) must not
    // re-read on every scan; they refresh on TTL-expired remounts instead.
    if (!cacheKey || live || !wake) return undefined
    const coll = String(cacheKey).split(':')[0]
    const onMut = (evt) => {
      const touched = String(evt?.collection || 'unknown')
      if (touched === 'unknown' || touched.split(',').includes(coll)) {
        if (refOrQuery && !unsubRef.current) {
          wantLiveRef.current = true
          subscribeResilient()
        }
      }
    }
    mutListeners.add(onMut)
    ensureMutBus()
    return () => mutListeners.delete(onMut)
  }, [refOrQuery, cacheKey, live, wake, subscribeResilient])

  /* ---- reconnect nudge ---- Screens sleep, laptops hibernate, Wi-Fi drops:
     when the operator comes back, retry IMMEDIATELY if the listener died while
     hidden (instead of waiting out the backoff timer). Cache-only hooks
     (wantLiveRef false) stay silent — nudging them would burn reads. */
  useEffect(() => {
    if (!refOrQuery) return undefined
    const onVisible = () => {
      if (document.visibilityState === 'visible' && wantLiveRef.current && !unsubRef.current) {
        subscribeResilient()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refOrQuery, subscribeResilient])

  const fresh = state.loadedFor === refOrQuery
  return {
    data: refOrQuery && fresh ? state.data : [],
    loading: Boolean(refOrQuery) && !fresh,
    error: refOrQuery ? state.error : null,
    /** TRUE while the subscription is unhealthy (errored, retrying) — the UI
     *  can show a "restoring/reconnecting" hint instead of a hard failure. */
    reconnecting: Boolean(refOrQuery && state.error),
  }
}
