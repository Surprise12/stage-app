// src/utils/notificationActions.js - Client-side notification handling
import { supabase } from '../lib/supabase'
import { sendBrowserNotification } from './pushNotifications'

// ============================================
// NOTIFICATION ACTION HANDLERS
// ============================================

/**
 * Handle notification click actions
 */
export function handleNotificationAction(action, notificationData) {
  switch (action) {
    case 'view':
      window.location.href = notificationData.url || '/'
      break
    case 'dismiss':
      // Just close the notification
      break
    case 'reply':
      // This will be handled by the service worker
      break
    default:
      window.location.href = notificationData.url || '/'
  }
}

/**
 * Create a notification object for sending
 */
export function createNotification(recipientId, type, data) {
  const notification = {
    user_id: recipientId,
    type: type,
    actor_id: data.actorId,
    target_id: data.targetId,
    target_type: data.targetType,
    content: data.content || '',
    read: false,
    created_at: new Date().toISOString()
  }

  return notification
}

/**
 * Save notification to database
 */
export async function saveNotification(notification) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving notification:', error)
    return null
  }
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(userId, limit = 50) {
  try {
    const { data, error } = await supabase
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting notifications:', error)
    return []
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking all as read:', error)
    return false
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
}

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

export const NotificationTemplates = {
  LIKE: {
    title: '❤️ New Like',
    getBody: (actorName) => `${actorName} liked your post`
  },
  COMMENT: {
    title: '💬 New Comment',
    getBody: (actorName) => `${actorName} commented on your post`
  },
  FOLLOW: {
    title: '👤 New Follower',
    getBody: (actorName) => `${actorName} started following you`
  },
  MESSAGE: {
    title: '💌 New Message',
    getBody: (actorName) => `${actorName} sent you a message`
  },
  REPOST: {
    title: '🔄 Repost',
    getBody: (actorName) => `${actorName} reposted your content`
  },
  FRIEND_REQUEST: {
    title: '🤝 Friend Request',
    getBody: (actorName) => `${actorName} sent you a friend request`
  },
  EVENT_REMINDER: {
    title: '📅 Event Reminder',
    getBody: (eventName) => `Reminder: "${eventName}" starts soon!`
  }
}

/**
 * Get notification template by type
 */
export function getNotificationTemplate(type) {
  return NotificationTemplates[type] || {
    title: '📱 SocialVibe',
    getBody: (name) => `${name} interacted with you`
  }
}