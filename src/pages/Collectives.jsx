// src/pages/Collectives.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Collectives({ session }) {
  const [collectives, setCollectives] = useState([])
  const [myCollectives, setMyCollectives] = useState([])
  const [selectedCollective, setSelectedCollective] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false,
    category: 'music',
    avatar_emoji: '👥'
  })
  const [submitting, setSubmitting] = useState(false)
  const [groupPosts, setGroupPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [members, setMembers] = useState([])
  const [activeTab, setActiveTab] = useState('posts')
  const [searchQuery, setSearchQuery] = useState('')

  const categoryEmojis = {
    music: '🎵',
    comedy: '😂',
    art: '🎨',
    gaming: '🎮',
    tech: '💻',
    sports: '⚽',
    other: '👥'
  }

  useEffect(() => {
    loadCollectives()
  }, [])

  async function loadCollectives() {
    setLoading(true)
    
    // Load public collectives
    const { data: publicCollectives } = await supabase
      .from('collectives')
      .select('*')
      .eq('is_private', false)
      .order('member_count', { ascending: false })
      .limit(20)
    
    if (publicCollectives) setCollectives(publicCollectives)
    
    // Load user's joined collectives
    const { data: memberCollectives } = await supabase
      .from('collective_members')
      .select('collective_id, role')
      .eq('user_id', session.user.id)
    
    if (memberCollectives && memberCollectives.length > 0) {
      const ids = memberCollectives.map(m => m.collective_id)
      const { data: joined } = await supabase
        .from('collectives')
        .select('*')
        .in('id', ids)
      
      if (joined) {
        // Add role to each collective
        const joinedWithRole = joined.map(c => ({
          ...c,
          user_role: memberCollectives.find(m => m.collective_id === c.id)?.role
        }))
        setMyCollectives(joinedWithRole)
      }
    }
    
    setLoading(false)
  }

  async function createCollective() {
    if (!formData.name.trim()) {
      alert('Please enter a name for your collective')
      return
    }
    
    setSubmitting(true)
    
    const { data, error } = await supabase
      .from('collectives')
      .insert({
        name: formData.name,
        description: formData.description,
        owner_id: session.user.id,
        is_private: formData.is_private,
        category: formData.category,
        avatar_url: categoryEmojis[formData.category] || '👥'
      })
      .select()
      .single()
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      // Auto-join as admin
      await supabase
        .from('collective_members')
        .insert({
          collective_id: data.id,
          user_id: session.user.id,
          role: 'admin'
        })
      
      alert('Collective created!')
      setShowCreateForm(false)
      setFormData({ name: '', description: '', is_private: false, category: 'music', avatar_emoji: '👥' })
      await loadCollectives()
    }
    
    setSubmitting(false)
  }

  async function joinCollective(collectiveId) {
    const { error } = await supabase
      .from('collective_members')
      .insert({
        collective_id: collectiveId,
        user_id: session.user.id,
        role: 'member'
      })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      await supabase.rpc('increment_collective_members', { collective_id: collectiveId })
      await loadCollectives()
      alert('Joined collective!')
    }
  }

  async function leaveCollective(collectiveId) {
    if (confirm('Are you sure you want to leave this collective?')) {
      await supabase
        .from('collective_members')
        .delete()
        .eq('collective_id', collectiveId)
        .eq('user_id', session.user.id)
      
      await loadCollectives()
      if (selectedCollective?.id === collectiveId) {
        setSelectedCollective(null)
      }
      alert('Left collective')
    }
  }

  async function loadGroupPosts(collectiveId) {
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
      .eq('collective_id', collectiveId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) setGroupPosts(data)
  }

  async function loadMembers(collectiveId) {
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
      .eq('collective_id', collectiveId)
      .limit(50)
    
    if (data) setMembers(data)
  }

  async function createGroupPost() {
    if (!newPost.trim()) return
    
    const { error } = await supabase
      .from('collective_posts')
      .insert({
        collective_id: selectedCollective.id,
        user_id: session.user.id,
        content: newPost
      })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setNewPost('')
      await loadGroupPosts(selectedCollective.id)
    }
  }

  async function deleteGroupPost(postId) {
    if (confirm('Delete this post?')) {
      await supabase.from('collective_posts').delete().eq('id', postId)
      await loadGroupPosts(selectedCollective.id)
    }
  }

  async function selectCollective(collective) {
    setSelectedCollective(collective)
    await loadGroupPosts(collective.id)
    await loadMembers(collective.id)
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

  const isMember = (collectiveId) => {
    return myCollectives.some(c => c.id === collectiveId)
  }

  const filteredCollectives = collectives.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>👥 Collectives</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box" style={{ width: '250px' }}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search collectives..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : '+ Create Collective'}
          </button>
        </div>
      </div>
      
      {/* Create Collective Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>Create a New Collective</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Name *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Hip Hop Producers United"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Description</label>
            <textarea
              className="input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this collective about?"
              rows="3"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Category</label>
            <select 
              className="input" 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="music">🎵 Music</option>
              <option value="comedy">😂 Comedy</option>
              <option value="art">🎨 Art</option>
              <option value="gaming">🎮 Gaming</option>
              <option value="tech">💻 Technology</option>
              <option value="sports">⚽ Sports</option>
              <option value="other">👥 Other</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.is_private}
                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
              /> Private Collective (members must be invited)
            </label>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={createCollective} 
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Creating...' : 'Create Collective'}
          </button>
        </div>
      )}
      
      {/* My Collectives Section */}
      {myCollectives.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Your Collectives</h2>
          <div className="grid-3">
            {myCollectives.map(collective => (
              <div 
                key={collective.id} 
                className="card" 
                style={{ cursor: 'pointer' }}
                onClick={() => selectCollective(collective)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="group-avatar" style={{ width: '48px', height: '48px', fontSize: '24px', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                      {collective.avatar_url || categoryEmojis[collective.category] || '👥'}
                    </div>
                    <div>
                      <h4>{collective.name}</h4>
                      {collective.user_role === 'admin' && <span style={{ fontSize: '10px', color: '#ff9800' }}>Admin</span>}
                    </div>
                  </div>
                  {collective.is_private && <span>🔒</span>}
                </div>
                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '8px' }}>
                  {collective.member_count || 0} members
                </p>
                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                  {collective.description?.substring(0, 80)}
                </p>
                <button 
                  className="btn btn-outline btn-small" 
                  style={{ marginTop: '12px' }}
                  onClick={(e) => { e.stopPropagation(); leaveCollective(collective.id) }}
                >
                  Leave
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available Collectives Section */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Discover Collectives</h2>
      
      {loading ? (
        <div className="spinner"></div>
      ) : filteredCollectives.filter(c => !isMember(c.id)).length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <i className="fas fa-users" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
          <p style={{ color: '#888' }}>No collectives found</p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredCollectives.filter(c => !isMember(c.id)).map(collective => (
            <div key={collective.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="group-avatar" style={{ width: '48px', height: '48px', fontSize: '24px', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    {collective.avatar_url || categoryEmojis[collective.category] || '👥'}
                  </div>
                  <div>
                    <h4>{collective.name}</h4>
                    <span style={{ fontSize: '10px', color: '#888' }}>{collective.category}</span>
                  </div>
                </div>
                {collective.is_private && <span>🔒</span>}
              </div>
              <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '8px' }}>
                {collective.member_count || 0} members
              </p>
              <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                {collective.description?.substring(0, 80)}
              </p>
              <button 
                className="btn btn-primary btn-small" 
                style={{ marginTop: '12px', width: '100%' }}
                onClick={() => joinCollective(collective.id)}
              >
                Join Collective
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Collective Detail View Modal */}
      {selectedCollective && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setSelectedCollective(null)}>
          <div className="modal-content" style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflowY: 'auto', background: 'white' }} onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setSelectedCollective(null)}>&times;</span>
            
            {/* Collective Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div className="group-avatar" style={{ width: '80px', height: '80px', fontSize: '40px', margin: '0 auto 12px', background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                {selectedCollective.avatar_url || categoryEmojis[selectedCollective.category] || '👥'}
              </div>
              <h2>{selectedCollective.name}</h2>
              <p style={{ color: '#888', marginBottom: '8px' }}>
                {selectedCollective.member_count || 0} members • {selectedCollective.is_private ? '🔒 Private' : '🌍 Public'} • {selectedCollective.category}
              </p>
              <p>{selectedCollective.description}</p>
            </div>
            
            {/* Tabs */}
            <div className="profile-tabs" style={{ marginTop: '0' }}>
              <div className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                Posts ({groupPosts.length})
              </div>
              <div className={`profile-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
                Members ({members.length})
              </div>
              <div className={`profile-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
                About
              </div>
            </div>
            
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="profile-content-section active" style={{ padding: '20px 0' }}>
                <div style={{ marginBottom: '16px' }}>
                  <textarea
                    className="input"
                    placeholder={`Share something with ${selectedCollective.name}...`}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows="2"
                  />
                  <button 
                    className="btn btn-primary btn-small" 
                    style={{ marginTop: '8px' }}
                    onClick={createGroupPost}
                  >
                    Post to Collective
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
                            {post.profiles?.is_verified && <span style={{ color: '#1da1f2' }}>✓</span>}
                          </div>
                          <div className="post-time">{formatTimeAgo(post.created_at)}</div>
                        </div>
                      </div>
                      {post.user_id === session.user.id && (
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
            )}
            
            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="profile-content-section active" style={{ padding: '20px 0' }}>
                <div className="friends-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {members.map(member => (
                    <div key={member.id} className="friend-card" onClick={() => window.location.href = `/profile/${member.user_id}`}>
                      <div className="friend-avatar" style={{ width: '60px', height: '60px' }}>
                        <img src={member.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(member.profiles?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt="" />
                      </div>
                      <div className="friend-name">{member.profiles?.display_name || member.profiles?.username}</div>
                      {member.role === 'admin' && <span style={{ fontSize: '10px', color: '#ff9800' }}>Admin</span>}
                      {member.profiles?.is_verified && <span style={{ fontSize: '10px', color: '#1da1f2' }}>✓ Verified</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="profile-content-section active" style={{ padding: '20px 0' }}>
                <div className="about-grid">
                  <div>
                    <div className="about-item">
                      <div className="about-label">Created</div>
                      <div className="about-value">{new Date(selectedCollective.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="about-item">
                      <div className="about-label">Owner</div>
                      <div className="about-value">{selectedCollective.owner_id === session.user.id ? 'You' : 'Another member'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="about-item">
                      <div className="about-label">Privacy</div>
                      <div className="about-value">{selectedCollective.is_private ? '🔒 Private' : '🌍 Public'}</div>
                    </div>
                    <div className="about-item">
                      <div className="about-label">Category</div>
                      <div className="about-value">{selectedCollective.category}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button className="secondary-btn" style={{ marginTop: '16px', width: '100%' }} onClick={() => setSelectedCollective(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}