// src/components/Layout.jsx - WITH FIXED SIDEBARS AND SCROLLABLE CENTER
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'
import TreeBarMenu from './TreeBarMenu'

export default function Layout({ children, session }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const location = useLocation()

  useEffect(() => {
    if (!session) {
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
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  
  if (isAuthPage || !session) {
    return <>{children}</>
  }

  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      background: '#f4f6fb',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    },
    // Left Sidebar - Fixed
    leftSidebar: {
      width: '280px',
      flexShrink: 0,
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'white',
      borderRight: '1px solid #e5e7eb',
      overflowY: 'auto',
      zIndex: 50,
      paddingTop: '20px'
    },
    // Right Sidebar - Fixed
    rightSidebar: {
      width: '320px',
      flexShrink: 0,
      height: '100vh',
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'white',
      borderLeft: '1px solid #e5e7eb',
      overflowY: 'auto',
      zIndex: 50,
      paddingTop: '20px'
    },
    // Center Content - Scrollable
    mainContent: {
      flex: 1,
      maxWidth: '680px',
      margin: '0 auto',
      padding: '20px',
      width: '100%',
      marginLeft: '280px', // Left sidebar width
      marginRight: '320px', // Right sidebar width
      height: '100vh',
      overflowY: 'auto',
      background: '#f4f6fb',
      paddingBottom: '60px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'white',
      padding: isMobile ? '12px 16px' : '16px 24px',
      borderRadius: '12px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      position: 'sticky',
      top: '8px',
      zIndex: 10,
      border: '1px solid #e5e7eb'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logo: {
      fontSize: isMobile ? '20px' : '24px',
      fontWeight: '800',
      cursor: 'pointer'
    },
    logoGradient: {
      color: '#7c3aed'
    },
    userEmail: {
      fontSize: isMobile ? '12px' : '14px',
      color: '#6b7280'
    },
    logoutBtn: {
      padding: isMobile ? '6px 12px' : '8px 16px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: isMobile ? '12px' : '14px',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    mobileMenuBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#1f2937',
      padding: '4px'
    },
    mobileOverlay: {
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
    mobileMenu: {
      width: '280px',
      height: '100%',
      background: 'white',
      overflowY: 'auto',
      padding: '20px'
    },
    mobileClose: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#1f2937'
    },
    // Mobile layout
    mobileContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f4f6fb',
      overflow: 'hidden'
    },
    mobileContent: {
      flex: 1,
      overflowY: 'auto',
      padding: '12px',
      paddingBottom: '80px'
    },
    mobileHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'white',
      padding: '12px 16px',
      borderRadius: '12px',
      marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      flexShrink: 0,
      border: '1px solid #e5e7eb'
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
      zIndex: 100,
      flexShrink: 0
    },
    mobileNavIcon: {
      fontSize: '20px',
      cursor: 'pointer',
      color: '#1f2937',
      padding: '4px 8px',
      borderRadius: '8px',
      transition: 'all 0.2s',
      position: 'relative'
    },
    mobileBadge: {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      background: '#ff4444',
      color: 'white',
      fontSize: '10px',
      fontWeight: '700',
      padding: '2px 6px',
      borderRadius: '20px',
      border: '2px solid white',
      minWidth: '18px',
      textAlign: 'center'
    },
    mobileProfileIcon: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      objectFit: 'cover',
      cursor: 'pointer'
    }
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div style={styles.mobileContainer}>
        {/* Mobile Header */}
        <div style={styles.mobileHeader}>
          <div style={styles.logo} onClick={() => window.location.href = '/'}>
            Social<span style={styles.logoGradient}>Vibe</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TreeBarMenu session={session} />
            <button 
              style={styles.logoutBtn}
              onClick={() => {
                supabase.auth.signOut()
                window.location.href = '/login'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              Logout
            </button>
            <button style={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>

        {/* Mobile Content - Scrollable */}
        <div style={styles.mobileContent}>
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <div style={styles.mobileBottomNav}>
          <div style={styles.mobileNavIcon} onClick={() => window.location.href = '/'}>
            <i className="fas fa-home"></i>
          </div>
          <div style={styles.mobileNavIcon} onClick={() => window.location.href = '/search'}>
            <i className="fas fa-search"></i>
          </div>
          <div style={styles.mobileNavIcon} onClick={() => window.location.href = '/notifications'}>
            <i className="fas fa-bell"></i>
            <span style={styles.mobileBadge}>3</span>
          </div>
          <div style={styles.mobileNavIcon} onClick={() => window.location.href = '/messages'}>
            <i className="fas fa-envelope"></i>
            <span style={styles.mobileBadge}>5</span>
          </div>
          <div onClick={() => window.location.href = '/profile'}>
            <img 
              src={session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=000&color=fff`} 
              style={styles.mobileProfileIcon} 
              alt="avatar"
            />
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div style={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)}>
            <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: '800' }}>
                  Social<span style={{ color: '#7c3aed' }}>Vibe</span>
                </div>
                <button style={styles.mobileClose} onClick={() => setIsMobileMenuOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <LeftSidebar session={session} isMobile={true} onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={styles.container}>
      {/* Left Sidebar - Fixed */}
      <div style={styles.leftSidebar}>
        <LeftSidebar session={session} />
      </div>
      
      {/* Main Content - Scrollable Center */}
      <div style={styles.mainContent}>
        {/* Header - Sticky */}
        <div style={styles.header}>
          <div style={styles.logo} onClick={() => window.location.href = '/'}>
            Social<span style={styles.logoGradient}>Vibe</span>
          </div>
          <div style={styles.headerContent}>
            <span style={styles.userEmail}>👋 {session?.user?.email}</span>
            <TreeBarMenu session={session} />
            <button 
              style={styles.logoutBtn}
              onClick={() => {
                supabase.auth.signOut()
                window.location.href = '/login'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Children Content - Scrolls */}
        {children}
      </div>
      
      {/* Right Sidebar - Fixed */}
      <div style={styles.rightSidebar}>
        <RightSidebar session={session} />
      </div>
    </div>
  )
}