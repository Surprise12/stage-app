// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// Global error handler - Fixed to NOT recover from render errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('React Error caught by ErrorBoundary:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Don't recover from render errors - let the user refresh
    // This prevents infinite loops
  }

  render() {
    if (this.state.hasError) {
      // Show error UI instead of silently recovering
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: '#0a0a1a',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ color: '#888', marginBottom: '20px', maxWidth: '400px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {this.state.errorInfo && (
            <details style={{ 
              marginBottom: '20px', 
              textAlign: 'left', 
              background: 'rgba(255,255,255,0.05)', 
              padding: '12px', 
              borderRadius: '8px',
              maxWidth: '100%',
              overflow: 'auto'
            }}>
              <summary style={{ color: '#888', cursor: 'pointer' }}>Error Details</summary>
              <pre style={{ 
                color: '#ff6b6b', 
                fontSize: '12px', 
                marginTop: '8px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {this.state.error?.stack || this.state.error?.message}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Refresh Page
          </button>
          <p style={{ color: '#666', fontSize: '12px', marginTop: '16px' }}>
            If this problem persists, please clear your browser cache
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

// Suppress console errors from extensions - but DON'T suppress React errors
const originalConsoleError = console.error
console.error = function(...args) {
  const message = args.join(' ')
  // Only suppress extension errors, not React errors
  if (message && typeof message === 'string') {
    if (message.includes('startResizing') || 
        message.includes('extension') ||
        message.includes('chrome-extension')) {
      // Still log but with a warning prefix
      console.warn('🔇 Extension error suppressed:', message.substring(0, 100))
      return
    }
  }
  originalConsoleError.apply(console, args)
}

// Also catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || event.reason || ''
  if (message.includes('startResizing') || 
      message.includes('extension') ||
      message.includes('chrome-extension')) {
    event.preventDefault()
    console.warn('🔇 Extension promise rejection suppressed')
    return
  }
  // Log other unhandled rejections
  console.error('Unhandled promise rejection:', event.reason)
})

// Catch global errors
window.addEventListener('error', (event) => {
  const message = event.message || ''
  if (message.includes('startResizing') || 
      message.includes('extension') ||
      message.includes('chrome-extension')) {
    event.preventDefault()
    console.warn('🔇 Extension error suppressed')
    return
  }
  // Log other errors
  console.error('Global error:', event.error || event.message)
})

const root = ReactDOM.createRoot(document.getElementById('root'))

// Render with a try-catch for the initial render
try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
} catch (error) {
  console.error('Initial render error:', error)
  // Show a fallback if the initial render fails
  document.getElementById('root').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;background:#0a0a1a;color:white;text-align:center">
      <h2>Failed to load application</h2>
      <p style="color:#888;margin-bottom:20px">${error.message || 'Please try again'}</p>
      <button onclick="window.location.reload()" style="padding:12px 32px;background:#7c3aed;color:white;border:none;border-radius:10px;cursor:pointer;font-size:16px">Refresh Page</button>
    </div>
  `
}