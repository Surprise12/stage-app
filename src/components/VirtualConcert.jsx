// src/components/VirtualConcert.jsx
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function VirtualConcert({ session }) {
  const [concerts, setConcerts] = useState([])
  const [myConcerts, setMyConcerts] = useState([])
  const [selectedConcert, setSelectedConcert] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    ticket_price: '',
    ticket_tiers: [
      { name: 'General Admission', price: 10, perks: ['🎟️ Access to stream', '💬 Live chat access'] },
      { name: 'VIP', price: 25, perks: ['🎟️ Access to stream', '💬 Live chat access', '📥 Digital download', '🎨 Exclusive chat'] },
      { name: 'Meet & Greet', price: 50, perks: ['🎟️ Access to stream', '💬 Live chat access', '📥 Digital download', '🎨 Exclusive chat', '📹 5-min video call', '📸 Signed digital poster'] }
    ]
  })
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [reactions, setReactions] = useState({ like: 0, heart: 0, fire: 0, clap: 0 })
  const [isStreaming, setIsStreaming] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [isPurchased, setIsPurchased] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    loadConcerts()
    loadMyConcerts()
  }, [])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  async function loadConcerts() {
    const { data } = await supabase
      .from('virtual_concerts')
      .select('*, profiles:creator_id(id, username, display_name, avatar_url, is_verified)')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
    if (data) setConcerts(data)
  }

  async function loadMyConcerts() {
    const { data } = await supabase
      .from('virtual_concerts')
      .select('*')
      .eq('creator_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setMyConcerts(data)
  }

  async function createConcert() {
    if (!formData.title || !formData.date) {
      alert('Please fill in required fields')
      return
    }

    const { error } = await supabase
      .from('virtual_concerts')
      .insert({
        creator_id: session.user.id,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        ticket_price: parseFloat(formData.ticket_price) || 0,
        ticket_tiers: formData.ticket_tiers,
        stream_url: `https://stream.socialvibe.com/${Date.now()}`,
        stream_key: Math.random().toString(36).substring(7).toUpperCase()
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('🎉 Virtual concert created!')
      setShowCreateForm(false)
      setFormData({
        title: '', description: '', date: '', ticket_price: '', ticket_tiers: [
          { name: 'General Admission', price: 10, perks: ['🎟️ Access to stream', '💬 Live chat access'] },
          { name: 'VIP', price: 25, perks: ['🎟️ Access to stream', '💬 Live chat access', '📥 Digital download', '🎨 Exclusive chat'] },
          { name: 'Meet & Greet', price: 50, perks: ['🎟️ Access to stream', '💬 Live chat access', '📥 Digital download', '🎨 Exclusive chat', '📹 5-min video call', '📸 Signed digital poster'] }
        ]
      })
      loadConcerts()
      loadMyConcerts()
    }
  }

  async function purchaseTicket(concertId, tier) {
    const { error } = await supabase
      .from('concert_tickets')
      .insert({
        concert_id: concertId,
        buyer_id: session.user.id,
        tier: tier.name,
        amount_paid: tier.price
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`🎫 Ticket purchased! You now have access to ${tier.name} perks.`)
      setShowTicketModal(false)
      setIsPurchased(true)
      loadConcerts()
    }
  }

  async function joinConcert(concert) {
    // Check if user has purchased ticket or concert is free
    if (concert.ticket_price > 0) {
      const { data: hasTicket } = await supabase
        .from('concert_tickets')
        .select('id')
        .eq('concert_id', concert.id)
        .eq('buyer_id', session.user.id)
        .single()
      
      if (!hasTicket) {
        setSelectedConcert(concert)
        setShowTicketModal(true)
        return
      }
    }
    
    setSelectedConcert(concert)
    setIsPurchased(true)
    setIsStreaming(true)
    setViewerCount(prev => prev + 1)
    
    // Load chat history
    const { data } = await supabase
      .from('concert_chat')
      .select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .eq('concert_id', concert.id)
      .order('created_at', { ascending: true })
      .limit(50)
    if (data) setChatMessages(data)
    
    // Subscribe to chat
    const subscription = supabase
      .channel('concert_chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'concert_chat',
        filter: `concert_id=eq.${concert.id}`
      }, (payload) => {
        setChatMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    
    return () => subscription.unsubscribe()
  }

  async function sendChatMessage() {
    if (!newMessage.trim()) return

    const { error } = await supabase
      .from('concert_chat')
      .insert({
        concert_id: selectedConcert.id,
        user_id: session.user.id,
        message: newMessage
      })

    if (!error) {
      setNewMessage('')
    }
  }

  async function sendReaction(type) {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }))
    await supabase
      .from('concert_reactions')
      .insert({
        concert_id: selectedConcert.id,
        user_id: session.user.id,
        reaction_type: type
      })
  }

  async function sendTip() {
    const amount = prompt('Enter tip amount ($):', '5')
    if (!amount) return
    
    const tipAmount = parseFloat(amount)
    if (isNaN(tipAmount) || tipAmount <= 0) return
    
    // Send tip message in chat
    await supabase
      .from('concert_chat')
      .insert({
        concert_id: selectedConcert.id,
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
        recipient_id: selectedConcert.creator_id,
        amount: tipAmount,
        message: `Virtual concert tip for "${selectedConcert.title}"`
      })
    
    alert(`💸 Thanks for the $${tipAmount} tip!`)
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatTimeAgo(date) {
    if (!date) return 'just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(date).toLocaleDateString()
  }

  const filteredConcerts = concerts.filter(concert =>
    concert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    concert.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const reactionTypes = [
    { type: 'like', emoji: '❤️', label: 'Love' },
    { type: 'heart', emoji: '💖', label: 'Heart' },
    { type: 'fire', emoji: '🔥', label: 'Fire' },
    { type: 'clap', emoji: '👏', label: 'Clap' }
  ]

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>🎤 Virtual Concerts</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box" style={{ width: '250px' }}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search concerts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            <i className="fas fa-plus"></i> Create Concert
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px', borderBottom: '1px solid #2a2a2a' }}>
        <div className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
          Upcoming Concerts
        </div>
        <div className={`tab ${activeTab === 'my-concerts' ? 'active' : ''}`} onClick={() => setActiveTab('my-concerts')}>
          My Concerts ({myConcerts.length})
        </div>
        <div className={`tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
          Past Concerts
        </div>
      </div>

      {/* Create Concert Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Create Virtual Concert</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Concert Title *" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
            />
            <textarea 
              className="input" 
              placeholder="Description" 
              rows="3" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
            <input 
              type="datetime-local" 
              className="input" 
              value={formData.date} 
              onChange={(e) => setFormData({...formData, date: e.target.value})} 
            />
            <input 
              type="number" 
              className="input" 
              placeholder="Base Ticket Price ($)" 
              step="0.01" 
              value={formData.ticket_price} 
              onChange={(e) => setFormData({...formData, ticket_price: e.target.value})} 
            />
            <button className="btn btn-primary" onClick={createConcert}>
              <i className="fas fa-music"></i> Create Concert
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* My Concerts Tab */}
      {activeTab === 'my-concerts' && (
        <>
          {myConcerts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-music" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't created any concerts yet.</p>
              <button className="btn btn-primary btn-small" style={{ marginTop: '12px' }} onClick={() => setShowCreateForm(true)}>
                Create Your First Concert
              </button>
            </div>
          ) : (
            <div className="grid-2">
              {myConcerts.map(concert => (
                <div key={concert.id} className="card">
                  <div style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '32px' }}>🎵</div>
                    <h4 style={{ marginTop: '8px' }}>{concert.title}</h4>
                  </div>
                  <p>📅 {new Date(concert.date).toLocaleString()}</p>
                  <p>🎟️ {concert.ticket_price > 0 ? `$${concert.ticket_price}` : 'Free'}</p>
                  <p>👁️ {concert.attendee_count || 0} attendees</p>
                  <button className="btn btn-secondary btn-small" style={{ marginTop: '12px', width: '100%' }}>
                    <i className="fas fa-edit"></i> Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upcoming Concerts Tab */}
      {activeTab === 'upcoming' && (
        <>
          {filteredConcerts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-calendar-times" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No upcoming concerts found</p>
            </div>
          ) : (
            <div className="grid-2">
              {filteredConcerts.map(concert => (
                <div key={concert.id} className="card">
                  <div style={{ 
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    textAlign: 'center', 
                    marginBottom: '16px',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '48px' }}>🎵</div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '8px' }}>{concert.title}</div>
                    {concert.profiles?.is_verified && (
                      <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', color: '#1da1f2' }}>✓ Verified</span>
                    )}
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                      {concert.ticket_price > 0 ? `🎟️ $${concert.ticket_price}` : '🎟️ Free'}
                    </div>
                  </div>
                  
                  <p>{concert.description}</p>
                  <p style={{ marginTop: '12px' }}>
                    🎤 by {concert.profiles?.display_name || concert.profiles?.username}
                  </p>
                  <p>📅 {formatDate(concert.date)}</p>
                  
                  <div style={{ marginTop: '16px' }}>
                    <strong>Ticket Tiers:</strong>
                    {concert.ticket_tiers?.map((tier, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginTop: '8px', 
                        padding: '12px', 
                        background: '#f5f5f5', 
                        borderRadius: '8px' 
                      }}>
                        <div>
                          <strong>{tier.name}</strong>
                          <ul style={{ marginLeft: '16px', fontSize: '11px', marginTop: '4px', listStyle: 'none' }}>
                            {tier.perks?.slice(0, 2).map((perk, j) => (
                              <li key={j} style={{ color: '#666' }}>✓ {perk}</li>
                            ))}
                            {tier.perks?.length > 2 && (
                              <li style={{ color: '#999', fontSize: '10px' }}>+{tier.perks.length - 2} more</li>
                            )}
                          </ul>
                        </div>
                        <button 
                          className="btn btn-primary btn-small" 
                          onClick={() => {
                            setSelectedConcert(concert)
                            setSelectedTier(tier)
                            setShowTicketModal(true)
                          }}
                        >
                          ${tier.price}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '16px' }}
                    onClick={() => joinConcert(concert)}
                  >
                    <i className="fas fa-ticket-alt"></i> Join Concert
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Ticket Purchase Modal */}
      {showTicketModal && selectedConcert && selectedTier && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowTicketModal(false)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">🎫 Purchase Ticket</div>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎵</div>
              <h3>{selectedConcert.title}</h3>
              <p style={{ color: '#888' }}>by {selectedConcert.profiles?.display_name || selectedConcert.profiles?.username}</p>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,73,153,0.1))', 
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '20px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{selectedTier.name}</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>${selectedTier.price}</span>
              </div>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                {selectedTier.perks.map((perk, i) => (
                  <li key={i} style={{ fontSize: '13px', marginBottom: '4px' }}>✓ {perk}</li>
                ))}
              </ul>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => purchaseTicket(selectedConcert.id, selectedTier)}
            >
              Purchase - ${selectedTier.price}
            </button>
            <button 
              className="secondary-btn" 
              style={{ marginTop: '8px', width: '100%' }} 
              onClick={() => setShowTicketModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Concert Player Modal */}
      {selectedConcert && isPurchased && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setSelectedConcert(null)}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>{selectedConcert.title}</h2>
              <button className="close-modal" onClick={() => setSelectedConcert(null)}>×</button>
            </div>
            
            <div style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
              <video 
                controls 
                autoPlay 
                style={{ width: '100%', maxHeight: '400px', background: '#000' }} 
                src={selectedConcert.stream_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'} 
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                {reactionTypes.map(rt => (
                  <button 
                    key={rt.type} 
                    className="post-action-btn" 
                    onClick={() => sendReaction(rt.type)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '20px', color: '#aaa' }}
                  >
                    {rt.emoji} {reactions[rt.type] || 0}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary btn-small" onClick={sendTip}>
                  💸 Send Tip
                </button>
                <span style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                  👁️ {viewerCount} watching
                </span>
              </div>
            </div>
            
            <div style={{ border: '1px solid #2a2a2a', borderRadius: '12px', height: '300px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#0a0a0a' }}>
                {chatMessages.map((msg, index) => (
                  <div key={msg.id || index} style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#fff' }}>{msg.profiles?.display_name || msg.profiles?.username || 'Anonymous'}:</strong>
                    <span style={{ color: '#ccc', marginLeft: '8px' }}>{msg.message}</span>
                    {msg.is_tip && <span style={{ color: '#ffc371', marginLeft: '8px' }}>💸 ${msg.tip_amount}</span>}
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{formatTimeAgo(msg.created_at)}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid #2a2a2a', display: 'flex', gap: '8px', background: '#1a1a1a' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Chat with other fans..." 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  style={{ flex: 1, background: '#0a0a0a', border: '1px solid #333' }}
                />
                <button className="btn btn-primary" onClick={sendChatMessage}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}