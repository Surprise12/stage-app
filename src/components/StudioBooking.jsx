// src/components/StudioBooking.jsx - UPDATED WITH INLINE STYLES
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
    try {
      const { data } = await supabase
        .from('studios')
        .select('*, profiles:owner_id(id, username, display_name, avatar_url, is_verified)')
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setStudios(data)
    } catch (error) {
      console.error('Error loading studios:', error)
    }
    setLoading(false)
  }

  async function checkMyStudio() {
    try {
      const { data } = await supabase
        .from('studios')
        .select('*')
        .eq('owner_id', session.user.id)
        .single()
      if (data) setMyStudio(data)
    } catch (error) {
      console.error('Error checking my studio:', error)
    }
  }

  async function loadMyBookings() {
    try {
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
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  async function createStudio() {
    if (!formData.name || !formData.city || !formData.hourly_rate) {
      alert('Please fill in required fields')
      return
    }

    const equipmentArray = formData.equipment.split(',').map(e => e.trim()).filter(e => e)

    try {
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

      if (error) throw error

      alert('🎉 Studio listed successfully!')
      setShowCreateForm(false)
      setFormData({ name: '', address: '', city: '', hourly_rate: '', equipment: '', capacity: '', description: '', images: [] })
      setImagePreviews([])
      loadStudios()
      checkMyStudio()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function bookStudio(studioId, hourlyRate) {
    if (!bookingData.date || !bookingData.start_time || !bookingData.duration) {
      alert('Please fill in all booking details')
      return
    }

    const endTime = new Date(`2000-01-01T${bookingData.start_time}`)
    endTime.setHours(endTime.getHours() + parseInt(bookingData.duration))

    try {
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

      if (error) throw error

      alert('✅ Booking request sent! The studio owner will confirm.')
      setShowBookingModal(false)
      setBookingData({ date: '', start_time: '', duration: '', purpose: '' })
      loadMyBookings()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function cancelBooking(bookingId) {
    if (confirm('Cancel this booking?')) {
      try {
        await supabase
          .from('studio_bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingId)
        loadMyBookings()
      } catch (error) {
        console.error('Error cancelling booking:', error)
      }
    }
  }

  async function deleteStudio(studioId) {
    if (confirm('Delete your studio listing? This cannot be undone.')) {
      try {
        await supabase.from('studios').delete().eq('id', studioId)
        alert('Studio deleted')
        setMyStudio(null)
        loadStudios()
      } catch (error) {
        console.error('Error deleting studio:', error)
      }
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
    searchIcon: {
      color: '#666',
      fontSize: '14px'
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
    tabActiveIndicator: {
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
      minHeight: '60px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
      background: 'white'
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px'
    },
    studioCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'all 0.2s'
    },
    studioHeader: {
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      position: 'relative'
    },
    studioIcon: {
      fontSize: '36px',
      marginBottom: '8px'
    },
    studioName: {
      fontWeight: '700',
      fontSize: '18px',
      color: 'white'
    },
    studioCity: {
      color: '#888',
      fontSize: '12px'
    },
    verifiedBadge: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      fontSize: '12px',
      color: '#1da1f2'
    },
    equipmentBadge: {
      position: 'absolute',
      bottom: '12px',
      right: '12px',
      background: 'rgba(255,255,255,0.1)',
      color: '#888',
      fontSize: '11px',
      padding: '2px 10px',
      borderRadius: '20px'
    },
    studioEquipment: {
      fontWeight: '700',
      marginTop: '4px'
    },
    studioCapacity: {
      fontWeight: '700',
      marginTop: '4px'
    },
    studioDescription: {
      color: '#888',
      fontSize: '13px',
      marginTop: '4px'
    },
    studioFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '12px'
    },
    studioPrice: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#7c3aed'
    },
    studioOwner: {
      fontSize: '12px',
      color: '#888'
    },
    bookBtn: {
      width: '100%',
      padding: '12px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      marginTop: '12px',
      transition: 'all 0.2s'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#888'
    },
    emptyIcon: {
      fontSize: '48px',
      color: '#ccc',
      marginBottom: '16px'
    },
    bookingItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      flexWrap: 'wrap',
      gap: '12px'
    },
    bookingTitle: {
      fontWeight: '700',
      marginBottom: '4px'
    },
    bookingDetail: {
      color: '#888',
      fontSize: '13px'
    },
    bookingStatus: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      display: 'inline-block'
    },
    bookingStatusConfirmed: {
      background: '#10b981',
      color: 'white'
    },
    bookingStatusPending: {
      background: '#f59e0b',
      color: 'white'
    },
    bookingStatusCancelled: {
      background: '#ef4444',
      color: 'white'
    },
    bookingStatusDefault: {
      background: '#888',
      color: 'white'
    },
    bookingPrice: {
      fontWeight: '700',
      color: '#7c3aed',
      marginTop: '8px'
    },
    cancelBtn: {
      marginTop: '8px',
      padding: '6px 16px',
      background: 'none',
      border: '1px solid #ddd',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700',
      transition: 'all 0.2s'
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
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '20px'
    },
    modalInfo: {
      padding: '12px',
      background: '#f5f5f5',
      borderRadius: '12px',
      marginBottom: '16px'
    },
    modalRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '12px'
    },
    modalTotal: {
      marginBottom: '16px',
      textAlign: 'center',
      fontWeight: '700',
      color: '#7c3aed'
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
    myStudioHeader: {
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px'
    },
    myStudioName: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'white'
    },
    myStudioActions: {
      marginTop: '16px',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    myStudioActionBtn: {
      padding: '8px 20px',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    myStudioDeleteBtn: {
      padding: '8px 20px',
      border: '1px solid #ef4444',
      color: '#ef4444',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      background: 'transparent',
      transition: 'all 0.2s'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎙️ Studio Booking</h1>
        <div style={styles.headerActions}>
          <div style={styles.searchBox}>
            <i className="fas fa-search" style={styles.searchIcon}></i>
            <input 
              type="text" 
              style={styles.searchInput}
              placeholder="Search studios..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {!myStudio && (
            <button 
              style={styles.primaryBtn}
              onClick={() => setShowCreateForm(!showCreateForm)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              + List Your Studio
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <div 
          style={{...styles.tab, ...(activeTab === 'browse' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('browse')}
        >
          Browse Studios
          {activeTab === 'browse' && <div style={styles.tabActiveIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'my-bookings' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('my-bookings')}
        >
          My Bookings ({myBookings.length})
          {activeTab === 'my-bookings' && <div style={styles.tabActiveIndicator}></div>}
        </div>
        {myStudio && (
          <div 
            style={{...styles.tab, ...(activeTab === 'my-studio' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('my-studio')}
          >
            My Studio
            {activeTab === 'my-studio' && <div style={styles.tabActiveIndicator}></div>}
          </div>
        )}
      </div>

      {/* Create Studio Form */}
      {showCreateForm && (
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>List Your Studio</h3>
          <div style={styles.formContainer}>
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Studio Name *" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
            <textarea 
              style={styles.formTextarea}
              placeholder="Description" 
              rows="2" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Address" 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
            />
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="City *" 
              value={formData.city} 
              onChange={(e) => setFormData({...formData, city: e.target.value})} 
            />
            <input 
              type="number" 
              style={styles.formInput}
              placeholder="Hourly Rate ($) *" 
              step="0.01" 
              value={formData.hourly_rate} 
              onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})} 
            />
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Equipment (comma separated)" 
              value={formData.equipment} 
              onChange={(e) => setFormData({...formData, equipment: e.target.value})} 
            />
            <input 
              type="number" 
              style={styles.formInput}
              placeholder="Capacity" 
              value={formData.capacity} 
              onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
            />
            <button 
              style={styles.primaryBtn}
              onClick={createStudio}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              List Studio
            </button>
            <button 
              style={styles.modalCancelBtn}
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Browse Studios Tab */}
      {activeTab === 'browse' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredStudios.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-headphones" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>No studios found</p>
              </div>
            </div>
          ) : (
            <div style={styles.grid2}>
              {filteredStudios.map(studio => (
                <div key={studio.id} style={styles.studioCard}>
                  <div style={styles.studioHeader}>
                    <div style={styles.studioIcon}>🏢</div>
                    <div style={styles.studioName}>{studio.name}</div>
                    <div style={styles.studioCity}>📍 {studio.city}</div>
                    {studio.profiles?.is_verified && (
                      <span style={styles.verifiedBadge}>✓ Verified</span>
                    )}
                    <div style={styles.equipmentBadge}>
                      {studio.equipment?.length || 0} items
                    </div>
                  </div>
                  <div style={styles.studioEquipment}>
                    <strong>Equipment:</strong> {studio.equipment?.slice(0, 4).join(', ')}{studio.equipment?.length > 4 ? '...' : ''}
                  </div>
                  <div style={styles.studioCapacity}>
                    <strong>Capacity:</strong> {studio.capacity || 'N/A'} people
                  </div>
                  {studio.description && (
                    <div style={styles.studioDescription}>{studio.description.substring(0, 80)}</div>
                  )}
                  <div style={styles.studioFooter}>
                    <span style={styles.studioPrice}>${studio.hourly_rate}/hour</span>
                    <span style={styles.studioOwner}>
                      <i className="fas fa-user"></i> {studio.profiles?.display_name || studio.profiles?.username}
                    </span>
                  </div>
                  {studio.owner_id !== session.user.id && (
                    <button 
                      style={styles.bookBtn}
                      onClick={() => {
                        setSelectedStudio(studio)
                        setShowBookingModal(true)
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
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
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-calendar" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>No bookings yet</p>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Book a studio to get started</p>
              </div>
            </div>
          ) : (
            myBookings.map(booking => (
              <div key={booking.id} style={styles.card}>
                <div style={styles.bookingItem}>
                  <div>
                    <h4 style={styles.bookingTitle}>{booking.studio?.name}</h4>
                    <p style={styles.bookingDetail}>
                      📅 {formatDate(booking.date)} • 🕐 {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </p>
                    <p style={styles.bookingDetail}>
                      📍 {booking.studio?.city}
                    </p>
                    {booking.purpose && (
                      <p style={styles.bookingDetail}>Purpose: {booking.purpose}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      ...styles.bookingStatus,
                      ...(booking.status === 'confirmed' ? styles.bookingStatusConfirmed : 
                          booking.status === 'pending' ? styles.bookingStatusPending : 
                          booking.status === 'cancelled' ? styles.bookingStatusCancelled : 
                          styles.bookingStatusDefault)
                    }}>
                      {booking.status === 'confirmed' ? '✅ Confirmed' : 
                       booking.status === 'pending' ? '⏳ Pending' : 
                       booking.status === 'cancelled' ? '❌ Cancelled' : booking.status}
                    </span>
                    <p style={styles.bookingPrice}>${booking.total_price}</p>
                    {booking.status === 'pending' && (
                      <button 
                        style={styles.cancelBtn}
                        onClick={() => cancelBooking(booking.id)}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
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
        <div style={styles.card}>
          <div style={styles.myStudioHeader}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏢</div>
            <h2 style={styles.myStudioName}>{myStudio.name}</h2>
            <p style={{ color: '#888' }}>📍 {myStudio.city}</p>
            <p style={{ color: '#888' }}>💰 ${myStudio.hourly_rate}/hour</p>
          </div>
          <div style={styles.studioEquipment}>
            <strong>Equipment:</strong> {myStudio.equipment?.join(', ')}
          </div>
          <div style={styles.studioCapacity}>
            <strong>Capacity:</strong> {myStudio.capacity || 'N/A'} people
          </div>
          {myStudio.description && <p>{myStudio.description}</p>}
          <div style={styles.myStudioActions}>
            <button 
              style={styles.myStudioActionBtn}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              onClick={() => setShowCreateForm(true)}
            >
              Edit Studio
            </button>
            <button 
              style={styles.myStudioDeleteBtn}
              onClick={() => deleteStudio(myStudio.id)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Delete Studio
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedStudio && (
        <div style={styles.modal} onClick={() => setShowBookingModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>📅 Book {selectedStudio.name}</div>
            
            <div style={styles.modalInfo}>
              <p><strong>Rate:</strong> ${selectedStudio.hourly_rate}/hour</p>
              <p><strong>Location:</strong> {selectedStudio.city}</p>
            </div>
            
            <input 
              type="date" 
              style={styles.formInput}
              placeholder="Date" 
              value={bookingData.date}
              onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
            />
            
            <div style={styles.modalRow}>
              <input 
                type="time" 
                style={styles.formInput}
                placeholder="Start Time" 
                value={bookingData.start_time}
                onChange={(e) => setBookingData({...bookingData, start_time: e.target.value})}
              />
              <input 
                type="number" 
                style={styles.formInput}
                placeholder="Hours" 
                min="1"
                max="12"
                value={bookingData.duration}
                onChange={(e) => setBookingData({...bookingData, duration: e.target.value})}
              />
            </div>
            
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Purpose (optional)" 
              value={bookingData.purpose}
              onChange={(e) => setBookingData({...bookingData, purpose: e.target.value})}
            />
            
            {bookingData.duration && bookingData.start_time && (
              <p style={styles.modalTotal}>
                Total: ${selectedStudio.hourly_rate * parseInt(bookingData.duration) || 0}
              </p>
            )}
            
            <button 
              style={styles.modalConfirmBtn}
              onClick={() => bookStudio(selectedStudio.id, selectedStudio.hourly_rate)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              Confirm Booking
            </button>
            <button 
              style={styles.modalCancelBtn}
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