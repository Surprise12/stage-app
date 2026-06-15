import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PostCard({ post, session, onPostUpdate }) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState([])
  const [hasLiked, setHasLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.applause_count || 0)

  const postUser = post.profiles || {}
  const isOwner = session?.user?.id === post.user_id

  useEffect(() => {
    checkLikeStatus()
  }, [])

  async function checkLikeStatus() {
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('post_id', post.id)
      .single()
    setHasLiked(!!data)
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

  function formatTimeAgo(date) {
    if (!date) return 'just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-author">
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
          <button className="cover-btn" style={{ padding: '4px 12px', fontSize: '11px' }}>...</button>
        )}
      </div>
      
      <div className="post-content">{post.content}</div>
      
      {post.image_urls?.[0] && (
        <div style={{ marginBottom: '16px' }}>
          <img src={post.image_urls[0]} style={{ width: '100%', borderRadius: '12px' }} alt="post" />
        </div>
      )}
      
      <div className="post-stats">
        <span><i className="fas fa-heart"></i> {likeCount} likes</span>
        <span><i className="fas fa-comment"></i> {post.comment_count || 0} comments</span>
        <span><i className="fas fa-share"></i> {post.shares || 0} shares</span>
      </div>
      
      <div className="post-actions">
        <div className={`post-action-btn ${hasLiked ? 'liked' : ''}`} onClick={handleLike}>
          <i className="fas fa-thumbs-up"></i> Like
        </div>
        <div className="post-action-btn" onClick={loadComments}>
          <i className="fas fa-comment"></i> Comment
        </div>
        <div className="post-action-btn">
          <i className="fas fa-share"></i> Share
        </div>
      </div>
      
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
            <div key={comment.id} className="comment">
              <div className="comment-avatar">
                <img src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(comment.profiles?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
              </div>
              <div className="comment-bubble">
                <div className="comment-author">{comment.profiles?.display_name || comment.profiles?.username}</div>
                <div className="comment-text">{comment.content}</div>
                <div className="comment-time">{formatTimeAgo(comment.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}