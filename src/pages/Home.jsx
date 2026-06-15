// src/pages/Home.jsx (Updated to use Layout)
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import Layout from '../components/Layout'

export default function Home({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
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
      .order('created_at', { ascending: false })
    
    if (data) setPosts(data)
    setLoading(false)
  }

  async function createPost() {
    if (!newPostContent.trim()) return
    
    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: session.user.id,
        content: newPostContent
      })
    
    if (!error) {
      setNewPostContent('')
      setShowCreatePost(false)
      await loadPosts()
    }
  }

  return (
    <Layout session={session}>
      {/* Stories Row */}
      <div className="stories-wrapper">
        <div className="stories-header">
          <div className="story-tab active">Stories</div>
          <div className="story-tab">Reels</div>
          <div className="story-tab">Live</div>
        </div>
        <div className="stories-row">
          <div className="story-card" onClick={() => setShowCreatePost(true)}>
            <div className="story-avatar">+</div>
            <div className="story-preview">Your Story</div>
          </div>
        </div>
      </div>

      {/* Create Post */}
      <div className="create-post-box" onClick={() => setShowCreatePost(true)}>
        <div className="post-input-row">
          <div className="post-avatar">
            <img src={session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=7c3aed&color=fff`} alt="" />
          </div>
          <div className="post-input">What's on your mind?</div>
        </div>
        <div className="post-actions-row">
          <div className="post-action"><i className="fas fa-circle" style={{ color: '#f5576c' }}></i> Live</div>
          <div className="post-action"><i className="fas fa-image"></i> Photo</div>
          <div className="post-action"><i className="fas fa-music"></i> Music</div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="modal active" onClick={() => setShowCreatePost(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Create Post</div>
            <textarea 
              className="form-textarea" 
              placeholder="What's on your mind?" 
              rows="4"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            ></textarea>
            <button className="apply-btn" onClick={createPost}>Post</button>
            <button className="secondary-btn" style={{ marginTop: '8px', width: '100%' }} onClick={() => setShowCreatePost(false)}>Cancel</button>
          </div>
        </div>
      )}
      
      {/* Posts Feed */}
      {loading ? (
        <div className="spinner"></div>
      ) : posts.length === 0 ? (
        <div className="post-card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No posts yet. Be the first to post!</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            session={session} 
            onPostUpdate={loadPosts} 
          />
        ))
      )}
    </Layout>
  )
}