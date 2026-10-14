/**
 * Auto-generated ID helpers.
 * All sequences are stored in the `counters` collection and incremented
 * inside a Firestore transaction so concurrent writes never collide.
 *
 *   Student ID .... CAS26-001            (CAS + 2-digit year + seq)
 *   Event ID ...... CAS-2026-001         (CAS + full year + seq)
 *   Operator ID ... CASSC-BSMATH2A-001   (classification-programYearSection-seq)
 */
import { doc, runTransaction } from './firestoreGateway'

export const pad3 = (n) => String(n).padStart(3, '0')

/** Uppercase alphanumeric only: "BS Math" -> "BSMATH" */
export const normCode = (s) =>
  String(s || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

/** Returns the first number of a sequence advanced by `increment`. */
export async function nextSequence(key, increment = 1) {
  // The gateway binds these to whichever Firebase project is active.
  const ref = doc(null, 'counters', key)
  return runTransaction(null, async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists() ? snap.data().value : 0
    const nextValue = current + increment
    tx.set(ref, { value: nextValue }, { merge: true })
    return current + 1
  })
}

export async function generateStudentId() {
  const yy = String(new Date().getFullYear()).slice(-2)
  const n = await nextSequence('students')
  return `CAS${yy}-${pad3(n)}`
}

export async function generateEventId() {
  const yyyy = new Date().getFullYear()
  const n = await nextSequence('events')
  return `CAS-${yyyy}-${pad3(n)}`
}

export function operatorBase(classification, program, yearLevel, section) {
  return `${normCode(classification)}-${normCode(program)}${normCode(yearLevel)}${normCode(section)}`
}

export async function generateOperatorId(classification, program, yearLevel, section) {
  const base = operatorBase(classification, program, yearLevel, section)
  const n = await nextSequence(`op_${base}`)
  return `${base}-${pad3(n)}`
}
