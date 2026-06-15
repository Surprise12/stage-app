// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)
  const [friendRequestCount, setFriendRequestCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    if (session) {
      loadNotificationCounts()
      loadUnreadMessagesCount()
      loadFriendRequestCount()
    }
  }, [session])

  async function loadNotificationCounts() {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session?.user?.id)
      .eq('read', false)
    setNotificationCount(count || 0)
  }

  async function loadUnreadMessagesCount() {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant1_id.eq.${session?.user?.id},participant2_id.eq.${session?.user?.id}`)
    
    if (conversations && conversations.length > 0) {
      const convIds = conversations.map(c => c.id)
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .neq('sender_id', session?.user?.id)
        .eq('is_read', false)
      setMessageCount(count || 0)
    }
  }

  async function loadFriendRequestCount() {
    const { count } = await supabase
      .from('friend_requests')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', session?.user?.id)
      .eq('status', 'pending')
    setFriendRequestCount(count || 0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    // Search users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, is_verified')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(5)

    // Search posts
    const { data: posts } = await supabase
      .from('posts')
      .select('id, content, created_at')
      .ilike('content', `%${query}%`)
      .limit(3)

    setSearchResults({ users: users || [], posts: posts || [] })
    setShowSearchResults(true)
  }

  const avatarUrl = session?.user?.user_metadata?.avatar_url || 
    `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=000&color=fff`

  // Navigation icons
  const navItems = [
    { icon: '🏠', label: 'Home', path: '/', iconClass: 'fas fa-home' },
    { icon: '👥', label: 'Friends', path: '/friends', iconClass: 'fas fa-user-friends' },
    { icon: '💬', label: 'Messages', path: '/messages', iconClass: 'fas fa-comment-dots' },
    { icon: '🔔', label: 'Notifications', path: '/notifications', iconClass: 'fas fa-bell' }
  ]

  return (
    <div className="top-bar">
      <div className="logo-area">
        <div className="circle-logo" onClick={() => navigate('/')}>
          <span>S</span>
        </div>
        <div className="logo-text" onClick={() => navigate('/')}>
          Social<span>Vibe</span>
        </div>
        
        {/* Search Box */}
        <div className="search-box" style={{ position: 'relative' }}>
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search SocialVibe..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
          />
          
          {/* Search Results Dropdown */}
          {showSearchResults && (searchResults.users?.length > 0 || searchResults.posts?.length > 0) && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              marginTop: '8px',
              zIndex: 1000,
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {searchResults.users?.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                    Users
                  </div>
                  {searchResults.users.map(user => (
                    <div 
                      key={user.id} 
                      className="search-result-item"
                      onClick={() => {
                        navigate(`/profile/${user.id}`)
                        setShowSearchResults(false)
                        setSearchQuery('')
                      }}
                    >
                      <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{user.display_name || user.username}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>@{user.username}</div>
                      </div>
                      {user.is_verified && <span style={{ fontSize: '10px', color: '#1da1f2', marginLeft: 'auto' }}>✓</span>}
                    </div>
                  ))}
                </>
              )}
              {searchResults.posts?.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666', fontWeight: 'bold', borderBottom: '1px solid #eee', borderTop: '1px solid #eee' }}>
                    Posts
                  </div>
                  {searchResults.posts.map(post => (
                    <div 
                      key={post.id} 
                      className="search-result-item"
                      onClick={() => {
                        navigate('/')
                        setShowSearchResults(false)
                        setSearchQuery('')
                      }}
                    >
                      <div style={{ fontSize: '13px' }}>{post.content.substring(0, 80)}...</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Simplified Navigation - Desktop Icons */}
      <div className="nav-links-desktop">
        {navItems.map((item) => {
          let badgeCount = 0
          if (item.path === '/friends') badgeCount = friendRequestCount
          if (item.path === '/messages') badgeCount = messageCount
          if (item.path === '/notifications') badgeCount = notificationCount
          
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className="nav-icon" 
              title={item.label}
              style={{ position: 'relative' }}
            >
              <i className={item.iconClass}></i>
              {badgeCount > 0 && (
                <span className="badge" style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ff4444', color: 'white', fontSize: '10px', padding: '2px 5px', borderRadius: '20px', minWidth: '16px', textAlign: 'center' }}>
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
      
      <div className="header-icons">
        {/* Explore Icon */}
        <div className="header-icon" onClick={() => navigate('/explore')} title="Explore">
          <i className="fas fa-compass"></i>
        </div>
        
        {/* Profile Icon */}
        <div className="profile-icon" onClick={() => setShowDropdown(!showDropdown)}>
          <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Profile Dropdown */}
      {showDropdown && (
        <>
          <div className="profile-dropdown active" id="profileDropdown">
            <div className="dropdown-header">
              <div className="dropdown-user" onClick={() => { navigate('/profile'); setShowDropdown(false) }}>
                <div className="dropdown-user-avatar">
                  <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <div className="dropdown-user-info">
                  <h4>{session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0]}</h4>
                  <p>@{session?.user?.email?.split('@')[0]}</p>
                </div>
              </div>
            </div>
            
            <div className="dropdown-item" onClick={() => { navigate('/profile'); setShowDropdown(false) }}>
              <i className="fas fa-user"></i><span>Profile</span>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/settings'); setShowDropdown(false) }}>
              <i className="fas fa-cog"></i><span>Settings & privacy</span>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/help'); setShowDropdown(false) }}>
              <i className="fas fa-question-circle"></i><span>Help & support</span>
            </div>
            
            <div className="dropdown-divider"></div>
            
            <div className="dropdown-item" onClick={() => { navigate('/create-post'); setShowDropdown(false) }}>
              <i className="fas fa-pen-alt"></i><span>Create post</span>
            </div>
            <div className="dropdown-item" onClick={() => { navigate('/create-story'); setShowDropdown(false) }}>
              <i className="fas fa-plus-circle"></i><span>Add story</span>
            </div>
            
            <div className="dropdown-divider"></div>
            
            <div className="dropdown-item" onClick={() => { navigate('/feedback'); setShowDropdown(false) }}>
              <i className="fas fa-comment"></i><span>Give feedback <span className="keyboard-shortcut">Ctrl B</span></span>
            </div>
            
            <div className="dropdown-divider"></div>
            
            <div className="dropdown-item" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i><span>Log out</span>
            </div>
          </div>
          <div className="modal-overlay" onClick={() => setShowDropdown(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}></div>
        </>
      )}
    </div>
  )
}