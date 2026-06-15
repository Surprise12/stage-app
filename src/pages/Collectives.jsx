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
    is_private: false
  })
  const [submitting, setSubmitting] = useState(false)
  const [groupPosts, setGroupPosts] = useState([])
  const [newPost, setNewPost] = useState('')

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
      .select('collective_id')
      .eq('user_id', session.user.id)
    
    if (memberCollectives && memberCollectives.length > 0) {
      const ids = memberCollectives.map(m => m.collective_id)
      const { data: joined } = await supabase
        .from('collectives')
        .select('*')
        .in('id', ids)
      
      if (joined) setMyCollectives(joined)
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
        is_private: formData.is_private
      })
      .select()
      .single()
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      // Auto-join as member
      await supabase
        .from('collective_members')
        .insert({
          collective_id: data.id,
          user_id: session.user.id,
          role: 'admin'
        })
      
      alert('Collective created!')
      setShowCreateForm(false)
      setFormData({ name: '', description: '', is_private: false })
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
      // Update member count
      await supabase.rpc('increment_collective_members', { collective_id: collectiveId })
      await loadCollectives()
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
          avatar_url
        )
      `)
      .eq('collective_id', collectiveId)
      .order('created_at', { ascending: false })
    
    if (data) setGroupPosts(data)
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

  async function selectCollective(collective) {
    setSelectedCollective(collective)
    await loadGroupPosts(collective.id)
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

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>👥 Collectives</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : '+ Create Collective'}
        </button>
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
                  <h4>{collective.name}</h4>
                  {collective.is_private && <span>🔒</span>}
                </div>
                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
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
      ) : (
        <div className="grid-3">
          {collectives.filter(c => !isMember(c.id)).map(collective => (
            <div key={collective.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>{collective.name}</h4>
                {collective.is_private && <span>🔒</span>}
              </div>
              <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
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
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', background: '#141414' }} onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setSelectedCollective(null)}>&times;</span>
            
            <h2 style={{ marginBottom: '8px' }}>{selectedCollective.name}</h2>
            <p style={{ color: '#888', marginBottom: '16px' }}>
              {selectedCollective.member_count || 0} members • {selectedCollective.is_private ? 'Private' : 'Public'}
            </p>
            <p style={{ marginBottom: '20px' }}>{selectedCollective.description}</p>
            
            <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '20px' }}>
              <h3 style={{ marginBottom: '16px' }}>Posts</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  className="input"
                  placeholder="Share something with your collective..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  rows="2"
                />
                <button 
                  className="btn btn-primary btn-small" 
                  style={{ marginTop: '8px' }}
                  onClick={createGroupPost}
                >
                  Post
                </button>
              </div>
              
              {groupPosts.map(post => (
                <div key={post.id} className="card" style={{ marginBottom: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <img 
                      src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(post.profiles?.username || 'U')[0]}&background=ff5f6d&color=fff`}
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      alt="avatar"
                    />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                        {post.profiles?.display_name || post.profiles?.username}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>
                        {formatTimeAgo(post.created_at)}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem' }}>{post.content}</p>
                </div>
              ))}
              
              {groupPosts.length === 0 && (
                <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                  No posts yet. Be the first to share!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}