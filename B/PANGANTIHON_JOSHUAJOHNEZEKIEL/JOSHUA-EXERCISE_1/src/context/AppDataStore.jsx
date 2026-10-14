import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, getDocCached, getDocsCached, getDocFresh, getDocs, setDoc, onSnapshot } from '../utils/firestoreGateway'
import { hydrateDirectory, entryOf } from '../utils/dbOps'
import { reloadOnceForStaleContext } from '../utils/staleContextGuard'
import { useAuth } from './AuthContext'

/**
 * AppDataStore — the Zero-Waste global memory.
 *
 * ONE boot fetch per login (cache-first, so warm boots are ~0 billed reads)
 * loads everything every tab needs:
 *   • /meta/student_directory  — all ~1,000 minimal student profiles in ONE doc
 *   • attendanceEvents         — the (small) event list
 *   • attendanceSummaries      — per-event precomputed analytics
 *   • admins                   — the (small) operator list
 *
 * Tab switching reads strictly from this memory — it NEVER fires a Firestore
 * query on mount/unmount. Collections only re-fetch when a lifecycle mutation
 * (start/end/delete event, student import…) explicitly asks for it, and those
 * mutations also patch this store locally so most refreshes cost zero reads.
 *
 * Cross-device freshness: the cache-first boot is PER-DEVICE, so data written
 * on another device/account would never reach a browser whose IndexedDB
 * already held the old copy (the roster bug — and the same bug hid attendance
 * events: one account saw ONE cached event while another saw them all).
 * Always-on listeners (roster doc + the two small metadata collections) keep
 * every account's data identical in real time.
 */

const AppDataContext = createContext(null)

/** Maps a directory entry back to the full student shape the app already uses. */
export const entryToStudent = (e) => ({
  id: e.id,
  studentId: e.id,
  studentNumber: e.num || '',
  fullName: e.name || '',
  program: e.prog || '',
  yearLevel: e.yr || '',
  section: e.sec || '',
  qr: e.qr || e.num || e.id,
})

