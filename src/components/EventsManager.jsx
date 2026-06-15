// src/components/EventsManager.jsx
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
    const { data } = await supabase
      .from('events')
      .select('*, creator:user_id(id, username, display_name, avatar_url, is_verified)')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(30)
    
    if (data) setEvents(data)
    setLoading(false)
  }

  async function loadMyEvents() {
    const { data } = await supabase
      .from('event_attendees')
      .select('events(*, creator:user_id(*))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    
    if (data) setMyEvents(data.map(d => d.events))
  }

  async function loadMyCreatedEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    
    if (data) setMyCreatedEvents(data)
  }

  async function createEvent() {
    if (!formData.name || !formData.date || !formData.location) {
      alert('Please fill in required fields')
      return
    }

    setSubmitting(true)

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

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Event created successfully!')
      setShowCreateForm(false)
      setFormData({
        name: '', description: '', date: '', time: '', location: '', price: '', type: 'concert', max_attendees: '', image_url: ''
      })
      await loadEvents()
      await loadMyCreatedEvents()
    }
    setSubmitting(false)
  }

  async function joinEvent(eventId) {
    const { error } = await supabase
      .from('event_attendees')
      .insert({ event_id: eventId, user_id: session.user.id })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('You are now attending this event!')
      await loadEvents()
      await loadMyEvents()
    }
  }

  async function leaveEvent(eventId) {
    await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
    
    alert('You have left the event')
    await loadEvents()
    await loadMyEvents()
  }

  async function cancelEvent(eventId) {
    if (confirm('Are you sure you want to cancel this event?')) {
      await supabase
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', eventId)
      await loadMyCreatedEvents()
      alert('Event cancelled')
    }
  }

  async function deleteEvent(eventId) {
    if (confirm('Permanently delete this event? This cannot be undone.')) {
      await supabase.from('events').delete().eq('id', eventId)
      await loadEvents()
      await loadMyCreatedEvents()
      alert('Event deleted')
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

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>📅 Events</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box" style={{ width: '250px' }}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            <i className="fas fa-plus"></i> Create Event
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px', borderBottom: '1px solid #2a2a2a' }}>
        <div className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
          Upcoming Events ({events.length})
        </div>
        <div className={`tab ${activeTab === 'my-events' ? 'active' : ''}`} onClick={() => setActiveTab('my-events')}>
          My Events ({myEvents.length})
        </div>
        <div className={`tab ${activeTab === 'my-created' ? 'active' : ''}`} onClick={() => setActiveTab('my-created')}>
          My Created ({myCreatedEvents.length})
        </div>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Create New Event</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Event Name *" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
            <textarea 
              className="input" 
              placeholder="Description" 
              rows="3" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input type="date" className="input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              <input type="time" className="input" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
            </div>
            <input 
              type="text" 
              className="input" 
              placeholder="Location/Venue *" 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
            />
            <input 
              type="url" 
              className="input" 
              placeholder="Event Image URL (optional)" 
              value={formData.image_url} 
              onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="input" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <input type="number" className="input" placeholder="Price ($)" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
            </div>
            <input 
              type="number" 
              className="input" 
              placeholder="Max Attendees (optional)" 
              value={formData.max_attendees} 
              onChange={(e) => setFormData({...formData, max_attendees: e.target.value})} 
            />
            <button className="btn btn-primary" onClick={createEvent} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Upcoming Events Tab */}
      {activeTab === 'upcoming' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredEvents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-calendar-times" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No upcoming events found.</p>
            </div>
          ) : (
            <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {filteredEvents.map(event => {
                const attending = isAttending(event.id)
                const typeInfo = getEventTypeInfo(event.type)
                const isPast = isPastEvent(event.date)
                
                return (
                  <div key={event.id} className="event-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedEvent(event)}>
                    <div style={{ height: '160px', background: `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}dd)`, position: 'relative', backgroundImage: event.image_url ? `url(${event.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      {!event.image_url && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '48px' }}>
                          {typeInfo.icon}
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                        {typeInfo.label}
                      </div>
                      {event.max_attendees && (
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px' }}>
                          🎟️ {event.attendee_count || 0}/{event.max_attendees}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{event.name}</h3>
                        {event.creator?.is_verified && <span style={{ fontSize: '12px', color: '#1da1f2' }}>✓ Verified</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#888', fontSize: '13px' }}>
                        <i className="fas fa-calendar"></i> {formatDate(event.date)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#888', fontSize: '13px' }}>
                        <i className="fas fa-map-marker-alt"></i> {event.location}
                      </div>
                      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>{event.description?.substring(0, 100)}...</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: typeInfo.color }}>{event.price > 0 ? `$${event.price}` : 'Free'}</span>
                        <span style={{ fontSize: '12px', color: '#888' }}>
                          <i className="fas fa-user"></i> {event.attendee_count || 0} attending
                        </span>
                      </div>
                      {!isPast && (
                        <button 
                          className={`btn ${attending ? 'btn-secondary' : 'btn-primary'}`} 
                          style={{ width: '100%' }}
                          onClick={(e) => { e.stopPropagation(); attending ? leaveEvent(event.id) : joinEvent(event.id) }}
                        >
                          {attending ? <><i className="fas fa-check"></i> Attending</> : <><i className="fas fa-ticket-alt"></i> Join Event</>}
                        </button>
                      )}
                      {isPast && (
                        <button className="btn btn-secondary" style={{ width: '100%', opacity: 0.7 }} disabled>
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
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-calendar-plus" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't joined any events yet.</p>
              <button className="btn btn-primary btn-small" style={{ marginTop: '12px' }} onClick={() => setActiveTab('upcoming')}>
                Browse Events
              </button>
            </div>
          ) : (
            <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {myEvents.map(event => event && (
                <div key={event.id} className="event-card" onClick={() => setSelectedEvent(event)}>
                  <div style={{ height: '140px', background: `linear-gradient(135deg, #667eea, #764ba2)`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      {event.type}
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{event.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#888', fontSize: '13px' }}>
                      <i className="fas fa-calendar"></i> {formatDate(event.date)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#888', fontSize: '13px' }}>
                      <i className="fas fa-map-marker-alt"></i> {event.location}
                    </div>
                    <button 
                      className="btn btn-outline btn-small" 
                      style={{ width: '100%', marginTop: '12px', borderColor: '#ef4444', color: '#ef4444' }}
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
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-plus-circle" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't created any events yet.</p>
              <button className="btn btn-primary btn-small" style={{ marginTop: '12px' }} onClick={() => setShowCreateForm(true)}>
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
              {myCreatedEvents.map(event => (
                <div key={event.id} className="event-card">
                  <div style={{ height: '140px', background: `linear-gradient(135deg, #667eea, #764ba2)`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                      {event.type}
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{event.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#888', fontSize: '13px' }}>
                      <i className="fas fa-calendar"></i> {formatDate(event.date)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#888', fontSize: '13px' }}>
                      <i className="fas fa-map-marker-alt"></i> {event.location}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                      <button className="btn btn-secondary btn-small" style={{ flex: 1 }} onClick={() => setSelectedEvent(event)}>
                        View Details
                      </button>
                      <button className="btn btn-outline btn-small" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} onClick={() => cancelEvent(event.id)}>
                        Cancel
                      </button>
                      <button className="btn btn-outline btn-small" style={{ flex: 1 }} onClick={() => deleteEvent(event.id)}>
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
        <div className="modal active" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{selectedEvent.name}</div>
            
            <div style={{ marginBottom: '20px' }}>
              <img 
                src={selectedEvent.image_url || `https://picsum.photos/600/300?random=${selectedEvent.id}`} 
                style={{ width: '100%', borderRadius: '12px', height: '200px', objectFit: 'cover' }}
                alt={selectedEvent.name}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div><i className="fas fa-calendar"></i> {formatDate(selectedEvent.date)}</div>
              <div><i className="fas fa-map-marker-alt"></i> {selectedEvent.location}</div>
              <div><i className="fas fa-tag"></i> {selectedEvent.type}</div>
            </div>
            
            <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>{selectedEvent.description}</p>
            
            <div style={{ background: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
                    {selectedEvent.price > 0 ? `$${selectedEvent.price}` : 'Free'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>per person</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedEvent.attendee_count || 0}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>attendees</div>
                </div>
                {selectedEvent.max_attendees && (
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedEvent.max_attendees - (selectedEvent.attendee_count || 0)}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>spots left</div>
                  </div>
                )}
              </div>
            </div>
            
            {!isPastEvent(selectedEvent.date) && (
              <button 
                className={`btn ${isAttending(selectedEvent.id) ? 'btn-secondary' : 'btn-primary'}`} 
                style={{ width: '100%' }}
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
            
            <button className="secondary-btn" style={{ marginTop: '12px', width: '100%' }} onClick={() => setSelectedEvent(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}