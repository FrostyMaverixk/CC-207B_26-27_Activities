/** Firestore CRUD + business operations for CASScan. */
import { deleteField, query, where } from 'firebase/firestore'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from './firestoreGateway'
// `db` is referenced as the first argument throughout this module. The gateway
// functions ignore that argument (they route to whichever backend is ACTIVE),
// but the identifier must still resolve at call time.
import { db } from '../firebase'
import { generateStudentId, generateEventId, generateOperatorId, nextSequence } from './ids'
import { scanStatusFor } from './attendanceLogic'
import { getScanBuffer } from './scanBuffer'
import { dayKey } from './format'
import {
  putSnapshot,
  removeFromSnapshot,
  dropSnapshot,
  getSnapshot,
  fetchRecords,
  fetchRecordsSince,
} from './recordsStore'

const nowIso = () => new Date().toISOString()
const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/* ---------------- Students ---------------- */

export async function createStudent(data) {
  const studentId = await generateStudentId()
  await setDoc(doc(db, 'students', studentId), { ...data, studentId, createdAt: nowIso() })
  await upsertDirectoryEntry({ studentId, ...data })
  return studentId
}

export async function updateStudent(id, data) {
  await updateDoc(doc(db, 'students', id), { ...data, updatedAt: nowIso() })
  await upsertDirectoryEntry({ studentId: id, ...data })
}

export async function deleteStudent(id) {
  await deleteDoc(doc(db, 'students', id))
  await removeDirectoryEntries([id])
}

/** Bulk import rows [{studentNumber, fullName, program, yearLevel, section}] */
export async function importStudents(rows) {
  if (!rows.length) return 0
  const startNumber = await nextSequence('students', rows.length)
  const yy = String(new Date().getFullYear()).slice(-2)
  const padded = rows.map((row, i) => ({
    studentId: `CAS${yy}-${String(startNumber + i).padStart(3, '0')}`,
    ...row,
    createdAt: nowIso(),
  }))
  for (const group of chunk(padded, 400)) {
    const batch = writeBatch(db)
    group.forEach((s) => batch.set(doc(db, 'students', s.studentId), s))
    await batch.commit()
  }
  await upsertDirectoryEntries(padded)
  return padded.length
}

/**
 * Batch-delete many student profiles by document id — used by the year-level
 * bulk tools (e.g. clearing a whole graduating class). Past attendance
 * records are intentionally KEPT, exactly like single-student deletes.
 */
export async function bulkDeleteStudents(ids) {
  let deleted = 0
  for (const group of chunk(ids, 400)) {
    const batch = writeBatch(db)
    group.forEach((id) => batch.delete(doc(db, 'students', id)))
    await batch.commit()
    deleted += group.length
  }
  await removeDirectoryEntries(ids)
  return deleted
}

/**
 * Batch-set the year level of many students at once — used to promote a
 * whole year (or fix a wrong year) without touching students one by one.
 */
export async function bulkSetStudentYear(ids, yearLevel) {
  let updated = 0
  for (const group of chunk(ids, 400)) {
    const batch = writeBatch(db)
    group.forEach((id) =>
      batch.update(doc(db, 'students', id), { yearLevel: String(yearLevel), updatedAt: nowIso() }),
    )
    await batch.commit()
    updated += group.length
  }
  await patchDirectoryEntries(ids, { yearLevel: String(yearLevel) })
  return updated
}

/* ---------------- Student directory (/meta/student_directory) ----------------
 * ONE aggregated doc holds a minimal profile for every student. The app boots
 * from it (a single cache-first read) and student CRUD maintains it here with
 * pure in-memory edits + ONE doc write — zero reads per operation. */

let directoryEntries = null

/** The app store hydrates this at boot so directory writes never need reads. */
export function hydrateDirectory(entries) {
  directoryEntries = Array.isArray(entries) ? entries : []
}

export const entryOf = (s) => ({
  id: s.studentId,
  num: s.studentNumber || '',
  name: s.fullName || '',
  prog: s.program || '',
  yr: String(s.yearLevel ?? ''),
  sec: s.section || '',
  qr: s.studentNumber || s.studentId,
})

