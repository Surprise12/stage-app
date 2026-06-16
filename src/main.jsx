// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// Global error handler
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Check if it's an extension error
      if (this.state.error?.message?.includes('startResizing') ||
          this.state.error?.message?.includes('extension')) {
        console.warn('Extension error recovered, continuing...')
        return this.props.children
      }
      
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
          <h2>Something went wrong</h2>
          <p style={{ color: '#888', marginBottom: '20px' }}>
            {this.state.error?.message || 'Please try again'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Suppress console errors from extensions
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('startResizing') || 
      message.includes('extension') ||
      message.includes('chrome-extension')) {
    return; // Suppress extension errors
  }
  originalConsoleError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)