// src/pages/BeatMarketplace.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function BeatMarketplace({ session }) {
  const [beats, setBeats] = useState([])
  const [myBeats, setMyBeats] = useState([])
  const [myPurchases, setMyPurchases] = useState([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bpm: '',
    key: 'C',
    genre: 'Hip Hop',
    price: '',
    license_type: 'basic',
    tags: ''
  })
  const [audioFile, setAudioFile] = useState(null)
  const [selectedBeat, setSelectedBeat] = useState(null)
  const [uploading, setUploading] = useState(false)

  const genres = ['Hip Hop', 'Trap', 'R&B', 'Pop', 'EDM', 'Lo-fi', 'Drill', 'Afrobeat', 'Dancehall', 'Reggaeton']

  useEffect(() => {
    loadBeats()
    loadMyBeats()
    loadMyPurchases()
  }, [])

  async function loadBeats() {
    setLoading(true)
    let query = supabase
      .from('beats')
      .select('*, profiles:user_id(id, username, display_name, avatar_url, is_verified)')
      .order('created_at', { ascending: false })
    
    if (selectedGenre !== 'all') {
      query = query.eq('genre', selectedGenre)
    }
    
    const { data } = await query
    if (data) setBeats(data)
    setLoading(false)
  }

  async function loadMyBeats() {
    const { data } = await supabase
      .from('beats')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (data) setMyBeats(data)
  }

  async function loadMyPurchases() {
    const { data } = await supabase
      .from('beat_purchases')
      .select('*, beat:beat_id(*)')
      .eq('buyer_id', session.user.id)
      .order('purchased_at', { ascending: false })
    if (data) setMyPurchases(data)
  }

  async function uploadBeat() {
    if (!formData.title || !audioFile) {
      alert('Please fill in title and upload audio')
      return
    }

    setUploading(true)

    const fileExt = audioFile.name.split('.').pop()
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
    const filePath = `beats/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('beats')
      .upload(filePath, audioFile)

    if (uploadError) {
      alert('Error uploading audio: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('beats')
      .getPublicUrl(filePath)

    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t)

    const { error } = await supabase
      .from('beats')
      .insert({
        user_id: session.user.id,
        title: formData.title,
        description: formData.description,
        bpm: formData.bpm || null,
        key: formData.key,
        genre: formData.genre,
        price: parseFloat(formData.price) || 0,
        audio_url: publicUrl,
        license_type: formData.license_type,
        tags: tags
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Beat uploaded successfully!')
      setShowUploadForm(false)
      setFormData({ title: '', description: '', bpm: '', key: 'C', genre: 'Hip Hop', price: '', license_type: 'basic', tags: '' })
      setAudioFile(null)
      await loadBeats()
      await loadMyBeats()
    }
    setUploading(false)
  }

  async function purchaseBeat(beatId, price, licenseType) {
    const { error } = await supabase
      .from('beat_purchases')
      .insert({
        beat_id: beatId,
        buyer_id: session.user.id,
        license_type: licenseType,
        amount_paid: price
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      await supabase
        .from('beats')
        .update({ purchases_count: supabase.raw('purchases_count + 1') })
        .eq('id', beatId)
      alert('Beat purchased! Check your email for download link.')
      await loadBeats()
      await loadMyPurchases()
    }
  }

  async function deleteBeat(beatId) {
    if (confirm('Are you sure you want to delete this beat?')) {
      await supabase.from('beats').delete().eq('id', beatId)
      await loadBeats()
      await loadMyBeats()
      alert('Beat deleted')
    }
  }

  const filteredBeats = beats.filter(beat => {
    if (searchQuery) {
      return beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             beat.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  useEffect(() => {
    loadBeats()
  }, [selectedGenre])

  const licenseOptions = {
    basic: { name: 'Basic License', price: 29.99, rights: ['Non-exclusive', 'Up to 5,000 streams', 'Social media use'] },
    premium: { name: 'Premium License', price: 99.99, rights: ['Non-exclusive', 'Unlimited streams', 'YouTube monetization', 'Radio play'] },
    exclusive: { name: 'Exclusive License', price: 499.99, rights: ['Full exclusive rights', 'Unlimited everything', 'You keep 100% royalties', 'Includes stems'] }
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>🎵 Beat Marketplace</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box" style={{ width: '250px' }}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search beats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
            {showUploadForm ? 'Cancel' : '+ Sell Beats'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <div className={`tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
          Browse Beats
        </div>
        <div className={`tab ${activeTab === 'my-beats' ? 'active' : ''}`} onClick={() => setActiveTab('my-beats')}>
          My Beats ({myBeats.length})
        </div>
        <div className={`tab ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>
          My Purchases ({myPurchases.length})
        </div>
      </div>

      {/* Genre Filter */}
      {activeTab === 'browse' && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${selectedGenre === 'all' ? 'btn-primary' : 'btn-secondary'} btn-small`}
            onClick={() => setSelectedGenre('all')}
          >
            All
          </button>
          {genres.map(genre => (
            <button 
              key={genre}
              className={`btn ${selectedGenre === genre ? 'btn-primary' : 'btn-secondary'} btn-small`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3>Upload New Beat</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input type="text" className="input" placeholder="Beat Title *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            <textarea className="input" placeholder="Description" rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input type="number" className="input" placeholder="BPM" value={formData.bpm} onChange={(e) => setFormData({...formData, bpm: e.target.value})} />
              <select className="input" value={formData.key} onChange={(e) => setFormData({...formData, key: e.target.value})}>
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="input" value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})}>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <input type="number" className="input" placeholder="Price ($)" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
            </div>
            <input type="text" className="input" placeholder="Tags (comma separated)" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} />
            <select className="input" value={formData.license_type} onChange={(e) => setFormData({...formData, license_type: e.target.value})}>
              <option value="basic">Basic License - $29.99</option>
              <option value="premium">Premium License - $99.99</option>
              <option value="exclusive">Exclusive License - $499.99</option>
            </select>
            <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} className="input" />
            {audioFile && <p style={{ fontSize: '12px', color: '#4caf50' }}>✓ Ready to upload: {audioFile.name}</p>}
            <button className="btn btn-primary" onClick={uploadBeat} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Beat'}
            </button>
          </div>
        </div>
      )}

      {/* Browse Beats */}
      {activeTab === 'browse' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredBeats.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-headphones" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No beats found</p>
            </div>
          ) : (
            <div className="grid-3">
              {filteredBeats.map(beat => (
                <div key={beat.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedBeat(beat)}>
                  <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎵</div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{beat.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px' }}>{beat.genre} • {beat.bpm} BPM • {beat.key}</div>
                    {beat.profiles?.is_verified && <div style={{ fontSize: '10px', marginTop: '4px' }}>✓ Verified Producer</div>}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ color: '#888', fontSize: '12px' }}>by {beat.profiles?.display_name || beat.profiles?.username}</div>
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed' }}>${beat.price}</span>
                      <span style={{ fontSize: '11px', color: '#888' }}>{beat.purchases_count || 0} sold</span>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '10px', background: '#f0f2f5', padding: '2px 6px', borderRadius: '12px' }}>{beat.license_type}</span>
                      {beat.tags?.slice(0, 2).map(tag => (
                        <span key={tag} style={{ fontSize: '10px', background: '#f0f2f5', padding: '2px 6px', borderRadius: '12px' }}>#{tag}</span>
                      ))}
                    </div>
                    <audio controls style={{ width: '100%', marginTop: '12px', height: '36px' }} src={beat.audio_url} onClick={(e) => e.stopPropagation()} />
                    <button className="btn btn-primary btn-small" style={{ width: '100%', marginTop: '12px' }} onClick={(e) => { e.stopPropagation(); purchaseBeat(beat.id, beat.price, beat.license_type) }}>
                      Purchase - ${beat.price}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Beats Tab */}
      {activeTab === 'my-beats' && (
        <>
          {myBeats.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-plus-circle" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't uploaded any beats yet.</p>
              <button className="btn btn-primary btn-small" style={{ marginTop: '12px' }} onClick={() => setShowUploadForm(true)}>
                Upload Your First Beat
              </button>
            </div>
          ) : (
            <div className="grid-3">
              {myBeats.map(beat => (
                <div key={beat.id} className="card">
                  <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎵</div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{beat.title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', marginTop: '4px' }}>{beat.genre} • {beat.bpm} BPM</div>
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed' }}>${beat.price}</span>
                      <span style={{ fontSize: '11px', color: '#888' }}>{beat.purchases_count || 0} sold</span>
                    </div>
                    <audio controls style={{ width: '100%', marginTop: '12px', height: '36px' }} src={beat.audio_url} />
                    <button className="btn btn-outline btn-small" style={{ width: '100%', marginTop: '12px' }} onClick={() => deleteBeat(beat.id)}>
                      Delete Beat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Purchases Tab */}
      {activeTab === 'purchases' && (
        <>
          {myPurchases.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-shopping-cart" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't purchased any beats yet.</p>
            </div>
          ) : (
            <div className="grid-2">
              {myPurchases.map(purchase => (
                <div key={purchase.id} className="card">
                  <h4>{purchase.beat?.title}</h4>
                  <p style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                    Purchased: {new Date(purchase.purchased_at).toLocaleDateString()}
                  </p>
                  <p>License: <strong>{purchase.license_type}</strong></p>
                  <p>Amount: <strong style={{ color: '#7c3aed' }}>${purchase.amount_paid}</strong></p>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-small">Download</button>
                    <button className="btn btn-outline btn-small">View License</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Beat Detail Modal */}
      {selectedBeat && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setSelectedBeat(null)}>
          <div className="modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">{selectedBeat.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="suggestion-avatar" style={{ width: '48px', height: '48px' }}>
                <img src={selectedBeat.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(selectedBeat.profiles?.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt="" />
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{selectedBeat.profiles?.display_name || selectedBeat.profiles?.username}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{selectedBeat.genre} Producer</div>
              </div>
            </div>
            <p><strong>Genre:</strong> {selectedBeat.genre} | <strong>BPM:</strong> {selectedBeat.bpm} | <strong>Key:</strong> {selectedBeat.key}</p>
            <p><strong>Tags:</strong> {selectedBeat.tags?.join(', ') || 'None'}</p>
            <audio controls style={{ width: '100%', marginTop: '16px' }} src={selectedBeat.audio_url} />
            
            <div style={{ marginTop: '20px' }}>
              <h4>License Options</h4>
              {Object.entries(licenseOptions).map(([key, opt]) => (
                <div key={key} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '8px', cursor: 'pointer' }} onClick={() => purchaseBeat(selectedBeat.id, opt.price, key)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{opt.name}</strong>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed' }}>${opt.price}</span>
                  </div>
                  <ul style={{ marginLeft: '20px', marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    {opt.rights.map((right, i) => <li key={i}>{right}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            
            <button className="secondary-btn" style={{ marginTop: '16px', width: '100%' }} onClick={() => setSelectedBeat(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}