async function writeDirectory() {
  await setDoc(doc(db, 'meta', 'student_directory'), {
    students: directoryEntries,
    count: directoryEntries.length,
    updatedAt: nowIso(),
  })
}

export async function upsertDirectoryEntry(student) {
  if (!directoryEntries) return
  const e = entryOf(student)
  const i = directoryEntries.findIndex((x) => x.id === e.id)
  if (i >= 0) directoryEntries[i] = e
  else directoryEntries.push(e)
  await writeDirectory()
}

export async function upsertDirectoryEntries(students) {
  if (!directoryEntries) return
  students.forEach((s) => {
    const e = entryOf(s)
    const i = directoryEntries.findIndex((x) => x.id === e.id)
    if (i >= 0) directoryEntries[i] = e
    else directoryEntries.push(e)
  })
  await writeDirectory()
}

export async function removeDirectoryEntries(ids) {
  if (!directoryEntries) return
  const drop = new Set(ids)
  directoryEntries = directoryEntries.filter((x) => !drop.has(x.id))
  await writeDirectory()
}

export async function patchDirectoryEntries(ids, fields) {
  if (!directoryEntries) return
  const set = new Set(ids)
  directoryEntries = directoryEntries.map((x) =>
    set.has(x.id) ? entryOf({ ...x, ...fields, studentId: x.id }) : x,
  )
  await writeDirectory()
}

/** Full rebuild straight from the roster (also seeds a missing meta doc). */
export async function rebuildStudentDirectory() {
  const snap = await getDocs(collection(db, 'students'))
  directoryEntries = snap.docs.map((d) => entryOf({ id: d.id, ...d.data() }))
  await writeDirectory()
  return directoryEntries.length
}

/* ---------------- Admins / Operators ---------------- */

export async function createAdmin(data) {
  // The LIVE credential belongs exclusively to Firebase Authentication —
  // `password` / `confirmPassword` are never persisted. `initialPassword`
  // (when provided) IS stored with the profile on purpose: Firebase Auth can
  // never display a password, so this lets the owner look up what was
  // assigned to an operator. Anyone who can read the admins collection can
  // see it — only suitable for operator accounts the owner manages.
  const profile = { ...data }
  delete profile.password
  delete profile.confirmPassword
  const studentId = await generateStudentId()
  const operatorId =
    profile.operatorId ||
    (await generateOperatorId(profile.classification, profile.program, profile.yearLevel, profile.section))
  const payload = { ...profile, studentId, operatorId, createdAt: nowIso() }
  await setDoc(doc(db, 'admins', studentId), payload)
  return payload
}

/** Alias used by the first-run bootstrap on the Login page. */
export const createFirstAdmin = (data) => createAdmin(data)

/** Returns an auto-generated operatorId when identity fields change. */
export async function regenerateOperatorIfNeeded(admin, changes) {
  const keys = ['classification', 'program', 'yearLevel', 'section']
  const changed = keys.some((k) => changes[k] && changes[k] !== admin[k])
  if (!changed || !changes.classification) return {}
  const operatorId = await generateOperatorId(
    changes.classification,
    changes.program ?? admin.program,
    changes.yearLevel ?? admin.yearLevel,
    changes.section ?? admin.section,
  )
  return { operatorId }
}

export const updateAdmin = (id, data) =>
  updateDoc(doc(db, 'admins', id), { ...data, updatedAt: nowIso() })

/**
 * Removes ONLY the admin's profile document.
 *
 * Attendance events & records are shared, org-wide data and are intentionally
 * KEPT: every admin still sees all events in the Attendances tab, and past
 * events keep their "startedBy / startedByName" attribution even after the
 * starter's account is deleted.
 */
export const deleteAdmin = (id) => deleteDoc(doc(db, 'admins', id))

/* ---------------- Attendance events ---------------- */

