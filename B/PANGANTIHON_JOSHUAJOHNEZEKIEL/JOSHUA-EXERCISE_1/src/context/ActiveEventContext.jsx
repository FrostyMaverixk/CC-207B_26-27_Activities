import { createContext, useContext, useMemo } from 'react'
import { query, where } from 'firebase/firestore'
import { collection } from '../utils/firestoreGateway'
import useFirestoreQuery from '../hooks/useFirestoreQuery'

const ActiveEventContext = createContext(null)

/**
 * Exposes the single currently-active attendance event (status === "active").
 * Shared by the Scan tab, Start Attendance tab, and Overview.
 */
export function ActiveEventProvider({ children }) {
  // live:true — the active event must react to starts/ends instantly. This is
  // the app's single always-on listener (a status-filtered query, ~1 doc).
  // `reconnecting` is TRUE while that listener is retrying after a network
  // hiccup — the Scan tab shows a neutral "restoring" hint instead of acting
  // like attendance is over, and previously-delivered data stays on screen.
  const q = useMemo(() => query(collection(null, 'attendanceEvents'), where('status', '==', 'active')), [])
  const { data, loading, reconnecting } = useFirestoreQuery(q, { live: true })

  const activeEvent =
    data.length > 0
      ? data.reduce((a, b) => ((a.createdAt || '') > (b.createdAt || '') ? a : b))
      : null

  return (
    <ActiveEventContext.Provider value={{ activeEvent, loading, reconnecting }}>
      {children}
    </ActiveEventContext.Provider>
  )
}

export function useActiveEvent() {
  const ctx = useContext(ActiveEventContext)
  if (ctx === null) {
    // Stale-instance hatch — see utils/staleContextGuard.js. A loading shell
    // keeps pages (Scan/Start) in their "restoring" state during the reload.
    if (reloadOnceForStaleContext('useActiveEvent')) {
      return { activeEvent: null, loading: true, reconnecting: false }
    }
    throw new Error('useActiveEvent() called outside <ActiveEventProvider> (App.jsx).')
  }
  return ctx
}
