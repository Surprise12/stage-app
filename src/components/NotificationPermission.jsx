// src/components/NotificationPermission.jsx
import React, { useState, useEffect } from 'react'
import { setupPushNotifications, sendBrowserNotification } from '../utils/pushNotifications'

export default function NotificationPermission({ session }) {
  const [status, setStatus] = useState('checking')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkPermission()
  }, [])

  const checkPermission = () => {
    if (!('Notification' in window)) {
      setStatus('unsupported')
      return
    }

    if (Notification.permission === 'granted') {
      setStatus('granted')
    } else if (Notification.permission === 'denied') {
      setStatus('denied')
    } else {
      setStatus('prompt')
    }
  }

  const handleEnable = async () => {
    setLoading(true)
    try {
      const success = await setupPushNotifications(session.user.id)
      if (success) {
        setStatus('granted')
        sendBrowserNotification(
          '🔔 Notifications Enabled',
          'You will now receive push notifications from SocialVibe!'
        )
      } else {
        setStatus('denied')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      setStatus('denied')
    }
    setLoading(false)
  }

  const styles = {
    container: {
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px'
    },
    granted: {
      background: '#f0fdf4',
      border: '1px solid #86efac'
    },
    denied: {
      background: '#fef2f2',
      border: '1px solid #fca5a5'
    },
    prompt: {
      background: '#fefce8',
      border: '1px solid #fde68a'
    },
    unsupported: {
      background: '#f3f4f6',
      border: '1px solid #d1d5db'
    },
    text: {
      fontWeight: '700'
    },
    button: {
      padding: '8px 20px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    buttonDisabled: {
      padding: '8px 20px',
      background: '#9ca3af',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'not-allowed',
      fontWeight: '700',
      fontSize: '14px'
    }
  }

  if (status === 'unsupported') {
    return (
      <div style={{...styles.container, ...styles.unsupported}}>
        <span style={styles.text}>📱 Push notifications not supported in this browser</span>
      </div>
    )
  }

  if (status === 'granted') {
    return (
      <div style={{...styles.container, ...styles.granted}}>
        <span style={styles.text}>🔔 Notifications enabled</span>
        <span style={{ fontSize: '14px', color: '#10b981' }}>✅ You'll receive updates</span>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div style={{...styles.container, ...styles.denied}}>
        <span style={styles.text}>🔕 Notifications blocked</span>
        <span style={{ fontSize: '14px', color: '#ef4444' }}>
          Enable in browser settings to receive updates
        </span>
      </div>
    )
  }

  return (
    <div style={{...styles.container, ...styles.prompt}}>
      <span style={styles.text}>🔔 Enable push notifications?</span>
      <button
        style={loading ? styles.buttonDisabled : styles.button}
        onClick={handleEnable}
        disabled={loading}
        onMouseEnter={(e) => {
          if (!loading) e.currentTarget.style.background = '#6d28d9'
        }}
        onMouseLeave={(e) => {
          if (!loading) e.currentTarget.style.background = '#7c3aed'
        }}
      >
        {loading ? 'Enabling...' : 'Enable Notifications'}
      </button>
    </div>
  )
}