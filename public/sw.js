// public/sw.js - Service Worker for Push Notifications
// Enhanced version with full SocialVibe support

const CACHE_NAME = 'socialvibe-v2'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.png',
  '/badge.png',
  '/favicon.ico'
]

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching assets...')
        return cache.addAll(ASSETS_TO_CACHE)
      })
      .then(() => {
        console.log('[SW] Assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Cache error:', error)
      })
  )
})

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
    .then(() => {
      console.log('[SW] Ready to handle fetches')
      return self.clients.claim()
    })
  )
})

// ============================================
// FETCH EVENT - Network-first with cache fallback
// ============================================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip analytics and tracking
  if (event.request.url.includes('analytics') || 
      event.request.url.includes('vercel') ||
      event.request.url.includes('supabase')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const clonedResponse = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, clonedResponse)
            })
        }
        return response
      })
      .catch(() => {
        // Return cached response if network fails
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return offline page if nothing is cached
            return caches.match('/')
          })
      })
  )
})

// ============================================
// PUSH EVENT - Handle incoming push notifications
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received')
  
  let data = {
    title: 'SocialVibe',
    body: 'You have a new notification',
    icon: '/icon.png',
    badge: '/badge.png',
    tag: 'socialvibe',
    url: '/',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View', icon: '/icon.png' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }

  try {
    // Parse the push data
    if (event.data) {
      const parsedData = event.data.json()
      data = { ...data, ...parsedData }
    }
  } catch (error) {
    console.error('[SW] Error parsing push data:', error)
  }

  // Validate required fields
  if (!data.title || !data.body) {
    console.warn('[SW] Missing required notification fields')
    data.title = data.title || 'SocialVibe'
    data.body = data.body || 'You have a new notification'
  }

  // Create notification options
  const options = {
    body: data.body,
    icon: data.icon || '/icon.png',
    badge: data.badge || '/badge.png',
    tag: data.tag || `socialvibe-${Date.now()}`,
    vibrate: data.vibrate || [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: data.timestamp || Date.now(),
      notificationId: data.notificationId || `notif-${Date.now()}`
    },
    actions: data.actions || [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
    silent: data.silent || false,
    renotify: data.renotify || false
  }

  // Show the notification
  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('[SW] Notification shown:', data.title)
      })
      .catch((error) => {
        console.error('[SW] Error showing notification:', error)
      })
  )
})

// ============================================
// NOTIFICATION CLICK EVENT - Handle notification clicks
// ============================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received')
  
  // Close the notification
  event.notification.close()

  // Get the notification data
  const notificationData = event.notification.data || {}
  const url = notificationData.url || '/'
  const action = event.action

  console.log('[SW] Notification action:', action, 'URL:', url)

  // Handle different actions
  if (action === 'view') {
    // Open the specified URL
    event.waitUntil(
      handleUrlOpen(url)
    )
  } else if (action === 'dismiss') {
    // Just close the notification (already closed)
    console.log('[SW] Notification dismissed')
  } else if (action === 'reply') {
    // Handle reply action (for messaging)
    const reply = event.reply
    console.log('[SW] Reply received:', reply)
    // This would send the reply to your backend
    event.waitUntil(
      sendReplyToBackend(notificationData, reply)
    )
  } else {
    // Default: open the URL
    event.waitUntil(
      handleUrlOpen(url)
    )
  }
})

// ============================================
// HANDLE URL OPEN - Helper function
// ============================================
async function handleUrlOpen(url) {
  try {
    // Check if there's already a window/tab open
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    // Try to focus existing client
    for (const client of clients) {
      if (client.url === url && 'focus' in client) {
        return client.focus()
      }
    }

    // Open new window if none exists
    if (clients.openWindow) {
      return clients.openWindow(url)
    }

    console.warn('[SW] Could not open URL:', url)
  } catch (error) {
    console.error('[SW] Error opening URL:', error)
  }
}

// ============================================
// SEND REPLY TO BACKEND - Helper function
// ============================================
async function sendReplyToBackend(notificationData, reply) {
  try {
    // This would send the reply to your backend
    // For now, just log it
    console.log('[SW] Would send reply:', {
      notificationId: notificationData.notificationId,
      reply: reply
    })

    // Example: Send to your API
    // await fetch('/api/notification-reply', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     notificationId: notificationData.notificationId,
    //     reply: reply
    //   })
    // })
  } catch (error) {
    console.error('[SW] Error sending reply:', error)
  }
}

// ============================================
// MESSAGE EVENT - Handle messages from the client
// ============================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received from client:', event.data)

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data.type === 'GET_SUBSCRIPTION') {
    // Send the current push subscription back to the client
    event.waitUntil(
      self.registration.pushManager.getSubscription()
        .then((subscription) => {
          event.ports[0].postMessage({
            type: 'SUBSCRIPTION',
            subscription: subscription
          })
        })
    )
  }
})

// ============================================
// SYNC EVENT - Background sync (for offline posts)
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag)

  if (event.tag === 'sync-posts') {
    event.waitUntil(
      syncPosts()
    )
  }
})

async function syncPosts() {
  console.log('[SW] Syncing posts...')
  // This would sync offline posts with your backend
  // Implementation would depend on your data structure
}

// ============================================
// PERIODIC SYNC - For regular updates
// ============================================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag)

  if (event.tag === 'update-notifications') {
    event.waitUntil(
      updateNotifications()
    )
  }
})

async function updateNotifications() {
  console.log('[SW] Updating notifications...')
  // This would check for new notifications in the background
  // Implementation would depend on your data structure
}

// ============================================
// ERROR HANDLING
// ============================================
self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason)
})

// ============================================
// HELPER: Generate notification ID
// ============================================
function generateNotificationId() {
  return `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// ============================================
// LOGGING
// ============================================
console.log('[SW] Service Worker loaded successfully')
console.log('[SW] Version:', CACHE_NAME)
console.log('[SW] Environment:', self.location.href)