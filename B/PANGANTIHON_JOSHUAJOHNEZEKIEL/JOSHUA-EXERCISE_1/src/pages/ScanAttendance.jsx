import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import {
  QrCode,
  CalendarClock,
  Keyboard,
  BadgeCheck,
  Clock3,
  ScanLine,
  UserCheck,
  RefreshCw,
} from 'lucide-react'
import useNow from '../hooks/useNow'
import useRecordsSnapshot from '../hooks/useRecordsSnapshot'
import { scanStatusFor } from '../utils/attendanceLogic'
import { getScanBuffer, pendingToRecord } from '../utils/scanBuffer'
import { useActiveEvent } from '../context/ActiveEventContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAppData, entryToStudent } from '../context/AppDataStore'
import { parseQrPayload } from '../utils/qr'
import { playSound } from '../utils/sounds'
import { fmtHM, fmtTime } from '../utils/format'
import Avatar from '../components/Avatar'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'

const RECENT_MS = 2 * 60 * 1000 // "Recently scanned" after 2 idle minutes
const DUP_SUPPRESS_MS = 8 * 1000 // keep a resolved code quiet while it stays in view

/** Module-scope helper — `now` comes from useNow() so it updates on the page. */
const isPastEnd = (endAt, now) => Boolean(endAt && now > new Date(endAt).getTime())

