// src/components/LeftSidebar.jsx
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
  const [isResizing, setIsResizing] = useState(false)
  const [artistHubOpen, setArtistHubOpen] = useState(false)

  // Load saved preferences
  useEffect(() => {
    if (session?.user?.id) {
      loadCustomShortcuts()
      loadSidebarPreferences()
    }
  }, [session])

  async function loadCustomShortcuts() {
    const { data } = await supabase
      .from('user_shortcuts')
      .select('*')
      .eq('user_id', session?.user?.id)
      .order('order', { ascending: true })
    if (data) setCustomShortcuts(data)
  }

  async function loadSidebarPreferences() {
    const { data } = await supabase
      .from('user_preferences')
      .select('sidebar_width, collapsed_sections')
      .eq('user_id', session?.user?.id)
      .single()
    if (data) {
      setSidebarWidth(data.sidebar_width || 280)
      setCollapsedSections(data.collapsed_sections || { navigation: false, shortcuts: false, sponsors: false })
    }
  }

  async function saveSidebarPreferences() {
    if (!session?.user?.id) return
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        sidebar_width: sidebarWidth,
        collapsed_sections: collapsedSections,
        updated_at: new Date().toISOString()
      })
  }

  async function addCustomShortcut() {
    if (!newShortcut.name || !newShortcut.path) return
    
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
  }

  async function removeShortcut(id) {
    await supabase.from('user_shortcuts').delete().eq('id', id)
    setCustomShortcuts(customShortcuts.filter(s => s.id !== id))
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

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/', color: '#7c3aed' },
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
    { icon: '🔔', label: 'Notifications', path: '/notifications', color: '#f59e0b' },
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
    <div 
      className="left-sidebar" 
      style={{ 
        width: isMobile ? '100%' : `${sidebarWidth}px`, 
        position: isMobile ? 'relative' : 'sticky',
        padding: isMobile ? '16px' : '20px 12px'
      }}
    >
      {/* Resize Handle - Desktop only */}
      {!isMobile && (
        <div 
          className="resize-handle"
          onMouseDown={startResizing}
          style={{
            position: 'absolute',
            right: '-4px',
            top: 0,
            bottom: 0,
            width: '8px',
            cursor: 'ew-resize',
            background: 'transparent',
            zIndex: 10
          }}
        />
      )}
      
      {/* Live Now Button */}
      <div className="live-now-btn" onClick={() => handleNavigate('/live')}>
        <div className="live-dot"></div>
        <span>Live Now</span>
        <span className="live-count">5</span>
      </div>

      {/* Artist Hub Section */}
      <div className="artist-hub-section">
        <div 
          className="artist-hub-header" 
          onClick={() => setArtistHubOpen(!artistHubOpen)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="sidebar-icon"><i className="fas fa-microphone-alt"></i></div>
            <span>Artist Hub</span>
          </div>
          <i className={`fas fa-chevron-${artistHubOpen ? 'up' : 'down'}`} style={{ transition: 'transform 0.3s ease', color: '#666' }}></i>
        </div>
        {artistHubOpen && (
          <div className="artist-hub-dropdown show" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', padding: '8px 0', maxHeight: '500px', overflowY: 'auto' }}>
            {artistHubItems.map((item, idx) => (
              <div key={idx} className="artist-hub-item" onClick={item.onClick}>
                <i className={item.icon}></i> {item.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="sidebar-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection('navigation')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <span className="section-title">MAIN MENU</span>
          <i className={`fas fa-chevron-${collapsedSections.navigation ? 'right' : 'down'}`} style={{ fontSize: '12px' }}></i>
        </div>
        {!collapsedSections.navigation && (
          <>
            {menuItems.map((item, index) => (
              <div 
                key={index}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
              >
                <div className="sidebar-icon">{item.icon}</div>
                <span>{item.label}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="divider"></div>
      
      {/* Section Title */}
      <div className="section-title">Your shortcuts</div>

      {/* Quick Profiles */}
      {quickProfiles.map((profile, index) => (
        <div 
          key={index}
          className="sidebar-item" 
          onClick={() => handleNavigate(`/profile/${profile.username}`)}
        >
          <div className="sidebar-icon">{profile.avatar}</div>
          <span>{profile.name}</span>
          <span className={`profile-type-badge type-${profile.type}`}>{profile.badge}</span>
        </div>
      ))}

      {/* Custom Shortcuts */}
      <div className="sidebar-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection('shortcuts')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <span className="section-title">CUSTOM SHORTCUTS</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <i className="fas fa-plus" style={{ fontSize: '12px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowAddShortcut(true) }}></i>
            <i className={`fas fa-chevron-${collapsedSections.shortcuts ? 'right' : 'down'}`} style={{ fontSize: '12px' }}></i>
          </div>
        </div>
        {!collapsedSections.shortcuts && (
          <>
            {customShortcuts.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#888', fontSize: '12px', textAlign: 'center' }}>
                No custom shortcuts yet. Click + to add.
              </div>
            ) : (
              customShortcuts.map((shortcut, index) => (
                <div 
                  key={shortcut.id}
                  className="sidebar-item custom-shortcut"
                  onClick={() => handleNavigate(shortcut.path)}
                  style={{ position: 'relative' }}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
                    reorderShortcuts(dragIndex, index)
                  }}
                >
                  <div className="sidebar-icon">{shortcut.icon}</div>
                  <span>{shortcut.name}</span>
                  <button 
                    className="remove-shortcut"
                    onClick={(e) => { e.stopPropagation(); removeShortcut(shortcut.id) }}
                    style={{ 
                      position: 'absolute', 
                      right: '8px', 
                      opacity: 0, 
                      transition: 'opacity 0.2s', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      color: '#999'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
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
      <div className="sponsors-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection('sponsors')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <div className="sponsors-title">SPONSORS</div>
          <i className={`fas fa-chevron-${collapsedSections.sponsors ? 'right' : 'down'}`} style={{ fontSize: '12px' }}></i>
        </div>
        {!collapsedSections.sponsors && (
          <div className="sponsors-row">
            {sponsorIcons.map((sponsor, idx) => (
              <div key={idx} className="sponsor-icon" title={sponsor.name}>
                <i className={sponsor.icon}></i>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Shortcut Modal */}
      {showAddShortcut && (
        <div className="modal active" onClick={() => setShowAddShortcut(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add Shortcut</div>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Shortcut Name"
              value={newShortcut.name}
              onChange={(e) => setNewShortcut({...newShortcut, name: e.target.value})}
            />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Icon (emoji)"
              value={newShortcut.icon}
              onChange={(e) => setNewShortcut({...newShortcut, icon: e.target.value})}
            />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Path (e.g., /profile)"
              value={newShortcut.path}
              onChange={(e) => setNewShortcut({...newShortcut, path: e.target.value})}
            />
            <button className="apply-btn" onClick={addCustomShortcut}>Add Shortcut</button>
            <button className="secondary-btn" style={{ marginTop: '8px', width: '100%' }} onClick={() => setShowAddShortcut(false)}>Cancel</button>
          </div>
        </div>
      )}

      <style>{`
        .sidebar-item.custom-shortcut:hover .remove-shortcut {
          opacity: 1 !important;
        }
        .resize-handle:hover {
          background: rgba(124, 58, 237, 0.3);
        }
        .artist-hub-dropdown {
          display: none;
        }
        .artist-hub-dropdown.show {
          display: grid;
        }
      `}</style>
    </div>
  )
}