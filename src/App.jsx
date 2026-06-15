import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'
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
    return <div className="spinner"></div>
  }

  return (
    <>
      <Analytics />
      <BrowserRouter>
        <Navbar session={session} />
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={
            <ProtectedRoute session={session}>
              <Home session={session} />
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <ProtectedRoute session={session}>
              <Search />
            </ProtectedRoute>
          } />
          <Route path="/music" element={
            <ProtectedRoute session={session}>
              <MusicVideos session={session} />
            </ProtectedRoute>
          } />
          <Route path="/gigs" element={
            <ProtectedRoute session={session}>
              <GigBoard session={session} />
            </ProtectedRoute>
          } />
          <Route path="/collectives" element={
            <ProtectedRoute session={session}>
              <Collectives session={session} />
            </ProtectedRoute>
          } />
          <Route path="/live" element={
            <ProtectedRoute session={session}>
              <LiveStreaming session={session} />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute session={session}>
              <AnalyticsPage session={session} />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute session={session}>
              <AdminPanel session={session} />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute session={session}>
              <Messaging session={session} />
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute session={session}>
              <EventsManager session={session} />
            </ProtectedRoute>
          } />
          <Route path="/groups" element={
            <ProtectedRoute session={session}>
              <GroupsManager session={session} />
            </ProtectedRoute>
          } />
          <Route path="/marketplace" element={
            <ProtectedRoute session={session}>
              <Marketplace session={session} />
            </ProtectedRoute>
          } />
          <Route path="/profile/:id?" element={
            <ProtectedRoute session={session}>
              <Profile session={session} />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute session={session}>
              <Settings session={session} />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App