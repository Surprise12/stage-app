import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PostAnalytics({ postId }) {
  const [views, setViews] = useState([])
  const [viewCount, setViewCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
    recordView()
  }, [])

  async function loadAnalytics() {
    const { data } = await supabase
      .from('post_views')
      .select(`
        *,
        user:user_id (id, username, display_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('viewed_at', { ascending: false })

    if (data) {
      setViews(data)
      setViewCount(data.length)
    }
    setLoading(false)
  }

  async function recordView() {
    await supabase
      .from('post_views')
      .insert({ post_id: postId, user_id: (await supabase.auth.getUser()).data.user?.id })
      .select()
  }

  return (
    <div className="glass-card" style={{ padding: '16px', marginTop: '16px' }}>
      <h4>📊 Post Analytics</h4>
      <div style={{ marginTop: '12px' }}>
        <div>👁️ Total Views: {viewCount}</div>
        <div>❤️ Applause: {post.applause_count || 0}</div>
        <div>💬 Comments: {post.comment_count || 0}</div>
        <div>🔄 Reposts: {post.repost_count || 0}</div>
      </div>
    </div>
  )
}