// src/components/PostAnalytics.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PostAnalytics({ postId, onClose }) {
  const [views, setViews] = useState([])
  const [viewCount, setViewCount] = useState(0)
  const [uniqueViewers, setUniqueViewers] = useState(0)
  const [engagementRate, setEngagementRate] = useState(0)
  const [dailyViews, setDailyViews] = useState([])
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState(null)
  const [timeRange, setTimeRange] = useState('week')
  const [showViewers, setShowViewers] = useState(false)

  useEffect(() => {
    loadAnalytics()
    recordView()
    loadPostData()
  }, [postId, timeRange])

  async function loadPostData() {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .eq('id', postId)
      .single()
    if (data) setPost(data)
  }

  async function loadAnalytics() {
    setLoading(true)
    
    // Load views with user info
    const { data: viewsData } = await supabase
      .from('post_views')
      .select(`
        *,
        user:user_id (id, username, display_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('viewed_at', { ascending: false })
      .limit(100)

    if (viewsData) {
      setViews(viewsData)
      setViewCount(viewsData.length)
      
      // Count unique viewers
      const uniqueUsers = new Set(viewsData.map(v => v.user_id))
      setUniqueViewers(uniqueUsers.size)
      
      // Calculate engagement rate (views / interactions)
      if (post) {
        const interactions = (post.applause_count || 0) + (post.comment_count || 0)
        setEngagementRate(viewsData.length > 0 ? (interactions / viewsData.length) * 100 : 0)
      }
      
      // Calculate daily views for chart
      const dailyData = {}
      viewsData.forEach(view => {
        const date = new Date(view.viewed_at).toLocaleDateString()
        dailyData[date] = (dailyData[date] || 0) + 1
      })
      
      // Get last 7 days
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString()
        last7Days.push({
          date: dateStr,
          views: dailyData[dateStr] || 0
        })
      }
      setDailyViews(last7Days)
    }
    
    setLoading(false)
  }

  async function recordView() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('post_views')
        .insert({ post_id: postId, user_id: user.id })
        .select()
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

  const maxViews = Math.max(...dailyViews.map(d => d.views), 1)

  if (loading || !post) {
    return <div className="card" style={{ padding: '20px' }}><div className="spinner"></div></div>
  }

  return (
    <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0 }}>📊 Post Analytics</h4>
        {onClose && (
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>{viewCount}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Total Views</div>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{uniqueViewers}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Unique Viewers</div>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{post.applause_count || 0}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Applause</div>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{engagementRate.toFixed(1)}%</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Engagement Rate</div>
        </div>
      </div>

      {/* Daily Views Chart */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>📈 Daily Views</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-secondary'} btn-small`}
              onClick={() => setTimeRange('week')}
              style={{ padding: '4px 12px', fontSize: '11px' }}
            >
              Week
            </button>
            <button 
              className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-secondary'} btn-small`}
              onClick={() => setTimeRange('month')}
              style={{ padding: '4px 12px', fontSize: '11px' }}
            >
              Month
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px', padding: '8px 0' }}>
          {dailyViews.map((day, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ 
                width: '100%', 
                background: '#7c3aed', 
                borderRadius: '4px', 
                height: `${(day.views / maxViews) * 60}px`,
                minHeight: '4px',
                transition: 'height 0.3s'
              }}></div>
              <div style={{ fontSize: '8px', color: '#888', textAlign: 'center' }}>
                {day.date.split('/')[0]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button 
          className="btn btn-secondary btn-small" 
          onClick={() => setShowViewers(!showViewers)}
        >
          <i className="fas fa-users"></i> Viewers ({viewCount})
        </button>
        <button className="btn btn-secondary btn-small">
          <i className="fas fa-download"></i> Export
        </button>
        <button className="btn btn-secondary btn-small">
          <i className="fas fa-share"></i> Share Stats
        </button>
      </div>

      {/* Viewers List */}
      {showViewers && (
        <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
          <h5 style={{ marginBottom: '12px', fontSize: '14px' }}>Recent Viewers</h5>
          {views.slice(0, 20).map(view => (
            <div key={view.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderBottom: '1px solid #f0f2f5' }}>
              <img 
                src={view.user?.avatar_url || `https://ui-avatars.com/api/?name=${(view.user?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                alt="avatar" 
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{view.user?.display_name || view.user?.username || 'Anonymous'}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>{formatTimeAgo(view.viewed_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Engagement Summary */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(236,73,153,0.05))', 
        borderRadius: '12px', 
        padding: '16px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>💡 Engagement Summary</span>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              {viewCount > 0 
                ? `This post has ${viewCount} views with ${engagementRate.toFixed(1)}% engagement rate` 
                : 'No views yet. Share your post to get more visibility!'}
            </p>
          </div>
          <span className="badge-small" style={{ background: engagementRate > 5 ? '#10b981' : '#f59e0b', color: 'white' }}>
            {engagementRate > 5 ? '🟢 High Engagement' : '🟡 Growing'}
          </span>
        </div>
      </div>

      {/* Post Preview */}
      <div style={{ 
        background: '#f5f5f5', 
        borderRadius: '12px', 
        padding: '12px',
        marginBottom: '8px'
      }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Post Preview</div>
        <p style={{ fontSize: '14px', margin: 0 }}>{post.content?.substring(0, 100)}</p>
        {post.image_urls?.[0] && (
          <img src={post.image_urls[0]} style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} alt="" />
        )}
      </div>
    </div>
  )
}