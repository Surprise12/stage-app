// src/components/Layout.jsx - FIXED WITH INLINE STYLES
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'

export default function Layout({ children, session }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const location = useLocation()

  // Debug log
  console.log('📐 Layout rendering:', {
    hasSession: !!session,
    isAuthPage: location.pathname === '/login' || location.pathname === '/register',
    pathname: location.pathname,
    isMobile: windowWidth < 768
  })

  // Safety check - if no session, redirect to login
  useEffect(() => {
    if (!session) {
      console.log('📐 No session, redirecting to login')
      window.location.href = '/login'
    }
  }, [session])

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
  
  // If on auth page OR no session, render only children with no layout
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  if (isAuthPage || !session) {
    return <>{children}</>
  }

  // Inline styles as fallback
  const styles = {
    mainContainer: {
      display: 'flex',
      marginTop: 0,
      minHeight: 'calc(100vh - 0px)',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    },
    feedContainer: {
      flex: 1,
      maxWidth: '680px',
      margin: '0 auto',
      padding: '20px',
      width: '100%',
      background: '#f4f6fb',
      minHeight: '100vh'
    },
    mobileMenuButton: {
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
    },
    mobileMenuOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 999,
      display: 'flex',
      justifyContent: 'flex-start'
    },
    mobileMenuContent: {
      width: '280px',
      height: '100%',
      background: 'white',
      overflowY: 'auto',
      padding: '20px'
    },
    mobileBottomNav: {
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
    }
  }

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <div style={styles.mobileMenuButton}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="fas fa-bars" style={{ color: 'white', fontSize: '20px' }}></i>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div style={styles.mobileMenuOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div style={styles.mobileMenuContent} onClick={(e) => e.stopPropagation()}>
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

      <div style={styles.mainContainer}>
        {/* Left Sidebar - Desktop */}
        {!isMobile && <LeftSidebar session={session} />}
        
        {/* Main Feed Container */}
        <div style={styles.feedContainer}>
          {children}
        </div>
        
        {/* Right Sidebar - Desktop */}
        {!isMobile && <RightSidebar session={session} />}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <div style={styles.mobileBottomNav}>
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
    </>
  )
}