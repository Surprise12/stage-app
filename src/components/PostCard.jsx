import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PostCard({ post, session, onPostUpdate }) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [repostComment, setRepostComment] = useState('')
  const [hasLiked, setHasLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const postUser = post.profiles || {}
  const isOwner = session?.user?.id === post.user_id

  // Check if user has liked this post
  useEffect(() => {
    async function checkLike() {
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('post_id', post.id)
        .single()
      setHasLiked(!!data)
    }
    checkLike()
  }, [post.id, session.user.id])

  // Check if post is saved
  useEffect(() => {
    async function checkSaved() {
      const { data } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('post_id', post.id)
        .single()
      setIsSaved(!!data)
    }
    checkSaved()
  }, [post.id, session.user.id])

  async function handleLike() {
    if (hasLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', session.user.id)
        .eq('post_id', post.id)
      setHasLiked(false)
    } else {
      await supabase
        .from('post_likes')
        .insert({ user_id: session.user.id, post_id: post.id })
      setHasLiked(true)
    }
    onPostUpdate()
  }

  async function handleSave() {
    if (isSaved) {
      await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', session.user.id)
        .eq('post_id', post.id)
      setIsSaved(false)
    } else {
      await supabase
        .from('saved_posts')
        .insert({ user_id: session.user.id, post_id: post.id })
      setIsSaved(true)
    }
  }

  async function handleSpark() {
    const newCount = (post.sparks_count || 0) + 1
    await supabase
      .from('posts')
      .update({ sparks_count: newCount })
      .eq('id', post.id)
    onPostUpdate()
  }

  async function handleDelete() {
    if (confirm('Are you sure you want to delete this post?')) {
      if (post.image_urls && post.image_urls[0]) {
        const imagePath = post.image_urls[0].split('/').pop()
        await supabase.storage.from('post-images').remove([`${post.user_id}/${imagePath}`])
      }
      
      await supabase.from('posts').delete().eq('id', post.id)
      onPostUpdate()
    }
  }

  async function handleEdit() {
    if (!editContent.trim()) return
    
    await supabase
      .from('posts')
      .update({ content: editContent })
      .eq('id', post.id)
    
    setIsEditing(false)
    onPostUpdate()
  }

  async function loadComments() {
    if (comments.length > 0) {
      setShowComments(!showComments)
      return
    }
    
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
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
      .eq('post_id', post.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
    
    if (data) setComments(data)
    setLoadingComments(false)
    setShowComments(true)
  }

  async function submitComment() {
    if (!newComment.trim()) return
    
    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: session.user.id,
        post_id: post.id,
        content: newComment
      })
    
    if (!error) {
      setNewComment('')
      await loadComments()
      onPostUpdate()
    }
  }

  async function handleRepost() {
    const { error } = await supabase
      .from('reposts')
      .insert({
        user_id: session.user.id,
        post_id: post.id,
        comment: repostComment || null
      })
    
    if (!error) {
      alert('Post reposted!')
      setShowRepostModal(false)
      setRepostComment('')
      onPostUpdate()
    } else {
      alert('Error: ' + error.message)
    }
  }

  function viewOriginalImage(url) {
    const modal = document.createElement('div')
    modal.className = 'modal'
    modal.style.display = 'flex'
    modal.innerHTML = `
      <span class="close-modal">&times;</span>
      <div class="modal-content">
        <img src="${url}" alt="Original quality image" style="max-width: 100%; max-height: 80vh;">
        <p style="color: white; text-align: center; margin-top: 12px;">Original quality preserved — no compression</p>
      </div>
    `
    document.body.appendChild(modal)
    modal.querySelector('.close-modal').onclick = () => modal.remove()
    modal.onclick = (e) => { if (e.target === modal) modal.remove() }
  }

  function sharePost() {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this post on Stage!',
        text: post.content,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
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
    <div className="post-card" style={{ marginBottom: '20px' }}>
      {/* Post Header */}
      <div className="post-header">
        <img 
          src={postUser.avatar_url || `https://ui-avatars.com/api/?name=${(postUser.username || 'U')[0]}&background=7c3aed&color=fff`} 
          className="post-avatar" 
          alt="avatar"
        />
        <div>
          <div className="post-name">
            {postUser.display_name || postUser.username}
            {postUser.is_verified && <span style={{ color: '#3b82f6', marginLeft: '4px' }}>✓</span>}
          </div>
          <div className="post-time">{formatTimeAgo(post.created_at)}</div>
        </div>
        {isOwner && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline btn-small" onClick={() => setIsEditing(true)}>Edit</button>
            <button className="btn btn-outline btn-small" onClick={handleDelete} style={{ borderColor: '#ef4444', color: '#ef4444' }}>Delete</button>
          </div>
        )}
      </div>
      
      {/* Post Content */}
      {isEditing ? (
        <div>
          <textarea
            className="input-modern"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows="3"
            style={{ marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary btn-small" onClick={handleEdit}>Save</button>
            <button className="btn btn-secondary btn-small" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="post-content">
            <p>{post.content}</p>
            {post.image_urls && post.image_urls[0] && (
              <div className="post-image-container">
                <img src={post.image_urls[0]} className="post-image" alt="post" />
                <button className="view-original-btn" onClick={() => viewOriginalImage(post.image_urls[0])}>
                  🔍 View Original
                </button>
              </div>
            )}
          </div>
          
          {/* Post Actions */}
          <div className="post-actions">
            <button className={`action-btn ${hasLiked ? 'active' : ''}`} onClick={handleLike}>
              👏 {post.applause_count || 0}
            </button>
            <button className="action-btn" onClick={handleSpark}>
              ✨ {post.sparks_count || 0}
            </button>
            <button className="action-btn" onClick={loadComments}>
              💬 {post.comment_count || 0}
            </button>
            <button className="action-btn" onClick={() => setShowRepostModal(true)}>
              🔁 Repost
            </button>
            <button className="action-btn" onClick={handleSave}>
              {isSaved ? '💾 Saved' : '💾 Save'}
            </button>
            <button className="action-btn" onClick={sharePost}>
              📤 Share
            </button>
          </div>
        </>
      )}
      
      {/* Comments Section */}
      {showComments && (
        <div className="comments-section">
          <div className="comment-input" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <textarea
              className="input-modern"
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
                src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(comment.profiles?.username || 'U')[0]}&background=7c3aed&color=fff`} 
                className="comment-avatar" 
                alt="avatar"
              />
              <div className="comment-content">
                <div className="comment-name">
                  {comment.profiles?.display_name || comment.profiles?.username}
                  {comment.profiles?.is_verified && <span style={{ color: '#3b82f6', marginLeft: '4px' }}>✓</span>}
                </div>
                <div className="comment-text">{comment.content}</div>
                <div className="comment-time">{formatTimeAgo(comment.created_at)}</div>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && !loadingComments && (
            <p style={{ textAlign: 'center', color: '#888', padding: '16px' }}>No comments yet. Be the first!</p>
          )}
        </div>
      )}
      
      {/* Repost Modal */}
      {showRepostModal && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowRepostModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px', background: '#141414', padding: '24px', borderRadius: '20px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', color: 'white' }}>Repost this</h3>
            <textarea
              className="input-modern"
              placeholder="Add a comment (optional)..."
              value={repostComment}
              onChange={(e) => setRepostComment(e.target.value)}
              rows="3"
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowRepostModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRepost}>Repost</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}