export function AppDataProvider({ children }) {
  const { admin } = useAuth()
  const [status, setStatus] = useState('idle') // idle | booting | ready | error
  const [error, setError] = useState(null)
  const [directory, setDirectory] = useState([])
  const [events, setEvents] = useState([])
  const [summaries, setSummaries] = useState([])
  const [admins, setAdmins] = useState([])
  const bootRef = useRef(false)
  const adminSignedIn = Boolean(admin)
  /** TRUE once the live directory listener has delivered a server snapshot —
   *  lets boot() skip its (possibly stale) cache paint instead of regressing
   *  fresh cross-device data with an older local cache copy. */
  const liveDirAppliedRef = useRef(false)
  /** Same guards for the events/summaries listeners (live meta sync below):
   *  a stale boot cache read must never regress fresher server data. */
  const liveEventsAppliedRef = useRef(false)
  const liveSummariesAppliedRef = useRef(false)

  const boot = useCallback(async () => {
    if (bootRef.current) return
    bootRef.current = true
    setStatus('booting')
    setError(null)
    try {
      // 1) Student directory — ONE doc, cache-first (0 billed reads on a warm
      //    boot). If it has never been seeded, rebuild it from the roster ONCE.
      const dirRef = doc(null, 'meta', 'student_directory')
      let entries = null
      try {
        const snap = await getDocCached(dirRef)
        if (snap.exists()) entries = snap.data().students || []
      } catch {
        /* fall through to the one-time seed */
      }
      if (!entries) {
        const snap = await getDocs(collection(null, 'students'))
        entries = snap.docs.map((d) => entryOf({ id: d.id, ...d.data() }))
        await setDoc(dirRef, {
          students: entries,
          count: entries.length,
          updatedAt: new Date().toISOString(),
        })
      }
      // Paint instantly from cache — UNLESS the live directory listener (which
      // attaches at login and may resolve first) already delivered the fresher
      // server roster. A stale cache read must never regress fresh data.
      if (!liveDirAppliedRef.current) {
        hydrateDirectory(entries) // dbOps maintains its copy for future writes
        setDirectory(entries)
      }

      // 2) Small metadata collections — cache-first instant paint; the live
      //    listeners below keep them identical across devices/accounts, and
      //    lifecycle mutations still call reloadMeta()/reloadAdmins() as the
      //    explicit refresh hatch.
      const [evSnap, sumSnap, admSnap] = await Promise.all([
        getDocsCached(collection(null, 'attendanceEvents')),
        getDocsCached(collection(null, 'attendanceSummaries')),
        getDocsCached(collection(null, 'admins')),
      ])
      // A stale cache read must never regress fresher listener-delivered data.
      if (!liveEventsAppliedRef.current) {
        setEvents(evSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }
      if (!liveSummariesAppliedRef.current) {
        setSummaries(sumSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }
      setAdmins(
        admSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => String(a.operatorId || '').localeCompare(String(b.operatorId || ''))),
      )
      setStatus('ready')
    } catch (err) {
      bootRef.current = false
      setError(err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (adminSignedIn) {
      boot()
    } else {
      bootRef.current = false
      liveDirAppliedRef.current = false
      liveEventsAppliedRef.current = false
      liveSummariesAppliedRef.current = false
      setStatus('idle')
      setDirectory([])
      setEvents([])
      setSummaries([])
      setAdmins([])
    }
  }, [adminSignedIn, boot])

  /* ---- live roster sync (cross-device freshness) ----
   * The cache-first boot above is PER-DEVICE: a student added on the desktop
   * would never reach a phone that already had the directory in its IndexedDB
   * cache, the Students tab would hide them, and the scanner's byId/byNum/byQr
   * maps would reject their QR as "Unknown". One always-on listener on the
   * single directory doc keeps every device's roster identical in real time.
   * Cost: ~1 read at login + 1 read only when the roster actually changes —
   * an idle device stays at ZERO. Same always-on profile as the app's other
   * critical stream (the active-event listener in ActiveEventContext). */
  useEffect(() => {
    if (!adminSignedIn) return undefined
    liveDirAppliedRef.current = false
    const unsub = onSnapshot(
      doc(null, 'meta', 'student_directory'),
      (snap) => {
        if (!snap.exists()) return // never seeded — boot() seeds it once
        liveDirAppliedRef.current = true
        const entries = snap.data().students || []
        // dbOps' write copy MUST follow remote changes, or the next local
        // writeDirectory() would resurrect remotely-deleted students.
        hydrateDirectory(entries)
        setDirectory(entries)
      },
      (err) => {
        // A dead roster stream must never break a session: the cache-first
        // data stays on screen and refreshDirectory() remains the manual
        // escape hatch. Transient network drops self-heal (SDK retries).
        console.warn('[appdata] directory listener error:', err.code || err.message)
      },
    )
    return unsub
  }, [adminSignedIn])

  /* ---- live metadata sync (cross-device freshness) ----
   * Same rationale as the roster listener above: the cache-first boot is
   * PER-DEVICE, so attendance events started/ended/deleted on another device
   * (or another operator's account) never reached a browser whose IndexedDB
   * already held the attendanceEvents collection — the Attendances tab kept
   * showing a stale subset (one account saw ONE cached event while another
   * account saw the complete list). One always-on listener per small metadata
   * collection keeps every account's event list + analytics identical in real
   * time. Cost: ~1 read per event/summary doc at login, then only deltas when
   * one actually changes — an idle device stays at ZERO. attendanceRecords is
   * deliberately NOT listened to (high volume; recordsStore handles it). */
  useEffect(() => {
    if (!adminSignedIn) return undefined
    liveEventsAppliedRef.current = false
    liveSummariesAppliedRef.current = false
    const unsubEvents = onSnapshot(
      collection(null, 'attendanceEvents'),
      (snap) => {
        liveEventsAppliedRef.current = true
        setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
      (err) => {
        // A dead stream must never break a session: the cache-first data stays
        // on screen and reloadMeta() remains the manual escape hatch.
        console.warn('[appdata] events listener error:', err.code || err.message)
      },
    )
    const unsubSummaries = onSnapshot(
      collection(null, 'attendanceSummaries'),
      (snap) => {
        liveSummariesAppliedRef.current = true
        setSummaries(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
      (err) => {
        console.warn('[appdata] summaries listener error:', err.code || err.message)
      },
    )
    return () => {
      unsubEvents()
      unsubSummaries()
    }
  }, [adminSignedIn])

  /* ---- local mutators: pure memory, ZERO Firestore reads ---- */
  const upsertEventLocal = useCallback((ev) => {
    setEvents((prev) => {
      const i = prev.findIndex((e) => e.eventId === ev.eventId)
      if (i === -1) return [...prev, { ...ev }]
      const next = [...prev]
      next[i] = { ...next[i], ...ev }
      return next
    })
  }, [])

  const patchEventLocal = useCallback((eventId, fields) => {
    setEvents((prev) => prev.map((e) => (e.eventId === eventId ? { ...e, ...fields } : e)))
  }, [])

  const removeEventLocal = useCallback((eventId) => {
    setEvents((prev) => prev.filter((e) => e.eventId !== eventId))
    setSummaries((prev) => prev.filter((s) => s.eventId !== eventId))
  }, [])

  const upsertSummaryLocal = useCallback((s) => {
    setSummaries((prev) => {
      const i = prev.findIndex((x) => x.eventId === s.eventId)
      if (i === -1) return [...prev, { ...s }]
      const next = [...prev]
      next[i] = { ...next[i], ...s }
      return next
    })
  }, [])

  const removeSummaryLocal = useCallback((eventId) => {
    setSummaries((prev) => prev.filter((s) => s.eventId !== eventId))
  }, [])

  const upsertDirectoryEntryLocal = useCallback((student) => {
    const e = entryOf(student)
    setDirectory((prev) => {
      const i = prev.findIndex((x) => x.id === e.id)
      if (i === -1) return [...prev, e]
      const next = [...prev]
      next[i] = e
      return next
    })
  }, [])

  const removeDirectoryEntriesLocal = useCallback((ids) => {
    const drop = new Set(ids)
    setDirectory((prev) => prev.filter((x) => !drop.has(x.id)))
  }, [])

  /** Re-reads the roster straight from the SERVER (authoritative — other
   *  devices' changes included), falling back to the local cache offline.
   *  1 billed read; the live listener otherwise keeps the store fresh. */
  const refreshDirectory = useCallback(async () => {
    const snap = await getDocFresh(doc(null, 'meta', 'student_directory'))
    if (snap.exists()) {
      const entries = snap.data().students || []
      hydrateDirectory(entries)
      setDirectory(entries)
    }
  }, [])

  /** Explicit refresh of the small metadata collections (user-initiated only). */
  const reloadMeta = useCallback(async () => {
    const [evSnap, sumSnap] = await Promise.all([
      getDocs(collection(null, 'attendanceEvents')),
      getDocs(collection(null, 'attendanceSummaries')),
    ])
    setEvents(evSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setSummaries(sumSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }, [])

  const reloadAdmins = useCallback(async () => {
    const snap = await getDocs(collection(null, 'admins'))
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(a.operatorId || '').localeCompare(String(b.operatorId || '')))
    setAdmins(list)
    return list
  }, [])

  /* ---- lookup maps for the scanner (0-read identification) ---- */
  const byId = useMemo(() => {
    const m = {}
    directory.forEach((e) => {
      m[String(e.id).toUpperCase()] = e
    })
    return m
  }, [directory])

  const byNum = useMemo(() => {
    const m = {}
    directory.forEach((e) => {
      if (e.num) m[String(e.num).toUpperCase()] = e
    })
    return m
  }, [directory])

  const byQr = useMemo(() => {
    const m = {}
    directory.forEach((e) => {
      if (e.qr) m[String(e.qr).toUpperCase()] = e
    })
    return m
  }, [directory])

  /** Full student-shaped objects so existing page code keeps working. */
  const students = useMemo(() => directory.map(entryToStudent), [directory])

  const value = useMemo(
    () => ({
      status,
      error,
      boot,
      booting: status === 'booting',
      directory,
      students,
      byId,
      byNum,
      byQr,
      events,
      summaries,
      admins,
      upsertEventLocal,
      patchEventLocal,
      removeEventLocal,
      upsertSummaryLocal,
      removeSummaryLocal,
      upsertDirectoryEntryLocal,
      removeDirectoryEntriesLocal,
      refreshDirectory,
      reloadMeta,
      reloadAdmins,
    }),
    [
      status,
      error,
      boot,
      directory,
      students,
      byId,
      byNum,
      byQr,
      events,
      summaries,
      admins,
      upsertEventLocal,
      patchEventLocal,
      removeEventLocal,
      upsertSummaryLocal,
      removeSummaryLocal,
      upsertDirectoryEntryLocal,
      removeDirectoryEntriesLocal,
      refreshDirectory,
      reloadMeta,
      reloadAdmins,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

const noop = () => {}
/** Transient shell for the single render before a stale-context reload —
 *  every key pages destructure, in their "loading" shape. */
const APP_DATA_STALE_SHELL = Object.freeze({
  status: 'booting',
  error: null,
  boot: async () => {},
  booting: true,
  directory: [],
  students: [],
  byId: {},
  byNum: {},
  byQr: {},
  events: [],
  summaries: [],
  admins: [],
  upsertEventLocal: noop,
  patchEventLocal: noop,
  removeEventLocal: noop,
  upsertSummaryLocal: noop,
  removeSummaryLocal: noop,
  upsertDirectoryEntryLocal: noop,
  removeDirectoryEntriesLocal: noop,
  refreshDirectory: async () => {},
  reloadMeta: async () => {},
  reloadAdmins: async () => [],
})

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (ctx === null) {
    // Stale-instance hatch — see utils/staleContextGuard.js.
    if (reloadOnceForStaleContext('useAppData')) return APP_DATA_STALE_SHELL
    throw new Error('useAppData() called outside <AppDataProvider> (App.jsx).')
  }
  return ctx
}