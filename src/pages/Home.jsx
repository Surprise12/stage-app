// src/pages/Home.jsx - MINIMAL VISIBLE VERSION
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error)
    }
    setLoading(false)
  }

  // 🔥 SUPER VISIBLE STYLES - forces content to show
  const containerStyle = {
    padding: '40px 20px',
    maxWidth: '800px',
    margin: '0 auto',
    background: '#ffffff',
    minHeight: '100vh',
    color: '#1f2937',
    display: 'block',
    visibility: 'visible',
    opacity: 1,
    position: 'relative',
    zIndex: 9999
  }

  const headerStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#7c3aed'
  }

  const cardStyle = {
    background: '#f0fdf4',
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #86efac',
    marginBottom: '20px'
  }

  const buttonStyle = {
    padding: '12px 24px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px'
  }

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>🎉 SocialVibe</h1>
      
      <div style={cardStyle}>
        <p style={{ fontSize: '18px' }}>
          ✅ Logged in as: <strong>{session?.user?.email}</strong>
        </p>
        <p style={{ color: '#4b5563', marginTop: '8px' }}>
          Home page is rendering correctly!
        </p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button style={buttonStyle} onClick={() => {
          supabase.auth.signOut()
          window.location.href = '/login'
        }}>
          Logout
        </button>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#f3f4f6', borderRadius: '12px' }}>
        <h3>📝 Posts</h3>
        {loading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p>No posts yet. Be the first!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
              {post.content}
            </div>
          ))
        )}
      </div>
    </div>
  )
}