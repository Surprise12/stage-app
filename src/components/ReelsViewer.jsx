// src/components/ReelsViewer.jsx
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
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    loadReels()
  }, [userId])

  async function loadReels() {
    setLoading(true)
    try {
      // In production, fetch from reels table
      const mockReels = [
        { 
          id: 1, 
          user_id: userId, 
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', 
          description: 'Amazing performance! 🎵',
          likes: 1234,
          comments: 56,
          created_at: new Date()
        },
        { 
          id: 2, 
          user_id: userId, 
          video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', 
          description: 'Check this out! 🔥',
          likes: 2345,
          comments: 78,
          created_at: new Date()
        },
      ]
      setReels(mockReels)
      setLikeCount(mockReels[0]?.likes || 0)
    } catch (error) {
      console.error('Error loading reels:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    // Load comments for current reel
    if (currentReel) {
      loadComments()
    }
  }, [currentIndex])

  async function loadComments() {
    // Mock comments
    setComments([
      { id: 1, user: { username: 'user1', display_name: 'User One' }, content: 'Amazing! 🔥', created_at: new Date() },
      { id: 2, user: { username: 'user2', display_name: 'User Two' }, content: 'Love this! ❤️', created_at: new Date() },
    ])
  }

  const currentReel = reels[currentIndex]

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
    // Add comment logic
    setComments(prev => [...prev, { 
      id: Date.now(), 
      user: { username: session.user.email, display_name: session.user.email.split('@')[0] }, 
      content: comment, 
      created_at: new Date() 
    }])
    setComment('')
  }

  function handleScroll(e) {
    // Detect if user scrolled to next/previous reel
    const container = e.currentTarget
    const scrollTop = container.scrollTop
    const height = container.clientHeight
    const index = Math.round(scrollTop / height)
    if (index !== currentIndex && index >= 0 && index < reels.length) {
      setCurrentIndex(index)
      setLiked(false)
      setLikeCount(reels[index]?.likes || 0)
    }
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
      height: '100vh'
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
    overlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '20px',
      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
      zIndex: 10
    },
    description: {
      color: 'white',
      fontSize: '16px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    actions: {
      position: 'absolute',
      right: '16px',
      bottom: '120px',
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
      fontWeight: '700'
    },
    actionIcon: {
      fontSize: '28px',
      transition: 'transform 0.2s'
    },
    actionIconLiked: {
      fontSize: '28px',
      color: '#ff4444',
      transition: 'transform 0.2s'
    },
    closeBtn: {
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 20,
      background: 'rgba(0,0,0,0.5)',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
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
      fontWeight: '700'
    },
    commentClose: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer'
    },
    commentList: {
      maxHeight: '300px',
      overflowY: 'auto',
      marginBottom: '16px'
    },
    commentItem: {
      display: 'flex',
      gap: '12px',
      padding: '8px 0',
      borderBottom: '1px solid #f0f2f5'
    },
    commentAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: '#7c3aed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '12px',
      flexShrink: 0
    },
    commentContent: {
      flex: 1
    },
    commentUser: {
      fontWeight: '700',
      fontSize: '13px'
    },
    commentText: {
      fontSize: '14px'
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
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{ color: 'white', fontWeight: '700', fontSize: '20px' }}>No reels available</div>
        <button onClick={() => navigate(-1)} style={{ color: 'white', background: 'none', border: '1px solid white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Go Back</button>
      </div>
    )
  }

  return (
    <div style={styles.container} ref={containerRef} onScroll={handleScroll}>
      {/* Close Button */}
      <button style={styles.closeBtn} onClick={() => navigate(-1)}>
        <i className="fas fa-arrow-left"></i>
      </button>

      {reels.map((reel, index) => (
        <div key={reel.id} style={styles.reelContainer}>
          {/* Video */}
          <video 
            ref={videoRef}
            style={styles.video}
            src={reel.video_url}
            loop
            muted
            playsInline
            autoPlay={index === currentIndex}
          />

          {/* Overlay */}
          <div style={styles.overlay}>
            <div style={styles.description}>{reel.description}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '700' }}>
              @{reel.user_id?.slice(0, 8) || 'user'}
            </div>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button style={styles.actionBtn} onClick={handleLike}>
              <i className={`fas fa-heart`} style={liked ? styles.actionIconLiked : styles.actionIcon}></i>
              <span>{likeCount}</span>
            </button>
            
            <button style={styles.actionBtn} onClick={() => setShowComments(!showComments)}>
              <i className="fas fa-comment" style={styles.actionIcon}></i>
              <span>{reel.comments || 0}</span>
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
                  {comment.user.display_name?.[0] || 'U'}
                </div>
                <div style={styles.commentContent}>
                  <div style={styles.commentUser}>{comment.user.display_name || comment.user.username}</div>
                  <div style={styles.commentText}>{comment.content}</div>
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
            <button style={styles.sendBtn} onClick={handleComment}>Post</button>
          </div>
        </div>
      )}
    </div>
  )
}