import { describe, it, expect } from 'vitest'
import { isLateScan, scanStatusFor, partitionAttendance } from './attendanceLogic'

const EVENT = { eventId: 'CAS-2026-001', endAt: '2026-03-05T16:00:00.000Z' }

describe('attendanceLogic — late / present rules', () => {
  it('marks a scan within the finishing minute as present (end 4:07, scan 4:07:30)', () => {
    expect(isLateScan(EVENT, '2026-03-05T16:00:01.000Z')).toBe(false)
    expect(scanStatusFor(EVENT, '2026-03-05T16:00:01.000Z')).toBe('present')
    expect(scanStatusFor(EVENT, '2026-03-05T16:00:59.000Z')).toBe('present')
  })

  it('marks a scan a full minute past the end time as late (end 4:07, scan 4:08)', () => {
    expect(isLateScan(EVENT, '2026-03-05T16:01:00.000Z')).toBe(true)
    expect(scanStatusFor(EVENT, '2026-03-05T16:01:00.000Z')).toBe('late')
  })

  it('marks a scan exactly at the end time as present', () => {
    expect(isLateScan(EVENT, '2026-03-05T16:00:00.000Z')).toBe(false)
    expect(scanStatusFor(EVENT, '2026-03-05T16:00:00.000Z')).toBe('present')
  })

  it('marks a scan before the end time as present', () => {
    expect(scanStatusFor(EVENT, '2026-03-05T15:59:59.000Z')).toBe('present')
  })

  it('treats an event with no end time as never-late', () => {
    expect(isLateScan({ eventId: 'X' }, '2030-01-01T00:00:00.000Z')).toBe(false)
  })

  it('handles reopened events: scan after endAt is still late', () => {
    expect(scanStatusFor(EVENT, '2026-03-06T09:00:00.000Z')).toBe('late')
  })
})

describe('attendanceLogic — end-attendance partition', () => {
  const roster = [
    { studentId: 'S1', fullName: 'Ana' },
    { studentId: 'S2', fullName: 'Ben' },
    { studentId: 'S3', fullName: 'Cal' },
    { studentId: 'S4', fullName: 'Dea' },
  ]
  const records = [
    { studentId: 'S1', status: 'present' },
    { studentId: 'S2', status: 'late' },
    { studentId: 'S3', status: 'absent' }, // already marked absent on a prior end
  ]

  it('keeps present+late, only fills truly-unscanned students with absent', () => {
    const { recordedIds, missing, presentCount, lateCount } = partitionAttendance(records, roster)
    expect(recordedIds.has('S1')).toBe(true)
    expect(recordedIds.has('S2')).toBe(true)
    // S3 is already absent — it has a record, so it is NOT "missing" again.
    expect(missing.map((s) => s.studentId)).toEqual(['S4'])
    expect(presentCount).toBe(1)
    expect(lateCount).toBe(1)
  })

  it('tolerates empty inputs', () => {
    const r = partitionAttendance([], [])
    expect(r.missing).toEqual([])
    expect(r.presentCount).toBe(0)
    expect(r.lateCount).toBe(0)
  })
})
