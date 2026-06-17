// src/pages/Notifications.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Notifications({ session }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    subscribeToNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
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
    setLoading(false)
  }

  function subscribeToNotifications() {
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
      .subscribe()

    return () => subscription.unsubscribe()
  }

  async function markAsRead(id) {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
      loadNotifications()
    } catch (error) {
      console.error('Error marking as read:', error)
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
    
    if (notification.type === 'comment' || notification.type === 'like') {
      navigate('/')
    } else if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_id}`)
    } else if (notification.type === 'message') {
      navigate('/messages')
    } else if (notification.type === 'friend_request') {
      navigate('/friends')
    } else if (notification.type === 'group_invite') {
      navigate('/groups')
    } else if (notification.type === 'event_reminder') {
      navigate('/events')
    } else {
      navigate('/')
    }
  }

  function getNotificationIcon(type) {
    const icons = {
      like: '❤️',
      comment: '💬',
      follow: '👤',
      message: '💌',
      repost: '🔄',
      mention: '📢',
      friend_request: '🤝',
      group_invite: '👥',
      event_reminder: '📅',
      beat_purchase: '🎵',
      subscription: '⭐'
    }
    return icons[type] || '📱'
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
      case 'message':
        return `${actorName} sent you a message`
      case 'repost':
        return `${actorName} reposted your post`
      case 'mention':
        return `${actorName} mentioned you in a post`
      case 'friend_request':
        return `${actorName} sent you a friend request`
      case 'group_invite':
        return `${actorName} invited you to a group`
      case 'event_reminder':
        return `Reminder: Event starts soon!`
      case 'beat_purchase':
        return `${actorName} purchased your beat! 🎵`
      case 'subscription':
        return `${actorName} subscribed to your content`
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
    if (activeFilter === 'unread') return !notif.read
    return notif.type === activeFilter
  })

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'like', label: 'Likes' },
    { value: 'comment', label: 'Comments' },
    { value: 'follow', label: 'Follows' },
    { value: 'message', label: 'Messages' }
  ]

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '12px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700'
    },
    markAllBtn: {
      padding: '8px 16px',
      background: 'none',
      border: 'none',
      color: '#7c3aed',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    filters: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    filterBtn: {
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '13px',
      cursor: 'pointer',
      fontWeight: '700',
      border: '1px solid #e5e7eb',
      background: 'transparent',
      color: '#6b7280',
      transition: 'all 0.2s'
    },
    filterBtnActive: {
      background: '#7c3aed',
      color: 'white',
      borderColor: '#7c3aed'
    },
    notificationItem: {
      display: 'flex',
      gap: '12px',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid transparent'
    },
    notificationUnread: {
      background: '#f9fafb',
      borderColor: '#e5e7eb'
    },
    notificationRead: {
      background: 'transparent',
      borderColor: 'transparent'
    },
    iconContainer: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0
    },
    iconGradient: {
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)'
    },
    content: {
      flex: 1
    },
    text: {
      fontSize: '14px',
      fontWeight: '700'
    },
    time: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px'
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px'
    },
    emptyIcon: {
      fontSize: '64px',
      color: '#ccc',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    emptyText: {
      color: '#6b7280'
    }
  }

  if (loading) {
    return <div className="spinner"></div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📬 Notifications</h1>
        {unreadCount > 0 && (
          <button style={styles.markAllBtn} onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div style={styles.filters}>
        {filterOptions.map(option => (
          <button
            key={option.value}
            style={{
              ...styles.filterBtn,
              ...(activeFilter === option.value ? styles.filterBtnActive : {})
            }}
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredNotifications.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔔</div>
          <div style={styles.emptyTitle}>No notifications</div>
          <div style={styles.emptyText}>When you get notifications, they'll appear here</div>
        </div>
      ) : (
        filteredNotifications.map(notif => (
          <div
            key={notif.id}
            style={{
              ...styles.notificationItem,
              ...(notif.read ? styles.notificationRead : styles.notificationUnread)
            }}
            onClick={() => handleNotificationClick(notif)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6'
              e.currentTarget.style.transform = 'translateX(4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = notif.read ? 'transparent' : '#f9fafb'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <div style={{...styles.iconContainer, ...styles.iconGradient}}>
              {getNotificationIcon(notif.type)}
            </div>
            <div style={styles.content}>
              <div style={styles.text}>{getNotificationText(notif)}</div>
              <div style={styles.time}>
                {formatTimeAgo(notif.created_at)}
                {!notif.read && (
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    background: '#7c3aed',
                    borderRadius: '50%',
                    marginLeft: '8px'
                  }}></span>
                )}
              </div>
            </div>
            {notif.actor?.avatar_url && (
              <img
                src={notif.actor.avatar_url}
                style={styles.avatar}
                alt="avatar"
              />
            )}
          </div>
        ))
      )}
    </div>
  )
}