import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

/** Smallest set of focusable selectors, used for the modal focus trap. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function Modal({ open, title, onClose, children, footer, maxWidth = 520 }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  // Keep the latest close handler in a ref so the focus-trap effect below can
  // depend on `open` ONLY. The close callback is an inline closure that gets a
  // new identity on every parent render (e.g. on every keystroke while a form
  // inside the modal is being typed); if it were a dependency, the trap would
  // re-arm each time and STEAL FOCUS from the field being typed in.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const dialog = dialogRef.current
    if (!dialog) return undefined

    // Remember what had focus so we can restore it when the modal closes.
    const previouslyFocused = document.activeElement
    const focusables = () => [...dialog.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
    const first = () => focusables()[0]
    const last = () => focusables()[focusables().length - 1]

    ;(first() || dialog).focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab') return
      // Trap focus inside the modal so keyboard users never fall behind it.
      const list = focusables()
      if (list.length === 0) return
      const f = first()
      const l = last()
      if (e.shiftKey && (document.activeElement === f || document.activeElement === dialog)) {
        e.preventDefault()
        l?.focus()
      } else if (!e.shiftKey && document.activeElement === l) {
        e.preventDefault()
        f?.focus()
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
    // `open` only — see the onCloseRef note above.
  }, [open])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="modal" style={{ maxWidth }} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          <button type="button" className="btn btn-ghost btn-icon modal-close" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
