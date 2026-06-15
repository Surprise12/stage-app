// src/components/VirtualConcert.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function VirtualConcert({ session }) {
  const [concerts, setConcerts] = useState([])
  const [myConcerts, setMyConcerts] = useState([])
  const [selectedConcert, setSelectedConcert] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    ticket_price: '',
    ticket_tiers: [
      { name: 'General Admission', price: 10, perks: ['Access to stream'] },
      { name: 'VIP', price: 25, perks: ['Access to stream', 'Digital download', 'Exclusive chat'] },
      { name: 'Meet & Greet', price: 50, perks: ['All VIP perks', '5-min video call', 'Signed digital poster'] }
    ]
  })
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [reactions, setReactions] = useState({ like: 0, heart: 0, fire: 0 })

  useEffect(() => {
    loadConcerts()
    loadMyConcerts()
  }, [])

  async function loadConcerts() {
    const { data } = await supabase
      .from('virtual_concerts')
      .select('*, profiles:creator_id(*)')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
    if (data) setConcerts(data)
  }

  async function loadMyConcerts() {
    const { data } = await supabase
      .from('virtual_concerts')
      .select('*')
      .eq('creator_id', session.user.id)
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
        stream_url: `https://stream.socialvibe.com/${Date.now()}`
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Virtual concert created!')
      setShowCreateForm(false)
      setFormData({
        title: '', description: '', date: '', ticket_price: '', ticket_tiers: []
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
      alert(`Ticket purchased! You now have access to ${tier.name} perks.`)
      loadConcerts()
    }
  }

  async function joinConcert(concert) {
    setSelectedConcert(concert)
    // Load chat history
    const { data } = await supabase
      .from('concert_chat')
      .select('*')
      .eq('concert_id', concert.id)
      .order('created_at', { ascending: true })
      .limit(50)
    if (data) setChatMessages(data)
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
      // Reload messages
      const { data } = await supabase
        .from('concert_chat')
        .select('*, profiles:user_id(*)')
        .eq('concert_id', selectedConcert.id)
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setChatMessages(data)
    }
  }

  async function sendReaction(type) {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }))
    // Broadcast reaction to all viewers
    await supabase
      .from('concert_reactions')
      .insert({
        concert_id: selectedConcert.id,
        user_id: session.user.id,
        reaction_type: type
      })
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>🎤 Virtual Concerts</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>+ Create Concert</button>
      </div>

      {/* Create Concert Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3>Create Virtual Concert</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input type="text" className="input" placeholder="Concert Title *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            <textarea className="input" placeholder="Description" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <input type="datetime-local" className="input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            <input type="number" className="input" placeholder="Base Ticket Price ($)" step="0.01" value={formData.ticket_price} onChange={(e) => setFormData({...formData, ticket_price: e.target.value})} />
            <button className="btn btn-primary" onClick={createConcert}>Create Concert</button>
          </div>
        </div>
      )}

      {/* My Concerts */}
      {myConcerts.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Your Concerts</h2>
          <div className="grid-2">
            {myConcerts.map(concert => (
              <div key={concert.id} className="card">
                <h4>{concert.title}</h4>
                <p>📅 {new Date(concert.date).toLocaleString()}</p>
                <p>🎟️ {concert.ticket_price > 0 ? `$${concert.ticket_price}` : 'Free'}</p>
                <button className="btn btn-secondary btn-small" style={{ marginTop: '12px' }}>Manage Concert</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Concerts */}
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Upcoming Concerts</h2>
      <div className="grid-2">
        {concerts.map(concert => (
          <div key={concert.id} className="card">
            <div style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', padding: '20px', borderRadius: '16px', textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '48px' }}>🎵</div>
              <div style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '8px' }}>{concert.title}</div>
            </div>
            <p>{concert.description}</p>
            <p style={{ marginTop: '12px' }}>🎤 by {concert.profiles?.display_name || concert.profiles?.username}</p>
            <p>📅 {new Date(concert.date).toLocaleString()}</p>
            
            <div style={{ marginTop: '16px' }}>
              <strong>Ticket Tiers:</strong>
              {concert.ticket_tiers?.map((tier, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '8px' }}>
                  <div>
                    <strong>{tier.name}</strong>
                    <ul style={{ marginLeft: '16px', fontSize: '11px', marginTop: '4px' }}>
                      {tier.perks?.map((perk, j) => <li key={j}>{perk}</li>)}
                    </ul>
                  </div>
                  <button className="btn btn-primary btn-small" onClick={() => purchaseTicket(concert.id, tier)}>${tier.price}</button>
                </div>
              ))}
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => joinConcert(concert)}>Join Concert</button>
          </div>
        ))}
      </div>

      {/* Concert Player Modal */}
      {selectedConcert && (
        <div className="modal active" onClick={() => setSelectedConcert(null)}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2>{selectedConcert.title}</h2>
              <button className="close-modal" onClick={() => setSelectedConcert(null)}>×</button>
            </div>
            
            <div style={{ background: '#000', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
              <video controls style={{ width: '100%', maxHeight: '400px' }} src={selectedConcert.stream_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'} />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button className="post-action-btn" onClick={() => sendReaction('like')}>❤️ {reactions.like}</button>
              <button className="post-action-btn" onClick={() => sendReaction('heart')}>💖 {reactions.heart}</button>
              <button className="post-action-btn" onClick={() => sendReaction('fire')}>🔥 {reactions.fire}</button>
              <button className="btn btn-primary btn-small">💰 Send Tip</button>
            </div>
            
            <div style={{ border: '1px solid #ddd', borderRadius: '12px', height: '300px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {chatMessages.map(msg => (
                  <div key={msg.id} style={{ marginBottom: '12px' }}>
                    <strong>{msg.profiles?.display_name || msg.profiles?.username}:</strong> {msg.message}
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid #ddd', display: 'flex', gap: '8px' }}>
                <input type="text" className="input" placeholder="Chat with other fans..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} />
                <button className="btn btn-primary" onClick={sendChatMessage}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}