// src/App.jsx - Add debug logging
import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔍 App: Starting...')
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔍 Session from getSession:', session ? `✅ ${session.user.email}` : '❌ No session')
        setSession(session)
        setLoading(false)
      } catch (error) {
        console.error('🔍 Session error:', error)
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 Auth event:', event, session ? `✅ ${session.user.email}` : '❌ No session')
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#0a0a1a',
        color: 'white',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner"></div>
        <p>Loading...</p>
        <style>{`
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(124, 58, 237, 0.2);
            border-top: 4px solid #7c3aed;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  console.log('🔍 Rendering App, session:', session ? `✅ ${session.user.email}` : '❌ No session')

  // TEMPORARY: Show session status on page
  return (
    <>
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        background: '#333', 
        color: 'white', 
        padding: '8px 16px', 
        zIndex: 9999,
        fontSize: '14px',
        textAlign: 'center',
        fontFamily: 'monospace'
      }}>
        Session: {session ? `✅ Logged in as ${session.user.email}` : '❌ Not logged in'}
        | Path: {window.location.pathname}
        | Loading: {loading ? '⏳' : '✅'}
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            !session ? (
              <div>
                <Login />
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ff6b6b', color: 'white', padding: '8px', textAlign: 'center', zIndex: 9999 }}>
                  ⚠️ You are on the login page. Session: {session ? '✅' : '❌'}
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          } />
          <Route path="/" element={
            session ? (
              <div>
                <Home session={session} />
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#51cf66', color: 'white', padding: '8px', textAlign: 'center', zIndex: 9999 }}>
                  ✅ Logged in as {session.user.email}
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App