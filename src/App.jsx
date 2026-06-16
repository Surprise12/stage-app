// src/App.jsx
import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
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

  useEffect(() => {
    console.log('App: Checking session...')
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App: Session loaded:', session ? 'Yes' : 'No')
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('App: Auth state changed:', _event, session ? 'Logged in' : 'Logged out')
      setSession(session)
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

  console.log('App: Rendering, session:', session?.user?.email || 'No session')

  return (
    <>
      <Analytics />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes - No Layout, No Navbar */}
          <Route path="/login" element={
            !session ? <Login /> : <Navigate to="/" replace />
          } />
          <Route path="/register" element={
            !session ? <Register /> : <Navigate to="/" replace />
          } />
          
          {/* Home Route - Simplified for debugging */}
          <Route path="/" element={
            session ? (
              <Layout session={session}>
                <Home session={session} />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Other Protected Routes */}
          <Route path="/search" element={
            session ? (
              <Layout session={session}>
                <Search />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
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
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App