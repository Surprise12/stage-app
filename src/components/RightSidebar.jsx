// src/components/RightSidebar.jsx (Updated with Customization)
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RightSidebar({ session }) {
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [trendingTopics, setTrendingTopics] = useState([])
  const [collapsedWidgets, setCollapsedWidgets] = useState({})
  const [widgetOrder, setWidgetOrder] = useState(['suggestions', 'requests', 'trending', 'birthdays', 'sponsors'])
  const [showCustomize, setShowCustomize] = useState(false)

  useEffect(() => {
    loadSuggestions()
    loadFriendRequests()
    loadTrending()
    loadWidgetPreferences()
  }, [])

  async function loadWidgetPreferences() {
    const { data } = await supabase
      .from('user_preferences')
      .select('right_sidebar_widgets, right_sidebar_order')
      .eq('user_id', session?.user?.id)
      .single()
    if (data) {
      if (data.right_sidebar_widgets) setCollapsedWidgets(data.right_sidebar_widgets)
      if (data.right_sidebar_order) setWidgetOrder(data.right_sidebar_order)
    }
  }

  async function saveWidgetPreferences() {
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: session.user.id,
        right_sidebar_widgets: collapsedWidgets,
        right_sidebar_order: widgetOrder,
        updated_at: new Date().toISOString()
      })
  }

  async function loadSuggestions() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, is_verified')
      .neq('id', session?.user?.id)
      .limit(5)
    if (data) setSuggestions(data)
  }

  async function loadFriendRequests() {
    const { data } = await supabase
      .from('friend_requests')
      .select('*, sender:sender_id(id, username, display_name, avatar_url)')
      .eq('receiver_id', session?.user?.id)
      .eq('status', 'pending')
      .limit(3)
    if (data) setFriendRequests(data)
  }

  async function loadTrending() {
    // Get trending topics from database
    const { data } = await supabase
      .from('trending_topics')
      .select('*')
      .order('score', { ascending: false })
      .limit(5)
    if (data) {
      setTrendingTopics(data)
    } else {
      // Mock data
      setTrendingTopics([
        { topic: '#NewMusicFriday', posts: '12.5K', change: '+245%' },
        { topic: '#BeatMaking', posts: '8.2K', change: '+189%' },
        { topic: '#StudioSession', posts: '5.1K', change: '+156%' }
      ])
    }
  }

  const toggleWidget = (widget) => {
    setCollapsedWidgets(prev => ({
      ...prev,
      [widget]: !prev[widget]
    }))
    saveWidgetPreferences()
  }

  const moveWidget = (fromIndex, toIndex) => {
    const newOrder = [...widgetOrder]
    const [moved] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, moved)
    setWidgetOrder(newOrder)
    saveWidgetPreferences()
  }

  const widgets = {
    suggestions: {
      title: 'Suggested for You',
      icon: '👥',
      content: (
        <div>
          {suggestions.map(user => (
            <div key={user.id} className="suggestion-item" onClick={() => navigate(`/profile/${user.id}`)}>
              <div className="suggestion-avatar">
                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              </div>
              <div className="suggestion-info">
                <div className="suggestion-name">{user.display_name || user.username}</div>
                <div className="suggestion-meta">Suggested for you</div>
              </div>
              <button className="follow-btn">Follow</button>
            </div>
          ))}
          <div className="see-all" onClick={() => navigate('/friends')}>See all suggestions →</div>
        </div>
      )
    },
    requests: {
      title: 'Friend Requests',
      icon: '💌',
      content: (
        <div>
          {friendRequests.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '12px' }}>No pending requests</p>
          ) : (
            friendRequests.map(req => (
              <div key={req.id} className="request-item" onClick={() => navigate(`/profile/${req.sender?.id}`)}>
                <div className="request-avatar">
                  <img src={req.sender?.avatar_url || `https://ui-avatars.com/api/?name=${(req.sender?.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div className="request-info">
                  <div className="request-name">{req.sender?.display_name || req.sender?.username}</div>
                  <div className="request-mutual">Mutual friends</div>
                </div>
                <div className="request-buttons">
                  <button className="request-btn accept">✓</button>
                  <button className="request-btn decline">✗</button>
                </div>
              </div>
            ))
          )}
        </div>
      )
    },
    trending: {
      title: 'Trending Today',
      icon: '🔥',
      content: (
        <div>
          {trendingTopics.map((topic, i) => (
            <div key={i} className="trending-item" onClick={() => navigate(`/search?q=${topic.topic}`)}>
              <div className="trending-rank">{i + 1}</div>
              <div className="trending-info">
                <div className="trending-topic">{topic.topic}</div>
                <div className="trending-stats">{topic.posts} posts</div>
              </div>
              <span className="trending-change positive">{topic.change}</span>
            </div>
          ))}
        </div>
      )
    },
    birthdays: {
      title: 'Birthdays',
      icon: '🎂',
      content: (
        <div>
          <div className="birthday-item">
            <div className="birthday-icon">🎂</div>
            <div className="birthday-info">
              <div className="birthday-name">Sarah Chen</div>
              <div className="birthday-date">Today</div>
            </div>
            <button className="birthday-wish-btn">Wish</button>
          </div>
          <div className="birthday-item">
            <div className="birthday-icon">🎂</div>
            <div className="birthday-info">
              <div className="birthday-name">Marcus Webb</div>
              <div className="birthday-date">Tomorrow</div>
            </div>
            <button className="birthday-wish-btn">Remind</button>
          </div>
        </div>
      )
    },
    sponsors: {
      title: 'Sponsored',
      icon: '📢',
      content: (
        <div className="sponsors-row">
          <div className="sponsor-icon"><i className="fab fa-spotify"></i></div>
          <div className="sponsor-icon"><i className="fab fa-apple"></i></div>
          <div className="sponsor-icon"><i className="fab fa-soundcloud"></i></div>
          <div className="sponsor-icon"><i className="fab fa-bandcamp"></i></div>
        </div>
      )
    }
  }

  return (
    <div className="right-sidebar">
      {/* Customization Button */}
      <div className="customize-button" style={{ marginBottom: '12px', textAlign: 'right' }}>
        <button 
          className="icon-btn" 
          onClick={() => setShowCustomize(!showCustomize)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
          title="Customize sidebar"
        >
          <i className="fas fa-sliders-h"></i> Customize
        </button>
      </div>

      {/* Customization Modal */}
      {showCustomize && (
        <div className="modal active" onClick={() => setShowCustomize(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Customize Right Sidebar</div>
            <p style={{ color: '#888', marginBottom: '16px' }}>Drag to reorder, click to hide/show widgets</p>
            {widgetOrder.map((widgetId, index) => (
              <div 
                key={widgetId}
                className="widget-customize-item"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  cursor: 'grab'
                }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                  moveWidget(fromIndex, index)
                }}
              >
                <i className="fas fa-grip-vertical" style={{ color: '#999' }}></i>
                <span style={{ flex: 1 }}>{widgets[widgetId]?.title}</span>
                <button 
                  className="widget-toggle"
                  onClick={() => toggleWidget(widgetId)}
                  style={{ 
                    background: collapsedWidgets[widgetId] ? '#e0e0e0' : '#7c3aed',
                    color: 'white',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  {collapsedWidgets[widgetId] ? 'Show' : 'Hide'}
                </button>
              </div>
            ))}
            <button className="apply-btn" style={{ marginTop: '16px' }} onClick={() => setShowCustomize(false)}>Done</button>
          </div>
        </div>
      )}

      {/* Render Widgets in Order */}
      <div className="right-sidebar-widgets">
        {widgetOrder.map(widgetId => {
          const widget = widgets[widgetId]
          if (!widget) return null
          
          return (
            <div key={widgetId} className="suggestions-card widget">
              <div 
                className="widget-header" 
                onClick={() => toggleWidget(widgetId)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  marginBottom: collapsedWidgets[widgetId] ? '0' : '16px'
                }}
              >
                <div className="suggestions-header" style={{ marginBottom: 0 }}>
                  <span>{widget.icon} {widget.title}</span>
                </div>
                <i className={`fas fa-chevron-${collapsedWidgets[widgetId] ? 'down' : 'up'}`} style={{ color: '#999', fontSize: '12px' }}></i>
              </div>
              {!collapsedWidgets[widgetId] && widget.content}
            </div>
          )
        })}
      </div>

      <style>{`
        .trending-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }
        .trending-rank {
          width: 28px;
          height: 28px;
          background: #f0f2f5;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }
        .trending-info {
          flex: 1;
        }
        .trending-topic {
          font-weight: bold;
          font-size: 14px;
        }
        .trending-stats {
          font-size: 11px;
          color: #888;
        }
        .trending-change {
          font-size: 11px;
          font-weight: bold;
        }
        .trending-change.positive {
          color: #10b981;
        }
        .widget-customize-item:hover {
          background: #e0e0e0 !important;
        }
        .icon-btn:hover {
          color: #7c3aed !important;
        }
      `}</style>
    </div>
  )
}