// src/App.jsx - UPDATED WITH ALL NEW ROUTES
import React, { useEffect, useState } from 'react'
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

// NEW IMPORTS
import StoriesViewer from './components/StoriesViewer'
import ReelsViewer from './components/ReelsViewer'
import LiveViewer from './components/LiveViewer'
import Rooms from './components/Rooms'
import VerifiedArtists from './pages/VerifiedArtists'
import RisingStars from './pages/RisingStars'
import Collaborations from './pages/Collaborations'
import ArtistApplication from './pages/ArtistApplication'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Pages from './pages/Pages'
import PageDetail from './pages/PageDetail'
import Upgrades from './pages/Upgrades'
import Advertise from './pages/Advertise'
import Help from './pages/Help'
import About from './pages/About'
import Friends from './pages/Friends'
import Notifications from './pages/Notifications'
import CreateGroup from './pages/CreateGroup'
import CreatePage from './pages/CreatePage'

let appInitialized = false

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (appInitialized) {
      console.log('🔍 App: Already initialized, skipping...')
      return
    }
    appInitialized = true
    
    console.log('🔍 App: Initializing ONCE...')
    
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
  }, [])

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
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!session ? <Register /> : <Navigate to="/" replace />} />
          
          {/* Main Routes with Layout */}
          <Route path="/" element={session ? <Layout session={session}><Home session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/profile/:id?" element={session ? <Layout session={session}><Profile session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/settings" element={session ? <Layout session={session}><Settings session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/search" element={session ? <Layout session={session}><Search /></Layout> : <Navigate to="/login" />} />
          
          {/* Friends & Notifications */}
          <Route path="/friends" element={session ? <Layout session={session}><Friends session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/notifications" element={session ? <Layout session={session}><Notifications session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Stories, Reels, Live */}
          <Route path="/stories/:userId" element={session ? <StoriesViewer session={session} /> : <Navigate to="/login" />} />
          <Route path="/reels/:userId" element={session ? <ReelsViewer session={session} /> : <Navigate to="/login" />} />
          <Route path="/live/:userId?" element={session ? <LiveViewer session={session} /> : <Navigate to="/login" />} />
          <Route path="/rooms" element={session ? <Rooms session={session} /> : <Navigate to="/login" />} />
          
          {/* Artist Hub */}
          <Route path="/verified-artists" element={session ? <Layout session={session}><VerifiedArtists session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/rising-stars" element={session ? <Layout session={session}><RisingStars session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/collaborations" element={session ? <Layout session={session}><Collaborations session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/artist-application" element={session ? <Layout session={session}><ArtistApplication session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Groups */}
          <Route path="/groups" element={session ? <Layout session={session}><Groups session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/groups/:id" element={session ? <Layout session={session}><GroupDetail session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/create-group" element={session ? <Layout session={session}><CreateGroup session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Pages */}
          <Route path="/pages" element={session ? <Layout session={session}><Pages session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/pages/:id" element={session ? <Layout session={session}><PageDetail session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/create-page" element={session ? <Layout session={session}><CreatePage session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Tree Bar Menu Routes */}
          <Route path="/upgrades" element={session ? <Layout session={session}><Upgrades session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/advertise" element={session ? <Layout session={session}><Advertise session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/help" element={session ? <Layout session={session}><Help session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/about" element={session ? <Layout session={session}><About session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Creator Routes */}
          <Route path="/music" element={session ? <Layout session={session}><MusicVideos session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/beats" element={session ? <Layout session={session}><BeatMarketplace session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/audio" element={session ? <Layout session={session}><AudioUploader session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/royalty/:trackId?" element={session ? <Layout session={session}><RoyaltySplit session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Collaboration Routes */}
          <Route path="/collab" element={session ? <Layout session={session}><CollaborationFinder session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/subscribe/:creatorId?" element={session ? <Layout session={session}><FanSubscriptions session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Event Routes */}
          <Route path="/concerts" element={session ? <Layout session={session}><VirtualConcert session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/events" element={session ? <Layout session={session}><EventsManager session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Community Routes */}
          <Route path="/gigs" element={session ? <Layout session={session}><GigBoard session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/collectives" element={session ? <Layout session={session}><Collectives session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Live & Media Routes */}
          <Route path="/live-streaming" element={session ? <Layout session={session}><LiveStreaming session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/studios" element={session ? <Layout session={session}><StudioBooking session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Commerce Routes */}
          <Route path="/marketplace" element={session ? <Layout session={session}><Marketplace session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Communication Routes */}
          <Route path="/messages" element={session ? <Layout session={session}><Messaging session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Analytics & Admin */}
          <Route path="/analytics" element={session ? <Layout session={session}><AnalyticsPage session={session} /></Layout> : <Navigate to="/login" />} />
          <Route path="/admin" element={session ? <Layout session={session}><AdminPanel session={session} /></Layout> : <Navigate to="/login" />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App