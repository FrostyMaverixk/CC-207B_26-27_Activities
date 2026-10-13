import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PlayCircle,
  StopCircle,
  Pencil,
  Eye,
  Ban,
  CalendarClock,
  Loader2,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
} from 'lucide-react'
import useNow from '../hooks/useNow'
import useRecordsSnapshot from '../hooks/useRecordsSnapshot'
import { useActiveEvent } from '../context/ActiveEventContext'
import { useAppData } from '../context/AppDataStore'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { startAttendanceEvent, updateEvent, endAttendanceEvent, cancelRecord, cancelRecordsBulk } from '../utils/dbOps'
import { getScanBuffer, pendingToRecord } from '../utils/scanBuffer'
import { fmtTime, fmtDateTime, toLocalInput, fromLocalInput } from '../utils/format'
import Avatar from '../components/Avatar'
import DataTable from '../components/DataTable'
import SearchSortBar from '../components/SearchSortBar'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

const emptyForm = () => ({
  eventName: '',
  venue: '',
  description: '',
  startAt: toLocalInput(),
  endAt: toLocalInput(new Date(Date.now() + 2 * 3600 * 1000).toISOString()),
})

/** Module-scope helper — `now` comes from useNow() so it updates on the page. */
const isPastEnd = (endAt, now) => Boolean(endAt && now > new Date(endAt).getTime())

