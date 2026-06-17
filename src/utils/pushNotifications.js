// src/utils/pushNotifications.js - UPDATED WITH BETTER STRUCTURE
import { supabase } from '../lib/supabase'

// ============================================
// CONFIGURATION
// ============================================

// Generate VAPID keys using: https://web-push-codelab.glitch.me/
// Or using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY'
const VAPID_PRIVATE_KEY = import.meta.env.VITE_VAPID_PRIVATE_KEY || 'YOUR_VAPID_PRIVATE_KEY'

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================

/**
 * Register the service worker for push notifications
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported in this browser')
    return null
  }

  if (!('PushManager' in window)) {
    console.warn('Push Manager not supported in this browser')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })
    console.log('✅ Service Worker registered successfully')
    return registration
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error)
    return null
  }
}

/**
 * Check if user is already subscribed
 */
export async function checkPushSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription
  } catch (error) {
    console.error('❌ Error checking subscription:', error)
    return null
  }
}

// ============================================
// SUBSCRIBE TO PUSH NOTIFICATIONS
// ============================================

/**
 * Subscribe the user to push notifications
 */
export async function subscribeToPush(userId) {
  try {
    // Check if already subscribed
    const existingSubscription = await checkPushSubscription()
    if (existingSubscription) {
      console.log('Already subscribed to push notifications')
      return existingSubscription
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready
    
    // Validate VAPID key
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY') {
      console.warn('⚠️ VAPID public key not configured. Please set VITE_VAPID_PUBLIC_KEY in your .env file')
      return null
    }

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    // Save subscription to database
    const subscriptionData = {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
      auth: arrayBufferToBase64(subscription.getKey('auth')),
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData)

    if (error) {
      console.error('❌ Failed to save push subscription:', error)
      return null
    }

    console.log('✅ Push subscription saved successfully')
    return subscription
  } catch (error) {
    console.error('❌ Push subscription failed:', error)
    
    // Handle specific error cases
    if (error.message?.includes('ApplicationServerKey')) {
      console.error('Invalid VAPID key. Please check your VITE_VAPID_PUBLIC_KEY environment variable.')
    }
    
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId) {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      
      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)

      console.log('✅ Unsubscribed from push notifications')
      return true
    }

    console.log('No active subscription to unsubscribe from')
    return false
  } catch (error) {
    console.error('❌ Unsubscribe failed:', error)
    return false
  }
}

// ============================================
// NOTIFICATION SENDING (Server-side)
// ============================================

/**
 * Send a push notification (should be called from your server)
 * This is a helper function for your backend
 */
export async function sendPushNotification(subscription, payload) {
  // This should be called from your server using web-push library
  // For demonstration, we'll just log it
  console.log('📤 Would send push notification:', {
    to: subscription.endpoint,
    payload
  })

  // In production, you'd use:
  // const webPush = require('web-push')
  // webPush.setVapidDetails(
  //   'mailto:support@socialvibe.com',
  //   VAPID_PUBLIC_KEY,
  //   VAPID_PRIVATE_KEY
  // )
  // await webPush.sendNotification(subscription, JSON.stringify(payload))

  return true
}

/**
 * Send a notification to a specific user
 */
export async function sendNotificationToUser(userId, title, body, icon = '/icon.png', data = {}) {
  try {
    // Get user's push subscription
    const { data: subscription } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!subscription) {
      console.log('No push subscription found for user:', userId)
      return false
    }

    const payload = {
      title,
      body,
      icon,
      data,
      timestamp: Date.now()
    }

    // Send notification through your server
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription,
        payload
      })
    })

    return response.ok
  } catch (error) {
    console.error('❌ Error sending notification:', error)
    return false
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert base64 string to Uint8Array
 */
export function urlBase64ToUint8Array(base64String) {
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  } catch (error) {
    console.error('❌ Error converting base64 to Uint8Array:', error)
    return new Uint8Array(0)
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer) {
  try {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  } catch (error) {
    console.error('❌ Error converting ArrayBuffer to base64:', error)
    return ''
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied by user')
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    return permission
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error)
    return 'denied'
  }
}

