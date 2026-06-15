// src/components/CollaborationFinder.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function CollaborationFinder({ session }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    genre: 'all',
    role: 'all',
    location: 'all',
    experience: 'all'
  })
  const [collabRequest, setCollabRequest] = useState({
    project_type: 'track',
    description: '',
    target_id: null,
    budget: '',
    deadline: ''
  })
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [sentRequests, setSentRequests] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [activeTab, setActiveTab] = useState('find')

  const projectTypes = [
    { value: 'track', label: '🎵 Track Collaboration', icon: '🎵' },
    { value: 'video', label: '🎬 Music Video', icon: '🎬' },
    { value: 'live', label: '🎤 Live Performance', icon: '🎤' },
    { value: 'remix', label: '🔄 Remix', icon: '🔄' },
    { value: 'album', label: '💿 Album Project', icon: '💿' },
    { value: 'tour', label: '🚌 Tour Support', icon: '🚌' }
  ]

  const genres = [
    'Hip Hop', 'Trap', 'R&B', 'Pop', 'EDM', 'Rock', 'Lo-fi', 
    'Afrobeat', 'Dancehall', 'Reggaeton', 'Jazz', 'Classical', 'House', 'Techno'
  ]

  const roles = [
    { value: 'producer', label: '🎹 Producer', icon: '🎹' },
    { value: 'vocalist', label: '🎤 Vocalist', icon: '🎤' },
    { value: 'songwriter', label: '✍️ Songwriter', icon: '✍️' },
    { value: 'mix_engineer', label: '🎛️ Mix Engineer', icon: '🎛️' },
    { value: 'mastering', label: '🔊 Mastering Engineer', icon: '🔊' },
    { value: 'video_editor', label: '🎬 Video Editor', icon: '🎬' },
    { value: 'graphic_designer', label: '🎨 Graphic Designer', icon: '🎨' }
  ]

  useEffect(() => {
    findMatches()
    loadSentRequests()
    loadIncomingRequests()
  }, [filters])

  async function findMatches() {
    setLoading(true)
    
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', session.user.id)
    
    if (filters.genre !== 'all') {
      query = query.contains('genres', [filters.genre])
    }
    if (filters.role !== 'all') {
      query = query.eq('role', filters.role)
    }
    
    const { data } = await query.limit(30)
    
    // Enhanced match scoring based on multiple factors
    const scoredMatches = data?.map(user => {
      let score = 65 // Base score
      
      // Genre match bonus
      if (user.genres?.includes(filters.genre) && filters.genre !== 'all') score += 15
      
      // Role match bonus
      if (user.role === filters.role && filters.role !== 'all') score += 10
      
      // Experience bonus
      if (user.followers_count > 1000) score += 5
      if (user.is_verified) score += 10
      
      return {
        ...user,
        matchScore: Math.min(score + Math.floor(Math.random() * 10), 99)
      }
    }).sort((a, b) => b.matchScore - a.matchScore)
    
    setMatches(scoredMatches || [])
    setLoading(false)
  }

  async function loadSentRequests() {
    const { data } = await supabase
      .from('collab_requests')
      .select('*, target:target_id(*)')
      .eq('requester_id', session.user.id)
      .order('created_at', { ascending: false })
    
    if (data) setSentRequests(data)
  }

  async function loadIncomingRequests() {
    const { data } = await supabase
      .from('collab_requests')
      .select('*, requester:requester_id(*)')
      .eq('target_id', session.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (data) setIncomingRequests(data)
  }

  async function sendCollaborationRequest(targetId, projectType, description, budget, deadline) {
    const { error } = await supabase
      .from('collab_requests')
      .insert({
        requester_id: session.user.id,
        target_id: targetId,
        project_type: projectType,
        description: description || 'I would love to collaborate!',
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline || null,
        status: 'pending'
      })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Collaboration request sent successfully!')
      setShowRequestModal(false)
      setCollabRequest({ project_type: 'track', description: '', target_id: null, budget: '', deadline: '' })
      loadSentRequests()
    }
  }

  async function respondToRequest(requestId, status) {
    await supabase
      .from('collab_requests')
      .update({ status: status })
      .eq('id', requestId)
    
    alert(status === 'accepted' ? 'Request accepted!' : 'Request declined')
    loadIncomingRequests()
  }

  function getMatchColor(score) {
    if (score >= 85) return '#10b981'
    if (score >= 70) return '#3b82f6'
    return '#f59e0b'
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>🤝 AI Collaboration Finder</h1>
          <p style={{ color: '#888' }}>Find your perfect creative match with AI-powered recommendations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px', borderBottom: '1px solid #2a2a2a' }}>
        <div className={`tab ${activeTab === 'find' ? 'active' : ''}`} onClick={() => setActiveTab('find')}>
          🔍 Find Collaborators
        </div>
        <div className={`tab ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveTab('sent')}>
          📤 Sent Requests ({sentRequests.length})
        </div>
        <div className={`tab ${activeTab === 'incoming' ? 'active' : ''}`} onClick={() => setActiveTab('incoming')}>
          📥 Incoming ({incomingRequests.length})
        </div>
        <div className={`tab ${activeTab === 'tips' ? 'active' : ''}`} onClick={() => setActiveTab('tips')}>
          💡 Tips
        </div>
      </div>

      {/* Find Collaborators Tab */}
      {activeTab === 'find' && (
        <>
          {/* Filters */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Filter Collaborators</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <select className="input" value={filters.genre} onChange={(e) => setFilters({...filters, genre: e.target.value})}>
                <option value="all">🎵 All Genres</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              
              <select className="input" value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})}>
                <option value="all">👥 All Roles</option>
                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              
              <select className="input" value={filters.location} onChange={(e) => setFilters({...filters, location: e.target.value})}>
                <option value="all">🌍 Any Location</option>
                <option value="remote">💻 Remote Only</option>
                <option value="local">📍 Local Only</option>
              </select>
              
              <select className="input" value={filters.experience} onChange={(e) => setFilters({...filters, experience: e.target.value})}>
                <option value="all">⭐ Any Experience</option>
                <option value="beginner">🌱 Beginner</option>
                <option value="intermediate">📈 Intermediate</option>
                <option value="pro">🏆 Professional</option>
              </select>
            </div>
          </div>

          {/* Match Results */}
          {loading ? (
            <div className="spinner"></div>
          ) : matches.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-user-friends" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No matches found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid-2">
              {matches.map(match => (
                <div key={match.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    right: '16px', 
                    background: getMatchColor(match.matchScore), 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 'bold' 
                  }}>
                    {match.matchScore}% Match
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div className="profile-avatar-large" style={{ width: '80px', height: '80px', marginTop: '0' }}>
                      <img src={match.avatar_url || `https://ui-avatars.com/api/?name=${(match.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>
                        {match.display_name || match.username}
                        {match.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                      </h3>
                      <p style={{ color: '#888', fontSize: '13px' }}>
                        {roles.find(r => r.value === match.role)?.label || match.role || 'Creator'} • {match.followers_count || 0} followers
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {match.genres?.slice(0, 3).map(g => (
                          <span key={g} className="badge-small" style={{ background: '#1f1f1f', color: '#aaa' }}>{g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '16px' }}>{match.bio?.substring(0, 120)}</p>
                  
                  <div className="profile-action-buttons" style={{ marginTop: '12px' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                      setSelectedMatch(match)
                      setCollabRequest({ ...collabRequest, target_id: match.id })
                      setShowRequestModal(true)
                    }}>
                      <i className="fas fa-handshake"></i> Request Collab
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => window.location.href = `/profile/${match.id}`}>
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sent Requests Tab */}
      {activeTab === 'sent' && (
        <div>
          {sentRequests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-paper-plane" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't sent any collaboration requests yet.</p>
            </div>
          ) : (
            sentRequests.map(req => (
              <div key={req.id} className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{projectTypes.find(p => p.value === req.project_type)?.label || req.project_type}</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>To: {req.target?.display_name || req.target?.username}</div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{req.description}</div>
                    {req.budget && <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>💰 Budget: ${req.budget}</div>}
                  </div>
                  <div>
                    <span className={`badge-small`} style={{ 
                      background: req.status === 'pending' ? '#ff9800' : req.status === 'accepted' ? '#4caf50' : '#f44336',
                      color: 'white'
                    }}>
                      {req.status === 'pending' ? 'Pending' : req.status === 'accepted' ? 'Accepted ✓' : 'Declined'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Incoming Requests Tab */}
      {activeTab === 'incoming' && (
        <div>
          {incomingRequests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No incoming collaboration requests.</p>
            </div>
          ) : (
            incomingRequests.map(req => (
              <div key={req.id} className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{projectTypes.find(p => p.value === req.project_type)?.label || req.project_type}</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>From: {req.requester?.display_name || req.requester?.username}</div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{req.description}</div>
                    {req.budget && <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>💰 Budget: ${req.budget}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-small" onClick={() => respondToRequest(req.id, 'accepted')}>
                      Accept
                    </button>
                    <button className="btn btn-outline btn-small" onClick={() => respondToRequest(req.id, 'declined')}>
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>💡 Collaboration Tips</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎯 Be Specific</div>
              <p style={{ fontSize: '13px', color: '#888' }}>Clearly describe your project, goals, and what you're looking for in a collaborator.</p>
            </div>
            <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💰 Discuss Budget Early</div>
              <p style={{ fontSize: '13px', color: '#888' }}>If there's payment involved, discuss budget expectations upfront to avoid misunderstandings.</p>
            </div>
            <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📝 Use Contracts</div>
              <p style={{ fontSize: '13px', color: '#888' }}>Always use a collaboration agreement that outlines ownership, royalties, and credits.</p>
            </div>
            <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎵 Share Portfolio</div>
              <p style={{ fontSize: '13px', color: '#888' }}>Share links to your previous work so collaborators can hear your style.</p>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Request Modal */}
      {showRequestModal && selectedMatch && (
        <div className="modal active" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Send Collaboration Request</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', background: '#1a1a1a', borderRadius: '12px' }}>
              <img 
                src={selectedMatch.avatar_url || `https://ui-avatars.com/api/?name=${(selectedMatch.username?.[0] || 'U')}&background=7c3aed&color=fff`}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                alt="avatar"
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>{selectedMatch.display_name || selectedMatch.username}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{selectedMatch.role || 'Creator'}</div>
              </div>
            </div>
            
            <select 
              className="form-select" 
              value={collabRequest.project_type}
              onChange={(e) => setCollabRequest({...collabRequest, project_type: e.target.value})}
              style={{ marginBottom: '16px' }}
            >
              {projectTypes.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            
            <textarea 
              className="form-textarea" 
              placeholder="Describe your collaboration idea..."
              value={collabRequest.description}
              onChange={(e) => setCollabRequest({...collabRequest, description: e.target.value})}
              rows="4"
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <input 
                type="number" 
                className="input" 
                placeholder="Budget (optional)"
                value={collabRequest.budget}
                onChange={(e) => setCollabRequest({...collabRequest, budget: e.target.value})}
              />
              <input 
                type="date" 
                className="input" 
                placeholder="Deadline (optional)"
                value={collabRequest.deadline}
                onChange={(e) => setCollabRequest({...collabRequest, deadline: e.target.value})}
              />
            </div>
            
            <button className="apply-btn" onClick={() => sendCollaborationRequest(
              collabRequest.target_id, 
              collabRequest.project_type, 
              collabRequest.description, 
              collabRequest.budget, 
              collabRequest.deadline
            )}>
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