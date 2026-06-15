import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function FriendsManager({ session }) {
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [nearby, setNearby] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadFriends()
    loadRequests()
    loadSuggestions()
    loadNearby()
  }, [])

  async function loadFriends() {
    // Get user's friends (people who follow each other)
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id)
    
    if (following && following.length > 0) {
      const friendIds = following.map(f => f.following_id)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds)
      if (data) setFriends(data)
    }
  }

  async function loadRequests() {
    const { data } = await supabase
      .from('friend_requests')
      .select('*, sender:sender_id(*)')
      .eq('receiver_id', session.user.id)
      .eq('status', 'pending')
    if (data) setRequests(data)
  }

  async function loadSuggestions() {
    // Get users not followed and not self
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', session.user.id)
      .limit(10)
    if (data) setSuggestions(data)
  }

  async function loadNearby() {
    // Mock nearby users - in production use geolocation
    setNearby([
      { id: 1, name: 'David Kim', distance: '0.5 miles', avatar: 'D', mutual: 12 },
      { id: 2, name: 'Lisa Wang', distance: '1.2 miles', avatar: 'L', mutual: 8 }
    ])
  }

  async function acceptRequest(requestId) {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId)
    await loadRequests()
    await loadFriends()
  }

  async function declineRequest(requestId) {
    await supabase.from('friend_requests').delete().eq('id', requestId)
    await loadRequests()
  }

  async function sendFriendRequest(userId) {
    await supabase.from('friend_requests').insert({
      sender_id: session.user.id,
      receiver_id: userId,
      status: 'pending'
    })
    showToast('Friend request sent!')
    await loadSuggestions()
  }

  const filteredFriends = friends.filter(f => 
    f.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div className="friends-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Friends</h1>
        <div className="friends-search" style={{ background: '#f0f2f5', borderRadius: '40px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', width: '300px' }}>
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Search friends..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontWeight: 'bold' }} />
        </div>
      </div>

      <div className="friend-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('all')}>
          <div className="stat-number" style={{ fontSize: '28px', fontWeight: 'bold' }}>{friends.length}</div>
          <div className="stat-label" style={{ color: '#666', fontWeight: 'bold' }}>Total Friends</div>
        </div>
        <div className="stat-card" style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('requests')}>
          <div className="stat-number" style={{ fontSize: '28px', fontWeight: 'bold' }}>{requests.length}</div>
          <div className="stat-label" style={{ color: '#666', fontWeight: 'bold' }}>Friend Requests</div>
        </div>
        <div className="stat-card" style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('suggestions')}>
          <div className="stat-number" style={{ fontSize: '28px', fontWeight: 'bold' }}>{suggestions.length}</div>
          <div className="stat-label" style={{ color: '#666', fontWeight: 'bold' }}>Suggestions</div>
        </div>
        <div className="stat-card" style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('nearby')}>
          <div className="stat-number" style={{ fontSize: '28px', fontWeight: 'bold' }}>{nearby.length}</div>
          <div className="stat-label" style={{ color: '#666', fontWeight: 'bold' }}>Nearby</div>
        </div>
      </div>

      <div className="friends-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #eee', paddingBottom: '8px', overflowX: 'auto' }}>
        <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} style={{ padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold', borderBottom: activeTab === 'all' ? '3px solid #000' : 'none' }} onClick={() => setActiveTab('all')}>All Friends</div>
        <div className={`tab ${activeTab === 'requests' ? 'active' : ''}`} style={{ padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab('requests')}>Requests {requests.length > 0 && <span style={{ background: '#ff4444', color: 'white', padding: '2px 6px', borderRadius: '20px', fontSize: '11px', marginLeft: '6px' }}>{requests.length}</span>}</div>
        <div className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`} style={{ padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab('suggestions')}>Suggestions</div>
        <div className={`tab ${activeTab === 'nearby' ? 'active' : ''}`} style={{ padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab('nearby')}>Nearby</div>
        <div className={`tab ${activeTab === 'invite' ? 'active' : ''}`} style={{ padding: '8px 20px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setActiveTab('invite')}>Invite Friends</div>
      </div>

      {/* All Friends Tab */}
      {activeTab === 'all' && (
        <div className="friends-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {filteredFriends.map(friend => (
            <div key={friend.id} className="friend-card" style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid #ddd', cursor: 'pointer' }}>
              <div className="friend-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#667eea', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>{friend.avatar_url ? <img src={friend.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt="" /> : (friend.display_name?.[0] || friend.username?.[0] || 'U')}</div>
              <div className="friend-name" style={{ fontWeight: 'bold' }}>{friend.display_name || friend.username}</div>
              <div className="friend-status" style={{ fontSize: '11px', color: '#00aa00', marginTop: '4px', fontWeight: 'bold' }}>Online</div>
              <div className="friend-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button className="btn btn-primary btn-small" style={{ flex: 1 }}>Message</button>
                <button className="btn btn-outline btn-small" style={{ flex: 1 }}>Unfriend</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {requests.map(req => (
            <div key={req.id} className="request-card" style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="request-avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{req.sender?.display_name?.[0] || req.sender?.username?.[0] || 'U'}</div>
              <div className="request-info" style={{ flex: 1 }}>
                <div className="request-name" style={{ fontWeight: 'bold' }}>{req.sender?.display_name || req.sender?.username}</div>
                <div className="request-mutual" style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>5 mutual friends</div>
              </div>
              <div className="request-buttons" style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-small" onClick={() => acceptRequest(req.id)}>Accept</button>
                <button className="btn btn-outline btn-small" onClick={() => declineRequest(req.id)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="suggestions-grid" style={{ display: 'grid', gap: '12px' }}>
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="suggestion-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #ddd', cursor: 'pointer' }}>
              <div className="suggestion-avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: 'bold' }}>{suggestion.display_name?.[0] || suggestion.username?.[0] || 'U'}</div>
              <div className="suggestion-info" style={{ flex: 1 }}>
                <div className="suggestion-name" style={{ fontWeight: 'bold' }}>{suggestion.display_name || suggestion.username}</div>
                <div className="suggestion-meta" style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>8 mutual friends</div>
              </div>
              <button className="btn btn-primary btn-small" onClick={() => sendFriendRequest(suggestion.id)}>Add Friend</button>
            </div>
          ))}
        </div>
      )}

      {/* Nearby Tab */}
      {activeTab === 'nearby' && (
        <div className="nearby-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {nearby.map(person => (
            <div key={person.id} className="nearby-card" style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid #ddd', cursor: 'pointer' }}>
              <div className="nearby-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#667eea', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>{person.avatar}</div>
              <div className="nearby-name" style={{ fontWeight: 'bold' }}>{person.name}</div>
              <div className="nearby-distance" style={{ fontSize: '12px', color: '#00aa00', fontWeight: 'bold' }}>📍 {person.distance} away</div>
              <div className="nearby-mutual" style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>{person.mutual} mutual friends</div>
              <button className="btn btn-primary btn-small" style={{ marginTop: '12px', width: '100%' }}>Add Friend</button>
            </div>
          ))}
        </div>
      )}

      {/* Invite Tab */}
      {activeTab === 'invite' && (
        <div>
          <div className="import-section" style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
            <div className="import-title" style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Find friends from other apps</div>
            <div className="import-desc" style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.9, fontWeight: 'bold' }}>Connect your contacts to find more friends on Stage</div>
            <div className="import-buttons" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="import-btn" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '40px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}><i className="fab fa-facebook"></i> Facebook</button>
              <button className="import-btn" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '40px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}><i className="fab fa-google"></i> Google</button>
              <button className="import-btn" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '40px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}><i className="fas fa-address-book"></i> Phone Contacts</button>
            </div>
          </div>

          <div className="invite-section" style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #ddd' }}>
            <div className="invite-title" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Invite friends via link</div>
            <div className="invite-link" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input type="text" value={`https://stage.com/invite/${session?.user?.id?.substring(0, 8)}`} readOnly style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '40px', background: '#f0f2f5', fontWeight: 'bold' }} />
              <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(`https://stage.com/invite/${session?.user?.id?.substring(0, 8)}`); alert('Link copied!'); }}>Copy</button>
            </div>
            <div className="invite-social" style={{ display: 'flex', gap: '12px' }}>
              <button className="invite-social-btn" style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '40px', background: 'white', fontWeight: 'bold', cursor: 'pointer' }}><i className="fab fa-whatsapp"></i> WhatsApp</button>
              <button className="invite-social-btn" style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '40px', background: 'white', fontWeight: 'bold', cursor: 'pointer' }}><i className="fab fa-facebook-messenger"></i> Messenger</button>
              <button className="invite-social-btn" style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '40px', background: 'white', fontWeight: 'bold', cursor: 'pointer' }}><i className="fas fa-sms"></i> SMS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function showToast(msg) {
  console.log(msg)
}