export default function StartAttendancePage({ active = true }) {
  const { activeEvent } = useActiveEvent()
  const { admin } = useAuth()
  const { toast, confirm } = useToast()
  const { students, upsertEventLocal, patchEventLocal, upsertSummaryLocal } = useAppData()

  // Cache-first records — NO live listener. Parked devices and tab switches
  // cost ZERO reads; "Sync" pulls scans made on other stations via a ~0-read
  // delta query. Local scans arrive through the shared buffer below.

  const {
    records,
    syncedAt,
    refresh: syncRecords,
  } = useRecordsSnapshot(activeEvent?.eventId || null, Boolean(active && activeEvent))
  const [syncing, setSyncing] = useState(false)
  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    await syncRecords()
    setSyncing(false)
  }

  // Pending scans from the SHARED buffer (still unflushed) merge into the view
  // here — the roster shows a scan the instant it happens with ZERO extra
  // reads. This is the same queue the Scan tab writes to; no cross-tab channel
  // is needed because both tabs live in one persistent SPA shell.
  const buffer = getScanBuffer()
  const [pendingRecs, setPendingRecs] = useState(() =>
    buffer.getPending().map(pendingToRecord),
  )
  useEffect(() => {
    buffer.restorePending() // re-arm the idle flush for scans restored after a reload
    return buffer.subscribe((queue) => setPendingRecs(queue.map(pendingToRecord)))
  }, [buffer])

  /* ---- pre-start form ---- */
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [starting, setStarting] = useState(false)
  const [justEnded, setJustEnded] = useState(null)

  /* ---- roster ---- */
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState({ key: 'fullName', dir: 'asc' })
  const [selected, setSelected] = useState(new Set())
  const [viewRow, setViewRow] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const recMap = useMemo(() => {
    const m = {}
    // Buffered (not yet committed) scans win over the server view — the same
    // precedence the Scan tab uses — so a scan is visible before its write lands.
    pendingRecs.forEach((r) => {
      m[r.studentId] = r
    })
    records.forEach((r) => {
      if (!m[r.studentId]) m[r.studentId] = r
    })
    return m
  }, [records, pendingRecs])

  const rows = useMemo(
    () => students.map((s) => ({ ...s, _record: recMap[s.studentId] || null })),
    [students, recMap],
  )
  const presentCount = rows.filter((r) => r._record?.status === 'present').length
  const lateCount = rows.filter((r) => r._record?.status === 'late').length
  const attendedCount = presentCount + lateCount
  // Past the end time the session stays live (never auto-ends) — scans now mark LATE.
  // useNow keeps this flipping live while the page sits open (no stale badge).
  const nowTick = useNow(30000)
  const pastEnd = isPastEnd(activeEvent?.endAt, nowTick)

  const handleStart = async (e) => {
    e.preventDefault()
    if (!form.eventName.trim()) return toast.warning('Event name required', 'Give this attendance a name.')
    const startAt = fromLocalInput(form.startAt)
    const endAt = fromLocalInput(form.endAt)
    if (!startAt || !endAt) return toast.warning('Dates required', 'Set both the start and end date & time.')
    if (endAt <= startAt) return toast.error('Invalid schedule', 'The end must be after the start.')

    const ok = await confirm({
      title: `Start “${form.eventName.trim()}” now?`,
      message: 'The roster will open and every scan on the Scan tab will mark a student present.',
      confirmLabel: 'Start attendance',
    })
    if (!ok) return

    setStarting(true)
    try {
      const created = await startAttendanceEvent({ ...form, startAt, endAt }, admin)
      upsertEventLocal(created)
      setShowForm(false)
      setForm(emptyForm())
      setJustEnded(null)
      toast.success('Attendance started', `${created.eventName} · ${created.eventId}`)
    } catch (err) {
      toast.error('Could not start attendance', err.message)
    } finally {
      setStarting(false)
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.eventName.trim()) return toast.warning('Event name required', 'The name cannot be empty.')
    const startAt = fromLocalInput(editForm.startAt)
    const endAt = fromLocalInput(editForm.endAt)
    if (!startAt || !endAt || endAt <= startAt)
      return toast.error('Invalid schedule', 'The end must be after the start.')
    try {
      await updateEvent(activeEvent.eventId, {
        eventName: editForm.eventName.trim(),
        venue: editForm.venue.trim(),
        description: editForm.description.trim(),
        startAt,
        endAt,
      })
      patchEventLocal(activeEvent.eventId, {
        eventName: editForm.eventName.trim(),
        venue: editForm.venue.trim(),
        description: editForm.description.trim(),
        startAt,
        endAt,
      })
      setEditOpen(false)
      toast.success('Event updated', 'The attendance details were saved.')
    } catch (err) {
      toast.error('Update failed', err.message)
    }
  }

  const handleEnd = async () => {
    const ok = await confirm({
      title: 'End this attendance?',
      message: `${attendedCount} of ${students.length} students have records (${presentCount} present · ${lateCount} late). Everyone unmarked will be recorded as ABSENT. This cannot be undone.`,
      confirmLabel: 'End attendance',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      const result = await endAttendanceEvent(activeEvent, students)
      patchEventLocal(activeEvent.eventId, result.eventPatch)
      upsertSummaryLocal(result.summary)
      setJustEnded({ event: activeEvent, ...result })
      toast.success(
        'Attendance ended',
        `${result.present} present · ${result.late} late · ${result.markedAbsent} absent`,
      )
    } catch (err) {
      toast.error('Could not end attendance', err.message)
    } finally {
      setBusy(false)
    }
  }

  const cancelOne = async (row) => {
    const ok = await confirm({
      title: 'Cancel this attendance?',
      message: `${row.fullName}'s present mark will be removed and reverted to “—”.`,
      confirmLabel: 'Cancel attendance',
      danger: true,
    })
    if (!ok) return
    try {
      // Drop any still-buffered scan first so a later flush cannot resurrect it.
      buffer.removePending(activeEvent.eventId, row.studentId)
      await cancelRecord(activeEvent.eventId, row.studentId)
      toast.success('Attendance cancelled', `${row.fullName} is no longer marked present.`)
    } catch (err) {
      toast.error('Could not cancel', err.message)
    }
  }

  const bulkCancel = async () => {
    if (busy) return
    const ids = [...selected]
    const ok = await confirm({
      title: `Cancel attendance for ${ids.length} student${ids.length > 1 ? 's' : ''}?`,
      message: 'All selected present marks will be removed.',
      confirmLabel: 'Cancel attendance',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      // Buffered scans for the selected students are dropped first, then the
      // committed records are deleted in ⌈N/400⌉ writeBatch commits (one
      // network round-trip per 400 students instead of N).
      ids.forEach((sid) => buffer.removePending(activeEvent.eventId, sid))
      await cancelRecordsBulk(activeEvent.eventId, ids)
      setSelected(new Set())
      toast.success('Attendance cancelled', `${ids.length} record${ids.length > 1 ? 's' : ''} removed.`)
    } catch (err) {
      toast.error('Could not cancel', err.message)
    } finally {
      setBusy(false)
    }
  }

  const onSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  /* ---------- No active event: landing / start form / ended summary ---------- */
  if (!activeEvent) {
    if (justEnded) {
      return (
        <div className="card end-summary" style={{ maxWidth: 560, margin: '40px auto' }}>
          <CheckCircle2 size={46} style={{ color: 'var(--emerald)' }} />
          <h2>Attendance ended</h2>
          <p className="muted">
            {justEnded.event.eventName} · {justEnded.present} present · {justEnded.late} late ·{' '}
            {justEnded.markedAbsent} absent
          </p>
          <div className="row" style={{ marginTop: 10 }}>
            <Link to={`/attendances/${justEnded.event.id}`} className="btn btn-primary">
              <ClipboardList size={16} /> View full report
            </Link>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(true)}>
              Start a new attendance
            </button>
          </div>
        </div>
      )
    }

    return (
      <>
        {!showForm ? (
          <div className="card start-hero">
            <span className="empty-icon" style={{ width: 72, height: 72 }}>
              <CalendarClock size={34} />
            </span>
            <h2>Ready to take attendance?</h2>
            <p className="muted" style={{ maxWidth: 420 }}>
              Start a session, and every QR scan on the Scan tab will mark students present in real time.
            </p>
            <button type="button" className="btn btn-primary btn-lg" style={{ marginTop: 8 }} onClick={() => setShowForm(true)}>
              <PlayCircle size={19} /> Start Attendance
            </button>
          </div>
        ) : (
          <form className="card card-pad start-form" onSubmit={handleStart}>
            <h3 style={{ marginBottom: 14 }}>New attendance session</h3>
            <div className="form-grid">
              <div className="field">
                <label>Event name *</label>
                <input className="input" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} placeholder="e.g. General Assembly" autoFocus />
              </div>
              <div className="field">
                <label>Venue</label>
                <input className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. CAS Amphitheater" />
              </div>
              <div className="field">
                <label>Start date &amp; time *</label>
                <input type="datetime-local" className="input" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
              </div>
              <div className="field">
                <label>End date &amp; time *</label>
                <input type="datetime-local" className="input" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
              </div>
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label>Description</label>
              <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes about this event…" />
            </div>
            <p className="hint muted" style={{ marginTop: 10, fontSize: 12 }}>
              The Event ID (CAS-YYYY-###) is generated automatically when you press Start.
            </p>
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={starting}>
                {starting && <Loader2 size={15} />} Start Taking Attendance
              </button>
            </div>
          </form>
        )}
      </>
    )
  }

  /* ---------- Active event: live roster ---------- */
  return (
    <>
      <div className="card">
        <div className="roster-toolbar">
          <span className="badge active">Live</span>
          <strong style={{ fontSize: 14 }}>{activeEvent.eventName}</strong>
          <span className="chip mono">{activeEvent.eventId}</span>
          <span className="chip" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderColor: 'transparent' }}>
            {attendedCount} / {students.length} attended
          </span>
          {lateCount > 0 && <span className="badge late">{lateCount} late</span>}
          {pastEnd && <span className="badge late">Past end time · scans marked late</span>}
          <span className="spacer" />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleSync}
            disabled={syncing}
            title={
              syncedAt
                ? `Last synced ${fmtTime(new Date(syncedAt).toISOString())} — click to pull scans made on other stations`
                : 'Fetch scans made on other stations'
            }
          >
            <RefreshCw size={13} className={syncing ? 'spin' : undefined} /> Sync
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditForm({ ...activeEvent, startAt: toLocalInput(activeEvent.startAt), endAt: toLocalInput(activeEvent.endAt) }); setEditOpen(true) }}>
            <Pencil size={14} /> Edit
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={handleEnd} disabled={busy}>
            <StopCircle size={15} /> End Attendance
          </button>
        </div>

        <SearchSortBar
          placeholder="Search students on the roster…"
          value={searchTerm}
          onChange={setSearchTerm}
          sortOptions={[
            { value: 'fullName', label: 'Name' },
            { value: 'status', label: 'Status' },
            { value: '_time', label: 'Time' },
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
              render: (r) => (
                <span className="row">
                  <Avatar name={r.fullName} size={30} />
                  <span>
                    <span className="cell-strong">{r.fullName}</span>
                    <div className="cell-sub mono">{r.studentId}</div>
                  </span>
                </span>
              ),
            },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <StatusBadge
                  status={r._record?.status === 'present' ? 'present' : r._record?.status === 'late' ? 'late' : 'dash'}
                />
              ),
            },
            {
              key: '_time',
              label: 'Time',
              sortable: true,
              sortValue: (r) => r._record?.time || '',
              render: (r) => fmtTime(r._record?.time),
            },
          ]}
          rows={rows}
          rowKey="studentId"
          searchTerm={searchTerm}
          searchKeys={['fullName', 'studentNumber', 'program', 'section', 'studentId']}
          sort={sort}
          onSort={onSort}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          actions={(r) => [
            { label: 'View all details', icon: Eye, onClick: () => setViewRow(r) },
            ...(r._record && (r._record.status === 'present' || r._record.status === 'late')
              ? [{ label: 'Cancel attendance', icon: Ban, danger: true, onClick: () => cancelOne(r) }]
              : []),
          ]}
          empty={
            students.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No students yet" message="Import or add students in the Students tab first." />
            ) : (
              <EmptyState icon={ClipboardList} title="No match" message={`No student matches “${searchTerm}”.`} />
            )
          }
        />
      </div>

      {/* Bulk cancel bar */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="count">{selected.size} selected</span>
          <button type="button" className="btn btn-danger btn-sm" onClick={bulkCancel} disabled={busy}>
            <Ban size={14} /> Cancel attendance
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* View all details */}
      <Modal open={!!viewRow} title="Student details" onClose={() => setViewRow(null)}>
        {viewRow && (
          <>
            <div className="row" style={{ gap: 12 }}>
              <Avatar name={viewRow.fullName} size={48} />
              <div>
                <h3>{viewRow.fullName}</h3>
                <span className="chip primary mono">{viewRow.studentId}</span>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-item"><div className="k">Student number</div><div className="v">{viewRow.studentNumber}</div></div>
              <div className="detail-item"><div className="k">Program</div><div className="v">{viewRow.program}</div></div>
              <div className="detail-item"><div className="k">Year level</div><div className="v">{viewRow.yearLevel}</div></div>
              <div className="detail-item"><div className="k">Section</div><div className="v">{viewRow.section}</div></div>
              <div className="detail-item"><div className="k">Status</div><div className="v"><StatusBadge status={viewRow._record?.status === 'present' ? 'present' : viewRow._record?.status === 'late' ? 'late' : 'dash'} /></div></div>
              <div className="detail-item"><div className="k">Time scanned</div><div className="v">{fmtDateTime(viewRow._record?.time)}</div></div>
              <div className="detail-item"><div className="k">Operator ID</div><div className="v mono">{viewRow._record?.scannedBy || '—'}</div></div>
              <div className="detail-item"><div className="k">Scanned by</div><div className="v">{viewRow._record?.scannedByName || '—'}</div></div>
            </div>
          </>
        )}
      </Modal>

      {/* Edit event modal */}
      <Modal
        open={editOpen}
        title="Edit attendance details"
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
            <button type="submit" form="edit-event-form" className="btn btn-primary">Save changes</button>
          </>
        }
      >
        {editOpen && editForm && (
          <form id="edit-event-form" onSubmit={handleSaveEdit} className="col">
            <div className="field">
              <label>Event name *</label>
              <input className="input" value={editForm.eventName} onChange={(e) => setEditForm({ ...editForm, eventName: e.target.value })} />
            </div>
            <div className="field">
              <label>Venue</label>
              <input className="input" value={editForm.venue || ''} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Start date &amp; time</label>
                <input type="datetime-local" className="input" value={toLocalInput(editForm.startAt)} onChange={(e) => setEditForm({ ...editForm, startAt: e.target.value })} />
              </div>
              <div className="field">
                <label>End date &amp; time</label>
                <input type="datetime-local" className="input" value={toLocalInput(editForm.endAt)} onChange={(e) => setEditForm({ ...editForm, endAt: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="input" value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
          </form>
        )}
      </Modal>


    </>
  )
}

