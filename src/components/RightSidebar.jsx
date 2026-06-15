import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RightSidebar({ session }) {
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [trending, setTrending] = useState([
    { topic: 'Sarah Chen', change: '+245%' },
    { topic: 'Marcus Webb', change: '+189%' },
    { topic: 'Summer Festival', change: '+156%' }
  ])

  useEffect(() => {
    loadSuggestions()
    loadFriendRequests()
  }, [])

  async function loadSuggestions() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, is_verified')
      .neq('id', session?.user?.id)
      .limit(5)
    if (data) setSuggestions(data)
  }

  async function loadFriendRequests() {
    const { data } = await supabase
      .from('friend_requests')
      .select('*, sender:sender_id(id, username, display_name, avatar_url)')
      .eq('receiver_id', session?.user?.id)
      .eq('status', 'pending')
      .limit(3)
    if (data) setFriendRequests(data)
  }

  async function handleFollow(userId) {
    await supabase
      .from('follows')
      .insert({ follower_id: session.user.id, following_id: userId })
    loadSuggestions()
  }

  async function acceptRequest(requestId) {
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
    loadFriendRequests()
  }

  return (
    <div className="right-sidebar">
      <div className="suggestions-card">
        {/* Suggested for You */}
        <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid #eee' }}>
          <div className="suggestions-header">
            <span>Suggested for You</span>
            <span className="see-all" onClick={() => navigate('/friends')}>See all</span>
          </div>
          {suggestions.map(user => (
            <div key={user.id} className="suggestion-item" onClick={() => navigate(`/profile/${user.id}`)}>
              <div className="suggestion-avatar">
                <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              </div>
              <div className="suggestion-info">
                <div className="suggestion-name">{user.display_name || user.username}</div>
                <div className="suggestion-meta">{Math.floor(Math.random() * 20)} mutual friends</div>
              </div>
              <button className="follow-btn" onClick={(e) => { e.stopPropagation(); handleFollow(user.id) }}>Follow</button>
            </div>
          ))}
        </div>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <div style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}>
            <div className="suggestions-header">
              <span>Friend Requests</span>
              <span className="see-all">{friendRequests.length} new</span>
            </div>
            {friendRequests.map(req => (
              <div key={req.id} className="request-item" onClick={() => navigate(`/profile/${req.sender?.id}`)}>
                <div className="request-avatar">
                  <img src={req.sender?.avatar_url || `https://ui-avatars.com/api/?name=${(req.sender?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div className="request-info">
                  <div className="request-name">{req.sender?.display_name || req.sender?.username}</div>
                  <div className="request-mutual">{Math.floor(Math.random() * 10)} mutual friends</div>
                </div>
                <div className="request-buttons">
                  <button className="request-btn accept" onClick={(e) => { e.stopPropagation(); acceptRequest(req.id) }}>✓</button>
                  <button className="request-btn decline" onClick={(e) => e.stopPropagation()}>✗</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trending Today */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid #eee' }}>
          <div className="suggestions-header">
            <span>Trending Today</span>
            <span className="see-all">See all</span>
          </div>
          {trending.map((item, i) => (
            <div key={i} className="suggestion-item" onClick={() => navigate(`/search?q=${item.topic}`)}>
              <div style={{ width: '28px', height: '28px', background: '#000', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{i+1}</div>
              <div className="suggestion-info">
                <div className="suggestion-name">{item.topic}</div>
              </div>
              <span style={{ color: '#00aa00', fontSize: '11px' }}>{item.change}</span>
            </div>
          ))}
        </div>

        {/* Birthdays */}
        <div style={{ padding: '16px 0 0 0' }}>
          <div className="suggestions-header">
            <span>Birthdays 🎂</span>
          </div>
          <div className="suggestion-item" onClick={() => navigate('/profile/sarah')}>
            <div className="suggestion-avatar">🎂</div>
            <div className="suggestion-info">
              <div className="suggestion-name">Sarah Chen's birthday</div>
              <div className="suggestion-meta">Today</div>
            </div>
            <button className="follow-btn">Wish</button>
          </div>
          <div className="suggestion-item" onClick={() => navigate('/profile/marcus')}>
            <div className="suggestion-avatar">🎂</div>
            <div className="suggestion-info">
              <div className="suggestion-name">Marcus Webb's birthday</div>
              <div className="suggestion-meta">Tomorrow</div>
            </div>
            <button className="follow-btn">Remind</button>
          </div>
        </div>
      </div>
    </div>
  )
}