// src/pages/Home.jsx - Minimal test version
import React from 'react'

export default function Home({ session }) {
  console.log('Home: Rendering with session:', session?.user?.email)
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Welcome to SocialVibe!</h1>
      <p>You are logged in as: <strong>{session?.user?.email}</strong></p>
      <div style={{ marginTop: '20px', padding: '20px', background: '#f0f0f0', borderRadius: '12px' }}>
        <p>✅ Home page is rendering correctly!</p>
        <p>If you can see this, the routing is working.</p>
      </div>
    </div>
  )
}