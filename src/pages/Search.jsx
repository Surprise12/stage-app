// src/pages/Search.jsx - UPDATED WITH INLINE STYLES
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

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    if (q) {
      setQuery(q)
      handleSearch(q)
    }
  }, [location.search])

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
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
    
    setLoading(true)
    
    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .limit(10)
      if (userData) setUsers(userData)
      
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
    } catch (error) {
      console.error('Error searching:', error)
    }
    
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

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '700',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#6b7280',
      marginBottom: '20px'
    },
    searchCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    searchRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    searchIcon: {
      color: '#6b7280',
      fontSize: '18px'
    },
    searchInput: {
      flex: 1,
      border: 'none',
      padding: '12px 0',
      background: 'transparent',
      fontSize: '16px',
      fontWeight: '700',
      outline: 'none'
    },
    clearBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      fontSize: '16px'
    },
    recentCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    recentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    recentTitle: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700'
    },
    clearAllBtn: {
      background: 'none',
      border: 'none',
      color: '#ef4444',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700'
    },
    recentItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    recentItemLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    recentItemIcon: {
      color: '#6b7280'
    },
    recentItemText: {
      fontWeight: '700'
    },
    removeRecentBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#999',
      fontSize: '14px'
    },
    trendingCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    trendingTitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '12px',
      fontWeight: '700'
    },
    trendingTags: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    trendingTag: {
      background: '#f0f2f5',
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '13px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '20px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '0'
    },
    tab: {
      padding: '10px 20px',
      fontWeight: '700',
      color: '#6b7280',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s',
      fontSize: '14px'
    },
    tabActive: {
      color: '#000'
    },
    tabIndicator: {
      position: 'absolute',
      bottom: '-1px',
      left: 0,
      right: 0,
      height: '2px',
      background: '#7c3aed'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px'
    },
    emptyIcon: {
      fontSize: '48px',
      color: '#ccc',
      marginBottom: '16px'
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    sectionTitle: {
      fontSize: '1.2rem',
      fontWeight: '600'
    },
    seeAll: {
      color: '#000',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700'
    },
    userCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    userAvatar: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    userName: {
      fontWeight: '700',
      fontSize: '16px'
    },
    userVerified: {
      color: '#1da1f2',
      marginLeft: '4px'
    },
    userUsername: {
      color: '#6b7280',
      fontSize: '0.85rem',
      fontWeight: '700'
    },
    userBio: {
      fontSize: '0.85rem',
      marginTop: '4px',
      color: '#4b5563'
    },
    followBtn: {
      marginLeft: 'auto',
      padding: '6px 16px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    postHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px'
    },
    postAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    postName: {
      fontWeight: '600'
    },
    postTime: {
      fontSize: '0.7rem',
      color: '#6b7280',
      fontWeight: '700'
    },
    postContent: {
      fontWeight: '700'
    },
    postStats: {
      marginTop: '12px',
      display: 'flex',
      gap: '16px',
      color: '#6b7280',
      fontSize: '0.8rem',
      fontWeight: '700'
    },
    videoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '16px'
    },
    videoCard: {
      background: '#f0f2f5',
      borderRadius: '12px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: '1px solid #e5e7eb',
      transition: 'all 0.2s'
    },
    videoThumbnail: {
      height: '120px',
      background: '#ddd',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    videoThumbnailImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    playOverlay: {
      position: 'absolute',
      fontSize: '32px'
    },
    videoInfo: {
      padding: '12px'
    },
    videoTitle: {
      fontWeight: '700',
      fontSize: '13px',
      marginBottom: '4px'
    },
    videoMeta: {
      color: '#6b7280',
      fontSize: '11px',
      fontWeight: '700'
    },
    gigGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '16px'
    },
    gigCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    gigTitle: {
      fontWeight: '700',
      fontSize: '16px'
    },
    gigCreator: {
      color: '#6b7280',
      fontSize: '12px',
      fontWeight: '700'
    },
    gigDesc: {
      fontSize: '13px',
      marginTop: '8px',
      fontWeight: '700'
    },
    gigPrice: {
      color: '#000',
      fontWeight: '700',
      marginTop: '8px'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(124,58,237,0.2)',
      borderTop: '4px solid #7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '20px auto'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔍 Search</h1>
      <p style={styles.subtitle}>Find users, posts, videos, and gigs</p>
      
      {/* Search Input */}
      <div style={styles.searchCard}>
        <div style={styles.searchRow}>
          <i className="fas fa-search" style={styles.searchIcon}></i>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search SocialVibe..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={clearSearch} style={styles.clearBtn}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
      
      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <div style={styles.recentCard}>
          <div style={styles.recentHeader}>
            <h3 style={styles.recentTitle}>Recent Searches</h3>
            <button onClick={() => { setRecentSearches([]); localStorage.removeItem('recentSearches') }} style={styles.clearAllBtn}>
              Clear All
            </button>
          </div>
          {recentSearches.map((item, i) => (
            <div key={i} style={styles.recentItem} onClick={() => handleSearch(item)}>
              <div style={styles.recentItemLeft}>
                <i className="fas fa-history" style={styles.recentItemIcon}></i>
                <span style={styles.recentItemText}>{item}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeRecentSearch(item) }} style={styles.removeRecentBtn}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Trending Suggestions */}
      {!query && (
        <div style={styles.trendingCard}>
          <h3 style={styles.trendingTitle}>Trending on SocialVibe</h3>
          <div style={styles.trendingTags}>
            {['#NewMusicFriday', '#BeatMaking', '#StudioSession', '#ProducerLife', '#LivePerformance'].map(tag => (
              <span key={tag} style={styles.trendingTag} onClick={() => handleSearch(tag)}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Filter Tabs */}
      {query && !loading && (
        <div style={styles.tabs}>
          <div 
            style={{...styles.tab, ...(activeFilter === 'all' ? styles.tabActive : {})}}
            onClick={() => setActiveFilter('all')}
          >
            All ({users.length + posts.length + videos.length + gigs.length})
            {activeFilter === 'all' && <div style={styles.tabIndicator}></div>}
          </div>
          <div 
            style={{...styles.tab, ...(activeFilter === 'users' ? styles.tabActive : {})}}
            onClick={() => setActiveFilter('users')}
          >
            Users ({users.length})
            {activeFilter === 'users' && <div style={styles.tabIndicator}></div>}
          </div>
          <div 
            style={{...styles.tab, ...(activeFilter === 'posts' ? styles.tabActive : {})}}
            onClick={() => setActiveFilter('posts')}
          >
            Posts ({posts.length})
            {activeFilter === 'posts' && <div style={styles.tabIndicator}></div>}
          </div>
          <div 
            style={{...styles.tab, ...(activeFilter === 'videos' ? styles.tabActive : {})}}
            onClick={() => setActiveFilter('videos')}
          >
            Videos ({videos.length})
            {activeFilter === 'videos' && <div style={styles.tabIndicator}></div>}
          </div>
          <div 
            style={{...styles.tab, ...(activeFilter === 'gigs' ? styles.tabActive : {})}}
            onClick={() => setActiveFilter('gigs')}
          >
            Gigs ({gigs.length})
            {activeFilter === 'gigs' && <div style={styles.tabIndicator}></div>}
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && <div style={styles.spinner}></div>}
      
      {/* No Results */}
      {query && !loading && !hasResults && (
        <div style={styles.card}>
          <div style={styles.emptyState}>
            <i className="fas fa-search" style={styles.emptyIcon}></i>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>No results found for "{query}"</p>
            <p style={{ color: '#999', fontSize: '13px', marginTop: '8px' }}>Try searching for something else</p>
          </div>
        </div>
      )}
      
      {/* Users Results */}
      {activeFilter === 'all' && users.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Users</h2>
            <span style={styles.seeAll} onClick={() => setActiveFilter('users')}>See all {users.length} →</span>
          </div>
          {users.slice(0, 3).map(user => (
            <div
              key={user.id}
              style={styles.card}
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <div style={styles.userCard}>
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=000&color=fff`}
                  style={styles.userAvatar}
                  alt="avatar"
                />
                <div>
                  <div style={styles.userName}>
                    {user.display_name || user.username}
                    {user.is_verified && <span style={styles.userVerified}>✓</span>}
                  </div>
                  <div style={styles.userUsername}>@{user.username}</div>
                  {user.bio && <div style={styles.userBio}>{user.bio.substring(0, 80)}</div>}
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
          style={styles.card}
          onClick={() => navigate(`/profile/${user.id}`)}
        >
          <div style={styles.userCard}>
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=000&color=fff`}
              style={styles.userAvatar}
              alt="avatar"
            />
            <div>
              <div style={styles.userName}>
                {user.display_name || user.username}
                {user.is_verified && <span style={styles.userVerified}>✓</span>}
              </div>
              <div style={styles.userUsername}>@{user.username}</div>
              {user.bio && <div style={styles.userBio}>{user.bio.substring(0, 100)}</div>}
            </div>
            <button style={styles.followBtn}>Follow</button>
          </div>
        </div>
      ))}
      
      {/* Posts Results */}
      {activeFilter === 'all' && posts.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Posts</h2>
            <span style={styles.seeAll} onClick={() => setActiveFilter('posts')}>See all {posts.length} →</span>
          </div>
          {posts.slice(0, 3).map(post => (
            <div key={post.id} style={styles.card} onClick={() => navigate('/')}>
              <div style={styles.postHeader}>
                <img
                  src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(post.profiles?.username || 'U')[0]}&background=000&color=fff`}
                  style={styles.postAvatar}
                  alt="avatar"
                />
                <div>
                  <div style={styles.postName}>
                    {post.profiles?.display_name || post.profiles?.username}
                    {post.profiles?.is_verified && <span style={styles.userVerified}>✓</span>}
                  </div>
                  <div style={styles.postTime}>{formatTimeAgo(post.created_at)}</div>
                </div>
              </div>
              <p style={styles.postContent}>{post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}</p>
              <div style={styles.postStats}>
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
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Videos</h2>
            <span style={styles.seeAll} onClick={() => setActiveFilter('videos')}>See all {videos.length} →</span>
          </div>
          <div style={styles.videoGrid}>
            {videos.slice(0, 4).map(video => (
              <div key={video.id} style={styles.videoCard} onClick={() => navigate('/music')}>
                <div style={styles.videoThumbnail}>
                  <img src={video.thumbnail_url || 'https://picsum.photos/400/225'} style={styles.videoThumbnailImg} alt="" />
                  <div style={styles.playOverlay}>▶️</div>
                </div>
                <div style={styles.videoInfo}>
                  <div style={styles.videoTitle}>{video.title.substring(0, 30)}</div>
                  <div style={styles.videoMeta}>{video.views_count || 0} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Gigs Results */}
      {activeFilter === 'all' && gigs.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Gigs</h2>
            <span style={styles.seeAll} onClick={() => setActiveFilter('gigs')}>See all {gigs.length} →</span>
          </div>
          <div style={styles.gigGrid}>
            {gigs.slice(0, 4).map(gig => (
              <div key={gig.id} style={styles.gigCard} onClick={() => navigate('/gigs')}>
                <h4 style={styles.gigTitle}>{gig.title}</h4>
                <p style={styles.gigCreator}>
                  by {gig.profiles?.display_name || gig.profiles?.username}
                </p>
                <p style={styles.gigDesc}>{gig.description?.substring(0, 80)}</p>
                <p style={styles.gigPrice}>
                  {gig.is_paid ? `$${gig.price}` : 'Free'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Full Results for other filters */}
      {activeFilter === 'posts' && posts.map(post => (
        <div key={post.id} style={styles.card} onClick={() => navigate('/')}>
          <div style={styles.postHeader}>
            <img
              src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(post.profiles?.username || 'U')[0]}&background=000&color=fff`}
              style={styles.postAvatar}
              alt="avatar"
            />
            <div>
              <div style={styles.postName}>
                {post.profiles?.display_name || post.profiles?.username}
                {post.profiles?.is_verified && <span style={styles.userVerified}>✓</span>}
              </div>
              <div style={styles.postTime}>{formatTimeAgo(post.created_at)}</div>
            </div>
          </div>
          <p style={styles.postContent}>{post.content}</p>
          <div style={styles.postStats}>
            <span>👏 {post.applause_count || 0}</span>
            <span>💬 {post.comment_count || 0}</span>
          </div>
        </div>
      ))}
      
      {activeFilter === 'videos' && (
        <div style={styles.videoGrid}>
          {videos.map(video => (
            <div key={video.id} style={styles.videoCard} onClick={() => navigate('/music')}>
              <div style={styles.videoThumbnail}>
                <img src={video.thumbnail_url || 'https://picsum.photos/400/225'} style={styles.videoThumbnailImg} alt="" />
                <div style={styles.playOverlay}>▶️</div>
              </div>
              <div style={styles.videoInfo}>
                <div style={styles.videoTitle}>{video.title}</div>
                <div style={styles.videoMeta}>{video.views_count || 0} views</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeFilter === 'gigs' && (
        <div style={styles.gigGrid}>
          {gigs.map(gig => (
            <div key={gig.id} style={styles.gigCard} onClick={() => navigate('/gigs')}>
              <h4 style={styles.gigTitle}>{gig.title}</h4>
              <p style={styles.gigCreator}>
                by {gig.profiles?.display_name || gig.profiles?.username}
              </p>
              <p style={styles.gigDesc}>{gig.description?.substring(0, 100)}</p>
              <p style={styles.gigPrice}>
                {gig.is_paid ? `$${gig.price}` : 'Free'} • 📍 {gig.is_virtual ? 'Virtual' : gig.location}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}