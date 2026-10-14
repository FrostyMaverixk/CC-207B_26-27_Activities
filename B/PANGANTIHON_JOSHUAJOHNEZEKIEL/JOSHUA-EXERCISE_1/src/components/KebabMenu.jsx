import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import { playSound } from '../utils/sounds'

/**
 * Kebab (⋮) dropdown used on every table row.
 *
 * The open menu is rendered through a PORTAL with FIXED viewport coordinates,
 * so it can never be clipped by table cards (`overflow: hidden`) or painted
 * underneath neighbouring rows/backgrounds.
 *
 * items: [{ label, icon: IconComponent, danger, disabled, onClick }] | 'divider'
 */
export default function KebabMenu({ items = [] }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null) // { top, left } fixed coords
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  /** Place the menu below the button, clamped to the viewport (flips up if needed). */
  const place = () => {
    const btn = btnRef.current
    const menu = menuRef.current
    if (!btn || !menu) return
    const b = btn.getBoundingClientRect()
    const m = menu.getBoundingClientRect()
    const GAP = 6
    const MARGIN = 8
    let left = b.right - m.width // right-align with the kebab button
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - m.width - MARGIN))
    let top = b.bottom + GAP
    if (top + m.height > window.innerHeight - MARGIN) {
      top = Math.max(MARGIN, b.top - m.height - GAP) // flip above the button
    }
    setPos({ top, left })
  }

  // Measure after the portal content mounts, before the browser paints.
  useLayoutEffect(() => {
    if (open) place()
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (e) => {
      if (btnRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onReposition = () => place()

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    // capture:true → also catches scrolling inside .table-scroll containers
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [open])

  return (
    <div className="kebab">
      <button
          type="button"
          ref={btnRef}
          className="kebab-btn"
          aria-label="Row actions"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
          playSound('pop')
          setOpen((o) => !o)
        }}
      >
        <MoreVertical size={17} />
      </button>
      {open &&
        createPortal(
          <div
            className="kebab-menu"
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            style={{
              position: 'fixed',
              top: pos ? pos.top : -9999,
              left: pos ? pos.left : -9999,
              right: 'auto', // neutralise .kebab-menu { right: 0 } — else the box stretches to the viewport edge
              zIndex: 100, // above cards/bulk-bar/modals(90); below toasts(120)
            }}
          >
            {items.map((item, i) =>
              item === 'divider' ? (
                <hr key={`d${i}`} />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  className={item.danger ? 'danger' : ''}
                  disabled={item.disabled}
                  style={item.disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                  onClick={() => {
                    setOpen(false)
                    item.onClick?.()
                  }}
                >
                  {item.icon && <item.icon size={15} />}
                  {item.label}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
