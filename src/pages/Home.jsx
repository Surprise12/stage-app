// src/pages/Home.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'

export default function Home({ session }) {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [activeStoryTab, setActiveStoryTab] = useState('stories')
  const [stories, setStories] = useState([])
  const [reels, setReels] = useState([])
  const [liveStreams, setLiveStreams] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [postLocation, setPostLocation] = useState('')
  const [postTags, setPostTags] = useState('')
  const [postPrivacy, setPostPrivacy] = useState('public')
  const [creatingPost, setCreatingPost] = useState(false)
  const fileInputRef = useRef(null)
  const modalFileInputRef = useRef(null)

  console.log('🏠 Home component rendering with session:', session?.user?.email)

  // Mock data - memoized to prevent recreation
  const mockStories = React.useMemo(() => [
    { id: 1, name: 'Sarah Chen', avatar: 'S', image: 'https://picsum.photos/400/700?random=1', time: '5 min ago' },
    { id: 2, name: 'Marcus Webb', avatar: 'M', image: 'https://picsum.photos/400/700?random=2', time: '15 min ago' },
    { id: 3, name: 'Elena Rodriguez', avatar: 'E', image: 'https://picsum.photos/400/700?random=3', time: '1 hour ago' },
    { id: 4, name: 'Alex Rivera', avatar: 'A', image: 'https://picsum.photos/400/700?random=4', time: '2 hours ago' },
  ], [])

  const mockReels = React.useMemo(() => [
    { id: 1, title: 'Epic Dance Move', creator: 'Emma Watson', avatar: 'E', views: '2.3M', likes: '45K', image: 'https://picsum.photos/400/700?random=10' },
    { id: 2, title: 'Comedy Sketch', creator: 'Mike Johnson', avatar: 'M', views: '1.1M', likes: '32K', image: 'https://picsum.photos/400/700?random=11' },
    { id: 3, title: 'Music Cover', creator: 'Lisa Wang', avatar: 'L', views: '890K', likes: '28K', image: 'https://picsum.photos/400/700?random=12' },
  ], [])

  const mockLiveStreams = React.useMemo(() => [
    { id: 1, title: 'Live Music Session', host: 'Sarah Chen', avatar: 'S', viewers: '3,456', image: 'https://picsum.photos/400/700?random=20', status: 'LIVE' },
    { id: 2, title: 'Gaming Marathon', host: 'Chris Thompson', avatar: 'C', viewers: '8,234', image: 'https://picsum.photos/400/700?random=21', status: 'LIVE' },
    { id: 3, title: 'Tech Talk', host: 'David Kim', avatar: 'D', viewers: '5,621', image: 'https://picsum.photos/400/700?random=22', status: 'LIVE' },
  ], [])

  // Load posts with useCallback to prevent unnecessary re-renders
  const loadPosts = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('⚠️ No session user ID, skipping loadPosts')
      setLoading(false)
      return
    }
    
    console.log('📝 Loading posts for user:', session.user.id)
    setLoading(true)
    try {
      const { data, error } = await supabase
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
      
      if (error) {
        console.error('❌ Supabase error loading posts:', error)
        // If table doesn't exist, just show empty state
        if (error.code === '42P01') {
          console.log('📝 Posts table doesn\'t exist yet, showing empty state')
          setPosts([])
        }
      } else if (data) {
        console.log('📝 Posts loaded:', data.length)
        setPosts(data)
      }
    } catch (error) {
      console.error('❌ Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const loadStories = useCallback(() => {
    console.log('📚 Loading stories...')
    setStories(mockStories)
    setReels(mockReels)
    setLiveStreams(mockLiveStreams)
  }, [mockStories, mockReels, mockLiveStreams])

  useEffect(() => {
    console.log('🏠 Home useEffect triggered')
    if (session?.user?.id) {
      loadPosts()
      loadStories()
    } else {
      console.log('⚠️ No session, setting loading to false')
      setLoading(false)
    }
  }, [session?.user?.id, loadPosts, loadStories])

  async function uploadImage(file) {
    if (!file) return null
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
    const filePath = `${session.user.id}/${fileName}`
    
    try {
      const { error } = await supabase.storage
        .from('post-images')
        .upload(filePath, file)
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath)
      
      return publicUrl
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading image: ' + error.message)
      return null
    }
  }

  async function createPost() {
    if (!newPostContent.trim() && !selectedImage) {
      alert('Please write something or add an image')
      return
    }
    
    setCreatingPost(true)
    
    try {
      let imageUrl = null
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
        if (!imageUrl && selectedImage) {
          setCreatingPost(false)
          return
        }
      }
      
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: session.user.id,
          content: newPostContent.trim(),
          image_urls: imageUrl ? [imageUrl] : [],
          location: postLocation || null,
          tags: postTags ? postTags.split(',').map(t => t.trim()) : null,
          privacy: postPrivacy
        })
      
      if (error) throw error
      
      // Reset form
      setNewPostContent('')
      setSelectedImage(null)
      setImagePreview(null)
      setPostLocation('')
      setPostTags('')
      setPostPrivacy('public')
      setShowCreatePost(false)
      
      // Reload posts
      await loadPosts()
    } catch (error) {
      console.error('Create post error:', error)
      alert('Error creating post: ' + error.message)
    } finally {
      setCreatingPost(false)
    }
  }

  function handleImageSelect(e) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result)
      reader.readAsDataURL(file)
    }
  }

  function removeImage() {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (modalFileInputRef.current) modalFileInputRef.current.value = ''
  }

  function renderStoriesContent() {
    if (activeStoryTab === 'stories') {
      return (
        <>
          <div className="story-card" onClick={() => setShowCreatePost(true)}>
            <div className="story-avatar">+</div>
            <div className="story-preview">Your Story</div>
          </div>
          {stories.map(story => (
            <div 
              key={story.id} 
              className="story-card" 
              style={{ backgroundImage: `url(${story.image})` }}
              onClick={() => alert(`Viewing ${story.name}'s story`)}
            >
              <div className="story-avatar">{story.avatar}</div>
              <div className="story-preview">{story.name.split(' ')[0]}</div>
            </div>
          ))}
        </>
      )
    } else if (activeStoryTab === 'reels') {
      return (
        <>
          <div className="story-card" onClick={() => alert('Create Reel feature coming soon')} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="story-avatar" style={{ fontSize: '30px' }}>+</div>
            <div className="story-preview">Create Reel</div>
          </div>
          {reels.map(reel => (
            <div key={reel.id} className="story-card" style={{ backgroundImage: `url(${reel.image})` }} onClick={() => alert(`Playing reel: ${reel.title}`)}>
              <div className="story-avatar">{reel.avatar}</div>
              <div className="story-preview" style={{ fontSize: '12px', lineHeight: '1.2' }}>
                {reel.title} ({reel.views})
              </div>
            </div>
          ))}
        </>
      )
    } else {
      return (
        <>
          <div className="story-card" onClick={() => alert('Go Live feature coming soon')} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="story-avatar" style={{ fontSize: '30px' }}>🔴</div>
            <div className="story-preview">Go Live</div>
          </div>
          <div className="story-card" onClick={() => alert('Live Now')} style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' }}>
            <div className="story-avatar" style={{ fontSize: '30px' }}>📺</div>
            <div className="story-preview">Live Now</div>
          </div>
          {liveStreams.map(live => (
            <div key={live.id} className="story-card" style={{ backgroundImage: `url(${live.image})` }} onClick={() => navigate('/live')}>
              <div className="story-avatar" style={{ border: '3px solid red' }}>{live.avatar}</div>
              <div className="story-preview" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                <strong style={{ color: 'red' }}>LIVE</strong><br />
                {live.title} ({live.viewers})
              </div>
            </div>
          ))}
        </>
      )
    }
  }

  const getUserDisplayName = () => {
    return session?.user?.user_metadata?.display_name?.split(' ')[0] || 
           session?.user?.email?.split('@')[0] || 
           'User'
  }

  const getUserAvatar = () => {
    return session?.user?.user_metadata?.avatar_url || 
           `https://ui-avatars.com/api/?name=${(session?.user?.email?.[0] || 'U')}&background=7c3aed&color=fff`
  }

  return (
    <div className="feed-container">
      {/* Stories Row */}
      <div className="stories-wrapper">
        <div className="stories-header">
          <div 
            className={`story-tab ${activeStoryTab === 'stories' ? 'active' : ''}`} 
            onClick={() => setActiveStoryTab('stories')}
          >
            Stories
          </div>
          <div 
            className={`story-tab ${activeStoryTab === 'reels' ? 'active' : ''}`} 
            onClick={() => setActiveStoryTab('reels')}
          >
            Reels
          </div>
          <div 
            className={`story-tab ${activeStoryTab === 'live' ? 'active' : ''}`} 
            onClick={() => setActiveStoryTab('live')}
          >
            Live
          </div>
          <div className="story-tab" onClick={() => alert('Audio Rooms coming soon')}>Rooms</div>
        </div>
        
        <div className="stories-row">
          {renderStoriesContent()}
        </div>
      </div>

      {/* Create Post */}
      <div className="create-post-box" onClick={() => setShowCreatePost(true)}>
        <div className="post-input-row">
          <div className="post-avatar">
            <img 
              src={getUserAvatar()} 
              alt="avatar" 
            />
          </div>
          <div className="post-input">
            What's on your mind, {getUserDisplayName()}?
          </div>
        </div>
        <div className="post-actions-row">
          <div className="post-action" onClick={(e) => { e.stopPropagation(); alert('Go Live feature coming soon'); }} title="Go Live & Notify Friends">
            <i className="fas fa-circle" style={{ color: '#f5576c' }}></i> Live
          </div>
          <div className="post-action" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <i className="fas fa-image"></i> Photo
          </div>
          <div className="post-action" onClick={(e) => { e.stopPropagation(); alert('Upload music coming soon'); }}>
            <i className="fas fa-music"></i> Music
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handleImageSelect} 
        />
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="modal active" onClick={() => setShowCreatePost(false)}>
          <div className="modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Create Post</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div className="post-avatar" style={{ width: '40px', height: '40px' }}>
                <img src={getUserAvatar()} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{getUserDisplayName()}</div>
                <select className="form-select" style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }} value={postPrivacy} onChange={(e) => setPostPrivacy(e.target.value)}>
                  <option value="public">🌍 Public</option>
                  <option value="friends">👥 Friends</option>
                  <option value="private">🔒 Only Me</option>
                </select>
              </div>
            </div>
            
            <textarea 
              className="form-textarea" 
              placeholder="What's on your mind?" 
              rows="4"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            
            {imagePreview && (
              <div style={{ position: 'relative', marginBottom: '16px', display: 'inline-block' }}>
                <img src={imagePreview} style={{ maxWidth: '100%', borderRadius: '12px' }} alt="preview" />
                <button onClick={removeImage} style={{ position: 'absolute', top: '8px', right: '8px', background: '#ff4444', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: 'white', cursor: 'pointer' }}>×</button>
              </div>
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <input 
                className="form-input" 
                placeholder="Add location" 
                value={postLocation}
                onChange={(e) => setPostLocation(e.target.value)}
              />
              <input 
                className="form-input" 
                placeholder="Tags (comma separated)" 
                style={{ marginTop: '8px' }}
                value={postTags}
                onChange={(e) => setPostTags(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button className="secondary-btn" style={{ flex: 1 }} onClick={() => modalFileInputRef.current?.click()}>
                <i className="fas fa-image"></i> Photo
              </button>
              <button className="secondary-btn" style={{ flex: 1 }} onClick={() => alert('Video upload coming soon')}>
                <i className="fas fa-video"></i> Video
              </button>
              <input 
                type="file" 
                ref={modalFileInputRef}
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageSelect} 
              />
            </div>
            
            <button className="apply-btn" onClick={createPost} disabled={creatingPost}>
              {creatingPost ? 'Posting...' : 'Post'}
            </button>
            <button 
              className="secondary-btn" 
              style={{ marginTop: '8px', width: '100%' }} 
              onClick={() => {
                setShowCreatePost(false)
                setNewPostContent('')
                setSelectedImage(null)
                setImagePreview(null)
                setPostLocation('')
                setPostTags('')
                setPostPrivacy('public')
              }}
            >
              Cancel
            </button>
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
    </div>
  )
}