// src/pages/Friends.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Friends({ session }) {
  const navigate = useNavigate()
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('friends')

  useEffect(() => {
    loadFriends()
    loadFriendRequests()
    loadSuggestions()
  }, [])

  async function loadFriends() {
    try {
      const { data } = await supabase
        .from('friends')
        .select(`
          *,
          user:user_id (id, username, display_name, avatar_url, is_verified),
          friend:friend_id (id, username, display_name, avatar_url, is_verified)
        `)
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
        .eq('status', 'accepted')

      if (data) {
        const friendList = data.map(f => 
          f.user_id === session.user.id ? f.friend : f.user
        )
        setFriends(friendList)
      }
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  async function loadFriendRequests() {
    try {
      const { data } = await supabase
        .from('friends')
        .select(`
          *,
          user:user_id (id, username, display_name, avatar_url, is_verified),
          friend:friend_id (id, username, display_name, avatar_url, is_verified)
        `)
        .eq('friend_id', session.user.id)
        .eq('status', 'pending')

      if (data) {
        const requests = data.map(f => ({
          ...f,
          from: f.user
        }))
        setFriendRequests(requests)
      }
    } catch (error) {
      console.error('Error loading friend requests:', error)
    }
    setLoading(false)
  }

  async function loadSuggestions() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', session.user.id)
        .limit(10)

      if (data) setSuggestions(data)
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  async function acceptFriendRequest(requestId) {
    try {
      await supabase
        .from('friends')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', requestId)

      loadFriends()
      loadFriendRequests()
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  async function declineFriendRequest(requestId) {
    try {
      await supabase
        .from('friends')
        .delete()
        .eq('id', requestId)

      loadFriendRequests()
    } catch (error) {
      console.error('Error declining friend request:', error)
    }
  }

  async function removeFriend(friendId) {
    if (confirm('Remove this friend?')) {
      try {
        await supabase
          .from('friends')
          .delete()
          .or(`and(user_id.eq.${session.user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${session.user.id})`)

        loadFriends()
      } catch (error) {
        console.error('Error removing friend:', error)
      }
    }
  }

  async function addFriend(userId) {
    try {
      await supabase
        .from('friends')
        .insert({
          user_id: session.user.id,
          friend_id: userId,
          status: 'pending'
        })

      alert('Friend request sent!')
      loadSuggestions()
    } catch (error) {
      console.error('Error adding friend:', error)
    }
  }

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '24px'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      borderBottom: '2px solid #eee'
    },
    tab: {
      padding: '10px 20px',
      fontWeight: '700',
      color: '#6b7280',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s'
    },
    tabActive: {
      color: '#000'
    },
    tabIndicator: {
      position: 'absolute',
      bottom: '-2px',
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
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    friendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer'
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    name: {
      fontWeight: '700',
      fontSize: '16px'
    },
    verified: {
      color: '#1da1f2',
      marginLeft: '4px'
    },
    username: {
      fontSize: '13px',
      color: '#6b7280'
    },
    actions: {
      marginLeft: 'auto',
      display: 'flex',
      gap: '8px'
    },
    acceptBtn: {
      padding: '6px 16px',
      background: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    declineBtn: {
      padding: '6px 16px',
      background: 'transparent',
      color: '#ef4444',
      border: '1px solid #ef4444',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    addBtn: {
      padding: '6px 16px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    removeBtn: {
      padding: '6px 16px',
      background: 'transparent',
      color: '#ef4444',
      border: '1px solid #ef4444',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280'
    },
    emptyIcon: {
      fontSize: '48px',
      color: '#ccc',
      marginBottom: '16px'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>👥 Friends</h1>

      <div style={styles.tabs}>
        <div
          style={{...styles.tab, ...(activeTab === 'friends' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
          {activeTab === 'friends' && <div style={styles.tabIndicator}></div>}
        </div>
        <div
          style={{...styles.tab, ...(activeTab === 'requests' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('requests')}
        >
          Requests ({friendRequests.length})
          {activeTab === 'requests' && <div style={styles.tabIndicator}></div>}
        </div>
        <div
          style={{...styles.tab, ...(activeTab === 'suggestions' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
          {activeTab === 'suggestions' && <div style={styles.tabIndicator}></div>}
        </div>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : friends.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>👤</div>
                <p>No friends yet</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Connect with people to build your network</p>
              </div>
            </div>
          ) : (
            friends.map(friend => (
              <div key={friend.id} style={styles.card}>
                <div style={styles.friendItem} onClick={() => navigate(`/profile/${friend.id}`)}>
                  <img
                    src={friend.avatar_url || `https://ui-avatars.com/api/?name=${(friend.username || 'U')[0]}&background=7c3aed&color=fff`}
                    style={styles.avatar}
                    alt={friend.username}
                  />
                  <div>
                    <div style={styles.name}>
                      {friend.display_name || friend.username}
                      {friend.is_verified && <span style={styles.verified}>✓</span>}
                    </div>
                    <div style={styles.username}>@{friend.username}</div>
                  </div>
                  <div style={styles.actions}>
                    <button
                      style={styles.removeBtn}
                      onClick={(e) => { e.stopPropagation(); removeFriend(friend.id) }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {friendRequests.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📭</div>
                <p>No friend requests</p>
              </div>
            </div>
          ) : (
            friendRequests.map(req => (
              <div key={req.id} style={styles.card}>
                <div style={styles.friendItem}>
                  <img
                    src={req.from?.avatar_url || `https://ui-avatars.com/api/?name=${(req.from?.username || 'U')[0]}&background=7c3aed&color=fff`}
                    style={styles.avatar}
                    alt={req.from?.username}
                  />
                  <div>
                    <div style={styles.name}>
                      {req.from?.display_name || req.from?.username}
                      {req.from?.is_verified && <span style={styles.verified}>✓</span>}
                    </div>
                    <div style={styles.username}>@{req.from?.username}</div>
                  </div>
                  <div style={styles.actions}>
                    <button
                      style={styles.acceptBtn}
                      onClick={() => acceptFriendRequest(req.id)}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                    >
                      Accept
                    </button>
                    <button
                      style={styles.declineBtn}
                      onClick={() => declineFriendRequest(req.id)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444' }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <>
          {suggestions.map(user => (
            <div key={user.id} style={styles.card}>
              <div style={styles.friendItem} onClick={() => navigate(`/profile/${user.id}`)}>
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=7c3aed&color=fff`}
                  style={styles.avatar}
                  alt={user.username}
                />
                <div>
                  <div style={styles.name}>
                    {user.display_name || user.username}
                    {user.is_verified && <span style={styles.verified}>✓</span>}
                  </div>
                  <div style={styles.username}>@{user.username}</div>
                </div>
                <div style={styles.actions}>
                  <button
                    style={styles.addBtn}
                    onClick={(e) => { e.stopPropagation(); addFriend(user.id) }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                  >
                    Add Friend
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}