export default function ScanAttendancePage({ active = true }) {
  const { activeEvent, loading: eventLoading, reconnecting: eventReconnecting } = useActiveEvent()
  const { admin } = useAuth()
  const { toast } = useToast()
  const { byId, byNum, byQr } = useAppData()

  // Cache-first records — NO live listener. A device parked on this tab costs
  // ZERO reads and tab switching never re-reads the event. "Sync" pulls scans
  // made on OTHER stations via a ~0-read delta query (one full fetch when the
  // (eventId,time) index is missing). Local scans arrive via the buffer below.
  const {
    records,
    syncedAt,
    refresh: syncRecords,
  } = useRecordsSnapshot(activeEvent?.eventId || null, Boolean(active && activeEvent))

  /* ---- Shared scan buffer singleton: 0-read logging, batched writes ----
   *  The SAME queue instance backs the Start Attendance tab's pending view and
   *  the end-event integrity flush — see utils/scanBuffer.js. */
  const buffer = getScanBuffer()
  const [pendingRecs, setPendingRecs] = useState(() =>
    buffer.getPending().map(pendingToRecord),
  )
  useEffect(() => {
    buffer.restorePending()
    // The subscription delivers full pending snapshots — map once, set once.
    return buffer.subscribe((queue) => setPendingRecs(queue.map(pendingToRecord)))
  }, [buffer])

  // Un-flushed buffered scans count immediately for dup-checks and the UI.
  const effectiveRecords = useMemo(() => {
    if (pendingRecs.length === 0) return records
    const map = new Map(records.map((r) => [r.studentId, r]))
    pendingRecs.forEach((p) => {
      if (!map.has(p.studentId)) map.set(p.studentId, p)
    })
    return [...map.values()]
  }, [records, pendingRecs])
  const pendingCount = pendingRecs.length

  const nowTick = useNow(30000) // refresh "past end time" while the page sits open
  const pastEnd = isPastEnd(activeEvent?.endAt, nowTick)

  const [camError, setCamError] = useState(null)
  const [lastScan, setLastScan] = useState(null) // { student, at, scanTime, duplicate, status }
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [manualId, setManualId] = useState('')
  const [syncing, setSyncing] = useState(false)
  const handleSync = async () => {
    if (syncing) return
    setSyncing(true)
    await syncRecords()
    setSyncing(false)
  }
  const handlerRef = useRef(() => {})
  const lastTextRef = useRef({ text: '', at: 0 })

  /** Core scan pipeline — used by the camera and by manual entry.
   *  ZERO reads: identity comes from the QR payload / directory maps, and the
   *  write goes into the in-memory buffer (flushed via writeBatch). */
  const handleScan = (rawText) => {
    const parsed = parseQrPayload(rawText)
    const text = parsed.id
    if (!text) return

    // Ignore rapid duplicate reads of the same code — 1.2s for unresolved
    // codes (quick retry), 8s once resolved so a card held in front of the
    // camera cannot spam warning toasts.
    const now = Date.now()
    const cooldown = lastTextRef.current.suppress || 1200
    if (lastTextRef.current.text === text && now - lastTextRef.current.at < cooldown) return
    lastTextRef.current = { text, at: now }

    if (!activeEvent) {
      playSound('warning')
      // During boot (or while the active-event listener reconnects) the event
      // may not be resolved yet — do NOT tell the operator attendance is off,
      // or a reload mid-event turns into "failed" submissions.
      if (eventLoading || eventReconnecting) {
        toast.warning('Still connecting…', 'Restoring the active session — try that scan again in a moment.')
      } else {
        toast.warning('No active attendance', 'Start an attendance session before scanning.')
      }
      return
    }

    const entry = byId[text] || byNum[text] || byQr[text]
    if (!entry) {
      playSound('error')
      toast.error('Unknown QR code', `${text} is not a registered Student ID.`)
      return
    }
    const student = entryToStudent(entry)

    const existing = effectiveRecords.find(
      (r) => r.studentId === student.studentId && (r.status === 'present' || r.status === 'late'),
    )
    if (existing) {
      // This code is fully resolved — silence it while it stays in view.
      lastTextRef.current = { text, at: Date.now(), suppress: DUP_SUPPRESS_MS }
      playSound('warning')
      toast.warning(
        'Already scanned',
        `${student.fullName} was marked ${existing.status === 'late' ? 'LATE' : 'present'} at ${fmtTime(existing.time)}.`,
      )
      setLastScan({ student, at: now, scanTime: existing.time, status: existing.status, duplicate: true })
      return
    }

    // Write-only check-in (0 reads): the status is computed locally from the
    // session's end time; the write lands in the shared buffer and reaches
    // Firestore later in a batch of up to 100 scans.
    const time = new Date().toISOString()
    buffer.push({ student, event: activeEvent, admin, time })
    const status = scanStatusFor(activeEvent, time)
    lastTextRef.current = { text, at: Date.now(), suppress: DUP_SUPPRESS_MS }
    if (status === 'late') {
      playSound('warning')
      toast.warning('Marked LATE', `${student.fullName} · scanned after the end time`)
    } else {
      playSound('success')
      toast.success('Attendance recorded', `${student.fullName} · ${new Date().toLocaleTimeString()}`)
    }
    setLastScan({ student, at: now, scanTime: time, status, duplicate: false })
  }
  // Keep the latest scan pipeline available to the camera callback without
  // re-subscribing the scanner on every render (never write refs during render).
  useEffect(() => {
    handlerRef.current = handleScan
  })

  /* Camera lifecycle — only mounts while an event is live (#qr-region exists). */
  const [camEpoch, setCamEpoch] = useState(0)
  useEffect(() => {
    if (!activeEvent?.eventId || !active) return undefined // hidden tab / no session → camera OFF
    let scanner
    let cancelled = false
    const start = async () => {
      setCamError(null) // a restart must clear any previous failure
      try {
        // Let React commit the #qr-region div first — it is unmounted while a
        // camera error is shown, and the constructor needs it in the DOM.
        await new Promise((resolve) => setTimeout(resolve, 50))
        if (cancelled) return
        scanner = new Html5Qrcode('qr-region')
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => handlerRef.current(decoded),
          () => {}, // per-frame decode misses — ignore
        )
        if (cancelled) {
          await scanner.stop().catch(() => {})
          scanner.clear()
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) setCamError(err?.message || 'Camera could not be started.')
      }
    }
    start()
    return () => {
      cancelled = true
      if (scanner) {
        scanner.stop().then(() => scanner.clear()).catch(() => {})
      }
    }
  }, [activeEvent?.eventId, camEpoch, active])

  /* 2-minute countdown → "Recently scanned" */
  useEffect(() => {
    if (!lastScan) return undefined
    const tick = () => {
      const elapsed = Date.now() - lastScan.at
      setSecondsLeft(Math.max(0, Math.ceil((RECENT_MS - elapsed) / 1000)))
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [lastScan])

  const expired = lastScan ? secondsLeft <= 0 : false
  // Past the scheduled end time the session is still LIVE (it never auto-ends)
  // but scans are flagged LATE instead of present.

  if (!activeEvent) {
    // Boot / reconnect window — the live active-event listener hasn't delivered
    // yet (or is retrying after a hiccup). Show a neutral restoring state, so
    // a reload during a live event never looks like data loss.
    if (eventLoading || eventReconnecting) {
      return (
        <div className="card">
          <EmptyState
            icon={CalendarClock}
            title="Restoring session…"
            message="Checking for an active attendance — scanning resumes automatically in a moment."
          />
        </div>
      )
    }
    return (
      <div className="card">
        <EmptyState
          icon={CalendarClock}
          title="No attendance is running"
          message="Head over to the Start Attendance tab to open a session. Scanning is disabled until then."
          action={
            <Link to="/start-attendance" className="btn btn-primary" style={{ marginTop: 8 }}>
              <CalendarClock size={16} /> Start Attendance
            </Link>
          }
        />
      </div>
    )
  }

  const recentScans = [...effectiveRecords]
    .filter((r) => (r.status === 'present' || r.status === 'late') && r.time)
    .sort((a, b) => (b.time > a.time ? 1 : -1))
    .slice(0, 6)

  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Scan student QR</h2>
          <p className="sub row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className="live-dot" /> Now scanning: <strong>{activeEvent.eventName}</strong>
            <span className="chip mono">{activeEvent.eventId}</span>
            {pastEnd && <span className="badge late">Past end time — scans are marked LATE</span>}
            {pendingCount > 0 && <span className="chip">{pendingCount} buffered writes</span>}
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
          </p>
        </div>
      </div>

      <div className="scan-grid">
        {/* Camera */}
        <div className="card scanner-box">
          <div className="card-title">
            <ScanLine size={17} /> CAS Station Camera
          </div>
          {camError ? (
            <div className="cam-error">
              <QrCode size={40} />
              <strong>Camera unavailable</strong>
              <span>{camError}</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setCamError(null)
                  setCamEpoch((n) => n + 1) // remount the scanner without a page reload
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div id="qr-region" />
          )}
          <form
            className="manual-entry"
            onSubmit={(e) => {
              e.preventDefault()
              handleScan(manualId)
              setManualId('')
            }}
          >
            <input
              className="input"
              placeholder="…or type Student ID manually (e.g. CAS26-001)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
            />
            <button type="submit" className="btn btn-outline" title="Look up manually">
              <Keyboard size={16} /> Enter
            </button>
          </form>
        </div>

        {/* Result panel */}
        <div className="card scan-result">
          {!lastScan ? (
            <div className="scan-idle">
              <QrCode size={64} />
              <h3>Waiting for a scan…</h3>
              <p>Ask the student to show their CASScan QR code.</p>
            </div>
          ) : (
            <div className={`scan-student ${expired ? 'expired' : ''}`}>
              <div className="scan-head">
                <Avatar name={lastScan.student.fullName} size={56} />
                <div style={{ minWidth: 0 }}>
                  <div className="scan-name">{lastScan.student.fullName}</div>
                  <div className="scan-chips">
                    <span className="chip primary mono">{lastScan.student.studentId}</span>
                    <span className="chip">{lastScan.student.studentNumber}</span>
                    <span className="chip">
                      {lastScan.student.program} · Y{lastScan.student.yearLevel} · {lastScan.student.section}
                    </span>
                  </div>
                </div>
                <div className="timer-ring" style={{ '--pct': expired ? 0 : (secondsLeft / 120) * 100 }}>
                  <span className="inner">{expired ? <Clock3 size={18} /> : mmss}</span>
                </div>
              </div>

              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                <StatusBadge
                  status={expired ? 'recent' : lastScan.status === 'late' ? 'late' : 'present'}
                  label={
                    expired
                      ? 'Recently scanned'
                      : `${lastScan.status === 'late' ? 'Late' : 'Present'} · ${fmtHM(lastScan.scanTime)}`
                  }
                />
                {lastScan.duplicate && <span className="badge absent">Already in roster</span>}
              </div>

              <div className="verify-note">
                <BadgeCheck size={16} />
                Verify identity — confirm the Student ID above matches the student&apos;s physical ID.
              </div>

              <p className="muted" style={{ fontSize: 12 }}>
                Operator: <span className="mono">{admin?.operatorId}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      {recentScans.length > 0 && (
        <div className="card card-pad" style={{ marginTop: 16 }}>
          <div className="card-title">
            <UserCheck size={17} /> Latest scans this event
          </div>
          <div className="recent-list">
            {recentScans.map((r) => (
              <div key={r.id} className="recent-item">
                <Avatar name={r.fullName} size={30} />
                <div className="r-main">
                  <div className="r-name">{r.fullName}</div>
                  <div className="r-sub">by {r.scannedByName || r.scannedBy}</div>
                </div>
                <span className="chip mono">{fmtTime(r.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

