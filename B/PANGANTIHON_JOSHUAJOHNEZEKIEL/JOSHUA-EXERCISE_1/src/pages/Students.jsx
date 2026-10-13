import { useMemo, useRef, useState } from 'react'
import {
  Eye,
  Pencil,
  Trash2,
  QrCode,
  Download,
  Upload,
  UserPlus,
  Users,
  Loader2,
  FileSpreadsheet,
  Layers,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { useAppData } from '../context/AppDataStore'
import { useToast } from '../context/ToastContext'
import { createStudent, updateStudent, deleteStudent, importStudents, bulkDeleteStudents, bulkSetStudentYear } from '../utils/dbOps'
import { fmtDateTime } from '../utils/format'
import { downloadCsv, parseCsvFile } from '../utils/csv'
import { downloadStudentQr, buildStudentQrDataUrl } from '../utils/qr'
import Avatar from '../components/Avatar'
import DataTable from '../components/DataTable'
import SearchSortBar from '../components/SearchSortBar'
import Modal from '../components/Modal'
import ExportModal from '../components/ExportModal'
import EmptyState from '../components/EmptyState'

const REQUIRED_CSV_FIELDS = ['studentNumber', 'fullName', 'program', 'yearLevel', 'section']

/**
 * Lifetime attendance stats for one student — computed from the per-event
 * summary docs already in the boot store (ZERO Firestore reads). Each summary
 * carries its event's scans, so the union of `scans` across summaries IS the
 * student's attendance history.
 */
function studentStats(studentId, summaries, events) {
  let present = 0
  let late = 0
  let absent = 0
  const scanTimes = []
  summaries.forEach((s) => {
    ;(s.scans || []).forEach((r) => {
      if (r.studentId !== studentId) return
      if (r.status === 'present') present += 1
      else if (r.status === 'late') late += 1
      if (r.time) scanTimes.push(r.time)
    })
  })
  // Absent = ended events where this student has no scan recorded.
  const scannedEvents = new Set()
  summaries.forEach((s) => {
    ;(s.scans || []).forEach((r) => {
      if (r.studentId === studentId) scannedEvents.add(s.eventId)
    })
  })
  const endedEvents = events.filter((e) => e.status === 'ended')
  endedEvents.forEach((e) => {
    if (!scannedEvents.has(e.eventId)) absent += 1
  })
  const attended = present + late
  const totalEvents = events.length
  const rate = totalEvents > 0 ? Math.round((attended / totalEvents) * 100) : 0
  scanTimes.sort()
  return {
    present,
    late,
    absent,
    attended,
    totalEvents,
    rate,
    firstScan: scanTimes[0] || null,
    lastScan: scanTimes[scanTimes.length - 1] || null,
  }
}

export default function StudentsPage() {
  const { toast, confirm } = useToast()

  // Zero-Waste: roster + operators + events + summaries come from the global
  // boot store — switching to this tab fires ZERO Firestore requests. Even the
  // per-student stats modal is computed from summaries (no records read).
  const { students: storeStudents, admins, events, summaries, booting: loading, upsertDirectoryEntryLocal, removeDirectoryEntriesLocal, refreshDirectory } = useAppData()
  const students = useMemo(
    () => [...storeStudents].sort((a, b) => String(a.studentId).localeCompare(String(b.studentId))),
    [storeStudents],
  )

  const operatorByStudentNumber = useMemo(() => {
    const m = {}
    admins.forEach((a) => {
      if (a.studentNumber) m[String(a.studentNumber)] = a
    })
    return m
  }, [admins])

  /** Students per year level (unknown levels included) for the bulk-year tools. */
  const yearCounts = useMemo(() => {
    const m = {}
    students.forEach((s) => {
      const y = String(s.yearLevel || '?')
      m[y] = (m[y] || 0) + 1
    })
    return m
  }, [students])

  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState({ key: 'fullName', dir: 'asc' })
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)

  /* modals */
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState({ studentNumber: '', fullName: '', program: '', yearLevel: '1', section: '' })
  const [viewRow, setViewRow] = useState(null)
  const [qrRow, setQrRow] = useState(null)
  const [qrUrl, setQrUrl] = useState(null)
  const [qrBusy, setQrBusy] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importPreview, setImportPreview] = useState(null) // {valid, invalid}
  const fileRef = useRef(null)

  /* bulk-by-year tools */
  const [yearToolsOpen, setYearToolsOpen] = useState(false)
  const [yearFrom, setYearFrom] = useState('1')
  const [yearTarget, setYearTarget] = useState('2')

  const onSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  /* ---------- add / edit ---------- */
  const openAdd = () => {
    setEditTarget(null)
    setForm({ studentNumber: '', fullName: '', program: '', yearLevel: '1', section: '' })
    setFormOpen(true)
  }

  const openEdit = (s) => {
    setEditTarget(s)
    setForm({
      studentNumber: s.studentNumber || '',
      fullName: s.fullName || '',
      program: s.program || '',
      yearLevel: s.yearLevel || '1',
      section: s.section || '',
    })
    setFormOpen(true)
  }

  const saveStudent = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.studentNumber.trim() || !form.program.trim() || !form.section.trim())
      return toast.warning('Missing fields', 'Fill out student number, name, program, year level and section.')

    const dup = students.find(
      (s) =>
        String(s.studentNumber).toLowerCase() === form.studentNumber.trim().toLowerCase() &&
        s.id !== editTarget?.id,
    )
    if (dup) return toast.error('Duplicate student number', `${form.studentNumber} already belongs to ${dup.fullName}.`)

    const payload = {
      studentNumber: form.studentNumber.trim(),
      fullName: form.fullName.trim(),
      program: form.program.trim().toUpperCase(),
      yearLevel: form.yearLevel,
      section: form.section.trim().toUpperCase(),
    }

    try {
      if (editTarget) {
        await updateStudent(editTarget.id, payload)
        upsertDirectoryEntryLocal({ studentId: editTarget.id, ...payload })
        toast.success('Student updated', `${payload.fullName}'s details were saved.`)
      } else {
        const newId = await createStudent(payload)
        upsertDirectoryEntryLocal({ studentId: newId, ...payload })
        toast.success('Student added', `${payload.fullName} · ID generated automatically.`)
      }
      setFormOpen(false)
    } catch (err) {
      toast.error('Could not save student', err.message)
    }
  }

  /* ---------- delete / bulk ---------- */
  const removeOne = async (s) => {
    const ok = await confirm({
      title: `Delete ${s.fullName}?`,
      message: `${s.studentId} will be removed from the roster. Past attendance records are kept for history.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteStudent(s.id)
      removeDirectoryEntriesLocal([s.id])
      // Drop the deleted student from the selection so the bulk bar stays accurate.
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(String(s.id))
        return next
      })
      toast.success('Student deleted', `${s.fullName} was removed.`)
    } catch (err) {
      toast.error('Could not delete', err.message)
    }
  }

  const removeBulk = async () => {
    const picked = students.filter((s) => selected.has(String(s.id)))
    const ok = await confirm({
      title: `Delete ${picked.length} student${picked.length > 1 ? 's' : ''}?`,
      message: 'The selected students will be removed from the roster.',
      confirmLabel: 'Delete all',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await Promise.all(picked.map((s) => deleteStudent(s.id)))
      removeDirectoryEntriesLocal(picked.map((s) => s.id))
      setSelected(new Set())
      toast.success('Students deleted', `${picked.length} removed.`)
    } catch (err) {
      toast.error('Could not delete', err.message)
    } finally {
      setBusy(false)
    }
  }

  /* ---------- bulk tools by year level ---------- */
  const yearIds = (y) => students.filter((s) => String(s.yearLevel) === String(y)).map((s) => s.id)

  /** Delete every student of one year level (e.g. a graduating 4th year). */
  const bulkDeleteYear = async () => {
    const ids = yearIds(yearFrom)
    if (!ids.length) return toast.warning('Nothing to delete', `No students are in Year ${yearFrom}.`)
    const ok = await confirm({
      title: `Delete all Year ${yearFrom} students?`,
      message: `${ids.length} student${ids.length === 1 ? '' : 's'} will be removed from the roster (e.g. after graduation). Their past attendance records are kept for history.`,
      confirmLabel: `Delete ${ids.length} student${ids.length === 1 ? '' : 's'}`,
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await bulkDeleteStudents(ids)
      removeDirectoryEntriesLocal(ids)
      setSelected(new Set())
      setYearToolsOpen(false)
      toast.success(
        'Year cleared',
        `${ids.length} Year ${yearFrom} student${ids.length === 1 ? '' : 's'} removed from the roster.`,
      )
    } catch (err) {
      toast.error('Could not delete year', err.message)
    } finally {
      setBusy(false)
    }
  }

  /** Re-year every student of one level — promote, demote, or any target. */
  const bulkMoveYear = async (target) => {
    const to = String(target)
    if (to === String(yearFrom)) return toast.warning('Same year', 'Pick a different target year.')
    const ids = yearIds(yearFrom)
    if (!ids.length) return toast.warning('Nothing to move', `No students are in Year ${yearFrom}.`)
    const ok = await confirm({
      title: `Move ${ids.length} student${ids.length === 1 ? '' : 's'} to Year ${to}?`,
      message: `Every Year ${yearFrom} student's year level becomes Year ${to}. If this was a mistake, just run the opposite move — it works on every year.`,
      confirmLabel: `Move to Year ${to}`,
    })
    if (!ok) return
    setBusy(true)
    try {
      await bulkSetStudentYear(ids, to)
      refreshDirectory()
      setYearToolsOpen(false)
      toast.success(
        'Year updated',
        `${ids.length} student${ids.length === 1 ? '' : 's'} moved from Year ${yearFrom} to Year ${to}.`,
      )
    } catch (err) {
      toast.error('Could not move year', err.message)
    } finally {
      setBusy(false)
    }
  }

  /* ---------- export / import ---------- */
  const [exportOpen, setExportOpen] = useState(false)
  const exportRows = useMemo(
    () =>
      students.map((s) => ({
        studentId: s.studentId,
        studentNumber: s.studentNumber,
        fullName: s.fullName,
        program: s.program,
        yearLevel: s.yearLevel,
        section: s.section,
        createdAt: s.createdAt || '',
      })),
    [students],
  )

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const rows = await parseCsvFile(file)
      const valid = []
      const invalid = []
      // Guard both duplicate sources: numbers already on the roster and
      // numbers repeated inside the CSV itself.
      const existingNumbers = new Set(
        students.map((s) => String(s.studentNumber || '').trim().toLowerCase()),
      )
      const seenInFile = new Set()
      rows.forEach((row, i) => {
        const clean = {}
        REQUIRED_CSV_FIELDS.forEach((f) => {
          clean[f] = String(row[f] ?? '').trim()
        })
        const missing = REQUIRED_CSV_FIELDS.filter((f) => !clean[f])
        const numKey = clean.studentNumber.toLowerCase()
        if (missing.length) invalid.push({ line: i + 2, reason: `Missing: ${missing.join(', ')}` })
        else if (existingNumbers.has(numKey))
          invalid.push({ line: i + 2, reason: `Student number ${clean.studentNumber} already exists on the roster` })
        else if (seenInFile.has(numKey))
          invalid.push({ line: i + 2, reason: `Duplicate student number ${clean.studentNumber} inside this CSV` })
        else {
          seenInFile.add(numKey)
          valid.push({
            studentNumber: clean.studentNumber,
            fullName: clean.fullName,
            program: clean.program.toUpperCase(),
            yearLevel: clean.yearLevel,
            section: clean.section.toUpperCase(),
          })
        }
      })
      setImportPreview({ valid, invalid, total: rows.length })
    } catch (err) {
      toast.error('Could not read file', err.message)
    }
  }

  const commitImport = async () => {
    if (!importPreview?.valid.length) return
    setBusy(true)
    try {
      const count = await importStudents(importPreview.valid)
      setImportOpen(false)
      setImportPreview(null)
      toast.success('Import complete', `${count} students imported with auto-generated IDs.`)
    } catch (err) {
      toast.error('Import failed', err.message)
    } finally {
      setBusy(false)
    }
  }

  const downloadSample = () => {
    downloadCsv('casscan_students_sample.csv', [
      { studentNumber: '2026-00001', fullName: 'Juan Dela Cruz', program: 'BSMATH', yearLevel: '2', section: 'A' },
      { studentNumber: '2026-00002', fullName: 'Maria Santos', program: 'ABPSYCH', yearLevel: '1', section: 'B' },
    ])
    toast.info('Sample downloaded', 'Follow the exact column headers when importing.')
  }

  const openQr = async (s) => {
    setQrRow(s)
    setQrUrl(null)
    setQrBusy(true)
    try {
      const url = await buildStudentQrDataUrl(s)
      setQrUrl(url)
    } catch (err) {
      toast.error('Could not build QR', err.message)
      setQrRow(null)
    } finally {
      setQrBusy(false)
    }
  }

  /* ---------- render ---------- */
  // Lifetime stats come from the summaries already in memory — the modal costs
  // ZERO reads (previously ~1 read per attended event, per modal open).
  const viewedStats = viewRow ? studentStats(viewRow.studentId, summaries, events) : null

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Students</h2>
          <p className="sub">{students.length} enrolled · Student IDs &amp; QR codes are generated automatically</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-outline" onClick={downloadSample}>
            <Download size={15} /> Sample CSV
          </button>
          <button type="button" className="btn btn-outline" onClick={() => { setImportPreview(null); setImportOpen(true) }}>
            <Upload size={15} /> Import CSV
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setExportOpen(true)} disabled={!students.length}>
            <FileSpreadsheet size={15} /> Export
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setYearToolsOpen(true)} disabled={!students.length}>
            <Layers size={15} /> Bulk by year
          </button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <UserPlus size={15} /> Add student
          </button>
        </div>
      </div>

      <div className="card">
        <SearchSortBar
          placeholder="Search by name, program, section, ID…"
          value={searchTerm}
          onChange={setSearchTerm}
          sortOptions={[
            { value: 'fullName', label: 'Name' },
            { value: 'program', label: 'Program' },
            { value: 'yearLevel', label: 'Year level' },
            { value: 'studentId', label: 'Student ID' },
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
              render: (s) => (
                <span className="row">
                  <Avatar name={s.fullName} size={30} />
                  <span>
                    <span className="cell-strong">{s.fullName}</span>
                    <div className="cell-sub mono">{s.studentId}</div>
                  </span>
                </span>
              ),
            },
            {
              key: 'program',
              label: 'Program',
              sortValue: (r) => r.program,
              render: (s) => (
                <>
                  {s.program}
                  <div className="cell-sub">Year {s.yearLevel} · {s.section}</div>
                </>
              ),
            },
            {
              key: '_operator',
              label: 'Operator',
              sortable: false,
              hideSm: true,
              sortValue: (s) => operatorByStudentNumber[String(s.studentNumber)]?.operatorId || '',
              render: (s) => {
                const op = operatorByStudentNumber[String(s.studentNumber)]
                return op ? (
                  <span className={`badge ${op.classification === 'MAYOR' ? 'mayor' : 'cassc'}`}>{op.operatorId}</span>
                ) : (
                  <span className="muted">—</span>
                )
              },
            },
          ]}
          rows={students}
          rowKey="id"
          searchTerm={searchTerm}
          searchKeys={['fullName', 'studentNumber', 'program', 'section', 'studentId']}
          sort={sort}
          onSort={onSort}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          loading={loading}
          actions={(s) => [
            { label: 'View full details', icon: Eye, onClick: () => setViewRow(s) },
            { label: 'Edit', icon: Pencil, onClick: () => openEdit(s) },
            { label: 'Generate & download QR', icon: QrCode, onClick: () => openQr(s) },
            'divider',
            { label: 'Delete', icon: Trash2, danger: true, disabled: busy, onClick: () => removeOne(s) },
          ]}
          empty={
            <EmptyState
              icon={Users}
              title={searchTerm ? 'No match' : 'No students yet'}
              message={searchTerm ? `No student matches “${searchTerm}”.` : 'Add students one by one or import a CSV file.'}
            />
          }
        />
      </div>

      {/* Bulk delete bar */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="count">{selected.size} selected</span>
          <button type="button" className="btn btn-danger btn-sm" onClick={removeBulk}>
            <Trash2 size={14} /> Delete students
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Add / edit modal */}
      <Modal
        open={formOpen}
        title={editTarget ? `Edit — ${editTarget.fullName}` : 'Add student'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button>
            <button type="submit" form="student-form" className="btn btn-primary">
              {editTarget ? 'Save changes' : 'Add student'}
            </button>
          </>
        }
      >
        <form id="student-form" onSubmit={saveStudent} className="col">
          {!editTarget && (
            <p className="hint muted">The Student ID (CAS26-###) is generated automatically on save.</p>
          )}
          <div className="form-grid">
            <div className="field">
              <label>Student number *</label>
              <input className="input" value={form.studentNumber} onChange={(e) => setForm({ ...form, studentNumber: e.target.value })} placeholder="2026-00001" />
            </div>
            <div className="field">
              <label>Full name *</label>
              <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Juan Dela Cruz" />
            </div>
            <div className="field">
              <label>Program *</label>
              <input className="input" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} placeholder="BSMATH" list="programs" />
              <datalist id="programs">
                {['BSMATH', 'ABPSYCH', 'ABENG', 'BAPOLSCI', 'BSBIO'].map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
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
        </form>
      </Modal>

      {/* View full details */}
      <Modal open={!!viewRow} title="Student full details" onClose={() => setViewRow(null)}>
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
              <div className="detail-item"><div className="k">Student ID</div><div className="v mono">{viewRow.studentId}</div></div>
              <div className="detail-item"><div className="k">Student number</div><div className="v">{viewRow.studentNumber}</div></div>
              <div className="detail-item"><div className="k">Program</div><div className="v">{viewRow.program}</div></div>
              <div className="detail-item"><div className="k">Year level</div><div className="v">{viewRow.yearLevel}</div></div>
              <div className="detail-item"><div className="k">Section</div><div className="v">{viewRow.section}</div></div>
              <div className="detail-item">
                <div className="k">Operator</div>
                <div className="v">{operatorByStudentNumber[String(viewRow.studentNumber)]?.operatorId || '—'}</div>
              </div>
              <div className="detail-item"><div className="k">Registered</div><div className="v">{fmtDateTime(viewRow.createdAt)}</div></div>
            </div>

            {viewedStats && (
              <>
                <h4
                  style={{
                    margin: '18px 0 10px', fontSize: 11.5, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)',
                  }}
                >
                  Lifetime attendance
                </h4>
                <div className="detail-grid">
                  <div className="detail-item"><div className="k">Present</div><div className="v">{viewedStats.present}</div></div>
                  <div className="detail-item"><div className="k">Late</div><div className="v">{viewedStats.late}</div></div>
                  <div className="detail-item"><div className="k">Absent</div><div className="v">{viewedStats.absent}</div></div>
                  <div className="detail-item"><div className="k">Attendance rate</div><div className="v">{viewedStats.rate}%</div></div>
                  <div className="detail-item"><div className="k">Attended / events</div><div className="v">{viewedStats.attended} of {viewedStats.totalEvents}</div></div>
                  <div className="detail-item"><div className="k">Earliest scan</div><div className="v">{viewedStats.firstScan ? fmtDateTime(viewedStats.firstScan) : '—'}</div></div>
                  <div className="detail-item"><div className="k">Latest scan</div><div className="v">{viewedStats.lastScan ? fmtDateTime(viewedStats.lastScan) : '—'}</div></div>
                </div>
                <p className="hint muted" style={{ marginTop: 8 }}>
                  Rate = (present + late) ÷ all {viewedStats.totalEvents} attendance event{viewedStats.totalEvents === 1 ? '' : 's'} on record.
                </p>
              </>
            )}
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
        {qrBusy || !qrRow || !qrUrl ? (
          <div className="center" style={{ padding: 40 }}>
            <Loader2 size={26} />
          </div>
        ) : (
          <>
            <div className="qr-preview">
              <img src={qrUrl} alt={`QR code for ${qrRow.fullName}`} />
            </div>
            <p className="hint muted" style={{ textAlign: 'center' }}>
              The QR encodes the Student ID <span className="mono">{qrRow.studentId}</span>; the student&apos;s name is printed below the code.
            </p>
          </>
        )}
      </Modal>

      {/* Bulk tools by year level */}
      <Modal
        open={yearToolsOpen}
        title="Bulk tools by year level"
        onClose={() => setYearToolsOpen(false)}
        maxWidth={540}
      >
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Whole-roster actions for one year level — promote a class, fix a wrong year, or clear a
          graduating batch in one go.
        </p>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', margin: '10px 0 4px' }}>
          {['1', '2', '3', '4', '5', '6'].map((y) => (
            <span key={y} className={`chip ${String(yearFrom) === y ? 'primary' : ''}`}>
              Y{y}: <strong>{yearCounts[y] || 0}</strong>
            </span>
          ))}
          {Object.keys(yearCounts)
            .filter((y) => !['1', '2', '3', '4', '5', '6'].includes(y))
            .map((y) => (
              <span key={y} className="chip">
                Y{y}: <strong>{yearCounts[y]}</strong>
              </span>
            ))}
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Operate on year level</label>
          <select
            className="select"
            value={yearFrom}
            onChange={(e) => {
              setYearFrom(e.target.value)
              setYearTarget(String(Math.min(6, Number(e.target.value) + 1)))
            }}
          >
            {['1', '2', '3', '4', '5', '6'].map((y) => (
              <option key={y} value={y}>
                Year {y} — {yearCounts[y] || 0} student{(yearCounts[y] || 0) === 1 ? '' : 's'}
              </option>
            ))}
          </select>
          <span className="hint">
            {(yearCounts[yearFrom] || 0)} student{(yearCounts[yearFrom] || 0) === 1 ? ' is' : 's are'} in Year {yearFrom} right now — all actions below affect exactly these.
          </span>
        </div>

        <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy || yearFrom === '6' || !(yearCounts[yearFrom] > 0)}
            onClick={() => bulkMoveYear(Number(yearFrom) + 1)}
          >
            <ArrowUp size={14} /> Move all up (→ Year {Math.min(6, Number(yearFrom) + 1)})
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy || yearFrom === '1' || !(yearCounts[yearFrom] > 0)}
            onClick={() => bulkMoveYear(Number(yearFrom) - 1)}
          >
            <ArrowDown size={14} /> Move all down (→ Year {Math.max(1, Number(yearFrom) - 1)})
          </button>
        </div>

        <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
          <span className="muted" style={{ fontSize: 12.5 }}>…or set Year {yearFrom} directly to:</span>
          <select
            className="select mini"
            style={{ width: 110 }}
            value={yearTarget}
            onChange={(e) => setYearTarget(e.target.value)}
          >
            {['1', '2', '3', '4', '5', '6'].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy || String(yearTarget) === String(yearFrom) || !(yearCounts[yearFrom] > 0)}
            onClick={() => bulkMoveYear(yearTarget)}
          >
            Apply
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0 12px' }} />

        <button
          type="button"
          className="btn btn-danger"
          disabled={busy || !(yearCounts[yearFrom] > 0)}
          onClick={bulkDeleteYear}
        >
          <Trash2 size={14} /> Delete all {yearCounts[yearFrom] || 0} Year {yearFrom} student{(yearCounts[yearFrom] || 0) === 1 ? '' : 's'}
        </button>
        <p className="hint muted" style={{ marginTop: 8 }}>
          Graduation cleanup removes only the roster profiles — their past attendance records are
          kept for history and reports. All bulk actions are batched (400 writes per batch).
        </p>
      </Modal>

      {/* Export dialog (Excel vs Google Sheets flavours) */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        filename="casscan_students.csv"
        rows={exportRows}
        title="Export students"
      />

      {/* Import modal */}
      <Modal
        open={importOpen}
        title="Import students from CSV"
        onClose={() => setImportOpen(false)}
        footer={
          importPreview ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setImportPreview(null)}>Choose another file</button>
              <button type="button" className="btn btn-primary" disabled={!importPreview.valid.length || busy} onClick={commitImport}>
                {busy && <Loader2 size={15} />} Import {importPreview.valid.length} student{importPreview.valid.length === 1 ? '' : 's'}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}>Select CSV file</button>
          )
        }
      >
        {!importPreview ? (
          <>
            <p className="muted" style={{ fontSize: 13 }}>
              The CSV must contain exactly these headers (order-insensitive):
            </p>
            <div className="detail-grid">
              {REQUIRED_CSV_FIELDS.map((f) => (
                <div key={f} className="detail-item"><div className="k">Column</div><div className="v mono">{f}</div></div>
              ))}
            </div>
            <p className="hint muted">
              Student IDs are generated automatically — do not include an ID column. Works with
              Excel and Google Sheets exports (From Sheets: File → Download → Comma Separated
              Values (.csv)). Delimiters and encoding are auto-detected.
            </p>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" style={{ display: 'none' }} onChange={handleImportFile} />
          </>
        ) : (
          <>
            <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
              <span className="badge present">{importPreview.valid.length} valid</span>
              <span className="badge absent">{importPreview.invalid.length} invalid</span>
            </div>
            {importPreview.invalid.length > 0 && (
              <div className="detail-grid" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {importPreview.invalid.slice(0, 20).map((bad) => (
                  <div key={`${bad.line}-${bad.reason}`} className="detail-item">
                    <div className="k">Line {bad.line}</div>
                    <div className="v" style={{ color: 'var(--rose)' }}>{bad.reason}</div>
                  </div>
                ))}
              </div>
            )}
            {importPreview.valid.length > 0 && (
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                <table className="data-table" style={{ minWidth: 0 }}>
                  <thead>
                    <tr>{REQUIRED_CSV_FIELDS.map((f) => (<th key={f}>{f}</th>))}</tr>
                  </thead>
                  <tbody>
                    {importPreview.valid.slice(0, 25).map((r, i) => (
                      <tr key={i}>
                        <td>{r.studentNumber}</td><td>{r.fullName}</td><td>{r.program}</td><td>{r.yearLevel}</td><td>{r.section}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Modal>


    </>
  )
}