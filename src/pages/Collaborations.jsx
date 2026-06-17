// src/pages/Collaborations.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Collaborations({ session }) {
  const navigate = useNavigate()
  const [collaborations, setCollaborations] = useState([])
  const [myCollaborations, setMyCollaborations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadCollaborations()
    loadMyCollaborations()
  }, [])

  async function loadCollaborations() {
    try {
      const { data } = await supabase
        .from('collaborations')
        .select(`
          *,
          creator:creator_id (id, username, display_name, avatar_url, is_verified),
          collaborator:collaborator_id (id, username, display_name, avatar_url, is_verified)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) setCollaborations(data)
    } catch (error) {
      console.error('Error loading collaborations:', error)
    }
    setLoading(false)
  }

  async function loadMyCollaborations() {
    try {
      const { data } = await supabase
        .from('collaborations')
        .select(`
          *,
          creator:creator_id (id, username, display_name, avatar_url, is_verified),
          collaborator:collaborator_id (id, username, display_name, avatar_url, is_verified)
        `)
        .or(`creator_id.eq.${session.user.id},collaborator_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })

      if (data) setMyCollaborations(data)
    } catch (error) {
      console.error('Error loading my collaborations:', error)
    }
  }

  async function joinCollaboration(collabId) {
    try {
      const { error } = await supabase
        .from('collaboration_participants')
        .insert({
          collaboration_id: collabId,
          user_id: session.user.id
        })

      if (error) throw error

      alert('🎉 You joined the collaboration!')
      loadCollaborations()
      loadMyCollaborations()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '24px'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      borderBottom: '2px solid #eee'
    },
    tab: {
      padding: '10px 20px',
      fontWeight: '700',
      color: '#6b7280',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s'
    },
    tabActive: {
      color: '#000'
    },
    tabIndicator: {
      position: 'absolute',
      bottom: '-2px',
      left: 0,
      right: 0,
      height: '2px',
      background: '#7c3aed'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'all 0.3s'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px'
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    name: {
      fontWeight: '700',
      fontSize: '16px'
    },
    verified: {
      color: '#1da1f2',
      marginLeft: '4px'
    },
    titleText: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    description: {
      color: '#6b7280',
      marginBottom: '12px',
      lineHeight: '1.6'
    },
    stats: {
      display: 'flex',
      gap: '16px',
      fontSize: '13px',
      color: '#6b7280',
      marginBottom: '12px'
    },
    joinBtn: {
      width: '100%',
      padding: '10px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    joinBtnDisabled: {
      width: '100%',
      padding: '10px',
      background: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontWeight: '700',
      cursor: 'default'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#6b7280'
    },
    emptyIcon: {
      fontSize: '48px',
      color: '#ccc',
      marginBottom: '16px'
    },
    createBtn: {
      padding: '12px 24px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s',
      marginBottom: '24px'
    }
  }

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={styles.title}>🤝 Collaborations</h1>
        <button
          style={styles.createBtn}
          onClick={() => navigate('/collab-finder')}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
        >
          <i className="fas fa-plus"></i> Find Collaborators
        </button>
      </div>

      <div style={styles.tabs}>
        <div
          style={{...styles.tab, ...(activeTab === 'all' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('all')}
        >
          All Collaborations
          {activeTab === 'all' && <div style={styles.tabIndicator}></div>}
        </div>
        <div
          style={{...styles.tab, ...(activeTab === 'my' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('my')}
        >
          My Collaborations
          {activeTab === 'my' && <div style={styles.tabIndicator}></div>}
        </div>
      </div>

      <div style={styles.grid}>
        {(activeTab === 'all' ? collaborations : myCollaborations).map(collab => {
          const isParticipant = collab.creator_id === session.user.id || 
                               collab.collaborator_id === session.user.id

          return (
            <div
              key={collab.id}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <div style={styles.header}>
                <img
                  src={collab.creator?.avatar_url || `https://ui-avatars.com/api/?name=${(collab.creator?.username || 'U')[0]}&background=7c3aed&color=fff`}
                  style={styles.avatar}
                  alt={collab.creator?.username}
                />
                <div>
                  <div style={styles.name}>
                    {collab.creator?.display_name || collab.creator?.username}
                    {collab.creator?.is_verified && <span style={styles.verified}>✓</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {collab.collaborator && (
                      <>with {collab.collaborator.display_name || collab.collaborator.username}</>
                    )}
                  </div>
                </div>
              </div>

              <h3 style={styles.titleText}>{collab.title}</h3>
              <p style={styles.description}>{collab.description}</p>

              <div style={styles.stats}>
                <span>📝 {collab.status || 'Open'}</span>
                <span>📅 {new Date(collab.created_at).toLocaleDateString()}</span>
              </div>

              {!isParticipant ? (
                <button
                  style={styles.joinBtn}
                  onClick={() => joinCollaboration(collab.id)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                >
                  Join Collaboration
                </button>
              ) : (
                <button style={styles.joinBtnDisabled}>
                  ✅ Already Joined
                </button>
              )}
            </div>
          )
        })}
      </div>

      {collaborations.length === 0 && !loading && (
        <div style={styles.card}>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🤝</div>
            <p>No collaborations yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              Find collaborators and start creating together!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}