export async function startAttendanceEvent({ eventName, venue, description, startAt, endAt }, admin) {
  // Guard against multiple concurrent active events: close any other live
  // event first so stations never scan into two different active sessions.
  try {
    const activeSnap = await getDocs(
      query(collection(db, 'attendanceEvents'), where('status', '==', 'active')),
    )
    for (const d of activeSnap.docs) {
      await updateDoc(doc(db, 'attendanceEvents', d.id), {
        status: 'ended',
        endedAt: nowIso(),
        statsDirty: true, // counters refresh on the next view/recompute
      })
    }
  } catch (err) {
    // Never block starting because a cleanup write failed — the newest event
    // still wins by createdAt in ActiveEventContext.
    console.warn('[start] could not auto-close a prior active event:', err?.code || err?.message)
  }
  const eventId = await generateEventId()
  const payload = {
    eventId,
    eventName: eventName.trim(),
    venue: (venue || '').trim(),
    description: (description || '').trim(),
    startAt,
    endAt,
    status: 'active',
    startedBy: admin?.operatorId || '',
    startedByName: admin?.fullName || '',
    // Denormalized counters — maintained at event end so list tabs never need
    // to read the attendanceRecords collection for per-event stats.
    recordCount: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    createdAt: nowIso(),
  }
  await setDoc(doc(db, 'attendanceEvents', eventId), payload)
  return payload
}

export const updateEvent = (eventId, data) =>
  updateDoc(doc(db, 'attendanceEvents', eventId), { ...data, updatedAt: nowIso() })

/**
 * End an attendance: every student without a "present" record gets an
 * explicit "absent" record, then the event is flagged as ended.
 */
/**
 * End an attendance: flag the event as ended and write a precomputed summary.
 *
 * Absence is DERIVED, never persisted — a student with a present/late record
 * attended, everyone else on the roster is absent by subtraction. No "absent"
 * docs are written, so at scale (1,000 students × 40 events/day) the daily
 * write quota is not blown by ~40k absent records. Legacy absent docs (if any
 * exist from earlier versions) are simply ignored by the derivation.
 * Re-ending is idempotent: the same records produce the same counts.
 */
export async function endAttendanceEvent(event, students) {
  // Integrity first: drain the shared scan buffer BEFORE reading records, so
  // scans still queued on this device can never be mis-counted as absent.
  // Throws propagate — the caller shows "Could not end attendance" and the
  // durable queue retries on the next attempt.
  await getScanBuffer().flushAll()
  // Authoritative records read. The device's cached view is topped up with a
  // delta of everything written since its last full sync (~0 reads when the
  // (eventId,time) composite index exists); a full fetch covers devices that
  // never synced this event or lack the index. Either way the ender sees
  // EVERY station's scans before deciding who is absent.
  const cached = getSnapshot(event.eventId)
  let recordData
  if (cached && cached.at) {
    try {
      recordData = await fetchRecordsSince(event.eventId, cached.at)
    } catch (err) {
      console.warn('[endAttendance] delta fetch fell back to a full read:', err?.code || err?.message)
      recordData = await fetchRecords(event.eventId)
    }
  } else {
    recordData = await fetchRecords(event.eventId)
  }

  const stats = deriveStats(recordData, students.length)
  const endedAt = nowIso()
  const summary = {
    eventId: event.eventId,
    eventName: event.eventName || '',
    endedAt,
    recordCount: stats.presentCount + stats.lateCount,
    presentCount: stats.presentCount,
    lateCount: stats.lateCount,
    absentCount: stats.absentCount,
    byDay: stats.byDay,
    attendedStudentIds: stats.attendedStudentIds,
    scans: stats.scans,
  }
  await setDoc(doc(db, 'attendanceSummaries', event.eventId), summary)

  // Denormalize per-event stats onto the event doc so list tabs never need to
  // read the attendanceRecords collection for counts.
  const eventPatch = {
    status: 'ended',
    endedAt,
    recordCount: stats.presentCount + stats.lateCount,
    presentCount: stats.presentCount,
    lateCount: stats.lateCount,
    absentCount: stats.absentCount,
    statsDirty: deleteField(),
  }
  await updateDoc(doc(db, 'attendanceEvents', event.eventId), eventPatch)
  // The caller patches its local store with these — zero reads to stay in sync.
  return {
    markedAbsent: stats.absentCount,
    present: stats.presentCount,
    late: stats.lateCount,
    total: students.length,
    eventPatch,
    summary,
  }
}

