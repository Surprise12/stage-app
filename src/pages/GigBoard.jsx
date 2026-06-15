import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GigBoard({ session }) {
  const [gigs, setGigs] = useState([])
  const [myGigs, setMyGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'show',
    location: '',
    is_virtual: false,
    virtual_link: '',
    price: 0,
    date: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadGigs()
  }, [])

  async function loadGigs() {
    setLoading(true)
    
    // Load available gigs
    const { data: availableGigs } = await supabase
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
      .eq('status', 'open')
      .order('date', { ascending: true })
    
    if (availableGigs) setGigs(availableGigs)
    
    // Load user's own gigs
    const { data: userGigs } = await supabase
      .from('gigs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    
    if (userGigs) setMyGigs(userGigs)
    
    setLoading(false)
  }

  async function createGig() {
    if (!formData.title || !formData.date) {
      alert('Please fill in title and date')
      return
    }
    
    setSubmitting(true)
    
    const { error } = await supabase
      .from('gigs')
      .insert({
        user_id: session.user.id,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        location: formData.location,
        is_virtual: formData.is_virtual,
        virtual_link: formData.is_virtual ? formData.virtual_link : null,
        price: formData.price || 0,
        is_paid: formData.price > 0,
        date: formData.date,
        status: 'open'
      })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Gig created successfully!')
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        type: 'show',
        location: '',
        is_virtual: false,
        virtual_link: '',
        price: 0,
        date: ''
      })
      await loadGigs()
    }
    
    setSubmitting(false)
  }

  async function applyForGig(gigId) {
    const message = prompt('Send a message to the organizer (optional):')
    
    const { error } = await supabase
      .from('gig_applications')
      .insert({
        gig_id: gigId,
        user_id: session.user.id,
        message: message || null,
        status: 'pending'
      })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Application submitted! The organizer will review it.')
    }
  }

  async function cancelGig(gigId) {
    if (confirm('Are you sure you want to cancel this gig?')) {
      await supabase
        .from('gigs')
        .update({ status: 'cancelled' })
        .eq('id', gigId)
      await loadGigs()
    }
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>🎪 Gig Board</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Post a Gig'}
        </button>
      </div>
      
      {/* Create Gig Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Post a New Gig</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Title *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Studio Session for Hip Hop Beat"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Description</label>
            <textarea
              className="input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you're looking for..."
              rows="3"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Type</label>
            <select 
              className="input" 
              value={formData.type} 
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="show">🎤 Show / Performance</option>
              <option value="collab">🤝 Collaboration</option>
              <option value="session">🎧 Studio Session</option>
              <option value="workshop">📚 Workshop / Tutorial</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Location</label>
            <input
              type="text"
              className="input"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Venue, or 'Online'"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.is_virtual}
                onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
              /> Virtual Event
            </label>
            {formData.is_virtual && (
              <input
                type="url"
                className="input"
                style={{ marginTop: '8px' }}
                value={formData.virtual_link}
                onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                placeholder="Zoom/Meet/Discord link"
              />
            )}
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Price ($)</label>
            <input
              type="number"
              className="input"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="0 for free"
              step="0.01"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Date & Time *</label>
            <input
              type="datetime-local"
              className="input"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={createGig} 
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Posting...' : 'Post Gig'}
          </button>
        </div>
      )}
      
      {/* My Gigs Section */}
      {myGigs.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Your Gigs</h2>
          <div className="grid-2">
            {myGigs.map(gig => (
              <div key={gig.id} className="card">
                <h4>{gig.title}</h4>
                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
                  {gig.type} • {formatDate(gig.date)}
                </p>
                <p style={{ marginTop: '8px' }}>{gig.description?.substring(0, 100)}</p>
                <p style={{ color: '#ffc371', marginTop: '8px' }}>
                  {gig.is_paid ? `$${gig.price}` : 'Free'}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '8px' }}>
                  📍 {gig.is_virtual ? 'Virtual' : gig.location}
                </p>
                <button 
                  className="btn btn-outline btn-small" 
                  style={{ marginTop: '12px' }}
                  onClick={() => cancelGig(gig.id)}
                >
                  Cancel Gig
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available Gigs Section */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Available Gigs</h2>
      
      {loading ? (
        <div className="spinner"></div>
      ) : gigs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No gigs available at the moment. Post one!</p>
        </div>
      ) : (
        <div className="grid-2">
          {gigs.map(gig => (
            <div key={gig.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4>{gig.title}</h4>
                  <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
                    by {gig.profiles?.display_name || gig.profiles?.username}
                  </p>
                </div>
                <span className="btn btn-secondary btn-small" style={{ opacity: 0.8 }}>
                  {gig.type}
                </span>
              </div>
              
              <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>
                {gig.description?.substring(0, 120)}
              </p>
              
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: '#888' }}>
                  📅 {formatDate(gig.date)}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#888' }}>
                  📍 {gig.is_virtual ? 'Virtual Event' : gig.location}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#ffc371', marginTop: '4px' }}>
                  {gig.is_paid ? `$${gig.price}` : 'Free'}
                </p>
              </div>
              
              <button 
                className="btn btn-primary btn-small" 
                style={{ marginTop: '16px', width: '100%' }}
                onClick={() => applyForGig(gig.id)}
              >
                Apply / Register
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}