// src/components/StoriesViewer.jsx
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
  const progressRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    loadStories()
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
      // For demo, using mock data
      const mockStories = [
        { id: 1, user_id: userId, content: 'https://picsum.photos/400/700?random=1', type: 'image', created_at: new Date() },
        { id: 2, user_id: userId, content: 'https://picsum.photos/400/700?random=2', type: 'image', created_at: new Date() },
        { id: 3, user_id: userId, content: 'https://picsum.photos/400/700?random=3', type: 'video', created_at: new Date() },
      ]
      setStories(mockStories)
    } catch (error) {
      console.error('Error loading stories:', error)
    }
    setLoading(false)
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
    }, 50) // 5 seconds per story
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
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)'
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
      overflow: 'hidden'
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
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer'
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
      justifyContent: 'center',
      objectFit: 'contain'
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
        <button onClick={closeViewer} style={{ color: 'white', marginTop: '20px', background: 'none', border: '1px solid white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
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
          <div style={styles.time}>{new Date(currentStory.created_at).toLocaleTimeString()}</div>
        </div>
        <button style={styles.closeBtn} onClick={closeViewer}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Story Content */}
      <div style={styles.storyContent}>
        {currentStory.type === 'video' ? (
          <video 
            src={currentStory.content} 
            style={styles.storyImage} 
            autoPlay 
            muted 
            playsInline
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
    </div>
  )
}