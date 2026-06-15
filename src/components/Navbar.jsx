// src/components/Navbar.jsx (Simplified)
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar({ session }) {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const avatarUrl = session?.user?.user_metadata?.avatar_url || 
    `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=7c3aed&color=fff`

  // Navigation icons
  const navItems = [
    { icon: '🏠', label: 'Home', path: '/', iconClass: 'fas fa-home' },
    { icon: '👥', label: 'Friends', path: '/friends', iconClass: 'fas fa-user-friends' },
    { icon: '💬', label: 'Messages', path: '/messages', iconClass: 'fas fa-comment-dots' },
    { icon: '🔔', label: 'Notifications', path: '/notifications', iconClass: 'fas fa-bell' }
  ]

  return (
    <div className="top-bar">
      <div className="logo-area">
        <div className="circle-logo" onClick={() => navigate('/')}>
          <span>S</span>
        </div>
        <div className="logo-text" onClick={() => navigate('/')}>
          Social<span>Vibe</span>
        </div>
      </div>
      
      {/* Simplified Navigation - Only these icons */}
      <div className="nav-links-desktop">
        {navItems.map((item) => (
          <Link 
            key={item.path}
            to={item.path} 
            className="nav-icon" 
            title={item.label}
          >
            <i className={item.iconClass}></i>
          </Link>
        ))}
      </div>
      
      <div className="header-icons">
        <div className="profile-icon" onClick={() => setShowDropdown(!showDropdown)}>
          <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Profile Dropdown */}
      {showDropdown && (
        <>
          <div className="profile-dropdown active">
            <div className="dropdown-header">
              <div className="dropdown-user" onClick={() => { navigate('/profile'); setShowDropdown(false) }}>
                <div className="dropdown-user-avatar">
                  <img src={avatarUrl} alt="avatar" />
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
              <i className="fas fa-cog"></i><span>Settings</span>
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