import { useEffect, useMemo, useState } from 'react'
import { Zap, CalendarClock, Clock3, Hash, Award, KeyRound, Save, Loader2, ShieldCheck } from 'lucide-react'
import { updateEmail, updatePassword } from 'firebase/auth'
import { query, where } from 'firebase/firestore'
import { collection, getCountFromServer } from '../utils/firestoreGateway'
import { auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateAdmin } from '../utils/dbOps'
import { fmtDate } from '../utils/format'
import Avatar from '../components/Avatar'

const RANKS = [
  { min: 0, name: 'Rookie Scanner' },
  { min: 10, name: 'Operator I' },
  { min: 25, name: 'Operator II' },
  { min: 50, name: 'Senior Operator' },
  { min: 100, name: 'Grandmaster' },
]

/** Module-scope helper so Date.now() never runs during render. */
function computeDaysSince(iso) {
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000))
}

export default function MyDetailsPage() {
  const { admin } = useAuth()
  const { toast, confirm } = useToast()

  // Lifetime stats via COUNT() aggregates — a couple of reads per visit
  // (1 read per 1000 matched docs) instead of reading the entire
  // attendanceRecords collection on every visit.
  const [stats, setStats] = useState({ scans: null, events: null })
  const operatorId = admin?.operatorId
  useEffect(() => {
    if (!operatorId) return undefined
    let alive = true
    ;(async () => {
      try {
        const [scans, evts] = await Promise.all([
          getCountFromServer(
            query(collection(null, 'attendanceRecords'), where('scannedBy', '==', operatorId)),
          ),
          getCountFromServer(
            query(collection(null, 'attendanceEvents'), where('startedBy', '==', operatorId)),
          ),
        ])
        if (alive) setStats({ scans: scans.data().count || 0, events: evts.data().count || 0 })
      } catch (err) {
        console.warn('[mydetails] count query failed:', err.code || err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [operatorId])
  const scansPerformed = stats.scans ?? 0
  const eventsOperated = stats.events ?? 0

  /* rank / xp */
  const rankIndex = useMemo(() => {
    let idx = 0
    RANKS.forEach((r, i) => {
      if (scansPerformed >= r.min) idx = i
    })
    return idx
  }, [scansPerformed])
  const rank = RANKS[rankIndex]
  const nextRank = RANKS[rankIndex + 1] || null
  const xpBase = rank.min
  const xpTarget = nextRank ? nextRank.min : rank.min + 1
  const xpPct = nextRank ? Math.min(100, ((scansPerformed - xpBase) / (xpTarget - xpBase)) * 100) : 100

  /* edit forms */
  const [form, setForm] = useState(null) // lazily initialised from admin
  const [pw, setPw] = useState({ password: '', confirmPassword: '' })
  const [busy, setBusy] = useState(false)

  const formValues = form || {
    fullName: admin?.fullName || '',
    studentNumber: admin?.studentNumber || '',
    program: admin?.program || '',
    yearLevel: admin?.yearLevel || '1',
    section: admin?.section || '',
    email: admin?.email || '',
  }
  const setF = (k) => (e) => setForm({ ...formValues, [k]: e.target.value })

  const badges = [
    { label: 'First scan', earned: scansPerformed >= 1 },
    { label: '10 scans', earned: scansPerformed >= 10 },
    { label: '50 scans', earned: scansPerformed >= 50 },
    { label: 'Event starter', earned: eventsOperated >= 1 },
    { label: '5 events run', earned: eventsOperated >= 5 },
    { label: rank.name, earned: true },
  ]

  const saveDetails = async (e) => {
    e.preventDefault()
    const required = ['fullName', 'studentNumber', 'program', 'section', 'email']
    if (required.some((k) => !formValues[k].trim()))
      return toast.warning('Missing fields', 'Please fill out every required field.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim()))
      return toast.error('Invalid email', 'Please enter a valid email address.')

    const ok = await confirm({
      title: 'Save your details?',
      message: 'Your profile information will be updated immediately.',
      confirmLabel: 'Save',
    })
    if (!ok) return

    const nextEmail = formValues.email.trim().toLowerCase()
    const emailChanged = nextEmail !== String(admin?.email || '').toLowerCase()

    setBusy(true)
    try {
      // Keep the Firebase Authentication email in sync with the profile.
      if (emailChanged) await updateEmail(auth.currentUser, nextEmail)
      await updateAdmin(admin.id, {
        fullName: formValues.fullName.trim(),
        studentNumber: formValues.studentNumber.trim(),
        program: formValues.program.trim().toUpperCase(),
        yearLevel: formValues.yearLevel,
        section: formValues.section.trim().toUpperCase(),
        email: nextEmail,
      })
      toast.success('Details saved', 'Your profile has been updated.')
      setForm(null)
    } catch (err) {
      if (err.code === 'auth/requires-recent-login')
        toast.warning(
          'Please sign in again',
          'For security, sign out and sign back in first, then update your email.',
        )
      else if (err.code === 'auth/email-already-in-use')
        toast.error('Email already used', 'Another account is already using that email.')
      else toast.error('Could not save', err.message)
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (!pw.password || !pw.confirmPassword)
      return toast.warning('Missing fields', 'Enter the new password twice.')
    if (pw.password.length < 6) return toast.error('Weak password', 'New password must be at least 6 characters.')
    if (pw.password !== pw.confirmPassword)
      return toast.error('Passwords do not match', 'The two entries must be identical before saving.')

    const ok = await confirm({
      title: 'Change your password?',
      message:
        'Your Firebase Authentication password will be updated — no current password needed. The backup project\u2019s copy catches up automatically the next time you sign in.',
      confirmLabel: 'Save password',
      danger: true,
    })
    if (!ok) return

    setBusy(true)
    try {
      // Firebase Authentication only needs a still-recent session here — the
      // current password is not required (see auth/requires-recent-login).
      await updatePassword(auth.currentUser, pw.password)
      // The backup project's auth copy cannot be re-signed-in without the old
      // password, so it is NOT updated in this step; mirrorAuthAccount() re-
      // mirrors it (with the new password) the next time this admin signs in.
      setPw({ password: '', confirmPassword: '' })
      toast.success('Password changed', 'Use your new password the next time you sign in.')
    } catch (err) {
      if (err.code === 'auth/requires-recent-login')
        toast.warning(
          'Please sign in again',
          'For security, sign out and sign back in first, then change your password.',
        )
      else toast.error('Could not change password', err.message)
    } finally {
      setBusy(false)
    }
  }

  const daysSince = admin?.createdAt ? computeDaysSince(admin.createdAt) : '—'

  return (
    <>
      {/* Game-style hero */}
      <div className="card profile-hero">
        <div className="profile-banner" />
        <div className="profile-body">
          <div className="profile-toprow">
            <span className="profile-avatar-ring">
              <Avatar name={admin?.fullName || '?'} size={92} />
            </span>
            <div className="profile-titles">
              <h2>{admin?.fullName}</h2>
              <p className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                <span className={`badge ${admin?.classification === 'MAYOR' ? 'mayor' : 'cassc'}`}>{admin?.classification}</span>
                <span className="chip primary mono">{admin?.operatorId}</span>
              </p>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 7 }}>
                {rank.name} · Member since {admin?.createdAt ? fmtDate(admin.createdAt) : '—'} · {admin?.email}
              </p>
            </div>
            <div className="xp-block">
              <div className="xp-meta">
                <span>LV {rankIndex + 1}</span>
                <span>{scansPerformed} scans</span>
                <span>{nextRank ? `LV ${rankIndex + 2}` : 'MAX'}</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="xp-meta">
                <span>{nextRank ? `${Math.max(0, scansPerformed - xpBase)}/${xpTarget - xpBase} to ${nextRank.name}` : 'Highest rank achieved'}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="badges-row">
            {badges.map((b) => (
              <span key={b.label} className={`badge-tile ${b.earned ? 'earned' : ''}`}>
                <Award size={13} /> {b.label}
              </span>
            ))}
          </div>

          {/* Stat tiles */}
          <div className="stats-grid" style={{ marginTop: 18 }}>
            <div className="card stat-card">
              <div className="stat-icon amber"><Zap size={20} /></div>
              <div><div className="stat-value">{scansPerformed}</div><div className="stat-label">Scans performed</div></div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon indigo"><CalendarClock size={20} /></div>
              <div><div className="stat-value">{eventsOperated}</div><div className="stat-label">Events operated</div></div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon sky"><Clock3 size={20} /></div>
              <div><div className="stat-value">{daysSince}</div><div className="stat-label">Days in service</div></div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon violet"><Hash size={20} /></div>
              <div><div className="stat-value mono" style={{ fontSize: 15 }}>{admin?.studentId}</div><div className="stat-label">Student ID</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit details — marginTop gives breathing room below the profile hero;
          default grid stretch keeps both cards the same height. */}
      <div className="charts-grid" style={{ marginTop: 18 }}>
        <form className="card card-pad" onSubmit={saveDetails}>
          <div className="card-title">
            <ShieldCheck size={17} /> Edit my details
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Full name</label>
              <input className="input" value={formValues.fullName} onChange={setF('fullName')} />
            </div>
            <div className="field">
              <label>Student number</label>
              <input className="input" value={formValues.studentNumber} onChange={setF('studentNumber')} />
            </div>
            <div className="field">
              <label>Program</label>
              <input className="input" value={formValues.program} onChange={setF('program')} />
            </div>
            <div className="field">
              <label>Year level</label>
              <select className="select" value={formValues.yearLevel} onChange={setF('yearLevel')}>
                {['1', '2', '3', '4', '5', '6'].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Section</label>
              <input className="input" value={formValues.section} onChange={setF('section')} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" className="input" value={formValues.email} onChange={setF('email')} />
            </div>
          </div>
          <p className="hint muted" style={{ marginTop: 10 }}>
            Note: changing classification / program / year / section regenerates your Operator ID (done from the Admins tab).
          </p>
          <button type="submit" className="btn btn-primary" style={{ marginTop: 14 }} disabled={busy}>
            {busy ? <Loader2 size={15} /> : <Save size={15} />} Save changes
          </button>
        </form>

        {/* Change password */}
        <form className="card card-pad" onSubmit={changePassword}>
          <div className="card-title">
            <KeyRound size={17} /> Change password
          </div>
          <div className="col">
            <div className="field">
              <label>New password</label>
              <input type="password" className="input" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} placeholder="Min. 6 characters" />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input type="password" className="input" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} placeholder="Type it again" />
            </div>
            {pw.password && pw.confirmPassword && (
              <span className={`badge ${pw.password === pw.confirmPassword ? 'present' : 'absent'}`}>
                {pw.password === pw.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </span>
            )}
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 6 }} disabled={busy}>
              {busy ? <Loader2 size={15} /> : <KeyRound size={15} />} Update password
            </button>
          </div>
        </form>
      </div>

    </>
  )
}
