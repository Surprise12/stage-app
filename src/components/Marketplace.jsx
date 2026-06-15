import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Marketplace({ session }) {
  const [listings, setListings] = useState([])
  const [myListings, setMyListings] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'instruments',
    condition: 'new',
    location: '',
    negotiable: false
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadListings()
    loadMyListings()
  }, [])

  async function loadListings() {
    setLoading(true)
    const { data } = await supabase
      .from('marketplace_listings')
      .select('*, seller:user_id(id, username, display_name, avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(30)
    
    if (data) setListings(data)
    setLoading(false)
  }

  async function loadMyListings() {
    const { data } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (data) setMyListings(data)
  }

  async function createListing() {
    if (!formData.title || !formData.price || !formData.location) {
      alert('Please fill in required fields')
      return
    }

    const { error } = await supabase
      .from('marketplace_listings')
      .insert({
        user_id: session.user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        is_negotiable: formData.negotiable,
        status: 'active'
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Listing created!')
      setShowCreateForm(false)
      setFormData({ title: '', description: '', price: '', category: 'instruments', condition: 'new', location: '', negotiable: false })
      await loadListings()
      await loadMyListings()
    }
  }

  async function deleteListing(listingId) {
    if (confirm('Delete this listing?')) {
      await supabase
        .from('marketplace_listings')
        .update({ status: 'deleted' })
        .eq('id', listingId)
      await loadListings()
      await loadMyListings()
    }
  }

  const categoryIcons = {
    instruments: '🎸',
    tickets: '🎫',
    equipment: '🎧',
    merch: '👕',
    other: '📦'
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div className="marketplace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>🛒 Marketplace</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          + Create Listing
        </button>
      </div>

      {/* Create Listing Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Create New Listing</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input type="text" className="input" placeholder="Item Title *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            <textarea className="input" placeholder="Description" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input type="number" className="input" placeholder="Price ($) *" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
              <select className="input" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option value="instruments">🎸 Instruments</option>
                <option value="tickets">🎫 Tickets</option>
                <option value="equipment">🎧 Studio Equipment</option>
                <option value="merch">👕 Merchandise</option>
                <option value="other">📦 Other</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="input" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})}>
                <option value="new">✨ Brand New</option>
                <option value="like-new">👍 Like New</option>
                <option value="good">✅ Good</option>
                <option value="fair">⚠️ Fair</option>
              </select>
              <input type="text" className="input" placeholder="Location *" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.negotiable} onChange={(e) => setFormData({...formData, negotiable: e.target.checked})} />
              Price is negotiable
            </label>
            <button className="btn btn-primary" onClick={createListing}>Post Listing</button>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Marketplace Grid */}
      {loading ? (
        <div className="spinner"></div>
      ) : listings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No listings yet. Create one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {listings.map(listing => (
            <div key={listing.id} className="marketplace-card" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #ddd', transition: 'transform 0.2s' }}>
              <div style={{ height: '160px', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
                {categoryIcons[listing.category] || '📦'}
              </div>
              <div style={{ padding: '16px' }}>
                <h4 style={{ marginBottom: '8px' }}>{listing.title}</h4>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea', marginBottom: '8px' }}>${listing.price}</div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>
                  <i className="fas fa-map-marker-alt"></i> {listing.location}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px', fontWeight: 'bold' }}>
                  {listing.condition} {listing.is_negotiable && '· Price negotiable'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-small" style={{ flex: 1 }}>Message Seller</button>
                  {listing.user_id === session.user.id && (
                    <button className="btn btn-outline btn-small" style={{ flex: 1 }} onClick={() => deleteListing(listing.id)}>Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}