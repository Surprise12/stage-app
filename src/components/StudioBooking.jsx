// src/components/StudioBooking.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function StudioBooking({ session }) {
  const [studios, setStudios] = useState([])
  const [myStudio, setMyStudio] = useState(null)
  const [myBookings, setMyBookings] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedStudio, setSelectedStudio] = useState(null)
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    hourly_rate: '',
    equipment: '',
    capacity: '',
    description: '',
    images: []
  })
  const [bookingData, setBookingData] = useState({
    date: '',
    start_time: '',
    duration: '',
    purpose: ''
  })
  const [loading, setLoading] = useState(true)
  const [imagePreviews, setImagePreviews] = useState([])

  useEffect(() => {
    loadStudios()
    checkMyStudio()
    loadMyBookings()
  }, [])

  async function loadStudios() {
    setLoading(true)
    const { data } = await supabase
      .from('studios')
      .select('*, profiles:owner_id(id, username, display_name, avatar_url, is_verified)')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setStudios(data)
    setLoading(false)
  }

  async function checkMyStudio() {
    const { data } = await supabase
      .from('studios')
      .select('*')
      .eq('owner_id', session.user.id)
      .single()
    if (data) setMyStudio(data)
  }

  async function loadMyBookings() {
    const { data } = await supabase
      .from('studio_bookings')
      .select(`
        *,
        studio:studio_id (*),
        profiles:booker_id (id, username, display_name, avatar_url)
      `)
      .eq('booker_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setMyBookings(data)
  }

  async function createStudio() {
    if (!formData.name || !formData.city || !formData.hourly_rate) {
      alert('Please fill in required fields')
      return
    }

    const equipmentArray = formData.equipment.split(',').map(e => e.trim()).filter(e => e)

    const { error } = await supabase.from('studios').insert({
      owner_id: session.user.id,
      name: formData.name,
      address: formData.address,
      city: formData.city,
      hourly_rate: parseFloat(formData.hourly_rate),
      equipment: equipmentArray,
      capacity: parseInt(formData.capacity) || null,
      description: formData.description || null
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('🎉 Studio listed successfully!')
      setShowCreateForm(false)
      setFormData({ name: '', address: '', city: '', hourly_rate: '', equipment: '', capacity: '', description: '', images: [] })
      setImagePreviews([])
      loadStudios()
      checkMyStudio()
    }
  }

  async function bookStudio(studioId, hourlyRate) {
    if (!bookingData.date || !bookingData.start_time || !bookingData.duration) {
      alert('Please fill in all booking details')
      return
    }

    const endTime = new Date(`2000-01-01T${bookingData.start_time}`)
    endTime.setHours(endTime.getHours() + parseInt(bookingData.duration))

    const { error } = await supabase.from('studio_bookings').insert({
      studio_id: studioId,
      booker_id: session.user.id,
      date: bookingData.date,
      start_time: bookingData.start_time,
      end_time: endTime.toTimeString().slice(0, 5),
      total_price: hourlyRate * parseInt(bookingData.duration),
      purpose: bookingData.purpose || null,
      status: 'pending'
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Booking request sent! The studio owner will confirm.')
      setShowBookingModal(false)
      setBookingData({ date: '', start_time: '', duration: '', purpose: '' })
      loadMyBookings()
    }
  }

  async function cancelBooking(bookingId) {
    if (confirm('Cancel this booking?')) {
      await supabase
        .from('studio_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
      loadMyBookings()
    }
  }

  async function deleteStudio(studioId) {
    if (confirm('Delete your studio listing? This cannot be undone.')) {
      await supabase.from('studios').delete().eq('id', studioId)
      alert('Studio deleted')
      setMyStudio(null)
      loadStudios()
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function formatTime(timeStr) {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredStudios = studios.filter(studio =>
    studio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    studio.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    studio.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>🎙️ Studio Booking</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box" style={{ width: '250px' }}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search studios..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {!myStudio && (
            <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
              + List Your Studio
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px', borderBottom: '1px solid #2a2a2a' }}>
        <div className={`tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
          Browse Studios
        </div>
        <div className={`tab ${activeTab === 'my-bookings' ? 'active' : ''}`} onClick={() => setActiveTab('my-bookings')}>
          My Bookings ({myBookings.length})
        </div>
        {myStudio && (
          <div className={`tab ${activeTab === 'my-studio' ? 'active' : ''}`} onClick={() => setActiveTab('my-studio')}>
            My Studio
          </div>
        )}
      </div>

      {/* Create Studio Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>List Your Studio</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Studio Name *" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
            <textarea 
              className="input" 
              placeholder="Description" 
              rows="2" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
            <input 
              type="text" 
              className="input" 
              placeholder="Address" 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
            />
            <input 
              type="text" 
              className="input" 
              placeholder="City *" 
              value={formData.city} 
              onChange={(e) => setFormData({...formData, city: e.target.value})} 
            />
            <input 
              type="number" 
              className="input" 
              placeholder="Hourly Rate ($) *" 
              step="0.01" 
              value={formData.hourly_rate} 
              onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})} 
            />
            <input 
              type="text" 
              className="input" 
              placeholder="Equipment (comma separated)" 
              value={formData.equipment} 
              onChange={(e) => setFormData({...formData, equipment: e.target.value})} 
            />
            <input 
              type="number" 
              className="input" 
              placeholder="Capacity" 
              value={formData.capacity} 
              onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
            />
            <button className="btn btn-primary" onClick={createStudio}>List Studio</button>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Browse Studios Tab */}
      {activeTab === 'browse' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredStudios.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-headphones" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No studios found</p>
            </div>
          ) : (
            <div className="grid-2">
              {filteredStudios.map(studio => (
                <div key={studio.id} className="card">
                  <div style={{ 
                    background: 'linear-gradient(135deg, #1a1a2e, #16213e)', 
                    borderRadius: '12px', 
                    padding: '16px', 
                    marginBottom: '12px',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏢</div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{studio.name}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>📍 {studio.city}</div>
                    {studio.profiles?.is_verified && (
                      <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', color: '#1da1f2' }}>✓ Verified</span>
                    )}
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                      <span className="badge-small" style={{ background: 'rgba(255,255,255,0.1)', color: '#888' }}>
                        {studio.equipment?.length || 0} items
                      </span>
                    </div>
                  </div>
                  <p><strong>Equipment:</strong> {studio.equipment?.slice(0, 4).join(', ')}{studio.equipment?.length > 4 ? '...' : ''}</p>
                  <p><strong>Capacity:</strong> {studio.capacity || 'N/A'} people</p>
                  {studio.description && <p style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{studio.description.substring(0, 80)}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>${studio.hourly_rate}/hour</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      <i className="fas fa-user"></i> {studio.profiles?.display_name || studio.profiles?.username}
                    </span>
                  </div>
                  {studio.owner_id !== session.user.id && (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', marginTop: '12px' }}
                      onClick={() => {
                        setSelectedStudio(studio)
                        setShowBookingModal(true)
                      }}
                    >
                      📅 Book Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Bookings Tab */}
      {activeTab === 'my-bookings' && (
        <>
          {myBookings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-calendar" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No bookings yet</p>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Book a studio to get started</p>
            </div>
          ) : (
            myBookings.map(booking => (
              <div key={booking.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4>{booking.studio?.name}</h4>
                    <p style={{ color: '#888', fontSize: '13px' }}>
                      📅 {formatDate(booking.date)} • 🕐 {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </p>
                    <p style={{ color: '#888', fontSize: '13px' }}>
                      📍 {booking.studio?.city}
                    </p>
                    {booking.purpose && (
                      <p style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Purpose: {booking.purpose}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge-small`} style={{ 
                      background: booking.status === 'confirmed' ? '#10b981' : 
                                booking.status === 'pending' ? '#f59e0b' : 
                                booking.status === 'cancelled' ? '#ef4444' : '#888',
                      color: 'white'
                    }}>
                      {booking.status === 'confirmed' ? '✅ Confirmed' : 
                       booking.status === 'pending' ? '⏳ Pending' : 
                       booking.status === 'cancelled' ? '❌ Cancelled' : booking.status}
                    </span>
                    <p style={{ fontWeight: 'bold', color: '#7c3aed', marginTop: '8px' }}>${booking.total_price}</p>
                    {booking.status === 'pending' && (
                      <button className="btn btn-outline btn-small" style={{ marginTop: '8px' }} onClick={() => cancelBooking(booking.id)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* My Studio Tab */}
      {activeTab === 'my-studio' && myStudio && (
        <div className="card">
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏢</div>
            <h2>{myStudio.name}</h2>
            <p style={{ color: '#888' }}>📍 {myStudio.city}</p>
            <p style={{ color: '#888' }}>💰 ${myStudio.hourly_rate}/hour</p>
          </div>
          <p><strong>Equipment:</strong> {myStudio.equipment?.join(', ')}</p>
          <p><strong>Capacity:</strong> {myStudio.capacity || 'N/A'} people</p>
          {myStudio.description && <p>{myStudio.description}</p>}
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(true)}>Edit Studio</button>
            <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => deleteStudio(myStudio.id)}>
              Delete Studio
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedStudio && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📅 Book {selectedStudio.name}</div>
            
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '12px' }}>
              <p><strong>Rate:</strong> ${selectedStudio.hourly_rate}/hour</p>
              <p><strong>Location:</strong> {selectedStudio.city}</p>
            </div>
            
            <input 
              type="date" 
              className="input" 
              placeholder="Date" 
              value={bookingData.date}
              onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
              style={{ marginBottom: '12px' }}
              min={new Date().toISOString().split('T')[0]}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input 
                type="time" 
                className="input" 
                placeholder="Start Time" 
                value={bookingData.start_time}
                onChange={(e) => setBookingData({...bookingData, start_time: e.target.value})}
              />
              <input 
                type="number" 
                className="input" 
                placeholder="Hours" 
                min="1"
                max="12"
                value={bookingData.duration}
                onChange={(e) => setBookingData({...bookingData, duration: e.target.value})}
              />
            </div>
            
            <input 
              type="text" 
              className="input" 
              placeholder="Purpose (optional)" 
              value={bookingData.purpose}
              onChange={(e) => setBookingData({...bookingData, purpose: e.target.value})}
              style={{ marginBottom: '16px' }}
            />
            
            {bookingData.duration && bookingData.start_time && (
              <p style={{ marginBottom: '16px', textAlign: 'center', fontWeight: 'bold', color: '#7c3aed' }}>
                Total: ${selectedStudio.hourly_rate * parseInt(bookingData.duration) || 0}
              </p>
            )}
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => bookStudio(selectedStudio.id, selectedStudio.hourly_rate)}
            >
              Confirm Booking
            </button>
            <button 
              className="secondary-btn" 
              style={{ marginTop: '8px', width: '100%' }} 
              onClick={() => setShowBookingModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}