/**
 * Derive present/late/absent counts + analytics from an event's records and
 * the roster size. Absence is roster size minus (present + late). Shared by
 * End Attendance and the post-edit/reopen recompute so the two never drift.
 * NOTE: byDay is keyed with the LOCAL day (dayKey) — matching the Overview
 * trend axis — unlike the old UTC `String(time).slice(0, 10)` bucketing.
 */
function deriveStats(records, roster) {
  let presentCount = 0
  let lateCount = 0
  const byDay = {}
  const attendedStudentIds = []
  const scans = []
  ;(records || []).forEach((r) => {
    if (r.status !== 'present' && r.status !== 'late') return
    if (r.status === 'present') presentCount += 1
    else lateCount += 1
    if (r.time) {
      const k = dayKey(r.time)
      byDay[k] = (byDay[k] || 0) + 1
    }
    attendedStudentIds.push(r.studentId)
    scans.push({
      studentId: r.studentId,
      fullName: r.fullName || '',
      program: r.program || '',
      yearLevel: r.yearLevel || '',
      status: r.status,
      time: r.time || null,
    })
  })
  return {
    presentCount,
    lateCount,
    absentCount: Math.max(0, (roster || 0) - presentCount - lateCount),
    byDay,
    attendedStudentIds,
    scans,
  }
}

/**
 * Recompute an event's derived stats (counters + summary doc) from its records
 * and roster — call after a record edit or a reopen so the denormalized
 * figure never goes stale. Absence stays DERIVED (no records are written
 * here). Returns { eventPatch, summary }.
 */
export async function recomputeAttendanceStats(event, records, roster) {
  const stats = deriveStats(records, roster)
  const summary = {
    eventId: event.eventId,
    eventName: event.eventName || '',
    updatedAt: nowIso(),
    recordCount: stats.presentCount + stats.lateCount,
    presentCount: stats.presentCount,
    lateCount: stats.lateCount,
    absentCount: stats.absentCount,
    byDay: stats.byDay,
    attendedStudentIds: stats.attendedStudentIds,
    scans: stats.scans,
  }
  await setDoc(doc(db, 'attendanceSummaries', event.eventId), summary)
  const eventPatch = {
    recordCount: stats.presentCount + stats.lateCount,
    presentCount: stats.presentCount,
    lateCount: stats.lateCount,
    absentCount: stats.absentCount,
    statsDirty: deleteField(),
    updatedAt: nowIso(),
  }
  await updateDoc(doc(db, 'attendanceEvents', event.eventId), eventPatch)
  return { eventPatch, summary }
}

/**
 * Reopen an ended attendance: the event becomes active again on the Scan tab
 * and its end time still drives the present/late rule (before endAt →
 * "present", after endAt → "late"). Absent records are overwritten the
 * moment a student is scanned again.
 */
export const reopenAttendanceEvent = (eventId) =>
  updateDoc(doc(db, 'attendanceEvents', eventId), {
    status: 'active',
    reopenedAt: nowIso(),
    endedAt: deleteField(),
    statsDirty: true, // counters refresh when the detail page recomputes
  })

export async function deleteEventCascade(event, students = null) {
  dropSnapshot(event.eventId)
  // Deterministic record ids let us skip the R-record read entirely: roster
  // students plus any student ids the local cache knows about cover every
  // record the UI can have created. Pass students=null to fall back to a read.
  const cachedRecs = getSnapshot(event.eventId)?.records || []
  const knownIds = new Set([
    ...(students || []).map((s) => s.studentId),
    // Include every record id the device knows about (cached ids + studentIds)
    // so records for students removed from the roster are still cleaned up.
    ...cachedRecs.map((r) => r.id || r.studentId),
    ...cachedRecs.map((r) => r.studentId),
  ])
  let recordRefs
  if (students && students.length > 0) {
    recordRefs = [...knownIds].map((sid) => doc(db, 'attendanceRecords', `${event.eventId}__${sid}`))
  } else {
    const recordsSnap = await getDocs(
      query(collection(db, 'attendanceRecords'), where('eventId', '==', event.eventId)),
    )
    recordRefs = recordsSnap.docs.map((d) => d.ref)
  }
  const refs = [
    doc(db, 'attendanceEvents', event.id || event.eventId),
    doc(db, 'attendanceSummaries', event.eventId), // analytics summary doc (may not exist for old events)
    ...recordRefs,
  ]
  for (const group of chunk(refs, 400)) {
    const batch = writeBatch(db)
    group.forEach((r) => batch.delete(r))
    await batch.commit()
  }
}

