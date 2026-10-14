import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Eye,
  EyeOff,
  Copy,
  Pencil,
  Trash2,
  QrCode,
  Download,
  UserPlus,
  ShieldCheck,
  Loader2,
  FileSpreadsheet,
  KeyRound,
  RefreshCw,
} from 'lucide-react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as signOutSecondary,
} from 'firebase/auth'
import { auth, getSecondaryAuth } from '../firebase'
import { useAppData } from '../context/AppDataStore'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { createAdmin, updateAdmin, deleteAdmin, regenerateOperatorIfNeeded } from '../utils/dbOps'
import { mirrorAuthAccount } from '../utils/authMirror'
import { fmtDateTime } from '../utils/format'
import { downloadStudentQr, buildStudentQrDataUrl } from '../utils/qr'
import Avatar from '../components/Avatar'
import DataTable from '../components/DataTable'
import SearchSortBar from '../components/SearchSortBar'
import Modal from '../components/Modal'
import ExportModal from '../components/ExportModal'
import EmptyState from '../components/EmptyState'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Classifications are matched case-insensitively so legacy or hand-edited
 * documents (e.g. 'cassc') still land in the right tab. Anything unknown or
 * missing gets its own visible tab instead of silently disappearing.
 */
const normClass = (a) => String(a?.classification || '').trim().toUpperCase() || 'UNCLASSIFIED'
const BASE_TABS = ['CASSC', 'MAYOR']

