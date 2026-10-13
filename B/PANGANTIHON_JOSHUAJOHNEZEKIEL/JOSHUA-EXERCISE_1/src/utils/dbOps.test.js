import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dayKey } from './format'

// dbOps talks to Firestore only through the gateway, and reads records through
// recordsStore/scanBuffer. Mock those so endAttendanceEvent runs hermetically,
// while keeping the real attendanceLogic/format logic.
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

vi.mock('./firestoreGateway', () => ({
  setDoc: vi.fn(async (_ref, data) => data),
  updateDoc: vi.fn(async (_ref, data) => data),
  deleteDoc: vi.fn(async () => {}),
  getDocs: vi.fn(async () => ({ docs: [], size: 0 })),
  writeBatch: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), delete: vi.fn(), commit: vi.fn(async () => {}) })),
  doc: vi.fn((_db, coll, id) => `${coll}/${id}`),
  collection: vi.fn(),
}))

vi.mock('../firebase', () => ({
  db: { __fake: true },
  getBackupDb: vi.fn(() => null),
  isBackupConfigured: vi.fn(() => false),
}))

vi.mock('./recordsStore', () => ({
  getSnapshot: vi.fn(() => null),
  fetchRecords: vi.fn(),
  fetchRecordsSince: vi.fn(),
  putSnapshot: vi.fn(),
  removeFromSnapshot: vi.fn(),
  dropSnapshot: vi.fn(),
}))

vi.mock('./scanBuffer', () => ({
  getScanBuffer: vi.fn(() => ({ flushAll: vi.fn(async () => 0) })),
}))

import * as gw from './firestoreGateway'
import * as rs from './recordsStore'
import { endAttendanceEvent, recomputeAttendanceStats } from './dbOps'

const EVENT = { eventId: 'E1', eventName: 'Assembly' }
const ROSTER = [{ studentId: 'S1' }, { studentId: 'S2' }, { studentId: 'S3' }]
// Times chosen so their UTC day and LOCAL day differ, verifying byDay uses the
// LOCAL day (dayKey) rather than the old UTC `String(time).slice(0,10)`.
const RECORDS = [
  { studentId: 'S1', status: 'present', time: '2026-08-23T00:30:00Z' },
  { studentId: 'S2', status: 'late', time: '2026-08-23T12:00:00Z' },
]

const summaryCall = () =>
  gw.setDoc.mock.calls.find(([ref]) => String(ref).includes('attendanceSummaries'))[1]
const eventPatchCall = () =>
  gw.updateDoc.mock.calls.find(([ref]) => String(ref).includes('attendanceEvents'))[1]

beforeEach(() => {
  vi.clearAllMocks()
  rs.getSnapshot.mockReturnValue(null) // warm-less path → full fetch
  rs.fetchRecords.mockResolvedValue(RECORDS)
})

describe('endAttendanceEvent', () => {
  it('completes (no crash) and writes derived stats with NO absent docs', async () => {
    const result = await endAttendanceEvent(EVENT, ROSTER)

    expect(result.present).toBe(1)
    expect(result.late).toBe(1)
    expect(result.markedAbsent).toBe(1) // S3 on the roster never scanned
    expect(result.total).toBe(3)

    // The summary doc carries the derived counts.
    const summary = summaryCall()
    expect(summary.eventId).toBe('E1')
    expect(summary.presentCount).toBe(1)
    expect(summary.lateCount).toBe(1)
    expect(summary.absentCount).toBe(1)
    expect(summary.recordCount).toBe(2)

    // Event is flipped to ended with matching denormalized counters.
    const patch = eventPatchCall()
    expect(patch.status).toBe('ended')
    expect(patch.presentCount).toBe(1)
    expect(patch.lateCount).toBe(1)
    expect(patch.absentCount).toBe(1)
    expect(patch.recordCount).toBe(2)

    // No absent records written anywhere (the write-quota fix).
    expect(gw.writeBatch).not.toHaveBeenCalled()
    const recordWrites = gw.setDoc.mock.calls.filter(([ref]) => String(ref).includes('attendanceRecords'))
    expect(recordWrites).toHaveLength(0)

    // byDay is keyed by the LOCAL day (dayKey), matching the Overview axis —
    // not the UTC `String(time).slice(0,10)` bucketing.
    const expectedByDay = {}
    RECORDS.forEach((r) => {
      const k = dayKey(r.time)
      expectedByDay[k] = (expectedByDay[k] || 0) + 1
    })
    expect(summary.byDay).toEqual(expectedByDay)
  })

  it('is idempotent — re-ending yields the same counts and still writes no absent docs', async () => {
    await endAttendanceEvent(EVENT, ROSTER)
    await endAttendanceEvent(EVENT, ROSTER)

    const summaries = gw.setDoc.mock.calls.filter(([ref]) => String(ref).includes('attendanceSummaries'))
    expect(summaries).toHaveLength(2)
    expect(summaries[0][1].absentCount).toBe(1)
    expect(summaries[1][1].absentCount).toBe(1)
    expect(summaries[1][1].presentCount).toBe(1)
    expect(gw.writeBatch).not.toHaveBeenCalled()
  })

  it('recomputeAttendanceStats derives counters from the record set (edit/reopen path)', async () => {
    await recomputeAttendanceStats(EVENT, RECORDS, 3)

    const summary = summaryCall()
    expect(summary.presentCount).toBe(1)
    expect(summary.lateCount).toBe(1)
    expect(summary.absentCount).toBe(1)

    const patch = eventPatchCall()
    expect(patch.presentCount).toBe(1)
    expect(patch.absentCount).toBe(1)
    expect(patch.status).toBeUndefined() // recompute does NOT close the event
    expect(gw.writeBatch).not.toHaveBeenCalled()
  })
})