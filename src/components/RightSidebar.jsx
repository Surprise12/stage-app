// src/components/RightSidebar.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RightSidebar({ session }) {
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [trendingTopics, setTrendingTopics] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [collapsedWidgets, setCollapsedWidgets] = useState({})
  const [widgetOrder, setWidgetOrder] = useState(['suggestions', 'requests', 'trending', 'birthdays', 'sponsors'])
  const [showCustomize, setShowCustomize] = useState(false)
  const [followedSuggestions, setFollowedSuggestions] = useState([])

  useEffect(() => {
    loadSuggestions()
    loadFriendRequests()
    loadTrending()
    loadBirthdays()
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
      .select('id, username, display_name, avatar_url, is_verified, bio, followers_count')
      .neq('id', session?.user?.id)
      .limit(6)
    if (data) setSuggestions(data)
  }

  async function loadFriendRequests() {
    const { data } = await supabase
      .from('friend_requests')
      .select('*, sender:sender_id(id, username, display_name, avatar_url, is_verified)')
      .eq('receiver_id', session?.user?.id)
      .eq('status', 'pending')
      .limit(3)
    if (data) setFriendRequests(data)
  }

  async function loadTrending() {
    const { data } = await supabase
      .from('trending_topics')
      .select('*')
      .order('score', { ascending: false })
      .limit(5)
    if (data && data.length > 0) {
      setTrendingTopics(data)
    } else {
      setTrendingTopics([
        { topic: '#NewMusicFriday', posts: '12.5K', change: '+245%' },
        { topic: '#BeatMaking', posts: '8.2K', change: '+189%' },
        { topic: '#StudioSession', posts: '5.1K', change: '+156%' },
        { topic: '#ProducerLife', posts: '3.8K', change: '+89%' },
        { topic: '#LiveStreaming', posts: '2.9K', change: '+67%' }
      ])
    }
  }

  async function loadBirthdays() {
    // In production, load from database
    setBirthdays([
      { id: 1, name: 'Sarah Chen', username: 'sarahchen', avatar: 'S', date: 'Today' },
      { id: 2, name: 'Marcus Webb', username: 'marcuswebb', avatar: 'M', date: 'Tomorrow' },
      { id: 3, name: 'Elena Rodriguez', username: 'elenarodriguez', avatar: 'E', date: 'In 3 days' }
    ])
  }

  async function handleFollow(userId) {
    await supabase
      .from('follows')
      .insert({ follower_id: session.user.id, following_id: userId })
    
    setFollowedSuggestions([...followedSuggestions, userId])
    loadSuggestions()
  }

  async function handleAccept(requestId) {
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
    loadFriendRequests()
  }

  async function handleDecline(requestId) {
    await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId)
    loadFriendRequests()
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
          {suggestions.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '12px' }}>No suggestions</p>
          ) : (
            suggestions.slice(0, 5).map(user => (
              <div key={user.id} className="suggestion-item" onClick={() => navigate(`/profile/${user.id}`)}>
                <div className="suggestion-avatar">
                  <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div className="suggestion-info">
                  <div className="suggestion-name">
                    {user.display_name || user.username}
                    {user.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                  </div>
                  <div className="suggestion-meta">{user.followers_count || 0} followers</div>
                </div>
                <button 
                  className="follow-btn" 
                  onClick={(e) => { e.stopPropagation(); handleFollow(user.id) }}
                  disabled={followedSuggestions.includes(user.id)}
                >
                  {followedSuggestions.includes(user.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          )}
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
            <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '16px' }}>No pending requests</p>
          ) : (
            friendRequests.map(req => (
              <div key={req.id} className="request-item" onClick={() => navigate(`/profile/${req.sender?.id}`)}>
                <div className="request-avatar">
                  <img src={req.sender?.avatar_url || `https://ui-avatars.com/api/?name=${(req.sender?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div className="request-info">
                  <div className="request-name">
                    {req.sender?.display_name || req.sender?.username}
                    {req.sender?.is_verified && <span style={{ color: '#1da1f2' }}>✓</span>}
                  </div>
                  <div className="request-mutual">Mutual friends</div>
                </div>
                <div className="request-buttons">
                  <button className="request-btn accept" onClick={(e) => { e.stopPropagation(); handleAccept(req.id) }}>✓</button>
                  <button className="request-btn decline" onClick={(e) => { e.stopPropagation(); handleDecline(req.id) }}>✗</button>
                </div>
              </div>
            ))
          )}
          <div className="see-all" onClick={() => navigate('/friends')}>See all →</div>
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
              <span className={`trending-change ${topic.change?.startsWith('+') ? 'positive' : ''}`}>{topic.change}</span>
            </div>
          ))}
        </div>
      )
    },
    birthdays: {
      title: 'Birthdays 🎂',
      icon: '🎂',
      content: (
        <div>
          {birthdays.map(birthday => (
            <div key={birthday.id} className="birthday-item" onClick={() => navigate(`/profile/${birthday.username}`)}>
              <div className="birthday-icon">🎂</div>
              <div className="birthday-info">
                <div className="birthday-name">{birthday.name}</div>
                <div className="birthday-date">{birthday.date}</div>
              </div>
              <button className="birthday-wish-btn" onClick={(e) => { e.stopPropagation(); alert(`🎉 Birthday wish sent to ${birthday.name}!`); }}>Wish</button>
            </div>
          ))}
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
          <div className="sponsor-icon"><i className="fab fa-nike"></i></div>
          <div className="sponsor-icon"><i className="fab fa-adidas"></i></div>
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
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
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
            {widgetOrder.map((widgetId, index) => {
              const widget = widgets[widgetId]
              return (
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
                  <span style={{ flex: 1 }}>{widget?.title || widgetId}</span>
                  <button 
                    className="widget-toggle"
                    onClick={() => toggleWidget(widgetId)}
                    style={{ 
                      background: collapsedWidgets[widgetId] ? '#e0e0e0' : '#000',
                      color: 'white',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    {collapsedWidgets[widgetId] ? 'Show' : 'Hide'}
                  </button>
                </div>
              )
            })}
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
          border-bottom: 1px solid #f0f2f5;
          cursor: pointer;
          transition: background 0.2s;
        }
        .trending-item:hover {
          background: #f5f5f5;
          margin: 0 -8px;
          padding-left: 8px;
          padding-right: 8px;
          border-radius: 8px;
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
          background: #e4e6eb !important;
        }
        .icon-btn:hover {
          color: #000 !important;
        }
        .birthday-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          cursor: pointer;
          border-bottom: 1px solid #f0f2f5;
          transition: background 0.2s;
        }
        .birthday-item:hover {
          background: #f5f5f5;
          margin: 0 -8px;
          padding-left: 8px;
          padding-right: 8px;
          border-radius: 8px;
        }
        .birthday-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .birthday-info {
          flex: 1;
        }
        .birthday-name {
          font-weight: bold;
          font-size: 14px;
        }
        .birthday-date {
          font-size: 11px;
          color: #666;
        }
        .birthday-wish-btn {
          background: #000;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }
        .birthday-wish-btn:hover {
          background: #333;
        }
        .sponsors-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: flex-start;
          padding: 4px 0;
        }
        .sponsor-icon {
          width: 48px;
          height: 48px;
          background: #f8f9fa;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #333;
          cursor: pointer;
          border: 1px solid #e0e0e0;
          transition: all 0.2s;
        }
        .sponsor-icon:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          border-color: #000;
        }
      `}</style>
    </div>
  )
}