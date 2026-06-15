import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import VideoPlayer from '../components/VideoPlayer'

export default function MusicVideos({ session }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState(null)

  const isVerified = session?.user?.user_metadata?.is_verified || false

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    setLoading(true)
    const { data } = await supabase
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
    
    if (data) setVideos(data)
    setLoading(false)
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
    } catch (error) {
      alert('Error uploading video: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleLike(videoId, currentLikes) {
    // Check if already liked
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

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '20px' }}>🎵 Music Videos</h1>
      
      {/* Verification Notice */}
      <div className="card" style={{ background: '#1f1f1f', marginBottom: '20px', borderLeft: '4px solid #ff5f6d' }}>
        <p>
          🎤 Music Videos Section — Only available for verified artists, producers, and comedians.
          {!isVerified && (
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Go to Settings to request verification') }} style={{ color: '#ff5f6d', marginLeft: '8px' }}>
              Apply for verification →
            </a>
          )}
        </p>
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
      
      {/* Videos Grid */}
      {loading ? (
        <div className="spinner"></div>
      ) : videos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>No music videos yet. Be the first to upload!</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map(video => (
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
              </div>
              <div className="video-info">
                <div className="video-title">{video.title}</div>
                <div className="video-artist">
                  {video.profiles?.display_name || video.profiles?.username}
                  {video.profiles?.is_verified && ' ✓'}
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
                    ▶️ Find on YouTube
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
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