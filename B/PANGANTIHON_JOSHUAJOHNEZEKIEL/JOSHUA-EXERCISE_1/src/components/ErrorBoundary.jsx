import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * Reusable error boundary with a "Try again" action.
 *
 * Component errors in a high-risk subtree (a lazily-loaded page, a transient
 * Firestore/parse failure) are caught here instead of blanking the whole app,
 * and the user can retry without a hard reload. Identical to the root boundary
 * in main.jsx but with a recovery button.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Route crashed:', error, info)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="card card-pad"
          style={{ margin: '40px auto', maxWidth: 520, textAlign: 'center' }}
          role="alert"
        >
          <h3 style={{ color: 'var(--rose)', marginBottom: 8 }}>This view hit an error</h3>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: 12.5,
              color: 'var(--muted)',
              textAlign: 'left',
              marginBottom: 16,
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
            <RefreshCw size={15} /> Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
