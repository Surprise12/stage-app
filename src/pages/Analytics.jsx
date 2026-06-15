// src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Analytics({ session }) {
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    applause: 0,
    earnings: 0,
    pendingEarnings: 0,
    tips: 0,
    views: 0,
    beatSales: 0,
    gigEarnings: 0,
    streamRevenue: 0
  })
  const [earningsList, setEarningsList] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')
  const [topPosts, setTopPosts] = useState([])
  const [topVideos, setTopVideos] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [dailyStats, setDailyStats] = useState([])

  useEffect(() => {
    loadAnalytics()
    loadTopContent()
    loadDailyStats()
  }, [timeRange])

  async function loadAnalytics() {
    setLoading(true)
    
    // Get user's posts count and applause
    const { data: posts } = await supabase
      .from('posts')
      .select('applause_count, created_at')
      .eq('user_id', session.user.id)
    
    const totalApplause = posts?.reduce((sum, p) => sum + (p.applause_count || 0), 0) || 0
    
    // Get followers count
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', session.user.id)
    
    // Get following count
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', session.user.id)
    
    // Get video views
    const { data: videos } = await supabase
      .from('videos')
      .select('views_count')
      .eq('user_id', session.user.id)
    
    const totalViews = videos?.reduce((sum, v) => sum + (v.views_count || 0), 0) || 0
    
    // Get earnings
    const { data: earnings } = await supabase
      .from('earnings')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    
    const totalEarnings = earnings?.reduce((sum, e) => sum + e.amount, 0) || 0
    const pendingEarnings = earnings?.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0) || 0
    
    // Get tips received
    const { data: tips } = await supabase
      .from('tips')
      .select('amount')
      .eq('recipient_id', session.user.id)
    
    const totalTips = tips?.reduce((sum, t) => sum + t.amount, 0) || 0
    
    // Get beat sales
    const { data: beats } = await supabase
      .from('beats')
      .select('purchases_count, price')
      .eq('user_id', session.user.id)
    
    const beatSales = beats?.reduce((sum, b) => sum + (b.purchases_count || 0) * (b.price || 0), 0) || 0
    
    // Get gig earnings
    const { data: gigs } = await supabase
      .from('gigs')
      .select('price, is_paid')
      .eq('user_id', session.user.id)
    
    const gigEarnings = gigs?.filter(g => g.is_paid).reduce((sum, g) => sum + (g.price || 0), 0) || 0
    
    // Get subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()
    
    setStats({
      posts: posts?.length || 0,
      followers: followers || 0,
      following: following || 0,
      applause: totalApplause,
      earnings: totalEarnings,
      pendingEarnings: pendingEarnings,
      tips: totalTips,
      views: totalViews,
      beatSales: beatSales,
      gigEarnings: gigEarnings,
      streamRevenue: 0
    })
    setEarningsList(earnings || [])
    setSubscription(sub)
    setLoading(false)
  }

  async function loadTopContent() {
    // Get top posts by applause
    const { data: topPostsData } = await supabase
      .from('posts')
      .select('id, content, applause_count, created_at')
      .eq('user_id', session.user.id)
      .order('applause_count', { ascending: false })
      .limit(5)
    
    if (topPostsData) setTopPosts(topPostsData)
    
    // Get top videos by views
    const { data: topVideosData } = await supabase
      .from('videos')
      .select('id, title, views_count, created_at')
      .eq('user_id', session.user.id)
      .order('views_count', { ascending: false })
      .limit(5)
    
    if (topVideosData) setTopVideos(topVideosData)
  }

  async function loadDailyStats() {
    // Calculate daily engagement for the last 7 days
    const daily = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())
      
      const { count: followersGained } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', session.user.id)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())
      
      daily.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        posts: postsCount || 0,
        followers: followersGained || 0
      })
    }
    setDailyStats(daily)
  }

  async function upgradeToPro() {
    alert('Stripe payment would open here.\n\nPro Plan: $8/month\n- Unlimited posts\n- Advanced analytics\n- Priority support\n- Lower transaction fees')
    
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: session.user.id,
        tier: 'pro',
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    
    if (!error) {
      alert('Upgraded to Pro!')
      loadAnalytics()
    }
  }

  async function upgradeToCreatorPro() {
    alert('Creator Pro: $15/month\n- Everything in Pro\n- 0% transaction fees\n- Featured placement\n- Verified badge priority')
    
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: session.user.id,
        tier: 'creator_pro',
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    
    if (!error) {
      alert('Upgraded to Creator Pro!')
      loadAnalytics()
    }
  }

  async function requestPayout() {
    alert('Payout request submitted! Funds will be sent to your connected account within 3-5 business days.')
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return <div className="spinner"></div>
  }

  const maxDailyValue = Math.max(...dailyStats.map(d => Math.max(d.posts, d.followers)), 1)

  return (
    <div className="container" style={{ marginTop: '30px', maxWidth: '1000px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '8px' }}>📊 Analytics Dashboard</h1>
      <p style={{ color: '#888', marginBottom: '20px' }}>Track your performance and earnings</p>
      
      {/* Time Range Selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div className="tabs" style={{ borderBottom: 'none', gap: '4px' }}>
          <div className={`tab ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>Week</div>
          <div className={`tab ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>Month</div>
          <div className={`tab ${timeRange === 'year' ? 'active' : ''}`} onClick={() => setTimeRange('year')}>Year</div>
          <div className={`tab ${timeRange === 'all' ? 'active' : ''}`} onClick={() => setTimeRange('all')}>All Time</div>
        </div>
      </div>
      
      {/* Main Stats Grid */}
      <div className="grid-2" style={{ marginBottom: '30px', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        <div className="analytics-card">
          <div className="analytics-number">{stats.posts}</div>
          <div className="analytics-label">Total Posts</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{stats.applause.toLocaleString()}</div>
          <div className="analytics-label">Total Applause</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{stats.followers.toLocaleString()}</div>
          <div className="analytics-label">Followers</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{stats.views.toLocaleString()}</div>
          <div className="analytics-label">Video Views</div>
        </div>
      </div>
      
      {/* Earnings Stats */}
      <div className="grid-2" style={{ marginBottom: '30px' }}>
        <div className="analytics-card" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
          <div className="analytics-number">{formatCurrency(stats.earnings)}</div>
          <div className="analytics-label">Total Earnings</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#ffc371' }}>
            💰 Beat Sales: {formatCurrency(stats.beatSales)} | 🎪 Gigs: {formatCurrency(stats.gigEarnings)}
          </div>
        </div>
        <div className="analytics-card" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
          <div className="analytics-number">{formatCurrency(stats.pendingEarnings)}</div>
          <div className="analytics-label">Pending Payout</div>
          {stats.pendingEarnings > 0 && (
            <button className="btn btn-primary btn-small" style={{ marginTop: '12px', padding: '6px 12px' }} onClick={requestPayout}>
              Request Payout
            </button>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </div>
        <div className={`tab ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>
          Earnings
        </div>
        <div className={`tab ${activeTab === 'top-content' ? 'active' : ''}`} onClick={() => setActiveTab('top-content')}>
          Top Content
        </div>
        <div className={`tab ${activeTab === 'subscription' ? 'active' : ''}`} onClick={() => setActiveTab('subscription')}>
          Subscription
        </div>
      </div>
      
      {/* Overview Tab - Daily Activity Chart */}
      {activeTab === 'overview' && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '16px' }}>📈 Daily Activity (Last 7 Days)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px', padding: '20px 0' }}>
            {dailyStats.map(day => (
              <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '100%', background: '#7c3aed', borderRadius: '4px', height: `${(day.posts / maxDailyValue) * 150}px`, minHeight: '4px' }}></div>
                  <div style={{ width: '100%', background: '#ec4899', borderRadius: '4px', height: `${(day.followers / maxDailyValue) * 150}px`, minHeight: '4px' }}></div>
                </div>
                <div style={{ fontSize: '11px', color: '#888', textAlign: 'center' }}>{day.date}</div>
                <div style={{ fontSize: '9px', color: '#666' }}>
                  📝{day.posts} | 👥{day.followers}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '12px' }}>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#7c3aed', borderRadius: '2px', marginRight: '4px' }}></span> Posts</span>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ec4899', borderRadius: '2px', marginRight: '4px' }}></span> New Followers</span>
          </div>
        </div>
      )}
      
      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>💰 Earnings History</h3>
          {earningsList.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>No earnings yet</p>
          ) : (
            <div>
              {earningsList.map(earning => (
                <div key={earning.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{earning.source}</div>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>{new Date(earning.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#4caf50', fontWeight: 'bold' }}>+{formatCurrency(earning.amount)}</div>
                    <div style={{ fontSize: '0.7rem', color: earning.status === 'paid' ? '#4caf50' : '#ff9800' }}>
                      {earning.status === 'paid' ? 'Paid ✓' : 'Pending'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Top Content Tab */}
      {activeTab === 'top-content' && (
        <div className="grid-2" style={{ gap: '20px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>🔥 Top Posts</h3>
            {topPosts.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No posts yet</p>
            ) : (
              topPosts.map((post, index) => (
                <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', background: index < 3 ? '#ff9800' : '#666', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>{index + 1}</div>
                    <div>
                      <div style={{ fontWeight: '500' }}>{post.content.substring(0, 40)}...</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{new Date(post.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ color: '#7c3aed', fontWeight: 'bold' }}>👏 {post.applause_count || 0}</div>
                </div>
              ))
            )}
          </div>
          
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>🎬 Top Videos</h3>
            {topVideos.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No videos yet</p>
            ) : (
              topVideos.map((video, index) => (
                <div key={video.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', background: index < 3 ? '#ff9800' : '#666', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>{index + 1}</div>
                    <div>
                      <div style={{ fontWeight: '500' }}>{video.title.substring(0, 40)}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{new Date(video.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ color: '#7c3aed', fontWeight: 'bold' }}>👁️ {video.views_count || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>⭐ Premium Subscription</h3>
          
          {subscription ? (
            <div>
              <div style={{ background: '#f0f2f5', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <p>Current plan: <strong>{subscription.tier === 'pro' ? 'Pro' : 'Creator Pro'}</strong></p>
                <p>Expires: {new Date(subscription.expires_at).toLocaleDateString()}</p>
                {subscription.tier === 'creator_pro' && (
                  <p style={{ color: '#ff9800', fontSize: '13px', marginTop: '8px' }}>✨ 0% transaction fees • Featured placement • Priority support</p>
                )}
              </div>
              <button className="btn btn-secondary">Manage Subscription</button>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '16px', color: '#888' }}>
                Upgrade to unlock premium features, advanced analytics, and lower transaction fees.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: 1, textAlign: 'center', padding: '20px' }}>
                  <h4>Pro Plan</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>$8<span style={{ fontSize: '14px' }}>/mo</span></p>
                  <ul style={{ textAlign: 'left', marginTop: '12px', paddingLeft: '20px' }}>
                    <li>Unlimited posts</li>
                    <li>Advanced analytics</li>
                    <li>Priority support</li>
                    <li>Lower transaction fees</li>
                  </ul>
                  <button className="btn btn-primary btn-small" style={{ marginTop: '16px', width: '100%' }} onClick={upgradeToPro}>
                    Upgrade to Pro
                  </button>
                </div>
                <div className="card" style={{ flex: 1, textAlign: 'center', padding: '20px', border: '2px solid #ff9800' }}>
                  <h4>Creator Pro</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>$15<span style={{ fontSize: '14px' }}>/mo</span></p>
                  <ul style={{ textAlign: 'left', marginTop: '12px', paddingLeft: '20px' }}>
                    <li>Everything in Pro</li>
                    <li>0% transaction fees</li>
                    <li>Featured placement</li>
                    <li>Verified badge priority</li>
                  </ul>
                  <button className="btn btn-primary btn-small" style={{ marginTop: '16px', width: '100%', background: '#ff9800' }} onClick={upgradeToCreatorPro}>
                    Upgrade to Creator Pro
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}