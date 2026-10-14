import { useCallback, useEffect, useRef, useState } from 'react'
import { Database, CloudCog, RefreshCw, Loader2 } from 'lucide-react'
import {
  getGatewayStatus,
  onGatewayChange,
  getRealUsageIfAvailable,
  syncRealUsageInteractive,
  switchToBackupWithSync,
  QUOTA_STATUS_NOTE,
  restorePrimaryFromBackup,
} from '../utils/firestoreGateway'
import { isRealUsageConfigured } from '../utils/realUsage'
import { useToast } from '../context/ToastContext'

/**
 * Quota monitor — shows two numbers so the operator can always reconcile:
 *   1. THIS DEVICE'S LOCAL TALLY (what the gateway counted) — updated every 30s,
 *      reset at midnight PT. This is an ESTIMATE.
 *   2. REAL PROJECT USAGE (when available) — read from the Firebase project itself,
 *      authoritative, but only available when the SDK can reach usage data.
 *
 * On localhost without a Firebase project id wired up, there is no real usage
 * endpoint reachable, so the monitor stays honest by saying exactly that and
 * pointing at the Firebase Console.
 *
 * On a real deploy (Cloudflare, production) the project id is present and the
 * monitor shows the real figure and the gap between it and the local tally.
 */
const pctOf = (usage) => Math.min(100, Math.round((usage?.pct?.overall || 0) * 100))
const barColor = (r) => (r >= 0.92 ? '#ef4444' : r >= 0.8 ? '#f59e0b' : '#10b981')

function envNoteFor(status) {
  // The gateway carries `realNote` once a sync attempt ran; before that, pick
  // an honest placeholder by how the app was built — never claim "reconciled".
  if (status.realNote) return status.realNote
  if (import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    return isRealUsageConfigured() ? QUOTA_STATUS_NOTE.NEEDS_AUTH : QUOTA_STATUS_NOTE.OAUTH_NOT_CONFIGURED
  }
  return QUOTA_STATUS_NOTE.LOCALHOST_NO_PROJECT
}

function UsageBar({ label, usage }) {
  const pct = pctOf(usage)
  const title = usage
    ? `${label} — today: ${usage.reads.toLocaleString()} reads · ${usage.writes.toLocaleString()} writes · ${usage.deletes.toLocaleString()} deletes (resets midnight PT)`
    : `${label} — not configured`
  return (
    <div title={title} style={{ marginBottom: 6 }}>
      <div className="row" style={{ justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span className="mono">
          {usage ? `${usage.reads.toLocaleString()} reads · ` : ''}
          {pct}%
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: barColor(usage ? usage.pct.overall : 0),
            transition: 'width .4s ease',
          }}
        />
      </div>
    </div>
  )
}

