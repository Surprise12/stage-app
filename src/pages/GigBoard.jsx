// src/pages/GigBoard.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GigBoard({ session }) {
  const [gigs, setGigs] = useState([])
  const [myGigs, setMyGigs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('available')
  const [selectedGig, setSelectedGig] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'show',
    location: '',
    is_virtual: false,
    virtual_link: '',
    price: 0,
    date: '',
    max_attendees: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadGigs()
    loadApplications()
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
          avatar_url,
          is_verified
        )
      `)
      .eq('status', 'open')
      .gte('date', new Date().toISOString())
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

  async function loadApplications() {
    const { data } = await supabase
      .from('gig_applications')
      .select(`
        *,
        gig:gig_id (*),
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    
    if (data) setApplications(data)
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
        max_attendees: formData.max_attendees || null,
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
        date: '',
        max_attendees: ''
      })
      await loadGigs()
    }
    
    setSubmitting(false)
  }

  async function applyForGig(gigId, gigTitle) {
    const message = prompt(`Apply for "${gigTitle}"\n\nSend a message to the organizer (optional):`)
    
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
      await loadApplications()
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

  async function updateApplicationStatus(applicationId, status) {
    await supabase
      .from('gig_applications')
      .update({ status: status })
      .eq('id', applicationId)
    
    if (selectedGig) {
      loadGigApplications(selectedGig.id)
    }
  }

  async function loadGigApplications(gigId) {
    const { data } = await supabase
      .from('gig_applications')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('gig_id', gigId)
      .order('created_at', { ascending: false })
    
    if (data) {
      setSelectedGig({ ...selectedGig, applications: data })
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

  const toggleVirtualLink = () => {
    const checkbox = document.getElementById('gigVirtual')
    const linkInput = document.getElementById('gigVirtualLink')
    if (linkInput) linkInput.style.display = checkbox?.checked ? 'block' : 'none'
  }

  const typeIcons = {
    show: '🎤',
    collab: '🤝',
    session: '🎧',
    workshop: '📚'
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="gigVirtual"
                checked={formData.is_virtual}
                onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
              /> Virtual Event
            </label>
            {formData.is_virtual && (
              <input
                type="url"
                id="gigVirtualLink"
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
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Max Attendees (Optional)</label>
            <input
              type="number"
              className="input"
              value={formData.max_attendees}
              onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              placeholder="Leave empty for unlimited"
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
      
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <div className={`tab ${activeTab === 'available' ? 'active' : ''}`} onClick={() => setActiveTab('available')}>
          Available Gigs ({gigs.length})
        </div>
        <div className={`tab ${activeTab === 'my-gigs' ? 'active' : ''}`} onClick={() => setActiveTab('my-gigs')}>
          My Gigs ({myGigs.length})
        </div>
        <div className={`tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
          My Applications ({applications.length})
        </div>
      </div>
      
      {/* Available Gigs Section */}
      {activeTab === 'available' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : gigs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-calendar-alt" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No gigs available at the moment. Post one!</p>
            </div>
          ) : (
            <div className="grid-2">
              {gigs.map(gig => (
                <div key={gig.id} className="card" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    <span className="profile-type-badge" style={{ background: '#f0f2f5', color: '#333' }}>
                      {typeIcons[gig.type]} {gig.type}
                    </span>
                  </div>
                  
                  <h4>{gig.title}</h4>
                  <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
                    by {gig.profiles?.display_name || gig.profiles?.username}
                    {gig.profiles?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                  </p>
                  
                  <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#555' }}>
                    {gig.description?.substring(0, 120)}{gig.description?.length > 120 ? '...' : ''}
                  </p>
                  
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '0.85rem', color: '#888' }}>
                      <i className="fas fa-calendar"></i> {formatDate(gig.date)}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                      <i className="fas fa-map-marker-alt"></i> {gig.is_virtual ? 'Virtual Event' : gig.location}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#ffc371', marginTop: '4px' }}>
                      <i className="fas fa-tag"></i> {gig.is_paid ? `$${gig.price}` : 'Free'}
                    </p>
                    {gig.max_attendees && (
                      <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                        <i className="fas fa-users"></i> Max {gig.max_attendees} attendees
                      </p>
                    )}
                  </div>
                  
                  <button 
                    className="btn btn-primary btn-small" 
                    style={{ marginTop: '16px', width: '100%' }}
                    onClick={() => applyForGig(gig.id, gig.title)}
                  >
                    Apply / Register
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* My Gigs Section */}
      {activeTab === 'my-gigs' && (
        <>
          {myGigs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-plus-circle" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't posted any gigs yet.</p>
              <button className="btn btn-primary btn-small" style={{ marginTop: '12px' }} onClick={() => setShowCreateForm(true)}>
                Post Your First Gig
              </button>
            </div>
          ) : (
            <div className="grid-2">
              {myGigs.map(gig => (
                <div key={gig.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h4>{gig.title}</h4>
                    <span className={`badge-small`} style={{ background: gig.status === 'open' ? '#4caf50' : '#999', color: 'white' }}>
                      {gig.status === 'open' ? 'Open' : gig.status}
                    </span>
                  </div>
                  <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
                    {typeIcons[gig.type]} {gig.type} • {formatDate(gig.date)}
                  </p>
                  <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>{gig.description?.substring(0, 100)}</p>
                  <p style={{ color: '#ffc371', marginTop: '8px', fontWeight: 'bold' }}>
                    {gig.is_paid ? `$${gig.price}` : 'Free'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                    📍 {gig.is_virtual ? 'Virtual' : gig.location}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      className="btn btn-outline btn-small" 
                      style={{ flex: 1 }}
                      onClick={() => cancelGig(gig.id)}
                    >
                      Cancel Gig
                    </button>
                    <button 
                      className="btn btn-secondary btn-small" 
                      style={{ flex: 1 }}
                      onClick={() => setSelectedGig(gig)}
                    >
                      View Applicants
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* My Applications Section */}
      {activeTab === 'applications' && (
        <>
          {applications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-paper-plane" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't applied to any gigs yet.</p>
            </div>
          ) : (
            <div className="grid-2">
              {applications.map(app => (
                <div key={app.id} className="card">
                  <h4>{app.gig?.title}</h4>
                  <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
                    Applied on {new Date(app.created_at).toLocaleDateString()}
                  </p>
                  {app.message && (
                    <p style={{ marginTop: '8px', fontSize: '0.85rem', background: '#f5f5f5', padding: '8px', borderRadius: '8px' }}>
                      "{app.message}"
                    </p>
                  )}
                  <div style={{ marginTop: '12px' }}>
                    <span className={`badge-small`} style={{ 
                      background: app.status === 'pending' ? '#ff9800' : app.status === 'accepted' ? '#4caf50' : '#f44336', 
                      color: 'white' 
                    }}>
                      {app.status === 'pending' ? 'Pending Review' : app.status === 'accepted' ? 'Accepted! 🎉' : 'Declined'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Applicants Modal */}
      {selectedGig && (
        <div className="modal active" onClick={() => setSelectedGig(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Applicants for "{selectedGig.title}"</div>
            {selectedGig.applications?.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No applicants yet</p>
            ) : (
              selectedGig.applications?.map(app => (
                <div key={app.id} className="suggestion-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="suggestion-avatar" style={{ width: '48px', height: '48px' }}>
                      <img src={app.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(app.profiles?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt="" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{app.profiles?.display_name || app.profiles?.username}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>Applied {new Date(app.created_at).toLocaleDateString()}</div>
                      {app.message && <div style={{ fontSize: '12px', marginTop: '4px', color: '#555' }}>"{app.message}"</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {app.status === 'pending' && (
                        <>
                          <button className="request-btn accept" onClick={() => updateApplicationStatus(app.id, 'accepted')}>✓</button>
                          <button className="request-btn decline" onClick={() => updateApplicationStatus(app.id, 'declined')}>✗</button>
                        </>
                      )}
                      {app.status === 'accepted' && <span style={{ color: '#4caf50', fontWeight: 'bold' }}>Accepted ✓</span>}
                      {app.status === 'declined' && <span style={{ color: '#f44336', fontWeight: 'bold' }}>Declined ✗</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
            <button className="apply-btn" style={{ marginTop: '16px' }} onClick={() => setSelectedGig(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}