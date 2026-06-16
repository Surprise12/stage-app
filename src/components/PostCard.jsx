// src/components/PostCard.jsx
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function PostCard({ post, session, onPostUpdate }) {
  const navigate = useNavigate()
  const [showComments, setShowComments] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState([])
  const [hasLiked, setHasLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.applause_count || 0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [repostCount, setRepostCount] = useState(post.repost_count || 0)
  const [hasReposted, setHasReposted] = useState(false)
  const commentsEndRef = useRef(null)

  const postUser = post.profiles || {}
  const isOwner = session?.user?.id === post.user_id

  useEffect(() => {
    checkLikeStatus()
    checkRepostStatus()
  }, [])

  useEffect(() => {
    if (showComments && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  async function checkLikeStatus() {
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('post_id', post.id)
      .single()
    setHasLiked(!!data)
  }

  async function checkRepostStatus() {
    const { data } = await supabase
      .from('reposts')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('post_id', post.id)
      .single()
    setHasReposted(!!data)
  }

  async function handleLike() {
    if (hasLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', session.user.id)
        .eq('post_id', post.id)
      setLikeCount(prev => prev - 1)
      setHasLiked(false)
    } else {
      await supabase
        .from('post_likes')
        .insert({ user_id: session.user.id, post_id: post.id })
      setLikeCount(prev => prev + 1)
      setHasLiked(true)
    }
    onPostUpdate()
  }

  async function handleRepost() {
    if (hasReposted) {
      await supabase
        .from('reposts')
        .delete()
        .eq('user_id', session.user.id)
        .eq('post_id', post.id)
      setRepostCount(prev => prev - 1)
      setHasReposted(false)
    } else {
      await supabase
        .from('reposts')
        .insert({ user_id: session.user.id, post_id: post.id })
      setRepostCount(prev => prev + 1)
      setHasReposted(true)
    }
    onPostUpdate()
  }

  async function loadComments() {
    if (comments.length > 0) {
      setShowComments(!showComments)
      return
    }
    
    const { data } = await supabase
      .from('comments')
      .select(`*, profiles:user_id(id, username, display_name, avatar_url, is_verified)`)
      .eq('post_id', post.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
    
    if (data) setComments(data)
    setShowComments(true)
  }

  async function submitComment() {
    if (!newComment.trim()) return
    
    await supabase
      .from('comments')
      .insert({
        user_id: session.user.id,
        post_id: post.id,
        content: newComment
      })
    
    setNewComment('')
    await loadComments()
    onPostUpdate()
  }

  async function deletePost() {
    if (confirm('Are you sure you want to delete this post?')) {
      await supabase.from('posts').delete().eq('id', post.id)
      onPostUpdate()
    }
  }

  async function updatePost() {
    if (!editContent.trim()) return
    
    await supabase
      .from('posts')
      .update({ content: editContent })
      .eq('id', post.id)
    
    setIsEditing(false)
    onPostUpdate()
  }

  async function handleReaction(emoji) {
    // Send reaction via post_likes with reaction type
    await supabase
      .from('post_reactions')
      .upsert({
        user_id: session.user.id,
        post_id: post.id,
        reaction: emoji
      }, { onConflict: 'user_id, post_id' })
    
    setShowReactions(false)
    onPostUpdate()
  }

  function handleShare(platform) {
    const url = `${window.location.origin}/post/${post.id}`
    const text = encodeURIComponent(`Check out this post by ${postUser.display_name || postUser.username} on SocialVibe!`)
    
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
    setShowShareModal(false)
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
    <div className="post-card" style={{ position: 'relative' }}>
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author" onClick={() => navigate(`/profile/${post.user_id}`)}>
          <div className="post-author-avatar">
            <img src={postUser.avatar_url || `https://ui-avatars.com/api/?name=${(postUser.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
          </div>
          <div className="post-author-info">
            <div className="post-author-name">
              {postUser.display_name || postUser.username}
              {postUser.is_verified && <span style={{ color: '#1da1f2', fontSize: '14px' }}>✓</span>}
            </div>
            <div className="post-time">{formatTimeAgo(post.created_at)}</div>
          </div>
        </div>
        {isOwner && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="cover-btn" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button className="cover-btn" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={() => setShowAnalytics(!showAnalytics)}>
              📊
            </button>
            <button className="cover-btn" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={deletePost}>
              Delete
            </button>
          </div>
        )}
      </div>
      
      {/* Post Content */}
      {isEditing ? (
        <div style={{ marginBottom: '16px' }}>
          <textarea 
            className="input" 
            value={editContent} 
            onChange={(e) => setEditContent(e.target.value)} 
            rows="3"
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn btn-primary btn-small" onClick={updatePost}>Save</button>
            <button className="btn btn-secondary btn-small" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="post-content">{post.content}</div>
          {post.image_urls?.[0] && (
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <img src={post.image_urls[0]} style={{ width: '100%', borderRadius: '12px' }} alt="post" />
              <button 
                className="view-original-btn" 
                onClick={() => window.open(post.image_urls[0], '_blank')}
                style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer' }}
              >
                View Original
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Post Stats */}
      <div className="post-stats">
        <span><i className="fas fa-heart"></i> {likeCount} likes</span>
        <span><i className="fas fa-comment"></i> {post.comment_count || 0} comments</span>
        <span><i className="fas fa-retweet"></i> {repostCount} reposts</span>
      </div>
      
      {/* Post Actions */}
      <div className="post-actions">
        <div 
          className={`post-action-btn ${hasLiked ? 'liked' : ''}`} 
          onClick={handleLike}
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
        >
          <i className="fas fa-thumbs-up"></i> Like
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
        <div className="post-action-btn" onClick={loadComments}>
          <i className="fas fa-comment"></i> Comment
        </div>
        <div className="post-action-btn" onClick={() => setShowShareModal(true)}>
          <i className="fas fa-share"></i> Share
        </div>
        <div className={`post-action-btn ${hasReposted ? 'liked' : ''}`} onClick={handleRepost}>
          <i className="fas fa-retweet"></i> Repost
        </div>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          <div className="add-comment">
            <div className="comment-avatar">
              <img src={session?.user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
            </div>
            <input 
              type="text" 
              className="comment-input" 
              placeholder="Write a comment..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitComment()}
            />
          </div>
          
          {comments.map(comment => (
            <div key={comment.id} className="comment" onClick={() => navigate(`/profile/${comment.user_id}`)}>
              <div className="comment-avatar">
                <img src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(comment.profiles?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              </div>
              <div className="comment-bubble">
                <div className="comment-author">
                  {comment.profiles?.display_name || comment.profiles?.username}
                  {comment.profiles?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                </div>
                <div className="comment-text">{comment.content}</div>
                <div className="comment-time">{formatTimeAgo(comment.created_at)}</div>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No comments yet. Be the first!</p>
          )}
          <div ref={commentsEndRef} />
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowShareModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Share to...</div>
            <div className="dropdown-item" onClick={() => handleShare('facebook')}>
              <i className="fab fa-facebook" style={{ color: '#1877f2', width: '24px' }}></i> Facebook
            </div>
            <div className="dropdown-item" onClick={() => handleShare('twitter')}>
              <i className="fab fa-twitter" style={{ color: '#000', width: '24px' }}></i> Twitter
            </div>
            <div className="dropdown-item" onClick={() => handleShare('whatsapp')}>
              <i className="fab fa-whatsapp" style={{ color: '#25d366', width: '24px' }}></i> WhatsApp
            </div>
            <div className="dropdown-divider"></div>
            <div className="dropdown-item" onClick={() => handleShare('copy')}>
              <i className="fas fa-link" style={{ width: '24px' }}></i> Copy Link
            </div>
            <div className="dropdown-item" onClick={() => handleShare('post')}>
              <i className="fas fa-home" style={{ width: '24px' }}></i> Share to Feed
            </div>
            <button className="secondary-btn" style={{ marginTop: '16px', width: '100%' }} onClick={() => setShowShareModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowAnalytics(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📊 Post Analytics</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>{likeCount}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Likes</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{post.comment_count || 0}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Comments</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{repostCount}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Reposts</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f5f5', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{post.views_count || 0}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Views</div>
              </div>
            </div>
            <button className="secondary-btn" style={{ width: '100%' }} onClick={() => setShowAnalytics(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}