/* ---------------- Attendance records ---------------- */

/**
 * Record a scan for `student` on `event`.
 *
 * A scan made AFTER the event's end time is marked "late". The session itself
 * is NEVER auto-ended when its end time passes — only "End Attendance" ends
 * it — so late-window scans keep flowing in. Reopened events accept scans
 * again: before endAt they mark "present", after endAt they mark "late".
 *
 * Resolves with the saved payload (including the computed status).
 */
export function markPresent(student, event, admin) {
  const time = nowIso()
  // Scans after the end time are flagged LATE; at or before it → present.
  const status = scanStatusFor(event, time)
  const payload = {
    eventId: event.eventId,
    studentId: student.studentId,
    studentNumber: student.studentNumber || '',
    fullName: student.fullName,
    program: student.program || '',
    yearLevel: student.yearLevel || '',
    section: student.section || '',
    status,
    time,
    scannedBy: admin?.operatorId || '',
    scannedByName: admin?.fullName || '',
    updatedAt: time,
  }
  return setDoc(doc(db, 'attendanceRecords', `${event.eventId}__${student.studentId}`), payload, {
    merge: true,
  }).then(() => {
    // Keep the local records cache coherent — this must NOT advance the sync
    // anchor (putSnapshot default), or cross-station records written between
    // our last sync and now would fall through the delta window.
    putSnapshot(event.eventId, [payload])
    return payload
  })
}

/**
 * Batched variant of markPresent for the scan buffer — commits up to 400
 * scans in ONE network round-trip via writeBatch. Same payload shape, same
 * deterministic doc ids (idempotent re-scans), still zero reads.
 */
export async function markPresentBatch(items) {
  let written = 0
  for (const group of chunk(items, 400)) {
    const batch = writeBatch(db)
    const payloads = []
    group.forEach(({ student, event, admin, time }) => {
      const t = time || nowIso()
      const payload = {
        eventId: event.eventId,
        studentId: student.studentId,
        studentNumber: student.studentNumber || '',
        fullName: student.fullName,
        program: student.program || '',
        yearLevel: student.yearLevel || '',
        section: student.section || '',
        status: scanStatusFor(event, t),
        time: t,
        scannedBy: admin?.operatorId || '',
        scannedByName: admin?.fullName || '',
        updatedAt: nowIso(),
      }
      batch.set(doc(db, 'attendanceRecords', `${event.eventId}__${student.studentId}`), payload, {
        merge: true,
      })
      payloads.push(payload)
      written += 1
    })
    await batch.commit()
    putSnapshot(group[0]?.event?.eventId, payloads) // zero-read local merge
  }
  return written
}

export const cancelRecord = async (eventId, studentId) => {
  await deleteDoc(doc(db, 'attendanceRecords', `${eventId}__${studentId}`))
  removeFromSnapshot(eventId, [studentId]) // cache stays coherent — no re-read
}

/**
 * Batched multi-student cancel — ⌈N/400⌉ commits instead of N round-trips.
 * Callers must first drop the students' still-buffered scans via
 * getScanBuffer().removePending() so a later flush cannot resurrect them.
 */
export async function cancelRecordsBulk(eventId, studentIds) {
  let deleted = 0
  for (const group of chunk(studentIds, 400)) {
    const batch = writeBatch(db)
    group.forEach((studentId) =>
      batch.delete(doc(db, 'attendanceRecords', `${eventId}__${studentId}`)),
    )
    await batch.commit()
    deleted += group.length
  }
  removeFromSnapshot(eventId, studentIds)
  return deleted
}

export const updateRecord = async (eventId, studentId, data) => {
  const updatedAt = nowIso()
  await updateDoc(doc(db, 'attendanceRecords', `${eventId}__${studentId}`), { ...data, updatedAt })
  putSnapshot(eventId, [{ id: `${eventId}__${studentId}`, eventId, studentId, ...data, updatedAt }])
}

