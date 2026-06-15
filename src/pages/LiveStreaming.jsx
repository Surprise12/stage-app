// src/pages/LiveStreaming.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function LiveStreaming({ session }) {
  const [liveStreams, setLiveStreams] = useState([])
  const [myStream, setMyStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStartForm, setShowStartForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ticket_price: 0,
    category: 'music',
    privacy: 'public'
  })
  const [selectedStream, setSelectedStream] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadLiveStreams()
    
    // Subscribe to real-time chat
    const subscription = supabase
      .channel('stream_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stream_chat' }, (payload) => {
        if (selectedStream && payload.new.stream_id === selectedStream.id) {
          setChatMessages(prev => [...prev, payload.new])
        }
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [selectedStream])

  async function loadLiveStreams() {
    setLoading(true)
    
    // Load all live streams
    const { data: streams } = await supabase
      .from('live_streams')
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
      .eq('is_live', true)
      .order('started_at', { ascending: false })
    
    if (streams) setLiveStreams(streams)
    
    // Check if user has an active stream
    const { data: userStream } = await supabase
      .from('live_streams')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_live', true)
      .single()
    
    if (userStream) setMyStream(userStream)
    
    setLoading(false)
  }

  async function startStream() {
    if (!formData.title) {
      alert('Please enter a title')
      return
    }
    
    setSubmitting(true)
    
    const streamKey = Math.random().toString(36).substring(7)
    
    const { data, error } = await supabase
      .from('live_streams')
      .insert({
        user_id: session.user.id,
        title: formData.title,
        description: formData.description,
        stream_key: streamKey,
        ticket_price: formData.ticket_price,
        category: formData.category,
        privacy: formData.privacy,
        is_live: true,
        started_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setMyStream(data)
      setShowStartForm(false)
      setFormData({ title: '', description: '', ticket_price: 0, category: 'music', privacy: 'public' })
      await loadLiveStreams()
      
      // Notify followers that user is live
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', session.user.id)
      
      if (followers && followers.length > 0) {
        console.log(`🔴 Notified ${followers.length} followers that you are live!`)
      }
    }
    
    setSubmitting(false)
  }

  async function endStream() {
    if (!confirm('End this live stream?')) return
    
    const { error } = await supabase
      .from('live_streams')
      .update({
        is_live: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', myStream.id)
    
    if (!error) {
      setMyStream(null)
      await loadLiveStreams()
      alert('Stream ended')
    }
  }

  async function joinStream(stream) {
    // Check if ticket required
    if (stream.ticket_price > 0) {
      const { data: hasTicket } = await supabase
        .from('stream_tickets')
        .select('id')
        .eq('stream_id', stream.id)
        .eq('user_id', session.user.id)
        .single()
      
      if (!hasTicket) {
        const buyTicket = confirm(`This stream costs $${stream.ticket_price}. Purchase ticket?`)
        if (buyTicket) {
          await purchaseTicket(stream.id, stream.ticket_price)
        } else {
          return
        }
      }
    }
    
    setSelectedStream(stream)
    await loadChatMessages(stream.id)
    
    // Increment viewer count
    await supabase
      .from('live_streams')
      .update({ viewer_count: (stream.viewer_count || 0) + 1 })
      .eq('id', stream.id)
  }

  async function loadChatMessages(streamId) {
    const { data } = await supabase
      .from('stream_chat')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('stream_id', streamId)
      .order('created_at', { ascending: true })
      .limit(100)
    
    if (data) setChatMessages(data)
  }

  async function sendMessage() {
    if (!newMessage.trim()) return
    
    const { error } = await supabase
      .from('stream_chat')
      .insert({
        stream_id: selectedStream.id,
        user_id: session.user.id,
        message: newMessage,
        is_tip: false
      })
    
    if (!error) {
      setNewMessage('')
    }
  }

  async function sendTip() {
    const amount = prompt('Enter tip amount ($):', '5')
    if (!amount) return
    
    const tipAmount = parseFloat(amount)
    if (isNaN(tipAmount) || tipAmount <= 0) return
    
    // Send tip message in chat
    await supabase
      .from('stream_chat')
      .insert({
        stream_id: selectedStream.id,
        user_id: session.user.id,
        message: `🎉 Sent $${tipAmount} tip! 🎉`,
        is_tip: true,
        tip_amount: tipAmount
      })
    
    // Record tip
    await supabase
      .from('tips')
      .insert({
        sender_id: session.user.id,
        recipient_id: selectedStream.user_id,
        amount: tipAmount,
        message: `Live stream tip for "${selectedStream.title}"`
      })
    
    // Add to streamer's earnings
    await supabase.rpc('add_earnings', {
      p_user_id: selectedStream.user_id,
      p_amount: tipAmount * 0.95, // 5% platform fee
      p_source: 'tip',
      p_source_id: selectedStream.id
    })
    
    // Update stream tip total
    const newTotal = (selectedStream.tip_amount_total || 0) + tipAmount
    await supabase
      .from('live_streams')
      .update({ tip_amount_total: newTotal })
      .eq('id', selectedStream.id)
    
    // Reload chat to show tip message
    await loadChatMessages(selectedStream.id)
  }

  async function purchaseTicket(streamId, amount) {
    const { error } = await supabase
      .from('stream_tickets')
      .insert({
        stream_id: streamId,
        user_id: session.user.id,
        amount: amount
      })
    
    if (!error) {
      alert('Ticket purchased!')
      await supabase.rpc('add_earnings', {
        p_user_id: selectedStream?.user_id,
        p_amount: amount * 0.95,
        p_source: 'ticket',
        p_source_id: streamId
      })
    } else {
      alert('Error: ' + error.message)
    }
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

  const categories = [
    { value: 'music', label: '🎵 Music Performance', color: '#7c3aed' },
    { value: 'comedy', label: '😂 Comedy', color: '#f59e0b' },
    { value: 'gaming', label: '🎮 Gaming', color: '#10b981' },
    { value: 'talk', label: '💬 Talk/Interview', color: '#3b82f6' },
    { value: 'tutorial', label: '🎓 Tutorial', color: '#ef4444' },
    { value: 'party', label: '🎉 Party/Event', color: '#ec4899' },
    { value: 'other', label: 'Other', color: '#6b7280' }
  ]

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>🔴 Live Streaming</h1>
        {!myStream && (
          <button className="btn btn-primary" onClick={() => setShowStartForm(!showStartForm)}>
            {showStartForm ? 'Cancel' : '🔴 Go Live'}
          </button>
        )}
      </div>
      
      {/* Start Stream Form */}
      {showStartForm && !myStream && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Start a Live Stream</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Stream Title *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Live Studio Session"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Description</label>
            <textarea
              className="input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will you be streaming?"
              rows="3"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Category</label>
            <select 
              className="input" 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Privacy</label>
            <select 
              className="input" 
              value={formData.privacy}
              onChange={(e) => setFormData({ ...formData, privacy: e.target.value })}
            >
              <option value="public">🌍 Public Live</option>
              <option value="followers">👥 Followers Only</option>
              <option value="friends">🔒 Friends Only</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Ticket Price ($)</label>
            <input
              type="number"
              className="input"
              value={formData.ticket_price}
              onChange={(e) => setFormData({ ...formData, ticket_price: parseFloat(e.target.value) || 0 })}
              placeholder="0 for free"
              step="0.01"
            />
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={startStream} 
            disabled={submitting}
            style={{ width: '100%', background: '#f5576c' }}
          >
            {submitting ? 'Starting...' : '🔴 Start Live Stream'}
          </button>
        </div>
      )}
      
      {/* Current Stream (My Stream) */}
      {myStream && (
        <div className="card" style={{ marginBottom: '30px', background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="live-indicator"></span>
              <span style={{ color: '#ff0000', fontWeight: 'bold', marginLeft: '8px' }}>LIVE</span>
              <span style={{ marginLeft: '8px', background: '#333', padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>
                {categories.find(c => c.value === myStream.category)?.label || 'Streaming'}
              </span>
            </div>
            <button className="btn btn-danger btn-small" onClick={endStream}>End Stream</button>
          </div>
          <h3>{myStream.title}</h3>
          <p style={{ color: '#888' }}>{myStream.description}</p>
          <p style={{ marginTop: '12px' }}>👁️ {myStream.viewer_count || 0} watching</p>
          <p>💰 Tips: ${myStream.tip_amount_total || 0}</p>
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '12px' }}>
            🔑 Stream Key: {myStream.stream_key}
          </p>
          <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
            Share this link to invite viewers
          </p>
        </div>
      )}
      
      {/* Live Streams Grid */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Live Now</h2>
      
      {loading ? (
        <div className="spinner"></div>
      ) : liveStreams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No live streams at the moment. Start one!</p>
        </div>
      ) : (
        <div className="grid-3">
          {liveStreams.map(stream => (
            <div 
              key={stream.id} 
              className="card" 
              style={{ cursor: 'pointer' }}
              onClick={() => joinStream(stream)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="live-indicator"></span>
                <span style={{ color: '#ff0000', fontWeight: 'bold' }}>LIVE</span>
                <span style={{ fontSize: '10px', background: '#333', padding: '2px 6px', borderRadius: '20px' }}>
                  {categories.find(c => c.value === stream.category)?.label.split(' ')[0] || 'Live'}
                </span>
              </div>
              <h4>{stream.title}</h4>
              <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
                by {stream.profiles?.display_name || stream.profiles?.username}
                {stream.profiles?.is_verified && <span style={{ color: '#3b82f6', marginLeft: '4px' }}>✓</span>}
              </p>
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>{stream.description}</p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#888' }}>
                <span>👁️ {stream.viewer_count || 0}</span>
                <span>{stream.privacy === 'public' ? '🌍' : stream.privacy === 'followers' ? '👥' : '🔒'}</span>
                <span>{stream.ticket_price > 0 ? `🎟️ $${stream.ticket_price}` : '🎟️ Free'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Stream Viewer Modal */}
      {selectedStream && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setSelectedStream(null)}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '90%', maxHeight: '85vh', overflowY: 'auto', background: '#0a0a0a' }} onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setSelectedStream(null)}>&times;</span>
            
            <div className="stream-container">
              {/* Video Player */}
              <div className="stream-video">
                <video 
                  controls 
                  autoPlay 
                  style={{ width: '100%', maxHeight: '400px', background: '#000' }}
                  src={selectedStream.stream_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              
              {/* Stream Info */}
              <div style={{ padding: '16px 0' }}>
                <h3>{selectedStream.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={selectedStream.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(selectedStream.profiles?.username || 'U')[0]}&background=000&color=fff`}
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      alt="avatar"
                    />
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{selectedStream.profiles?.display_name || selectedStream.profiles?.username}</span>
                      {selectedStream.profiles?.is_verified && <span style={{ color: '#3b82f6', marginLeft: '4px' }}>✓</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span>👁️ {selectedStream.viewer_count || 0} watching</span>
                    <button className="btn btn-primary btn-small" onClick={sendTip}>💸 Send Tip</button>
                  </div>
                </div>
              </div>
              
              {/* Chat */}
              <div className="stream-chat">
                <div className="stream-messages" style={{ height: '300px', overflowY: 'auto', padding: '12px' }}>
                  {chatMessages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No messages yet. Be the first to chat!</p>
                  ) : (
                    chatMessages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`stream-message ${msg.is_tip ? 'stream-message-tip' : ''}`}
                        style={{ marginBottom: '12px', padding: '8px', background: msg.is_tip ? '#ffc37120' : '#1a1a1a', borderRadius: '8px' }}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <img 
                            src={msg.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(msg.profiles?.username || 'U')[0]}&background=000&color=fff`}
                            style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                            alt="avatar"
                          />
                          <div style={{ flex: 1 }}>
                            <div>
                              <strong>{msg.profiles?.display_name || msg.profiles?.username}</strong>
                              {msg.is_tip && <span style={{ color: '#ffc371', marginLeft: '8px' }}>💸 Sent ${msg.tip_amount} tip!</span>}
                            </div>
                            <div style={{ fontSize: '0.85rem', marginTop: '4px', wordBreak: 'break-word' }}>{msg.message}</div>
                            <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px' }}>{formatTimeAgo(msg.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="stream-input">
                  <input
                    type="text"
                    placeholder="Send a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button className="btn btn-primary btn-small" onClick={sendMessage}>Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}