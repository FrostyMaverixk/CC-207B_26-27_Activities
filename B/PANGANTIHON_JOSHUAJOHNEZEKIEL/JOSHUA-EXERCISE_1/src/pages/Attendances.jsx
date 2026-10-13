import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2, ClipboardList, RotateCcw } from 'lucide-react'
import { query, where } from 'firebase/firestore'
import { collection, getCountFromServer } from '../utils/firestoreGateway'
import { db } from '../firebase'
import { useAppData } from '../context/AppDataStore'
import { useToast } from '../context/ToastContext'
import { deleteEventCascade, updateEvent, reopenAttendanceEvent } from '../utils/dbOps'
import { fmtDate, fmtHM, toLocalInput, fromLocalInput } from '../utils/format'
import DataTable from '../components/DataTable'
import SearchSortBar from '../components/SearchSortBar'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

export default function AttendancesPage() {
  const { toast, confirm } = useToast()
  const navigate = useNavigate()

  // Zero-Waste: the event list comes from the global boot store — switching
  // to this tab fires ZERO Firestore requests.
  const { events, students, booting: loading, removeEventLocal, patchEventLocal, removeSummaryLocal } = useAppData()

  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState({ key: 'startAt', dir: 'desc' })
  const [selected, setSelected] = useState(new Set())
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [busy, setBusy] = useState(false)

  // Old events (ended before denormalized counters existed) — backfill their
  // record total with a COUNT() aggregate (~1 read per event, per 1000 docs).
  const [backfilled, setBackfilled] = useState({})
  const backfillStartedRef = useRef(false)
  useEffect(() => {
    if (backfillStartedRef.current || loading) return undefined
    const todo = events.filter((ev) => typeof ev.recordCount !== 'number')
    if (todo.length === 0) return undefined
    backfillStartedRef.current = true
    ;(async () => {
      const out = {}
      for (const ev of todo) {
        try {
          const snap = await getCountFromServer(
            query(collection(db, 'attendanceRecords'), where('eventId', '==', ev.eventId)),
          )
          out[ev.eventId] = snap.data().count || 0
        } catch (err) {
          console.warn('[attendances] count backfill failed:', err.code || err.message)
        }
      }
      setBackfilled((prev) => ({ ...prev, ...out }))
    })()
    return undefined
  }, [events, loading])

  // Per-event stats come straight off the event docs (denormalized at event
  // end) — the attendanceRecords collection is never read on this tab.
  const rows = useMemo(
    () =>
      events.map((ev) => {
        const recordCount =
          typeof ev.recordCount === 'number' ? ev.recordCount : backfilled[ev.eventId]
        return {
          ...ev,
          recordCount,
          _present: ev.presentCount ?? 0,
          _late: ev.lateCount ?? 0,
          _absent: ev.absentCount ?? 0,
        }
      }),
    [events, backfilled],
  )

  const onSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const handleDelete = async (ev) => {
    const ok = await confirm({
      title: `Delete “${ev.eventName}”?`,
      message: `Event ${ev.eventId} and ALL of its attendance records will be permanently removed.`,
      confirmLabel: 'Delete event',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteEventCascade(ev, students) // roster ids → skips the R-record read
      removeEventLocal(ev.eventId)
      // Drop the deleted event from the selection set so the bulk bar
      // doesn't keep showing a stale count for a row that no longer exists.
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(String(ev.id))
        return next
      })
      toast.success('Event deleted', `${ev.eventName} and its records were removed.`)
    } catch (err) {
      toast.error('Could not delete event', err.message)
    }
  }

  const handleBulkDelete = async () => {
    const picked = rows.filter((r) => selected.has(String(r.id)))
    const ok = await confirm({
      title: `Delete ${picked.length} event${picked.length > 1 ? 's' : ''}?`,
      message: 'Each event and all of its attendance records will be permanently removed.',
      confirmLabel: 'Delete all',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      for (const ev of picked) {
        await deleteEventCascade(ev, students)
        removeEventLocal(ev.eventId)
      }
      setSelected(new Set())
      toast.success('Events deleted', `${picked.length} event${picked.length > 1 ? 's' : ''} removed.`)
    } catch (err) {
      toast.error('Could not delete events', err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleReopen = async (ev) => {
    const ok = await confirm({
      title: `Reopen “${ev.eventName}”?`,
      message:
        'The event becomes active again on the Scan tab. Scans before its end time mark PRESENT, scans after it mark LATE. End it again whenever you are done.',
      confirmLabel: 'Reopen event',
    })
    if (!ok) return
    try {
      await reopenAttendanceEvent(ev.id)
      patchEventLocal(ev.eventId, { status: 'active' })
      removeSummaryLocal(ev.eventId)
      toast.success('Event reopened', `${ev.eventName} is live again — scanning is enabled.`)
    } catch (err) {
      toast.error('Could not reopen event', err.message)
    }
  }

  const openEdit = (ev) => {
    setEditForm({
      id: ev.id,
      eventName: ev.eventName,
      venue: ev.venue || '',
      description: ev.description || '',
      startAt: toLocalInput(ev.startAt),
      endAt: toLocalInput(ev.endAt),
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editForm.eventName.trim()) return toast.warning('Event name required', 'The name cannot be empty.')
    const startAt = fromLocalInput(editForm.startAt)
    const endAt = fromLocalInput(editForm.endAt)
    if (!startAt || !endAt || endAt <= startAt)
      return toast.error('Invalid schedule', 'The end must be after the start.')
    try {
      await updateEvent(editForm.id, {
        eventName: editForm.eventName.trim(),
        venue: editForm.venue.trim(),
        description: editForm.description.trim(),
        startAt,
        endAt,
      })
      patchEventLocal(editForm.id, {
        eventName: editForm.eventName.trim(),
        venue: editForm.venue.trim(),
        description: editForm.description.trim(),
        startAt,
        endAt,
      })
      setEditOpen(false)
      toast.success('Event updated', 'Details were saved successfully.')
    } catch (err) {
      toast.error('Update failed', err.message)
    }
  }

  return (
    <>
      <div className="card">
        <SearchSortBar
          placeholder="Search events by name or ID…"
          value={searchTerm}
          onChange={setSearchTerm}
          sortOptions={[
            { value: 'startAt', label: 'Date' },
            { value: 'eventName', label: 'Event name' },
            { value: 'eventId', label: 'Event ID' },
          ]}
          sortKey={sort.key}
          onSortKeyChange={(k) => setSort({ key: k, dir: k === 'startAt' ? 'desc' : 'asc' })}
          sortDir={sort.dir}
          onToggleDir={() => setSort((s) => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
        />

        <DataTable
          columns={[
            {
              key: 'eventId',
              label: 'Event ID',
              render: (ev) => <span className="chip primary mono">{ev.eventId}</span>,
            },
            {
              key: 'eventName',
              label: 'Event',
              render: (ev) => (
                <>
                  <span className="cell-strong">{ev.eventName}</span>
                  <div className="cell-sub">
                    {[
                      ev.venue,
                      ev.startedByName ? `Started by ${ev.startedByName}` : '',
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </div>
                </>
              ),
            },
            {
              key: 'startAt',
              label: 'Date of event',
              sortValue: (r) => r.startAt,
              render: (ev) => fmtDate(ev.startAt),
            },
            {
              key: 'timeRange',
              label: 'Start – End',
              sortable: false,
              className: 'hide-sm',
              render: (ev) => (
                <span className="nowrap">
                  {fmtHM(ev.startAt)} – {fmtHM(ev.endAt)}
                </span>
              ),
            },
            {
              key: '_present',
              label: 'Attendance',
              className: 'hide-sm',
              sortValue: (r) => r._present + r._late,
              render: (ev) => {
                const attended = ev._present + ev._late
                const total = attended + ev._absent
                const pct = total > 0 ? (attended / total) * 100 : 0
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 74, height: 7, borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', overflow: 'hidden', display: 'inline-block' }}>
                      <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'var(--emerald)' }} />
                    </span>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {attended} attended
                      {ev._late > 0 ? ` · ${ev._late} late` : ''}
                      {ev.status === 'ended' ? ` · ${ev._absent} absent` : ''}
                    </span>
                  </span>
                )
              },
            },
            { key: 'status', label: 'Status', render: (ev) => <StatusBadge status={ev.status} /> },
          ]}
          rows={rows}
          rowKey="id"
          searchTerm={searchTerm}
          searchKeys={['eventName', 'eventId', 'venue', 'startedByName']}
          sort={sort}
          onSort={onSort}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          loading={loading}
          actions={(ev) => [
            { label: 'View attendances', icon: Eye, onClick: () => navigate(`/attendances/${ev.id}`) },
            { label: 'Edit details', icon: Pencil, onClick: () => openEdit(ev) },
            ...(ev.status === 'ended'
              ? [{ label: 'Reopen attendance', icon: RotateCcw, disabled: busy, onClick: () => handleReopen(ev) }]
              : []),
            'divider',
            { label: 'Delete event', icon: Trash2, danger: true, disabled: busy, onClick: () => handleDelete(ev) },
          ]}
          empty={
            <EmptyState
              icon={ClipboardList}
              title="No attendances yet"
              message="Events appear here once you start an attendance in the Start Attendance tab."
            />
          }
        />
      </div>

      {/* Bulk delete bar */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="count">{selected.size} selected</span>
          <button type="button" className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            <Trash2 size={14} /> Delete events
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Edit event modal */}
      <Modal
        open={editOpen}
        title="Edit event details"
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
            <button type="submit" form="edit-event-form-list" className="btn btn-primary">Save changes</button>
          </>
        }
      >
        {editOpen && editForm && (
          <form id="edit-event-form-list" onSubmit={handleSaveEdit} className="col">
            <div className="field">
              <label>Event name *</label>
              <input className="input" value={editForm.eventName} onChange={(e) => setEditForm({ ...editForm, eventName: e.target.value })} />
            </div>
            <div className="field">
              <label>Venue</label>
              <input className="input" value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Start date &amp; time</label>
                <input type="datetime-local" className="input" value={editForm.startAt} onChange={(e) => setEditForm({ ...editForm, startAt: e.target.value })} />
              </div>
              <div className="field">
                <label>End date &amp; time</label>
                <input type="datetime-local" className="input" value={editForm.endAt} onChange={(e) => setEditForm({ ...editForm, endAt: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="input" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
          </form>
        )}
      </Modal>

    </>
  )
}

