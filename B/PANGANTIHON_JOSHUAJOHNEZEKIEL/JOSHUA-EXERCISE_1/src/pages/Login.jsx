import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine, BarChart3, Users, QrCode, Mail, KeyRound, Loader2 } from 'lucide-react'
import { limit as fsLimit, query } from 'firebase/firestore'
import { collection } from '../utils/firestoreGateway'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '../firebase'
import useFirestoreQuery from '../hooks/useFirestoreQuery'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { createFirstAdmin } from '../utils/dbOps'
import { mirrorAuthAccount } from '../utils/authMirror'

const CLASSIFICATIONS = ['CASSC', 'MAYOR']

export default function LoginPage() {
  const { login, admin, authError } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // Already authenticated (e.g. bounced back while the profile resolved) → go straight in.
  useEffect(() => {
    if (admin) navigate('/overview', { replace: true })
  }, [admin, navigate])

  // Setup detection needs to know only whether ANY admin exists — limit(1)
  // keeps this to a single read instead of downloading the whole collection.
  const { data: admins, loading: adminsLoading } = useFirestoreQuery(
    useMemo(() => query(collection(db, 'admins'), fsLimit(1)), []),
    { cacheKey: 'admins:existence', ttlMs: 30_000 },
  )
  const setupMode = !adminsLoading && admins.length === 0

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    studentNumber: '',
    program: '',
    yearLevel: '1',
    section: '',
    classification: 'CASSC',
    confirmPassword: '',
  })
  const [busy, setBusy] = useState(false)

  /* Accounts previously used on THIS device — quick-pick chips on the login form. */
  const [knownAccounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('casscan_accounts') || '[]')
    } catch {
      return []
    }
  })
  const rememberAccount = (email) => {
    try {
      const list = JSON.parse(localStorage.getItem('casscan_accounts') || '[]')
      const next = [email, ...list.filter((e) => e !== email)].slice(0, 5)
      localStorage.setItem('casscan_accounts', JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.warning('Missing fields', 'Enter your email and password.')
    setBusy(true)
    try {
      // Firebase Authentication validates the credentials; the resulting
      // session is picked up by onAuthStateChanged in AuthContext.
      await login(form.email, form.password)
      rememberAccount(String(form.email).trim().toLowerCase())
      toast.success('Welcome back', 'You are now signed in.')
      navigate('/overview')
    } catch (err) {
      toast.error('Sign in failed', err.message)
    } finally {
      setBusy(false)
    }
  }

    const handleSetup = async (e) => {
    e.preventDefault()
    const required = ['fullName', 'studentNumber', 'program', 'section', 'email']
    if (required.some((k) => !form[k].trim()) || !form.password)
      return toast.warning('Missing fields', 'Please fill out every required input.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return toast.error('Invalid email', 'Please enter a valid email address.')
    if (form.password.length < 6)
      return toast.error('Weak password', 'Password must be at least 6 characters.')
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match', 'Re-type the password twice so they match.')

    setBusy(true)
    let cred = null
    try {
      // Creating the account on the primary Auth instance signs the new
      // admin straight in — onAuthStateChanged picks up the session.
      cred = await createUserWithEmailAndPassword(
        auth,
        form.email.trim().toLowerCase(),
        form.password,
      )
      try {
        await createFirstAdmin({
          fullName: form.fullName.trim(),
          studentNumber: form.studentNumber.trim(),
          program: form.program.trim().toUpperCase(),
          yearLevel: form.yearLevel,
          section: form.section.trim().toUpperCase(),
          classification: form.classification,
          email: form.email.trim().toLowerCase(),
          uid: cred.user.uid,
          createdBy: 'system-bootstrap',
        })
      } catch (profileErr) {
        // The Auth account now exists WITHOUT a profile. Roll it back so the
        // setup form can be retried without hitting "email-already-in-use";
        // if the rollback itself fails, signing in with this email will
        // auto-complete the bootstrap (see AuthContext).
        const removed = await cred.user.delete().then(() => true).catch(() => false)
        throw Object.assign(profileErr, {
          message: removed
            ? `${profileErr.message} The half-created account was removed — please try again.`
            : `${profileErr.message} Sign in with this email to finish setup automatically.`,
        })
      }
      rememberAccount(String(form.email).trim().toLowerCase())
      // Best-effort: mirror the first admin's auth account into the backup
      // project too, so a failover can sign them in. Never blocks / duplicates.
      mirrorAuthAccount({ email: form.email.trim().toLowerCase(), password: form.password }).catch(() => {})
      toast.success('Admin account created', 'Welcome to CASScan!')
      navigate('/overview')
    } catch (err) {
      const message =
        err.code === 'auth/email-already-in-use'
          ? 'That email is already registered in Firebase Authentication.'
          : err.code === 'auth/weak-password'
            ? 'Password is too weak — use at least 6 characters.'
            : err.message
      toast.error('Setup failed', message)
    } finally {
      setBusy(false)
    }
  }

    return (
    <div className="login-split">
      {/* Left brand pane */}
      <div className="login-brand">
        <div className="logo-row">
          <span className="brand-mark isat" style={{ width: 46, height: 46 }}>
            <img src="/ISATUlogo.jpg" alt="ISATU logo" className="brand-logo-img" style={{ width: 30, height: 30 }} />
          </span>
          <div>
            <strong style={{ fontSize: 19, fontFamily: 'var(--font-display)' }}>CASScan</strong>
            <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: '0.08em' }}>COLLEGE OF ARTS &amp; SCIENCES</div>
          </div>
        </div>

        <div>
          <h1>
            Attendance: Scanned in Seconds
          </h1>
          <p className="tagline">
            Generate QR IDs for your students, scan them at the door, and let CASScan track every present,
            absent, and trend in between.
          </p>
          <div className="brand-features">
            <div className="brand-feature"><span className="fi"><ScanLine size={18} /></span> Instant QR check-in at CAS stations</div>
            <div className="brand-feature"><span className="fi"><BarChart3 size={18} /></span> Live stats, trends &amp; CSV exports</div>
            <div className="brand-feature"><span className="fi"><Users size={18} /></span> Manage students &amp; CASSC / MAYOR operators</div>
            <div className="brand-feature"><span className="fi"><QrCode size={18} /></span> Downloadable QR codes with student names</div>
          </div>
        </div>

        <div className="foot">© {new Date().getFullYear()} CASScan · College of Arts and Sciences</div>
      </div>

      {/* Right form pane */}
      <div className="login-pane">
        <form className="card login-card" onSubmit={setupMode ? handleSetup : handleLogin}>
          <div className="mobile-logo row" style={{ marginBottom: 12 }}>
            <span className="brand-mark isat" style={{ width: 34, height: 34 }}>
              <img src="/ISATUlogo.jpg" alt="ISATU logo" className="brand-logo-img" style={{ width: 22, height: 22 }} />
            </span>
            <strong style={{ fontFamily: 'var(--font-display)' }}>CASScan</strong>
          </div>

          <h2>{setupMode ? 'Create the first admin' : 'Admin Sign In'}</h2>
          <p className="sub">
            {setupMode
              ? 'No admin exists yet. Set up the initial account to start using CASScan.'
              : 'Sign in with your CASScan admin credentials.'}
          </p>

          {setupMode ? (
            <>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="su-name">Full name</label>
                  <input id="su-name" className="input" value={form.fullName} onChange={set('fullName')} placeholder="Juan Dela Cruz" />
                </div>
                <div className="field">
                  <label htmlFor="su-sn">Student number</label>
                  <input id="su-sn" className="input" value={form.studentNumber} onChange={set('studentNumber')} placeholder="2026-00001" />
                </div>
                <div className="field">
                  <label htmlFor="su-prog">Program</label>
                  <input id="su-prog" className="input" value={form.program} onChange={set('program')} placeholder="BSMATH" />
                </div>
                <div className="field">
                  <label htmlFor="su-yr">Year level</label>
                  <select id="su-yr" className="select" value={form.yearLevel} onChange={set('yearLevel')}>
                    {['1', '2', '3', '4', '5', '6'].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="su-sec">Section</label>
                  <input id="su-sec" className="input" value={form.section} onChange={set('section')} placeholder="A" />
                </div>
                <div className="field">
                  <label htmlFor="su-class">Classification</label>
                  <select id="su-class" className="select" value={form.classification} onChange={set('classification')}>
                    {CLASSIFICATIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="su-email"><span className="row" style={{ gap: 6 }}><Mail size={13} /> Email</span></label>
                <input id="su-email" type="email" className="input" value={form.email} onChange={set('email')} placeholder="admin@cas.edu" />
              </div>
            </>
          ) : (
            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="li-email"><span className="row" style={{ gap: 6 }}><Mail size={13} /> Email</span></label>
              <input id="li-email" type="email" className="input" value={form.email} onChange={set('email')} placeholder="admin@cas.edu" autoFocus />
            </div>
          )}

          {!setupMode && knownAccounts.length > 0 && (
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {knownAccounts.map((acc) => (
                <button
                  key={acc}
                  type="button"
                  className={`chip mono ${form.email.toLowerCase() === acc ? 'primary' : ''}`}
                  style={{ cursor: 'pointer', border: 'none' }}
                  onClick={() => setForm((f) => ({ ...f, email: acc }))}
                >
                  {acc}
                </button>
              ))}
              <span className="hint muted">Saved on this device</span>
            </div>
          )}

          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="li-pass"><span className="row" style={{ gap: 6 }}><KeyRound size={13} /> Password</span></label>
            <input id="li-pass" type="password" className="input" value={form.password} onChange={set('password')} placeholder="••••••••" />
          </div>

          {setupMode && (
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="su-pass2">Confirm password</label>
              <input id="su-pass2" type="password" className="input" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Type the password again" />
              <span className="hint">Both entries must match before the account can be saved.</span>
            </div>
          )}

          {authError && (
            <p
              style={{
                marginTop: 16,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              {authError === 'permission'
                ? 'CASScan cannot read its database (permission-denied). Open Firebase Console → Firestore → Rules and allow read/write.'
                : authError === 'orphan'
                  ? `This email signs in, but no CASScan admin profile matches it (${admins.length} profile(s) exist here). Make sure a profile document in the "admins" collection has this exact email, or use the setup form on an empty database.`
                  : authError}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }} disabled={busy || adminsLoading}>
            {busy && <Loader2 size={16} />}
            {setupMode ? 'Create account & continue' : 'Sign in'}
          </button>

        </form>
      </div>

    </div>
  )
}


