import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { playSound } from '../utils/sounds'
import { reloadOnceForStaleContext } from '../utils/staleContextGuard'

const ToastContext = createContext(null)
export { ToastContext }
let idSeq = 1

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

/** Renders the right lucide icon as a proper component (never call components as functions). */
function ToastIcon({ type, size = 20 }) {
  const Icon = ICONS[type]
  return Icon ? <Icon size={size} /> : null
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  // Track pending confirm resolvers so an unmounting provider never leaves a
  // caller awaiting forever (it resolves every pending dialog as "cancelled").
  const pendingRef = useRef(new Set())

  const remove = useCallback((id) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  // If the provider unmounts (rare — it wraps the whole app), settle any
  // still-open confirmations so their `await confirm(...)` calls can resume.
  useEffect(() => {
    const pending = pendingRef.current
    return () => {
      pending.forEach((resolve) => resolve(false))
      pending.clear()
    }
  }, [])

  const push = useCallback(
    (type, title, message) => {
      const id = idSeq++
      playSound(type)
      setToasts((ts) => [...ts.slice(-4), { id, type, title, message }])
      setTimeout(() => remove(id), 4200)
    },
    [remove],
  )

  const toast = {
    success: (title, message) => push('success', title, message),
    error: (title, message) => push('error', title, message),
    warning: (title, message) => push('warning', title, message),
    info: (title, message) => push('info', title, message),
  }

  /** confirm({title,message,confirmLabel,danger}) -> Promise<boolean> */
  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      const id = idSeq++
      pendingRef.current.add(resolve)
      playSound('confirm')
      setToasts((ts) => [
        ...ts,
        {
          id,
          type: 'confirm',
          title: opts.title || 'Are you sure?',
          message: opts.message || '',
          confirmLabel: opts.confirmLabel || 'Confirm',
          danger: Boolean(opts.danger),
          resolveRef: { current: resolve },
        },
      ])
    })
  }, [])

  const settle = (id, value) => {
    const found = toasts.find((t) => t.id === id)
    if (found?.resolveRef) {
      found.resolveRef.current(value)
      pendingRef.current.delete(found.resolveRef.current)
    }
    remove(id)
  }

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) =>
          t.type === 'confirm' ? (
            <div key={t.id} className={`toast toast-confirm ${t.danger ? 'danger' : ''}`} role="alertdialog">
              <span className="toast-icon">
                <AlertTriangle size={20} />
              </span>
              <div className="toast-body">
                <strong>{t.title}</strong>
                {t.message && <p>{t.message}</p>}
                <div className="toast-actions">
                  <button
                    type="button"
                    className={`btn btn-sm ${t.danger ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => settle(t.id, true)}
                  >
                    {t.confirmLabel}
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => settle(t.id, false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div key={t.id} className={`toast ${t.type}`}>
              <span className="toast-icon"><ToastIcon type={t.type} /></span>
              <div className="toast-body">
                <strong>{t.title}</strong>
                {t.message && <p>{t.message}</p>}
              </div>
              <button type="button" className="toast-close" onClick={() => remove(t.id)} aria-label="Dismiss">
                <X size={15} />
              </button>
              <span className="toast-bar" />
            </div>
          ),
        )}
      </div>
    </ToastContext.Provider>
  )
}

const noop = () => {}
/** Transient shell for the single render before a stale-context reload. */
const TOAST_STALE_SHELL = Object.freeze({
  toast: { success: noop, error: noop, warning: noop, info: noop },
  confirm: async () => false,
})

export function useToast() {
  const ctx = useContext(ToastContext)
  if (ctx === null) {
    // Stale-instance hatch — see utils/staleContextGuard.js. A no-op shell
    // keeps the tree rendering during the automatic one-shot reload.
    if (reloadOnceForStaleContext('useToast')) return TOAST_STALE_SHELL
    throw new Error('useToast() called outside <ToastProvider> (App.jsx).')
  }
  return ctx
}
