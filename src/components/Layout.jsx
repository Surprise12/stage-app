// src/components/Layout.jsx - UPDATED WITH TREE BAR MENU
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

  // Inline styles
  const styles = {
    mainContainer: {
      display: 'flex',
      marginTop: 0,
      minHeight: 'calc(100vh - 0px)',
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%',
      padding: '0 20px',
      gap: '20px'
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
    },
    sidebarWrapper: {
      width: '280px',
      flexShrink: 0,
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      height: 'fit-content',
      position: 'sticky',
      top: '20px'
    },
    rightSidebarWrapper: {
      width: '320px',
      flexShrink: 0,
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      height: 'fit-content',
      position: 'sticky',
      top: '20px'
    },
    feedContent: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      minHeight: '400px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
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
      zIndex: 100,
      border: '1px solid #e5e7eb'
    },
    logo: {
      fontSize: isMobile ? '20px' : '24px',
      fontWeight: '800',
      cursor: 'pointer'
    },
    logoGradient: {
      color: '#7c3aed'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    userEmail: {
      fontSize: isMobile ? '12px' : '14px',
      color: '#6b7280',
      fontWeight: '700'
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
    mobileClose: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#1f2937'
    }
  }

  // Mobile layout
  if (isMobile) {
    return (
      <>
        {/* Mobile Content */}
        <div style={{ padding: '12px', minHeight: '100vh', background: '#f4f6fb', paddingBottom: '80px' }}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.logo} onClick={() => window.location.href = '/'}>
              Social<span style={styles.logoGradient}>Vibe</span>
            </div>
            <div style={styles.headerRight}>
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
          
          {/* Content */}
          <div style={styles.feedContent}>
            {children}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div style={styles.mobileMenuOverlay} onClick={() => setIsMobileMenuOpen(false)}>
            <div style={styles.mobileMenuContent} onClick={(e) => e.stopPropagation()}>
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

        {/* Mobile Bottom Navigation Bar */}
        <div style={styles.mobileBottomNav}>
          <div onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
            <i className="fas fa-home" style={{ fontSize: '20px' }}></i>
          </div>
          <div onClick={() => window.location.href = '/search'} style={{ cursor: 'pointer' }}>
            <i className="fas fa-search" style={{ fontSize: '20px' }}></i>
          </div>
          <div onClick={() => window.location.href = '/notifications'} style={{ cursor: 'pointer', position: 'relative' }}>
            <i className="fas fa-bell" style={{ fontSize: '20px' }}></i>
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: '#ff4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '20px',
              border: '2px solid white'
            }}>3</span>
          </div>
          <div onClick={() => window.location.href = '/messages'} style={{ cursor: 'pointer', position: 'relative' }}>
            <i className="fas fa-envelope" style={{ fontSize: '20px' }}></i>
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: '#ff4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '20px',
              border: '2px solid white'
            }}>5</span>
          </div>
          <div onClick={() => window.location.href = '/profile'} style={{ cursor: 'pointer' }}>
            <img 
              src={session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=000&color=fff`} 
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
              alt="avatar"
            />
          </div>
        </div>
      </>
    )
  }

  // Desktop layout
  return (
    <div style={styles.mainContainer}>
      {/* Left Sidebar - Desktop */}
      <div style={styles.sidebarWrapper}>
        <LeftSidebar session={session} />
      </div>
      
      {/* Main Feed Container */}
      <div style={styles.feedContainer}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo} onClick={() => window.location.href = '/'}>
            Social<span style={styles.logoGradient}>Vibe</span>
          </div>
          <div style={styles.headerRight}>
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
        
        {/* Content */}
        <div style={styles.feedContent}>
          {children}
        </div>
      </div>
      
      {/* Right Sidebar - Desktop */}
      <div style={styles.rightSidebarWrapper}>
        <RightSidebar session={session} />
      </div>
    </div>
  )
}