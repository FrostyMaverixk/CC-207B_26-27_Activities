import { createContext, useContext, useEffect, useState } from 'react'
import { deleteField, query, where } from 'firebase/firestore'
import { collection, doc, getDocs, getDocsCached, onSnapshot, updateDoc } from '../utils/firestoreGateway'
import { reloadOnceForStaleContext, clearStaleContextReloadFlag } from '../utils/staleContextGuard'
import { mirrorAuthAccount } from '../utils/authMirror'
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

/**
 * Authentication is handled by Firebase Authentication (email/password).
 * No credentials are ever stored in Firestore — the signed-in Firebase user
 * is linked to their admin profile document through the `uid` field
 * (legacy profiles are linked by email, and their leftover hashed-password
 * fields are purged on first link).
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // The tree mounted coherently — re-arm the stale-context self-heal.
    clearStaleContextReloadFlag()
    let cancelled = false
    let unsubProfile = null

    // Keep every device signed in across reloads and app restarts — this is
    // what lets the same admin stay logged in on desktop while a phone runs
    // the scanner, and lets many operators hold sessions simultaneously.
    setPersistence(auth, browserLocalPersistence).catch((err) =>
      console.warn('[auth] local persistence unavailable:', err.code || err.message),
    )

    /** Attach the live profile listener for a resolved document id. */
    const watchProfile = (id) => {
      unsubProfile = onSnapshot(
        doc(db, 'admins', id),
        (s) => {
          if (s.exists()) setAdmin({ id: s.id, ...s.data() })
          else {
            console.warn('[auth] profile deleted — ending session')
            setAdmin(null)
          }
        },
        (err) => {
          // A failing profile listener must never log the user out.
          console.warn('[auth] profile listener error:', err.code || err.message)
        },
      )
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      // Tear down any previous profile listener.
      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }

      // Gate protected routes while a freshly signed-in profile resolves.
      // NOTE: authError is intentionally NOT cleared here — the signOut()
      // performed by the orphan branch fires a second auth event, and
      // clearing here would erase the warning shown on the login page.
      if (!cancelled) setLoading(true)

      if (!user) {
        if (!cancelled) {
          setAdmin(null)
          setLoading(false)
        }
        return
      }

      try {
        // Find the admin profile for this authenticated user. The lookups are
        // CACHE-FIRST (getDocsCached): on a warm login they are served from the
        // IndexedDB persistence layer and cost ZERO billed reads — the fresh
        // profile data arrives immediately after via the watchProfile listener.
        let snap = await getDocsCached(query(collection(db, 'admins'), where('uid', '==', user.uid)))
        console.debug('[auth] uid lookup:', snap.empty ? 'no direct match' : snap.docs[0].id)

        if (snap.empty && user.email) {
          const emailNorm = String(user.email).trim().toLowerCase()

          // Direct email match…
          snap = await getDocsCached(
            query(collection(db, 'admins'), where('email', '==', emailNorm)),
          )
          console.debug('[auth] email lookup:', snap.empty ? 'no match' : snap.docs[0].id)

          // …then a tolerant scan (defends against case/whitespace drift).
          if (snap.empty) {
            const all = await getDocs(collection(db, 'admins'))
            const hit = all.docs.find(
              (d) => String(d.data().email || '').trim().toLowerCase() === emailNorm,
            )
            console.debug('[auth] tolerant scan:', hit ? hit.id : 'no match')
            if (hit) snap = { empty: false, docs: [hit] }

            // Fresh database with zero profiles → finish the bootstrap for
            // this already-authenticated account so it becomes the first admin.
            if (!hit && all.empty) {
              const { createFirstAdmin } = await import('../utils/dbOps')
              const profile = await createFirstAdmin({
                fullName: user.displayName || emailNorm.split('@')[0],
                studentNumber: '',
                program: 'CASS',
                yearLevel: '1',
                section: 'A',
                classification: 'CASSC',
                email: emailNorm,
                uid: user.uid,
                createdBy: 'system-bootstrap',
              })
              console.debug('[auth] bootstrapped first admin profile:', profile.studentId)
              if (cancelled) return
              setAuthError(null)
              setAdmin({ id: profile.studentId, ...profile })
              setLoading(false)
              watchProfile(profile.studentId)
              return
            }
          }

          // Best-effort link + purge of legacy credential fields.
          if (!snap.empty) {
            try {
              await updateDoc(snap.docs[0].ref, {
                uid: user.uid,
                passwordHash: deleteField(),
                salt: deleteField(),
              })
            } catch (linkErr) {
              // Never let linking/purging break the session — retry next login.
              console.warn('[auth] legacy link skipped:', linkErr.code || linkErr.message)
            }
          }
        }

        if (cancelled) return

        if (snap.empty) {
          // Signed in, but no CASScan profile exists for this account.
          console.warn('[auth] orphan account — no profile document matches')
          if (!cancelled) setAuthError('orphan')
          await signOut(auth)
          setAdmin(null)
          setLoading(false)
          return
        }

        const d = snap.docs[0]
        console.debug('[auth] profile resolved:', d.id)
        if (!cancelled) setAuthError(null)
        setAdmin({ id: d.id, ...d.data() })
        setLoading(false)
        watchProfile(d.id)
      } catch (err) {
        console.error('[auth] resolve failed:', err.code || '', err.message)
        if (!cancelled) {
          setAdmin(null)
          setLoading(false)
          setAuthError(err.code === 'permission-denied' ? 'permission' : err.message)
        }
      }
    })

    return () => {
      cancelled = true
      unsub()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  /** Signs in with Firebase Authentication. Profile resolution happens via onAuthStateChanged. */
  const login = async (email, password) => {
    setAuthError(null) // clear any previous warning while re-attempting
    const normalized = String(email).trim().toLowerCase()
    await signInWithEmailAndPassword(auth, normalized, password)
    // Best-effort: mirror this account into the OTHER project's auth so a
    // failover can sign the same people in. Never blocks / never duplicates.
    mirrorAuthAccount({ email: normalized, password }).catch(() => {})
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ admin, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Transient value handed out for the single render before a stale-context reload. */
const AUTH_STALE_SHELL = Object.freeze({
  admin: null,
  loading: true,
  authError: null,
  login: async () => {},
  logout: async () => {},
})

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    // createContext(null)'s default only leaks when no <AuthProvider> sits
    // above the caller. App.jsx mounts every screen inside one, so a coherent
    // module graph can never hit this — it happens when a hot-module swap
    // recreates the context and un-refreshed files still read the orphaned
    // old instance. Self-heal: reload once and hand back a loading shell (the
    // sessionStorage flag prevents a loop if a REAL provider bug ever exists).
    if (reloadOnceForStaleContext('useAuth')) return AUTH_STALE_SHELL
    throw new Error(
      'useAuth() called outside <AuthProvider> — every consumer must render inside <AuthProvider> (App.jsx). If you see this on a fresh load, a component was rendered outside the provider.',
    )
  }
  return ctx
}
