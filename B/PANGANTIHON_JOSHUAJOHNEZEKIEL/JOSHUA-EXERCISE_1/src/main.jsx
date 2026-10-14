import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/toasts.css'
import './styles/pages.css'
import App from './App.jsx'

/** Renders any React crash on-screen instead of a blank page. */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('CASScan crashed:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32 }}>
          <h2 style={{ color: '#ef4444' }}>CASScan hit an unexpected error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

/** Last-resort overlay for errors thrown outside the React tree (e.g. during startup). */
function showFatalOverlay(message) {
  const root = document.getElementById('root')
  if (!root || root.childElementCount > 0) return // app is running fine — ignore
  root.innerHTML = `<pre style="padding:32px;color:#ef4444;font-family:monospace;font-size:13px;white-space:pre-wrap">CASScan failed to start:\n${String(message)}</pre>`
}
window.addEventListener('error', (e) => showFatalOverlay(e.error?.message || e.message))
window.addEventListener('unhandledrejection', (e) => showFatalOverlay(e.reason?.message || e.reason))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

