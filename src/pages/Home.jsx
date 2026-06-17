// src/pages/Home.jsx - Updated with proper navigation
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

  // Mock data
  const mockStories = React.useMemo(() => [
    { id: 1, name: 'Sarah Chen', avatar: 'S', image: 'https://picsum.photos/400/700?random=1', time: '5 min ago', userId: 'user1' },
    { id: 2, name: 'Marcus Webb', avatar: 'M', image: 'https://picsum.photos/400/700?random=2', time: '15 min ago', userId: 'user2' },
    { id: 3, name: 'Elena Rodriguez', avatar: 'E', image: 'https://picsum.photos/400/700?random=3', time: '1 hour ago', userId: 'user3' },
    { id: 4, name: 'Alex Rivera', avatar: 'A', image: 'https://picsum.photos/400/700?random=4', time: '2 hours ago', userId: 'user4' },
  ], [])

  const mockReels = React.useMemo(() => [
    { id: 1, title: 'Epic Dance Move', creator: 'Emma Watson', avatar: 'E', views: '2.3M', likes: '45K', image: 'https://picsum.photos/400/700?random=10', userId: 'user5' },
    { id: 2, title: 'Comedy Sketch', creator: 'Mike Johnson', avatar: 'M', views: '1.1M', likes: '32K', image: 'https://picsum.photos/400/700?random=11', userId: 'user6' },
    { id: 3, title: 'Music Cover', creator: 'Lisa Wang', avatar: 'L', views: '890K', likes: '28K', image: 'https://picsum.photos/400/700?random=12', userId: 'user7' },
  ], [])

  const mockLiveStreams = React.useMemo(() => [
    { id: 1, title: 'Live Music Session', host: 'Sarah Chen', avatar: 'S', viewers: '3,456', image: 'https://picsum.photos/400/700?random=20', status: 'LIVE', userId: 'user1' },
    { id: 2, title: 'Gaming Marathon', host: 'Chris Thompson', avatar: 'C', viewers: '8,234', image: 'https://picsum.photos/400/700?random=21', status: 'LIVE', userId: 'user8' },
    { id: 3, title: 'Tech Talk', host: 'David Kim', avatar: 'D', viewers: '5,621', image: 'https://picsum.photos/400/700?random=22', status: 'LIVE', userId: 'user9' },
  ], [])

  // Load posts
  const loadPosts = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }
    
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
        if (error.code === '42P01') {
          setPosts([])
        }
      } else if (data) {
        setPosts(data)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  const loadStories = useCallback(() => {
    setStories(mockStories)
    setReels(mockReels)
    setLiveStreams(mockLiveStreams)
  }, [mockStories, mockReels, mockLiveStreams])

  useEffect(() => {
    if (session?.user?.id) {
      loadPosts()
      loadStories()
    } else {
      setLoading(false)
    }
  }, [session?.user?.id, loadPosts, loadStories])

  // Helper functions for navigation
  const openStories = (userId) => {
    navigate(`/stories/${userId}`)
  }

  const openReels = (userId) => {
    navigate(`/reels/${userId}`)
  }

  const openLive = (userId) => {
    navigate(`/live/${userId || ''}`)
  }

  const openRooms = () => {
    navigate('/rooms')
  }

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
      
      setNewPostContent('')
      setSelectedImage(null)
      setImagePreview(null)
      setPostLocation('')
      setPostTags('')
      setPostPrivacy('public')
      setShowCreatePost(false)
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
              onClick={() => openStories(story.userId)}
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
          <div className="story-card" onClick={() => navigate('/music')} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="story-avatar" style={{ fontSize: '30px' }}>+</div>
            <div className="story-preview">Create Reel</div>
          </div>
          {reels.map(reel => (
            <div 
              key={reel.id} 
              className="story-card" 
              style={{ backgroundImage: `url(${reel.image})` }}
              onClick={() => openReels(reel.userId)}
            >
              <div className="story-avatar">{reel.avatar}</div>
              <div className="story-preview" style={{ fontSize: '12px', lineHeight: '1.2' }}>
                {reel.title} ({reel.views})
              </div>
            </div>
          ))}
        </>
      )
    } else if (activeStoryTab === 'live') {
      return (
        <>
          <div className="story-card" onClick={() => openLive()} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="story-avatar" style={{ fontSize: '30px' }}>🔴</div>
            <div className="story-preview">Go Live</div>
          </div>
          <div className="story-card" onClick={openRooms} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <div className="story-avatar" style={{ fontSize: '30px' }}>🎙️</div>
            <div className="story-preview">Rooms</div>
          </div>
          {liveStreams.map(live => (
            <div 
              key={live.id} 
              className="story-card" 
              style={{ backgroundImage: `url(${live.image})` }}
              onClick={() => openLive(live.userId)}
            >
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

  const styles = {
    feedContainer: {
      maxWidth: '680px',
      margin: '0 auto',
      padding: '20px',
      width: '100%',
      background: '#f4f6fb',
      minHeight: '100vh'
    },
    storiesWrapper: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '20px',
      border: '1px solid #ddd'
    },
    storiesHeader: {
      display: 'flex',
      gap: '8px',
      marginBottom: '12px'
    },
    storyTab: {
      padding: '6px 16px',
      borderRadius: '30px',
      fontWeight: 'bold',
      fontSize: '13px',
      color: '#666',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    storyTabActive: {
      background: '#000',
      color: 'white'
    },
    storiesRow: {
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      padding: '4px 0'
    },
    storyCard: {
      minWidth: '110px',
      height: '180px',
      borderRadius: '16px',
      position: 'relative',
      cursor: 'pointer',
      overflow: 'hidden',
      border: '1px solid #ccc',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      transition: 'transform 0.2s'
    },
    storyAvatar: {
      position: 'absolute',
      top: '10px',
      left: '10px',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      border: '2px solid white',
      background: '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '14px'
    },
    storyPreview: {
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      right: '10px',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '12px',
      textShadow: '0 1px 3px rgba(0,0,0,0.5)'
    },
    createPostBox: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '20px',
      border: '1px solid #ddd',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    postInputRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      paddingBottom: '12px',
      borderBottom: '1px solid #eee'
    },
    postAvatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '18px',
      cursor: 'pointer',
      overflow: 'hidden',
      flexShrink: 0
    },
    postInput: {
      flex: 1,
      background: '#f0f2f5',
      borderRadius: '40px',
      padding: '12px 20px',
      color: '#333',
      fontSize: '14px',
      border: '1px solid #ddd',
      fontWeight: 'bold'
    },
    postActionsRow: {
      display: 'flex',
      justifyContent: 'space-around',
      marginTop: '12px'
    },
    postAction: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 20px',
      borderRadius: '40px',
      cursor: 'pointer',
      color: '#555',
      fontWeight: 'bold',
      fontSize: '13px',
      transition: 'all 0.2s'
    },
    postCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid #ddd',
      textAlign: 'center'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #7c3aed',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '40px auto'
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
      padding: '24px',
      maxWidth: '550px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto'
    }
  }

  return (
    <div style={styles.feedContainer}>
      {/* Stories Row */}
      <div style={styles.storiesWrapper}>
        <div style={styles.storiesHeader}>
          <div 
            style={{ ...styles.storyTab, ...(activeStoryTab === 'stories' ? styles.storyTabActive : {}) }}
            onClick={() => setActiveStoryTab('stories')}
          >
            Stories
          </div>
          <div 
            style={{ ...styles.storyTab, ...(activeStoryTab === 'reels' ? styles.storyTabActive : {}) }}
            onClick={() => setActiveStoryTab('reels')}
          >
            Reels
          </div>
          <div 
            style={{ ...styles.storyTab, ...(activeStoryTab === 'live' ? styles.storyTabActive : {}) }}
            onClick={() => setActiveStoryTab('live')}
          >
            Live
          </div>
          <div 
            style={styles.storyTab} 
            onClick={openRooms}
          >
            Rooms
          </div>
        </div>
        
        <div style={styles.storiesRow}>
          {renderStoriesContent()}
        </div>
      </div>

      {/* Create Post */}
      <div style={styles.createPostBox} onClick={() => setShowCreatePost(true)}>
        <div style={styles.postInputRow}>
          <div style={styles.postAvatar}>
            <img 
              src={getUserAvatar()} 
              alt="avatar" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <div style={styles.postInput}>
            What's on your mind, {getUserDisplayName()}?
          </div>
        </div>
        <div style={styles.postActionsRow}>
          <div style={styles.postAction} onClick={(e) => { e.stopPropagation(); openLive(); }} title="Go Live & Notify Friends">
            <i className="fas fa-circle" style={{ color: '#f5576c' }}></i> Live
          </div>
          <div style={styles.postAction} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <i className="fas fa-image"></i> Photo
          </div>
          <div style={styles.postAction} onClick={(e) => { e.stopPropagation(); alert('Upload music coming soon'); }}>
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
        <div style={styles.modal} onClick={() => setShowCreatePost(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Create Post</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ ...styles.postAvatar, width: '40px', height: '40px' }}>
                <img src={getUserAvatar()} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{getUserDisplayName()}</div>
                <select style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }} value={postPrivacy} onChange={(e) => setPostPrivacy(e.target.value)}>
                  <option value="public">🌍 Public</option>
                  <option value="friends">👥 Friends</option>
                  <option value="private">🔒 Only Me</option>
                </select>
              </div>
            </div>
            
            <textarea 
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', minHeight: '100px' }}
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
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '12px', marginBottom: '16px', fontSize: '14px' }}
                placeholder="Add location" 
                value={postLocation}
                onChange={(e) => setPostLocation(e.target.value)}
              />
              <input 
                style={{ width: '100%', padding: '12px 16px', border: '1px solid #ddd', borderRadius: '12px', fontSize: '14px' }}
                placeholder="Tags (comma separated)" 
                value={postTags}
                onChange={(e) => setPostTags(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button style={{ flex: 1, padding: '10px 24px', border: '1px solid #ddd', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => modalFileInputRef.current?.click()}>
                <i className="fas fa-image"></i> Photo
              </button>
              <button style={{ flex: 1, padding: '10px 24px', border: '1px solid #ddd', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => alert('Video upload coming soon')}>
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
            
            <button style={{ width: '100%', background: '#000', color: 'white', border: 'none', padding: '14px', borderRadius: '40px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }} onClick={createPost} disabled={creatingPost}>
              {creatingPost ? 'Posting...' : 'Post'}
            </button>
            <button 
              style={{ marginTop: '8px', width: '100%', padding: '14px', border: '1px solid #ddd', borderRadius: '40px', cursor: 'pointer', fontWeight: 'bold' }}
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
        <div style={styles.spinner}></div>
      ) : posts.length === 0 ? (
        <div style={styles.postCard}>
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