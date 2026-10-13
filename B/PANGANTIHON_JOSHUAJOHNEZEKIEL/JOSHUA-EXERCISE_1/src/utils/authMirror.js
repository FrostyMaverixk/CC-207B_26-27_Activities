import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { getActiveBackend } from './firestoreGateway'
import { getBackupAuth, getSecondaryAuth } from '../firebase'

/**
 * Auth account mirroring for the dual-project failover.
 *
 * Firebase Authentication is a SEPARATE service from Firestore — copying the
 * `admins` collection does NOT give the backup project the ability to sign
 * people in. This module mirrors accounts LAZILY and BEST-EFFORT:
 *
 *   • at LOGIN / first-run setup / admin creation (the moments when we have the
 *     plaintext password) the account is ensured to exist in the OTHER
 *     project's auth;
 *   • it NEVER duplicates — an account that already exists (or whose password
 *     verifies) is left untouched;
 *   • it NEVER blocks — any failure is logged and swallowed so login/setup are
 *     never affected.
 *
 * The primary app is the always-on login host; this keeps the backup ready to
 * sign the same people in if it is ever needed.
 */

/** Returns the dedicated auth instance of the project we mirror INTO. */
function mirrorTarget() {
  // Active backend tells us which project is serving Firestore now; the
  // account should always exist in the OTHER one so a switch always works.
  return getActiveBackend() === 'backup' ? getSecondaryAuth() : getBackupAuth()
}

/**
 * Ensure `email`/`password` exists on `authInstance`. No duplication:
 *   1. try to verify (sign-in) — success means it's already there & in sync;
 *   2. if credentials are unknown → create the account;
 *   3. if creation hits 'email-already-in-use' → exists with a different
 *      password; leave as-is (client SDKs can't reset another user's password).
 * Always signs the mirror instance back out so a dedicated mirror app never
 * leaves a lingering session / persisted user.
 */
async function ensureAccountOn(authInstance, email, password) {
  try {
    await signInWithEmailAndPassword(authInstance, email, password)
    await signOut(authInstance).catch(() => {})
    return { mirrored: 'verified' }
  } catch {
    /* credentials invalid or account missing → try to create it */
  }
  try {
    await createUserWithEmailAndPassword(authInstance, email, password)
    await signOut(authInstance).catch(() => {})
    return { mirrored: 'created' }
  } catch (err) {
    if (err?.code === 'auth/email-already-in-use') return { mirrored: 'existed' }
    throw err
  }
}

/**
 * Best-effort mirror of an email/password account into the non-active project.
 * Never throws (callers fire-and-forget with .catch(() => {})).
 */
export async function mirrorAuthAccount({ email, password }) {
  const target = mirrorTarget()
  if (!target) return { mirrored: 'skipped' }
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized || !password) return { mirrored: 'skipped' }
  try {
    return await ensureAccountOn(target, normalized, password)
  } catch (err) {
    console.warn('[auth-mirror] best-effort mirror skipped:', err?.code || err?.message)
    return { mirrored: 'skipped' }
  }
}

/** Mirrors a password change is intentionally NOT implemented: the My Details
 *  flow no longer accepts the current password, so the backup auth copy simply
 *  catches up on the next login via mirrorAuthAccount (login-time mirror). */