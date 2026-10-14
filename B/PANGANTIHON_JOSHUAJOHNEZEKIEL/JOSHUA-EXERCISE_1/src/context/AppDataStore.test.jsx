import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'

/**
 * Cross-device roster freshness regression tests.
 *
 * BUG: /meta/student_directory was read cache-first ONCE per device and never
 * refreshed from the server again — a student added on the desktop never
 * reached a phone whose IndexedDB already held the doc: the Students tab hid
 * them and the scanner rejected their QR with "Unknown QR code".
 *
 * FIX: a live onSnapshot listener on the single directory doc (plus a boot
 * guard so a stale cache read can never regress fresher server data).
 *
 * The same bug class hid ATTENDANCE EVENTS: attendanceEvents was read
 * cache-first once per device, so one account saw a single cached event while
 * another saw the full list (the "attendances not consistent across accounts"
 * bug). The second describe block pins the events/summaries live sync.
 *
 * The gateway + AuthContext are mocked (useFirestoreQuery.test.jsx pattern);
 * dbOps stays REAL so the tests also prove the listener keeps dbOps' module
 * write-copy in sync (remote deletes must not be resurrected by the next
 * local writeDirectory()).
 */

vi.mock('firebase/firestore', () => ({
  deleteField: () => ({ __deleteField: true }),
  query: vi.fn(),
  where: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  increment: vi.fn(),
}))

/* ---- gateway mock — captures listener callbacks per reference ----
 * AppDataStore subscribes to THREE refs: the directory doc, attendanceEvents
 * and attendanceSummaries. Routing each `next` by ref keeps tests firing the
 * stream they intend (the mock below mirrors the real gateway's signature). */
let dirNext = null
let dirUnsub = null
let evNext = null
let evUnsub = null
let sumNext = null
let sumUnsub = null

vi.mock('../utils/firestoreGateway', () => ({
  doc: vi.fn((_db, coll, id) => `${coll}/${id}`),
  collection: vi.fn((_db, coll) => `${coll}`),
  getDocCached: vi.fn(async () => ({ exists: () => false })),
  getDocsCached: vi.fn(async () => ({ docs: [], size: 0 })),
  getDocFresh: vi.fn(async () => ({ exists: () => false })),
  getDocs: vi.fn(async () => ({ docs: [], size: 0 })),
  setDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
  writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), delete: vi.fn(), commit: vi.fn(async () => {}) })),
  runTransaction: vi.fn(async (_db, fn) => fn({
    get: vi.fn(async () => ({ exists: () => false, data: () => ({ count: 0 }) })),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
  onSnapshot: vi.fn((ref, next) => {
    const key = String(ref)
    if (key === 'attendanceSummaries') {
      sumNext = next
      return sumUnsub
    }
    if (key === 'attendanceEvents') {
      evNext = next
      return evUnsub
    }
    dirNext = next
    return dirUnsub
  }),
}))

vi.mock('../firebase', () => ({
  db: { __fake: true },
  getBackupDb: vi.fn(() => null),
  isBackupConfigured: vi.fn(() => false),
}))

vi.mock('../utils/recordsStore', () => ({
  getSnapshot: vi.fn(() => null),
  fetchRecords: vi.fn(),
  fetchRecordsSince: vi.fn(),
  putSnapshot: vi.fn(),
  removeFromSnapshot: vi.fn(),
  dropSnapshot: vi.fn(),
}))

vi.mock('../utils/scanBuffer', () => ({
  getScanBuffer: vi.fn(() => ({
    restorePending: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    getPending: vi.fn(() => []),
  })),
}))

/* Controllable auth — tests flip `currentAdmin` and rerender. */
let currentAdmin = null
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ admin: currentAdmin, loading: false, authError: null, login: vi.fn(), logout: vi.fn() }),
}))

import * as gw from '../utils/firestoreGateway'
import { hydrateDirectory } from '../utils/dbOps'
import { AppDataProvider, useAppData } from './AppDataStore'

/* Directory entries use the minimal entryOf() shape stored in the meta doc. */
const entryA = { id: 'CAS26-001', num: '2026001', name: 'Ada Cruz', prog: 'BSCS', yr: '1', sec: 'A', qr: '2026001' }
const entryB = { id: 'CAS26-002', num: '2026002', name: 'Ben Diaz', prog: 'BSCS', yr: '1', sec: 'A', qr: '2026002' }
const entryC = { id: 'CAS26-003', num: '2026003', name: 'Cara Eves', prog: 'BSCS', yr: '1', sec: 'A', qr: '2026003' }

const dirSnap = (entries) => ({ exists: () => true, data: () => ({ students: entries }) })
const missingSnap = () => ({ exists: () => false })

