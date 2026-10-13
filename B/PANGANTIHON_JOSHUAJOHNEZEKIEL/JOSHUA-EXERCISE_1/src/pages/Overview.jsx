import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  CalendarCheck,
  ShieldCheck,
  Percent,
  Radio,
  TrendingUp,
  BarChart3,
  Activity,
  Clock3,
  Database,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import useRecordsSnapshot from '../hooks/useRecordsSnapshot'
import { useActiveEvent } from '../context/ActiveEventContext'
import { useAppData } from '../context/AppDataStore'
import { dayKey, fmtTime } from '../utils/format'
import { activeBarFor, CURSOR_BAND, CURSOR_LINE } from '../utils/chartTheme'
import StatCard from '../components/StatCard'
import Avatar from '../components/Avatar'

const TIP_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: 12.5,
}

/** Module-scope helper: "scans per day for the last 14 days" chart series.
 *  (Kept outside the component so Date.now() never runs during render.) */
function buildDailyTrend(summaries) {
  const byDay = {}
  ;(summaries || []).forEach((s) => {
    Object.entries(s.byDay || {}).forEach(([k, v]) => {
      byDay[k] = (byDay[k] || 0) + v
    })
  })
  const out = []
  const now = Date.now()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const key = dayKey(d.toISOString())
    out.push({
      day: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      Scans: byDay[key] || 0,
    })
  }
  return out
}

const FIRESTORE_FREE_BYTES = 1024 ** 3 // 1 GiB free tier
const shortName = (n) => (n.length > 16 ? `${n.slice(0, 15)}…` : n)
const fmtBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

