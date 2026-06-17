// src/components/ReelsViewer.jsx - UPDATED WITH MORE FEATURES
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ReelsViewer({ session }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [reels, setReels] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comment, setComment] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [saved, setSaved] = useState(false)
  const [following, setFollowing] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    loadReels()
  }, [userId])

  useEffect(() => {
    // Load comments for current reel
    if (currentReel) {
      loadComments()
      setLikeCount(currentReel.likes || 0)
      setLiked(false)
      setProgress(0)
    }
  }, [currentIndex])

  useEffect(() => {
    // Handle video autoplay
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch(() => {})
    }
  }, [currentIndex, autoPlay])

  async function loadReels() {
    setLoading(true)
    try {
      // In production, fetch from reels table
      const mockReels = [
        { 
          id: 1, 
          user_id: userId || 'user1', 
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', 
          description: '🎵 Amazing performance! #music #vibes',
          likes: 1234,
          comments: 56,
          shares: 89,
          created_at: new Date(),
          user: { 
            display_name: 'Sarah Chen', 
            username: 'sarahchen', 
            avatar_url: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=7c3aed&color=fff',
            is_verified: true 
          }
        },
        { 
          id: 2, 
          user_id: userId || 'user2', 
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', 
          description: '🔥 Check this out! #viral #trending',
          likes: 2345,
          comments: 78,
          shares: 145,
          created_at: new Date(),
          user: { 
            display_name: 'Marcus Webb', 
            username: 'marcuswebb', 
            avatar_url: 'https://ui-avatars.com/api/?name=Marcus+Webb&background=ec4899&color=fff',
            is_verified: false 
          }
        },
        { 
          id: 3, 
          user_id: userId || 'user3', 
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', 
          description: '💫 Behind the scenes studio session 🎧',
          likes: 5678,
          comments: 234,
          shares: 456,
          created_at: new Date(),
          user: { 
            display_name: 'Elena Rodriguez', 
            username: 'elenarodriguez', 
            avatar_url: 'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=f59e0b&color=fff',
            is_verified: true 
          }
        },
      ]
      setReels(mockReels)
    } catch (error) {
      console.error('Error loading reels:', error)
    }
    setLoading(false)
  }

  async function loadComments() {
    // Mock comments with more realistic data
    setComments([
      { 
        id: 1, 
        user: { username: 'user1', display_name: 'User One', avatar_url: 'https://ui-avatars.com/api/?name=User+One&background=10b981&color=fff' }, 
        content: '🔥🔥🔥 This is amazing!',
        created_at: new Date(Date.now() - 3600000),
        likes: 12
      },
      { 
        id: 2, 
        user: { username: 'user2', display_name: 'User Two', avatar_url: 'https://ui-avatars.com/api/?name=User+Two&background=3b82f6&color=fff' }, 
        content: 'Love this! Can\'t wait for more! ❤️',
        created_at: new Date(Date.now() - 1800000),
        likes: 8
      },
      { 
        id: 3, 
        user: { username: 'user3', display_name: 'User Three', avatar_url: 'https://ui-avatars.com/api/?name=User+Three&background=8b5cf6&color=fff' }, 
        content: 'This is the best thing I\'ve seen today!',
        created_at: new Date(Date.now() - 600000),
        likes: 5
      },
    ])
  }

  function handleVideoProgress() {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime
      const duration = videoRef.current.duration
      if (duration) {
        setProgress((currentTime / duration) * 100)
        setDuration(duration)
      }
    }
  }

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const currentReel = reels[currentIndex]

  function handleLike() {
    if (liked) {
      setLikeCount(prev => prev - 1)
      setLiked(false)
    } else {
      setLikeCount(prev => prev + 1)
      setLiked(true)
      // Add haptic feedback style animation
    }
  }

  function handleComment() {
    if (!comment.trim()) return
    const newComment = {
      id: Date.now(),
      user: { 
        username: session.user.email.split('@')[0], 
        display_name: session.user.email.split('@')[0],
        avatar_url: `https://ui-avatars.com/api/?name=${session.user.email[0]}&background=7c3aed&color=fff`
      },
      content: comment,
      created_at: new Date(),
      likes: 0
    }
    setComments(prev => [newComment, ...prev])
    setComment('')
    // Update comment count
    const updatedReels = [...reels]
    updatedReels[currentIndex].comments = (updatedReels[currentIndex].comments || 0) + 1
    setReels(updatedReels)
  }

  function handleSave() {
    setSaved(!saved)
  }

  function handleFollow() {
    setFollowing(!following)
  }

  function handleScroll(e) {
    const container = e.currentTarget
    const scrollTop = container.scrollTop
    const height = container.clientHeight
    const index = Math.round(scrollTop / height)
    if (index !== currentIndex && index >= 0 && index < reels.length) {
      setCurrentIndex(index)
    }
  }

  function handleShare(platform) {
    const url = `${window.location.origin}/reels/${currentReel.user_id}`
    const text = encodeURIComponent(`Check out this reel by ${currentReel.user?.display_name || 'this creator'} on SocialVibe!`)
    
    switch(platform) {
      case 'facebook':
        window.open(`https://facebook.com/sharer/sharer.php?u=${url}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
        break
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
        break
    }
    setShowShareOptions(false)
  }

  function formatCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M'
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K'
    }
    return count.toString()
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

  if (loading) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{ color: 'white', fontWeight: '700', fontSize: '20px' }}>No reels available</div>
        <button onClick={() => navigate(-1)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Go Back</button>
      </div>
    )
  }

  const styles = {
    container: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#000',
      zIndex: 9999,
      overflowY: 'scroll',
      scrollSnapType: 'y mandatory',
      height: '100vh',
      scrollbarWidth: 'none' // Hide scrollbar for Firefox
    },
    reelContainer: {
      height: '100vh',
      scrollSnapAlign: 'start',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000'
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    },
    videoWrapper: {
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    progressBar: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      height: '3px',
      background: 'rgba(255,255,255,0.3)',
      zIndex: 15
    },
    progressFill: {
      height: '100%',
      background: 'white',
      transition: 'width 0.1s linear'
    },
    overlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '20px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
      zIndex: 10
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '2px solid #7c3aed',
      objectFit: 'cover',
      cursor: 'pointer'
    },
    userName: {
      color: 'white',
      fontWeight: '700',
      fontSize: '15px',
      cursor: 'pointer'
    },
    userVerified: {
      color: '#1da1f2',
      marginLeft: '4px'
    },
    followBtn: {
      padding: '4px 16px',
      background: following ? '#666' : '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    description: {
      color: 'white',
      fontSize: '15px',
      fontWeight: '700',
      marginBottom: '4px',
      textShadow: '0 1px 3px rgba(0,0,0,0.5)'
    },
    musicInfo: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '13px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    actions: {
      position: 'absolute',
      right: '16px',
      bottom: '140px',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    },
    actionBtn: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      color: 'white',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    actionIcon: {
      fontSize: '28px',
      transition: 'transform 0.2s',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    actionIconLiked: {
      fontSize: '28px',
      color: '#ff4444',
      transform: 'scale(1.1)',
      textShadow: '0 2px 4px rgba(255,68,68,0.3)'
    },
    actionIconSaved: {
      fontSize: '28px',
      color: '#f59e0b',
      textShadow: '0 2px 4px rgba(245,158,11,0.3)'
    },
    actionCount: {
      fontSize: '12px',
      fontWeight: '700',
      color: 'white'
    },
    closeBtn: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 20,
      background: 'rgba(0,0,0,0.5)',
      border: 'none',
      color: 'white',
      fontSize: '20px',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)'
    },
    muteBtn: {
      position: 'absolute',
      bottom: '100px',
      right: '80px',
      zIndex: 15,
      background: 'rgba(0,0,0,0.5)',
      border: 'none',
      color: 'white',
      fontSize: '16px',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)'
    },
    commentModal: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: '60%',
      background: 'white',
      borderRadius: '20px 20px 0 0',
      zIndex: 30,
      padding: '20px',
      animation: 'slideUp 0.3s ease'
    },
    commentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    commentTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937'
    },
    commentClose: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#6b7280'
    },
    commentList: {
      maxHeight: '300px',
      overflowY: 'auto',
      marginBottom: '16px'
    },
    commentItem: {
      display: 'flex',
      gap: '12px',
      padding: '12px 0',
      borderBottom: '1px solid #f0f2f5'
    },
    commentAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: '#7c3aed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '14px',
      flexShrink: 0,
      overflow: 'hidden'
    },
    commentAvatarImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    commentContent: {
      flex: 1
    },
    commentUser: {
      fontWeight: '700',
      fontSize: '13px',
      color: '#1f2937'
    },
    commentText: {
      fontSize: '14px',
      color: '#4b5563',
      marginTop: '2px'
    },
    commentTime: {
      fontSize: '11px',
      color: '#6b7280',
      marginTop: '2px'
    },
    commentLikes: {
      fontSize: '12px',
      color: '#6b7280',
      marginLeft: '8px'
    },
    commentInput: {
      display: 'flex',
      gap: '8px',
      paddingTop: '12px',
      borderTop: '1px solid #eee'
    },
    input: {
      flex: 1,
      padding: '10px 16px',
      border: '1px solid #ddd',
      borderRadius: '20px',
      outline: 'none',
      fontSize: '14px',
      fontWeight: '700',
      background: '#f9fafb'
    },
    sendBtn: {
      padding: '10px 20px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    shareModal: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      background: 'white',
      borderRadius: '20px 20px 0 0',
      zIndex: 30,
      padding: '24px',
      animation: 'slideUp 0.3s ease'
    },
    shareTitle: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '16px',
      textAlign: 'center',
      color: '#1f2937'
    },
    shareOptions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px'
    },
    shareOption: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      padding: '12px',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: '#f9fafb',
      border: 'none'
    },
    shareOptionIcon: {
      fontSize: '28px'
    },
    shareOptionLabel: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#1f2937'
    },
    shareClose: {
      width: '100%',
      padding: '12px',
      marginTop: '12px',
      background: 'none',
      border: '1px solid #ddd',
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700',
      color: '#6b7280',
      transition: 'all 0.2s'
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%',
      background: '#000'
    }
  }

  return (
    <div style={styles.container} ref={containerRef} onScroll={handleScroll}>
      {/* Close Button */}
      <button style={styles.closeBtn} onClick={() => navigate(-1)}>
        <i className="fas fa-arrow-left"></i>
      </button>

      {reels.map((reel, index) => (
        <div key={reel.id} style={styles.reelContainer}>
          {/* Video Wrapper */}
          <div style={styles.videoWrapper}>
            <video 
              ref={index === currentIndex ? videoRef : null}
              style={styles.video}
              src={reel.video_url}
              loop
              muted={isMuted}
              playsInline
              autoPlay={index === currentIndex && autoPlay}
              onTimeUpdate={index === currentIndex ? handleVideoProgress : undefined}
              onClick={toggleMute}
            />
            
            {/* Progress Bar */}
            {index === currentIndex && (
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${progress}%`}}></div>
              </div>
            )}
          </div>

          {/* Overlay */}
          <div style={styles.overlay}>
            {/* User Info */}
            <div style={styles.userInfo}>
              <img 
                src={reel.user?.avatar_url || `https://ui-avatars.com/api/?name=${(reel.user?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                style={styles.userAvatar} 
                alt="avatar"
                onClick={() => navigate(`/profile/${reel.user_id}`)}
              />
              <span style={styles.userName} onClick={() => navigate(`/profile/${reel.user_id}`)}>
                {reel.user?.display_name || reel.user?.username || 'User'}
                {reel.user?.is_verified && <span style={styles.userVerified}>✓</span>}
              </span>
              <button 
                style={styles.followBtn} 
                onClick={handleFollow}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            </div>
            
            <div style={styles.description}>{reel.description}</div>
            <div style={styles.musicInfo}>
              <span>🎵</span> {reel.music || 'Original Sound'}
            </div>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            {/* Like */}
            <button style={styles.actionBtn} onClick={handleLike}>
              <i className="fas fa-heart" style={liked ? styles.actionIconLiked : styles.actionIcon}></i>
              <span style={styles.actionCount}>{formatCount(likeCount)}</span>
            </button>
            
            {/* Comments */}
            <button style={styles.actionBtn} onClick={() => setShowComments(!showComments)}>
              <i className="fas fa-comment" style={styles.actionIcon}></i>
              <span style={styles.actionCount}>{formatCount(reel.comments || 0)}</span>
            </button>
            
            {/* Share */}
            <button style={styles.actionBtn} onClick={() => setShowShareOptions(!showShareOptions)}>
              <i className="fas fa-share" style={styles.actionIcon}></i>
              <span style={styles.actionCount}>{formatCount(reel.shares || 0)}</span>
            </button>

            {/* Save */}
            <button style={styles.actionBtn} onClick={handleSave}>
              <i className="fas fa-bookmark" style={saved ? styles.actionIconSaved : styles.actionIcon}></i>
              <span style={styles.actionCount}>Save</span>
            </button>
          </div>

          {/* Mute Button */}
          <button style={styles.muteBtn} onClick={toggleMute}>
            <i className={`fas fa-volume-${isMuted ? 'mute' : 'up'}`}></i>
          </button>
        </div>
      ))}

      {/* Comments Modal */}
      {showComments && (
        <div style={styles.commentModal}>
          <div style={styles.commentHeader}>
            <div style={styles.commentTitle}>Comments</div>
            <button style={styles.commentClose} onClick={() => setShowComments(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div style={styles.commentList}>
            {comments.map(comment => (
              <div key={comment.id} style={styles.commentItem}>
                <div style={styles.commentAvatar}>
                  <img src={comment.user.avatar_url || `https://ui-avatars.com/api/?name=${(comment.user.display_name?.[0] || 'U')}&background=7c3aed&color=fff`} style={styles.commentAvatarImg} alt="" />
                </div>
                <div style={styles.commentContent}>
                  <div style={styles.commentUser}>{comment.user.display_name || comment.user.username}</div>
                  <div style={styles.commentText}>{comment.content}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</span>
                    {comment.likes > 0 && <span style={styles.commentLikes}>❤️ {comment.likes}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.commentInput}>
            <input 
              style={styles.input}
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
            />
            <button 
              style={styles.sendBtn} 
              onClick={handleComment}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareOptions && (
        <div style={styles.shareModal}>
          <div style={styles.shareTitle}>Share this reel</div>
          <div style={styles.shareOptions}>
            <button style={styles.shareOption} onClick={() => handleShare('facebook')}>
              <span style={styles.shareOptionIcon}>📘</span>
              <span style={styles.shareOptionLabel}>Facebook</span>
            </button>
            <button style={styles.shareOption} onClick={() => handleShare('twitter')}>
              <span style={styles.shareOptionIcon}>🐦</span>
              <span style={styles.shareOptionLabel}>Twitter</span>
            </button>
            <button style={styles.shareOption} onClick={() => handleShare('whatsapp')}>
              <span style={styles.shareOptionIcon}>💬</span>
              <span style={styles.shareOptionLabel}>WhatsApp</span>
            </button>
            <button style={styles.shareOption} onClick={() => handleShare('copy')}>
              <span style={styles.shareOptionIcon}>🔗</span>
              <span style={styles.shareOptionLabel}>Copy Link</span>
            </button>
          </div>
          <button style={styles.shareClose} onClick={() => setShowShareOptions(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}