import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'

export default function Home({ session }) {
  const [posts, setPosts] = useState([])
  const [followingPosts, setFollowingPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [activeTab, setActiveTab] = useState('for-you')
  const [submitting, setSubmitting] = useState(false)

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
          is_verified,
          role
        )
      `)
      .order('created_at', { ascending: false })
    
    if (data) setPosts(data)
    setLoading(false)
  }

  async function loadFollowingPosts() {
    // Get users the current user follows
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id)
    
    if (following && following.length > 0) {
      const followingIds = following.map(f => f.following_id)
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url,
            is_verified,
            role
          )
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
      
      if (data) setFollowingPosts(data)
    } else {
      setFollowingPosts([])
    }
  }

  async function uploadImage(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
    const filePath = `${session.user.id}/${fileName}`
    
    const { error } = await supabase.storage
      .from('post-images')
      .upload(filePath, file)
    
    if (error) {
      alert('Error uploading image: ' + error.message)
      return null
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath)
    
    return publicUrl
  }

  async function handleCreatePost() {
    if (!newPostContent.trim() && !selectedImage) {
      alert('Please write something or add an image')
      return
    }
    
    setSubmitting(true)
    
    let imageUrl = null
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage)
    }
    
    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: session.user.id,
        content: newPostContent,
        image_urls: imageUrl ? [imageUrl] : []
      })
    
    if (error) {
      alert('Error creating post: ' + error.message)
    } else {
      setNewPostContent('')
      setSelectedImage(null)
      setImagePreview(null)
      await loadPosts()
    }
    
    setSubmitting(false)
  }

  function handleImageSelect(e) {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  function removeImage() {
    setSelectedImage(null)
    setImagePreview(null)
    document.getElementById('postImageInput').value = ''
  }

  // Determine which posts to show based on active tab
  const getFeedPosts = () => {
    if (activeTab === 'for-you') return posts
    if (activeTab === 'following') return followingPosts
    return posts.filter(p => p.user_id === session.user.id)
  }

  const feedPosts = getFeedPosts()

  return (
    <div className="container">
      {/* Tabs */}
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'for-you' ? 'active' : ''}`} 
          onClick={() => setActiveTab('for-you')}
        >
          For You
        </div>
        <div 
          className={`tab ${activeTab === 'following' ? 'active' : ''}`} 
          onClick={() => {
            setActiveTab('following')
            loadFollowingPosts()
          }}
        >
          Following
        </div>
        <div 
          className={`tab ${activeTab === 'my-posts' ? 'active' : ''}`} 
          onClick={() => setActiveTab('my-posts')}
        >
          My Posts
        </div>
      </div>
      
      {/* Create Post */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <textarea
          rows="3"
          placeholder="What's happening on your stage?"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          style={{
            width: '100%',
            padding: '16px',
            background: '#1f1f1f',
            border: '1px solid #333',
            borderRadius: '16px',
            color: 'white',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        
        {imagePreview && (
          <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
            <img src={imagePreview} style={{ maxWidth: '200px', borderRadius: '12px' }} alt="preview" />
            <button
              onClick={removeImage}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ff5f6d',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleCreatePost}
            disabled={submitting}
          >
            {submitting ? 'Posting...' : 'Post to Stage'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => document.getElementById('postImageInput').click()}
          >
            📷 Add Image (Lossless)
          </button>
          <input
            type="file"
            id="postImageInput"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
        </div>
        <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '8px' }}>
          ✨ Images keep original quality forever. Click "View Original" to see full resolution.
        </p>
      </div>
      
      {/* Posts Feed */}
      {loading ? (
        <div className="spinner"></div>
      ) : feedPosts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>
            {activeTab === 'following' 
              ? 'No posts from people you follow yet. Follow some users!' 
              : 'No posts yet. Be the first to post!'}
          </p>
        </div>
      ) : (
        feedPosts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            session={session} 
            onPostUpdate={async () => {
              await loadPosts()
              if (activeTab === 'following') await loadFollowingPosts()
            }} 
          />
        ))
      )}
    </div>
  )
}