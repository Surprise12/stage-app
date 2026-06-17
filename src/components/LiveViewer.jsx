// src/components/LiveViewer.jsx - UPDATED WITH MORE FEATURES
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
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [selectedGift, setSelectedGift] = useState(null)
  const [giftAnimations, setGiftAnimations] = useState([])
  const [showViewersList, setShowViewersList] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const videoRef = useRef(null)
  const commentsEndRef = useRef(null)

  const gifts = [
    { id: 1, name: 'Rose', icon: '🌹', coins: 10, color: '#ff4444' },
    { id: 2, name: 'Heart', icon: '❤️', coins: 25, color: '#ff6b6b' },
    { id: 3, name: 'Star', icon: '⭐', coins: 50, color: '#ffd700' },
    { id: 4, name: 'Diamond', icon: '💎', coins: 100, color: '#00b4d8' },
    { id: 5, name: 'Crown', icon: '👑', coins: 250, color: '#ffd700' },
    { id: 6, name: 'Fire', icon: '🔥', coins: 500, color: '#ff6b35' },
    { id: 7, name: 'Rocket', icon: '🚀', coins: 1000, color: '#00d4ff' },
  ]

  useEffect(() => {
    loadLiveStream()
    loadViewers()
    loadComments()
    subscribeToLiveUpdates()
  }, [userId])

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  async function loadLiveStream() {
    setLoading(true)
    try {
      const mockStream = {
        id: 1,
        user_id: userId || 'user123',
        title: 'Live Music Session 🎵',
        description: 'Join me for some amazing vibes!',
        viewers: 234,
        likes: 1234,
        started_at: new Date(),
        is_live: true,
        user: {
          display_name: 'Sarah Chen',
          username: 'sarahchen',
          avatar_url: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=7c3aed&color=fff',
          is_verified: true,
          followers: 12500
        }
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
    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 3) - 1)
    }, 5000)
    return () => clearInterval(interval)
  }

  async function loadComments() {
    setComments([
      { id: 1, user: { username: 'user1', display_name: 'User One', avatar_url: 'https://ui-avatars.com/api/?name=User+One&background=10b981&color=fff' }, content: 'Amazing! 🔥', created_at: new Date(), is_gift: false },
      { id: 2, user: { username: 'user2', display_name: 'User Two', avatar_url: 'https://ui-avatars.com/api/?name=User+Two&background=3b82f6&color=fff' }, content: 'Love this! ❤️', created_at: new Date(), is_gift: false },
      { id: 3, user: { username: 'user3', display_name: 'User Three', avatar_url: 'https://ui-avatars.com/api/?name=User+Three&background=8b5cf6&color=fff' }, content: '🎁', created_at: new Date(), is_gift: true, gift: 'Rose' },
    ])
  }

  function subscribeToLiveUpdates() {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Simulate new comments randomly
      if (Math.random() > 0.7) {
        const names = ['Alex', 'Jamie', 'Taylor', 'Jordan', 'Morgan']
        const messages = ['🎉', '🔥', '💫', '✨', '🙌', 'Amazing!', 'Love this!', 'Keep going!']
        setComments(prev => [...prev, {
          id: Date.now(),
          user: { 
            username: names[Math.floor(Math.random() * names.length)].toLowerCase(), 
            display_name: names[Math.floor(Math.random() * names.length)],
            avatar_url: `https://ui-avatars.com/api/?name=${names[Math.floor(Math.random() * names.length)]}&background=7c3aed&color=fff`
          },
          content: messages[Math.floor(Math.random() * messages.length)],
          created_at: new Date(),
          is_gift: false
        }])
      }
    }, 3000)
    return () => clearInterval(interval)
  }

  function handleLike() {
    if (liked) {
      setLikeCount(prev => prev - 1)
      setLiked(false)
    } else {
      setLikeCount(prev => prev + 1)
      setLiked(true)
      // Animate heart pop
      createHeartAnimation()
    }
  }

  function createHeartAnimation() {
    const heart = document.createElement('div')
    heart.innerHTML = '❤️'
    heart.style.cssText = `
      position: fixed;
      font-size: ${Math.random() * 20 + 20}px;
      color: ${['#ff4444', '#ff6b6b', '#ff1493', '#ff69b4'][Math.floor(Math.random() * 4)]};
      left: ${Math.random() * 40 + 30}%;
      bottom: 30%;
      pointer-events: none;
      z-index: 9999;
      animation: floatUp ${Math.random() * 1 + 1}s ease-out forwards;
    `
    document.body.appendChild(heart)
    setTimeout(() => heart.remove(), 2000)
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
      is_gift: false
    }
    setComments(prev => [...prev, newComment])
    setComment('')
  }

  function handleSendGift(gift) {
    setSelectedGift(gift)
    setShowGiftModal(false)
    
    // Add gift animation
    setGiftAnimations(prev => [...prev, { id: Date.now(), gift: gift }])
    setTimeout(() => {
      setGiftAnimations(prev => prev.filter(g => g.id !== Date.now()))
    }, 3000)

    // Add gift message to chat
    setComments(prev => [...prev, {
      id: Date.now(),
      user: { 
        username: session.user.email.split('@')[0], 
        display_name: session.user.email.split('@')[0],
        avatar_url: `https://ui-avatars.com/api/?name=${session.user.email[0]}&background=7c3aed&color=fff`
      },
      content: `🎁 sent ${gift.icon} ${gift.name}!`,
      created_at: new Date(),
      is_gift: true,
      gift: gift.name
    }])
  }

  function handleFollow() {
    setIsFollowing(!isFollowing)
  }

  function formatTimeAgo(date) {
    if (!date) return 'just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(date).toLocaleDateString()
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
      borderRadius: '20px',
      backdropFilter: 'blur(10px)'
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
      fontSize: '14px',
      cursor: 'pointer'
    },
    closeBtn: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 10,
      background: 'rgba(0,0,0,0.7)',
      border: 'none',
      color: 'white',
      fontSize: '18px',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)'
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
    streamInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    streamAvatar: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      border: '2px solid #7c3aed',
      background: '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '16px',
      overflow: 'hidden',
      flexShrink: 0,
      cursor: 'pointer'
    },
    streamAvatarImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
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
      fontWeight: '700',
      cursor: 'pointer'
    },
    streamVerified: {
      color: '#1da1f2',
      marginLeft: '4px'
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
      transition: 'all 0.2s',
      flexShrink: 0
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
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
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    actionIcon: {
      fontSize: '22px'
    },
    actionIconLiked: {
      fontSize: '22px',
      color: '#ff4444',
      animation: 'heartPop 0.5s ease'
    },
    commentsContainer: {
      position: 'absolute',
      bottom: '120px',
      right: '20px',
      zIndex: 10,
      maxHeight: '350px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '320px',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.3) transparent'
    },
    commentItem: {
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(10px)',
      padding: '8px 12px',
      borderRadius: '16px',
      color: 'white',
      fontSize: '13px',
      animation: 'fadeIn 0.3s ease',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    commentGift: {
      background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,107,53,0.2))',
      border: '1px solid rgba(255,215,0,0.3)'
    },
    commentAvatar: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      objectFit: 'cover',
      flexShrink: 0
    },
    commentUser: {
      color: '#7c3aed',
      fontWeight: '700'
    },
    commentContent: {
      flex: 1
    },
    commentGiftIcon: {
      fontSize: '18px',
      marginRight: '4px'
    },
    commentInput: {
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      right: '100px',
      zIndex: 10,
      display: 'flex',
      gap: '8px',
      background: 'rgba(0,0,0,0.5)',
      padding: '6px',
      borderRadius: '24px',
      backdropFilter: 'blur(10px)'
    },
    input: {
      flex: 1,
      padding: '10px 16px',
      border: 'none',
      borderRadius: '20px',
      background: 'rgba(255,255,255,0.15)',
      outline: 'none',
      fontSize: '14px',
      fontWeight: '700',
      color: 'white'
    },
    inputPlaceholder: {
      color: 'rgba(255,255,255,0.5)'
    },
    sendBtn: {
      padding: '8px 18px',
      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    giftBtn: {
      padding: '8px 12px',
      background: 'rgba(255,255,255,0.1)',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '20px',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    // Gift Modal
    giftModal: {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      background: 'rgba(20,20,30,0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px 24px 0 0',
      zIndex: 20,
      padding: '24px',
      animation: 'slideUp 0.3s ease',
      maxHeight: '60%'
    },
    giftModalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    giftModalTitle: {
      color: 'white',
      fontSize: '20px',
      fontWeight: '700'
    },
    giftModalClose: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer'
    },
    giftGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      overflowY: 'auto',
      maxHeight: '300px'
    },
    giftItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      padding: '12px',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid transparent'
    },
    giftItemIcon: {
      fontSize: '32px'
    },
    giftItemName: {
      color: 'white',
      fontSize: '12px',
      fontWeight: '700'
    },
    giftItemCoins: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '10px',
      fontWeight: '700'
    },
    giftItemPrice: {
      color: '#ffd700',
      fontSize: '12px',
      fontWeight: '700'
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      background: '#000'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(124,58,237,0.2)',
      borderTop: '4px solid #7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    // Viewer count popup
    viewersPopup: {
      position: 'absolute',
      bottom: '80px',
      left: '20px',
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      padding: '16px',
      zIndex: 15,
      minWidth: '200px',
      maxHeight: '300px',
      overflowY: 'auto',
      animation: 'slideUp 0.3s ease'
    },
    viewerItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '6px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    },
    viewerAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    viewerName: {
      color: 'white',
      fontSize: '13px',
      fontWeight: '700'
    },
    viewerBadge: {
      marginLeft: 'auto',
      fontSize: '10px',
      color: '#7c3aed'
    },
    // Gift animation overlay
    giftOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 9998,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    giftAnimation: {
      fontSize: '80px',
      animation: 'giftFly 2s ease-out forwards'
    },
    giftBanner: {
      position: 'absolute',
      top: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      padding: '8px 20px',
      borderRadius: '20px',
      color: 'white',
      fontSize: '20px',
      fontWeight: '700',
      animation: 'bannerSlide 2s ease-out forwards',
      boxShadow: '0 4px 20px rgba(124,58,237,0.4)'
    },
    heartBurst: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '60px',
      animation: 'heartBurst 1s ease-out forwards',
      pointerEvents: 'none'
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    )
  }

  if (!liveStream) {
    return (
      <div style={{ ...styles.container, alignItems: 'center', justifyContent: 'center', gap: '20px', background: '#0a0a1a' }}>
        <div style={{ color: 'white', fontWeight: '700', fontSize: '20px' }}>No live stream available</div>
        <button onClick={() => navigate(-1)} style={{ color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Go Back</button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Gift Animations */}
      {giftAnimations.map((anim, index) => (
        <div key={anim.id} style={styles.giftOverlay}>
          <div style={styles.giftAnimation}>{anim.gift.icon}</div>
          <div style={styles.giftBanner}>
            {anim.gift.icon} {anim.gift.name}!
          </div>
        </div>
      ))}

      {/* Video Container */}
      <div style={styles.videoContainer}>
        {/* Live Badge */}
        <div style={styles.liveBadge}>
          <div style={styles.liveDot}></div>
          <span style={styles.liveText}>LIVE</span>
          <span style={styles.viewerCount} onClick={() => setShowViewersList(!showViewersList)}>
            👁️ {viewers.toLocaleString()}
          </span>
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

        {/* Viewers List */}
        {showViewersList && (
          <div style={styles.viewersPopup}>
            <div style={{ color: 'white', fontWeight: '700', marginBottom: '12px' }}>
              👁️ {viewers.toLocaleString()} viewers
            </div>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={styles.viewerItem}>
                <img src={`https://ui-avatars.com/api/?name=User+${i}&background=7c3aed&color=fff`} style={styles.viewerAvatar} alt="" />
                <span style={styles.viewerName}>User {i}</span>
                {i === 1 && <span style={styles.viewerBadge}>⭐ Host</span>}
              </div>
            ))}
          </div>
        )}

        {/* Overlay */}
        <div style={styles.overlay}>
          <div style={styles.streamInfo}>
            <div style={styles.streamAvatar}>
              <img src={liveStream.user?.avatar_url || `https://ui-avatars.com/api/?name=${(liveStream.user_id?.[0] || 'U')}&background=000&color=fff`} style={styles.streamAvatarImg} alt="" />
            </div>
            <div>
              <div style={styles.streamTitle}>{liveStream.title}</div>
              <div style={styles.streamerName}>
                @{liveStream.user?.username || liveStream.user_id?.slice(0, 8) || 'user'}
                {liveStream.user?.is_verified && <span style={styles.streamVerified}>✓</span>}
              </div>
            </div>
            <button 
              style={styles.followBtn}
              onClick={handleFollow}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
          <div style={styles.streamDescription}>{liveStream.description}</div>
          
          {/* Actions */}
          <div style={styles.actions}>
            <button style={styles.actionBtn} onClick={handleLike}>
              <i className="fas fa-heart" style={liked ? styles.actionIconLiked : styles.actionIcon}></i>
              <span>{likeCount.toLocaleString()}</span>
            </button>
            <button style={styles.actionBtn} onClick={() => document.getElementById('commentInput').focus()}>
              <i className="fas fa-comment" style={styles.actionIcon}></i>
              <span>{comments.length}</span>
            </button>
            <button style={styles.actionBtn} onClick={() => setShowGiftModal(true)}>
              <i className="fas fa-gift" style={styles.actionIcon}></i>
              <span>Gift</span>
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
          {comments.slice(-8).map(comment => (
            <div key={comment.id} style={{...styles.commentItem, ...(comment.is_gift ? styles.commentGift : {})}}>
              {comment.user?.avatar_url && (
                <img src={comment.user.avatar_url} style={styles.commentAvatar} alt="" />
              )}
              <span style={styles.commentUser}>{comment.user?.display_name || comment.user?.username}:</span>
              {comment.is_gift ? (
                <span style={styles.commentContent}>
                  <span style={styles.commentGiftIcon}>🎁</span> sent {comment.gift || 'a gift'}!
                </span>
              ) : (
                <span style={styles.commentContent}>{comment.content}</span>
              )}
            </div>
          ))}
          <div ref={commentsEndRef} />
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
          <button style={styles.giftBtn} onClick={() => setShowGiftModal(true)}>
            🎁
          </button>
          <button 
            style={styles.sendBtn} 
            onClick={handleComment}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Send
          </button>
        </div>

        {/* Gift Modal */}
        {showGiftModal && (
          <div style={styles.giftModal}>
            <div style={styles.giftModalHeader}>
              <span style={styles.giftModalTitle}>🎁 Send a Gift</span>
              <button style={styles.giftModalClose} onClick={() => setShowGiftModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={styles.giftGrid}>
              {gifts.map(gift => (
                <div 
                  key={gift.id} 
                  style={styles.giftItem}
                  onClick={() => handleSendGift(gift)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(124,58,237,0.2)'
                    e.currentTarget.style.borderColor = '#7c3aed'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <span style={styles.giftItemIcon}>{gift.icon}</span>
                  <span style={styles.giftItemName}>{gift.name}</span>
                  <span style={styles.giftItemPrice}>💰 {gift.coins}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}