// src/pages/Groups.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Groups({ session }) {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [joinedGroups, setJoinedGroups] = useState([])
  const [suggestedGroups, setSuggestedGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', description: '', category: '', privacy: 'public' })

  useEffect(() => {
    loadGroups()
    loadJoinedGroups()
    loadSuggestedGroups()
  }, [])

  async function loadGroups() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('groups')
        .select('*')
        .order('members_count', { ascending: false })
        .limit(20)
      if (data) setGroups(data)
    } catch (error) {
      console.error('Error loading groups:', error)
    }
    setLoading(false)
  }

  async function loadJoinedGroups() {
    try {
      const { data } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', session.user.id)
      if (data) {
        const ids = data.map(m => m.group_id)
        setJoinedGroups(ids)
      }
    } catch (error) {
      console.error('Error loading joined groups:', error)
    }
  }

  async function loadSuggestedGroups() {
    // In production, use AI to suggest groups based on user's interests
    setSuggestedGroups([
      { id: 1, name: 'Music Producers', description: 'For music producers', category: 'Music', members: 1234 },
      { id: 2, name: 'Live Performance Tips', description: 'Tips for live performances', category: 'Performance', members: 567 },
    ])
  }

  async function joinGroup(groupId) {
    try {
      await supabase
        .from('group_members')
        .insert({ user_id: session.user.id, group_id: groupId })
      setJoinedGroups([...joinedGroups, groupId])
      loadGroups()
    } catch (error) {
      console.error('Error joining group:', error)
    }
  }

  async function leaveGroup(groupId) {
    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('user_id', session.user.id)
        .eq('group_id', groupId)
      setJoinedGroups(joinedGroups.filter(id => id !== groupId))
      loadGroups()
    } catch (error) {
      console.error('Error leaving group:', error)
    }
  }

  async function createGroup() {
    if (!newGroup.name) return
    try {
      const { data } = await supabase
        .from('groups')
        .insert({
          ...newGroup,
          creator_id: session.user.id,
          members_count: 1
        })
        .select()
        .single()
      if (data) {
        setGroups([data, ...groups])
        setJoinedGroups([...joinedGroups, data.id])
        setShowCreateGroup(false)
        setNewGroup({ name: '', description: '', category: '', privacy: 'public' })
      }
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937'
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
      transition: 'all 0.2s'
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      borderBottom: '2px solid #e5e7eb',
      paddingBottom: '8px'
    },
    tab: {
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      color: '#6b7280',
      transition: 'all 0.2s'
    },
    tabActive: {
      background: '#7c3aed',
      color: 'white'
    },
    groupCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid #e5e7eb'
    },
    groupHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start'
    },
    groupName: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937'
    },
    groupCategory: {
      fontSize: '12px',
      color: '#6b7280',
      fontWeight: '700',
      background: '#f3f4f6',
      padding: '2px 12px',
      borderRadius: '20px'
    },
    groupDescription: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700',
      marginTop: '4px'
    },
    groupStats: {
      display: 'flex',
      gap: '16px',
      marginTop: '12px',
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    groupActions: {
      marginTop: '12px',
      display: 'flex',
      gap: '8px'
    },
    joinBtn: {
      padding: '8px 20px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    leaveBtn: {
      padding: '8px 20px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    joinedBadge: {
      padding: '8px 20px',
      background: '#f3f4f6',
      color: '#6b7280',
      borderRadius: '20px',
      fontSize: '12px',
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
      padding: '32px',
      maxWidth: '500px',
      width: '90%'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '20px'
    },
    formInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none'
    },
    formTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    formSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      background: 'white'
    },
    formBtn: {
      width: '100%',
      padding: '14px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px'
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
      marginTop: '8px'
    }
  }

  if (loading) {
    return <div className="spinner" style={{ marginTop: '40px' }}></div>
  }

  // Filter groups based on active tab
  const filteredGroups = activeTab === 'all' ? groups :
    activeTab === 'joined' ? groups.filter(g => joinedGroups.includes(g.id)) :
    groups.filter(g => !joinedGroups.includes(g.id))

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>👥 Groups</div>
        <button 
          style={styles.createBtn}
          onClick={() => setShowCreateGroup(true)}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
        >
          <i className="fas fa-plus"></i> Create Group
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <div 
          style={{...styles.tab, ...(activeTab === 'all' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('all')}
        >
          All Groups
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'joined' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('joined')}
        >
          My Groups
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'suggested' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('suggested')}
        >
          Suggested
        </div>
      </div>

      {/* Groups List */}
      {filteredGroups.map(group => (
        <div 
          key={group.id} 
          style={styles.groupCard}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <div style={styles.groupHeader}>
            <div>
              <div style={styles.groupName}>{group.name}</div>
              <div style={styles.groupDescription}>{group.description}</div>
            </div>
            <span style={styles.groupCategory}>{group.category || 'General'}</span>
          </div>
          
          <div style={styles.groupStats}>
            <span>👥 {group.members_count || 0} members</span>
            <span>{group.privacy === 'public' ? '🌍 Public' : '🔒 Private'}</span>
          </div>
          
          <div style={styles.groupActions}>
            {joinedGroups.includes(group.id) ? (
              <>
                <button 
                  style={styles.joinBtn}
                  onClick={(e) => { e.stopPropagation(); navigate(`/groups/${group.id}`) }}
                >
                  View Group
                </button>
                <button 
                  style={styles.leaveBtn}
                  onClick={(e) => { e.stopPropagation(); leaveGroup(group.id) }}
                >
                  Leave
                </button>
              </>
            ) : (
              <button 
                style={styles.joinBtn}
                onClick={(e) => { e.stopPropagation(); joinGroup(group.id) }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
              >
                Join Group
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div style={styles.modal} onClick={() => setShowCreateGroup(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Create a Group</div>
            <input 
              style={styles.formInput}
              placeholder="Group name"
              value={newGroup.name}
              onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
            />
            <textarea 
              style={styles.formTextarea}
              placeholder="Description"
              value={newGroup.description}
              onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
            />
            <input 
              style={styles.formInput}
              placeholder="Category (e.g., Music, Art, Tech)"
              value={newGroup.category}
              onChange={(e) => setNewGroup({...newGroup, category: e.target.value})}
            />
            <select 
              style={styles.formSelect}
              value={newGroup.privacy}
              onChange={(e) => setNewGroup({...newGroup, privacy: e.target.value})}
            >
              <option value="public">🌍 Public</option>
              <option value="private">🔒 Private</option>
            </select>
            <button style={styles.formBtn} onClick={createGroup}>Create Group</button>
            <button style={styles.cancelBtn} onClick={() => setShowCreateGroup(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}