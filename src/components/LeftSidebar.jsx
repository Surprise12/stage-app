// src/components/LeftSidebar.jsx (Updated with Customization)
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LeftSidebar({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [customShortcuts, setCustomShortcuts] = useState([])
  const [showAddShortcut, setShowAddShortcut] = useState(false)
  const [newShortcut, setNewShortcut] = useState({ name: '', icon: '', path: '' })
  const [collapsedSections, setCollapsedSections] = useState({})
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)

  // Load saved preferences
  useEffect(() => {
    loadCustomShortcuts()
    loadSidebarPreferences()
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
      setCollapsedSections(data.collapsed_sections || {})
    }
  }

  async function saveSidebarPreferences() {
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

  async function reorderShortcuts(dragIndex, hoverIndex) {
    const reordered = [...customShortcuts]
    const dragged = reordered[dragIndex]
    reordered.splice(dragIndex, 1)
    reordered.splice(hoverIndex, 0, dragged)
    
    // Update order in database
    for (let i = 0; i < reordered.length; i++) {
      await supabase
        .from('user_shortcuts')
        .update({ order: i })
        .eq('id', reordered[i].id)
    }
    setCustomShortcuts(reordered)
  }

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
    saveSidebarPreferences()
  }

  const startResizing = (e) => {
    setIsResizing(true)
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResizing)
  }

  const handleResize = (e) => {
    if (isResizing) {
      const newWidth = Math.min(Math.max(e.clientX, 200), 400)
      setSidebarWidth(newWidth)
    }
  }

  const stopResizing = () => {
    setIsResizing(false)
    saveSidebarPreferences()
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResizing)
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
  ]

  return (
    <div 
      className="left-sidebar" 
      style={{ width: `${sidebarWidth}px`, position: 'relative' }}
    >
      {/* Resize Handle */}
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
      
      {/* Live Now Button */}
      <div className="live-now-btn" onClick={() => navigate('/live')}>
        <div className="live-dot"></div>
        <span>Live Now</span>
        <span className="live-count">5</span>
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
        {!collapsedSections.navigation && menuItems.map((item, index) => (
          <div 
            key={index}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <div className="sidebar-icon">{item.icon}</div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Custom Shortcuts */}
      <div className="sidebar-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection('shortcuts')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <span className="section-title">YOUR SHORTCUTS</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <i className="fas fa-plus" style={{ fontSize: '12px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowAddShortcut(true) }}></i>
            <i className={`fas fa-chevron-${collapsedSections.shortcuts ? 'right' : 'down'}`} style={{ fontSize: '12px' }}></i>
          </div>
        </div>
        {!collapsedSections.shortcuts && (
          <>
            {customShortcuts.map((shortcut, index) => (
              <div 
                key={shortcut.id}
                className="sidebar-item custom-shortcut"
                onClick={() => navigate(shortcut.path)}
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
                  style={{ position: 'absolute', right: '8px', opacity: 0, transition: 'opacity 0.2s', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                >
                  ✕
                </button>
              </div>
            ))}
          </>
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

      {/* Sponsors Section */}
      <div className="sidebar-section">
        <div 
          className="section-header" 
          onClick={() => toggleSection('sponsors')}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <span className="section-title">SPONSORS</span>
          <i className={`fas fa-chevron-${collapsedSections.sponsors ? 'right' : 'down'}`} style={{ fontSize: '12px' }}></i>
        </div>
        {!collapsedSections.sponsors && (
          <div className="sponsors-row">
            <div className="sponsor-icon"><i className="fab fa-spotify"></i></div>
            <div className="sponsor-icon"><i className="fab fa-apple"></i></div>
            <div className="sponsor-icon"><i className="fab fa-soundcloud"></i></div>
            <div className="sponsor-icon"><i className="fab fa-bandcamp"></i></div>
          </div>
        )}
      </div>

      <style>{`
        .sidebar-item.custom-shortcut:hover .remove-shortcut {
          opacity: 1 !important;
        }
        .resize-handle:hover {
          background: rgba(124, 58, 237, 0.3);
        }
      `}</style>
    </div>
  )
}