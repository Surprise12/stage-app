// src/components/Marketplace.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Marketplace({ session }) {
  const [listings, setListings] = useState([])
  const [myListings, setMyListings] = useState([])
  const [favorites, setFavorites] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedListing, setSelectedListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'instruments',
    condition: 'new',
    location: '',
    negotiable: false,
    images: []
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  const categories = [
    { value: 'instruments', label: '🎸 Instruments', icon: '🎸' },
    { value: 'tickets', label: '🎫 Tickets', icon: '🎫' },
    { value: 'equipment', label: '🎧 Studio Equipment', icon: '🎧' },
    { value: 'merch', label: '👕 Merchandise', icon: '👕' },
    { value: 'beats', label: '🎵 Beats & Instrumentals', icon: '🎵' },
    { value: 'services', label: '🎛️ Services', icon: '🎛️' },
    { value: 'other', label: '📦 Other', icon: '📦' }
  ]

  const conditions = [
    { value: 'new', label: '✨ Brand New', icon: '✨' },
    { value: 'like-new', label: '👍 Like New', icon: '👍' },
    { value: 'good', label: '✅ Good', icon: '✅' },
    { value: 'fair', label: '⚠️ Fair', icon: '⚠️' },
    { value: 'poor', label: '🔧 Poor', icon: '🔧' }
  ]

  useEffect(() => {
    loadListings()
    loadMyListings()
    loadFavorites()
  }, [selectedCategory])

  async function loadListings() {
    setLoading(true)
    let query = supabase
      .from('marketplace_listings')
      .select('*, seller:user_id(id, username, display_name, avatar_url, is_verified)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory)
    }
    
    const { data } = await query.limit(30)
    if (data) setListings(data)
    setLoading(false)
  }

  async function loadMyListings() {
    const { data } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setMyListings(data)
  }

  async function loadFavorites() {
    const { data } = await supabase
      .from('marketplace_favorites')
      .select('listing_id')
      .eq('user_id', session.user.id)
    if (data) setFavorites(data.map(f => f.listing_id))
  }

  async function createListing() {
    if (!formData.title || !formData.price || !formData.location) {
      alert('Please fill in required fields')
      return
    }

    // Upload images if any
    const imageUrls = []
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `marketplace/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('marketplace')
        .upload(filePath, file)
      
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('marketplace')
          .getPublicUrl(filePath)
        imageUrls.push(publicUrl)
      }
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
        image_urls: imageUrls,
        status: 'active'
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Listing created!')
      setShowCreateForm(false)
      setFormData({ title: '', description: '', price: '', category: 'instruments', condition: 'new', location: '', negotiable: false, images: [] })
      setImageFiles([])
      setImagePreviews([])
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

  async function toggleFavorite(listingId) {
    if (favorites.includes(listingId)) {
      await supabase
        .from('marketplace_favorites')
        .delete()
        .eq('user_id', session.user.id)
        .eq('listing_id', listingId)
      setFavorites(favorites.filter(id => id !== listingId))
    } else {
      await supabase
        .from('marketplace_favorites')
        .insert({ user_id: session.user.id, listing_id: listingId })
      setFavorites([...favorites, listingId])
    }
  }

  async function contactSeller(sellerId, listingTitle) {
    alert(`Message feature coming soon! You'll be able to message the seller about "${listingTitle}".`)
  }

  function handleImageSelect(e) {
    const files = Array.from(e.target.files)
    setImageFiles([...imageFiles, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result])
      }
      reader.readAsDataURL(file)
    })
  }

  function removeImage(index) {
    setImageFiles(imageFiles.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categoryIcons = {
    instruments: '🎸',
    tickets: '🎫',
    equipment: '🎧',
    merch: '👕',
    beats: '🎵',
    services: '🎛️',
    other: '📦'
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>🛒 Marketplace</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box" style={{ width: '250px' }}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search listings..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            <i className="fas fa-plus"></i> Sell
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px', borderBottom: '1px solid #2a2a2a' }}>
        <div className={`tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
          Browse ({listings.length})
        </div>
        <div className={`tab ${activeTab === 'my-listings' ? 'active' : ''}`} onClick={() => setActiveTab('my-listings')}>
          My Listings ({myListings.length})
        </div>
        <div className={`tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
          Favorites ({favorites.length})
        </div>
      </div>

      {/* Category Filter */}
      {activeTab === 'browse' && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'} btn-small`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat.value}
              className={`btn ${selectedCategory === cat.value ? 'btn-primary' : 'btn-secondary'} btn-small`}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      )}

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
                {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="input" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})}>
                {conditions.map(cond => <option key={cond.value} value={cond.value}>{cond.label}</option>)}
              </select>
              <input type="text" className="input" placeholder="Location *" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            </div>
            
            {/* Image Upload */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Images</label>
              <div className="proof-upload-area" onClick={() => document.getElementById('listingImages').click()} style={{ cursor: 'pointer', border: '2px dashed #aaa', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                <i className="fas fa-cloud-upload-alt" style={{ fontSize: '30px', color: '#7c3aed' }}></i>
                <p style={{ marginTop: '8px', color: '#666' }}>Click to upload images</p>
                <p style={{ fontSize: '11px', color: '#999' }}>JPG, PNG, GIF (max 5MB each)</p>
              </div>
              <input type="file" id="listingImages" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageSelect} />
              <div className="proof-previews" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="proof-thumb" style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} alt="" />
                    <button className="remove-proof" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>
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

      {/* Browse Listings */}
      {activeTab === 'browse' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredListings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-store" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No listings found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {filteredListings.map(listing => (
                <div key={listing.id} className="marketplace-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedListing(listing)}>
                  <div style={{ height: '180px', background: listing.image_urls?.[0] ? `url(${listing.image_urls[0]})` : `linear-gradient(135deg, #667eea, #764ba2)`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    {!listing.image_urls?.[0] && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '64px' }}>
                        {categoryIcons[listing.category] || '📦'}
                      </div>
                    )}
                    <button 
                      className={`favorite-btn ${favorites.includes(listing.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(listing.id) }}
                      style={{ position: 'absolute', top: '12px', right: '12px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    >
                      <i className={`fas fa-heart ${favorites.includes(listing.id) ? 'active' : ''}`} style={{ color: favorites.includes(listing.id) ? '#ef4444' : '#999' }}></i>
                    </button>
                    {listing.condition && (
                      <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                        {conditions.find(c => c.value === listing.condition)?.label.split(' ')[0] || listing.condition}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <h4 style={{ marginBottom: '4px' }}>{listing.title}</h4>
                      {listing.seller?.is_verified && <span style={{ fontSize: '12px', color: '#1da1f2' }}>✓</span>}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '8px' }}>${listing.price}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                      <i className="fas fa-map-marker-alt"></i> {listing.location}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={listing.seller?.avatar_url || `https://ui-avatars.com/api/?name=${(listing.seller?.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="" />
                        <span style={{ fontSize: '12px', color: '#888' }}>{listing.seller?.display_name || listing.seller?.username}</span>
                      </div>
                      {listing.is_negotiable && <span style={{ fontSize: '11px', color: '#10b981' }}>💰 Negotiable</span>}
                    </div>
                    <button 
                      className="btn btn-primary btn-small" 
                      style={{ width: '100%', marginTop: '12px' }}
                      onClick={(e) => { e.stopPropagation(); contactSeller(listing.user_id, listing.title) }}
                    >
                      <i className="fas fa-envelope"></i> Contact Seller
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Listings Tab */}
      {activeTab === 'my-listings' && (
        <>
          {myListings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-plus-circle" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't listed any items yet.</p>
              <button className="btn btn-primary btn-small" style={{ marginTop: '12px' }} onClick={() => setShowCreateForm(true)}>
                Create Your First Listing
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {myListings.map(listing => (
                <div key={listing.id} className="marketplace-card">
                  <div style={{ height: '160px', background: listing.image_urls?.[0] ? `url(${listing.image_urls[0]})` : `linear-gradient(135deg, #667eea, #764ba2)`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
                    {!listing.image_urls?.[0] && (categoryIcons[listing.category] || '📦')}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h4>{listing.title}</h4>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '8px' }}>${listing.price}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                      <i className="fas fa-map-marker-alt"></i> {listing.location}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px' }}>
                      Status: <span style={{ color: listing.status === 'active' ? '#10b981' : '#888' }}>{listing.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-small" style={{ flex: 1 }}>Edit</button>
                      <button className="btn btn-outline btn-small" style={{ flex: 1 }} onClick={() => deleteListing(listing.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <>
          {favorites.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-heart" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No favorite items yet.</p>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Heart items you like to save them here!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {listings.filter(l => favorites.includes(l.id)).map(listing => (
                <div key={listing.id} className="marketplace-card" onClick={() => setSelectedListing(listing)}>
                  <div style={{ height: '160px', background: listing.image_urls?.[0] ? `url(${listing.image_urls[0]})` : `linear-gradient(135deg, #667eea, #764ba2)`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
                    {!listing.image_urls?.[0] && (categoryIcons[listing.category] || '📦')}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h4>{listing.title}</h4>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '8px' }}>${listing.price}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                      <i className="fas fa-map-marker-alt"></i> {listing.location}
                    </div>
                    <button className="btn btn-primary btn-small" style={{ width: '100%' }}>View Details</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setSelectedListing(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{selectedListing.title}</div>
            
            {/* Images Carousel */}
            {selectedListing.image_urls && selectedListing.image_urls.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <img src={selectedListing.image_urls[0]} style={{ width: '100%', borderRadius: '12px', maxHeight: '300px', objectFit: 'cover' }} alt="" />
              </div>
            )}
            
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7c3aed', marginBottom: '16px' }}>${selectedListing.price}</div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span><i className="fas fa-map-marker-alt"></i> {selectedListing.location}</span>
              <span><i className="fas fa-tag"></i> {categories.find(c => c.value === selectedListing.category)?.label}</span>
              <span><i className="fas fa-star"></i> {conditions.find(c => c.value === selectedListing.condition)?.label}</span>
            </div>
            
            <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>{selectedListing.description}</p>
            
            {selectedListing.is_negotiable && (
              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '12px', marginBottom: '20px', color: '#166534' }}>
                <i className="fas fa-handshake"></i> Price is negotiable - feel free to make an offer!
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '16px', background: '#1a1a1a', borderRadius: '12px' }}>
              <img src={selectedListing.seller?.avatar_url || `https://ui-avatars.com/api/?name=${(selectedListing.seller?.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '48px', height: '48px', borderRadius: '50%' }} alt="" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{selectedListing.seller?.display_name || selectedListing.seller?.username}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Member since {new Date(selectedListing.created_at).toLocaleDateString()}</div>
              </div>
              <button className="btn btn-primary btn-small" onClick={() => contactSeller(selectedListing.user_id, selectedListing.title)}>
                Message Seller
              </button>
            </div>
            
            <button className="secondary-btn" style={{ width: '100%' }} onClick={() => setSelectedListing(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}