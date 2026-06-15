// src/pages/MusicVideos.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import VideoPlayer from '../components/VideoPlayer'

export default function MusicVideos({ session }) {
  const [videos, setVideos] = useState([])
  const [myVideos, setMyVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const isVerified = session?.user?.user_metadata?.is_verified || false

  useEffect(() => {
    loadVideos()
    if (isVerified) {
      loadMyVideos()
    }
  }, [isVerified])

  async function loadVideos() {
    setLoading(true)
    let query = supabase
      .from('videos')
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
    
    if (activeFilter === 'verified') {
      query = query.eq('profiles.is_verified', true)
    } else if (activeFilter === 'popular') {
      query = query.order('views_count', { ascending: false })
    }
    
    const { data } = await query
    if (data) setVideos(data)
    setLoading(false)
  }

  async function loadMyVideos() {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    
    if (data) setMyVideos(data)
  }

  async function uploadVideo() {
    if (!title || !videoFile) {
      alert('Please provide a title and video file')
      return
    }

    setUploading(true)

    try {
      // Upload video file
      const videoExt = videoFile.name.split('.').pop()
      const videoFileName = `${session.user.id}_${Date.now()}.${videoExt}`
      const videoPath = `videos/${videoFileName}`
      
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoFile)
      
      if (videoError) throw videoError
      
      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(videoPath)

      // Upload thumbnail if provided
      let thumbnailUrl = null
      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split('.').pop()
        const thumbFileName = `${session.user.id}_thumb_${Date.now()}.${thumbExt}`
        const thumbPath = `thumbnails/${thumbFileName}`
        
        const { error: thumbError } = await supabase.storage
          .from('videos')
          .upload(thumbPath, thumbnailFile)
        
        if (!thumbError) {
          const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(thumbPath)
          thumbnailUrl = publicUrl
        }
      }

      // Save video metadata to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: session.user.id,
          title,
          description,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          youtube_url: youtubeUrl || null
        })

      if (dbError) throw dbError

      alert('Video uploaded successfully!')
      setTitle('')
      setDescription('')
      setVideoFile(null)
      setThumbnailFile(null)
      setYoutubeUrl('')
      setShowUpload(false)
      await loadVideos()
      await loadMyVideos()
    } catch (error) {
      alert('Error uploading video: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function deleteVideo(videoId) {
    if (confirm('Are you sure you want to delete this video?')) {
      await supabase.from('videos').delete().eq('id', videoId)
      await loadVideos()
      await loadMyVideos()
      alert('Video deleted')
    }
  }

  async function handleLike(videoId, currentLikes) {
    const { data: existingLike } = await supabase
      .from('video_likes')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('video_id', videoId)
      .single()
    
    if (existingLike) {
      await supabase
        .from('video_likes')
        .delete()
        .eq('user_id', session.user.id)
        .eq('video_id', videoId)
    } else {
      await supabase
        .from('video_likes')
        .insert({ user_id: session.user.id, video_id: videoId })
    }
    await loadVideos()
  }

  async function incrementView(videoId) {
    await supabase.rpc('increment_video_view', { video_id: videoId })
  }

  const filteredVideos = videos.filter(video => {
    if (searchQuery) {
      return video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             video.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             video.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  useEffect(() => {
    loadVideos()
  }, [activeFilter])

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>🎵 Music Videos</h1>
        
        {/* Search Bar */}
        <div className="search-box" style={{ width: '250px' }}>
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search videos..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Verification Notice */}
      <div className="card" style={{ background: '#1f1f1f', marginBottom: '20px', borderLeft: '4px solid #ff4444' }}>
        <p>
          🎤 Music Videos Section — Only available for verified artists, producers, and comedians.
          {!isVerified && (
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Go to Settings to request verification') }} style={{ color: '#ff4444', marginLeft: '8px', textDecoration: 'none' }}>
              Apply for verification →
            </a>
          )}
        </p>
      </div>
      
      {/* Filter Tabs */}
      <div className="tabs" style={{ marginBottom: '20px' }}>
        <div className={`tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
          All Videos
        </div>
        <div className={`tab ${activeFilter === 'verified' ? 'active' : ''}`} onClick={() => setActiveFilter('verified')}>
          Verified Only
        </div>
        <div className={`tab ${activeFilter === 'popular' ? 'active' : ''}`} onClick={() => setActiveFilter('popular')}>
          Most Popular
        </div>
        {isVerified && (
          <div className={`tab ${activeFilter === 'mine' ? 'active' : ''}`} onClick={() => setActiveFilter('mine')}>
            My Videos
          </div>
        )}
      </div>
      
      {/* Upload Section (Verified Only) */}
      {isVerified && (
        <>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowUpload(!showUpload)}
            style={{ marginBottom: '20px' }}
          >
            {showUpload ? 'Cancel' : '+ Upload New Music Video'}
          </button>
          
          {showUpload && (
            <div className="card" style={{ marginBottom: '30px' }}>
              <h3 style={{ marginBottom: '16px' }}>Upload Music Video</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Title *</label>
                <input
                  type="text"
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Description</label>
                <textarea
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your video..."
                  rows="3"
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Video File * (MP4, MOV, WebM)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="input"
                />
                {videoFile && (
                  <p style={{ fontSize: '0.7rem', color: '#4caf50', marginTop: '4px' }}>
                    ✓ Ready to upload: {videoFile.name}
                  </p>
                )}
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Thumbnail (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files[0])}
                  className="input"
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>YouTube URL (Optional)</label>
                <input
                  type="url"
                  className="input"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              
              <button 
                className="btn btn-primary" 
                onClick={uploadVideo}
                disabled={uploading}
                style={{ width: '100%' }}
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          )}
        </>
      )}
      
      {/* My Videos Section */}
      {activeFilter === 'mine' && myVideos.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Your Videos</h2>
          <div className="video-grid">
            {myVideos.map(video => (
              <div key={video.id} className="video-card" onClick={() => setSelectedVideo(video)}>
                <div className="video-thumbnail">
                  <img src={video.thumbnail_url || 'https://picsum.photos/400/225'} alt={video.title} />
                  <div className="play-overlay">▶️</div>
                </div>
                <div className="video-info">
                  <div className="video-title">{video.title}</div>
                  <div className="video-stats" style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: '#888', marginTop: '8px' }}>
                    <span>👁️ {video.views_count || 0}</span>
                    <span>👏 {video.applause_count || 0}</span>
                  </div>
                  <button 
                    className="btn btn-outline btn-small" 
                    style={{ marginTop: '8px', width: '100%', fontSize: '11px', padding: '4px' }}
                    onClick={(e) => { e.stopPropagation(); deleteVideo(video.id) }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* All Videos Grid */}
      {activeFilter !== 'mine' && (
        <>
          {loading ? (
            <div className="spinner"></div>
          ) : filteredVideos.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: '#888' }}>No music videos found. {isVerified ? 'Be the first to upload!' : 'Verified artists can upload videos.'}</p>
            </div>
          ) : (
            <div className="video-grid">
              {filteredVideos.map(video => (
                <div 
                  key={video.id} 
                  className="video-card"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="video-thumbnail">
                    <img 
                      src={video.thumbnail_url || 'https://picsum.photos/400/225'} 
                      alt={video.title}
                    />
                    <div className="play-overlay">▶️</div>
                    {video.profiles?.is_verified && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#1da1f2', borderRadius: '20px', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold' }}>
                        ✓ Verified
                      </div>
                    )}
                  </div>
                  <div className="video-info">
                    <div className="video-title">{video.title}</div>
                    <div className="video-artist">
                      {video.profiles?.display_name || video.profiles?.username}
                      {video.profiles?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                    </div>
                    <div className="video-stats" style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: '#888', marginTop: '8px' }}>
                      <span>👏 {video.applause_count || 0}</span>
                      <span>👁️ {video.views_count || 0}</span>
                      <span>💬 {video.comment_count || 0}</span>
                    </div>
                    {video.youtube_url && (
                      <button 
                        className="youtube-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(video.youtube_url, '_blank')
                        }}
                      >
                        <i className="fab fa-youtube"></i> Find on YouTube
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer 
          video={selectedVideo} 
          session={session}
          onClose={() => setSelectedVideo(null)}
          onUpdate={loadVideos}
          onLike={handleLike}
          onView={incrementView}
        />
      )}
    </div>
  )
}