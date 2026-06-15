import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function VideoPlayer({ video, session, onClose, onUpdate, onLike, onView }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)

  useEffect(() => {
    loadComments()
    checkLike()
    onView(video.id)
  }, [])

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
      // Update comment count in parent
      await supabase
        .from('videos')
        .update({ comment_count: comments.length + 1 })
        .eq('id', video.id)
      onUpdate()
    }
  }

  async function handleLike() {
    await onLike(video.id, video.applause_count)
    setHasLiked(!hasLiked)
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

  return (
    <div className="modal" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '900px', width: '90%', background: '#0a0a0a' }} onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={onClose}>&times;</span>
        
        {/* Video Player */}
        <video 
          controls 
          autoPlay 
          style={{ width: '100%', borderRadius: '16px', maxHeight: '60vh' }}
          src={video.video_url}
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Video Info */}
        <div style={{ padding: '20px 0' }}>
          <h2 style={{ marginBottom: '8px' }}>{video.title}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={video.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(video.profiles?.username || 'U')[0]}&background=ff5f6d&color=fff`}
                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                alt="avatar"
              />
              <div>
                <div style={{ fontWeight: '600' }}>
                  {video.profiles?.display_name || video.profiles?.username}
                  {video.profiles?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>{formatTimeAgo(video.created_at)}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                className={`action-btn ${hasLiked ? 'active' : ''}`} 
                onClick={handleLike}
                style={{ fontSize: '1rem' }}
              >
                👏 {video.applause_count || 0}
              </button>
              {video.youtube_url && (
                <button 
                  className="btn btn-outline btn-small"
                  onClick={() => window.open(video.youtube_url, '_blank')}
                >
                  ▶️ YouTube
                </button>
              )}
            </div>
          </div>
          
          {video.description && (
            <p style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.5' }}>{video.description}</p>
          )}
        </div>
        
        {/* Comments Section */}
        <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Comments ({video.comment_count || 0})</h3>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <textarea
              className="input"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="2"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary btn-small" onClick={submitComment}>Post</button>
          </div>
          
          {loadingComments && <div className="spinner" style={{ width: '30px', height: '30px' }}></div>}
          
          {comments.map(comment => (
            <div key={comment.id} className="comment">
              <img 
                src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(comment.profiles?.username || 'U')[0]}&background=ff5f6d&color=fff`} 
                className="comment-avatar" 
                alt="avatar"
              />
              <div className="comment-content">
                <div className="comment-name">
                  {comment.profiles?.display_name || comment.profiles?.username}
                  {comment.profiles?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                </div>
                <div className="comment-text">{comment.content}</div>
                <div className="comment-time">{formatTimeAgo(comment.created_at)}</div>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && !loadingComments && (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  )
}