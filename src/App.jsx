// src/App.jsx - WITH LAYOUT (test version)
import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return
    setInitialized(true)
    
    console.log('🔍 App: Initializing ONCE...')
    
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔍 Session loaded:', session ? `✅ ${session.user.email}` : '❌ No session')
        setSession(session)
      } catch (err) {
        console.error('❌ Session error:', err)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 Auth event:', event, session ? `✅ ${session.user.email}` : '❌ No session')
      setSession(session)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialized])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#0a0a1a',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  console.log('🔍 Rendering App, session:', session?.user?.email || 'No session')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          !session ? <Login /> : <Navigate to="/" replace />
        } />
        <Route path="/" element={
          session ? (
            <Layout session={session}>
              <Home session={session} />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App