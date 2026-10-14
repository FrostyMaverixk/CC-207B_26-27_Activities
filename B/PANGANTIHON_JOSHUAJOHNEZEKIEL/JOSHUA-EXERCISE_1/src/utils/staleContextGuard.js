/**
 * Recovery hatch for the classic Vite fast-refresh failure: editing a module
 * (or its imports) recreates a React context, while components in files that
 * were NOT re-executed keep reading the orphaned old instance — `useContext`
 * then returns the provider-less default (`null`).
 *
 * The static tree always nests every consumer under its provider (App.jsx), so
 * that state can only exist after a hot swap — reloading the page once fixes
 * it. `reloadOnceForStaleContext()` arms exactly one such reload per incident:
 * a sessionStorage flag stops an infinite loop if a REAL provider-nesting bug
 * ever exists, and providers clear the flag after a fully committed (healthy)
 * mount, which re-arms the hatch for the next hot swap.
 */
const FLAG = 'casscan_stale_context_reload'

/**
 * Called by a context hook when its context came back `null`.
 * Returns TRUE when it armed a reload (the caller should return a harmless
 * transient shell instead of throwing), FALSE when a reload already happened
 * for this incident (the caller should throw a descriptive error).
 */
export function reloadOnceForStaleContext(hookName) {
  try {
    if (sessionStorage.getItem(FLAG)) return false
    sessionStorage.setItem(FLAG, String(Date.now()))
  } catch {
    return false // hardened / private mode — just surface the error
  }
  console.warn(
    `[context] ${hookName} read a stale context after a hot edit — reloading the app once.`,
  )
  if (typeof window !== 'undefined') window.location.reload()
  return true
}

/** Providers call this after a clean mount so the hatch is armed again. */
export function clearStaleContextReloadFlag() {
  try {
    sessionStorage.removeItem(FLAG)
  } catch {
    /* ignore */
  }
}
