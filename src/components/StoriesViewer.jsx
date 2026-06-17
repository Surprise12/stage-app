// src/components/StoriesViewer.jsx - UPDATED WITH MORE FEATURES
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function StoriesViewer({ session }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [stories, setStories] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [reactions, setReactions] = useState({ like: 0, heart: 0, fire: 0, clap: 0 })
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replies, setReplies] = useState([])
  const [userReaction, setUserReaction] = useState(null)
  const [showTipModal, setShowTipModal] = useState(false)
  const [tipAmount, setTipAmount] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCaption, setShowCaption] = useState(true)
  const progressRef = useRef(null)
  const timerRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    loadStories()
    loadReplies()
  }, [userId])

  useEffect(() => {
    if (stories.length > 0 && !isPaused) {
      startProgress()
    }
    return () => clearTimeout(timerRef.current)
  }, [currentIndex, stories, isPaused])

  async function loadStories() {
    setLoading(true)
    try {
      // In production, fetch from stories table
      const mockStories = [
        { 
          id: 1, 
          user_id: userId, 
          content: 'https://picsum.photos/400/700?random=1', 
          type: 'image', 
          caption: '🎵 New track dropping soon!',
          created_at: new Date(),
          views: 234,
          likes: 45
        },
        { 
          id: 2, 
          user_id: userId, 
          content: 'https://picsum.photos/400/700?random=2', 
          type: 'image', 
          caption: 'Studio vibes 🎧',
          created_at: new Date(),
          views: 189,
          likes: 32
        },
        { 
          id: 3, 
          user_id: userId, 
          content: 'https://picsum.photos/400/700?random=3', 
          type: 'video', 
          caption: 'Behind the scenes 🎬',
          created_at: new Date(),
          views: 567,
          likes: 78
        },
      ]
      setStories(mockStories)
    } catch (error) {
      console.error('Error loading stories:', error)
    }
    setLoading(false)
  }

  async function loadReplies() {
    // Mock replies
    setReplies([
      { id: 1, user: { display_name: 'Sarah Chen', username: 'sarahchen' }, content: 'Amazing! 🔥', created_at: new Date() },
      { id: 2, user: { display_name: 'Marcus Webb', username: 'marcuswebb' }, content: 'Can\'t wait! 🙌', created_at: new Date() },
    ])
  }

  function startProgress() {
    clearTimeout(timerRef.current)
    setProgress(0)
    
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearTimeout(timerRef.current)
          nextStory()
          return 0
        }
        return prev + 1
      })
    }, 50)
  }

  function nextStory() {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setProgress(0)
    } else {
      closeViewer()
    }
  }

  function previousStory() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setProgress(0)
    }
  }

  function closeViewer() {
    navigate(-1)
  }

  function handleTouchStart(e) {
    const touch = e.touches[0]
    const x = touch.clientX
    const screenWidth = window.innerWidth
    if (x < screenWidth / 3) {
      previousStory()
    } else if (x > (screenWidth * 2) / 3) {
      nextStory()
    }
    setIsPaused(true)
  }

  function handleTouchEnd() {
    setIsPaused(false)
  }

  function handleReaction(type) {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }))
    setUserReaction(type)
    setShowReactions(false)
    // In production, save reaction to database
  }

  function handleSendReply() {
    if (!replyText.trim()) return
    const newReply = {
      id: Date.now(),
      user: { display_name: session.user.email.split('@')[0], username: session.user.email.split('@')[0] },
      content: replyText,
      created_at: new Date()
    }
    setReplies(prev => [newReply, ...prev])
    setReplyText('')
    setShowReplyModal(false)
  }

  function handleSendTip() {
    const amount = parseFloat(tipAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }
    alert(`💸 Thanks for your $${amount} tip!`)
    setTipAmount('')
    setShowTipModal(false)
  }

  function handleDownload() {
    // In production, download the story
    alert('Downloading story...')
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const currentStory = stories[currentIndex]

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
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '20px',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
    },
    avatar: {
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
      fontSize: '18px',
      overflow: 'hidden',
      flexShrink: 0
    },
    name: {
      color: 'white',
      fontWeight: '700',
      fontSize: '16px'
    },
    time: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: '12px',
      fontWeight: '700'
    },
    closeBtn: {
      marginLeft: 'auto',
      background: 'rgba(0,0,0,0.5)',
      border: 'none',
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    progressContainer: {
      position: 'absolute',
      top: '10px',
      left: '10px',
      right: '10px',
      zIndex: 10,
      display: 'flex',
      gap: '4px'
    },
    progressBar: {
      flex: 1,
      height: '3px',
      background: 'rgba(255,255,255,0.3)',
      borderRadius: '3px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      background: 'white',
      borderRadius: '3px',
      transition: 'width 0.1s linear'
    },
    storyContent: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    storyImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    },
    controls: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      zIndex: 5
    },
    controlLeft: {
      flex: 1,
      cursor: 'pointer'
    },
    controlRight: {
      flex: 1,
      cursor: 'pointer'
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(124,58,237,0.2)',
      borderTop: '4px solid #7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    // Footer Actions
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '20px',
      zIndex: 10,
      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'
    },
    caption: {
      color: 'white',
      fontSize: '14px',
      fontWeight: '700',
      marginBottom: '12px',
      textShadow: '0 1px 3px rgba(0,0,0,0.5)'
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    leftActions: {
      display: 'flex',
      gap: '20px',
      alignItems: 'center'
    },
    rightActions: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center'
    },
    actionBtn: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    actionIcon: {
      fontSize: '22px',
      transition: 'transform 0.2s'
    },
    actionIconActive: {
      fontSize: '22px',
      color: '#ff4444',
      transform: 'scale(1.2)'
    },
    actionCount: {
      fontSize: '11px',
      color: 'rgba(255,255,255,0.7)'
    },
    // Reactions Popup
    reactionsPopup: {
      position: 'absolute',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.8)',
      borderRadius: '20px',
      padding: '10px 16px',
      display: 'flex',
      gap: '8px',
      zIndex: 20,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)'
    },
    reactionEmoji: {
      fontSize: '28px',
      cursor: 'pointer',
      transition: 'transform 0.2s',
      padding: '2px'
    },
    // Reply Modal
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
      zIndex: 100
    },
    modalContent: {
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      maxWidth: '400px',
      width: '90%'
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '16px',
      textAlign: 'center'
    },
    modalInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      marginBottom: '12px',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    modalBtn: {
      width: '100%',
      padding: '12px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s'
    },
    modalCancel: {
      width: '100%',
      padding: '12px',
      background: 'transparent',
      color: '#666',
      border: '1px solid #ddd',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      marginTop: '8px',
      transition: 'all 0.2s'
    },
    repliesContainer: {
      position: 'absolute',
      bottom: '120px',
      right: '20px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '250px'
    },
    replyItem: {
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(10px)',
      padding: '8px 12px',
      borderRadius: '12px',
      color: 'white',
      fontSize: '12px',
      animation: 'fadeIn 0.3s ease'
    },
    replyUser: {
      fontWeight: '700',
      color: '#7c3aed'
    },
    replyText: {
      marginLeft: '6px'
    },
    tipInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      marginBottom: '12px'
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
        </div>
      </div>
    )
  }

  if (!currentStory) {
    return (
      <div style={styles.container}>
        <div style={{ color: 'white', fontWeight: '700' }}>No stories available</div>
        <button onClick={closeViewer} style={{ color: 'white', marginTop: '20px', background: 'rgba(255,255,255,0.2)', border: '1px solid white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Close</button>
      </div>
    )
  }

  return (
    <div 
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Bars */}
      <div style={styles.progressContainer}>
        {stories.map((_, index) => (
          <div key={index} style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
            }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.avatar}>
          <img src={`https://ui-avatars.com/api/?name=${(currentStory.user_id?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        </div>
        <div>
          <div style={styles.name}>User {currentStory.user_id?.slice(0, 8) || 'Unknown'}</div>
          <div style={styles.time}>{new Date(currentStory.created_at).toLocaleTimeString()} • {currentStory.views || 0} views</div>
        </div>
        <button style={styles.closeBtn} onClick={closeViewer}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Story Content */}
      <div style={styles.storyContent}>
        {currentStory.type === 'video' ? (
          <video 
            ref={videoRef}
            src={currentStory.content} 
            style={styles.storyImage} 
            autoPlay 
            muted 
            playsInline
            controls={false}
          />
        ) : (
          <img src={currentStory.content} style={styles.storyImage} alt="story" />
        )}
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.controlLeft} onClick={previousStory} />
        <div style={styles.controlRight} onClick={nextStory} />
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        {currentStory.caption && showCaption && (
          <div style={styles.caption}>{currentStory.caption}</div>
        )}

        <div style={styles.actions}>
          <div style={styles.leftActions}>
            {/* Like Button */}
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
            >
              <button style={styles.actionBtn} onClick={() => handleReaction('like')}>
                <i className="fas fa-heart" style={userReaction ? styles.actionIconActive : styles.actionIcon}></i>
                <span style={styles.actionCount}>{reactions.like + reactions.heart + reactions.fire + reactions.clap}</span>
              </button>
              {showReactions && (
                <div style={styles.reactionsPopup}>
                  <span style={styles.reactionEmoji} onClick={() => handleReaction('like')} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>❤️</span>
                  <span style={styles.reactionEmoji} onClick={() => handleReaction('heart')} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>💖</span>
                  <span style={styles.reactionEmoji} onClick={() => handleReaction('fire')} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>🔥</span>
                  <span style={styles.reactionEmoji} onClick={() => handleReaction('clap')} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>👏</span>
                </div>
              )}
            </div>

            {/* Reply Button */}
            <button style={styles.actionBtn} onClick={() => setShowReplyModal(true)}>
              <i className="fas fa-comment" style={styles.actionIcon}></i>
              <span style={styles.actionCount}>{replies.length}</span>
            </button>
          </div>

          <div style={styles.rightActions}>
            {/* Tip Button */}
            <button style={styles.actionBtn} onClick={() => setShowTipModal(true)}>
              <i className="fas fa-gift" style={styles.actionIcon}></i>
              <span style={styles.actionCount}>Tip</span>
            </button>

            {/* Share Button */}
            <button style={styles.actionBtn} onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Link copied!')
            }}>
              <i className="fas fa-share" style={styles.actionIcon}></i>
              <span style={styles.actionCount}>Share</span>
            </button>

            {/* More Options */}
            <button style={styles.actionBtn} onClick={handleDownload}>
              <i className="fas fa-download" style={styles.actionIcon}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div style={styles.repliesContainer}>
          {replies.slice(0, 3).map(reply => (
            <div key={reply.id} style={styles.replyItem}>
              <span style={styles.replyUser}>{reply.user.display_name || reply.user.username}:</span>
              <span style={styles.replyText}>{reply.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && (
        <div style={styles.modal} onClick={() => setShowReplyModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>💬 Reply to Story</div>
            <textarea
              style={styles.modalInput}
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows="3"
            />
            <button 
              style={styles.modalBtn} 
              onClick={handleSendReply}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              Send Reply
            </button>
            <button 
              style={styles.modalCancel} 
              onClick={() => setShowReplyModal(false)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <div style={styles.modal} onClick={() => setShowTipModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>💸 Send a Tip</div>
            <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', marginBottom: '16px', fontWeight: '700' }}>
              Support this creator by sending a tip!
            </p>
            <input
              type="number"
              style={styles.tipInput}
              placeholder="Enter amount ($)"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              min="1"
              step="1"
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button style={{ flex: 1, padding: '8px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }} onClick={() => setTipAmount('5')}>$5</button>
              <button style={{ flex: 1, padding: '8px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }} onClick={() => setTipAmount('10')}>$10</button>
              <button style={{ flex: 1, padding: '8px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }} onClick={() => setTipAmount('25')}>$25</button>
              <button style={{ flex: 1, padding: '8px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }} onClick={() => setTipAmount('50')}>$50</button>
            </div>
            <button 
              style={styles.modalBtn} 
              onClick={handleSendTip}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              Send Tip
            </button>
            <button 
              style={styles.modalCancel} 
              onClick={() => setShowTipModal(false)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}