import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function EventsManager({ session }) {
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: '',
    type: 'concert',
    max_attendees: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
    loadMyEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('*, creator:user_id(id, username, display_name, avatar_url)')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(20)
    
    if (data) setEvents(data)
    setLoading(false)
  }

  async function loadMyEvents() {
    const { data } = await supabase
      .from('event_attendees')
      .select('events(*)')
      .eq('user_id', session.user.id)
    
    if (data) setMyEvents(data.map(d => d.events))
  }

  async function createEvent() {
    if (!formData.name || !formData.date || !formData.location) {
      alert('Please fill in required fields')
      return
    }

    const { error } = await supabase
      .from('events')
      .insert({
        user_id: session.user.id,
        name: formData.name,
        description: formData.description,
        date: new Date(`${formData.date}T${formData.time || '19:00'}`).toISOString(),
        location: formData.location,
        price: formData.price || 0,
        type: formData.type,
        max_attendees: formData.max_attendees || null,
        is_paid: formData.price > 0
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Event created successfully!')
      setShowCreateForm(false)
      setFormData({
        name: '', description: '', date: '', time: '', location: '', price: '', type: 'concert', max_attendees: ''
      })
      await loadEvents()
    }
  }

  async function joinEvent(eventId) {
    const { error } = await supabase
      .from('event_attendees')
      .insert({ event_id: eventId, user_id: session.user.id })
    
    if (error) alert('Error: ' + error.message)
    else {
      alert('You are now attending this event!')
      await loadEvents()
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

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div className="events-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>📅 Events</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          + Create Event
        </button>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Create New Event</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input type="text" className="input" placeholder="Event Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <textarea className="input" placeholder="Description" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input type="date" className="input" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              <input type="time" className="input" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
            </div>
            <input type="text" className="input" placeholder="Location/Venue *" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="input" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                <option value="concert">🎵 Concert</option>
                <option value="comedy">😂 Comedy Show</option>
                <option value="conference">💼 Conference</option>
                <option value="workshop">🎓 Workshop</option>
                <option value="meetup">👥 Meetup</option>
                <option value="party">🎉 Party</option>
              </select>
              <input type="number" className="input" placeholder="Price ($)" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
            </div>
            <input type="number" className="input" placeholder="Max Attendees (optional)" value={formData.max_attendees} onChange={(e) => setFormData({...formData, max_attendees: e.target.value})} />
            <button className="btn btn-primary" onClick={createEvent}>Create Event</button>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="spinner"></div>
      ) : events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No upcoming events. Create one!</p>
        </div>
      ) : (
        <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {events.map(event => {
            const isAttending = false // Check if user is attending
            return (
              <div key={event.id} className="event-card" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #ddd', transition: 'transform 0.2s' }}>
                <div style={{ height: '140px', background: 'linear-gradient(135deg, #667eea, #764ba2)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{event.type}</div>
                </div>
                <div style={{ padding: '20px' }}>
                  <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{event.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#666', fontSize: '13px', fontWeight: 'bold' }}>
                    <i className="fas fa-calendar"></i> {formatDate(event.date)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#666', fontSize: '13px', fontWeight: 'bold' }}>
                    <i className="fas fa-map-marker-alt"></i> {event.location}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>{event.price > 0 ? `$${event.price}` : 'Free'}</span>
                    <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>{event.attendee_count || 0} attending</span>
                  </div>
                  <button 
                    className={`btn ${isAttending ? 'btn-secondary' : 'btn-primary'}`} 
                    style={{ width: '100%' }}
                    onClick={() => isAttending ? leaveEvent(event.id) : joinEvent(event.id)}
                  >
                    {isAttending ? 'Leave Event' : 'Join Event'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}