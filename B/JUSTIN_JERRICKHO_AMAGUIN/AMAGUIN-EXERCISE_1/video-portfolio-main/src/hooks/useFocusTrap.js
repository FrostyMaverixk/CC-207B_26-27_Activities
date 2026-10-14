import { useEffect } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

/**
 * Trap Tab focus inside `ref` while `active`. On activation, moves focus to
 * the first `[data-autofocus]` descendant (else the container itself, which
 * should carry `tabIndex={-1}`). Restoring focus to the trigger is the
 * caller's job (the WorkBin re-focuses the originating strip on close).
 *
 * @param {React.RefObject<HTMLElement>} ref
 * @param {boolean} active
 */
export function useFocusTrap(ref, active) {
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return undefined;

    const focusables = () =>
      [...el.querySelectorAll(FOCUSABLE)].filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = focusables();
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || !el.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !el.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener('keydown', onKeyDown);
    (el.querySelector('[data-autofocus]') ?? el).focus();

    return () => el.removeEventListener('keydown', onKeyDown);
  }, [ref, active]);
}
