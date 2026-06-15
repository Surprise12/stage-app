import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function LeftSidebar({ session }) {
  const navigate = useNavigate()
  
  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/', color: '#7c3aed' },
    { icon: '🎵', label: 'Music Videos', path: '/music', color: '#ec4899' },
    { icon: '🎪', label: 'Gig Board', path: '/gigs', color: '#f59e0b' },
    { icon: '👥', label: 'Collectives', path: '/collectives', color: '#10b981' },
    { icon: '🔴', label: 'Live', path: '/live', color: '#ef4444' },
    { icon: '📊', label: 'Analytics', path: '/analytics', color: '#3b82f6' },
    { icon: '🔍', label: 'Search', path: '/search', color: '#8b5cf6' },
    { icon: '⭐', label: 'Profile', path: '/profile', color: '#f97316' },
    { icon: '⚙️', label: 'Settings', path: '/settings', color: '#6b7280' },
  ]

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Profile Card */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <img 
          src={session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=7c3aed&color=fff&size=80`}
          style={{ width: '64px', height: '64px', borderRadius: '50%', marginBottom: '12px', border: '3px solid #7c3aed' }}
          alt="avatar"
        />
        <h4 style={{ fontWeight: 600 }}>{session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0]}</h4>
        <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>@{session?.user?.email?.split('@')[0]}</p>
      </div>
      
      {/* Navigation Menu */}
      {menuItems.map((item, index) => (
        <div
          key={index}
          onClick={() => navigate(item.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 16px',
            borderRadius: '14px',
            marginBottom: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: window.location.pathname === item.path ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
            borderLeft: window.location.pathname === item.path ? `3px solid ${item.color}` : '3px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (window.location.pathname !== item.path) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }
          }}
          onMouseLeave={(e) => {
            if (window.location.pathname !== item.path) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
          <span style={{ fontWeight: 500 }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}