export default function QuotaMonitor({ collapsed = false }) {
  const [status, setStatus] = useState(() => getGatewayStatus())
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const { toast, confirm } = useToast()
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  /** Pull the REAL billable counts (Cloud Monitoring) when reachable. */
  const refreshReal = useCallback(async () => {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) return
    try {
      const real = await getRealUsageIfAvailable()
      if (!mountedRef.current || !real) return
      setStatus((prev) => {
        // Only claim "synced" when the fetch produced actual numbers —
        // needsAuth/failure objects must surface their own honest note.
        const realReads = typeof real.used === 'number' ? real.used : real.used?.reads
        const hasRealReads = typeof realReads === 'number'
        const localReads = prev.primary.used?.reads ?? 0
        return {
          ...prev,
          real,
          realNote: hasRealReads ? QUOTA_STATUS_NOTE.REAL_AVAILABLE : real.note || QUOTA_STATUS_NOTE.REAL_UNAVAILABLE,
          realGap: hasRealReads ? realReads - localReads : null,
        }
      })
    } catch {
      if (!mountedRef.current) return
      setStatus((prev) => ({
        ...prev,
        real: null,
        realNote: QUOTA_STATUS_NOTE.REAL_UNAVAILABLE,
        realGap: null,
      }))
    }
  }, [])

  /** "Sync with Firebase" — one-time Google grant, then real counts. */
  const handleSyncReal = async () => {
    setBusy(true)
    try {
      await syncRealUsageInteractive()
      await refreshReal()
      toast.success('Synced with Firebase', 'The quota bars now show the real Usage-and-billing counts.')
    } catch (err) {
      toast.error('Sync failed', err?.message || 'Google sign-in was cancelled.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const refresh = () => setStatus(getGatewayStatus())
    refresh()

    // NOTE: the tally bars must react to gateway writes immediately — this
    // subscription previously never ran when a project id was configured
    // (the reconcile branch returned early), freezing the bars for 5 minutes.
    const unsub = onGatewayChange(refresh)
    const t = setInterval(refresh, 30_000)

    refreshReal()
    const reconcileTimer = import.meta.env.VITE_FIREBASE_PROJECT_ID
      ? setInterval(refreshReal, 2 * 60 * 1000) // ~realtime (Monitoring lags ~2-4 min)
      : null
    // Returning to the tab refreshes the real usage immediately.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshReal()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      unsub()
      clearInterval(t)
      if (reconcileTimer) clearInterval(reconcileTimer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refreshReal])

  const switchToBackup = async () => {
    const ok = await confirm({
      title: 'Switch to the backup database?',
      message:
        'First every primary change (students, admins, events, scans) is copied to the backup, then all reads and writes move there for the rest of the quota day. The page reloads once the switch completes.',
      confirmLabel: 'Sync & switch to backup',
    })
    if (!ok) return
    setBusy(true)
    try {
      toast.info('Syncing primary → backup…', 'Copying every primary change to the backup before switching.')
      await switchToBackupWithSync()
      toast.success('Switched to backup', 'Primary changes were synced first — reloading.')
    } catch (err) {
      // The mirror failed: stay on the primary so nothing is half-moved.
      toast.error('Switch cancelled — sync failed', err?.message || 'Still on the primary; nothing was lost.')
      setBusy(false)
    }
  }

  const returnToPrimary = async () => {
    const ok = await confirm({
      title: 'Return to the primary database?',
      message:
        'First everything created on the backup is copied back to the primary (no duplicates), then the app reloads on the primary project.',
      confirmLabel: 'Sync & return to primary',
    })
    if (!ok) return
    setBusy(true)
    try {
      await restorePrimaryFromBackup()
      toast.success('Restored', 'Backup data is back on the primary — reloading.')
    } catch (err) {
      toast.error('Restore failed', err.message)
      setBusy(false)
    }
  }

  const worst = Math.max(pctOf(status.primary), pctOf(status.backup))
  const activeLabel = status.active === 'backup' ? 'Backup DB' : 'Primary DB'
  const envNote = envNoteFor(status)

  return (
    <div style={{ padding: '0 14px 10px' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="nav-item"
        style={{
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          background: 'transparent',
          color: 'inherit',
        }}
        title="Firebase daily quota usage"
      >
        <Database size={16} />
        {!collapsed && <span className="nav-label">{activeLabel} · {worst}% quota</span>}
      </button>

      {open && (
        <div
          style={{
            margin: '8px 14px 0',
            padding: 10,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            fontSize: 11.5,
          }}
        >
          <div className="row" style={{ gap: 6, marginBottom: 8, fontWeight: 700 }}>
            <CloudCog size={13} /> Firebase quota monitor
          </div>
          <UsageBar label="Primary" usage={status.primary} />
          {status.backup ? <UsageBar label="Backup" usage={status.backup} /> : null}
          <div className="muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
            Active: <strong>{activeLabel}</strong>
            {status.reason && status.reason !== 'manual' ? ` (${status.reason})` : ''}
            <br />
            {status.backup
              ? `Backup mirrored: ${status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleTimeString() : 'never'}`
              : 'Backup project not configured — set VITE_FIREBASE_BACKUP_* in .env'}
            <br />
            Quota resets at midnight PT.
            <br />
            {envNote}
            {status.real?.used?.reads != null && (
              <>
                <br />
                Firebase (real): today <strong>{status.real.used.reads.toLocaleString()} reads</strong>
                {status.real?.used?.writes != null ? ` · ${status.real.used.writes.toLocaleString()} writes` : ''}
                {status.real?.used?.deletes != null ? ` · ${status.real.used.deletes.toLocaleString()} deletes` : ''}
                {' — '}
                {status.real?.pct != null ? `${status.real.pct}%` : 'n/a'} of the{' '}
                {status.real?.limit?.toLocaleString() ?? 50000}/day read cap
                {status.real?.resetAt ? ` · resets ${new Date(status.real.resetAt).toLocaleTimeString()}` : ''}.
                {status.realGap !== null && status.realGap !== undefined && (
                  <> Local tally diff: <strong style={{ color: status.realGap > 0 ? 'var(--rose)' : 'var(--emerald)' }}>{status.realGap > 0 ? '+' : ''}{status.realGap.toLocaleString()} reads</strong></>
                )}.
              </>
            )}
          </div>
          {(status.real?.needsAuth || status.realNote === QUOTA_STATUS_NOTE.NEEDS_AUTH) && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: 11, width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={busy}
              onClick={handleSyncReal}
              title="Grant read-only access to Google Cloud Monitoring and pull the real Usage-and-billing counts"
            >
              {busy ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />} Sync with Firebase (real usage)
            </button>
          )}
          {status.backup && (
            <div className="row" style={{ gap: 6, marginTop: 8 }}>
              {status.active === 'primary' ? (
                <button type="button" className="btn btn-outline" style={{ fontSize: 11 }} disabled={busy} onClick={switchToBackup}>
                  Use backup now
                </button>
              ) : (
                <button type="button" className="btn btn-outline" style={{ fontSize: 11 }} disabled={busy} onClick={returnToPrimary}>
                  Restore &amp; return
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
