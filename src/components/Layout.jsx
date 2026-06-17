// src/components/Layout.jsx - MINIMAL WORKING VERSION
import React from 'react'
import { supabase } from '../lib/supabase'

export default function Layout({ children, session }) {
  console.log('📐 Minimal Layout rendering with session:', session?.user?.email)

  if (!session) {
    return <>{children}</>
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: '100vh',
      background: '#f4f6fb'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ fontSize: '24px', fontWeight: '800' }}>
          Social<span style={{ color: '#7c3aed' }}>Vibe</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>👋 {session?.user?.email}</span>
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
      
      {/* Main Content */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        minHeight: '400px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {children}
      </div>
    </div>
  )
}