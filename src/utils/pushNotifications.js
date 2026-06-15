// Push notification utilities
// You'll need to generate VAPID keys and set up a service worker

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported')
    return false
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker registered')
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return false
  }
}

export async function subscribeToPush(userId, supabase) {
  try {
    const registration = await navigator.serviceWorker.ready
    
    // Replace with your VAPID public key
    const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    })
    
    // Save subscription to database
    await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
      })
    
    console.log('Push subscription saved')
    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function sendNotification(subscription, title, body, icon = '/icon.png') {
  // This would be sent from your backend
  // For now, just log
  console.log('Would send notification:', { title, body, subscription })
}