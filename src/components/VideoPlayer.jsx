// src/components/VideoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function VideoPlayer({ video, session, onClose, onUpdate, onLike, onView }) {
  const navigate = useNavigate()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(video.applause_count || 0)
  const [showReactions, setShowReactions] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef(null)
  const commentsEndRef = useRef(null)
  const progressBarRef = useRef(null)

  useEffect(() => {
    loadComments()
    checkLike()
    onView(video.id)
  }, [])

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  async function checkLike() {
    const { data } = await supabase
      .from('video_likes')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('video_id', video.id)
      .single()
    setHasLiked(!!data)
  }

  async function loadComments() {
    setLoadingComments(true)
    const { data } = await supabase
      .from('video_comments')
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
      .eq('video_id', video.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
    
    if (data) setComments(data)
    setLoadingComments(false)
  }

  async function submitComment() {
    if (!newComment.trim()) return
    
    const { error } = await supabase
      .from('video_comments')
      .insert({
        user_id: session.user.id,
        video_id: video.id,
        content: newComment
      })
    
    if (!error) {
      setNewComment('')
      await loadComments()
      await supabase
        .from('videos')
        .update({ comment_count: comments.length + 1 })
        .eq('id', video.id)
      onUpdate()
    }
  }

  async function handleLike() {
    if (hasLiked) {
      await supabase
        .from('video_likes')
        .delete()
        .eq('user_id', session.user.id)
        .eq('video_id', video.id)
      setLikesCount(prev => prev - 1)
      setHasLiked(false)
    } else {
      await supabase
        .from('video_likes')
        .insert({ user_id: session.user.id, video_id: video.id })
      setLikesCount(prev => prev + 1)
      setHasLiked(true)
    }
    onLike(video.id, likesCount)
  }

  async function handleReaction(emoji) {
    await supabase
      .from('video_reactions')
      .upsert({
        user_id: session.user.id,
        video_id: video.id,
        reaction: emoji
      }, { onConflict: 'user_id, video_id' })
    setShowReactions(false)
    onUpdate()
  }

  function handleVideoClick() {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  function handleFullscreen() {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  function handleTimeUpdate() {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const dur = videoRef.current.duration
      setProgress((current / dur) * 100)
      setDuration(dur)
    }
  }

  function handleVolumeChange(e) {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) {
      videoRef.current.volume = val
    }
  }

  function handleProgressClick(e) {
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    if (videoRef.current) {
      videoRef.current.currentTime = percentage * duration
    }
  }

  function formatTime(seconds) {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😠']

  return (
    <div className="modal" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-content" style={{ 
        maxWidth: '900px', 
        width: '95%', 
        background: '#0a0a0a',
        borderRadius: '24px',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <span className="close-modal" onClick={onClose} style={{ zIndex: 10 }}>&times;</span>
        
        {/* Video Player */}
        <div style={{ position: 'relative', background: '#000' }}>
          <video 
            ref={videoRef}
            controls={false}
            autoPlay 
            style={{ 
              width: '100%', 
              maxHeight: '60vh',
              display: 'block',
              cursor: 'pointer'
            }}
            src={video.video_url}
            onClick={handleVideoClick}
            onTimeUpdate={handleTimeUpdate}
          >
            Your browser does not support the video tag.
          </video>
          
          {/* Custom Controls Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            padding: '16px 20px 12px 20px',
            opacity: 0.7,
            transition: 'opacity 0.3s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}>
            
            {/* Progress Bar */}
            <div 
              ref={progressBarRef}
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '2px',
                marginBottom: '8px',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={handleProgressClick}
            >
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: '#7c3aed',
                borderRadius: '2px',
                transition: 'width 0.1s'
              }}></div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={handleVideoClick}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}
                >
                  <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
                </button>
                <span style={{ fontSize: '12px', color: '#ccc' }}>
                  {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume}
                  onChange={handleVolumeChange}
                  style={{ width: '60px', accentColor: '#7c3aed' }}
                />
                <button 
                  onClick={handleFullscreen}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '16px', cursor: 'pointer' }}
                >
                  <i className="fas fa-expand"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video Info */}
        <div style={{ padding: '20px 24px' }}>
          <h2 style={{ marginBottom: '8px', fontSize: '22px', color: '#fff' }}>{video.title}</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate(`/profile/${video.user_id}`)}>
              <img 
                src={video.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(video.profiles?.username || 'U')[0]}&background=000&color=fff`}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                alt="avatar"
              />
              <div>
                <div style={{ fontWeight: '600', color: '#fff' }}>
                  {video.profiles?.display_name || video.profiles?.username}
                  {video.profiles?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>{formatTimeAgo(video.created_at)}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button 
                  className={`action-btn ${hasLiked ? 'active' : ''}`} 
                  onClick={handleLike}
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
                  style={{ fontSize: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: '20px', color: hasLiked ? '#ef4444' : '#aaa' }}
                >
                  <i className={`fas fa-heart`}></i> {likesCount}
                </button>
                {showReactions && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '8px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 10
                  }}>
                    {reactions.map(emoji => (
                      <span 
                        key={emoji} 
                        style={{ fontSize: '24px', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onClick={() => handleReaction(emoji)}
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {video.youtube_url && (
                <button 
                  className="btn btn-outline btn-small"
                  onClick={() => window.open(video.youtube_url, '_blank')}
                  style={{ background: '#cc0000', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer' }}
                >
                  <i className="fab fa-youtube"></i> YouTube
                </button>
              )}
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer' }}
              >
                <i className="fas fa-share"></i> Share
              </button>
            </div>
          </div>
          
          {video.description && (
            <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6', fontSize: '14px' }}>{video.description}</p>
          )}
        </div>
        
        {/* Comments Section */}
        <div style={{ borderTop: '1px solid #2a2a2a', padding: '20px 24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', color: '#fff' }}>
            Comments ({video.comment_count || 0})
          </h3>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <textarea
              className="input"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="2"
              style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', color: '#fff', padding: '12px' }}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && submitComment()}
            />
            <button className="btn btn-primary btn-small" onClick={submitComment} style={{ alignSelf: 'flex-end' }}>
              Post
            </button>
          </div>
          
          {loadingComments && <div className="spinner" style={{ width: '30px', height: '30px' }}></div>}
          
          {comments.map(comment => (
            <div key={comment.id} className="comment" style={{ display: 'flex', gap: '12px', marginBottom: '16px', padding: '12px', background: '#1a1a1a', borderRadius: '12px' }}>
              <img 
                src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(comment.profiles?.username || 'U')[0]}&background=000&color=fff`} 
                className="comment-avatar" 
                alt="avatar"
                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${comment.user_id}`)}
              />
              <div className="comment-content" style={{ flex: 1 }}>
                <div className="comment-name" style={{ fontWeight: 'bold', color: '#fff', cursor: 'pointer' }} onClick={() => navigate(`/profile/${comment.user_id}`)}>
                  {comment.profiles?.display_name || comment.profiles?.username}
                  {comment.profiles?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                </div>
                <div className="comment-text" style={{ color: '#ccc', marginTop: '4px' }}>{comment.content}</div>
                <div className="comment-time" style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>{formatTimeAgo(comment.created_at)}</div>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && !loadingComments && (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No comments yet. Be the first!</p>
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>
    </div>
  )
}