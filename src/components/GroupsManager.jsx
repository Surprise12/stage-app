// src/components/GroupsManager.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function GroupsManager({ session }) {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [myGroups, setMyGroups] = useState([])
  const [pendingGroups, setPendingGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupPosts, setGroupPosts] = useState([])
  const [groupMembers, setGroupMembers] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('discover')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public',
    category: 'music',
    cover_image: '',
    rules: ''
  })
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')

  const categoryEmojis = {
    music: '🎵',
    comedy: '😂',
    art: '🎨',
    gaming: '🎮',
    tech: '💻',
    sports: '⚽',
    other: '👥'
  }

  const categoryColors = {
    music: '#7c3aed',
    comedy: '#f59e0b',
    art: '#ec4899',
    gaming: '#10b981',
    tech: '#3b82f6',
    sports: '#ef4444',
    other: '#6b7280'
  }

  useEffect(() => {
    loadGroups()
    loadMyGroups()
    loadPendingGroups()
  }, [])

  async function loadGroups() {
    setLoading(true)
    const { data } = await supabase
      .from('collectives')
      .select('*')
      .eq('is_private', false)
      .order('member_count', { ascending: false })
      .limit(30)
    
    if (data) setGroups(data)
    setLoading(false)
  }

  async function loadMyGroups() {
    const { data } = await supabase
      .from('collective_members')
      .select('collectives(*), role')
      .eq('user_id', session.user.id)
    
    if (data) {
      const groupsWithRole = data.map(item => ({
        ...item.collectives,
        user_role: item.role
      }))
      setMyGroups(groupsWithRole)
    }
  }

  async function loadPendingGroups() {
    // For private groups where user has requested to join
    const { data } = await supabase
      .from('collective_join_requests')
      .select('collectives(*)')
      .eq('user_id', session.user.id)
      .eq('status', 'pending')
    
    if (data) setPendingGroups(data.map(item => item.collectives))
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
        is_private: formData.privacy === 'private',
        category: formData.category,
        cover_image: formData.cover_image || null,
        rules: formData.rules || null
      })
      .select()
      .single()

    if (error) {
      alert('Error: ' + error.message)
    } else {
      await supabase
        .from('collective_members')
        .insert({ collective_id: data.id, user_id: session.user.id, role: 'admin' })
      
      alert('Group created successfully!')
      setShowCreateForm(false)
      setFormData({ name: '', description: '', privacy: 'public', category: 'music', cover_image: '', rules: '' })
      await loadGroups()
      await loadMyGroups()
    }
  }

  async function joinGroup(groupId, isPrivate) {
    if (isPrivate) {
      // Request to join private group
      const { error } = await supabase
        .from('collective_join_requests')
        .insert({
          collective_id: groupId,
          user_id: session.user.id,
          status: 'pending'
        })
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('Join request sent! The group admin will review your request.')
      }
    } else {
      // Direct join for public groups
      const { error } = await supabase
        .from('collective_members')
        .insert({ collective_id: groupId, user_id: session.user.id, role: 'member' })
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        // Update member count
        await supabase.rpc('increment_collective_members', { collective_id: groupId })
        alert('Joined group!')
        await loadGroups()
        await loadMyGroups()
      }
    }
  }

  async function leaveGroup(groupId) {
    if (confirm('Are you sure you want to leave this group?')) {
      await supabase
        .from('collective_members')
        .delete()
        .eq('collective_id', groupId)
        .eq('user_id', session.user.id)
      
      alert('Left group')
      await loadGroups()
      await loadMyGroups()
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null)
      }
    }
  }

  async function loadGroupPosts(groupId) {
    const { data } = await supabase
      .from('collective_posts')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('collective_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) setGroupPosts(data)
  }

  async function loadGroupMembers(groupId) {
    const { data } = await supabase
      .from('collective_members')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('collective_id', groupId)
      .limit(50)
    
    if (data) setGroupMembers(data)
  }

  async function createGroupPost() {
    if (!newPost.trim()) return
    
    const { error } = await supabase
      .from('collective_posts')
      .insert({
        collective_id: selectedGroup.id,
        user_id: session.user.id,
        content: newPost
      })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setNewPost('')
      await loadGroupPosts(selectedGroup.id)
    }
  }

  async function deleteGroupPost(postId) {
    if (confirm('Delete this post?')) {
      await supabase.from('collective_posts').delete().eq('id', postId)
      await loadGroupPosts(selectedGroup.id)
    }
  }

  async function openGroup(group) {
    setSelectedGroup(group)
    await loadGroupPosts(group.id)
    await loadGroupMembers(group.id)
  }

  function formatTimeAgo(date) {
    if (!date) return 'just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  const isMember = (groupId) => myGroups.some(g => g?.id === groupId)
  const isAdmin = (groupId) => myGroups.some(g => g?.id === groupId && g.user_role === 'admin')

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>👥 Groups</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box" style={{ width: '250px' }}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search groups..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            <i className="fas fa-plus"></i> Create Group
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '24px', borderBottom: '1px solid #2a2a2a' }}>
        <div className={`tab ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}>
          Discover Groups
        </div>
        <div className={`tab ${activeTab === 'my-groups' ? 'active' : ''}`} onClick={() => setActiveTab('my-groups')}>
          My Groups ({myGroups.length})
        </div>
        <div className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          Pending ({pendingGroups.length})
        </div>
      </div>

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Create New Group</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Group Name *" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
            />
            <textarea 
              className="input" 
              placeholder="Description" 
              rows="3" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
            <textarea 
              className="input" 
              placeholder="Group Rules (optional)" 
              rows="2" 
              value={formData.rules} 
              onChange={(e) => setFormData({...formData, rules: e.target.value})} 
            />
            <input 
              type="url" 
              className="input" 
              placeholder="Cover Image URL (optional)" 
              value={formData.cover_image} 
              onChange={(e) => setFormData({...formData, cover_image: e.target.value})} 
            />
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
      {activeTab === 'my-groups' && (
        <>
          {myGroups.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-users" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>You haven't joined any groups yet.</p>
              <button className="btn btn-primary btn-small" style={{ marginTop: '12px' }} onClick={() => setActiveTab('discover')}>
                Discover Groups
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {myGroups.map(group => group && (
                <div 
                  key={group.id} 
                  className="group-card" 
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => openGroup(group)}
                >
                  <div style={{ 
                    height: '100px', 
                    background: group.cover_image ? `url(${group.cover_image})` : `linear-gradient(135deg, ${categoryColors[group.category] || '#667eea'}, ${categoryColors[group.category] || '#764ba2'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '12px 12px 0 0',
                    margin: '-20px -20px 0 -20px',
                    padding: '20px',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '-25px', 
                      left: '20px',
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '50%', 
                      background: `linear-gradient(135deg, ${categoryColors[group.category] || '#667eea'}, ${categoryColors[group.category] || '#764ba2'})`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '24px',
                      border: '3px solid white'
                    }}>
                      {categoryEmojis[group.category] || '👥'}
                    </div>
                  </div>
                  <div style={{ marginTop: '35px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{group.name}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                          {group.is_private ? '🔒 Private' : '🌍 Public'} • {group.member_count || 0} members
                        </div>
                      </div>
                      {group.user_role === 'admin' && (
                        <span style={{ fontSize: '10px', background: '#ff9800', color: 'white', padding: '2px 6px', borderRadius: '12px' }}>Admin</span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#aaa', marginTop: '8px' }}>{group.description?.substring(0, 80)}</div>
                    <div style={{ marginTop: '12px' }}>
                      <button 
                        className="btn btn-outline btn-small" 
                        style={{ width: '100%' }}
                        onClick={(e) => { e.stopPropagation(); leaveGroup(group.id) }}
                      >
                        Leave Group
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <>
          {pendingGroups.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-clock" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No pending group join requests</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {pendingGroups.map(group => (
                <div key={group.id} className="group-card" style={{ opacity: 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `linear-gradient(135deg, ${categoryColors[group.category] || '#667eea'}, ${categoryColors[group.category] || '#764ba2'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {categoryEmojis[group.category] || '👥'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{group.name}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>🔒 Private • Awaiting approval</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>{group.description?.substring(0, 80)}</div>
                  <div className="request-card-actions">
                    <button className="request-card-btn delete" style={{ width: '100%' }}>Cancel Request</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Discover Groups Section */}
      {activeTab === 'discover' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredGroups.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No groups found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {filteredGroups.map(group => (
                <div key={group.id} className="group-card" style={{ transition: 'transform 0.2s' }}>
                  <div style={{ 
                    height: '100px', 
                    background: group.cover_image ? `url(${group.cover_image})` : `linear-gradient(135deg, ${categoryColors[group.category] || '#667eea'}, ${categoryColors[group.category] || '#764ba2'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '12px 12px 0 0',
                    margin: '-20px -20px 0 -20px',
                    padding: '20px',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: '-25px', 
                      left: '20px',
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '50%', 
                      background: `linear-gradient(135deg, ${categoryColors[group.category] || '#667eea'}, ${categoryColors[group.category] || '#764ba2'})`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '24px',
                      border: '3px solid white'
                    }}>
                      {categoryEmojis[group.category] || '👥'}
                    </div>
                  </div>
                  <div style={{ marginTop: '35px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{group.name}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>
                        {group.is_private ? '🔒 Private' : '🌍 Public'} • {group.member_count || 0} members
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#aaa', marginTop: '8px' }}>{group.description?.substring(0, 100)}</div>
                    <div style={{ marginTop: '12px' }}>
                      {isMember(group.id) ? (
                        <button className="btn btn-secondary btn-small" style={{ width: '100%' }} onClick={() => leaveGroup(group.id)}>
                          Leave
                        </button>
                      ) : (
                        <button className="btn btn-primary btn-small" style={{ width: '100%' }} onClick={() => joinGroup(group.id, group.is_private)}>
                          {group.is_private ? 'Request to Join' : 'Join Group'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Group Detail Modal */}
      {selectedGroup && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setSelectedGroup(null)}>
          <div className="modal-content" style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflowY: 'auto', background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setSelectedGroup(null)}>&times;</span>
            
            {/* Group Header */}
            <div style={{ 
              height: '150px', 
              background: selectedGroup.cover_image ? `url(${selectedGroup.cover_image})` : `linear-gradient(135deg, ${categoryColors[selectedGroup.category] || '#667eea'}, ${categoryColors[selectedGroup.category] || '#764ba2'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '16px',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute', 
                bottom: '-30px', 
                left: '20px',
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                background: `linear-gradient(135deg, ${categoryColors[selectedGroup.category] || '#667eea'}, ${categoryColors[selectedGroup.category] || '#764ba2'})`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '32px',
                border: '4px solid white'
              }}>
                {categoryEmojis[selectedGroup.category] || '👥'}
              </div>
            </div>
            
            <div style={{ marginTop: '40px', padding: '0 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '24px' }}>{selectedGroup.name}</h2>
                {isAdmin(selectedGroup.id) && <span className="badge-small" style={{ background: '#ff9800', color: 'white' }}>Admin</span>}
              </div>
              <p style={{ color: '#888', marginBottom: '16px' }}>
                {selectedGroup.member_count || 0} members • {selectedGroup.is_private ? '🔒 Private' : '🌍 Public'} • {selectedGroup.category}
              </p>
              <p style={{ marginBottom: '20px' }}>{selectedGroup.description}</p>
              
              {selectedGroup.rules && (
                <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                  <strong>📋 Group Rules</strong>
                  <p style={{ marginTop: '8px', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{selectedGroup.rules}</p>
                </div>
              )}
            </div>
            
            {/* Tabs */}
            <div className="profile-tabs" style={{ marginTop: '0', padding: '0 16px' }}>
              <div className={`profile-tab active`}>Posts</div>
              <div className={`profile-tab`}>Members ({groupMembers.length})</div>
              <div className={`profile-tab`}>About</div>
            </div>
            
            {/* Posts Tab */}
            <div className="profile-content-section active" style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  className="input"
                  placeholder={`Share something with ${selectedGroup.name}...`}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  rows="2"
                />
                <button 
                  className="btn btn-primary btn-small" 
                  style={{ marginTop: '8px' }}
                  onClick={createGroupPost}
                >
                  Post to Group
                </button>
              </div>
              
              {groupPosts.map(post => (
                <div key={post.id} className="post-card" style={{ padding: '12px', marginBottom: '12px' }}>
                  <div className="post-header" style={{ marginBottom: '8px' }}>
                    <div className="post-author">
                      <div className="post-author-avatar" style={{ width: '40px', height: '40px' }}>
                        <img src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(post.profiles?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt="" />
                      </div>
                      <div className="post-author-info">
                        <div className="post-author-name">
                          {post.profiles?.display_name || post.profiles?.username}
                          {post.profiles?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                        </div>
                        <div className="post-time">{formatTimeAgo(post.created_at)}</div>
                      </div>
                    </div>
                    {(post.user_id === session.user.id || isAdmin(selectedGroup.id)) && (
                      <button className="cover-btn" style={{ padding: '4px 8px' }} onClick={() => deleteGroupPost(post.id)}>Delete</button>
                    )}
                  </div>
                  <div className="post-content">{post.content}</div>
                  <div className="post-stats" style={{ padding: '8px 0' }}>
                    <span><i className="fas fa-heart"></i> 0</span>
                    <span><i className="fas fa-comment"></i> 0</span>
                  </div>
                </div>
              ))}
              
              {groupPosts.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                  No posts yet. Be the first to share!
                </p>
              )}
            </div>
            
            <button className="secondary-btn" style={{ margin: '16px', width: 'calc(100% - 32px)' }} onClick={() => setSelectedGroup(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}