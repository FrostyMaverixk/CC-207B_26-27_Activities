import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  Eye,
  FileSpreadsheet,
  Pencil,
  RefreshCw,
  ScanLine,
  Users,
  UserCheck,
  UserX,
  Percent,
  RotateCcw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { deleteDoc, doc, setDoc } from '../utils/firestoreGateway'
import { db } from '../firebase'
import useRecordsSnapshot from '../hooks/useRecordsSnapshot'
import { putSnapshot, removeFromSnapshot } from '../utils/recordsStore'
import { useAppData } from '../context/AppDataStore'
import { useToast } from '../context/ToastContext'
import { reopenAttendanceEvent, recomputeAttendanceStats } from '../utils/dbOps'
import { fmtDate, fmtDateTime, fmtHM, fmtTime, toLocalInput } from '../utils/format'
import { activeBarFor, CURSOR_BAND, CURSOR_LINE } from '../utils/chartTheme'
import ExportModal from '../components/ExportModal'
import Avatar from '../components/Avatar'
import DataTable from '../components/DataTable'
import SearchSortBar from '../components/SearchSortBar'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

export default function EventAttendanceDetailPage() {
  const { eventId } = useParams()
  const { toast, confirm } = useToast()

  // ZERO reads per open: the event doc already lives in the global boot store
  // (fetched once at login + kept live by the AppDataStore listeners), so the
  // detail page reuses it instead of re-reading it from Firestore — the old
  // useFirestoreQuery(doc…) billed 1 read every time an operator opened this
  // page (per 60s cache TTL).
  const { students, events: allEvents, booting: eventLoading } = useAppData()
  const event = useMemo(
    () => allEvents.find((e) => e.id === eventId || e.eventId === eventId) || null,
    [allEvents, eventId],
  )

  // Cache-first records: the first open of an event does ONE fetch, every
  // later open/reload paints from the cache with ZERO reads (this was ~1,000
  // reads per open before). "Refresh" pulls a ~0-read delta of scans made on
  // other stations since the last sync.
  const { records, refresh: syncRecords } = useRecordsSnapshot(eventId, true)
  const [syncing, setSyncing] = useState(false)
  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    await syncRecords()
    setSyncing(false)
  }
  // Roster comes from the same boot store — ZERO roster reads on this page
  // instead of a full students-collection scan.

  const recMap = useMemo(() => {
    const m = {}
    records.forEach((r) => {
      m[r.studentId] = r
    })
    return m
  }, [records])

  const rows = useMemo(() => students.map((s) => ({ ...s, _record: recMap[s.studentId] || null })), [students, recMap])

  const presentRows = rows.filter((r) => r._record?.status === 'present')
  const lateRows = rows.filter((r) => r._record?.status === 'late')
  const attendedCount = presentRows.length + lateRows.length
  // Absence is DERIVED (roster minus attended) — absent records are no longer
  // persisted, so this holds for both active and ended events.
  const absentCount = rows.length - attendedCount
  const rate = students.length > 0 ? Math.round((attendedCount / students.length) * 100) : 0

  /* ---- chart data ---- */
  const programData = useMemo(() => {
    const map = {}
    rows.forEach((r) => {
      const key = r.program || 'Unknown'
      map[key] = map[key] || { program: key, Present: 0, Late: 0, Absent: 0 }
      if (r._record?.status === 'present') map[key].Present += 1
      else if (r._record?.status === 'late') map[key].Late += 1
      else map[key].Absent += 1
    })
    return Object.values(map).sort((a, b) => b.Present + b.Late - (a.Present + a.Late))
  }, [rows])

  const yearData = useMemo(() => {
    const map = {}
    rows.forEach((r) => {
      const key = `Y${r.yearLevel || '?'}`
      map[key] = map[key] || { year: key, Present: 0, Late: 0, Absent: 0 }
      if (r._record?.status === 'present') map[key].Present += 1
      else if (r._record?.status === 'late') map[key].Late += 1
      else map[key].Absent += 1
    })
    return Object.values(map).sort((a, b) => a.year.localeCompare(b.year))
  }, [rows])

  const timelineData = useMemo(() => {
    // Check-in timeline counts every scan with a time (present + late).
    const scans = rows
      .filter((r) => (r._record?.status === 'present' || r._record?.status === 'late') && r._record.time)
      .sort((a, b) => (a._record.time > b._record.time ? 1 : -1))
    return scans.map((r, i) => ({ time: fmtHM(r._record.time), Scans: i + 1 }))
  }, [rows])

  /* ---- table state ---- */
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState({ key: 'fullName', dir: 'asc' })
  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const onSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  /* CSV export rows (built here so the export dialog stays in sync with the table). */
  const exportRows = useMemo(
    () =>
      rows.map((r) => ({
        eventId: event?.eventId || '',
        eventName: event?.eventName || '',
        studentId: r.studentId,
        studentNumber: r.studentNumber,
        fullName: r.fullName,
        program: r.program,
        yearLevel: r.yearLevel,
        section: r.section,
        status:
          r._record?.status === 'present'
            ? 'Present'
            : r._record?.status === 'late'
              ? 'Late'
              : event?.status === 'ended'
                ? 'Absent'
                : '-',
        time: r._record?.time ? fmtTime(r._record.time) : '',
        operatorId: r._record?.scannedBy || '',
      })),
    [rows, event],
  )
  const [exportOpen, setExportOpen] = useState(false)

  const openEdit = (row) => {
    setEditRow(row)
    setEditForm({
      status:
        row._record?.status === 'present'
          ? 'present'
          : row._record?.status === 'late'
            ? 'late'
            : event.status === 'ended'
              ? 'absent'
              : 'dash',
      // No recorded time yet → keep the field empty instead of defaulting to "now".
      time: row._record?.time ? toLocalInput(row._record.time) : '',
    })
  }

  const handleReopen = async () => {
    const ok = await confirm({
      title: `Reopen “${event.eventName}”?`,
      message:
        'The event becomes active again on the Scan tab. Scans before its end time mark PRESENT, scans after it mark LATE. Absent students can simply be scanned to update their record.',
      confirmLabel: 'Reopen event',
    })
    if (!ok) return
    try {
      await reopenAttendanceEvent(event.id)
      // Recompute the denormalized counters after reopening so the Attendances
      // list / Overview never show stale ended-era figures.
      await recomputeAttendanceStats(event, records, students.length)
      toast.success('Event reopened', `${event.eventName} is live again — scanning is enabled.`)
    } catch (err) {
      toast.error('Could not reopen event', err.message)
    }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    try {
      const ref = doc(db, 'attendanceRecords', `${eventId}__${editRow.studentId}`)
      let nextRecords
      if (editForm.status === 'dash' || editForm.status === 'absent') {
        // Absence is DERIVED (roster minus recorded) — removing the record is
        // how "absent" is represented now; no absent doc is stored.
        await deleteDoc(ref)
        removeFromSnapshot(eventId, [editRow.studentId]) // keep the cache coherent — no re-read
        nextRecords = records.filter((r) => r.studentId !== editRow.studentId)
      } else {
        const payload = {
          eventId,
          studentId: editRow.studentId,
          studentNumber: editRow.studentNumber || '',
          fullName: editRow.fullName,
          program: editRow.program || '',
          yearLevel: editRow.yearLevel || '',
          section: editRow.section || '',
          status: editForm.status,
          time: editForm.time ? new Date(editForm.time).toISOString() : null,
          scannedBy: editRow._record?.scannedBy || '',
          scannedByName: editRow._record?.scannedByName || '',
          updatedAt: new Date().toISOString(),
        }
        await setDoc(ref, payload, { merge: true })
        putSnapshot(eventId, [{ id: `${eventId}__${editRow.studentId}`, ...payload }])
        const idx = records.findIndex((r) => r.studentId === editRow.studentId)
        nextRecords = [...records]
        if (idx === -1) nextRecords.push({ ...payload })
        else nextRecords[idx] = { ...nextRecords[idx], ...payload }
      }
      // Keep the denormalized event + summary docs in sync with the edit so the
      // Attendances list and Overview never drift.
      await recomputeAttendanceStats(event, nextRecords, students.length)
      setEditRow(null)
      toast.success('Record updated', `${editRow.fullName}'s attendance was saved.`)
    } catch (err) {
      toast.error('Could not update record', err.message)
    }
  }

  if (eventLoading) {
    return <div className="card"><EmptyState title="Loading event…" /></div>
  }

  if (!event) {
    return (
      <div className="card">
        <EmptyState
          icon={ScanLine}
          title="Event not found"
          message="This attendance event may have been deleted."
          action={<Link className="btn btn-primary" to="/attendances" style={{ marginTop: 8 }}>Back to Attendances</Link>}
        />
      </div>
    )
  }

  return (
    <>
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <Link to="/attendances" className="row muted" style={{ gap: 4, fontSize: 12.5, fontWeight: 600 }}>
            <ChevronLeft size={15} /> All attendances
          </Link>
          <h2 style={{ marginTop: 6 }}>{event.eventName}</h2>
          <p className="sub row" style={{ flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            <StatusBadge status={event.status} />
            <span className="chip mono">{event.eventId}</span>
            {event.venue && <span className="chip">{event.venue}</span>}
            <span className="chip">{fmtDate(event.startAt)} · {fmtHM(event.startAt)} – {fmtHM(event.endAt)}</span>
          </p>
        </div>
        <div className="actions">
          {event.status === 'active' && (
            <Link to="/scan" className="btn btn-outline">
              <ScanLine size={15} /> Open Scanner
            </Link>
          )}
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleSync}
            disabled={syncing}
            title="Pull scans made on other stations (delta sync, ~0 reads)"
          >
            <RefreshCw size={15} className={syncing ? 'spin' : undefined} /> Refresh
          </button>
          {event.status === 'ended' && (
            <button type="button" className="btn btn-outline" onClick={handleReopen}>
              <RotateCcw size={15} /> Reopen
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => setExportOpen(true)}>
            <FileSpreadsheet size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 14 }}>
        <StatCard icon={Users} accent="indigo" label="Total Enrolled" value={students.length} sub={`${rows.length} on roster`} />
        <StatCard icon={UserCheck} accent="emerald" label="Attended" value={attendedCount} sub={`${presentRows.length} present · ${lateRows.length} late`} />
        <StatCard icon={UserX} accent="rose" label={event.status === 'ended' ? 'Absent' : 'Not yet in'} value={absentCount} />
        <StatCard icon={Percent} accent="amber" label="Attendance rate" value={`${rate}%`} sub={`${attendedCount}/${students.length} students`} />
      </div>

      {/* Charts */}
      <div className="charts-grid" style={{ marginBottom: 18 }}>
        <div className="card chart-box">
          <div className="card-title">Present · Late · Absent by program</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="program" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }} cursor={CURSOR_BAND} />
                <Legend />
                <Bar dataKey="Present" fill="#10b981" radius={[5, 5, 0, 0]} activeBar={activeBarFor('#10b981', [5, 5, 0, 0])} />
                <Bar dataKey="Late" fill="#f59e0b" radius={[5, 5, 0, 0]} activeBar={activeBarFor('#f59e0b', [5, 5, 0, 0])} />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[5, 5, 0, 0]} activeBar={activeBarFor('#f43f5e', [5, 5, 0, 0])} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-box">
          <div className="card-title">Check-in timeline</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="tlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10.5, fill: 'var(--muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }} cursor={CURSOR_LINE} />
                <Area type="monotone" dataKey="Scans" stroke="#4f46e5" strokeWidth={2.2} fill="url(#tlFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-note">Cumulative scans over the course of the event.</div>
        </div>

        <div className="card chart-box">
          <div className="card-title">Attendance by year level</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis type="category" dataKey="year" width={44} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }} cursor={CURSOR_BAND} />
                <Legend />
                <Bar dataKey="Present" fill="#0ea5e9" radius={[0, 5, 5, 0]} activeBar={activeBarFor('#0ea5e9', [0, 5, 5, 0])} />
                <Bar dataKey="Late" fill="#f59e0b" radius={[0, 5, 5, 0]} activeBar={activeBarFor('#f59e0b', [0, 5, 5, 0])} />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[0, 5, 5, 0]} activeBar={activeBarFor('#f43f5e', [0, 5, 5, 0])} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Records table */}
      <div className="card">
        <SearchSortBar
          placeholder="Search students…"
          value={searchTerm}
          onChange={setSearchTerm}
          sortOptions={[
            { value: 'fullName', label: 'Name' },
            { value: '_status', label: 'Status' },
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
              key: '_status',
              label: 'Status',
              sortValue: (r) => (r._record?.status === 'present' ? 0 : r._record?.status === 'late' ? 1 : 2),
              render: (r) =>
                r._record?.status === 'present' ? (
                  <StatusBadge status="present" />
                ) : r._record?.status === 'late' ? (
                  <StatusBadge status="late" />
                ) : event.status === 'ended' ? (
                  <StatusBadge status="absent" />
                ) : (
                  <StatusBadge status="dash" />
                ),
            },
            {
              key: '_time',
              label: 'Time',
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
          actions={(r) => [
            { label: 'View all details', icon: Eye, onClick: () => setViewRow(r) },
            { label: 'Edit details', icon: Pencil, onClick: () => openEdit(r) },
          ]}
          empty={<EmptyState icon={Users} title="No students on the roster" message="Add students in the Students tab to include them here." />}
        />
      </div>

      {/* View details modal */}
      <Modal open={!!viewRow} title="Attendance record" onClose={() => setViewRow(null)}>
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
              <div className="detail-item"><div className="k">Year &amp; section</div><div className="v">Y{viewRow.yearLevel} · {viewRow.section}</div></div>
              <div className="detail-item"><div className="k">Status</div><div className="v">{viewRow._record?.status === 'present' ? 'Present' : viewRow._record?.status === 'late' ? 'Late' : event.status === 'ended' ? 'Absent' : '—'}</div></div>
              <div className="detail-item"><div className="k">Time scanned</div><div className="v">{fmtDateTime(viewRow._record?.time)}</div></div>
              <div className="detail-item"><div className="k">Operator</div><div className="v mono">{viewRow._record?.scannedBy || '—'}</div></div>
            </div>
          </>
        )}
      </Modal>

      {/* Edit record modal */}
      <Modal
        open={!!editRow}
        title={`Edit attendance — ${editRow?.fullName || ''}`}
        onClose={() => setEditRow(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditRow(null)}>Cancel</button>
            <button type="submit" form="edit-record-form" className="btn btn-primary">Save changes</button>
          </>
        }
      >
        {editForm && (
          <form id="edit-record-form" onSubmit={handleSaveEdit} className="col">
            <div className="field">
              <label>Status</label>
              <select className="select" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="present">Present</option>
                <option value="late">Late</option>
                {event.status === 'ended' ? (
                  <option value="absent">Absent</option>
                ) : (
                  <option value="dash">— (no record)</option>
                )}
              </select>
            </div>
            <div className="field">
              <label>Time scanned</label>
              <input type="datetime-local" className="input" value={editForm.time} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} disabled={editForm.status === 'dash'} />
              <span className="hint">Adjust only if the recorded time needs correcting.</span>
            </div>
          </form>
        )}
      </Modal>

      {/* Export dialog (Excel vs Google Sheets flavours) */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        filename={`casscan_${event?.eventId || 'event'}_attendance.csv`}
        rows={exportRows}
        title="Export attendance"
      />

    </>
  )
}