/** Renders the provider and exposes the freshest context value + rerender. */
function renderStore() {
  const store = { latest: null }
  // Mutation lives in this closure (not in the component's render) so the
  // immutability lint stays happy — Probe merely forwards the context value.
  const capture = (value) => { store.latest = value }
  const Probe = ({ onValue }) => {
    onValue(useAppData())
    return null
  }
  const view = render(
    <AppDataProvider>
      <Probe onValue={capture} />
    </AppDataProvider>,
  )
  return {
    latest: () => store.latest,
    /** Re-captures the context value after the initial Probe is swapped out. */
    capture,
    rerender: view.rerender,
    unmount: view.unmount,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  dirNext = null
  dirUnsub = vi.fn()
  evNext = null
  evUnsub = vi.fn()
  sumNext = null
  sumUnsub = vi.fn()
  currentAdmin = { id: 'op-1', operatorId: 'OP1' }
  // dbOps keeps a MODULE-level copy of the roster — reset it between tests.
  hydrateDirectory([])
})

describe('AppDataStore cross-device roster sync', () => {
  it('paints the cache-first boot, then adopts the live server roster (scanner lookups included)', async () => {
    // Boot's cache-first read returns the STALE device copy (student A only).
    gw.getDocCached.mockImplementation(async () => dirSnap([entryA]))
    const { latest } = renderStore()

    await waitFor(() => expect(latest().status).toBe('ready'))
    expect(latest().students.map((s) => s.studentId)).toEqual(['CAS26-001'])

    // The desktop adds student B — the live listener delivers the new roster.
    await act(async () => dirNext(dirSnap([entryA, entryB])))

    // Students tab sees B…
    expect(latest().students.map((s) => s.studentId)).toEqual(['CAS26-001', 'CAS26-002'])
    // …and the scanner's zero-read lookup maps resolve B's QR instead of
    // answering "Unknown QR code".
    expect(latest().byId['CAS26-002']).toBeTruthy()
    expect(latest().byQr['2026002']).toBeTruthy()
    expect(latest().byNum['2026002']).toBeTruthy()
    expect(latest().byId['CAS26-002'].name).toBe('Ben Diaz')
  })

  it('never regresses listener-delivered data with the slower stale cache read', async () => {
    // Hold boot's cache read back so the listener resolves FIRST.
    let releaseBootCache
    gw.getDocCached.mockImplementation(
      () => new Promise((resolve) => { releaseBootCache = () => resolve(dirSnap([entryA])) }),
    )
    const { latest } = renderStore()

    // Server roster (A + new student B) arrives while boot is still awaiting.
    await act(async () => dirNext(dirSnap([entryA, entryB])))
    expect(latest().students.map((s) => s.studentId)).toEqual(['CAS26-001', 'CAS26-002'])

    // The stale cache read finally resolves — it must NOT clobber fresh data.
    await act(async () => releaseBootCache())
    await waitFor(() => expect(latest().status).toBe('ready'))

    expect(latest().students.map((s) => s.studentId)).toEqual(['CAS26-001', 'CAS26-002'])
  })

  it("keeps dbOps' directory write-copy hydrated — remote deletes are never resurrected", async () => {
    gw.getDocCached.mockImplementation(async () => dirSnap([entryA]))
    const { latest } = renderStore()
    await waitFor(() => expect(latest().status).toBe('ready'))

    // Roster changed elsewhere: student B was deleted remotely.
    await act(async () => dirNext(dirSnap([entryA])))
    expect(latest().students.map((s) => s.studentId)).toEqual(['CAS26-001'])

    // This device then adds student C — writeDirectory() rewrites the WHOLE
    // roster array, so dbOps' copy must reflect the remote delete.
    await act(async () => {
      const { upsertDirectoryEntry } = await import('../utils/dbOps')
      await upsertDirectoryEntry({
        studentId: entryC.id, studentNumber: entryC.num,
        fullName: entryC.name, program: entryC.prog, yearLevel: entryC.yr, section: entryC.sec,
      })
    })

    const dirWrite = gw.setDoc.mock.calls.find(([ref]) => String(ref).includes('student_directory'))
    expect(dirWrite).toBeTruthy()
    const writtenIds = dirWrite[1].students.map((e) => e.id)
    expect(writtenIds).toEqual(['CAS26-001', 'CAS26-003']) // no resurrected CAS26-002
  })

  it('detaches the listener and resets the store on logout', async () => {
    gw.getDocCached.mockImplementation(async () => dirSnap([entryA]))
    const { latest, capture, rerender } = renderStore()
    await waitFor(() => expect(latest().status).toBe('ready'))
    await act(async () => dirNext(dirSnap([entryA, entryB])))
    expect(latest().students).toHaveLength(2)

    currentAdmin = null
    rerender(
      <AppDataProvider>
        <LogoutProbe capture={capture} />
      </AppDataProvider>,
    )

    await waitFor(() => expect(dirUnsub).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(latest().status).toBe('idle'))
    expect(latest().students).toEqual([])
    expect(latest().byId).toEqual({})
    expect(latest().byQr).toEqual({})
  })

  it('refreshDirectory re-reads the roster from the SERVER (cross-device escape hatch)', async () => {
    gw.getDocCached.mockImplementation(async () => dirSnap([entryA]))
    const { latest } = renderStore()
    await waitFor(() => expect(latest().status).toBe('ready'))
    expect(latest().students.map((s) => s.studentId)).toEqual(['CAS26-001'])

    gw.getDocFresh.mockImplementation(async () => dirSnap([entryA, entryB]))
    await act(async () => latest().refreshDirectory())

    expect(latest().students.map((s) => s.studentId)).toEqual(['CAS26-001', 'CAS26-002'])
  })

  it('ignores a missing directory doc (not yet seeded) instead of wiping the boot roster', async () => {
    gw.getDocCached.mockImplementation(async () => dirSnap([entryA]))
    const { latest } = renderStore()
    await waitFor(() => expect(latest().status).toBe('ready'))

    await act(async () => dirNext(missingSnap()))

    expect(latest().students.map((s) => s.studentId)).toEqual(['CAS26-001'])
  })
})

