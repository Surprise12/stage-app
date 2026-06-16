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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  return (
    <>
      <Analytics />
      <BrowserRouter>
        <Routes>
          {/* Auth Routes - No Layout, No Navbar */}
          <Route path="/login" element={
            !session ? <Login /> : <Navigate to="/" />
          } />
          <Route path="/register" element={
            !session ? <Register /> : <Navigate to="/" />
          } />
          
          {/* Protected Routes with Layout */}
          <Route path="/" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <Home session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/search" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <Search />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/profile/:id?" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <Profile session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <Settings session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Creator Routes */}
          <Route path="/music" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <MusicVideos session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/beats" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <BeatMarketplace session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/audio" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <AudioUploader session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/royalty/:trackId?" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <RoyaltySplit session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Collaboration Routes */}
          <Route path="/collab" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <CollaborationFinder session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/subscribe/:creatorId?" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <FanSubscriptions session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Event Routes */}
          <Route path="/concerts" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <VirtualConcert session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/events" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <EventsManager session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Community Routes */}
          <Route path="/gigs" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <GigBoard session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/collectives" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <Collectives session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/groups" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <GroupsManager session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Live & Media Routes */}
          <Route path="/live" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <LiveStreaming session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/studios" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <StudioBooking session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Commerce Routes */}
          <Route path="/marketplace" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <Marketplace session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Communication Routes */}
          <Route path="/messages" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <Messaging session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Analytics & Admin */}
          <Route path="/analytics" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <AnalyticsPage session={session} />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <AdminPanel session={session} />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App