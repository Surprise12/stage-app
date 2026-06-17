// src/components/Layout.jsx - SIMPLIFIED VERSION
import React from 'react'

export default function Layout({ children, session }) {
  // For testing, just render children without any sidebars
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '20px',
      minHeight: '100vh',
      background: '#f4f6fb'
    }}>
      {/* Simple header to confirm Layout works */}
      <div style={{
        background: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '24px', fontWeight: '800' }}>
          Social<span style={{ color: '#7c3aed' }}>Vibe</span>
        </div>
        <div>
          <span style={{ marginRight: '16px' }}>👋 {session?.user?.email}</span>
          <button 
            onClick={() => {
              supabase.auth.signOut()
              window.location.href = '/login'
            }}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Main content */}
      {children}
    </div>
  )
}