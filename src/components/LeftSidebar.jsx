// src/components/LeftSidebar.jsx - UPDATED WITH GROUPS & PAGES
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LeftSidebar({ session, isMobile = false, onNavigate = null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [customShortcuts, setCustomShortcuts] = useState([])
  const [showAddShortcut, setShowAddShortcut] = useState(false)
  const [newShortcut, setNewShortcut] = useState({ name: '', icon: '', path: '' })
  const [collapsedSections, setCollapsedSections] = useState({
    navigation: false,
    shortcuts: false,
    sponsors: false,
    artistHub: false
  })
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [artistHubOpen, setArtistHubOpen] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      loadCustomShortcuts()
      loadSidebarPreferences()
    }
  }, [session])

  async function loadCustomShortcuts() {
    try {
      const { data } = await supabase
        .from('user_shortcuts')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('order', { ascending: true })
      if (data) setCustomShortcuts(data)
    } catch (error) {
      console.error('Error loading shortcuts:', error)
    }
  }

  async function loadSidebarPreferences() {
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('sidebar_width, collapsed_sections')
        .eq('user_id', session?.user?.id)
        .single()
      if (data) {
        setSidebarWidth(data.sidebar_width || 280)
        setCollapsedSections(data.collapsed_sections || { navigation: false, shortcuts: false, sponsors: false })
      }
    } catch (error) {
      console.log('No preferences found, using defaults')
    }
  }

  async function saveSidebarPreferences() {
    if (!session?.user?.id) return
    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          sidebar_width: sidebarWidth,
          collapsed_sections: collapsedSections,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  async function addCustomShortcut() {
    if (!newShortcut.name || !newShortcut.path) return
    
    try {
      const { data } = await supabase
        .from('user_shortcuts')
        .insert({
          user_id: session.user.id,
          name: newShortcut.name,
          icon: newShortcut.icon || '🔗',
          path: newShortcut.path,
          order: customShortcuts.length
        })
        .select()
        .single()
      
      if (data) {
        setCustomShortcuts([...customShortcuts, data])
        setNewShortcut({ name: '', icon: '', path: '' })
        setShowAddShortcut(false)
      }
    } catch (error) {
      console.error('Error adding shortcut:', error)
    }
  }

  async function removeShortcut(id) {
    try {
      await supabase.from('user_shortcuts').delete().eq('id', id)
      setCustomShortcuts(customShortcuts.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error removing shortcut:', error)
    }
  }

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
    saveSidebarPreferences()
  }

  const handleNavigate = (path) => {
    if (onNavigate) onNavigate()
    navigate(path)
  }

  // Inline styles
  const styles = {
    leftSidebar: {
      width: isMobile ? '100%' : `${sidebarWidth}px`,
      position: isMobile ? 'relative' : 'sticky',
      top: '20px',
      padding: isMobile ? '16px' : '20px 12px',
      background: 'white',
      borderRight: '1px solid #ddd',
      height: 'calc(100vh - 40px)',
      overflowY: 'auto',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    liveNowBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      background: '#ffebee',
      color: '#ff4444',
      fontWeight: 'bold',
      transition: 'all 0.2s',
      marginBottom: '4px'
    },
    liveDot: {
      width: '10px',
      height: '10px',
      background: '#ff4444',
      borderRadius: '50%',
      animation: 'pulse 1s infinite'
    },
    liveCount: {
      marginLeft: 'auto',
      background: '#ff4444',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '40px',
      fontSize: '11px',
      fontWeight: 'bold'
    },
    artistHubHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      color: '#333',
      transition: 'background 0.2s'
    },
    artistHubDropdown: {
      display: artistHubOpen ? 'grid' : 'none',
      gridTemplateColumns: '1fr',
      gap: '8px',
      padding: '8px 0',
      maxHeight: '500px',
      overflowY: 'auto'
    },
    artistHubItem: {
      background: '#f0f2f5',
      borderRadius: '12px',
      padding: '12px 16px',
      cursor: 'pointer',
      border: '1px solid #eee',
      transition: 'all 0.2s',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: '13px',
      color: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      minHeight: '44px'
    },
    sidebarItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '4px',
      color: '#333',
      fontWeight: 'bold',
      transition: 'all 0.2s',
      position: 'relative'
    },
    sidebarItemActive: {
      background: '#e4e6eb'
    },
    sidebarIcon: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: '#f0f2f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      flexShrink: 0
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '8px 16px'
    },
    sectionTitle: {
      padding: '8px 16px',
      color: '#999',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: 'bold'
    },
    divider: {
      height: '1px',
      background: '#eee',
      margin: '16px 0'
    },
    sponsorsSection: {
      marginTop: '20px',
      padding: '16px 0',
      borderTop: '1px solid #eee'
    },
    sponsorsTitle: {
      fontSize: '12px',
      textTransform: 'uppercase',
      color: '#999',
      letterSpacing: '0.5px',
      marginBottom: '12px',
      paddingLeft: '16px',
      fontWeight: 'bold'
    },
    sponsorsRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'flex-start',
      padding: '0 8px'
    },
    sponsorIcon: {
      width: '48px',
      height: '48px',
      background: '#f8f9fa',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      color: '#333',
      cursor: 'pointer',
      border: '1px solid #e0e0e0',
      transition: 'all 0.2s'
    },
    profileBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '40px',
      fontSize: '10px',
      fontWeight: 'bold',
      marginLeft: '6px',
      background: '#e4e6eb',
      color: '#000'
    },
    removeShortcut: {
      position: 'absolute',
      right: '8px',
      opacity: 0,
      transition: 'opacity 0.2s',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#999',
      fontSize: '14px'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    modalContent: {
      background: 'white',
      borderRadius: '24px',
      padding: '24px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px'
    },
    formInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: 'bold',
      transition: 'all 0.2s',
      outline: 'none'
    },
    applyBtn: {
      width: '100%',
      background: '#000',
      color: 'white',
      border: 'none',
      padding: '14px',
      borderRadius: '40px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    secondaryBtn: {
      width: '100%',
      background: 'white',
      border: '1px solid #ddd',
      color: '#333',
      padding: '14px',
      borderRadius: '40px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '14px',
      marginTop: '8px',
      transition: 'all 0.2s'
    },
    emptyState: {
      padding: '12px 16px',
      color: '#888',
      fontSize: '12px',
      textAlign: 'center'
    }
  }

  // ✅ UPDATED: Menu items with GROUPS and PAGES added
  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/', color: '#7c3aed' },
    { icon: '🔍', label: 'Search', path: '/search', color: '#3b82f6' },
    { icon: '👥', label: 'Friends', path: '/friends', color: '#10b981' },
    { icon: '📬', label: 'Notifications', path: '/notifications', color: '#f59e0b' },
    { icon: '📁', label: 'Groups', path: '/groups', color: '#8b5cf6' },
    { icon: '📄', label: 'Pages', path: '/pages', color: '#ec4899' },
    { icon: '🎵', label: 'Music Videos', path: '/music', color: '#ec4899' },
    { icon: '🎧', label: 'Beats', path: '/beats', color: '#f59e0b' },
    { icon: '🤝', label: 'Collab Finder', path: '/collab', color: '#10b981' },
    { icon: '🎤', label: 'Concerts', path: '/concerts', color: '#ef4444' },
    { icon: '🎙️', label: 'Studios', path: '/studios', color: '#3b82f6' },
    { icon: '🎪', label: 'Gigs', path: '/gigs', color: '#8b5cf6' },
    { icon: '👥', label: 'Collectives', path: '/collectives', color: '#f97316' },
    { icon: '🔴', label: 'Live', path: '/live', color: '#ff4444' },
    { icon: '📊', label: 'Analytics', path: '/analytics', color: '#06b6d4' },
    { icon: '🛒', label: 'Marketplace', path: '/marketplace', color: '#22c55e' },
    { icon: '📅', label: 'Events', path: '/events', color: '#a855f7' },
    { icon: '💬', label: 'Messages', path: '/messages', color: '#3b82f6' },
  ]

  const quickProfiles = [
    { name: 'Sarah Chen', username: 'sarah', avatar: 'S', type: 'artist', badge: 'ARTIST' },
    { name: 'Marcus Webb', username: 'marcus', avatar: 'M', type: 'comedian', badge: 'COMEDIAN' },
    { name: 'Elena Rodriguez', username: 'elena', avatar: 'E', type: 'manager', badge: 'MANAGER' },
    { name: 'Grand Arena', username: 'stadium', avatar: 'G', type: 'stadium', badge: 'STADIUM' },
  ]

  const artistHubItems = [
    { icon: 'fas fa-check-circle', label: 'Verified Artists', onClick: () => handleNavigate('/verified-artists') },
    { icon: 'fas fa-star', label: 'Rising Stars', onClick: () => handleNavigate('/rising-stars') },
    { icon: 'fas fa-handshake', label: 'Collaborations', onClick: () => handleNavigate('/collaborations') },
    { icon: 'fas fa-file-signature', label: 'Apply as Artist', onClick: () => handleNavigate('/artist-application') }
  ]

  const sponsorIcons = [
    { icon: 'fab fa-spotify', name: 'Spotify' },
    { icon: 'fab fa-apple', name: 'Apple Music' },
    { icon: 'fab fa-soundcloud', name: 'SoundCloud' },
    { icon: 'fab fa-bandcamp', name: 'Bandcamp' },
    { icon: 'fab fa-youtube', name: 'YouTube Music' },
    { icon: 'fab fa-tiktok', name: 'TikTok' },
    { icon: 'fab fa-instagram', name: 'Instagram' },
    { icon: 'fab fa-twitter', name: 'Twitter' }
  ]

  return (
    <div style={styles.leftSidebar}>
      {/* Live Now Button */}
      <div style={styles.liveNowBtn} onClick={() => handleNavigate('/live')}>
        <div style={styles.liveDot}></div>
        <span>Live Now</span>
        <span style={styles.liveCount}>5</span>
      </div>

      {/* Artist Hub Section */}
      <div>
        <div 
          style={styles.artistHubHeader}
          onClick={() => setArtistHubOpen(!artistHubOpen)}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={styles.sidebarIcon}><i className="fas fa-microphone-alt"></i></div>
            <span>Artist Hub</span>
          </div>
          <i className={`fas fa-chevron-${artistHubOpen ? 'up' : 'down'}`} style={{ transition: 'transform 0.3s ease', color: '#666' }}></i>
        </div>
        <div style={styles.artistHubDropdown}>
          {artistHubItems.map((item, idx) => (
            <div key={idx} style={styles.artistHubItem} onClick={item.onClick}>
              <i className={item.icon}></i> {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Main Navigation */}
      <div>
        <div style={styles.sectionHeader} onClick={() => toggleSection('navigation')}>
          <span style={styles.sectionTitle}>MAIN MENU</span>
          <i className={`fas fa-chevron-${collapsedSections.navigation ? 'right' : 'down'}`} style={{ fontSize: '12px' }}></i>
        </div>
        {!collapsedSections.navigation && (
          <>
            {menuItems.map((item, index) => (
              <div 
                key={index}
                style={{
                  ...styles.sidebarItem,
                  ...(location.pathname === item.path ? styles.sidebarItemActive : {})
                }}
                onClick={() => handleNavigate(item.path)}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.background = '#f0f2f5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div style={styles.sidebarIcon}>{item.icon}</div>
                <span>{item.label}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Divider */}
      <div style={styles.divider}></div>
      
      {/* Section Title */}
      <div style={styles.sectionTitle}>Your shortcuts</div>

      {/* Quick Profiles */}
      {quickProfiles.map((profile, index) => (
        <div 
          key={index}
          style={styles.sidebarItem}
          onClick={() => handleNavigate(`/profile/${profile.username}`)}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={styles.sidebarIcon}>{profile.avatar}</div>
          <span>{profile.name}</span>
          <span style={{...styles.profileBadge, background: profile.type === 'artist' ? '#333' : profile.type === 'comedian' ? '#555' : profile.type === 'manager' ? '#777' : '#999', color: 'white' }}>{profile.badge}</span>
        </div>
      ))}

      {/* Custom Shortcuts */}
      <div>
        <div style={styles.sectionHeader} onClick={() => toggleSection('shortcuts')}>
          <span style={styles.sectionTitle}>CUSTOM SHORTCUTS</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <i className="fas fa-plus" style={{ fontSize: '12px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowAddShortcut(true) }}></i>
            <i className={`fas fa-chevron-${collapsedSections.shortcuts ? 'right' : 'down'}`} style={{ fontSize: '12px' }}></i>
          </div>
        </div>
        {!collapsedSections.shortcuts && (
          <>
            {customShortcuts.length === 0 ? (
              <div style={styles.emptyState}>
                No custom shortcuts yet. Click + to add.
              </div>
            ) : (
              customShortcuts.map((shortcut, index) => (
                <div 
                  key={shortcut.id}
                  style={styles.sidebarItem}
                  onClick={() => handleNavigate(shortcut.path)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f0f2f5'
                    const btn = e.currentTarget.querySelector('.remove-btn')
                    if (btn) btn.style.opacity = 1
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    const btn = e.currentTarget.querySelector('.remove-btn')
                    if (btn) btn.style.opacity = 0
                  }}
                >
                  <div style={styles.sidebarIcon}>{shortcut.icon}</div>
                  <span>{shortcut.name}</span>
                  <button 
                    className="remove-btn"
                    style={styles.removeShortcut}
                    onClick={(e) => { e.stopPropagation(); removeShortcut(shortcut.id) }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Sponsors Section */}
      <div style={styles.sponsorsSection}>
        <div style={styles.sectionHeader} onClick={() => toggleSection('sponsors')}>
          <div style={styles.sponsorsTitle}>SPONSORS</div>
          <i className={`fas fa-chevron-${collapsedSections.sponsors ? 'right' : 'down'}`} style={{ fontSize: '12px' }}></i>
        </div>
        {!collapsedSections.sponsors && (
          <div style={styles.sponsorsRow}>
            {sponsorIcons.map((sponsor, idx) => (
              <div key={idx} style={styles.sponsorIcon} title={sponsor.name}>
                <i className={sponsor.icon}></i>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Shortcut Modal */}
      {showAddShortcut && (
        <div style={styles.modalOverlay} onClick={() => setShowAddShortcut(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Add Shortcut</div>
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Shortcut Name"
              value={newShortcut.name}
              onChange={(e) => setNewShortcut({...newShortcut, name: e.target.value})}
            />
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Icon (emoji)"
              value={newShortcut.icon}
              onChange={(e) => setNewShortcut({...newShortcut, icon: e.target.value})}
            />
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Path (e.g., /profile)"
              value={newShortcut.path}
              onChange={(e) => setNewShortcut({...newShortcut, path: e.target.value})}
            />
            <button 
              style={styles.applyBtn}
              onClick={addCustomShortcut}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
            >
              Add Shortcut
            </button>
            <button 
              style={styles.secondaryBtn}
              onClick={() => setShowAddShortcut(false)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}