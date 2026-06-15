// src/components/NotificationBell.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function NotificationBell({ session }) {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    if (session) {
      loadNotifications()
      
      // Subscribe to real-time notifications
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        }, () => {
          loadNotifications()
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        }, () => {
          loadNotifications()
        })
        .subscribe()
      
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [session])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }

  async function markAsRead(id) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    loadNotifications()
  }

  async function markAllAsRead() {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false)
    loadNotifications()
    setUnreadCount(0)
  }

  function handleNotificationClick(notification) {
    markAsRead(notification.id)
    setShowDropdown(false)
    
    if (notification.type === 'comment') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(`post-${notification.target_id}`)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_id}`)
    } else if (notification.type === 'like') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(`post-${notification.target_id}`)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else if (notification.type === 'repost') {
      navigate('/')
    } else if (notification.type === 'beat_purchase') {
      navigate('/beats')
    } else if (notification.type === 'event_reminder') {
      navigate('/events')
    }
  }

  function getNotificationIcon(notification) {
    switch (notification.type) {
      case 'comment':
        return '💬'
      case 'follow':
        return '👤'
      case 'like':
        return '❤️'
      case 'repost':
        return '🔁'
      case 'beat_purchase':
        return '🎵'
      case 'event_reminder':
        return '🎉'
      default:
        return '📢'
    }
  }

  function getNotificationGradient(notification) {
    switch (notification.type) {
      case 'comment':
        return 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'
      case 'follow':
        return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      case 'like':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      case 'repost':
        return 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
      case 'beat_purchase':
        return 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  }

  function getNotificationText(notification) {
    const actorName = notification.actor?.display_name || notification.actor?.username || 'Someone'
    
    switch (notification.type) {
      case 'comment':
        return `${actorName} commented on your post`
      case 'follow':
        return `${actorName} started following you`
      case 'like':
        return `${actorName} liked your post`
      case 'repost':
        return `${actorName} reposted your post`
      case 'beat_purchase':
        return `${actorName} purchased your beat! 🎵`
      case 'event_reminder':
        return `Reminder: ${notification.target_title || 'Event'} starts soon!`
      default:
        return `${actorName} interacted with you`
    }
  }

  function formatTimeAgo(date) {
    if (!date) return 'just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'all') return true
    return notif.type === activeFilter
  })

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'like', label: 'Likes' },
    { value: 'comment', label: 'Comments' },
    { value: 'follow', label: 'Follows' },
    { value: 'repost', label: 'Reposts' }
  ]

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="header-icon"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ position: 'relative', background: 'none' }}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <>
          <div 
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998
            }}
            onClick={() => setShowDropdown(false)}
          />
          <div style={{
            position: 'absolute',
            top: '45px',
            right: '-10px',
            width: '380px',
            maxHeight: '500px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '16px',
            zIndex: 999,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px' }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filters */}
            <div style={{
              padding: '8px 16px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto'
            }}>
              {filterOptions.map(option => (
                <span
                  key={option.value}
                  className={`notification-filter ${activeFilter === option.value ? 'active' : ''}`}
                  onClick={() => setActiveFilter(option.value)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: activeFilter === option.value ? '#667eea' : '#f0f2f5',
                    color: activeFilter === option.value ? 'white' : '#666',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {option.label}
                </span>
              ))}
            </div>
            
            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>
                <i className="fas fa-bell-slash" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', color: '#ccc' }}></i>
                <p>No notifications yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>When you get notifications, they'll appear here</p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #f0f2f5',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    background: notif.read ? 'white' : '#f9fafb'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: getNotificationGradient(notif),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {getNotificationIcon(notif)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                        {getNotificationText(notif)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{formatTimeAgo(notif.created_at)}</span>
                        {!notif.read && <span style={{ width: '8px', height: '8px', background: '#667eea', borderRadius: '50%', display: 'inline-block' }}></span>}
                      </div>
                    </div>
                    {notif.actor?.avatar_url && (
                      <img
                        src={notif.actor.avatar_url}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        alt="avatar"
                      />
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #eee',
                textAlign: 'center'
              }}>
                <button 
                  onClick={() => {
                    navigate('/notifications')
                    setShowDropdown(false)
                  }}
                  style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                  View all notifications →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}