import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import StoryCircle from '../components/StoryCircle'
import Layout from '../components/Layout'

export default function Home({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [stories, setStories] = useState([])

  useEffect(() => {
    loadPosts()
    loadStories()
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

  async function loadStories() {
    // Load friends with recent stories
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, is_verified')
      .neq('id', session.user.id)
      .limit(10)
    
    if (data) setStories(data)
  }

  async function createPost() {
    if (!newPostContent.trim() && !selectedImage) {
      alert('Please write something or add an image')
      return
    }
    
    let imageUrl = null
    if (selectedImage) {
      const fileExt = selectedImage.name.split('.').pop()
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`
      
      const { error } = await supabase.storage
        .from('post-images')
        .upload(filePath, selectedImage)
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath)
        imageUrl = publicUrl
      }
    }
    
    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: session.user.id,
        content: newPostContent,
        image_urls: imageUrl ? [imageUrl] : []
      })
    
    if (!error) {
      setNewPostContent('')
      setSelectedImage(null)
      setImagePreview(null)
      await loadPosts()
    }
  }

  return (
    <Layout session={session}>
      {/* Stories Row */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Your Story */}
          <StoryCircle 
            user={{ username: 'Your Story', avatar_url: session?.user?.user_metadata?.avatar_url }}
            onClick={() => alert('Create story - coming soon')}
          />
          {stories.map(user => (
            <StoryCircle 
              key={user.id} 
              user={user} 
              onClick={() => alert(`View ${user.display_name}'s story`)}
            />
          ))}
        </div>
      </div>
      
      {/* Create Post Card */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <img 
            src={session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=7c3aed&color=fff`}
            style={{ width: '48px', height: '48px', borderRadius: '50%' }}
            alt="avatar"
          />
          <textarea
            className="input-modern"
            rows="2"
            placeholder={`What's on your mind, ${session?.user?.user_metadata?.display_name || 'Creator'}?`}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            style={{ flex: 1, resize: 'none' }}
          />
        </div>
        
        {imagePreview && (
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <img src={imagePreview} style={{ maxWidth: '200px', borderRadius: '12px' }} alt="preview" />
            <button
              onClick={() => {
                setSelectedImage(null)
                setImagePreview(null)
              }}
              style={{
                position: 'absolute',
                top: '-8px',
                left: '192px',
                background: '#ef4444',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                border: 'none',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => document.getElementById('postImageInput').click()}
          >
            📷 Photo/Video
          </button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }}
            onClick={createPost}
          >
            Post
          </button>
          <input
            type="file"
            id="postImageInput"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                setSelectedImage(file)
                const reader = new FileReader()
                reader.onload = (e) => setImagePreview(e.target.result)
                reader.readAsDataURL(file)
              }
            }}
          />
        </div>
      </div>
      
      {/* Posts Feed */}
      {loading ? (
        <div className="spinner"></div>
      ) : posts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
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