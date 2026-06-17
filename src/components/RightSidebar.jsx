// src/components/RightSidebar.jsx - FIXED WITH INLINE STYLES
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
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('right_sidebar_widgets, right_sidebar_order')
        .eq('user_id', session?.user?.id)
        .single()
      if (data) {
        if (data.right_sidebar_widgets) setCollapsedWidgets(data.right_sidebar_widgets)
        if (data.right_sidebar_order) setWidgetOrder(data.right_sidebar_order)
      }
    } catch (error) {
      console.log('No preferences found, using defaults')
    }
  }

  async function saveWidgetPreferences() {
    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: session.user.id,
          right_sidebar_widgets: collapsedWidgets,
          right_sidebar_order: widgetOrder,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  async function loadSuggestions() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified, bio, followers_count')
        .neq('id', session?.user?.id)
        .limit(6)
      if (data) setSuggestions(data)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  async function loadFriendRequests() {
    try {
      const { data } = await supabase
        .from('friend_requests')
        .select('*, sender:sender_id(id, username, display_name, avatar_url, is_verified)')
        .eq('receiver_id', session?.user?.id)
        .eq('status', 'pending')
        .limit(3)
      if (data) setFriendRequests(data)
    } catch (error) {
      console.error('Error loading friend requests:', error)
    }
  }

  async function loadTrending() {
    try {
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
    } catch (error) {
      console.error('Error loading trending:', error)
    }
  }

  async function loadBirthdays() {
    setBirthdays([
      { id: 1, name: 'Sarah Chen', username: 'sarahchen', avatar: 'S', date: 'Today' },
      { id: 2, name: 'Marcus Webb', username: 'marcuswebb', avatar: 'M', date: 'Tomorrow' },
      { id: 3, name: 'Elena Rodriguez', username: 'elenarodriguez', avatar: 'E', date: 'In 3 days' }
    ])
  }

  async function handleFollow(userId) {
    try {
      await supabase
        .from('follows')
        .insert({ follower_id: session.user.id, following_id: userId })
      setFollowedSuggestions([...followedSuggestions, userId])
      loadSuggestions()
    } catch (error) {
      console.error('Error following:', error)
    }
  }

  async function handleAccept(requestId) {
    try {
      await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)
      loadFriendRequests()
    } catch (error) {
      console.error('Error accepting:', error)
    }
  }

  async function handleDecline(requestId) {
    try {
      await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
      loadFriendRequests()
    } catch (error) {
      console.error('Error declining:', error)
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

  // Inline styles
  const styles = {
    rightSidebar: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    widgetCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      width: '100%'
    },
    widgetHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      marginBottom: '0'
    },
    widgetTitle: {
      fontWeight: 'bold',
      fontSize: '15px',
      color: '#000'
    },
    suggestionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'background 0.2s',
      marginBottom: '4px'
    },
    suggestionAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '16px',
      flexShrink: 0,
      overflow: 'hidden'
    },
    suggestionInfo: {
      flex: 1,
      minWidth: 0
    },
    suggestionName: {
      fontWeight: 'bold',
      fontSize: '14px',
      color: '#000',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    suggestionMeta: {
      fontSize: '11px',
      color: '#666'
    },
    followBtn: {
      padding: '4px 14px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.2s'
    },
    followBtnFollowing: {
      padding: '4px 14px',
      background: '#666',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      cursor: 'default',
      flexShrink: 0
    },
    seeAll: {
      color: '#000',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 'bold',
      marginTop: '8px',
      textAlign: 'center'
    },
    requestItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px',
      borderRadius: '8px',
      marginBottom: '8px',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    requestAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#666',
      flexShrink: 0,
      overflow: 'hidden'
    },
    requestInfo: {
      flex: 1,
      minWidth: 0
    },
    requestName: {
      fontWeight: 'bold',
      fontSize: '14px'
    },
    requestMutual: {
      fontSize: '11px',
      color: '#666'
    },
    requestButtons: {
      display: 'flex',
      gap: '6px',
      flexShrink: 0
    },
    requestBtnAccept: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      background: '#000',
      color: 'white',
      transition: 'all 0.2s'
    },
    requestBtnDecline: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      background: '#eee',
      color: '#666',
      transition: 'all 0.2s'
    },
    trendingItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 0',
      borderBottom: '1px solid #f0f2f5',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    trendingRank: {
      width: '28px',
      height: '28px',
      background: '#f0f2f5',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '12px',
      flexShrink: 0
    },
    trendingInfo: {
      flex: 1
    },
    trendingTopic: {
      fontWeight: 'bold',
      fontSize: '14px'
    },
    trendingStats: {
      fontSize: '11px',
      color: '#888'
    },
    trendingChange: {
      fontSize: '11px',
      fontWeight: 'bold'
    },
    trendingChangePositive: {
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#10b981'
    },
    birthdayItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 0',
      borderBottom: '1px solid #f0f2f5',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    birthdayIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#f0f2f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0
    },
    birthdayInfo: {
      flex: 1
    },
    birthdayName: {
      fontWeight: 'bold',
      fontSize: '14px'
    },
    birthdayDate: {
      fontSize: '11px',
      color: '#666'
    },
    birthdayWishBtn: {
      background: '#000',
      color: 'white',
      border: 'none',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'background 0.2s'
    },
    sponsorsRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      justifyContent: 'flex-start',
      padding: '4px 0'
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
    customizeBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#666',
      fontSize: '13px',
      padding: '4px 8px',
      borderRadius: '6px',
      transition: 'all 0.2s'
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
      maxWidth: '400px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px'
    },
    widgetCustomizeItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '8px',
      cursor: 'grab'
    },
    widgetToggle: {
      background: '#000',
      color: 'white',
      border: 'none',
      padding: '4px 12px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '11px'
    },
    widgetToggleHidden: {
      background: '#e0e0e0',
      color: 'white',
      border: 'none',
      padding: '4px 12px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '11px'
    },
    emptyState: {
      color: '#888',
      fontSize: '13px',
      textAlign: 'center',
      padding: '16px'
    }
  }

  const widgets = {
    suggestions: {
      title: 'Suggested for You',
      icon: '👥',
      content: (
        <div>
          {suggestions.length === 0 ? (
            <p style={styles.emptyState}>No suggestions</p>
          ) : (
            suggestions.slice(0, 5).map(user => (
              <div key={user.id} style={styles.suggestionItem} onClick={() => navigate(`/profile/${user.id}`)}>
                <div style={styles.suggestionAvatar}>
                  <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div style={styles.suggestionInfo}>
                  <div style={styles.suggestionName}>
                    {user.display_name || user.username}
                    {user.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                  </div>
                  <div style={styles.suggestionMeta}>{user.followers_count || 0} followers</div>
                </div>
                <button 
                  style={followedSuggestions.includes(user.id) ? styles.followBtnFollowing : styles.followBtn}
                  onClick={(e) => { e.stopPropagation(); handleFollow(user.id) }}
                  disabled={followedSuggestions.includes(user.id)}
                >
                  {followedSuggestions.includes(user.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          )}
          <div style={styles.seeAll} onClick={() => navigate('/friends')}>See all suggestions →</div>
        </div>
      )
    },
    requests: {
      title: 'Friend Requests',
      icon: '💌',
      content: (
        <div>
          {friendRequests.length === 0 ? (
            <p style={styles.emptyState}>No pending requests</p>
          ) : (
            friendRequests.map(req => (
              <div key={req.id} style={styles.requestItem} onClick={() => navigate(`/profile/${req.sender?.id}`)}>
                <div style={styles.requestAvatar}>
                  <img src={req.sender?.avatar_url || `https://ui-avatars.com/api/?name=${(req.sender?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div style={styles.requestInfo}>
                  <div style={styles.requestName}>
                    {req.sender?.display_name || req.sender?.username}
                    {req.sender?.is_verified && <span style={{ color: '#1da1f2' }}>✓</span>}
                  </div>
                  <div style={styles.requestMutual}>Mutual friends</div>
                </div>
                <div style={styles.requestButtons}>
                  <button style={styles.requestBtnAccept} onClick={(e) => { e.stopPropagation(); handleAccept(req.id) }}>✓</button>
                  <button style={styles.requestBtnDecline} onClick={(e) => { e.stopPropagation(); handleDecline(req.id) }}>✗</button>
                </div>
              </div>
            ))
          )}
          <div style={styles.seeAll} onClick={() => navigate('/friends')}>See all →</div>
        </div>
      )
    },
    trending: {
      title: 'Trending Today',
      icon: '🔥',
      content: (
        <div>
          {trendingTopics.map((topic, i) => (
            <div key={i} style={styles.trendingItem} onClick={() => navigate(`/search?q=${topic.topic}`)}>
              <div style={styles.trendingRank}>{i + 1}</div>
              <div style={styles.trendingInfo}>
                <div style={styles.trendingTopic}>{topic.topic}</div>
                <div style={styles.trendingStats}>{topic.posts} posts</div>
              </div>
              <span style={topic.change?.startsWith('+') ? styles.trendingChangePositive : styles.trendingChange}>{topic.change}</span>
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
            <div key={birthday.id} style={styles.birthdayItem} onClick={() => navigate(`/profile/${birthday.username}`)}>
              <div style={styles.birthdayIcon}>🎂</div>
              <div style={styles.birthdayInfo}>
                <div style={styles.birthdayName}>{birthday.name}</div>
                <div style={styles.birthdayDate}>{birthday.date}</div>
              </div>
              <button style={styles.birthdayWishBtn} onClick={(e) => { e.stopPropagation(); alert(`🎉 Birthday wish sent to ${birthday.name}!`); }}>Wish</button>
            </div>
          ))}
        </div>
      )
    },
    sponsors: {
      title: 'Sponsored',
      icon: '📢',
      content: (
        <div style={styles.sponsorsRow}>
          <div style={styles.sponsorIcon}><i className="fab fa-spotify"></i></div>
          <div style={styles.sponsorIcon}><i className="fab fa-apple"></i></div>
          <div style={styles.sponsorIcon}><i className="fab fa-soundcloud"></i></div>
          <div style={styles.sponsorIcon}><i className="fab fa-bandcamp"></i></div>
          <div style={styles.sponsorIcon}><i className="fab fa-nike"></i></div>
          <div style={styles.sponsorIcon}><i className="fab fa-adidas"></i></div>
        </div>
      )
    }
  }

  return (
    <div style={styles.rightSidebar}>
      {/* Customization Button */}
      <div style={{ marginBottom: '8px', textAlign: 'right' }}>
        <button 
          style={styles.customizeBtn}
          onClick={() => setShowCustomize(!showCustomize)}
          title="Customize sidebar"
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f2f5'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}
        >
          <i className="fas fa-sliders-h"></i> Customize
        </button>
      </div>

      {/* Customization Modal */}
      {showCustomize && (
        <div style={styles.modalOverlay} onClick={() => setShowCustomize(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Customize Right Sidebar</div>
            <p style={{ color: '#888', marginBottom: '16px' }}>Drag to reorder, click to hide/show widgets</p>
            {widgetOrder.map((widgetId, index) => {
              const widget = widgets[widgetId]
              return (
                <div 
                  key={widgetId}
                  style={styles.widgetCustomizeItem}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                    moveWidget(fromIndex, index)
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e4e6eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
                >
                  <i className="fas fa-grip-vertical" style={{ color: '#999' }}></i>
                  <span style={{ flex: 1 }}>{widget?.title || widgetId}</span>
                  <button 
                    style={collapsedWidgets[widgetId] ? styles.widgetToggleHidden : styles.widgetToggle}
                    onClick={() => toggleWidget(widgetId)}
                  >
                    {collapsedWidgets[widgetId] ? 'Show' : 'Hide'}
                  </button>
                </div>
              )
            })}
            <button style={{
              width: '100%',
              background: '#000',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '40px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '16px',
              transition: 'all 0.2s'
            }} 
            onMouseEnter={(e) => { e.currentTarget.style.background = '#333' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#000' }}
            onClick={() => setShowCustomize(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Render Widgets in Order */}
      <div>
        {widgetOrder.map(widgetId => {
          const widget = widgets[widgetId]
          if (!widget) return null
          
          return (
            <div key={widgetId} style={{ ...styles.widgetCard, marginBottom: '16px' }}>
              <div 
                style={styles.widgetHeader}
                onClick={() => toggleWidget(widgetId)}
              >
                <div style={styles.widgetTitle}>
                  <span>{widget.icon} {widget.title}</span>
                </div>
                <i className={`fas fa-chevron-${collapsedWidgets[widgetId] ? 'down' : 'up'}`} style={{ color: '#999', fontSize: '12px' }}></i>
              </div>
              {!collapsedWidgets[widgetId] && widget.content}
            </div>
          )
        })}
      </div>
    </div>
  )
}