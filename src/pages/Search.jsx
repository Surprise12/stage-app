import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Search() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSearch(searchQuery) {
    setQuery(searchQuery)
    if (!searchQuery.trim()) {
      setUsers([])
      setPosts([])
      return
    }
    
    setLoading(true)
    
    // Search users
    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .limit(10)
    
    if (userData) setUsers(userData)
    
    // Search posts
    const { data: postData } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .ilike('content', `%${searchQuery}%`)
      .limit(10)
    
    if (postData) setPosts(postData)
    
    setLoading(false)
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
    <div className="container" style={{ marginTop: '30px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px' }}>🔍 Search</h1>
      
      <div className="card" style={{ marginBottom: '30px' }}>
        <input
          type="text"
          className="input"
          placeholder="Search users, posts..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoFocus
        />
      </div>
      
      {loading && <div className="spinner"></div>}
      
      {/* Users Results */}
      {users.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Users</h2>
          {users.map(user => (
            <div
              key={user.id}
              className="card"
              style={{ cursor: 'pointer', marginBottom: '12px' }}
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=ff5f6d&color=fff`}
                  style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                  alt="avatar"
                />
                <div>
                  <div style={{ fontWeight: '700' }}>
                    {user.display_name || user.username}
                    {user.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>@{user.username}</div>
                  {user.bio && <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>{user.bio.substring(0, 100)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Posts Results */}
      {posts.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Posts</h2>
          {posts.map(post => (
            <div
              key={post.id}
              className="card"
              style={{ cursor: 'pointer', marginBottom: '12px' }}
              onClick={() => navigate('/')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <img
                  src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(post.profiles?.username || 'U')[0]}&background=ff5f6d&color=fff`}
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                  alt="avatar"
                />
                <div>
                  <div style={{ fontWeight: '600' }}>
                    {post.profiles?.display_name || post.profiles?.username}
                    {post.profiles?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>{formatTimeAgo(post.created_at)}</div>
                </div>
              </div>
              <p>{post.content.substring(0, 200)}{post.content.length > 200 ? '...' : ''}</p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '16px', color: '#888', fontSize: '0.8rem' }}>
                <span>👏 {post.applause_count || 0}</span>
                <span>💬 {post.comment_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {query && !loading && users.length === 0 && posts.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No results found for "{query}"</p>
        </div>
      )}
    </div>
  )
}