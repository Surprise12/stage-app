// src/App.jsx - FIXED with proper cleanup
import React, { useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Search from './pages/Search'
import MusicVideos from './pages/MusicVideos'
import GigBoard from './pages/GigBoard'
import Collectives from './pages/Collectives'
import LiveStreaming from './pages/LiveStreaming'
import AnalyticsPage from './pages/Analytics'
import AdminPanel from './pages/AdminPanel'
import Messaging from './components/Messaging'
import EventsManager from './components/EventsManager'
import GroupsManager from './components/GroupsManager'
import Marketplace from './components/Marketplace'
import BeatMarketplace from './pages/BeatMarketplace'
import VirtualConcert from './components/VirtualConcert'
import StudioBooking from './components/StudioBooking'
import CollaborationFinder from './components/CollaborationFinder'
import RoyaltySplit from './components/RoyaltySplit'
import FanSubscriptions from './components/FanSubscriptions'
import AudioUploader from './components/AudioUploader'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false) // ✅ Prevents re-initialization

  useEffect(() => {
    // ✅ Prevent multiple initializations
    if (initialized.current) {
      console.log('🔍 App: Already initialized, skipping...')
      return
    }
    initialized.current = true
    
    console.log('🔍 App: Initializing...')
    
    let isMounted = true

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return
        console.log('🔍 Session loaded:', session ? `✅ ${session.user.email}` : '❌ No session')
        setSession(session)
      } catch (err) {
        console.error('❌ Session error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      console.log('🔍 Auth event:', event, session ? `✅ ${session.user.email}` : '❌ No session')
      setSession(session)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, []) // ✅ Empty dependency array - runs once

  // Safety check for redirect loops
  useEffect(() => {
    if (!loading) {
      if (session && window.location.pathname === '/login') {
        console.log('🔍 Redirecting from login to home')
        window.location.href = '/'
      }
      if (!session && window.location.pathname === '/') {
        console.log('🔍 Redirecting from home to login')
        window.location.href = '/login'
      }
    }
  }, [session, loading])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#0a0a1a'
      }}>
        <div className="spinner"></div>
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

  console.log('🔍 Rendering App, session:', session?.user?.email || 'No session')

  return (
    <>
      <Analytics />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes - No Layout */}
          <Route path="/login" element={
            !session ? <Login /> : <Navigate to="/" replace />
          } />
          <Route path="/register" element={
            !session ? <Register /> : <Navigate to="/" replace />
          } />
          
          {/* Home Route */}
          <Route path="/" element={
            session ? (
              <Layout session={session}>
                <Home session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Profile Route */}
          <Route path="/profile/:id?" element={
            session ? (
              <Layout session={session}>
                <Profile session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/settings" element={
            session ? (
              <Layout session={session}>
                <Settings session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/search" element={
            session ? (
              <Layout session={session}>
                <Search />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Creator Routes */}
          <Route path="/music" element={
            session ? (
              <Layout session={session}>
                <MusicVideos session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/beats" element={
            session ? (
              <Layout session={session}>
                <BeatMarketplace session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/audio" element={
            session ? (
              <Layout session={session}>
                <AudioUploader session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/royalty/:trackId?" element={
            session ? (
              <Layout session={session}>
                <RoyaltySplit session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Collaboration Routes */}
          <Route path="/collab" element={
            session ? (
              <Layout session={session}>
                <CollaborationFinder session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/subscribe/:creatorId?" element={
            session ? (
              <Layout session={session}>
                <FanSubscriptions session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Event Routes */}
          <Route path="/concerts" element={
            session ? (
              <Layout session={session}>
                <VirtualConcert session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/events" element={
            session ? (
              <Layout session={session}>
                <EventsManager session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Community Routes */}
          <Route path="/gigs" element={
            session ? (
              <Layout session={session}>
                <GigBoard session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/collectives" element={
            session ? (
              <Layout session={session}>
                <Collectives session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/groups" element={
            session ? (
              <Layout session={session}>
                <GroupsManager session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Live & Media Routes */}
          <Route path="/live" element={
            session ? (
              <Layout session={session}>
                <LiveStreaming session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/studios" element={
            session ? (
              <Layout session={session}>
                <StudioBooking session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Commerce Routes */}
          <Route path="/marketplace" element={
            session ? (
              <Layout session={session}>
                <Marketplace session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Communication Routes */}
          <Route path="/messages" element={
            session ? (
              <Layout session={session}>
                <Messaging session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Analytics & Admin */}
          <Route path="/analytics" element={
            session ? (
              <Layout session={session}>
                <AnalyticsPage session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          <Route path="/admin" element={
            session ? (
              <Layout session={session}>
                <AdminPanel session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App