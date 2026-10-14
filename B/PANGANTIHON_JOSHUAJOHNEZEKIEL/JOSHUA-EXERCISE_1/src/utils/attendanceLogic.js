/**
 * Pure attendance business rules — kept dependency-free so they can be unit
 * tested without Firestore and shared by the scan pipeline and the end-event
 * job.
 */

/**
 * Decide whether a scan is "late" for an event.
 *
 * A scan is LATE only once a full minute has passed the event's end time — a
 * scan at the end time, or anywhere in its finishing minute (e.g. end 4:07,
 * scan 4:07:45), is still PRESENT; late begins at the next clock-minute
 * boundary (4:08). This is the operating expectation: an attendance set to
 * end at 4:07 should not mark someone at 4:07 as late.
 * Compared on epoch millis (DST-safe) with a 60_000 ms grace.
 */
export function isLateScan(event, timeIso) {
  if (!event?.endAt || !timeIso) return false
  const endMs = new Date(event.endAt).getTime()
  const scanMs = new Date(timeIso).getTime()
  if (Number.isNaN(endMs) || Number.isNaN(scanMs)) return false
  return scanMs - endMs >= 60_000
}

/** The stored status for a scan: 'present' when on time, 'late' otherwise. */
export function scanStatusFor(event, timeIso) {
  return isLateScan(event, timeIso) ? 'late' : 'present'
}

/**
 * Classify an event's records + roster into what "End attendance" must do:
 *  - recordedIds: students with a scan (present OR late) → their record stands
 *  - missing:     students with NO scan → get an explicit "absent" record
 *  - presentCount / lateCount for the summary toast
 */
export function partitionAttendance(records, students) {
  const recordedIds = new Set()
  let presentCount = 0
  let lateCount = 0
  for (const r of records || []) {
    // ANY existing record (present, late OR absent) counts as "already
    // recorded" so ending/reopening repeatedly is idempotent — students who
    // already have an explicit absent record are not written again.
    if (r.studentId) recordedIds.add(r.studentId)
    if (r.status === 'present') presentCount += 1
    else if (r.status === 'late') lateCount += 1
  }
  const missing = (students || []).filter((s) => !recordedIds.has(s.studentId))
  return { recordedIds, missing, presentCount, lateCount }
}
