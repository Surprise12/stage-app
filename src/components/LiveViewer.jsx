// src/components/LiveViewer.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LiveViewer({ session }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [liveStream, setLiveStream] = useState(null)
  const [viewers, setViewers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    loadLiveStream()
    loadViewers()
    loadComments()
  }, [userId])

  async function loadLiveStream() {
    setLoading(true)
    try {
      // In production, fetch live stream from database
      const mockStream = {
        id: 1,
        user_id: userId || 'user123',
        title: 'Live Music Session 🎵',
        description: 'Join me for some amazing vibes!',
        viewers: 234,
        likes: 1234,
        started_at: new Date(),
        is_live: true
      }
      setLiveStream(mockStream)
      setViewers(mockStream.viewers)
      setLikeCount(mockStream.likes)
    } catch (error) {
      console.error('Error loading live stream:', error)
    }
    setLoading(false)
  }

  async function loadViewers() {
    // Simulate viewer count updating
    setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 3) - 1)
    }, 5000)
  }

  async function loadComments() {
    // Mock comments
    setComments([
      { id: 1, user: { username: 'user1', display_name: 'User One' }, content: 'Amazing! 🔥', created_at: new Date() },
      { id: 2, user: { username: 'user2', display_name: 'User Two' }, content: 'Love this! ❤️', created_at: new Date() },
    ])
  }

  function handleLike() {
    if (liked) {
      setLikeCount(prev => prev - 1)
      setLiked(false)
    } else {
      setLikeCount(prev => prev + 1)
      setLiked(true)
    }
  }

  function handleComment() {
    if (!comment.trim()) return
    setComments(prev => [...prev, { 
      id: Date.now(), 
      user: { username: session.user.email, display_name: session.user.email.split('@')[0] }, 
      content: comment, 
      created_at: new Date() 
    }])
    setComment('')
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
      display: 'flex',
      flexDirection: 'column'
    },
    videoContainer: {
      flex: 1,
      position: 'relative',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    },
    liveBadge: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(0,0,0,0.7)',
      padding: '8px 16px',
      borderRadius: '20px'
    },
    liveDot: {
      width: '12px',
      height: '12px',
      background: '#ff4444',
      borderRadius: '50%',
      animation: 'pulse 1s infinite'
    },
    liveText: {
      color: 'white',
      fontWeight: '700',
      fontSize: '14px'
    },
    viewerCount: {
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '700',
      fontSize: '14px'
    },
    closeBtn: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 10,
      background: 'rgba(0,0,0,0.7)',
      border: 'none',
      color: 'white',
      fontSize: '20px',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    overlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '20px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
      zIndex: 10
    },
    streamInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    streamAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      border: '2px solid #7c3aed',
      background: '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '16px',
      overflow: 'hidden'
    },
    streamTitle: {
      color: 'white',
      fontWeight: '700',
      fontSize: '18px'
    },
    streamDescription: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: '14px',
      fontWeight: '700'
    },
    streamerName: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '13px',
      fontWeight: '700'
    },
    followBtn: {
      background: isFollowing ? '#666' : '#7c3aed',
      color: 'white',
      border: 'none',
      padding: '6px 16px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      marginLeft: 'auto',
      transition: 'all 0.2s'
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginTop: '12px'
    },
    actionBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: 'white',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '700'
    },
    actionIcon: {
      fontSize: '20px'
    },
    actionIconLiked: {
      fontSize: '20px',
      color: '#ff4444'
    },
    commentsContainer: {
      position: 'absolute',
      bottom: '100px',
      right: '20px',
      zIndex: 10,
      maxHeight: '300px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '300px'
    },
    commentItem: {
      background: 'rgba(0,0,0,0.6)',
      padding: '8px 12px',
      borderRadius: '20px',
      color: 'white',
      fontSize: '13px',
      animation: 'fadeIn 0.3s ease',
      fontWeight: '700'
    },
    commentUser: {
      color: '#7c3aed',
      fontWeight: '700'
    },
    commentInput: {
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      right: '120px',
      zIndex: 10,
      display: 'flex',
      gap: '8px'
    },
    input: {
      flex: 1,
      padding: '10px 16px',
      border: 'none',
      borderRadius: '20px',
      background: 'rgba(255,255,255,0.9)',
      outline: 'none',
      fontSize: '14px',
      fontWeight: '700'
    },
    sendBtn: {
      padding: '10px 20px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700'
    }
  }

  if (loading) {
    return (
      <div style={{ ...styles.container, alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!liveStream) {
    return (
      <div style={{ ...styles.container, alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div style={{ color: 'white', fontWeight: '700', fontSize: '20px' }}>No live stream available</div>
        <button onClick={() => navigate(-1)} style={{ color: 'white', background: 'none', border: '1px solid white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Go Back</button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Video Container */}
      <div style={styles.videoContainer}>
        {/* Live Badge */}
        <div style={styles.liveBadge}>
          <div style={styles.liveDot}></div>
          <span style={styles.liveText}>LIVE</span>
          <span style={styles.viewerCount}>👁️ {viewers}</span>
        </div>

        {/* Close Button */}
        <button style={styles.closeBtn} onClick={() => navigate(-1)}>
          <i className="fas fa-times"></i>
        </button>

        {/* Video */}
        <video 
          ref={videoRef}
          style={styles.video}
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          autoPlay
          muted
          playsInline
          loop
        />

        {/* Overlay */}
        <div style={styles.overlay}>
          <div style={styles.streamInfo}>
            <div style={styles.streamAvatar}>
              <img src={`https://ui-avatars.com/api/?name=${(liveStream.user_id?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
            <div>
              <div style={styles.streamTitle}>{liveStream.title}</div>
              <div style={styles.streamerName}>@{liveStream.user_id?.slice(0, 8) || 'user'}</div>
            </div>
            <button 
              style={styles.followBtn}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
          <div style={styles.streamDescription}>{liveStream.description}</div>
          
          {/* Actions */}
          <div style={styles.actions}>
            <button style={styles.actionBtn} onClick={handleLike}>
              <i className="fas fa-heart" style={liked ? styles.actionIconLiked : styles.actionIcon}></i>
              <span>{likeCount}</span>
            </button>
            <button style={styles.actionBtn} onClick={() => document.getElementById('commentInput').focus()}>
              <i className="fas fa-comment" style={styles.actionIcon}></i>
              <span>{comments.length}</span>
            </button>
            <button style={styles.actionBtn} onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Link copied!')
            }}>
              <i className="fas fa-share" style={styles.actionIcon}></i>
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Comments */}
        <div style={styles.commentsContainer}>
          {comments.slice(-5).map(comment => (
            <div key={comment.id} style={styles.commentItem}>
              <span style={styles.commentUser}>{comment.user.display_name || comment.user.username}:</span> {comment.content}
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <div style={styles.commentInput}>
          <input 
            id="commentInput"
            style={styles.input}
            placeholder="Say something..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleComment()}
          />
          <button style={styles.sendBtn} onClick={handleComment}>Send</button>
        </div>
      </div>
    </div>
  )
}