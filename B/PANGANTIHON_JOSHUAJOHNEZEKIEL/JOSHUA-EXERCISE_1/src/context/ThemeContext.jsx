import { createContext, useContext, useEffect, useState } from 'react'
import { reloadOnceForStaleContext } from '../utils/staleContextGuard'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('casscan_theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch {
      /* ignore */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('casscan_theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

const noop = () => {}
/** Transient shell for the single render before a stale-context reload. */
const THEME_STALE_SHELL = Object.freeze({ theme: 'dark', toggleTheme: noop })

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (ctx === null) {
    // Stale-instance hatch — see utils/staleContextGuard.js.
    if (reloadOnceForStaleContext('useTheme')) return THEME_STALE_SHELL
    throw new Error('useTheme() called outside <ThemeProvider> (App.jsx).')
  }
  return ctx
}
