import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function StudioBooking({ session }) {
  const [studios, setStudios] = useState([])
  const [myStudio, setMyStudio] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    hourly_rate: '',
    equipment: '',
    capacity: ''
  })

  useEffect(() => {
    loadStudios()
    checkMyStudio()
  }, [])

  async function loadStudios() {
    const { data } = await supabase.from('studios').select('*, profiles:owner_id(id, username, display_name)').limit(20)
    if (data) setStudios(data)
  }

  async function checkMyStudio() {
    const { data } = await supabase.from('studios').select('*').eq('owner_id', session.user.id).single()
    if (data) setMyStudio(data)
  }

  async function createStudio() {
    if (!formData.name || !formData.city || !formData.hourly_rate) {
      alert('Please fill in required fields')
      return
    }

    const { error } = await supabase.from('studios').insert({
      owner_id: session.user.id,
      name: formData.name,
      address: formData.address,
      city: formData.city,
      hourly_rate: parseFloat(formData.hourly_rate),
      equipment: formData.equipment.split(',').map(e => e.trim()),
      capacity: parseInt(formData.capacity) || null
    })

    if (error) alert('Error: ' + error.message)
    else {
      alert('Studio listed!')
      setShowCreateForm(false)
      setFormData({ name: '', address: '', city: '', hourly_rate: '', equipment: '', capacity: '' })
      loadStudios()
      checkMyStudio()
    }
  }

  async function bookStudio(studioId, hourlyRate) {
    const date = prompt('Enter date (YYYY-MM-DD):')
    const startTime = prompt('Enter start time (HH:MM):')
    const duration = parseInt(prompt('Enter duration in hours:'))
    if (!date || !startTime || !duration) return

    const endTime = new Date(`2000-01-01T${startTime}`)
    endTime.setHours(endTime.getHours() + duration)

    const { error } = await supabase.from('studio_bookings').insert({
      studio_id: studioId,
      booker_id: session.user.id,
      date: date,
      start_time: startTime,
      end_time: endTime.toTimeString().slice(0, 5),
      total_price: hourlyRate * duration
    })

    if (error) alert('Error: ' + error.message)
    else alert('Booking request sent! The studio owner will confirm.')
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>🎙️ Studio Booking</h1>
        {!myStudio && <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>+ List Your Studio</button>}
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3>List Your Studio</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input type="text" className="input" placeholder="Studio Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <input type="text" className="input" placeholder="Address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            <input type="text" className="input" placeholder="City *" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
            <input type="number" className="input" placeholder="Hourly Rate ($) *" step="0.01" value={formData.hourly_rate} onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})} />
            <input type="text" className="input" placeholder="Equipment (comma separated: e.g., Neumann mic, Apollo interface)" value={formData.equipment} onChange={(e) => setFormData({...formData, equipment: e.target.value})} />
            <input type="number" className="input" placeholder="Capacity" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} />
            <button className="btn btn-primary" onClick={createStudio}>List Studio</button>
          </div>
        </div>
      )}

      <div className="grid-2">
        {studios.map(studio => (
          <div key={studio.id} className="card">
            <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏢</div>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{studio.name}</div>
              <div style={{ color: '#888', fontSize: '12px' }}>📍 {studio.city}</div>
            </div>
            <p><strong>Equipment:</strong> {studio.equipment?.slice(0, 3).join(', ')}...</p>
            <p><strong>Capacity:</strong> {studio.capacity || 'N/A'} people</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed', marginTop: '12px' }}>${studio.hourly_rate}/hour</p>
            {studio.owner_id !== session.user.id && (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => bookStudio(studio.id, studio.hourly_rate)}>Book Session</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}