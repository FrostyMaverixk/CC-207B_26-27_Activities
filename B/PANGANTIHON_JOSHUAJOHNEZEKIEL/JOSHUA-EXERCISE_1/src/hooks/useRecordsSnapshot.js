/**
 * useRecordsSnapshot — cache-first records for one event, ZERO live reads.
 *
 * Replaces the old `useFirestoreQuery(recordsQuery, { live: true })` pattern
 * that billed one read per delivered scan and re-read the whole event on every
 * tab bounce. Behaviour here:
 *   • cached event  → paints instantly from the cache, ZERO reads
 *   • unknown event → ONE full fetch (R reads), cached for every later visit
 *   • nothing ever subscribes to Firestore — a parked tab costs nothing and
 *     tab switching costs nothing
 *   • `refresh()`    → explicit delta sync (composite-indexed, ~0 reads;
 *     falls back to a full fetch without the index)
 *   • local writes (scans, cancels, edits) arrive via the recordsStore
 *     subscription — same device, other tabs included, no reads
 */
import { useCallback, useEffect, useState } from 'react'
import { fetchRecords, getSnapshot, subscribe } from '../utils/recordsStore'

export default function useRecordsSnapshot(eventId, enabled = true) {
  const [state, setState] = useState(() => {
    if (!eventId || !enabled) return { records: [], loading: false, syncedAt: 0 }
    const snap = getSnapshot(eventId)
    if (snap) return { records: snap.records, loading: false, syncedAt: snap.at }
    return { records: [], loading: true, syncedAt: 0 }
  })

  useEffect(() => {
    if (!eventId || !enabled) return undefined
    let alive = true

    const snap = getSnapshot(eventId)
    if (snap) {
      setState({ records: snap.records, loading: false, syncedAt: snap.at })
    } else {
      setState({ records: [], loading: true, syncedAt: 0 })
      fetchRecords(eventId)
        .catch((err) => {
          console.error('[records] fetch failed:', err?.code || err?.message)
        })
        .finally(() => {
          if (!alive) return
          const fresh = getSnapshot(eventId)
          setState({
            records: fresh ? fresh.records : [],
            loading: false,
            syncedAt: fresh ? fresh.at : 0,
          })
        })
    }

    // Local writes (this tab or another tab on this device) merge into the
    // cache and notify — re-render with ZERO Firestore reads.
    const unsub = subscribe((changedEventId) => {
      if (changedEventId !== eventId || !alive) return
      const next = getSnapshot(eventId)
      if (next) setState({ records: next.records, loading: false, syncedAt: next.at })
    })
    return () => {
      alive = false
      unsub()
    }
  }, [eventId, enabled])

  /** Explicit user action ("Sync" button): delta sync, ~0 reads when indexed. */
  const refresh = useCallback(async () => {
    if (!eventId) return null
    const cur = getSnapshot(eventId)
    try {
      // Dynamic import keeps recordsStore's delta path (and its index
      // dependency) out of the initial render path.
      const { fetchRecordsSince } = await import('../utils/recordsStore')
      if (cur && cur.at) return await fetchRecordsSince(eventId, cur.at)
      return await fetchRecords(eventId)
    } catch (err) {
      // Delta query without the composite index (or offline) → full fetch.
      console.warn('[records] delta sync fell back:', err?.code || err?.message)
      try {
        return await fetchRecords(eventId)
      } catch (err2) {
        console.warn('[records] sync failed:', err2?.code || err2?.message)
        return null
      }
    }
  }, [eventId])

  return { ...state, refresh }
}
