// src/components/LeftSidebar.jsx - SIMPLIFIED VERSION
import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function LeftSidebar({ session, isMobile, onNavigate }) {
  const navigate = useNavigate()
  
  console.log('📌 LeftSidebar rendering with session:', !!session)

  // If no session, don't render
  if (!session) {
    return null
  }

  const menuItems = [
    { icon: 'fas fa-home', label: 'Home', path: '/' },
    { icon: 'fas fa-search', label: 'Search', path: '/search' },
    { icon: 'fas fa-music', label: 'Music', path: '/music' },
    { icon: 'fas fa-video', label: 'Videos', path: '/live' },
    { icon: 'fas fa-calendar', label: 'Events', path: '/events' },
    { icon: 'fas fa-users', label: 'Groups', path: '/groups' },
    { icon: 'fas fa-store', label: 'Marketplace', path: '/marketplace' },
    { icon: 'fas fa-envelope', label: 'Messages', path: '/messages' },
    { icon: 'fas fa-user', label: 'Profile', path: `/profile/${session.user.id}` },
    { icon: 'fas fa-cog', label: 'Settings', path: '/settings' },
  ]

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '4px',
      width: '100%'
    }}>
      {menuItems.map((item) => (
        <div
          key={item.path}
          onClick={() => {
            navigate(item.path)
            if (onNavigate) onNavigate()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background 0.2s',
            color: '#333',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <i className={item.icon} style={{ width: '20px', fontSize: '18px' }}></i>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}