// src/pages/GigBoard.jsx - UPDATED WITH INLINE STYLES
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
    
    try {
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
      
      const { data: userGigs } = await supabase
        .from('gigs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      
      if (userGigs) setMyGigs(userGigs)
    } catch (error) {
      console.error('Error loading gigs:', error)
    }
    
    setLoading(false)
  }

  async function loadApplications() {
    try {
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
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  async function createGig() {
    if (!formData.title || !formData.date) {
      alert('Please fill in title and date')
      return
    }
    
    setSubmitting(true)
    
    try {
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
      
      if (error) throw error

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
    } catch (error) {
      alert('Error: ' + error.message)
    }
    
    setSubmitting(false)
  }

  async function applyForGig(gigId, gigTitle) {
    const message = prompt(`Apply for "${gigTitle}"\n\nSend a message to the organizer (optional):`)
    
    try {
      const { error } = await supabase
        .from('gig_applications')
        .insert({
          gig_id: gigId,
          user_id: session.user.id,
          message: message || null,
          status: 'pending'
        })
      
      if (error) throw error

      alert('Application submitted! The organizer will review it.')
      await loadApplications()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function cancelGig(gigId) {
    if (confirm('Are you sure you want to cancel this gig?')) {
      try {
        await supabase
          .from('gigs')
          .update({ status: 'cancelled' })
          .eq('id', gigId)
        await loadGigs()
      } catch (error) {
        console.error('Error cancelling gig:', error)
      }
    }
  }

  async function updateApplicationStatus(applicationId, status) {
    try {
      await supabase
        .from('gig_applications')
        .update({ status: status })
        .eq('id', applicationId)
      
      if (selectedGig) {
        loadGigApplications(selectedGig.id)
      }
    } catch (error) {
      console.error('Error updating application:', error)
    }
  }

  async function loadGigApplications(gigId) {
    try {
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
    } catch (error) {
      console.error('Error loading applications:', error)
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

  const typeIcons = {
    show: '🎤',
    collab: '🤝',
    session: '🎧',
    workshop: '📚'
  }

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    headerTitle: {
      fontSize: '1.8rem',
      fontWeight: '700'
    },
    primaryBtn: {
      padding: '10px 20px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    formLabel: {
      display: 'block',
      marginBottom: '8px',
      color: '#6b7280',
      fontWeight: '700'
    },
    formInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      transition: 'all 0.2s',
      background: 'white'
    },
    formTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
      background: 'white'
    },
    formSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      background: 'white'
    },
    formCheckbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      marginBottom: '8px'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    formGroup: {
      marginBottom: '16px'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '20px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '0'
    },
    tab: {
      padding: '10px 20px',
      fontWeight: '700',
      color: '#6b7280',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s',
      fontSize: '14px'
    },
    tabActive: {
      color: '#000'
    },
    tabIndicator: {
      position: 'absolute',
      bottom: '-1px',
      left: 0,
      right: 0,
      height: '2px',
      background: '#7c3aed'
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '20px'
    },
    gigCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      position: 'relative',
      transition: 'all 0.2s'
    },
    gigBadge: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      background: '#f0f2f5',
      color: '#333'
    },
    gigTitle: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    gigCreator: {
      color: '#6b7280',
      fontSize: '0.85rem',
      fontWeight: '700'
    },
    gigVerified: {
      color: '#1da1f2',
      marginLeft: '4px'
    },
    gigDescription: {
      marginTop: '12px',
      fontSize: '0.9rem',
      color: '#4b5563'
    },
    gigDetails: {
      marginTop: '12px'
    },
    gigDetail: {
      fontSize: '0.85rem',
      color: '#6b7280',
      marginTop: '4px',
      fontWeight: '700'
    },
    gigPrice: {
      fontSize: '0.85rem',
      color: '#f59e0b',
      marginTop: '4px',
      fontWeight: '700'
    },
    gigAttendees: {
      fontSize: '0.75rem',
      color: '#6b7280',
      marginTop: '4px',
      fontWeight: '700'
    },
    applyBtn: {
      width: '100%',
      padding: '10px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      marginTop: '16px',
      transition: 'all 0.2s'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px'
    },
    emptyIcon: {
      fontSize: '48px',
      color: '#ccc',
      marginBottom: '16px'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    modalContent: {
      background: 'white',
      borderRadius: '24px',
      padding: '24px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '20px'
    },
    applicantItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      borderBottom: '1px solid #f0f2f5',
      flexWrap: 'wrap'
    },
    applicantAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    applicantInfo: {
      flex: 1
    },
    applicantName: {
      fontWeight: '700'
    },
    applicantDate: {
      fontSize: '11px',
      color: '#6b7280'
    },
    applicantMessage: {
      fontSize: '12px',
      marginTop: '4px',
      color: '#4b5563'
    },
    applicantActions: {
      display: 'flex',
      gap: '8px'
    },
    acceptBtn: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      background: '#000',
      color: 'white',
      transition: 'all 0.2s'
    },
    declineBtn: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      background: '#eee',
      color: '#666',
      transition: 'all 0.2s'
    },
    acceptedBadge: {
      color: '#10b981',
      fontWeight: '700'
    },
    declinedBadge: {
      color: '#ef4444',
      fontWeight: '700'
    },
    closeBtn: {
      width: '100%',
      padding: '14px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      marginTop: '16px',
      transition: 'all 0.2s'
    },
    gigStatusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      color: 'white'
    },
    gigStatusOpen: {
      background: '#10b981'
    },
    gigStatusCancelled: {
      background: '#999'
    },
    myGigActions: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px'
    },
    myGigActionBtn: {
      flex: 1,
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      background: 'transparent',
      transition: 'all 0.2s'
    },
    myGigCancelBtn: {
      flex: 1,
      padding: '8px',
      border: '1px solid #ef4444',
      color: '#ef4444',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      background: 'transparent',
      transition: 'all 0.2s'
    },
    applicationStatus: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      color: 'white'
    },
    applicationStatusPending: {
      background: '#f59e0b'
    },
    applicationStatusAccepted: {
      background: '#10b981'
    },
    applicationStatusDeclined: {
      background: '#ef4444'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>🎪 Gig Board</h1>
        <button 
          style={styles.primaryBtn}
          onClick={() => setShowCreateForm(!showCreateForm)}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
        >
          {showCreateForm ? 'Cancel' : '+ Post a Gig'}
        </button>
      </div>
      
      {/* Create Gig Form */}
      {showCreateForm && (
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>Post a New Gig</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Title *</label>
            <input
              type="text"
              style={styles.formInput}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Studio Session for Hip Hop Beat"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Description</label>
            <textarea
              style={styles.formTextarea}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you're looking for..."
              rows="3"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Type</label>
            <select 
              style={styles.formSelect}
              value={formData.type} 
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="show">🎤 Show / Performance</option>
              <option value="collab">🤝 Collaboration</option>
              <option value="session">🎧 Studio Session</option>
              <option value="workshop">📚 Workshop / Tutorial</option>
            </select>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Location</label>
            <input
              type="text"
              style={styles.formInput}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Venue, or 'Online'"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formCheckbox}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={formData.is_virtual}
                onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
              /> Virtual Event
            </label>
            {formData.is_virtual && (
              <input
                type="url"
                style={styles.formInput}
                value={formData.virtual_link}
                onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                placeholder="Zoom/Meet/Discord link"
              />
            )}
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Price ($)</label>
            <input
              type="number"
              style={styles.formInput}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="0 for free"
              step="0.01"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Max Attendees (Optional)</label>
            <input
              type="number"
              style={styles.formInput}
              value={formData.max_attendees}
              onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              placeholder="Leave empty for unlimited"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Date & Time *</label>
            <input
              type="datetime-local"
              style={styles.formInput}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          
          <button 
            style={styles.primaryBtn}
            onClick={createGig} 
            disabled={submitting}
          >
            {submitting ? 'Posting...' : 'Post Gig'}
          </button>
        </div>
      )}
      
      {/* Tabs */}
      <div style={styles.tabs}>
        <div 
          style={{...styles.tab, ...(activeTab === 'available' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('available')}
        >
          Available Gigs ({gigs.length})
          {activeTab === 'available' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'my-gigs' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('my-gigs')}
        >
          My Gigs ({myGigs.length})
          {activeTab === 'my-gigs' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'applications' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('applications')}
        >
          My Applications ({applications.length})
          {activeTab === 'applications' && <div style={styles.tabIndicator}></div>}
        </div>
      </div>
      
      {/* Available Gigs Section */}
      {activeTab === 'available' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : gigs.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-calendar-alt" style={styles.emptyIcon}></i>
                <p style={{ color: '#6b7280' }}>No gigs available at the moment. Post one!</p>
              </div>
            </div>
          ) : (
            <div style={styles.grid2}>
              {gigs.map(gig => (
                <div key={gig.id} style={styles.gigCard}>
                  <div style={styles.gigBadge}>
                    {typeIcons[gig.type]} {gig.type}
                  </div>
                  
                  <h4 style={styles.gigTitle}>{gig.title}</h4>
                  <p style={styles.gigCreator}>
                    by {gig.profiles?.display_name || gig.profiles?.username}
                    {gig.profiles?.is_verified && <span style={styles.gigVerified}>✓</span>}
                  </p>
                  
                  <p style={styles.gigDescription}>
                    {gig.description?.substring(0, 120)}{gig.description?.length > 120 ? '...' : ''}
                  </p>
                  
                  <div style={styles.gigDetails}>
                    <p style={styles.gigDetail}>
                      <i className="fas fa-calendar"></i> {formatDate(gig.date)}
                    </p>
                    <p style={styles.gigDetail}>
                      <i className="fas fa-map-marker-alt"></i> {gig.is_virtual ? 'Virtual Event' : gig.location}
                    </p>
                    <p style={styles.gigPrice}>
                      <i className="fas fa-tag"></i> {gig.is_paid ? `$${gig.price}` : 'Free'}
                    </p>
                    {gig.max_attendees && (
                      <p style={styles.gigAttendees}>
                        <i className="fas fa-users"></i> Max {gig.max_attendees} attendees
                      </p>
                    )}
                  </div>
                  
                  <button 
                    style={styles.applyBtn}
                    onClick={() => applyForGig(gig.id, gig.title)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
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
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-plus-circle" style={styles.emptyIcon}></i>
                <p style={{ color: '#6b7280' }}>You haven't posted any gigs yet.</p>
                <button 
                  style={styles.primaryBtn}
                  onClick={() => setShowCreateForm(true)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                >
                  Post Your First Gig
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.grid2}>
              {myGigs.map(gig => (
                <div key={gig.id} style={styles.gigCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <h4 style={styles.gigTitle}>{gig.title}</h4>
                    <span style={{
                      ...styles.gigStatusBadge,
                      ...(gig.status === 'open' ? styles.gigStatusOpen : styles.gigStatusCancelled)
                    }}>
                      {gig.status === 'open' ? 'Open' : gig.status}
                    </span>
                  </div>
                  <p style={styles.gigCreator}>
                    {typeIcons[gig.type]} {gig.type} • {formatDate(gig.date)}
                  </p>
                  <p style={styles.gigDescription}>{gig.description?.substring(0, 100)}</p>
                  <p style={styles.gigPrice}>
                    {gig.is_paid ? `$${gig.price}` : 'Free'}
                  </p>
                  <p style={styles.gigDetail}>
                    📍 {gig.is_virtual ? 'Virtual' : gig.location}
                  </p>
                  <div style={styles.myGigActions}>
                    <button 
                      style={styles.myGigCancelBtn}
                      onClick={() => cancelGig(gig.id)}
                    >
                      Cancel Gig
                    </button>
                    <button 
                      style={styles.myGigActionBtn}
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
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-paper-plane" style={styles.emptyIcon}></i>
                <p style={{ color: '#6b7280' }}>You haven't applied to any gigs yet.</p>
              </div>
            </div>
          ) : (
            <div style={styles.grid2}>
              {applications.map(app => (
                <div key={app.id} style={styles.gigCard}>
                  <h4 style={styles.gigTitle}>{app.gig?.title}</h4>
                  <p style={styles.gigCreator}>
                    Applied on {new Date(app.created_at).toLocaleDateString()}
                  </p>
                  {app.message && (
                    <p style={{
                      marginTop: '8px',
                      fontSize: '0.85rem',
                      background: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '8px',
                      fontWeight: '700'
                    }}>
                      "{app.message}"
                    </p>
                  )}
                  <div style={{ marginTop: '12px' }}>
                    <span style={{
                      ...styles.applicationStatus,
                      ...(app.status === 'pending' ? styles.applicationStatusPending : 
                          app.status === 'accepted' ? styles.applicationStatusAccepted : 
                          styles.applicationStatusDeclined)
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
        <div style={styles.modal} onClick={() => setSelectedGig(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Applicants for "{selectedGig.title}"</div>
            {selectedGig.applications?.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No applicants yet</p>
            ) : (
              selectedGig.applications?.map(app => (
                <div key={app.id} style={styles.applicantItem}>
                  <img 
                    src={app.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(app.profiles?.username?.[0] || 'U')}&background=000&color=fff`} 
                    style={styles.applicantAvatar} 
                    alt="" 
                  />
                  <div style={styles.applicantInfo}>
                    <div style={styles.applicantName}>{app.profiles?.display_name || app.profiles?.username}</div>
                    <div style={styles.applicantDate}>Applied {new Date(app.created_at).toLocaleDateString()}</div>
                    {app.message && <div style={styles.applicantMessage}>"{app.message}"</div>}
                  </div>
                  <div style={styles.applicantActions}>
                    {app.status === 'pending' && (
                      <>
                        <button 
                          style={styles.acceptBtn}
                          onClick={() => updateApplicationStatus(app.id, 'accepted')}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
                        >
                          ✓
                        </button>
                        <button 
                          style={styles.declineBtn}
                          onClick={() => updateApplicationStatus(app.id, 'declined')}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#ddd'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#eee'}
                        >
                          ✗
                        </button>
                      </>
                    )}
                    {app.status === 'accepted' && <span style={styles.acceptedBadge}>Accepted ✓</span>}
                    {app.status === 'declined' && <span style={styles.declinedBadge}>Declined ✗</span>}
                  </div>
                </div>
              ))
            )}
            <button 
              style={styles.closeBtn}
              onClick={() => setSelectedGig(null)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}