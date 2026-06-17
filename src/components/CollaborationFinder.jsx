// src/components/CollaborationFinder.jsx - UPDATED WITH INLINE STYLES
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
    
    try {
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
      
      const scoredMatches = data?.map(user => {
        let score = 65
        
        if (user.genres?.includes(filters.genre) && filters.genre !== 'all') score += 15
        if (user.role === filters.role && filters.role !== 'all') score += 10
        if (user.followers_count > 1000) score += 5
        if (user.is_verified) score += 10
        
        return {
          ...user,
          matchScore: Math.min(score + Math.floor(Math.random() * 10), 99)
        }
      }).sort((a, b) => b.matchScore - a.matchScore)
      
      setMatches(scoredMatches || [])
    } catch (error) {
      console.error('Error finding matches:', error)
    }
    setLoading(false)
  }

  async function loadSentRequests() {
    try {
      const { data } = await supabase
        .from('collab_requests')
        .select('*, target:target_id(*)')
        .eq('requester_id', session.user.id)
        .order('created_at', { ascending: false })
      
      if (data) setSentRequests(data)
    } catch (error) {
      console.error('Error loading sent requests:', error)
    }
  }

  async function loadIncomingRequests() {
    try {
      const { data } = await supabase
        .from('collab_requests')
        .select('*, requester:requester_id(*)')
        .eq('target_id', session.user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (data) setIncomingRequests(data)
    } catch (error) {
      console.error('Error loading incoming requests:', error)
    }
  }

  async function sendCollaborationRequest(targetId, projectType, description, budget, deadline) {
    try {
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
      
      if (error) throw error

      alert('Collaboration request sent successfully!')
      setShowRequestModal(false)
      setCollabRequest({ project_type: 'track', description: '', target_id: null, budget: '', deadline: '' })
      loadSentRequests()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function respondToRequest(requestId, status) {
    try {
      await supabase
        .from('collab_requests')
        .update({ status: status })
        .eq('id', requestId)
      
      alert(status === 'accepted' ? 'Request accepted!' : 'Request declined')
      loadIncomingRequests()
    } catch (error) {
      console.error('Error responding to request:', error)
    }
  }

  function getMatchColor(score) {
    if (score >= 85) return '#10b981'
    if (score >= 70) return '#3b82f6'
    return '#f59e0b'
  }

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
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    headerTitle: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    headerSubtitle: {
      color: '#888',
      fontWeight: '700'
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
    tabIndicator: {
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
    filtersGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px'
    },
    formSelect: {
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      background: 'white',
      width: '100%'
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '20px'
    },
    matchCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s'
    },
    matchScore: {
      position: 'absolute',
      top: '16px',
      right: '16px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      color: 'white'
    },
    matchProfile: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px'
    },
    matchAvatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    matchName: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    matchVerified: {
      color: '#1da1f2',
      marginLeft: '4px'
    },
    matchRole: {
      color: '#888',
      fontSize: '13px',
      fontWeight: '700'
    },
    matchGenres: {
      display: 'flex',
      gap: '8px',
      marginTop: '8px',
      flexWrap: 'wrap'
    },
    matchGenreBadge: {
      background: '#f3f4f6',
      color: '#6b7280',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '700'
    },
    matchBio: {
      fontSize: '13px',
      color: '#6b7280',
      marginBottom: '16px'
    },
    matchActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '12px'
    },
    primaryBtn: {
      flex: 1,
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
    secondaryBtn: {
      flex: 1,
      padding: '10px 20px',
      background: '#f3f4f6',
      color: '#1f2937',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px'
    },
    emptyIcon: {
      fontSize: '48px',
      color: '#ccc',
      marginBottom: '16px'
    },
    requestItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px'
    },
    requestTitle: {
      fontWeight: '700'
    },
    requestTo: {
      fontSize: '13px',
      color: '#888',
      fontWeight: '700'
    },
    requestDesc: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px',
      fontWeight: '700'
    },
    requestBudget: {
      fontSize: '12px',
      color: '#f59e0b',
      marginTop: '4px',
      fontWeight: '700'
    },
    requestStatus: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      color: 'white'
    },
    requestStatusPending: {
      background: '#ff9800'
    },
    requestStatusAccepted: {
      background: '#4caf50'
    },
    requestStatusDeclined: {
      background: '#f44336'
    },
    requestActions: {
      display: 'flex',
      gap: '8px'
    },
    acceptBtn: {
      padding: '6px 16px',
      background: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    declineBtn: {
      padding: '6px 16px',
      background: 'transparent',
      color: '#ef4444',
      border: '1px solid #ef4444',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    tipsGrid: {
      display: 'grid',
      gap: '16px'
    },
    tipItem: {
      padding: '12px',
      background: '#f9fafb',
      borderRadius: '12px'
    },
    tipTitle: {
      fontWeight: '700',
      marginBottom: '8px'
    },
    tipDesc: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
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
      maxWidth: '550px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '20px'
    },
    modalUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: '#f9fafb',
      borderRadius: '12px',
      marginBottom: '20px'
    },
    modalUserAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    modalUserName: {
      fontWeight: '700'
    },
    modalUserRole: {
      fontSize: '12px',
      color: '#6b7280',
      fontWeight: '700'
    },
    formTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit',
      marginBottom: '16px'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '16px'
    },
    formInput: {
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      width: '100%'
    },
    applyBtn: {
      width: '100%',
      padding: '14px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s'
    },
    cancelBtn: {
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
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>🤝 AI Collaboration Finder</h1>
          <p style={styles.headerSubtitle}>Find your perfect creative match with AI-powered recommendations</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <div 
          style={{...styles.tab, ...(activeTab === 'find' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('find')}
        >
          🔍 Find Collaborators
          {activeTab === 'find' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'sent' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('sent')}
        >
          📤 Sent Requests ({sentRequests.length})
          {activeTab === 'sent' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'incoming' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('incoming')}
        >
          📥 Incoming ({incomingRequests.length})
          {activeTab === 'incoming' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'tips' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('tips')}
        >
          💡 Tips
          {activeTab === 'tips' && <div style={styles.tabIndicator}></div>}
        </div>
      </div>

      {/* Find Collaborators Tab */}
      {activeTab === 'find' && (
        <>
          {/* Filters */}
          <div style={styles.card}>
            <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>Filter Collaborators</h3>
            <div style={styles.filtersGrid}>
              <select 
                style={styles.formSelect} 
                value={filters.genre} 
                onChange={(e) => setFilters({...filters, genre: e.target.value})}
              >
                <option value="all">🎵 All Genres</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              
              <select 
                style={styles.formSelect} 
                value={filters.role} 
                onChange={(e) => setFilters({...filters, role: e.target.value})}
              >
                <option value="all">👥 All Roles</option>
                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              
              <select 
                style={styles.formSelect} 
                value={filters.location} 
                onChange={(e) => setFilters({...filters, location: e.target.value})}
              >
                <option value="all">🌍 Any Location</option>
                <option value="remote">💻 Remote Only</option>
                <option value="local">📍 Local Only</option>
              </select>
              
              <select 
                style={styles.formSelect} 
                value={filters.experience} 
                onChange={(e) => setFilters({...filters, experience: e.target.value})}
              >
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
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-user-friends" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>No matches found. Try adjusting your filters.</p>
              </div>
            </div>
          ) : (
            <div style={styles.grid2}>
              {matches.map(match => (
                <div key={match.id} style={styles.matchCard}>
                  <div style={{...styles.matchScore, background: getMatchColor(match.matchScore)}}>
                    {match.matchScore}% Match
                  </div>
                  
                  <div style={styles.matchProfile}>
                    <img 
                      src={match.avatar_url || `https://ui-avatars.com/api/?name=${(match.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                      style={styles.matchAvatar} 
                      alt="" 
                    />
                    <div>
                      <h3 style={styles.matchName}>
                        {match.display_name || match.username}
                        {match.is_verified && <span style={styles.matchVerified}>✓</span>}
                      </h3>
                      <p style={styles.matchRole}>
                        {roles.find(r => r.value === match.role)?.label || match.role || 'Creator'} • {match.followers_count || 0} followers
                      </p>
                      <div style={styles.matchGenres}>
                        {match.genres?.slice(0, 3).map(g => (
                          <span key={g} style={styles.matchGenreBadge}>{g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <p style={styles.matchBio}>{match.bio?.substring(0, 120)}</p>
                  
                  <div style={styles.matchActions}>
                    <button 
                      style={styles.primaryBtn}
                      onClick={() => {
                        setSelectedMatch(match)
                        setCollabRequest({ ...collabRequest, target_id: match.id })
                        setShowRequestModal(true)
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                    >
                      <i className="fas fa-handshake"></i> Request Collab
                    </button>
                    <button 
                      style={styles.secondaryBtn}
                      onClick={() => window.location.href = `/profile/${match.id}`}
                    >
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
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-paper-plane" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>You haven't sent any collaboration requests yet.</p>
              </div>
            </div>
          ) : (
            sentRequests.map(req => (
              <div key={req.id} style={styles.card}>
                <div style={styles.requestItem}>
                  <div>
                    <div style={styles.requestTitle}>{projectTypes.find(p => p.value === req.project_type)?.label || req.project_type}</div>
                    <div style={styles.requestTo}>To: {req.target?.display_name || req.target?.username}</div>
                    <div style={styles.requestDesc}>{req.description}</div>
                    {req.budget && <div style={styles.requestBudget}>💰 Budget: ${req.budget}</div>}
                  </div>
                  <div>
                    <span style={{
                      ...styles.requestStatus,
                      ...(req.status === 'pending' ? styles.requestStatusPending : 
                          req.status === 'accepted' ? styles.requestStatusAccepted : 
                          styles.requestStatusDeclined)
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
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-inbox" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>No incoming collaboration requests.</p>
              </div>
            </div>
          ) : (
            incomingRequests.map(req => (
              <div key={req.id} style={styles.card}>
                <div style={styles.requestItem}>
                  <div>
                    <div style={styles.requestTitle}>{projectTypes.find(p => p.value === req.project_type)?.label || req.project_type}</div>
                    <div style={styles.requestTo}>From: {req.requester?.display_name || req.requester?.username}</div>
                    <div style={styles.requestDesc}>{req.description}</div>
                    {req.budget && <div style={styles.requestBudget}>💰 Budget: ${req.budget}</div>}
                  </div>
                  <div style={styles.requestActions}>
                    <button 
                      style={styles.acceptBtn}
                      onClick={() => respondToRequest(req.id, 'accepted')}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                    >
                      Accept
                    </button>
                    <button 
                      style={styles.declineBtn}
                      onClick={() => respondToRequest(req.id, 'declined')}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
                    >
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
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>💡 Collaboration Tips</h3>
          <div style={styles.tipsGrid}>
            <div style={styles.tipItem}>
              <div style={styles.tipTitle}>🎯 Be Specific</div>
              <p style={styles.tipDesc}>Clearly describe your project, goals, and what you're looking for in a collaborator.</p>
            </div>
            <div style={styles.tipItem}>
              <div style={styles.tipTitle}>💰 Discuss Budget Early</div>
              <p style={styles.tipDesc}>If there's payment involved, discuss budget expectations upfront to avoid misunderstandings.</p>
            </div>
            <div style={styles.tipItem}>
              <div style={styles.tipTitle}>📝 Use Contracts</div>
              <p style={styles.tipDesc}>Always use a collaboration agreement that outlines ownership, royalties, and credits.</p>
            </div>
            <div style={styles.tipItem}>
              <div style={styles.tipTitle}>🎵 Share Portfolio</div>
              <p style={styles.tipDesc}>Share links to your previous work so collaborators can hear your style.</p>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Request Modal */}
      {showRequestModal && selectedMatch && (
        <div style={styles.modal} onClick={() => setShowRequestModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Send Collaboration Request</div>
            
            <div style={styles.modalUser}>
              <img 
                src={selectedMatch.avatar_url || `https://ui-avatars.com/api/?name=${(selectedMatch.username?.[0] || 'U')}&background=7c3aed&color=fff`}
                style={styles.modalUserAvatar}
                alt="avatar"
              />
              <div>
                <div style={styles.modalUserName}>{selectedMatch.display_name || selectedMatch.username}</div>
                <div style={styles.modalUserRole}>{selectedMatch.role || 'Creator'}</div>
              </div>
            </div>
            
            <select 
              style={{...styles.formSelect, marginBottom: '16px'}}
              value={collabRequest.project_type}
              onChange={(e) => setCollabRequest({...collabRequest, project_type: e.target.value})}
            >
              {projectTypes.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            
            <textarea 
              style={styles.formTextarea}
              placeholder="Describe your collaboration idea..."
              value={collabRequest.description}
              onChange={(e) => setCollabRequest({...collabRequest, description: e.target.value})}
              rows="4"
            />
            
            <div style={styles.formRow}>
              <input 
                type="number" 
                style={styles.formInput}
                placeholder="Budget (optional)"
                value={collabRequest.budget}
                onChange={(e) => setCollabRequest({...collabRequest, budget: e.target.value})}
              />
              <input 
                type="date" 
                style={styles.formInput}
                placeholder="Deadline (optional)"
                value={collabRequest.deadline}
                onChange={(e) => setCollabRequest({...collabRequest, deadline: e.target.value})}
              />
            </div>
            
            <button 
              style={styles.applyBtn}
              onClick={() => sendCollaborationRequest(
                collabRequest.target_id, 
                collabRequest.project_type, 
                collabRequest.description, 
                collabRequest.budget, 
                collabRequest.deadline
              )}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
            >
              Send Request
            </button>
            <button 
              style={styles.cancelBtn}
              onClick={() => setShowRequestModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}