// src/components/EventsManager.jsx - UPDATED WITH INLINE STYLES
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function EventsManager({ session }) {
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [myCreatedEvents, setMyCreatedEvents] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: '',
    type: 'concert',
    max_attendees: '',
    image_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const eventTypes = [
    { value: 'concert', label: '🎵 Concert', icon: '🎵', color: '#7c3aed' },
    { value: 'comedy', label: '😂 Comedy Show', icon: '😂', color: '#f59e0b' },
    { value: 'conference', label: '💼 Conference', icon: '💼', color: '#3b82f6' },
    { value: 'workshop', label: '🎓 Workshop', icon: '🎓', color: '#10b981' },
    { value: 'meetup', label: '👥 Meetup', icon: '👥', color: '#ec4899' },
    { value: 'party', label: '🎉 Party', icon: '🎉', color: '#ef4444' },
    { value: 'festival', label: '🎪 Festival', icon: '🎪', color: '#f97316' }
  ]

  useEffect(() => {
    loadEvents()
    loadMyEvents()
    loadMyCreatedEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('events')
        .select('*, creator:user_id(id, username, display_name, avatar_url, is_verified)')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(30)
      
      if (data) setEvents(data)
    } catch (error) {
      console.error('Error loading events:', error)
    }
    setLoading(false)
  }

  async function loadMyEvents() {
    try {
      const { data } = await supabase
        .from('event_attendees')
        .select('events(*, creator:user_id(*))')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      
      if (data) setMyEvents(data.map(d => d.events))
    } catch (error) {
      console.error('Error loading my events:', error)
    }
  }

  async function loadMyCreatedEvents() {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      
      if (data) setMyCreatedEvents(data)
    } catch (error) {
      console.error('Error loading created events:', error)
    }
  }

  async function createEvent() {
    if (!formData.name || !formData.date || !formData.location) {
      alert('Please fill in required fields')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('events')
        .insert({
          user_id: session.user.id,
          name: formData.name,
          description: formData.description,
          date: new Date(`${formData.date}T${formData.time || '19:00'}`).toISOString(),
          location: formData.location,
          price: formData.price ? parseFloat(formData.price) : 0,
          type: formData.type,
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          is_paid: formData.price > 0,
          image_url: formData.image_url || null
        })

      if (error) throw error

      alert('Event created successfully!')
      setShowCreateForm(false)
      setFormData({
        name: '', description: '', date: '', time: '', location: '', price: '', type: 'concert', max_attendees: '', image_url: ''
      })
      await loadEvents()
      await loadMyCreatedEvents()
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setSubmitting(false)
  }

  async function joinEvent(eventId) {
    try {
      const { error } = await supabase
        .from('event_attendees')
        .insert({ event_id: eventId, user_id: session.user.id })
      
      if (error) throw error

      alert('You are now attending this event!')
      await loadEvents()
      await loadMyEvents()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function leaveEvent(eventId) {
    try {
      await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
      
      alert('You have left the event')
      await loadEvents()
      await loadMyEvents()
    } catch (error) {
      console.error('Error leaving event:', error)
    }
  }

  async function cancelEvent(eventId) {
    if (confirm('Are you sure you want to cancel this event?')) {
      try {
        await supabase
          .from('events')
          .update({ status: 'cancelled' })
          .eq('id', eventId)
        await loadMyCreatedEvents()
        alert('Event cancelled')
      } catch (error) {
        console.error('Error cancelling event:', error)
      }
    }
  }

  async function deleteEvent(eventId) {
    if (confirm('Permanently delete this event? This cannot be undone.')) {
      try {
        await supabase.from('events').delete().eq('id', eventId)
        await loadEvents()
        await loadMyCreatedEvents()
        alert('Event deleted')
      } catch (error) {
        console.error('Error deleting event:', error)
      }
    }
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

  const getEventTypeInfo = (type) => {
    return eventTypes.find(t => t.value === type) || eventTypes[0]
  }

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isAttending = (eventId) => {
    return myEvents.some(e => e?.id === eventId)
  }

  const isPastEvent = (date) => {
    return new Date(date) < new Date()
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
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700'
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      background: 'white',
      borderRadius: '40px',
      padding: '8px 16px',
      gap: '8px',
      width: '250px',
      border: '1px solid #ddd',
      transition: 'all 0.3s'
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: '14px',
      color: '#000',
      width: '100%',
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
    secondaryBtn: {
      padding: '10px 20px',
      background: '#2a2a2a',
      color: '#aaa',
      border: '1px solid #444',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
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
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    formContainer: {
      display: 'grid',
      gap: '16px'
    },
    formInput: {
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
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      background: 'white'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px'
    },
    eventsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '24px'
    },
    eventCard: {
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    eventImage: {
      height: '160px',
      position: 'relative',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    eventImagePlaceholder: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '48px'
    },
    eventTypeBadge: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'rgba(0,0,0,0.7)',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      color: 'white'
    },
    eventCapacityBadge: {
      position: 'absolute',
      bottom: '12px',
      left: '12px',
      background: 'rgba(0,0,0,0.7)',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      color: 'white'
    },
    eventBody: {
      padding: '20px'
    },
    eventNameRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start'
    },
    eventName: {
      marginBottom: '8px',
      fontSize: '18px',
      fontWeight: '700'
    },
    eventVerified: {
      fontSize: '12px',
      color: '#1da1f2'
    },
    eventDetail: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
      color: '#888',
      fontSize: '13px',
      fontWeight: '700'
    },
    eventDescription: {
      color: '#aaa',
      fontSize: '13px',
      marginBottom: '16px'
    },
    eventFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    eventPrice: {
      fontSize: '24px',
      fontWeight: '700'
    },
    eventAttendees: {
      fontSize: '12px',
      color: '#888',
      fontWeight: '700'
    },
    joinBtn: {
      width: '100%',
      padding: '12px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    leaveBtn: {
      width: '100%',
      padding: '12px',
      background: '#2a2a2a',
      color: '#aaa',
      border: '1px solid #444',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    disabledBtn: {
      width: '100%',
      padding: '12px',
      background: '#2a2a2a',
      color: '#666',
      border: 'none',
      borderRadius: '10px',
      opacity: 0.7,
      fontWeight: '700',
      cursor: 'not-allowed'
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
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '20px'
    },
    modalImage: {
      width: '100%',
      borderRadius: '12px',
      height: '200px',
      objectFit: 'cover',
      marginBottom: '20px'
    },
    modalDetails: {
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      flexWrap: 'wrap',
      fontWeight: '700'
    },
    modalDescription: {
      marginBottom: '20px',
      lineHeight: '1.6'
    },
    modalInfoBox: {
      background: '#1a1a1a',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '20px'
    },
    modalInfoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    modalInfoPrice: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#7c3aed'
    },
    modalInfoLabel: {
      fontSize: '12px',
      color: '#888',
      fontWeight: '700'
    },
    modalInfoNumber: {
      fontSize: '18px',
      fontWeight: '700'
    },
    modalConfirmBtn: {
      width: '100%',
      padding: '14px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s'
    },
    modalCancelBtn: {
      width: '100%',
      padding: '14px',
      background: 'transparent',
      color: '#666',
      border: '1px solid #ddd',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      marginTop: '8px',
      transition: 'all 0.2s'
    },
    actionBtns: {
      display: 'flex',
      gap: '12px',
      marginTop: '12px'
    },
    actionBtn: {
      flex: 1,
      padding: '10px',
      background: '#2a2a2a',
      color: '#aaa',
      border: '1px solid #444',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    actionDangerBtn: {
      flex: 1,
      padding: '10px',
      background: 'transparent',
      color: '#ef4444',
      border: '1px solid #ef4444',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📅 Events</h1>
        <div style={styles.headerActions}>
          <div style={styles.searchBox}>
            <i className="fas fa-search" style={{ color: '#666' }}></i>
            <input 
              type="text" 
              style={styles.searchInput}
              placeholder="Search events..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            style={styles.primaryBtn}
            onClick={() => setShowCreateForm(!showCreateForm)}
            onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
          >
            <i className="fas fa-plus"></i> Create Event
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <div 
          style={{...styles.tab, ...(activeTab === 'upcoming' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Events ({events.length})
          {activeTab === 'upcoming' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'my-events' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('my-events')}
        >
          My Events ({myEvents.length})
          {activeTab === 'my-events' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'my-created' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('my-created')}
        >
          My Created ({myCreatedEvents.length})
          {activeTab === 'my-created' && <div style={styles.tabIndicator}></div>}
        </div>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>Create New Event</h3>
          <div style={styles.formContainer}>
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Event Name *" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
            <textarea 
              style={styles.formTextarea}
              placeholder="Description" 
              rows="3" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
            <div style={styles.formRow}>
              <input type="date" style={styles.formInput} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              <input type="time" style={styles.formInput} value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
            </div>
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Location/Venue *" 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
            />
            <input 
              type="url" 
              style={styles.formInput}
              placeholder="Event Image URL (optional)" 
              value={formData.image_url} 
              onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
            />
            <div style={styles.formRow}>
              <select style={styles.formSelect} value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <input type="number" style={styles.formInput} placeholder="Price ($)" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
            </div>
            <input 
              type="number" 
              style={styles.formInput}
              placeholder="Max Attendees (optional)" 
              value={formData.max_attendees} 
              onChange={(e) => setFormData({...formData, max_attendees: e.target.value})} 
            />
            <button 
              style={styles.primaryBtn}
              onClick={createEvent} 
              disabled={submitting}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
            <button 
              style={styles.secondaryBtn}
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Events Tab */}
      {activeTab === 'upcoming' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredEvents.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-calendar-times" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>No upcoming events found.</p>
              </div>
            </div>
          ) : (
            <div style={styles.eventsGrid}>
              {filteredEvents.map(event => {
                const attending = isAttending(event.id)
                const typeInfo = getEventTypeInfo(event.type)
                const isPast = isPastEvent(event.date)
                
                return (
                  <div key={event.id} style={styles.eventCard} onClick={() => setSelectedEvent(event)}>
                    <div style={{
                      ...styles.eventImage,
                      background: event.image_url ? `url(${event.image_url})` : `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}dd)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      {!event.image_url && (
                        <div style={styles.eventImagePlaceholder}>
                          {typeInfo.icon}
                        </div>
                      )}
                      <div style={styles.eventTypeBadge}>
                        {typeInfo.label}
                      </div>
                      {event.max_attendees && (
                        <div style={styles.eventCapacityBadge}>
                          🎟️ {event.attendee_count || 0}/{event.max_attendees}
                        </div>
                      )}
                    </div>
                    <div style={styles.eventBody}>
                      <div style={styles.eventNameRow}>
                        <h3 style={styles.eventName}>{event.name}</h3>
                        {event.creator?.is_verified && <span style={styles.eventVerified}>✓ Verified</span>}
                      </div>
                      <div style={styles.eventDetail}>
                        <i className="fas fa-calendar"></i> {formatDate(event.date)}
                      </div>
                      <div style={styles.eventDetail}>
                        <i className="fas fa-map-marker-alt"></i> {event.location}
                      </div>
                      <p style={styles.eventDescription}>{event.description?.substring(0, 100)}...</p>
                      <div style={styles.eventFooter}>
                        <span style={{...styles.eventPrice, color: typeInfo.color}}>{event.price > 0 ? `$${event.price}` : 'Free'}</span>
                        <span style={styles.eventAttendees}>
                          <i className="fas fa-user"></i> {event.attendee_count || 0} attending
                        </span>
                      </div>
                      {!isPast && (
                        <button 
                          style={attending ? styles.leaveBtn : styles.joinBtn}
                          onClick={(e) => { e.stopPropagation(); attending ? leaveEvent(event.id) : joinEvent(event.id) }}
                          onMouseEnter={(e) => {
                            if (!attending) {
                              e.currentTarget.style.background = '#6d28d9'
                            } else {
                              e.currentTarget.style.background = '#3a3a3a'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!attending) {
                              e.currentTarget.style.background = '#7c3aed'
                            } else {
                              e.currentTarget.style.background = '#2a2a2a'
                            }
                          }}
                        >
                          {attending ? <><i className="fas fa-check"></i> Attending</> : <><i className="fas fa-ticket-alt"></i> Join Event</>}
                        </button>
                      )}
                      {isPast && (
                        <button style={styles.disabledBtn} disabled>
                          Event Ended
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* My Events Tab */}
      {activeTab === 'my-events' && (
        <>
          {myEvents.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-calendar-plus" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>You haven't joined any events yet.</p>
                <button 
                  style={styles.primaryBtn}
                  onClick={() => setActiveTab('upcoming')}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                >
                  Browse Events
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.eventsGrid}>
              {myEvents.map(event => event && (
                <div key={event.id} style={styles.eventCard} onClick={() => setSelectedEvent(event)}>
                  <div style={{
                    ...styles.eventImage,
                    background: `linear-gradient(135deg, #667eea, #764ba2)`,
                    height: '140px'
                  }}>
                    <div style={styles.eventTypeBadge}>
                      {event.type}
                    </div>
                  </div>
                  <div style={styles.eventBody}>
                    <h3 style={styles.eventName}>{event.name}</h3>
                    <div style={styles.eventDetail}>
                      <i className="fas fa-calendar"></i> {formatDate(event.date)}
                    </div>
                    <div style={styles.eventDetail}>
                      <i className="fas fa-map-marker-alt"></i> {event.location}
                    </div>
                    <button 
                      style={{...styles.leaveBtn, marginTop: '12px'}}
                      onClick={(e) => { e.stopPropagation(); leaveEvent(event.id) }}
                    >
                      Leave Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Created Events Tab */}
      {activeTab === 'my-created' && (
        <>
          {myCreatedEvents.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-plus-circle" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>You haven't created any events yet.</p>
                <button 
                  style={styles.primaryBtn}
                  onClick={() => setShowCreateForm(true)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                >
                  Create Your First Event
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.eventsGrid}>
              {myCreatedEvents.map(event => (
                <div key={event.id} style={styles.eventCard}>
                  <div style={{
                    ...styles.eventImage,
                    background: `linear-gradient(135deg, #667eea, #764ba2)`,
                    height: '140px'
                  }}>
                    <div style={styles.eventTypeBadge}>
                      {event.type}
                    </div>
                  </div>
                  <div style={styles.eventBody}>
                    <h3 style={styles.eventName}>{event.name}</h3>
                    <div style={styles.eventDetail}>
                      <i className="fas fa-calendar"></i> {formatDate(event.date)}
                    </div>
                    <div style={styles.eventDetail}>
                      <i className="fas fa-map-marker-alt"></i> {event.location}
                    </div>
                    <div style={styles.actionBtns}>
                      <button style={styles.actionBtn} onClick={() => setSelectedEvent(event)}>
                        View Details
                      </button>
                      <button style={styles.actionDangerBtn} onClick={() => cancelEvent(event.id)}>
                        Cancel
                      </button>
                      <button style={styles.actionDangerBtn} onClick={() => deleteEvent(event.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div style={styles.modal} onClick={() => setSelectedEvent(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{selectedEvent.name}</div>
            
            <div>
              <img 
                src={selectedEvent.image_url || `https://picsum.photos/600/300?random=${selectedEvent.id}`} 
                style={styles.modalImage}
                alt={selectedEvent.name}
              />
            </div>
            
            <div style={styles.modalDetails}>
              <div><i className="fas fa-calendar"></i> {formatDate(selectedEvent.date)}</div>
              <div><i className="fas fa-map-marker-alt"></i> {selectedEvent.location}</div>
              <div><i className="fas fa-tag"></i> {selectedEvent.type}</div>
            </div>
            
            <p style={styles.modalDescription}>{selectedEvent.description}</p>
            
            <div style={styles.modalInfoBox}>
              <div style={styles.modalInfoRow}>
                <div>
                  <div style={styles.modalInfoPrice}>
                    {selectedEvent.price > 0 ? `$${selectedEvent.price}` : 'Free'}
                  </div>
                  <div style={styles.modalInfoLabel}>per person</div>
                </div>
                <div>
                  <div style={styles.modalInfoNumber}>{selectedEvent.attendee_count || 0}</div>
                  <div style={styles.modalInfoLabel}>attendees</div>
                </div>
                {selectedEvent.max_attendees && (
                  <div>
                    <div style={styles.modalInfoNumber}>{selectedEvent.max_attendees - (selectedEvent.attendee_count || 0)}</div>
                    <div style={styles.modalInfoLabel}>spots left</div>
                  </div>
                )}
              </div>
            </div>
            
            {!isPastEvent(selectedEvent.date) && (
              <button 
                style={isAttending(selectedEvent.id) ? styles.leaveBtn : styles.joinBtn}
                onClick={() => {
                  if (isAttending(selectedEvent.id)) {
                    leaveEvent(selectedEvent.id)
                  } else {
                    joinEvent(selectedEvent.id)
                  }
                  setSelectedEvent(null)
                }}
              >
                {isAttending(selectedEvent.id) ? 'Leave Event' : 'Join Event'}
              </button>
            )}
            
            <button style={styles.modalCancelBtn} onClick={() => setSelectedEvent(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}