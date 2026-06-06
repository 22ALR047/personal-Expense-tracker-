import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Runtime UI error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          margin: 0,
          padding: '24px',
          background: '#020617',
          color: '#e2e8f0',
          fontFamily: 'Segoe UI, sans-serif',
        }}>
          <section style={{
            width: 'min(680px, 100%)',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '20px',
            background: '#0f172a',
          }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '22px' }}>Something went wrong</h1>
            <p style={{ margin: '0 0 12px', lineHeight: 1.5 }}>
              The app crashed while rendering. Use the details below to debug quickly.
            </p>
            <p style={{ margin: '0 0 16px', color: '#fca5a5' }}>
              Error: {this.state.message}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  borderRadius: '10px',
                  border: '1px solid #22c55e',
                  background: '#16a34a',
                  color: '#03220d',
                  fontWeight: 600,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('expense-tracker-transactions-v1')
                  window.location.reload()
                }}
                style={{
                  borderRadius: '10px',
                  border: '1px solid #f59e0b',
                  background: '#1e293b',
                  color: '#fcd34d',
                  fontWeight: 600,
                  padding: '8px 12px',
                  cursor: 'pointer',
                }}
              >
                Clear Saved Transactions
              </button>
            </div>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
