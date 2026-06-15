import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import NotificationBell from './NotificationBell'

export default function Navbar({ session }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (session) {
      checkAdminStatus()
    }
  }, [session])

  async function checkAdminStatus() {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()
    setIsAdmin(data?.is_admin || false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const avatarUrl = session?.user?.user_metadata?.avatar_url || 
    `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=7c3aed&color=fff`

  return (
    <div className="top-bar">
      <div className="logo-area">
        <div className="circle-logo" onClick={() => navigate('/')}>
          <span style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>S</span>
        </div>
        <div className="logo-text" onClick={() => navigate('/')}>
          Social<span style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Vibe</span>
        </div>
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search SocialVibe..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearch}
          />
        </div>
      </div>
      
      {/* Navigation Links - Desktop */}
      <div className="nav-links-desktop">
        <Link to="/" className="nav-icon" title="Home">
          <i className="fas fa-home"></i>
        </Link>
        <Link to="/music" className="nav-icon" title="Music Videos">
          <i className="fas fa-music"></i>
        </Link>
        <Link to="/beats" className="nav-icon" title="Beat Marketplace">
          <i className="fas fa-headphones"></i>
        </Link>
        <Link to="/audio" className="nav-icon" title="Upload Audio">
          <i className="fas fa-microphone-alt"></i>
        </Link>
        <Link to="/collab" className="nav-icon" title="Collaboration Finder">
          <i className="fas fa-handshake"></i>
        </Link>
        <Link to="/royalty" className="nav-icon" title="Royalty Split">
          <i className="fas fa-chart-pie"></i>
        </Link>
        <Link to="/subscribe" className="nav-icon" title="Subscriptions">
          <i className="fas fa-star"></i>
        </Link>
        <Link to="/concerts" className="nav-icon" title="Virtual Concerts">
          <i className="fas fa-ticket-alt"></i>
        </Link>
        <Link to="/studios" className="nav-icon" title="Studio Booking">
          <i className="fas fa-building"></i>
        </Link>
        <Link to="/gigs" className="nav-icon" title="Gig Board">
          <i className="fas fa-briefcase"></i>
        </Link>
        <Link to="/collectives" className="nav-icon" title="Collectives">
          <i className="fas fa-users"></i>
        </Link>
        <Link to="/live" className="nav-icon" title="Live Streaming">
          <i className="fas fa-video"></i>
        </Link>
        <Link to="/marketplace" className="nav-icon" title="Marketplace">
          <i className="fas fa-store"></i>
        </Link>
        <Link to="/events" className="nav-icon" title="Events">
          <i className="fas fa-calendar"></i>
        </Link>
        <Link to="/analytics" className="nav-icon" title="Analytics">
          <i className="fas fa-chart-line"></i>
        </Link>
        {isAdmin && (
          <Link to="/admin" className="nav-icon" title="Admin Panel">
            <i className="fas fa-crown"></i>
          </Link>
        )}
      </div>
      
      <div className="header-icons">
        <div className="header-icon" onClick={() => navigate('/friends')} title="Friends">
          <i className="fas fa-user-friends"></i>
          <span className="badge">3</span>
        </div>
        <div className="header-icon" onClick={() => navigate('/messages')} title="Messages">
          <i className="fas fa-envelope"></i>
          <span className="badge">5</span>
        </div>
        <NotificationBell session={session} />
        <div className="profile-icon" onClick={() => setShowDropdown(!showDropdown)}>
          <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Profile Dropdown */}
      {showDropdown && (
        <>
          <div className="profile-dropdown active" id="profileDropdown">
            <div className="dropdown-header">
              <div className="dropdown-user" onClick={() => { navigate('/profile'); setShowDropdown(false) }}>
                <div className="dropdown-user-avatar">
                  <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <div className="dropdown-user-info">
                  <h4>{session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0]}</h4>
                  <p>@{session?.user?.email?.split('@')[0]}</p>
                </div>
              </div>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/profile'); setShowDropdown(false) }}>
              <i className="fas fa-user"></i><span>Profile</span>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/settings'); setShowDropdown(false) }}>
              <i className="fas fa-cog"></i><span>Settings & privacy</span>
            </div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item" onClick={() => { navigate('/collab'); setShowDropdown(false) }}>
              <i className="fas fa-handshake"></i><span>Collaboration Finder</span>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/audio'); setShowDropdown(false) }}>
              <i className="fas fa-microphone-alt"></i><span>Upload Audio</span>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/royalty'); setShowDropdown(false) }}>
              <i className="fas fa-chart-pie"></i><span>Royalty Split</span>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/subscribe'); setShowDropdown(false) }}>
              <i className="fas fa-star"></i><span>Subscriptions</span>
            </div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item" onClick={() => { navigate('/beats'); setShowDropdown(false) }}>
              <i className="fas fa-headphones"></i><span>Beat Marketplace</span>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/concerts'); setShowDropdown(false) }}>
              <i className="fas fa-ticket-alt"></i><span>Virtual Concerts</span>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/studios'); setShowDropdown(false) }}>
              <i className="fas fa-building"></i><span>Studio Booking</span>
            </div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i><span>Log out</span>
            </div>
          </div>
          <div className="modal-overlay" onClick={() => setShowDropdown(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}></div>
        </>
      )}
    </div>
  )
}