/**
 * Send a browser notification (for testing)
 */
export function sendBrowserNotification(title, body, icon = '/icon.png') {
  try {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return false
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return false
    }

    const notification = new Notification(title, {
      body,
      icon,
      tag: `socialvibe-${Date.now()}`,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    notification.onaction = (event) => {
      if (event.action === 'view') {
        window.focus()
      }
      notification.close()
    }

    return true
  } catch (error) {
    console.error('❌ Error sending browser notification:', error)
    return false
  }
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export const NotificationTypes = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MESSAGE: 'message',
  REPOST: 'repost',
  MENTION: 'mention',
  FRIEND_REQUEST: 'friend_request',
  GROUP_INVITE: 'group_invite',
  EVENT_REMINDER: 'event_reminder',
  BEAT_PURCHASE: 'beat_purchase',
  SUBSCRIPTION: 'subscription'
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type) {
  const icons = {
    [NotificationTypes.LIKE]: '❤️',
    [NotificationTypes.COMMENT]: '💬',
    [NotificationTypes.FOLLOW]: '👤',
    [NotificationTypes.MESSAGE]: '💌',
    [NotificationTypes.REPOST]: '🔄',
    [NotificationTypes.MENTION]: '📢',
    [NotificationTypes.FRIEND_REQUEST]: '🤝',
    [NotificationTypes.GROUP_INVITE]: '👥',
    [NotificationTypes.EVENT_REMINDER]: '📅',
    [NotificationTypes.BEAT_PURCHASE]: '🎵',
    [NotificationTypes.SUBSCRIPTION]: '⭐'
  }
  return icons[type] || '📱'
}

/**
 * Format notification message based on type and data
 */
export function formatNotificationMessage(type, data = {}) {
  switch (type) {
    case NotificationTypes.LIKE:
      return `${data.actorName || 'Someone'} liked your post`
    case NotificationTypes.COMMENT:
      return `${data.actorName || 'Someone'} commented: "${data.content || ''}"`
    case NotificationTypes.FOLLOW:
      return `${data.actorName || 'Someone'} started following you`
    case NotificationTypes.MESSAGE:
      return `${data.actorName || 'Someone'} sent you a message`
    case NotificationTypes.REPOST:
      return `${data.actorName || 'Someone'} reposted your content`
    case NotificationTypes.MENTION:
      return `${data.actorName || 'Someone'} mentioned you in a post`
    case NotificationTypes.FRIEND_REQUEST:
      return `${data.actorName || 'Someone'} sent you a friend request`
    case NotificationTypes.GROUP_INVITE:
      return `${data.actorName || 'Someone'} invited you to "${data.groupName || 'a group'}"`
    case NotificationTypes.EVENT_REMINDER:
      return `Reminder: "${data.eventName || 'Event'}" starts soon!`
    case NotificationTypes.BEAT_PURCHASE:
      return `${data.actorName || 'Someone'} purchased your beat! 🎵`
    case NotificationTypes.SUBSCRIPTION:
      return `${data.actorName || 'Someone'} subscribed to your content`
    default:
      return `${data.actorName || 'Someone'} interacted with you`
  }
}

// ============================================
// SETUP HELPER
// ============================================

/**
 * Complete setup for push notifications
 */
export async function setupPushNotifications(userId) {
  try {
    // Step 1: Request permission
    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return false
    }

    // Step 2: Register service worker
    const registration = await registerServiceWorker()
    if (!registration) {
      console.warn('Service worker registration failed')
      return false
    }

    // Step 3: Subscribe to push
    const subscription = await subscribeToPush(userId)
    if (!subscription) {
      console.warn('Push subscription failed')
      return false
    }

    console.log('✅ Push notifications setup complete!')
    return true
  } catch (error) {
    console.error('❌ Push notification setup failed:', error)
    return false
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  checkPushSubscription,
  requestNotificationPermission,
  sendBrowserNotification,
  sendNotificationToUser,
  setupPushNotifications,
  NotificationTypes,
  getNotificationIcon,
  formatNotificationMessage
}