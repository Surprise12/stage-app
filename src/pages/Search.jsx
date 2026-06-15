// src/pages/Search.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Search() {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [videos, setVideos] = useState([])
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [recentSearches, setRecentSearches] = useState([])

  // Get search query from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    if (q) {
      setQuery(q)
      handleSearch(q)
    }
  }, [location.search])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5))
    }
  }, [])

  async function handleSearch(searchQuery) {
    setQuery(searchQuery)
    if (!searchQuery.trim()) {
      setUsers([])
      setPosts([])
      setVideos([])
      setGigs([])
      return
    }
    
    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
    
    setLoading(true)
    
    // Search users
    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
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
    
    // Search videos
    const { data: videoData } = await supabase
      .from('videos')
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
      .ilike('title', `%${searchQuery}%`)
      .limit(6)
    
    if (videoData) setVideos(videoData)
    
    // Search gigs
    const { data: gigData } = await supabase
      .from('gigs')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .ilike('title', `%${searchQuery}%`)
      .eq('status', 'open')
      .limit(6)
    
    if (gigData) setGigs(gigData)
    
    setLoading(false)
  }

  function clearSearch() {
    setQuery('')
    setUsers([])
    setPosts([])
    setVideos([])
    setGigs([])
  }

  function removeRecentSearch(item) {
    const updated = recentSearches.filter(s => s !== item)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
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

  const getFilteredResults = () => {
    if (activeFilter === 'users') return users
    if (activeFilter === 'posts') return posts
    if (activeFilter === 'videos') return videos
    if (activeFilter === 'gigs') return gigs
    return { users, posts, videos, gigs }
  }

  const results = getFilteredResults()
  const hasResults = (activeFilter === 'all' && (users.length > 0 || posts.length > 0 || videos.length > 0 || gigs.length > 0)) ||
                     (activeFilter !== 'all' && results.length > 0)

  return (
    <div className="container" style={{ marginTop: '30px', maxWidth: '800px' }}>
      {/* Header */}
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '8px' }}>🔍 Search</h1>
      <p style={{ color: '#888', marginBottom: '20px' }}>Find users, posts, videos, and gigs</p>
      
      {/* Search Input */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fas fa-search" style={{ color: '#666', fontSize: '18px' }}></i>
          <input
            type="text"
            className="input"
            placeholder="Search SocialVibe..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ flex: 1, border: 'none', padding: '12px 0', background: 'transparent' }}
            autoFocus
          />
          {query && (
            <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
      
      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', color: '#666' }}>Recent Searches</h3>
            <button onClick={() => { setRecentSearches([]); localStorage.removeItem('recentSearches') }} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '12px' }}>
              Clear All
            </button>
          </div>
          {recentSearches.map((item, i) => (
            <div key={i} className="suggestion-item" onClick={() => handleSearch(item)} style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <i className="fas fa-history" style={{ color: '#666' }}></i>
                <span>{item}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeRecentSearch(item) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Trending Suggestions */}
      {!query && (
        <div className="card">
          <h3 style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>Trending on SocialVibe</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['#NewMusicFriday', '#BeatMaking', '#StudioSession', '#ProducerLife', '#LivePerformance'].map(tag => (
              <span key={tag} onClick={() => handleSearch(tag)} style={{ background: '#f0f2f5', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Filter Tabs */}
      {query && !loading && (
        <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
          <div className={`tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
            All ({users.length + posts.length + videos.length + gigs.length})
          </div>
          <div className={`tab ${activeFilter === 'users' ? 'active' : ''}`} onClick={() => setActiveFilter('users')}>
            Users ({users.length})
          </div>
          <div className={`tab ${activeFilter === 'posts' ? 'active' : ''}`} onClick={() => setActiveFilter('posts')}>
            Posts ({posts.length})
          </div>
          <div className={`tab ${activeFilter === 'videos' ? 'active' : ''}`} onClick={() => setActiveFilter('videos')}>
            Videos ({videos.length})
          </div>
          <div className={`tab ${activeFilter === 'gigs' ? 'active' : ''}`} onClick={() => setActiveFilter('gigs')}>
            Gigs ({gigs.length})
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && <div className="spinner"></div>}
      
      {/* No Results */}
      {query && !loading && !hasResults && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fas fa-search" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
          <p style={{ color: '#888', fontSize: '16px' }}>No results found for "{query}"</p>
          <p style={{ color: '#999', fontSize: '13px', marginTop: '8px' }}>Try searching for something else</p>
        </div>
      )}
      
      {/* Users Results */}
      {activeFilter === 'all' && users.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Users</h2>
            <span className="see-all" onClick={() => setActiveFilter('users')}>See all {users.length} →</span>
          </div>
          {users.slice(0, 3).map(user => (
            <div
              key={user.id}
              className="card"
              style={{ cursor: 'pointer', marginBottom: '12px' }}
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=000&color=fff`}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                  alt="avatar"
                />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>
                    {user.display_name || user.username}
                    {user.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>@{user.username}</div>
                  {user.bio && <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#555' }}>{user.bio.substring(0, 80)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Full Users List (when filter active) */}
      {activeFilter === 'users' && users.map(user => (
        <div
          key={user.id}
          className="card"
          style={{ cursor: 'pointer', marginBottom: '12px' }}
          onClick={() => navigate(`/profile/${user.id}`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=000&color=fff`}
              style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
              alt="avatar"
            />
            <div>
              <div style={{ fontWeight: '700', fontSize: '16px' }}>
                {user.display_name || user.username}
                {user.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
              </div>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>@{user.username}</div>
              {user.bio && <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#555' }}>{user.bio.substring(0, 100)}</div>}
            </div>
            <button className="follow-btn" style={{ marginLeft: 'auto' }}>Follow</button>
          </div>
        </div>
      ))}
      
      {/* Posts Results */}
      {activeFilter === 'all' && posts.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Posts</h2>
            <span className="see-all" onClick={() => setActiveFilter('posts')}>See all {posts.length} →</span>
          </div>
          {posts.slice(0, 3).map(post => (
            <div key={post.id} className="card" style={{ cursor: 'pointer', marginBottom: '12px' }} onClick={() => navigate('/')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <img
                  src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(post.profiles?.username || 'U')[0]}&background=000&color=fff`}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
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
              <p>{post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}</p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '16px', color: '#888', fontSize: '0.8rem' }}>
                <span>👏 {post.applause_count || 0}</span>
                <span>💬 {post.comment_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Videos Results */}
      {activeFilter === 'all' && videos.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Videos</h2>
            <span className="see-all" onClick={() => setActiveFilter('videos')}>See all {videos.length} →</span>
          </div>
          <div className="video-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {videos.slice(0, 4).map(video => (
              <div key={video.id} className="video-card" onClick={() => navigate('/music')}>
                <div className="video-thumbnail">
                  <img src={video.thumbnail_url || 'https://picsum.photos/400/225'} alt="" />
                  <div className="play-overlay">▶️</div>
                </div>
                <div className="video-info">
                  <div className="video-title">{video.title.substring(0, 30)}</div>
                  <div className="video-meta">{video.views_count || 0} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Gigs Results */}
      {activeFilter === 'all' && gigs.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Gigs</h2>
            <span className="see-all" onClick={() => setActiveFilter('gigs')}>See all {gigs.length} →</span>
          </div>
          <div className="grid-2">
            {gigs.slice(0, 4).map(gig => (
              <div key={gig.id} className="card" onClick={() => navigate('/gigs')}>
                <h4>{gig.title}</h4>
                <p style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                  by {gig.profiles?.display_name || gig.profiles?.username}
                </p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>{gig.description?.substring(0, 80)}</p>
                <p style={{ color: '#000', fontWeight: 'bold', marginTop: '8px' }}>
                  {gig.is_paid ? `$${gig.price}` : 'Free'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Full Results for other filters */}
      {activeFilter === 'posts' && posts.map(post => (
        <div key={post.id} className="card" style={{ cursor: 'pointer', marginBottom: '12px' }} onClick={() => navigate('/')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <img
              src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(post.profiles?.username || 'U')[0]}&background=000&color=fff`}
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
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
          <p>{post.content}</p>
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', color: '#888', fontSize: '0.8rem' }}>
            <span>👏 {post.applause_count || 0}</span>
            <span>💬 {post.comment_count || 0}</span>
          </div>
        </div>
      ))}
      
      {activeFilter === 'videos' && (
        <div className="video-grid">
          {videos.map(video => (
            <div key={video.id} className="video-card" onClick={() => navigate('/music')}>
              <div className="video-thumbnail">
                <img src={video.thumbnail_url || 'https://picsum.photos/400/225'} alt="" />
                <div className="play-overlay">▶️</div>
              </div>
              <div className="video-info">
                <div className="video-title">{video.title}</div>
                <div className="video-meta">{video.views_count || 0} views</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeFilter === 'gigs' && (
        <div className="grid-2">
          {gigs.map(gig => (
            <div key={gig.id} className="card" onClick={() => navigate('/gigs')}>
              <h4>{gig.title}</h4>
              <p style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                by {gig.profiles?.display_name || gig.profiles?.username}
              </p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>{gig.description?.substring(0, 100)}</p>
              <p style={{ color: '#000', fontWeight: 'bold', marginTop: '8px' }}>
                {gig.is_paid ? `$${gig.price}` : 'Free'} • 📍 {gig.is_virtual ? 'Virtual' : gig.location}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}