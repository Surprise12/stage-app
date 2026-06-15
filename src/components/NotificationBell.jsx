import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function NotificationBell({ session }) {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
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
          avatar_url
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    
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

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="nav-link"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ position: 'relative' }}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <>
          <div 
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
            top: '40px',
            right: '0',
            width: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: '#141414',
            border: '1px solid #2a2a2a',
            borderRadius: '16px',
            zIndex: 999,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #2a2a2a',
              fontWeight: '600'
            }}>
              Notifications
            </div>
            
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #2a2a2a',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    background: notif.read ? 'transparent' : '#1a1a2e'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1f1f1f'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? 'transparent' : '#1a1a2e'}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img
                      src={notif.actor?.avatar_url || `https://ui-avatars.com/api/?name=${(notif.actor?.username || 'U')[0]}&background=ff5f6d&color=fff`}
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      alt="avatar"
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        {getNotificationText(notif)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                        {formatTimeAgo(notif.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}