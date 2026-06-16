// src/components/Layout.jsx
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'

export default function Layout({ children, session }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  
  // Check if current page is auth page (login or register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  
  // If on auth page, render only children with no layout
  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          transition: 'transform 0.2s'
        }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="fas fa-bars" style={{ color: 'white', fontSize: '20px' }}></i>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 999,
          display: 'flex',
          justifyContent: 'flex-start'
        }} onClick={() => setIsMobileMenuOpen(false)}>
          <div style={{
            width: '280px',
            height: '100%',
            background: 'white',
            overflowY: 'auto',
            padding: '20px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="circle-logo" style={{ margin: '0' }}>S</div>
              <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <LeftSidebar session={session} isMobile={true} onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="main-container">
        {/* Left Sidebar - Desktop */}
        {!isMobile && <LeftSidebar session={session} />}
        
        {/* Main Feed Container */}
        <div className="feed-container">
          {children}
        </div>
        
        {/* Right Sidebar - Desktop */}
        {!isMobile && <RightSidebar session={session} />}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderTop: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px 0',
          zIndex: 100
        }}>
          <div className="header-icon" onClick={() => window.location.href = '/'}>
            <i className="fas fa-home"></i>
          </div>
          <div className="header-icon" onClick={() => window.location.href = '/search'}>
            <i className="fas fa-search"></i>
          </div>
          <div className="header-icon" onClick={() => window.location.href = '/notifications'}>
            <i className="fas fa-bell"></i>
            <span className="badge">3</span>
          </div>
          <div className="header-icon" onClick={() => window.location.href = '/messages'}>
            <i className="fas fa-envelope"></i>
            <span className="badge">5</span>
          </div>
          <div className="profile-icon" style={{ width: '36px', height: '36px' }} onClick={() => window.location.href = '/profile'}>
            <img 
              src={session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=000&color=fff`} 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              alt="avatar"
            />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .main-container {
            margin-bottom: 60px;
          }
          .feed-container {
            padding: 12px;
          }
          .create-post-box {
            margin-bottom: 12px;
          }
          .post-card {
            margin-bottom: 12px;
            padding: 12px;
          }
          .stories-wrapper {
            padding: 12px;
          }
          .story-card {
            min-width: 80px;
            height: 140px;
          }
          .story-avatar {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }
          .story-preview {
            font-size: 10px;
          }
        }
      `}</style>
    </>
  )
}