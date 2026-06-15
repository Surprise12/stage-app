// src/components/FriendsManager.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function FriendsManager({ session }) {
  const navigate = useNavigate()
  const [friends, setFriends] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [nearby, setNearby] = useState([])
  const [onlineFriends, setOnlineFriends] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showToast, setShowToast] = useState({ show: false, message: '' })

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    await Promise.all([
      loadFriends(),
      loadFriendRequests(),
      loadSentRequests(),
      loadSuggestions(),
      loadNearby(),
      loadOnlineFriends(),
      loadBirthdays()
    ])
    setLoading(false)
  }

  async function loadFriends() {
    // Get user's friends (mutual follows)
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

  async function loadFriendRequests() {
    const { data } = await supabase
      .from('friend_requests')
      .select('*, sender:sender_id(*)')
      .eq('receiver_id', session.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setFriendRequests(data)
  }

  async function loadSentRequests() {
    const { data } = await supabase
      .from('friend_requests')
      .select('*, receiver:receiver_id(*)')
      .eq('sender_id', session.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setSentRequests(data)
  }

  async function loadSuggestions() {
    // Get users not followed and not self, ordered by mutual friends
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id)
    
    const followingIds = following?.map(f => f.following_id) || []
    followingIds.push(session.user.id)
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${followingIds.join(',')})`)
      .limit(15)
    
    // Calculate mutual friends count (simplified)
    const suggestionsWithMutual = data?.map(user => ({
      ...user,
      mutualCount: Math.floor(Math.random() * 15) + 1
    })) || []
    
    setSuggestions(suggestionsWithMutual)
  }

  async function loadNearby() {
    // In production, use geolocation
    setNearby([
      { id: 'nearby1', name: 'David Kim', username: 'davidkim', distance: '0.5 miles', avatar: 'D', mutual: 12, bio: 'Music producer based in LA' },
      { id: 'nearby2', name: 'Lisa Wang', username: 'lisawang', distance: '1.2 miles', avatar: 'L', mutual: 8, bio: 'Singer-songwriter' },
      { id: 'nearby3', name: 'Tom Bradley', username: 'tombradley', distance: '2.3 miles', avatar: 'T', mutual: 15, bio: 'Comedian and content creator' }
    ])
  }

  async function loadOnlineFriends() {
    // In production, track online status
    setOnlineFriends([
      { id: 'online1', name: 'Sarah Chen', username: 'sarahchen', avatar: 'S', status: 'online' },
      { id: 'online2', name: 'Elena Rodriguez', username: 'elenarodriguez', avatar: 'E', status: 'online' }
    ])
  }

  async function loadBirthdays() {
    setBirthdays([
      { id: 'bday1', name: 'Sarah Chen', username: 'sarahchen', date: 'Today', avatar: 'S' },
      { id: 'bday2', name: 'Marcus Webb', username: 'marcuswebb', date: 'Tomorrow', avatar: 'M' }
    ])
  }

  async function acceptRequest(requestId) {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId)
    showToastMessage('Friend request accepted!')
    await loadAllData()
  }

  async function declineRequest(requestId) {
    await supabase.from('friend_requests').delete().eq('id', requestId)
    showToastMessage('Friend request declined')
    await loadAllData()
  }

  async function sendFriendRequest(userId, userName) {
    const { error } = await supabase.from('friend_requests').insert({
      sender_id: session.user.id,
      receiver_id: userId,
      status: 'pending'
    })
    
    if (error) {
      showToastMessage('Error sending request: ' + error.message)
    } else {
      showToastMessage(`Friend request sent to ${userName}!`)
      await loadSuggestions()
    }
  }

  async function unfriend(friendId, friendName) {
    if (confirm(`Remove ${friendName} from your friends?`)) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', friendId)
      
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', friendId)
        .eq('following_id', session.user.id)
      
      showToastMessage(`Removed ${friendName} from friends`)
      await loadAllData()
    }
  }

  async function cancelSentRequest(requestId) {
    await supabase.from('friend_requests').delete().eq('id', requestId)
    showToastMessage('Friend request cancelled')
    await loadAllData()
  }

  function showToastMessage(message) {
    setShowToast({ show: true, message })
    setTimeout(() => setShowToast({ show: false, message: '' }), 3000)
  }

  function copyInviteLink() {
    const link = `https://socialvibe.com/invite/${session.user.id.substring(0, 8)}`
    navigator.clipboard.writeText(link)
    showToastMessage('Invite link copied!')
  }

  const filteredFriends = friends.filter(f => 
    f.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="spinner"></div>
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div className="friends-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Friends</h1>
        <div className="friends-search" style={{ background: '#f0f2f5', borderRadius: '40px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', width: '300px' }}>
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search friends..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontWeight: 'bold' }} 
          />
        </div>
      </div>

      {/* Friend Stats */}
      <div className="friend-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('all')}>
          <div className="stat-number" style={{ fontSize: '28px', fontWeight: 'bold' }}>{friends.length}</div>
          <div className="stat-label" style={{ color: '#666', fontWeight: 'bold' }}>Total Friends</div>
        </div>
        <div className="stat-card" style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setActiveTab('requests')}>
          <div className="stat-number" style={{ fontSize: '28px', fontWeight: 'bold' }}>{friendRequests.length}</div>
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

      {/* Friends Tabs */}
      <div className="friends-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #eee', paddingBottom: '8px', overflowX: 'auto' }}>
        <div className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Friends</div>
        <div className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          Requests {friendRequests.length > 0 && <span className="friends-tab-badge">{friendRequests.length}</span>}
        </div>
        <div className={`tab ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveTab('sent')}>
          Sent {sentRequests.length > 0 && <span className="friends-tab-badge">{sentRequests.length}</span>}
        </div>
        <div className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>Suggestions</div>
        <div className={`tab ${activeTab === 'nearby' ? 'active' : ''}`} onClick={() => setActiveTab('nearby')}>Nearby</div>
        <div className={`tab ${activeTab === 'online' ? 'active' : ''}`} onClick={() => setActiveTab('online')}>Online</div>
        <div className={`tab ${activeTab === 'birthdays' ? 'active' : ''}`} onClick={() => setActiveTab('birthdays')}>Birthdays</div>
        <div className={`tab ${activeTab === 'invite' ? 'active' : ''}`} onClick={() => setActiveTab('invite')}>Invite</div>
      </div>

      {/* All Friends Tab */}
      {activeTab === 'all' && (
        <div className="friends-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {filteredFriends.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', gridColumn: '1/-1' }}>
              <i className="fas fa-user-friends" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No friends found</p>
            </div>
          ) : (
            filteredFriends.map(friend => (
              <div key={friend.id} className="friend-card" onClick={() => navigate(`/profile/${friend.id}`)}>
                <div className="friend-online"></div>
                <div className="friend-avatar">
                  <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${(friend.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div className="friend-name">{friend.display_name || friend.username}</div>
                <div className="friend-mutual">{Math.floor(Math.random() * 20)} mutual friends</div>
                <div className="friend-status">Online</div>
                <div className="friend-actions">
                  <button className="friend-action-btn message" onClick={(e) => { e.stopPropagation(); navigate('/messages') }}>Message</button>
                  <button className="friend-action-btn unfriend" onClick={(e) => { e.stopPropagation(); unfriend(friend.id, friend.display_name || friend.username) }}>Unfriend</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {friendRequests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', gridColumn: '1/-1' }}>
              <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No pending friend requests</p>
            </div>
          ) : (
            friendRequests.map(req => (
              <div key={req.id} className="request-card" onClick={() => navigate(`/profile/${req.sender?.id}`)}>
                <div className="request-card-avatar">
                  <img src={req.sender?.avatar_url || `https://ui-avatars.com/api/?name=${(req.sender?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div className="request-card-info">
                  <div className="request-card-name">{req.sender?.display_name || req.sender?.username}</div>
                  <div className="request-card-mutual">{Math.floor(Math.random() * 10)} mutual friends</div>
                  <div className="request-card-bio">{req.sender?.bio || 'Music enthusiast'}</div>
                  <div className="request-card-actions">
                    <button className="request-card-btn confirm" onClick={(e) => { e.stopPropagation(); acceptRequest(req.id) }}>Confirm</button>
                    <button className="request-card-btn delete" onClick={(e) => { e.stopPropagation(); declineRequest(req.id) }}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent Requests Tab */}
      {activeTab === 'sent' && (
        <div className="requests-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {sentRequests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', gridColumn: '1/-1' }}>
              <i className="fas fa-paper-plane" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No pending sent requests</p>
            </div>
          ) : (
            sentRequests.map(req => (
              <div key={req.id} className="request-card" style={{ opacity: 0.8 }}>
                <div className="request-card-avatar">
                  <img src={req.receiver?.avatar_url || `https://ui-avatars.com/api/?name=${(req.receiver?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div className="request-card-info">
                  <div className="request-card-name">{req.receiver?.display_name || req.receiver?.username}</div>
                  <div className="request-card-mutual">Awaiting response</div>
                  <div className="request-card-bio">Request sent {new Date(req.created_at).toLocaleDateString()}</div>
                  <div className="request-card-actions">
                    <button className="request-card-btn delete" onClick={() => cancelSentRequest(req.id)}>Cancel Request</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="suggestions-grid" style={{ display: 'grid', gap: '12px' }}>
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="suggestion-card" onClick={() => navigate(`/profile/${suggestion.id}`)}>
              <div className="suggestion-avatar">
                <img src={suggestion.avatar_url || `https://ui-avatars.com/api/?name=${(suggestion.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              </div>
              <div className="suggestion-info">
                <div className="suggestion-name">{suggestion.display_name || suggestion.username}</div>
                <div className="suggestion-meta">{suggestion.mutualCount} mutual friends</div>
                {suggestion.is_verified && <span className="suggestion-badge">✓ Verified</span>}
              </div>
              <button className="suggestion-follow-btn" onClick={(e) => { e.stopPropagation(); sendFriendRequest(suggestion.id, suggestion.display_name || suggestion.username) }}>
                Add Friend
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Nearby Tab */}
      {activeTab === 'nearby' && (
        <div className="nearby-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {nearby.map(person => (
            <div key={person.id} className="nearby-card" onClick={() => navigate(`/profile/${person.username}`)}>
              <div className="nearby-avatar">
                <img src={`https://ui-avatars.com/api/?name=${person.avatar}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              </div>
              <div className="nearby-name">{person.name}</div>
              <div className="nearby-distance">📍 {person.distance} away</div>
              <div className="nearby-bio">{person.bio}</div>
              <div className="nearby-mutual">{person.mutual} mutual friends</div>
              <button className="nearby-btn" onClick={(e) => { e.stopPropagation(); sendFriendRequest(person.id, person.name) }}>Add Friend</button>
            </div>
          ))}
        </div>
      )}

      {/* Online Friends Tab */}
      {activeTab === 'online' && (
        <div className="friends-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {onlineFriends.map(friend => (
            <div key={friend.id} className="friend-card" onClick={() => navigate(`/profile/${friend.username}`)}>
              <div className="friend-online"></div>
              <div className="friend-avatar">
                <img src={`https://ui-avatars.com/api/?name=${friend.avatar}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              </div>
              <div className="friend-name">{friend.name}</div>
              <div className="friend-status">Online now</div>
              <div className="friend-actions">
                <button className="friend-action-btn message" onClick={(e) => { e.stopPropagation(); navigate('/messages') }}>Message</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Birthdays Tab */}
      {activeTab === 'birthdays' && (
        <div className="birthdays-list" style={{ maxWidth: '500px', margin: '0 auto' }}>
          {birthdays.map(birthday => (
            <div key={birthday.id} className="birthday-item" onClick={() => navigate(`/profile/${birthday.username}`)}>
              <div className="birthday-icon">🎂</div>
              <div className="birthday-info">
                <div className="birthday-name">{birthday.name}</div>
                <div className="birthday-date">{birthday.date}</div>
              </div>
              <button className="birthday-wish-btn" onClick={(e) => { e.stopPropagation(); showToastMessage(`Birthday wish sent to ${birthday.name}! 🎂`) }}>Wish</button>
            </div>
          ))}
        </div>
      )}

      {/* Invite Tab */}
      {activeTab === 'invite' && (
        <div>
          <div className="import-section" style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px' }}>
            <div className="import-title" style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Find friends from other apps</div>
            <div className="import-desc" style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.9, fontWeight: 'bold' }}>Connect your contacts to find more friends on SocialVibe</div>
            <div className="import-buttons" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="import-btn" onClick={() => showToastMessage('Facebook import coming soon')}><i className="fab fa-facebook"></i> Facebook</button>
              <button className="import-btn" onClick={() => showToastMessage('Google import coming soon')}><i className="fab fa-google"></i> Google</button>
              <button className="import-btn" onClick={() => showToastMessage('Contacts import coming soon')}><i className="fas fa-address-book"></i> Phone Contacts</button>
            </div>
          </div>

          <div className="invite-section" style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #ddd' }}>
            <div className="invite-title" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Invite friends via link</div>
            <div className="invite-link" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input type="text" value={`https://socialvibe.com/invite/${session?.user?.id?.substring(0, 8)}`} readOnly style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '40px', background: '#f0f2f5', fontWeight: 'bold' }} />
              <button className="btn btn-primary" onClick={copyInviteLink}>Copy</button>
            </div>
            <div className="invite-social" style={{ display: 'flex', gap: '12px' }}>
              <button className="invite-social-btn" onClick={() => showToastMessage('Share via WhatsApp')}><i className="fab fa-whatsapp"></i> WhatsApp</button>
              <button className="invite-social-btn" onClick={() => showToastMessage('Share via Messenger')}><i className="fab fa-facebook-messenger"></i> Messenger</button>
              <button className="invite-social-btn" onClick={() => showToastMessage('Share via SMS')}><i className="fas fa-sms"></i> SMS</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast.show && (
        <div className="toast show" style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#000', color: 'white', padding: '12px 24px', borderRadius: '40px', zIndex: 3000 }}>
          {showToast.message}
        </div>
      )}
    </div>
  )
}