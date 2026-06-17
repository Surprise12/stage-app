// src/components/NotificationBell.jsx - UPDATED WITH INLINE STYLES
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
    try {
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
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  async function markAsRead(id) {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
      loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false)
      loadNotifications()
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  function handleNotificationClick(notification) {
    markAsRead(notification.id)
    setShowDropdown(false)
    
    if (notification.type === 'comment' || notification.type === 'like') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(`post-${notification.target_id}`)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_id}`)
    } else if (notification.type === 'repost') {
      navigate('/')
    } else if (notification.type === 'beat_purchase') {
      navigate('/beats')
    } else if (notification.type === 'event_reminder') {
      navigate('/events')
    } else if (notification.type === 'message') {
      navigate('/messages')
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
      case 'message':
        return '💌'
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
      case 'message':
        return 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)'
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
      case 'message':
        return `${actorName} sent you a message`
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
    { value: 'repost', label: 'Reposts' },
    { value: 'message', label: 'Messages' }
  ]

  const styles = {
    container: {
      position: 'relative'
    },
    bellButton: {
      position: 'relative',
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#1f2937',
      padding: '8px',
      borderRadius: '50%',
      transition: 'all 0.2s'
    },
    badge: {
      position: 'absolute',
      top: '-2px',
      right: '-2px',
      background: '#ff4444',
      color: 'white',
      fontSize: '10px',
      fontWeight: '700',
      padding: '2px 6px',
      borderRadius: '20px',
      minWidth: '18px',
      textAlign: 'center',
      border: '2px solid white'
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 998
    },
    dropdown: {
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
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      animation: 'slideUp 0.3s ease'
    },
    header: {
      padding: '16px 20px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      background: 'white',
      zIndex: 1,
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px'
    },
    headerTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '700'
    },
    markAllBtn: {
      background: 'none',
      border: 'none',
      color: '#666',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700'
    },
    filters: {
      padding: '8px 16px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      position: 'sticky',
      top: '60px',
      background: 'white',
      zIndex: 1
    },
    filterItem: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    filterItemActive: {
      background: '#667eea',
      color: 'white'
    },
    filterItemInactive: {
      background: '#f0f2f5',
      color: '#666'
    },
    emptyState: {
      padding: '40px 20px',
      textAlign: 'center',
      color: '#888'
    },
    emptyIcon: {
      fontSize: '32px',
      color: '#ccc',
      display: 'block',
      marginBottom: '12px'
    },
    notificationItem: {
      padding: '14px 16px',
      borderBottom: '1px solid #f0f2f5',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    notificationItemUnread: {
      background: '#f9fafb'
    },
    notificationItemRead: {
      background: 'white'
    },
    notificationContent: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start'
    },
    notificationIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0
    },
    notificationBody: {
      flex: 1
    },
    notificationText: {
      fontSize: '14px',
      lineHeight: '1.4',
      fontWeight: '700'
    },
    notificationMeta: {
      fontSize: '11px',
      color: '#999',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: '700'
    },
    unreadDot: {
      width: '8px',
      height: '8px',
      background: '#667eea',
      borderRadius: '50%',
      display: 'inline-block'
    },
    notificationAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover',
      flexShrink: 0
    },
    footer: {
      padding: '12px 16px',
      borderTop: '1px solid #eee',
      textAlign: 'center',
      position: 'sticky',
      bottom: 0,
      background: 'white',
      borderBottomLeftRadius: '16px',
      borderBottomRightRadius: '16px'
    },
    viewAllBtn: {
      background: 'none',
      border: 'none',
      color: '#667eea',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '700',
      transition: 'color 0.2s'
    }
  }

  return (
    <div style={styles.container}>
      <button
        style={styles.bellButton}
        onClick={() => setShowDropdown(!showDropdown)}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <>
          <div style={styles.overlay} onClick={() => setShowDropdown(false)} />
          <div style={styles.dropdown}>
            {/* Header */}
            <div style={styles.header}>
              <h3 style={styles.headerTitle}>Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  style={styles.markAllBtn}
                  onClick={markAllAsRead}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filters */}
            <div style={styles.filters}>
              {filterOptions.map(option => (
                <span
                  key={option.value}
                  style={{
                    ...styles.filterItem,
                    ...(activeFilter === option.value ? styles.filterItemActive : styles.filterItemInactive)
                  }}
                  onClick={() => setActiveFilter(option.value)}
                  onMouseEnter={(e) => {
                    if (activeFilter !== option.value) {
                      e.currentTarget.style.background = '#e5e7eb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeFilter !== option.value) {
                      e.currentTarget.style.background = '#f0f2f5'
                    }
                  }}
                >
                  {option.label}
                </span>
              ))}
            </div>
            
            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
              <div style={styles.emptyState}>
                <i className="fas fa-bell-slash" style={styles.emptyIcon}></i>
                <p>No notifications yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>When you get notifications, they'll appear here</p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  style={{
                    ...styles.notificationItem,
                    ...(notif.read ? styles.notificationItemRead : styles.notificationItemUnread)
                  }}
                  onClick={() => handleNotificationClick(notif)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.read ? 'white' : '#f9fafb'
                  }}
                >
                  <div style={styles.notificationContent}>
                    <div style={{
                      ...styles.notificationIcon,
                      background: getNotificationGradient(notif)
                    }}>
                      {getNotificationIcon(notif)}
                    </div>
                    <div style={styles.notificationBody}>
                      <div style={styles.notificationText}>
                        {getNotificationText(notif)}
                      </div>
                      <div style={styles.notificationMeta}>
                        <span>{formatTimeAgo(notif.created_at)}</span>
                        {!notif.read && <span style={styles.unreadDot}></span>}
                      </div>
                    </div>
                    {notif.actor?.avatar_url && (
                      <img
                        src={notif.actor.avatar_url}
                        style={styles.notificationAvatar}
                        alt="avatar"
                      />
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div style={styles.footer}>
                <button 
                  style={styles.viewAllBtn}
                  onClick={() => {
                    navigate('/notifications')
                    setShowDropdown(false)
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#5a4b8a'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
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