/** Fresh temporary password — readable charset (no 0/O/1/I), 8 chars. */
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = 'CAS-'
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export default function AdminsPage({ active = false }) {
  const { admin: me } = useAuth()
  const { toast, confirm } = useToast()

  const [subTab, setSubTab] = useState('CASSC')
  // Operators come from the global boot store (cache-first → 0 reads on tab
  // switch; CRUD re-fetches immediately as before) — BUT the persistent
  // IndexedDB cache never refreshes on its own: operators added on ANOTHER
  // device, or directly in the Firebase Console, would stay invisible on this
  // one forever. So the tab re-validates against the server each time it
  // becomes active, throttled to once every 5 minutes (a handful of reads on
  // a tiny collection — the quota gateway counts them), and the Refresh
  // button covers everything in between.
  const { admins, booting: loading, reloadAdmins } = useAppData()

  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState({ key: 'fullName', dir: 'asc' })
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const lastAutoRefreshRef = useRef(0)
  /** Revealed passwords — keyed by row id; toggling shows the current
   *  temporary password (generated once per reveal) or the stored one. */
  const [shownPw, setShownPw] = useState(() => new Set())
  const [showPwFields, setShowPwFields] = useState(false)
  /** Locally-held temp passwords so the row shows them instantly after save. */
  const tempPwRef = useRef(new Map())
  const [generatingId, setGeneratingId] = useState(null)

  /** Eye toggle: hide when shown, else generate + persist + reveal a fresh
   *  temporary login password (Firebase Auth cannot be written from a browser
   *  for another user, so the profile copy is what the operator uses). */
  const revealTempPassword = async (a) => {
    const id = String(a.id)
    if (shownPw.has(id)) {
      setShownPw((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      return
    }
    setShownPw((prev) => new Set(prev).add(id))
    if (!tempPwRef.current.has(id) && !a.tempPassword) {
      setGeneratingId(id)
      const temp = generateTempPassword()
      tempPwRef.current.set(id, temp)
      try {
        await updateAdmin(id, { tempPassword: temp })
        toast.success('Temporary password saved', 'Copy it and share so the operator can sign in.')
      } catch (err) {
        toast.error('Could not save the temporary password', err.message)
      } finally {
        setGeneratingId(null)
      }
    }
  }

  const handleCopyTemp = async (id, value) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Copied', 'Temporary password copied to the clipboard.')
    } catch {
      toast.error('Copy failed', 'Select the password text and copy it manually.')
    }
  }

  // Heal a stale cache the moment this tab is opened (throttled to 5 min).
  useEffect(() => {
    if (!active || loading) return
    if (Date.now() - lastAutoRefreshRef.current < 5 * 60_000) return
    lastAutoRefreshRef.current = Date.now()
    reloadAdmins().catch(() => {})
  }, [active, loading, reloadAdmins])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const list = await reloadAdmins()
      lastAutoRefreshRef.current = Date.now()
      toast.success('Admins refreshed', `${list.length} operator${list.length === 1 ? '' : 's'} on record.`)
    } catch (err) {
      toast.error('Refresh failed', err.message)
    } finally {
      setRefreshing(false)
    }
  }

  /* modals */
  const emptyForm = {
    fullName: '',
    studentNumber: '',
    program: '',
    yearLevel: '1',
    section: '',
    classification: 'CASSC',
    email: '',
    password: '',
    confirmPassword: '',
  }
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [viewRow, setViewRow] = useState(null)
  const [qrRow, setQrRow] = useState(null)
  const [qrUrl, setQrUrl] = useState(null)

  const counts = useMemo(() => {
    const m = {}
    admins.forEach((a) => {
      const c = normClass(a)
      m[c] = (m[c] || 0) + 1
    })
    return m
  }, [admins])

  // CASSC / MAYOR first, then any other classification found in the data —
  // guarantees every admin is visible under exactly one tab.
  const tabs = useMemo(() => {
    const extra = []
    admins.forEach((a) => {
      const c = normClass(a)
      if (!BASE_TABS.includes(c) && !extra.includes(c)) extra.push(c)
    })
    return [...BASE_TABS, ...extra]
  }, [admins])

  // Fall back to the first tab if the selected one no longer has any admins.
  const activeTab = tabs.includes(subTab) ? subTab : tabs[0]

  const filtered = useMemo(() => admins.filter((a) => normClass(a) === activeTab), [admins, activeTab])

  const onSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const openAdd = () => {
    setEditTarget(null)
    setForm({ ...emptyForm, classification: activeTab })
    setFormOpen(true)
  }

  const openEdit = (a) => {
    setEditTarget(a)
    setForm({
      fullName: a.fullName || '',
      studentNumber: a.studentNumber || '',
      program: a.program || '',
      yearLevel: a.yearLevel || '1',
      section: a.section || '',
      classification: a.classification || 'CASSC',
      email: a.email || '',
      password: '',
      confirmPassword: '',
    })
    setFormOpen(true)
  }

  const saveAdmin = async (e) => {
    e.preventDefault()
    const required = ['fullName', 'studentNumber', 'program', 'section', 'email']
    if (required.some((k) => !form[k].trim()))
      return toast.warning('Missing fields', 'Please fill out every required field.')

    if (!EMAIL_RE.test(form.email.trim()))
      return toast.error('Invalid email', 'Please enter a valid email address.')
    const dupEmail = admins.find(
      (a) => String(a.email).toLowerCase() === form.email.trim().toLowerCase() && a.id !== editTarget?.id,
    )
    if (dupEmail) return toast.error('Email already used', `${form.email} belongs to ${dupEmail.fullName}.`)

    // Password rules: required on create (the credential is stored in
    // Firebase Authentication, never in Firestore).
    if (!editTarget) {
      if (form.password.length < 6) return toast.error('Weak password', 'Password must be at least 6 characters.')
      if (form.password !== form.confirmPassword)
        return toast.error('Passwords do not match', 'Re-type the password twice so they match.')
    }

    try {
      const base = {
        fullName: form.fullName.trim(),
        studentNumber: form.studentNumber.trim(),
        program: form.program.trim().toUpperCase(),
        yearLevel: form.yearLevel,
        section: form.section.trim().toUpperCase(),
        classification: form.classification,
        email: form.email.trim().toLowerCase(),
      }

      if (editTarget) {
        const regen = await regenerateOperatorIfNeeded(editTarget, base)
        const changes = { ...base, ...regen }
        await updateAdmin(editTarget.id, changes)
        toast.success(
          'Admin updated',
          regen.operatorId ? `Saved — Operator ID regenerated to ${regen.operatorId}.` : `${base.fullName}'s details were saved.`,
        )
      } else {
        // Create the Auth account on a SECONDARY app instance so this
        // admin's session stays intact, then save their profile document.
        let cred
        try {
          const secondary = getSecondaryAuth()
          cred = await createUserWithEmailAndPassword(secondary, base.email, form.password)
          await signOutSecondary(secondary).catch(() => {})
        } catch (err) {
          if (err.code === 'auth/email-already-in-use')
            throw new Error('That email already has a Firebase Authentication account.')
          if (err.code === 'auth/weak-password')
            throw new Error('Password is too weak — use at least 6 characters.')
          throw err
        }
        const created = await createAdmin({
          ...base,
          uid: cred.user.uid,
          createdBy: me?.operatorId || '',
          // Stored ONLY so the owner can look up what was assigned to this
          // operator later (the Firebase Auth copy can never be displayed).
          initialPassword: form.password,
        })
        toast.success('Admin added', `${created.fullName} · ${created.operatorId}`)
        // Best-effort: mirror the new operator's auth account into the backup
        // project too, so a failover can sign them in. Never blocks / duplicates.
        mirrorAuthAccount({ email: base.email, password: form.password }).catch(() => {})
      }
      setFormOpen(false)
      reloadAdmins()
    } catch (err) {
      toast.error('Could not save admin', err.message)
    }
  }

  /** Operator passwords are managed by Firebase Auth — send a reset link. */
  const handleSendReset = async () => {
    const ok = await confirm({
      title: 'Send password-reset email?',
      message: `${editTarget?.fullName} (${editTarget?.email}) will receive instructions to choose a new password.`,
      confirmLabel: 'Send email',
    })
    if (!ok) return
    try {
      await sendPasswordResetEmail(auth, editTarget.email)
      toast.success('Reset email sent', `${editTarget.fullName} should check their inbox.`)
    } catch (err) {
      toast.error('Could not send reset email', err.message)
    }
  }

  const removeOne = async (a) => {
    if (a.id === me?.id) return toast.error('Not allowed', 'You cannot delete your own account.')
    if (admins.length <= 1) return toast.error('Not allowed', 'At least one admin must remain.')
    const ok = await confirm({
      title: `Delete ${a.fullName}?`,
      message: `${a.operatorId} will permanently lose access to CASScan.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAdmin(a.id)
      // Drop the deleted admin from the selection so the bulk bar count stays accurate.
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(String(a.id))
        return next
      })
      toast.success('Admin deleted', `${a.fullName} was removed.`)
      reloadAdmins()
    } catch (err) {
      toast.error('Could not delete', err.message)
    }
  }

  const removeBulk = async () => {
    const picked = admins.filter((a) => selected.has(String(a.id)))
    if (picked.some((a) => a.id === me?.id)) return toast.error('Not allowed', 'You cannot delete your own account.')
    if (picked.length >= admins.length) return toast.error('Not allowed', 'At least one admin must remain.')
    const ok = await confirm({
      title: `Delete ${picked.length} admin${picked.length > 1 ? 's' : ''}?`,
      message: 'The selected operators will permanently lose access.',
      confirmLabel: 'Delete all',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await Promise.all(picked.map((a) => deleteAdmin(a.id)))
      setSelected(new Set())
      toast.success('Admins deleted', `${picked.length} removed.`)
      reloadAdmins()
    } catch (err) {
      toast.error('Could not delete', err.message)
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = () => setExportOpen(true)
  // Passwords are never exported.
  const exportRows = useMemo(
    () =>
      filtered.map((a) => ({
        studentId: a.studentId,
        operatorId: a.operatorId,
        classification: a.classification,
        studentNumber: a.studentNumber,
        fullName: a.fullName,
        program: a.program,
        yearLevel: a.yearLevel,
        section: a.section,
        email: a.email,
      })),
    [filtered],
  )
  const [exportOpen, setExportOpen] = useState(false)

  const openQr = async (a) => {
    setQrRow(a)
    setQrUrl(null)
    try {
      setQrUrl(await buildStudentQrDataUrl(a))
    } catch (err) {
      toast.error('Could not build QR', err.message)
      setQrRow(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Admins &amp; Operators</h2>
          <p className="sub">Operators are grouped into CASSC and MAYOR · Operator IDs are auto-generated</p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Re-fetch the operator list from the server"
          >
            {refreshing ? <Loader2 size={15} /> : <RefreshCw size={15} />} Refresh
          </button>
          <button type="button" className="btn btn-outline" onClick={exportCsv} disabled={!filtered.length}>
            <FileSpreadsheet size={15} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <UserPlus size={15} /> Add admin
          </button>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 14 }}>
        <div className="segmented">
          {tabs.map((c) => (
            <button key={c} type="button" className={activeTab === c ? 'on' : ''} onClick={() => { setSubTab(c); setSelected(new Set()) }}>
              <ShieldCheck size={14} /> {c}
              <span className="chip" style={{ padding: '1px 8px' }}>{counts[c] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <SearchSortBar
          placeholder={`Search ${activeTab} operators…`}
          value={searchTerm}
          onChange={setSearchTerm}
          sortOptions={[
            { value: 'fullName', label: 'Name' },
            { value: 'program', label: 'Program' },
            { value: 'operatorId', label: 'Operator ID' },
          ]}
          sortKey={sort.key}
          onSortKeyChange={(k) => setSort({ key: k, dir: 'asc' })}
          sortDir={sort.dir}
          onToggleDir={() => setSort((s) => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
        />

        <DataTable
          columns={[
            {
              key: 'fullName',
              label: 'Full name',
              render: (a) => (
                <span className="row">
                  <Avatar name={a.fullName} size={30} />
                  <span>
                    <span className="cell-strong">{a.fullName}</span>
                    <div className="cell-sub mono">{a.studentId}</div>
                  </span>
                </span>
              ),
            },
            {
              key: 'operatorId',
              label: 'Operator ID',
              render: (a) => (
                <>
                  <span className={`badge ${a.classification === 'MAYOR' ? 'mayor' : 'cassc'} mono`}>{a.operatorId}</span>
                  <div className="cell-sub">Y{a.yearLevel} · {a.section}</div>
                </>
              ),
            },
            {
              key: 'email',
              label: 'Email',
              className: 'hide-sm',
              render: (a) => a.email,
            },
            {
              key: 'password',
              label: 'Password',
              sortable: false,
              hideSm: true,
              render: (a) => {
                const id = String(a.id)
                const shown = shownPw.has(id)
                // Clicking the eye generates (once) a fresh TEMPORARY password,
                // persists it on the profile, and shows it so the operator can
                // sign in. Legacy rows fall back to the stored initial password.
                const temp = tempPwRef.current.get(id) || a.tempPassword
                const value = shown ? temp || a.initialPassword || '' : ''
                return (
                  <span className="row" style={{ gap: 4 }}>
                    <span className="mono muted">{shown && value ? value : '••••••••'}</span>
                    {shown && value && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 6, minWidth: 30, minHeight: 30, display: 'grid', placeItems: 'center' }}
                        title="Copy the temporary password"
                        onClick={() => handleCopyTemp(id, value)}
                      >
                        <Copy size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 8, minWidth: 34, minHeight: 34, display: 'grid', placeItems: 'center' }}
                      disabled={generatingId === id}
                      title={shown ? 'Hide the password' : 'Generate & show a temporary login password'}
                      onClick={() => revealTempPassword(a)}
                    >
                      {generatingId === id ? <Loader2 size={14} className="spin" /> : shown ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </span>
                )
              },
            },
          ]}
          rows={filtered}
          rowKey="id"
          searchTerm={searchTerm}
          searchKeys={['fullName', 'studentNumber', 'program', 'section', 'operatorId', 'email']}
          sort={sort}
          onSort={onSort}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          loading={loading}
          actions={(a) => [
            { label: 'View full details', icon: Eye, onClick: () => setViewRow(a) },
            { label: 'Edit', icon: Pencil, onClick: () => openEdit(a) },
            { label: 'Generate & download QR', icon: QrCode, onClick: () => openQr(a) },
            'divider',
            { label: 'Delete', icon: Trash2, danger: true, disabled: busy || a.id === me?.id, onClick: () => removeOne(a) },
          ]}
          empty={
            <EmptyState
              icon={ShieldCheck}
              title={searchTerm ? 'No match' : `No ${activeTab} operators yet`}
              message={searchTerm ? `No operator matches “${searchTerm}”.` : 'Use the “Add admin” button to register one.'}
            />
          }
        />
      </div>

      {/* Bulk delete bar */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="count">{selected.size} selected</span>
          <button type="button" className="btn btn-danger btn-sm" onClick={removeBulk}>
            <Trash2 size={14} /> Delete admins
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Add / edit modal */}
      <Modal
        open={formOpen}
        title={editTarget ? `Edit — ${editTarget.fullName}` : 'Add admin'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" form="admin-form" className="btn btn-primary">
              {editTarget ? 'Save changes' : 'Add admin'}
            </button>
          </>
        }
      >
        <form id="admin-form" onSubmit={saveAdmin} className="col">
          {!editTarget && (
            <p className="hint muted">The Operator ID (e.g. CASSC-BSMATH2A-001) and Student ID are generated automatically.</p>
          )}
          <div className="form-grid">
            <div className="field">
              <label>Classification *</label>
              <select className="select" value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })}>
                <option value="CASSC">CASSC</option>
                <option value="MAYOR">MAYOR</option>
              </select>
            </div>
            <div className="field">
              <label>Full name *</label>
              <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Juan Dela Cruz" />
            </div>
            <div className="field">
              <label>Student number *</label>
              <input className="input" value={form.studentNumber} onChange={(e) => setForm({ ...form, studentNumber: e.target.value })} placeholder="2026-00001" />
            </div>
            <div className="field">
              <label>Program *</label>
              <input className="input" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} placeholder="BSMATH" />
            </div>
            <div className="field">
              <label>Year level *</label>
              <select className="select" value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: e.target.value })}>
                {['1', '2', '3', '4', '5', '6'].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Section *</label>
              <input className="input" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="A" />
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Email *</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="operator@cas.edu" />
            </div>
          </div>

          {editTarget ? (
            <>
              <div className="detail-item">
                <div className="k">Password</div>
                <div className="v">Managed securely by Firebase Authentication</div>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ alignSelf: 'flex-start' }}
                onClick={handleSendReset}
              >
                <KeyRound size={15} /> Send password-reset email
              </button>
              <p className="hint muted">
                Passwords live in Firebase Authentication — this operator picks their new password via the emailed link.
              </p>
            </>
          ) : (
            <>
              <div className="form-grid">
                <div className="field">
                  <label>
                    <span className="row" style={{ gap: 6 }}>
                      <KeyRound size={13} /> Password *
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 8, minWidth: 34, minHeight: 34, display: 'grid', placeItems: 'center' }}
                        onClick={() => setShowPwFields((s) => !s)}
                        title={showPwFields ? 'Hide passwords' : 'Show passwords'}
                      >
                        {showPwFields ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </span>
                  </label>
                  <input
                    type={showPwFields ? 'text' : 'password'}
                    className="input"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div className="field">
                  <label>Confirm password *</label>
                  <input
                    type={showPwFields ? 'text' : 'password'}
                    className="input"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Type the password again"
                  />
                </div>
              </div>
              <p className="hint muted">Both password entries must match exactly before saving is allowed.</p>
            </>
          )}
        </form>
      </Modal>

      {/* View full details */}
      <Modal open={!!viewRow} title="Admin full details" onClose={() => setViewRow(null)}>
        {viewRow && (
          <>
            <div className="row" style={{ gap: 12 }}>
              <Avatar name={viewRow.fullName} size={48} />
              <div>
                <h3>{viewRow.fullName}</h3>
                <span className={`badge ${viewRow.classification === 'MAYOR' ? 'mayor' : 'cassc'}`}>{viewRow.classification}</span>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-item"><div className="k">Operator ID</div><div className="v mono">{viewRow.operatorId}</div></div>
              <div className="detail-item"><div className="k">Student ID</div><div className="v mono">{viewRow.studentId}</div></div>
              <div className="detail-item"><div className="k">Student number</div><div className="v">{viewRow.studentNumber}</div></div>
              <div className="detail-item"><div className="k">Program</div><div className="v">{viewRow.program}</div></div>
              <div className="detail-item"><div className="k">Year &amp; section</div><div className="v">Y{viewRow.yearLevel} · {viewRow.section}</div></div>
              <div className="detail-item"><div className="k">Email</div><div className="v">{viewRow.email}</div></div>
              <div className="detail-item">
                <div className="k">Password</div>
                <div className="v mono row" style={{ gap: 6 }}>
                  {viewRow.tempPassword || viewRow.initialPassword ? (
                    <>
                      <span>{shownPw.has(String(viewRow.id)) ? (viewRow.tempPassword || viewRow.initialPassword) : '••••••••'}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: 8, minWidth: 34, minHeight: 34, display: 'grid', placeItems: 'center' }}
                        onClick={() => {
                          const id = String(viewRow.id)
                          setShownPw((prev) => {
                            const next = new Set(prev)
                            if (next.has(id)) next.delete(id)
                            else next.add(id)
                            return next
                          })
                        }}
                        title={shownPw.has(String(viewRow.id)) ? 'Hide the password' : 'Show the password'}
                      >
                        {shownPw.has(String(viewRow.id)) ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </>
                  ) : (
                    '(managed by Firebase Authentication)'
                  )}
                </div>
              </div>
              <div className="detail-item"><div className="k">Added</div><div className="v">{fmtDateTime(viewRow.createdAt)}</div></div>
            </div>
          </>
        )}
      </Modal>

      {/* QR modal */}
      <Modal
        open={!!qrRow}
        title={`QR code — ${qrRow?.fullName || ''}`}
        onClose={() => {
          setQrRow(null)
          setQrUrl(null)
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setQrRow(null)
                setQrUrl(null)
              }}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!qrUrl}
              onClick={async () => {
                try {
                  await downloadStudentQr(qrRow)
                  toast.success('QR downloaded', `${qrRow.fullName}'s QR code was saved.`)
                } catch (err) {
                  toast.error('Download failed', err.message)
                }
              }}
            >
              <Download size={15} /> Download PNG
            </button>
          </>
        }
      >
        {!qrRow || !qrUrl ? (
          <div className="center" style={{ padding: 40 }}>
            <Loader2 size={26} />
          </div>
        ) : (
          <div className="qr-preview">
            <img src={qrUrl} alt={`QR code for ${qrRow.fullName}`} />
          </div>
        )}
      </Modal>


      {/* Export dialog (Excel vs Google Sheets flavours) */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        filename={`casscan_admins_${activeTab.toLowerCase()}.csv`}
        rows={exportRows}
        title={`Export ${activeTab} operators`}
      />

    </>
  )
}
