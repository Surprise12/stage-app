// src/components/PushNotificationSetup.jsx
import React, { useEffect, useState } from 'react'
import { setupPushNotifications, sendBrowserNotification } from '../utils/pushNotifications'

export default function PushNotificationSetup({ session }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    // Check if notifications are enabled
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  const handleEnableNotifications = async () => {
    const success = await setupPushNotifications(session.user.id)
    if (success) {
      setNotificationsEnabled(true)
      sendBrowserNotification('✅ Notifications Enabled', 'You will now receive push notifications!')
    }
  }

  if (notificationsEnabled) {
    return (
      <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '12px' }}>
        ✅ Push notifications enabled
      </div>
    )
  }

  return (
    <button onClick={handleEnableNotifications} style={{
      padding: '12px 24px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700'
    }}>
      🔔 Enable Notifications
    </button>
  )
}