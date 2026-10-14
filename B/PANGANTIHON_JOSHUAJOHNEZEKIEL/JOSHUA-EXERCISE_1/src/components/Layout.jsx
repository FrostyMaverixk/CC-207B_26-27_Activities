import { useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ScanLine,
  CalendarClock,
  ClipboardList,
  Users,
  ShieldCheck,
  Contact,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'
import { WifiOff } from 'lucide-react'

import { isFirebaseConfigured } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import useOnlineStatus from '../hooks/useOnlineStatus'
import Avatar from './Avatar'
import QuotaMonitor from './QuotaMonitor'

const NAV_ITEMS = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/scan', label: 'Scan QR', icon: ScanLine },
  { to: '/start-attendance', label: 'Start Attendance', icon: CalendarClock },
  { to: '/attendances', label: 'Attendances', icon: ClipboardList },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/admins', label: 'Admins & Operators', icon: ShieldCheck },
  { to: '/my-details', label: 'My Details', icon: Contact },
]

const TITLES = [
  ['/start-attendance', 'Start Attendance'],
  ['/attendances/', 'Event Attendance'],
  ['/attendances', 'Attendances'],
  ['/overview', 'Overview'],
  ['/scan', 'Scan QR'],
  ['/students', 'Students'],
  ['/admins', 'Admins & Operators'],
  ['/my-details', 'My Details'],
]

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('casscan_sidebar') === 'collapsed'
    } catch {
      return false // hardened / private browsing profiles can block localStorage
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const { admin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { toast, confirm } = useToast()
  const online = useOnlineStatus()
  const navigate = useNavigate()
  const location = useLocation()

  const title = useMemo(() => {
    if (location.pathname.startsWith('/attendances/')) return 'Event Attendance'
    const found = TITLES.find(([p]) => location.pathname === p)
    return found ? found[1] : 'CASScan'
  }, [location.pathname])

  const toggleCollapse = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('casscan_sidebar', !c ? 'collapsed' : 'open')
      } catch {
        /* hardened / private browsing — the collapse still works for this tab */
      }
      return !c
    })
  }

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Sign out of CASScan?',
      message: 'You will need to sign in again to manage attendance.',
      confirmLabel: 'Sign out',
      danger: true,
    })
    if (!ok) return
    logout()
    toast.info('Signed out', 'See you at the next CAS event!')
    navigate('/login')
  }

  return (
    <div className={`app-shell ${collapsed ? 'collapsed' : ''}`}>
      {/* ---------- Sidebar ---------- */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark isat">
            <img src="/ISATUlogo.jpg" alt="ISATU logo" className="brand-logo-img" />
          </span>
          <span className="brand-text">
            <strong>CASScan</strong>
            <span>CAS Attendance</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={19} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <QuotaMonitor collapsed={collapsed} />
          <button type="button" className="nav-item" style={{ border: 'none', cursor: 'pointer' }} onClick={toggleCollapse}>
            {collapsed ? <ChevronsRight size={19} /> : <ChevronsLeft size={19} />}
            {!collapsed && <span className="nav-label">Collapse</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="backdrop" onClick={() => setMobileOpen(false)} />}

      {/* ---------- Main column ---------- */}
      <div className="main-col">
        <header className="topbar">
          <button type="button" className="btn btn-ghost btn-icon burger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <h1>{title}</h1>
          <span className="spacer" />

          <button type="button" className="btn btn-outline btn-icon" onClick={toggleTheme} aria-label="Toggle theme" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button type="button" className="btn btn-outline btn-icon" onClick={handleLogout} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>

          <NavLink to="/my-details" className="topbar-user">
            <Avatar name={admin?.fullName || '?'} size={30} />
            <span className="u-meta">
              <span className="u-name">{admin?.fullName}</span>
              <br />
              <span className="u-role">{admin?.operatorId}</span>
            </span>
          </NavLink>
        </header>

        {!isFirebaseConfigured && (
          <div className="config-banner">
            Firebase is not configured yet — create a .env file (see .env.example), then restart the dev server.
          </div>
        )}

        {!online && (
          <div className="offline-banner" role="status" aria-live="polite">
            <WifiOff size={14} /> You are offline — scans cannot reach the database right now. Firestore caches
            locally and will catch up when the connection returns.
          </div>
        )}

        <main className="page">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}

export function AuthSplash() {
  return (
    <div className="splash">
      <div className="spinner" />
    </div>
  )
}

export function RequireAuth({ children }) {
  const { admin, loading } = useAuth()
  if (loading) return <AuthSplash />
  if (!admin) return <Navigate to="/login" replace />
  return children
}