/* Fake collection snapshots for the events/summaries listeners. */
const evSnap = (events) => ({
  docs: events.map((e) => ({ id: e.id, data: () => e })),
  size: events.length,
})
const event1 = { id: 'ev-1', eventId: 'CAS-2026-001', eventName: 'Symposium', status: 'ended' }
const event2 = { id: 'ev-2', eventId: 'CAS-2026-002', eventName: 'Sportsfest', status: 'active' }
const event3 = { id: 'ev-3', eventId: 'CAS-2026-003', eventName: 'Seminar', status: 'ended' }

describe('AppDataStore cross-device attendance-event sync', () => {
  it('adopts the live server event list — the Attendances tab shows ALL events on every account', async () => {
    // BUG: the boot's cache-first read of attendanceEvents never revalidated —
    // a device whose IndexedDB held ONE old event kept showing a single
    // attendance while another account's device showed the complete list.
    gw.getDocsCached.mockImplementation(async (q) => {
      if (String(q) === 'attendanceEvents') return evSnap([event1]) // stale device copy
      return { docs: [], size: 0 } // summaries + admins
    })
    const { latest } = renderStore()
    await waitFor(() => expect(latest().status).toBe('ready'))
    expect(latest().events.map((e) => e.eventId)).toEqual(['CAS-2026-001'])

    // Two more events were started on ANOTHER account's device — the live
    // listener delivers the complete server list (no re-login needed).
    await act(async () => evNext(evSnap([event1, event2, event3])))

    expect(latest().events.map((e) => e.eventId)).toEqual([
      'CAS-2026-001',
      'CAS-2026-002',
      'CAS-2026-003',
    ])
  })

  it('drops events deleted on another account from every account’s list', async () => {
    gw.getDocsCached.mockImplementation(async (q) =>
      String(q) === 'attendanceEvents' ? evSnap([event1, event2]) : { docs: [], size: 0 },
    )
    const { latest } = renderStore()
    await waitFor(() => expect(latest().status).toBe('ready'))
    expect(latest().events).toHaveLength(2)

    // Another account deleted event 2 — the snapshot no longer contains it.
    await act(async () => evNext(evSnap([event1])))

    expect(latest().events.map((e) => e.eventId)).toEqual(['CAS-2026-001'])
  })

  it('never regresses listener-delivered events with the slower stale boot cache', async () => {
    let releaseBootEvents
    gw.getDocsCached.mockImplementation((q) => {
      if (String(q) === 'attendanceEvents') {
        return new Promise((resolve) => { releaseBootEvents = () => resolve(evSnap([event1])) })
      }
      return Promise.resolve({ docs: [], size: 0 })
    })
    const { latest } = renderStore()

    // Server truth (3 events) arrives while boot's cache read is still pending.
    await act(async () => evNext(evSnap([event1, event2, event3])))
    expect(latest().events).toHaveLength(3)

    // The stale cache read finally resolves — it must NOT clobber fresh data.
    await act(async () => releaseBootEvents())
    await waitFor(() => expect(latest().status).toBe('ready'))

    expect(latest().events.map((e) => e.eventId)).toEqual([
      'CAS-2026-001',
      'CAS-2026-002',
      'CAS-2026-003',
    ])
  })

  it('keeps summaries live too (Overview charts stay identical across accounts)', async () => {
    gw.getDocsCached.mockImplementation(async () => ({ docs: [], size: 0 }))
    const { latest } = renderStore()
    await waitFor(() => expect(latest().status).toBe('ready'))
    expect(latest().summaries).toEqual([])

    const summary = { id: 'CAS-2026-001', eventId: 'CAS-2026-001', scans: 42 }
    await act(async () =>
      sumNext({ docs: [{ id: summary.id, data: () => summary }], size: 1 }),
    )

    expect(latest().summaries).toEqual([summary])
  })

  it('detaches the event + summary listeners on logout too', async () => {
    gw.getDocsCached.mockImplementation(async () => ({ docs: [], size: 0 }))
    const { latest, capture, rerender } = renderStore()
    await waitFor(() => expect(latest().status).toBe('ready'))

    currentAdmin = null
    rerender(
      <AppDataProvider>
        <LogoutProbe capture={capture} />
      </AppDataProvider>,
    )

    await waitFor(() => expect(evUnsub).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(sumUnsub).toHaveBeenCalledTimes(1))
    expect(latest().events).toEqual([])
  })
})

/** Probe used across a logout rerender (re-captures the context value). */
function LogoutProbe({ capture }) {
  capture(useAppData())
  return null
}
