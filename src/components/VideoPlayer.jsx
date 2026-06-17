// src/components/VideoPlayer.jsx - UPDATED WITH INLINE STYLES
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
    try {
      const { data } = await supabase
        .from('video_likes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('video_id', video.id)
        .single()
      setHasLiked(!!data)
    } catch (error) {
      console.error('Error checking like:', error)
    }
  }

  async function loadComments() {
    setLoadingComments(true)
    try {
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
    } catch (error) {
      console.error('Error loading comments:', error)
    }
    setLoadingComments(false)
  }

  async function submitComment() {
    if (!newComment.trim()) return
    
    try {
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
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }

  async function handleLike() {
    try {
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
    } catch (error) {
      console.error('Error handling like:', error)
    }
  }

  async function handleReaction(emoji) {
    try {
      await supabase
        .from('video_reactions')
        .upsert({
          user_id: session.user.id,
          video_id: video.id,
          reaction: emoji
        }, { onConflict: 'user_id, video_id' })
      setShowReactions(false)
      onUpdate()
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
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

  const styles = {
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
      maxWidth: '900px',
      width: '95%',
      background: '#0a0a0a',
      borderRadius: '24px',
      overflow: 'hidden',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column'
    },
    closeBtn: {
      position: 'absolute',
      top: '16px',
      right: '20px',
      fontSize: '28px',
      cursor: 'pointer',
      color: 'white',
      zIndex: 10,
      background: 'rgba(0,0,0,0.5)',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none'
    },
    videoContainer: {
      position: 'relative',
      background: '#000'
    },
    video: {
      width: '100%',
      maxHeight: '60vh',
      display: 'block',
      cursor: 'pointer'
    },
    controlsOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
      padding: '16px 20px 12px 20px',
      opacity: 0.7,
      transition: 'opacity 0.3s',
      cursor: 'default'
    },
    progressBar: {
      width: '100%',
      height: '4px',
      background: 'rgba(255,255,255,0.3)',
      borderRadius: '2px',
      marginBottom: '8px',
      cursor: 'pointer',
      position: 'relative'
    },
    progressFill: {
      height: '100%',
      background: '#7c3aed',
      borderRadius: '2px',
      transition: 'width 0.1s'
    },
    controlsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    controlsLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    playBtn: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '4px'
    },
    timeDisplay: {
      fontSize: '12px',
      color: '#ccc'
    },
    controlsRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    volumeSlider: {
      width: '60px',
      accentColor: '#7c3aed',
      cursor: 'pointer'
    },
    fullscreenBtn: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '16px',
      cursor: 'pointer',
      padding: '4px'
    },
    infoSection: {
      padding: '20px 24px',
      overflowY: 'auto',
      flex: 1
    },
    videoTitle: {
      marginBottom: '8px',
      fontSize: '22px',
      color: '#fff',
      fontWeight: '700'
    },
    videoMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '16px'
    },
    creatorInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer'
    },
    creatorAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    creatorName: {
      fontWeight: '600',
      color: '#fff'
    },
    creatorVerified: {
      color: '#1da1f2',
      marginLeft: '4px'
    },
    creatorTime: {
      fontSize: '11px',
      color: '#888'
    },
    actionButtons: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    },
    likeBtn: {
      fontSize: '14px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px 12px',
      borderRadius: '20px',
      color: '#aaa',
      transition: 'all 0.2s'
    },
    likeBtnActive: {
      fontSize: '14px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px 12px',
      borderRadius: '20px',
      color: '#ef4444',
      transition: 'all 0.2s'
    },
    youtubeBtn: {
      background: '#cc0000',
      color: 'white',
      border: 'none',
      padding: '6px 14px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700'
    },
    shareBtn: {
      background: 'rgba(255,255,255,0.1)',
      color: 'white',
      border: 'none',
      padding: '6px 14px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700'
    },
    description: {
      color: '#ccc',
      marginBottom: '20px',
      lineHeight: '1.6',
      fontSize: '14px'
    },
    commentsSection: {
      borderTop: '1px solid #2a2a2a',
      padding: '20px 24px',
      maxHeight: '300px',
      overflowY: 'auto'
    },
    commentsTitle: {
      marginBottom: '16px',
      fontSize: '16px',
      color: '#fff',
      fontWeight: '700'
    },
    commentInputArea: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px'
    },
    commentTextarea: {
      flex: 1,
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: '12px',
      color: '#fff',
      padding: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      resize: 'vertical',
      minHeight: '60px',
      fontFamily: 'inherit'
    },
    postBtn: {
      padding: '8px 20px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      alignSelf: 'flex-end',
      transition: 'all 0.2s'
    },
    commentItem: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px',
      padding: '12px',
      background: '#1a1a1a',
      borderRadius: '12px'
    },
    commentAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      objectFit: 'cover',
      cursor: 'pointer',
      flexShrink: 0
    },
    commentContent: {
      flex: 1
    },
    commentName: {
      fontWeight: '700',
      color: '#fff',
      cursor: 'pointer'
    },
    commentText: {
      color: '#ccc',
      marginTop: '4px'
    },
    commentTime: {
      fontSize: '11px',
      color: '#888',
      marginTop: '4px'
    },
    emptyComments: {
      textAlign: 'center',
      color: '#888',
      padding: '20px'
    },
    reactionsPopup: {
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
    },
    reactionEmoji: {
      fontSize: '24px',
      cursor: 'pointer',
      transition: 'transform 0.2s'
    },
    spinner: {
      width: '30px',
      height: '30px',
      border: '3px solid rgba(124,58,237,0.2)',
      borderTop: '3px solid #7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '20px auto'
    }
  }

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button style={styles.closeBtn} onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        
        {/* Video Player */}
        <div style={styles.videoContainer}>
          <video 
            ref={videoRef}
            controls={false}
            autoPlay 
            style={styles.video}
            src={video.video_url}
            onClick={handleVideoClick}
            onTimeUpdate={handleTimeUpdate}
          >
            Your browser does not support the video tag.
          </video>
          
          {/* Custom Controls Overlay */}
          <div 
            style={styles.controlsOverlay}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            {/* Progress Bar */}
            <div 
              ref={progressBarRef}
              style={styles.progressBar}
              onClick={handleProgressClick}
            >
              <div style={{...styles.progressFill, width: `${progress}%`}}></div>
            </div>
            
            <div style={styles.controlsRow}>
              <div style={styles.controlsLeft}>
                <button style={styles.playBtn} onClick={handleVideoClick}>
                  <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
                </button>
                <span style={styles.timeDisplay}>
                  {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                </span>
              </div>
              <div style={styles.controlsRight}>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={volume}
                  onChange={handleVolumeChange}
                  style={styles.volumeSlider}
                />
                <button style={styles.fullscreenBtn} onClick={handleFullscreen}>
                  <i className="fas fa-expand"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video Info */}
        <div style={styles.infoSection}>
          <h2 style={styles.videoTitle}>{video.title}</h2>
          
          <div style={styles.videoMeta}>
            <div style={styles.creatorInfo} onClick={() => navigate(`/profile/${video.user_id}`)}>
              <img 
                src={video.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(video.profiles?.username || 'U')[0]}&background=000&color=fff`}
                style={styles.creatorAvatar}
                alt="avatar"
              />
              <div>
                <div style={styles.creatorName}>
                  {video.profiles?.display_name || video.profiles?.username}
                  {video.profiles?.is_verified && <span style={styles.creatorVerified}>✓</span>}
                </div>
                <div style={styles.creatorTime}>{formatTimeAgo(video.created_at)}</div>
              </div>
            </div>
            
            <div style={styles.actionButtons}>
              <div style={{ position: 'relative' }}>
                <button 
                  style={hasLiked ? styles.likeBtnActive : styles.likeBtn}
                  onClick={handleLike}
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
                >
                  <i className="fas fa-heart"></i> {likesCount}
                </button>
                {showReactions && (
                  <div style={styles.reactionsPopup}>
                    {reactions.map(emoji => (
                      <span 
                        key={emoji} 
                        style={styles.reactionEmoji}
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
                  style={styles.youtubeBtn}
                  onClick={() => window.open(video.youtube_url, '_blank')}
                >
                  <i className="fab fa-youtube"></i> YouTube
                </button>
              )}
              <button 
                style={styles.shareBtn}
                onClick={() => navigator.clipboard.writeText(window.location.href)}
              >
                <i className="fas fa-share"></i> Share
              </button>
            </div>
          </div>
          
          {video.description && (
            <p style={styles.description}>{video.description}</p>
          )}
        </div>
        
        {/* Comments Section */}
        <div style={styles.commentsSection}>
          <h3 style={styles.commentsTitle}>
            Comments ({video.comment_count || 0})
          </h3>
          
          <div style={styles.commentInputArea}>
            <textarea
              style={styles.commentTextarea}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="2"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && submitComment()}
            />
            <button 
              style={styles.postBtn}
              onClick={submitComment}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              Post
            </button>
          </div>
          
          {loadingComments && <div style={styles.spinner}></div>}
          
          {comments.map(comment => (
            <div key={comment.id} style={styles.commentItem}>
              <img 
                src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(comment.profiles?.username || 'U')[0]}&background=000&color=fff`} 
                style={styles.commentAvatar}
                alt="avatar"
                onClick={() => navigate(`/profile/${comment.user_id}`)}
              />
              <div style={styles.commentContent}>
                <div style={styles.commentName} onClick={() => navigate(`/profile/${comment.user_id}`)}>
                  {comment.profiles?.display_name || comment.profiles?.username}
                  {comment.profiles?.is_verified && <span style={styles.creatorVerified}>✓</span>}
                </div>
                <div style={styles.commentText}>{comment.content}</div>
                <div style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</div>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && !loadingComments && (
            <p style={styles.emptyComments}>No comments yet. Be the first!</p>
          )}
          <div ref={commentsEndRef} />
        </div>
      </div>
    </div>
  )
}