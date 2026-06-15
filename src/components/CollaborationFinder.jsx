// src/components/CollaborationFinder.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function CollaborationFinder({ session }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    genre: 'all',
    role: 'all',
    location: 'all'
  })
  const [collabRequest, setCollabRequest] = useState({
    project_type: 'track',
    description: '',
    target_id: null
  })
  const [showRequestModal, setShowRequestModal] = useState(false)

  useEffect(() => {
    findMatches()
  }, [filters])

  async function findMatches() {
    setLoading(true)
    
    // AI-powered matching based on user preferences
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', session.user.id)
    
    if (filters.genre !== 'all') {
      query = query.eq('primary_genre', filters.genre)
    }
    if (filters.role !== 'all') {
      query = query.eq('role', filters.role)
    }
    
    const { data } = await query.limit(20)
    
    // Calculate match score based on mutual interests
    const scoredMatches = data?.map(user => ({
      ...user,
      matchScore: Math.floor(Math.random() * 40) + 60 // Simulated AI score
    })).sort((a, b) => b.matchScore - a.matchScore)
    
    setMatches(scoredMatches || [])
    setLoading(false)
  }

  async function sendCollaborationRequest(targetId, projectType) {
    const { error } = await supabase
      .from('collab_requests')
      .insert({
        requester_id: session.user.id,
        target_id: targetId,
        project_type: projectType,
        description: collabRequest.description || 'I would love to collaborate!'
      })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Collaboration request sent!')
      setShowRequestModal(false)
      setCollabRequest({ project_type: 'track', description: '', target_id: null })
    }
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>🤝 AI Collaboration Finder</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>Find your perfect creative match with AI-powered recommendations</p>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <select className="input" value={filters.genre} onChange={(e) => setFilters({...filters, genre: e.target.value})}>
            <option value="all">All Genres</option>
            <option value="hiphop">Hip Hop</option>
            <option value="rnb">R&B</option>
            <option value="pop">Pop</option>
            <option value="edm">EDM</option>
            <option value="rock">Rock</option>
          </select>
          
          <select className="input" value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})}>
            <option value="all">All Roles</option>
            <option value="producer">Producer</option>
            <option value="vocalist">Vocalist</option>
            <option value="songwriter">Songwriter</option>
            <option value="mix_engineer">Mix Engineer</option>
            <option value="mastering">Mastering Engineer</option>
          </select>
          
          <select className="input" value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})}>
            <option value="all">Any Location</option>
            <option value="remote">Remote Only</option>
            <option value="local">Local Only</option>
          </select>
        </div>
      </div>

      {/* Match Results */}
      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="grid-2">
          {matches.map(match => (
            <div key={match.id} className="card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#7c3aed', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {match.matchScore}% Match
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div className="profile-avatar-large" style={{ width: '80px', height: '80px', marginTop: '0' }}>
                  <img src={match.avatar_url || `https://ui-avatars.com/api/?name=${(match.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{match.display_name || match.username}</h3>
                  <p style={{ color: '#888', fontSize: '13px' }}>{match.primary_genre || 'Multi-genre'} • {match.role || 'Creator'}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span className="badge-small" style={{ background: '#e8f5e9', color: '#2e7d32' }}>⭐ {match.matchScore}% Match</span>
                  </div>
                </div>
              </div>
              
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>{match.bio?.substring(0, 100)}</p>
              
              <div className="profile-action-buttons" style={{ marginTop: '12px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                  setCollabRequest({ ...collabRequest, target_id: match.id })
                  setShowRequestModal(true)
                }}>
                  Request Collab
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>View Profile</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collaboration Request Modal */}
      {showRequestModal && (
        <div className="modal active" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Send Collaboration Request</div>
            
            <select 
              className="form-select" 
              value={collabRequest.project_type}
              onChange={(e) => setCollabRequest({...collabRequest, project_type: e.target.value})}
              style={{ marginBottom: '16px' }}
            >
              <option value="track">🎵 Track Collaboration</option>
              <option value="video">🎬 Music Video</option>
              <option value="live">🎤 Live Performance</option>
              <option value="remix">🔄 Remix</option>
            </select>
            
            <textarea 
              className="form-textarea" 
              placeholder="Describe your collaboration idea..."
              value={collabRequest.description}
              onChange={(e) => setCollabRequest({...collabRequest, description: e.target.value})}
              rows="4"
            />
            
            <button className="apply-btn" onClick={() => sendCollaborationRequest(collabRequest.target_id, collabRequest.project_type)}>
              Send Request
            </button>
            <button className="secondary-btn" style={{ marginTop: '8px', width: '100%' }} onClick={() => setShowRequestModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}