import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function BeatMarketplace({ session }) {
  const [beats, setBeats] = useState([])
  const [myBeats, setMyBeats] = useState([])
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    bpm: '',
    key: 'C',
    genre: 'Hip Hop',
    price: '',
    license_type: 'basic'
  })
  const [audioFile, setAudioFile] = useState(null)
  const [selectedBeat, setSelectedBeat] = useState(null)

  useEffect(() => {
    loadBeats()
    loadMyBeats()
  }, [])

  async function loadBeats() {
    setLoading(true)
    const { data } = await supabase
      .from('beats')
      .select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
    if (data) setBeats(data)
    setLoading(false)
  }

  async function loadMyBeats() {
    const { data } = await supabase
      .from('beats')
      .select('*')
      .eq('user_id', session.user.id)
    if (data) setMyBeats(data)
  }

  async function uploadBeat() {
    if (!formData.title || !audioFile) {
      alert('Please fill in title and upload audio')
      return
    }

    const fileExt = audioFile.name.split('.').pop()
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
    const filePath = `beats/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('beats')
      .upload(filePath, audioFile)

    if (uploadError) {
      alert('Error uploading audio: ' + uploadError.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('beats')
      .getPublicUrl(filePath)

    const { error } = await supabase
      .from('beats')
      .insert({
        user_id: session.user.id,
        title: formData.title,
        bpm: formData.bpm || null,
        key: formData.key,
        genre: formData.genre,
        price: parseFloat(formData.price) || 0,
        audio_url: publicUrl,
        license_type: formData.license_type
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Beat uploaded!')
      setShowUploadForm(false)
      setFormData({ title: '', bpm: '', key: 'C', genre: 'Hip Hop', price: '', license_type: 'basic' })
      setAudioFile(null)
      await loadBeats()
      await loadMyBeats()
    }
  }

  async function purchaseBeat(beatId, price) {
    const { error } = await supabase
      .from('beat_purchases')
      .insert({
        beat_id: beatId,
        buyer_id: session.user.id,
        license_type: 'basic',
        amount_paid: price
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      await supabase
        .from('beats')
        .update({ purchases_count: supabase.sql`purchases_count + 1` })
        .eq('id', beatId)
      alert('Beat purchased! Check your email for download link.')
      loadBeats()
    }
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>🎵 Beat Marketplace</h1>
        <button className="btn btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
          {showUploadForm ? 'Cancel' : '+ Sell Your Beats'}
        </button>
      </div>

      {showUploadForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3>Upload New Beat</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input type="text" className="input" placeholder="Beat Title *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input type="number" className="input" placeholder="BPM" value={formData.bpm} onChange={(e) => setFormData({...formData, bpm: e.target.value})} />
              <select className="input" value={formData.key} onChange={(e) => setFormData({...formData, key: e.target.value})}>
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="input" value={formData.genre} onChange={(e) => setFormData({...formData, genre: e.target.value})}>
                <option>Hip Hop</option><option>Trap</option><option>R&B</option><option>Pop</option><option>EDM</option><option>Lo-fi</option><option>Drill</option>
              </select>
              <input type="number" className="input" placeholder="Price ($)" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
            </div>
            <select className="input" value={formData.license_type} onChange={(e) => setFormData({...formData, license_type: e.target.value})}>
              <option value="basic">Basic License ($) - Standard Use</option>
              <option value="premium">Premium License ($$) - Commercial + Streaming</option>
              <option value="exclusive">Exclusive License ($$$) - Full Rights</option>
            </select>
            <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} className="input" />
            <button className="btn btn-primary" onClick={uploadBeat}>Upload Beat</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner"></div>
      ) : beats.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}><p>No beats available yet</p></div>
      ) : (
        <div className="grid-3">
          {beats.map(beat => (
            <div key={beat.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedBeat(beat)}>
              <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎵</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{beat.title}</div>
                <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>{beat.genre} • {beat.bpm} BPM • {beat.key}</div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed' }}>${beat.price}</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>{beat.purchases_count || 0} sold</span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} onClick={(e) => { e.stopPropagation(); purchaseBeat(beat.id, beat.price) }}>Purchase License</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBeat && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setSelectedBeat(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h3>{selectedBeat.title}</h3>
            <p>Producer: {selectedBeat.profiles?.display_name || selectedBeat.profiles?.username}</p>
            <p>Genre: {selectedBeat.genre} | BPM: {selectedBeat.bpm} | Key: {selectedBeat.key}</p>
            <audio controls style={{ width: '100%', marginTop: '16px' }} src={selectedBeat.audio_url} />
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => purchaseBeat(selectedBeat.id, selectedBeat.price)}>Purchase - ${selectedBeat.price}</button>
          </div>
        </div>
      )}
    </div>
  )
}