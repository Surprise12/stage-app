import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function GroupsManager({ session }) {
  const [groups, setGroups] = useState([])
  const [myGroups, setMyGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public',
    category: 'music'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroups()
    loadMyGroups()
  }, [])

  async function loadGroups() {
    setLoading(true)
    const { data } = await supabase
      .from('collectives')
      .select('*')
      .eq('is_private', false)
      .order('member_count', { ascending: false })
      .limit(20)
    
    if (data) setGroups(data)
    setLoading(false)
  }

  async function loadMyGroups() {
    const { data } = await supabase
      .from('collective_members')
      .select('collectives(*)')
      .eq('user_id', session.user.id)
    
    if (data) setMyGroups(data.map(d => d.collectives))
  }

  async function createGroup() {
    if (!formData.name) {
      alert('Please enter a group name')
      return
    }

    const { data, error } = await supabase
      .from('collectives')
      .insert({
        name: formData.name,
        description: formData.description,
        owner_id: session.user.id,
        is_private: formData.privacy === 'private'
      })
      .select()
      .single()

    if (error) {
      alert('Error: ' + error.message)
    } else {
      // Auto-join as admin
      await supabase
        .from('collective_members')
        .insert({ collective_id: data.id, user_id: session.user.id, role: 'admin' })
      
      alert('Group created!')
      setShowCreateForm(false)
      setFormData({ name: '', description: '', privacy: 'public', category: 'music' })
      await loadGroups()
      await loadMyGroups()
    }
  }

  async function joinGroup(groupId) {
    const { error } = await supabase
      .from('collective_members')
      .insert({ collective_id: groupId, user_id: session.user.id })
    
    if (error) alert('Error: ' + error.message)
    else {
      alert('Joined group!')
      await loadGroups()
      await loadMyGroups()
    }
  }

  async function leaveGroup(groupId) {
    await supabase
      .from('collective_members')
      .delete()
      .eq('collective_id', groupId)
      .eq('user_id', session.user.id)
    
    alert('Left group')
    await loadGroups()
    await loadMyGroups()
  }

  const categoryEmojis = {
    music: '🎵',
    comedy: '😂',
    art: '🎨',
    gaming: '🎮',
    tech: '💻',
    sports: '⚽',
    other: '👥'
  }

  const isMember = (groupId) => myGroups.some(g => g?.id === groupId)

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div className="groups-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>👥 Groups</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          + Create Group
        </button>
      </div>

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Create New Group</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input type="text" className="input" placeholder="Group Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <textarea className="input" placeholder="Description" rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select className="input" value={formData.privacy} onChange={(e) => setFormData({...formData, privacy: e.target.value})}>
                <option value="public">🌍 Public Group</option>
                <option value="private">🔒 Private Group</option>
              </select>
              <select className="input" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                <option value="music">🎵 Music</option>
                <option value="comedy">😂 Comedy</option>
                <option value="art">🎨 Art</option>
                <option value="gaming">🎮 Gaming</option>
                <option value="tech">💻 Technology</option>
                <option value="sports">⚽ Sports</option>
                <option value="other">👥 Other</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={createGroup}>Create Group</button>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* My Groups Section */}
      {myGroups.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Your Groups</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {myGroups.map(group => group && (
              <div key={group.id} className="group-card" style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #ddd', cursor: 'pointer' }} onClick={() => setSelectedGroup(group)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{categoryEmojis[group.category] || '👥'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{group.name}</div>
                    <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>{group.privacy === 'private' ? '🔒 Private' : '🌍 Public'}</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', fontWeight: 'bold' }}>{group.description?.substring(0, 80)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>{group.member_count || 0} members</span>
                  <button className="btn btn-outline btn-small" onClick={(e) => { e.stopPropagation(); leaveGroup(group.id) }}>Leave</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discover Groups Section */}
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Discover Groups</h2>
      
      {loading ? (
        <div className="spinner"></div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No groups available. Create one!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {groups.map(group => (
            <div key={group.id} className="group-card" style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #ddd' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{categoryEmojis[group.category] || '👥'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{group.name}</div>
                  <div style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>{group.privacy === 'private' ? '🔒 Private' : '🌍 Public'}</div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', fontWeight: 'bold' }}>{group.description?.substring(0, 80)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#888', fontWeight: 'bold' }}>{group.member_count || 0} members</span>
                <span style={{ fontSize: '11px', color: '#667eea', fontWeight: 'bold' }}>Active group</span>
              </div>
              {isMember(group.id) ? (
                <button className="btn btn-secondary btn-small" style={{ width: '100%' }} onClick={() => leaveGroup(group.id)}>Leave</button>
              ) : (
                <button className="btn btn-primary btn-small" style={{ width: '100%' }} onClick={() => joinGroup(group.id)}>Join Group</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}