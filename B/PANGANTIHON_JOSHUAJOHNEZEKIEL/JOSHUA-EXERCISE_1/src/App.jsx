import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { ActiveEventProvider } from './context/ActiveEventContext'
import { AppDataProvider } from './context/AppDataStore'
import { rollDayIfNeeded } from './utils/firestoreGateway'
import ErrorBoundary from './components/ErrorBoundary'
import Layout, { AuthSplash, RequireAuth } from './components/Layout'

/* Code-split every page — heavy libs (recharts, html5-qrcode) load on demand. */
const LoginPage = lazy(() => import('./pages/Login'))
const OverviewPage = lazy(() => import('./pages/Overview'))
const ScanAttendancePage = lazy(() => import('./pages/ScanAttendance'))
const StartAttendancePage = lazy(() => import('./pages/StartAttendance'))
const AttendancesPage = lazy(() => import('./pages/Attendances'))
const EventAttendanceDetailPage = lazy(() => import('./pages/EventAttendanceDetail'))
const StudentsPage = lazy(() => import('./pages/Students'))
const AdminsPage = lazy(() => import('./pages/Admins'))
const MyDetailsPage = lazy(() => import('./pages/MyDetails'))

/** Persistent tab shell — top-level tabs stay mounted (CSS-hidden) so tab
 *  switching NEVER remounts a screen or fires a Firestore request. Pages
 *  receive an `active` prop so scoped listeners/cameras pause when hidden. */
function KeepAlive({ active, children }) {
  return (
    <div style={active ? undefined : { display: 'none' }} aria-hidden={!active}>
      {children}
    </div>
  )
}

/** MainShell — all 7 top-level tabs stay mounted forever (CSS-hidden when
 *  inactive), so tab switching NEVER remounts a screen or fires a Firestore
 *  request. Each page gets an `active` prop so scoped listeners/cameras pause
 *  while hidden. The drill-down route (/attendances/:id) renders via <Outlet/>,
 *  which takes over the Attendances tab's slot while the others stay alive. */
function MainShell() {
  const location = useLocation()
  // Exact tab match; /attendances/:id is handled by the Outlet instead.
  const on = (p) => location.pathname === p
  return (
    <Layout>
      <KeepAlive active={on('/overview')}>
        <OverviewPage active={on('/overview')} />
      </KeepAlive>
      <KeepAlive active={on('/scan')}>
        <ScanAttendancePage active={on('/scan')} />
      </KeepAlive>
      <KeepAlive active={on('/start-attendance')}>
        <StartAttendancePage active={on('/start-attendance')} />
      </KeepAlive>
      <KeepAlive active={on('/attendances')}>
        <AttendancesPage active={on('/attendances')} />
      </KeepAlive>
      <KeepAlive active={on('/students')}>
        <StudentsPage active={on('/students')} />
      </KeepAlive>
      <KeepAlive active={on('/admins')}>
        <AdminsPage active={on('/admins')} />
      </KeepAlive>
      <KeepAlive active={on('/my-details')}>
        <MyDetailsPage active={on('/my-details')} />
      </KeepAlive>
      {/* Drill-down page mounts per visit (it owns a per-event listener). */}
      <Outlet />
    </Layout>
  )
}

export default function App() {
  // Firestore's free daily quota resets at midnight Pacific Time — tick every
  // minute to roll local counters (and auto-failback after a backup day).
  useEffect(() => {
    const t = setInterval(() => {
      rollDayIfNeeded().catch(() => {})
    }, 60_000)
    return () => clearInterval(t)
  }, [])

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<AuthSplash />}>
              <ErrorBoundary>
                <Routes>
              <Route path="/login" element={<LoginPage />} />
              {/* Layout route: MainShell renders the persistent tabs + an
                  Outlet for the drill-down child. Matches every path via
                  the `/*` pattern route below. */}
              <Route
                element={
                  <RequireAuth>
                    <ActiveEventProvider>
                      <AppDataProvider>
                        <MainShell />
                      </AppDataProvider>
                    </ActiveEventProvider>
                  </RequireAuth>
                }
              >
                                                                                {/* "/" → /overview (index route): already-logged-in sessions and post-login never land on a blank shell. */}
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="/attendances/:eventId" element={<EventAttendanceDetailPage />} />
                {/* Everything else → the persistent shell (tabs read the store). */}
                <Route path="/*" element={null} />
              </Route>
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
