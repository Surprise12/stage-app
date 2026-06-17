// src/main.jsx - FULL VERSION WITH ERROR BOUNDARY
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// ============================================
// GLOBAL ERROR BOUNDARY
// ============================================
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
    // Extension errors should NOT trigger the error UI
    if (error?.message?.includes('startResizing') ||
        error?.message?.includes('extension') ||
        error?.message?.includes('chrome-extension') ||
        error?.message?.includes('ResizeObserver')) {
      return { hasError: false, error: null }
    }
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Only log real errors, not extension errors
    if (!error?.message?.includes('startResizing') &&
        !error?.message?.includes('extension') &&
        !error?.message?.includes('chrome-extension') &&
        !error?.message?.includes('ResizeObserver')) {
      console.error('🔴 React Error:', error, errorInfo)
      this.setState({ errorInfo })
    }
  }

  render() {
    if (this.state.hasError) {
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
          <h2 style={{ marginBottom: '8px', fontSize: '24px', fontWeight: '700' }}>Something went wrong</h2>
          <p style={{ color: '#888', marginBottom: '20px', maxWidth: '400px', fontWeight: '700' }}>
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
              <summary style={{ color: '#888', cursor: 'pointer', fontWeight: '700' }}>Error Details</summary>
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
              fontWeight: '700',
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
          <p style={{ color: '#666', fontSize: '12px', marginTop: '16px', fontWeight: '700' }}>
            If this problem persists, please clear your browser cache
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================
// SUPPRESS CONSOLE ERRORS FROM EXTENSIONS
// ============================================
const originalConsoleError = console.error
console.error = function(...args) {
  const message = args.join(' ')
  if (message && typeof message === 'string') {
    const suppressPatterns = [
      'startResizing',
      'extension',
      'chrome-extension',
      'ResizeObserver',
      'Cannot read properties of undefined'
    ]
    for (const pattern of suppressPatterns) {
      if (message.includes(pattern)) {
        // Silently suppress extension errors
        return
      }
    }
  }
  originalConsoleError.apply(console, args)
}

// ============================================
// CATCH UNHANDLED PROMISE REJECTIONS
// ============================================
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || event.reason || ''
  const suppressPatterns = [
    'startResizing',
    'extension',
    'chrome-extension',
    'ResizeObserver'
  ]
  for (const pattern of suppressPatterns) {
    if (message.includes(pattern)) {
      event.preventDefault()
      return
    }
  }
  console.error('🔴 Unhandled promise rejection:', event.reason)
})

// ============================================
// CATCH GLOBAL ERRORS
// ============================================
window.addEventListener('error', (event) => {
  const message = event.message || ''
  const suppressPatterns = [
    'startResizing',
    'extension',
    'chrome-extension',
    'ResizeObserver'
  ]
  for (const pattern of suppressPatterns) {
    if (message.includes(pattern)) {
      event.preventDefault()
      return
    }
  }
  console.error('🔴 Global error:', event.error || event.message)
})

// ============================================
// REGISTER SERVICE WORKER (for Push Notifications)
// ============================================
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      console.log('✅ Service Worker registered successfully')
      return registration
    } catch (error) {
      console.warn('⚠️ Service Worker registration failed:', error)
    }
  }
  return null
}

// ============================================
// RENDER APPLICATION
// ============================================
const root = ReactDOM.createRoot(document.getElementById('root'))

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
  
  // Register service worker after app loads
  registerServiceWorker()
} catch (error) {
  console.error('🔴 Initial render error:', error)
  document.getElementById('root').innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;background:#0a0a1a;color:white;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">⚠️</div>
      <h2 style="margin-bottom:8px;font-weight:700">Failed to load application</h2>
      <p style="color:#888;margin-bottom:20px;font-weight:700">${error.message || 'Please try again'}</p>
      <button onclick="window.location.reload()" style="padding:12px 32px;background:#7c3aed;color:white;border:none;border-radius:10px;cursor:pointer;font-size:16px;font-weight:700">Refresh Page</button>
    </div>
  `
}

// ============================================
// EXPOSE ERROR HANDLING FOR DEVELOPMENT
// ============================================
if (import.meta.env.DEV) {
  console.log('🔧 SocialVibe App (Development Mode)')
  console.log('📋 Environment:', import.meta.env.MODE)
  console.log('🔑 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing')
  console.log('🔐 VAPID Public Key:', import.meta.env.VITE_VAPID_PUBLIC_KEY ? '✅ Configured' : '❌ Missing')
}