export default function OverviewPage({ active = true }) {
  const { activeEvent } = useActiveEvent()

  // Zero-Waste: every list on this page comes from the global boot store —
  // opening or switching to this tab fires ZERO Firestore requests.
  const { students, admins, events, summaries } = useAppData()
  // Cache-first records for the ACTIVE event — a device parked on Overview
  // costs ZERO reads (was ~1 read per incoming scan with the old listener).
  const { records: activeRecords } = useRecordsSnapshot(
    activeEvent?.eventId || null,
    Boolean(active && activeEvent),
  )

  /* ---- aggregates (event counters + summary docs — no record reads) ---- */
  const dailyTrend = useMemo(() => buildDailyTrend(summaries), [summaries])

  const eventBars = useMemo(() => {
    return [...events]
      .sort((a, b) => String(a.startAt || '').localeCompare(String(b.startAt || '')))
      .slice(-8)
      .map((ev) => ({
        name: String(ev.eventName || ev.eventId).slice(0, 14),
        Present: ev.presentCount ?? 0,
        Late: ev.lateCount ?? 0,
        Absent: ev.absentCount ?? 0,
      }))
  }, [events])

  const attendedEverIds = useMemo(() => {
    const ids = new Set()
    summaries.forEach((s) => (s.attendedStudentIds || []).forEach((id) => ids.add(id)))
    return ids
  }, [summaries])

  const programTotals = useMemo(() => {
    const map = {}
    students.forEach((s) => {
      const p = s.program || 'Unknown'
      map[p] = map[p] || { program: p, Presents: 0 }
      if (attendedEverIds.has(s.studentId)) map[p].Presents += 1
    })
    return Object.values(map).sort((a, b) => b.Presents - a.Presents).slice(0, 7)
  }, [students, attendedEverIds])

  const monthlyEvents = useMemo(() => {
    const map = {}
    events.forEach((ev) => {
      if (!ev.startAt) return
      const d = new Date(ev.startAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString([], { month: 'short', year: '2-digit' })
      map[key] = map[key] || { month: label, Events: 0 }
      map[key].Events += 1
    })
    return Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)).slice(-6).map(([, v]) => v)
  }, [events])

  const endedEvents = events.filter((e) => e.status === 'ended')
  // Only events WITH computed counters count toward the overall rate —
  // otherwise an in-progress session would inflate (or exceed) 100%.
  // Both present AND late count as "attended".
  const scoredEnded = endedEvents.filter((e) => typeof e.presentCount === 'number')
  const totalPresentScans = scoredEnded.reduce(
    (n, e) => n + (e.presentCount || 0) + (e.lateCount || 0),
    0,
  )
  const overallRate =
    scoredEnded.length > 0 && students.length > 0
      ? Math.round((totalPresentScans / (scoredEnded.length * students.length)) * 100)
      : 0

  const activePresent = activeRecords.filter(
    (r) => r.status === 'present' || r.status === 'late',
  ).length

  /* ---- who is consistently early / late? (students with ≥ 2 scans) ---- */
  // "Early" is measured as the average minutes between the event's start and
  // the student's scan (negative = scanned before it began); "late" counts
  // records explicitly flagged LATE (scanned after the end time).
  const consistency = useMemo(() => {
    const startByEvent = new Map(events.map((e) => [e.eventId, e.startAt]))
    const map = new Map()
    summaries.forEach((s) => {
      const startAt = startByEvent.get(s.eventId)
      ;(s.scans || []).forEach((r) => {
        const entry =
          map.get(r.studentId) ||
          { name: String(r.fullName || r.studentId), scans: 0, late: 0, deltaSum: 0, deltas: 0 }
        entry.scans += 1
        if (r.status === 'late') entry.late += 1
        if (r.time && startAt) {
          entry.deltaSum += (new Date(r.time).getTime() - new Date(startAt).getTime()) / 60000
          entry.deltas += 1
        }
        map.set(r.studentId, entry)
      })
    })
    return [...map.values()].filter((s) => s.scans >= 2)
  }, [summaries, events])

  const earlyStudents = useMemo(
    () =>
      consistency
        .filter((s) => s.deltas > 0)
        .map((s) => ({ name: shortName(s.name), minutes: Math.round(s.deltaSum / s.deltas) }))
        .sort((a, b) => a.minutes - b.minutes)
        .slice(0, 7),
    [consistency],
  )

  const lateStudents = useMemo(
    () =>
      [...consistency]
        .filter((s) => s.late > 0)
        .sort((a, b) => b.late - a.late || a.name.localeCompare(b.name))
        .slice(0, 7)
        .map((s) => ({
          name: shortName(s.name),
          Late: s.late,
          avg: s.deltas ? Math.round(s.deltaSum / s.deltas) : 0,
        })),
    [consistency],
  )

  /* ---- Firestore free-tier storage estimate (1 GiB) ----
   * Client-side approximation: UTF-8 size of every loaded document plus a
   * fixed per-document overhead. Firestore ALSO stores search indexes that
   * count toward the quota and cannot be measured from the client, so treat
   * this as a lower-bound estimate. */
  const totalRecordsEver = events.reduce((a, e) => a + (e.recordCount || 0), 0)

  const storage = useMemo(() => {
    const docBytes = (d) => {
      const json = JSON.stringify(d)
      let bytes = 0
      for (let i = 0; i < json.length; i++) {
        const c = json.charCodeAt(i)
        bytes += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0xd800 || c >= 0xe000 ? 3 : 4
      }
      return bytes + 64 // ~ document id + metadata overhead
    }
    const per = {
      Students: students.reduce((a, d) => a + docBytes(d), 0),
      'Admins & operators': admins.reduce((a, d) => a + docBytes(d), 0),
      Events: events.reduce((a, d) => a + docBytes(d), 0),
      'Attendance records': totalRecordsEver * 600, // ~avg record size (records are no longer loaded wholesale)
      Summaries: summaries.reduce((a, d) => a + docBytes(d), 0),
      Counters: 3 * 96, // students / events / operator sequences — tiny fixed docs
    }
    const used = Object.values(per).reduce((a, b) => a + b, 0)
    const avgRecord = 600
    return {
      per,
      used,
      pct: Math.min(100, (used / FIRESTORE_FREE_BYTES) * 100),
      remainingRecords: Math.max(0, Math.floor((FIRESTORE_FREE_BYTES - used) / avgRecord)),
    }
  }, [students, admins, events, summaries])

  const recentScans = useMemo(() => {
    const all = []
    summaries.forEach((s) => (s.scans || []).forEach((r) => all.push(r)))
    return all.filter((r) => r.time).sort((a, b) => (b.time > a.time ? 1 : -1)).slice(0, 7)
  }, [summaries])

  return (
    <>
      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard icon={Users} accent="indigo" label="Total students" value={students.length} sub={`${programTotals.length} programs`} />
        <StatCard icon={CalendarCheck} accent="sky" label="Events Attendance" value={events.length} sub={`${endedEvents.length} ended`} />
        <StatCard icon={Percent} accent="emerald" label="Overall Attendance" value={`${overallRate}%`} sub="across ended events" />
        <StatCard icon={ShieldCheck} accent="violet" label="Admins & Operators" value={admins.length} sub={`${admins.filter((a) => a.classification === 'MAYOR').length} MAYOR · ${admins.filter((a) => a.classification === 'CASSC').length} CASSC`} />
        <StatCard
          icon={Radio}
          accent={activeEvent ? 'amber' : 'rose'}
          label="Active Attendance"
          value={activeEvent ? 'Live' : 'None'}
          sub={activeEvent ? `${activeEvent.eventName} · ${activePresent} present` : 'Start one from Start Attendance'}
        />
      </div>

      {/* Live banner */}
      {activeEvent && (
        <div className="card card-pad row" style={{ marginBottom: 18, flexWrap: 'wrap', borderColor: 'rgba(16,185,129,.4)' }}>
          <span className="live-dot" />
          <div>
            <strong>{activeEvent.eventName}</strong>
            <div className="muted" style={{ fontSize: 12 }}>
              <span className="mono">{activeEvent.eventId}</span> · {activePresent} students present so far
            </div>
          </div>
          <span className="spacer" />
          <Link to="/scan" className="btn btn-primary btn-sm">Open scanner</Link>
          <Link to={`/attendances/${activeEvent.id}`} className="btn btn-outline btn-sm">View roster</Link>
        </div>
      )}

      {/* Charts row 1 */}
      <div className="charts-grid">
        <div className="card chart-box">
          <div className="card-title"><TrendingUp size={16} /> Scans — last 14 days</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="ovTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: 'var(--muted)' }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={TIP_STYLE} cursor={CURSOR_LINE} />
                <Area type="monotone" dataKey="Scans" stroke="#4f46e5" strokeWidth={2.2} fill="url(#ovTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-box">
          <div className="card-title"><BarChart3 size={16} /> Present · Late · Absent — recent events</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: 'var(--muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={TIP_STYLE} cursor={CURSOR_BAND} />
                <Legend />
                <Bar dataKey="Present" fill="#10b981" radius={[5, 5, 0, 0]} activeBar={activeBarFor('#10b981', [5, 5, 0, 0])} />
                <Bar dataKey="Late" fill="#f59e0b" radius={[5, 5, 0, 0]} activeBar={activeBarFor('#f59e0b', [5, 5, 0, 0])} />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[5, 5, 0, 0]} activeBar={activeBarFor('#f43f5e', [5, 5, 0, 0])} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="charts-grid">
        <div className="card chart-box">
          <div className="card-title"><Activity size={16} /> Total check-ins by program</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programTotals} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis type="category" dataKey="program" width={86} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={TIP_STYLE} cursor={CURSOR_BAND} />
                <Bar dataKey="Presents" fill="#0ea5e9" radius={[0, 5, 5, 0]} activeBar={activeBarFor('#0ea5e9', [0, 5, 5, 0])} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-box">
          <div className="card-title"><CalendarCheck size={16} /> Events per month</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEvents}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Tooltip contentStyle={TIP_STYLE} cursor={CURSOR_LINE} />
                <Line type="monotone" dataKey="Events" stroke="#f59e0b" strokeWidth={2.4} dot={{ r: 3.5, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-box">
          <div className="card-title"><Radio size={16} /> Latest check-ins</div>
          {recentScans.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No scans recorded yet.</p>
          ) : (
            <div className="recent-list">
              {recentScans.map((r) => (
                <div key={r.id} className="recent-item">
                  <Avatar name={r.fullName} size={30} />
                  <div className="r-main">
                    <div className="r-name">{r.fullName}</div>
                    <div className="r-sub">{r.eventId} · {r.scannedByName || r.scannedBy}</div>
                  </div>
                  <span className="chip mono">{fmtTime(r.time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts row 3 — punctuality consistency */}
      <div className="charts-grid">
        <div className="card chart-box">
          <div className="card-title"><TrendingUp size={16} /> Consistently early — avg minutes vs start</div>
          <div className="chart-wrap">
            {earlyStudents.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, margin: 'auto' }}>
                Not enough scan history yet — students need at least 2 scans.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earlyStudents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted)' }} unit=" min" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <Tooltip
                    contentStyle={TIP_STYLE}
                    cursor={CURSOR_BAND}
                    formatter={(v) => [`${v} min vs event start`, 'Average scan time']}
                  />
                  <Bar dataKey="minutes" fill="#10b981" radius={[0, 5, 5, 0]} activeBar={activeBarFor('#10b981', [0, 5, 5, 0])} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="chart-note">Negative = scanned before the event started. Top 7 students with 2+ scans.</div>
        </div>

        <div className="card chart-box">
          <div className="card-title"><Clock3 size={16} /> Consistently late — most late scans</div>
          <div className="chart-wrap">
            {lateStudents.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, margin: 'auto' }}>
                No late scans recorded — everyone made it before the end time.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lateStudents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <Tooltip
                    contentStyle={TIP_STYLE}
                    cursor={CURSOR_BAND}
                    formatter={(v) => [`${v} late scan${v === 1 ? '' : 's'}`, 'Total']}
                  />
                  <Bar dataKey="Late" fill="#f59e0b" radius={[0, 5, 5, 0]} activeBar={activeBarFor('#f59e0b', [0, 5, 5, 0])} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="chart-note">Students flagged LATE most often (scanned after the event's end time).</div>
        </div>
      </div>

      {/* Firestore free-tier storage estimate */}
      <div className="card card-pad" style={{ marginTop: 18 }}>
        <div className="card-title"><Database size={16} /> Firestore storage — free-tier estimate</div>
        <div className="row" style={{ gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ height: 10, borderRadius: 99, background: 'var(--surface-2)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(storage.pct, 0.6)}%`,
                  background: storage.pct > 85 ? 'var(--rose)' : storage.pct > 60 ? 'var(--amber)' : 'var(--emerald)',
                  borderRadius: 99,
                  transition: 'width .5s ease',
                }}
              />
            </div>
          </div>
          <strong style={{ fontSize: 14 }}>{fmtBytes(storage.used)} / 1 GB</strong>
          <span className="chip mono">{storage.pct.toFixed(2)}%</span>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {Object.entries(storage.per).map(([label, bytes]) => (
            <span key={label} className="chip">
              {label}: <strong>{fmtBytes(bytes)}</strong>
            </span>
          ))}
        </div>
        <p className="hint muted" style={{ marginTop: 10 }}>
          Estimated from the {students.length} students · {events.length} events · {totalRecordsEver.toLocaleString()} records on
          this page. At this average size, roughly {storage.remainingRecords.toLocaleString()} more attendance records
          would fit before the free 1 GB is reached. Firestore also stores search indexes that count toward the quota
          but cannot be measured from the client — for the authoritative number open Firebase Console → Firestore →
          Usage. Running low? Delete old events from the Attendances tab (their records go with them).
        </p>
      </div>
    </>
  )
}

