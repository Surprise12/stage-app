import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function LeftSidebar({ session }) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/', color: '#000' },
    { icon: '🎵', label: 'Music Videos', path: '/music', color: '#333' },
    { icon: '🎪', label: 'Gig Board', path: '/gigs', color: '#555' },
    { icon: '👥', label: 'Collectives', path: '/collectives', color: '#777' },
    { icon: '🔴', label: 'Live', path: '/live', color: '#ff4444' },
    { icon: '📊', label: 'Analytics', path: '/analytics', color: '#000' },
    { icon: '🔍', label: 'Search', path: '/search', color: '#666' },
    { icon: '⭐', label: 'Profile', path: '/profile', color: '#000' },
    { icon: '⚙️', label: 'Settings', path: '/settings', color: '#888' },
  ]

  const quickProfiles = [
    { name: 'Sarah Chen', username: 'sarah', avatar: 'S', type: 'artist', badge: 'ARTIST' },
    { name: 'Marcus Webb', username: 'marcus', avatar: 'M', type: 'comedian', badge: 'COMEDIAN' },
    { name: 'Elena Rodriguez', username: 'elena', avatar: 'E', type: 'manager', badge: 'MANAGER' },
  ]

  return (
    <div className="left-sidebar">
      {/* Live Now Button */}
      <div className="live-now-btn" onClick={() => navigate('/live')}>
        <div className="live-dot"></div>
        <span>Live Now</span>
        <span className="live-count">5</span>
      </div>

      {/* Navigation Menu */}
      {menuItems.map((item, index) => (
        <div 
          key={index}
          className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <div className="sidebar-icon">{item.icon}</div>
          <span>{item.label}</span>
        </div>
      ))}

      <div className="divider"></div>
      <div className="section-title">Your shortcuts</div>
      
      {quickProfiles.map((profile, index) => (
        <div 
          key={index}
          className="sidebar-item" 
          onClick={() => navigate(`/profile/${profile.username}`)}
        >
          <div className="sidebar-icon">{profile.avatar}</div>
          <span>{profile.name}</span>
          <span className={`profile-type-badge type-${profile.type}`}>{profile.badge}</span>
        </div>
      ))}

      {/* Sponsors Section */}
      <div className="sponsors-section">
        <div className="sponsors-title">Sponsored</div>
        <div className="sponsors-row">
          <div className="sponsor-icon"><i className="fab fa-nike"></i></div>
          <div className="sponsor-icon"><i className="fab fa-adidas"></i></div>
          <div className="sponsor-icon"><i className="fab fa-spotify"></i></div>
          <div className="sponsor-icon"><i className="fab fa-apple"></i></div>
          <div className="sponsor-icon"><i className="fab fa-microsoft"></i></div>
          <div className="sponsor-icon"><i className="fab fa-google"></i></div>
        </div>
      </div>
    </div>
  )
}