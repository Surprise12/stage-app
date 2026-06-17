// src/pages/Analytics.jsx - UPDATED WITH INLINE STYLES
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
    try {
      const { data: posts } = await supabase
        .from('posts')
        .select('applause_count, created_at')
        .eq('user_id', session.user.id)
      
      const totalApplause = posts?.reduce((sum, p) => sum + (p.applause_count || 0), 0) || 0
      
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', session.user.id)
      
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', session.user.id)
      
      const { data: videos } = await supabase
        .from('videos')
        .select('views_count')
        .eq('user_id', session.user.id)
      
      const totalViews = videos?.reduce((sum, v) => sum + (v.views_count || 0), 0) || 0
      
      const { data: earnings } = await supabase
        .from('earnings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      
      const totalEarnings = earnings?.reduce((sum, e) => sum + e.amount, 0) || 0
      const pendingEarnings = earnings?.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0) || 0
      
      const { data: tips } = await supabase
        .from('tips')
        .select('amount')
        .eq('recipient_id', session.user.id)
      
      const totalTips = tips?.reduce((sum, t) => sum + t.amount, 0) || 0
      
      const { data: beats } = await supabase
        .from('beats')
        .select('purchases_count, price')
        .eq('user_id', session.user.id)
      
      const beatSales = beats?.reduce((sum, b) => sum + (b.purchases_count || 0) * (b.price || 0), 0) || 0
      
      const { data: gigs } = await supabase
        .from('gigs')
        .select('price, is_paid')
        .eq('user_id', session.user.id)
      
      const gigEarnings = gigs?.filter(g => g.is_paid).reduce((sum, g) => sum + (g.price || 0), 0) || 0
      
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
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
    setLoading(false)
  }

  async function loadTopContent() {
    try {
      const { data: topPostsData } = await supabase
        .from('posts')
        .select('id, content, applause_count, created_at')
        .eq('user_id', session.user.id)
        .order('applause_count', { ascending: false })
        .limit(5)
      if (topPostsData) setTopPosts(topPostsData)
      
      const { data: topVideosData } = await supabase
        .from('videos')
        .select('id, title, views_count, created_at')
        .eq('user_id', session.user.id)
        .order('views_count', { ascending: false })
        .limit(5)
      if (topVideosData) setTopVideos(topVideosData)
    } catch (error) {
      console.error('Error loading top content:', error)
    }
  }

  async function loadDailyStats() {
    try {
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
    } catch (error) {
      console.error('Error loading daily stats:', error)
    }
  }

  async function upgradeToPro() {
    alert('Stripe payment would open here.\n\nPro Plan: $8/month\n- Unlimited posts\n- Advanced analytics\n- Priority support\n- Lower transaction fees')
    
    try {
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
    } catch (error) {
      console.error('Error upgrading:', error)
    }
  }

  async function upgradeToCreatorPro() {
    alert('Creator Pro: $15/month\n- Everything in Pro\n- 0% transaction fees\n- Featured placement\n- Verified badge priority')
    
    try {
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
    } catch (error) {
      console.error('Error upgrading:', error)
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

  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '700',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#6b7280',
      marginBottom: '20px',
      fontWeight: '700'
    },
    timeRange: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: '20px'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      borderBottom: '1px solid #e5e7eb'
    },
    tabsNoBorder: {
      display: 'flex',
      gap: '4px',
      borderBottom: 'none'
    },
    tab: {
      padding: '8px 16px',
      fontWeight: '700',
      color: '#6b7280',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s',
      fontSize: '14px'
    },
    tabActive: {
      color: '#000'
    },
    tabIndicator: {
      position: 'absolute',
      bottom: '-1px',
      left: 0,
      right: 0,
      height: '2px',
      background: '#7c3aed'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: '16px',
      marginBottom: '30px'
    },
    statsGrid2: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '30px'
    },
    analyticsCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      textAlign: 'center'
    },
    analyticsCardDark: {
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      textAlign: 'center',
      color: 'white'
    },
    analyticsNumber: {
      fontSize: '32px',
      fontWeight: '700'
    },
    analyticsLabel: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700'
    },
    analyticsSub: {
      fontSize: '12px',
      marginTop: '8px',
      color: '#ffc371'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      marginBottom: '30px'
    },
    cardTitle: {
      marginBottom: '16px',
      fontWeight: '700'
    },
    chartContainer: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '12px',
      height: '200px',
      padding: '20px 0'
    },
    chartColumn: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    },
    chartBars: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    },
    chartBarPosts: {
      width: '100%',
      background: '#7c3aed',
      borderRadius: '4px',
      minHeight: '4px'
    },
    chartBarFollowers: {
      width: '100%',
      background: '#ec4899',
      borderRadius: '4px',
      minHeight: '4px'
    },
    chartDay: {
      fontSize: '11px',
      color: '#6b7280',
      textAlign: 'center',
      fontWeight: '700'
    },
    chartStats: {
      fontSize: '9px',
      color: '#6b7280',
      fontWeight: '700'
    },
    chartLegend: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginTop: '12px',
      fontSize: '12px',
      fontWeight: '700'
    },
    legendDot: {
      display: 'inline-block',
      width: '12px',
      height: '12px',
      borderRadius: '2px',
      marginRight: '4px'
    },
    earningItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid #f3f4f6'
    },
    earningSource: {
      fontWeight: '600'
    },
    earningDate: {
      fontSize: '11px',
      color: '#6b7280',
      fontWeight: '700'
    },
    earningAmount: {
      textAlign: 'right'
    },
    earningPositive: {
      color: '#10b981',
      fontWeight: '700'
    },
    earningStatus: {
      fontSize: '11px',
      fontWeight: '700'
    },
    earningStatusPaid: {
      color: '#10b981'
    },
    earningStatusPending: {
      color: '#f59e0b'
    },
    topContentGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    },
    topItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #f3f4f6'
    },
    topItemLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    topRank: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '12px'
    },
    topRankGold: {
      background: '#f59e0b'
    },
    topRankDefault: {
      background: '#6b7280'
    },
    topContentTitle: {
      fontWeight: '500'
    },
    topContentDate: {
      fontSize: '11px',
      color: '#6b7280',
      fontWeight: '700'
    },
    topContentValue: {
      color: '#7c3aed',
      fontWeight: '700'
    },
    subscriptionBox: {
      background: '#f9fafb',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '16px'
    },
    subscriptionBoxText: {
      fontWeight: '700'
    },
    subscriptionExpires: {
      fontWeight: '700'
    },
    subscriptionPerk: {
      color: '#f59e0b',
      fontSize: '13px',
      marginTop: '8px',
      fontWeight: '700'
    },
    plansContainer: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap'
    },
    planCard: {
      flex: 1,
      textAlign: 'center',
      padding: '20px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      minWidth: '200px'
    },
    planCardFeatured: {
      flex: 1,
      textAlign: 'center',
      padding: '20px',
      background: 'white',
      borderRadius: '16px',
      border: '2px solid #f59e0b',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      minWidth: '200px'
    },
    planName: {
      fontWeight: '700'
    },
    planPrice: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#7c3aed'
    },
    planPriceCreator: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#f59e0b'
    },
    planPriceSmall: {
      fontSize: '14px'
    },
    planFeatures: {
      textAlign: 'left',
      marginTop: '12px',
      paddingLeft: '20px',
      fontWeight: '700'
    },
    planBtn: {
      marginTop: '16px',
      width: '100%',
      padding: '10px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    planBtnCreator: {
      marginTop: '16px',
      width: '100%',
      padding: '10px',
      background: '#f59e0b',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    emptyState: {
      color: '#6b7280',
      textAlign: 'center',
      padding: '40px',
      fontWeight: '700'
    },
    payoutBtn: {
      marginTop: '12px',
      padding: '6px 12px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Analytics Dashboard</h1>
      <p style={styles.subtitle}>Track your performance and earnings</p>
      
      {/* Time Range Selector */}
      <div style={styles.timeRange}>
        <div style={styles.tabsNoBorder}>
          <div style={{...styles.tab, ...(timeRange === 'week' ? styles.tabActive : {})}} onClick={() => setTimeRange('week')}>
            Week
            {timeRange === 'week' && <div style={styles.tabIndicator}></div>}
          </div>
          <div style={{...styles.tab, ...(timeRange === 'month' ? styles.tabActive : {})}} onClick={() => setTimeRange('month')}>
            Month
            {timeRange === 'month' && <div style={styles.tabIndicator}></div>}
          </div>
          <div style={{...styles.tab, ...(timeRange === 'year' ? styles.tabActive : {})}} onClick={() => setTimeRange('year')}>
            Year
            {timeRange === 'year' && <div style={styles.tabIndicator}></div>}
          </div>
          <div style={{...styles.tab, ...(timeRange === 'all' ? styles.tabActive : {})}} onClick={() => setTimeRange('all')}>
            All Time
            {timeRange === 'all' && <div style={styles.tabIndicator}></div>}
          </div>
        </div>
      </div>
      
      {/* Main Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.analyticsCard}>
          <div style={styles.analyticsNumber}>{stats.posts}</div>
          <div style={styles.analyticsLabel}>Total Posts</div>
        </div>
        <div style={styles.analyticsCard}>
          <div style={styles.analyticsNumber}>{stats.applause.toLocaleString()}</div>
          <div style={styles.analyticsLabel}>Total Applause</div>
        </div>
        <div style={styles.analyticsCard}>
          <div style={styles.analyticsNumber}>{stats.followers.toLocaleString()}</div>
          <div style={styles.analyticsLabel}>Followers</div>
        </div>
        <div style={styles.analyticsCard}>
          <div style={styles.analyticsNumber}>{stats.views.toLocaleString()}</div>
          <div style={styles.analyticsLabel}>Video Views</div>
        </div>
      </div>
      
      {/* Earnings Stats */}
      <div style={styles.statsGrid2}>
        <div style={styles.analyticsCardDark}>
          <div style={{...styles.analyticsNumber, color: 'white'}}>{formatCurrency(stats.earnings)}</div>
          <div style={{...styles.analyticsLabel, color: 'rgba(255,255,255,0.8)'}}>Total Earnings</div>
          <div style={styles.analyticsSub}>
            💰 Beat Sales: {formatCurrency(stats.beatSales)} | 🎪 Gigs: {formatCurrency(stats.gigEarnings)}
          </div>
        </div>
        <div style={styles.analyticsCardDark}>
          <div style={{...styles.analyticsNumber, color: 'white'}}>{formatCurrency(stats.pendingEarnings)}</div>
          <div style={{...styles.analyticsLabel, color: 'rgba(255,255,255,0.8)'}}>Pending Payout</div>
          {stats.pendingEarnings > 0 && (
            <button style={styles.payoutBtn} onClick={requestPayout}>
              Request Payout
            </button>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div style={styles.tabs}>
        <div style={{...styles.tab, ...(activeTab === 'overview' ? styles.tabActive : {})}} onClick={() => setActiveTab('overview')}>
          Overview
          {activeTab === 'overview' && <div style={styles.tabIndicator}></div>}
        </div>
        <div style={{...styles.tab, ...(activeTab === 'earnings' ? styles.tabActive : {})}} onClick={() => setActiveTab('earnings')}>
          Earnings
          {activeTab === 'earnings' && <div style={styles.tabIndicator}></div>}
        </div>
        <div style={{...styles.tab, ...(activeTab === 'top-content' ? styles.tabActive : {})}} onClick={() => setActiveTab('top-content')}>
          Top Content
          {activeTab === 'top-content' && <div style={styles.tabIndicator}></div>}
        </div>
        <div style={{...styles.tab, ...(activeTab === 'subscription' ? styles.tabActive : {})}} onClick={() => setActiveTab('subscription')}>
          Subscription
          {activeTab === 'subscription' && <div style={styles.tabIndicator}></div>}
        </div>
      </div>
      
      {/* Overview Tab - Daily Activity Chart */}
      {activeTab === 'overview' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📈 Daily Activity (Last 7 Days)</h3>
          <div style={styles.chartContainer}>
            {dailyStats.map(day => (
              <div key={day.date} style={styles.chartColumn}>
                <div style={styles.chartBars}>
                  <div style={{...styles.chartBarPosts, height: `${(day.posts / maxDailyValue) * 150}px`}}></div>
                  <div style={{...styles.chartBarFollowers, height: `${(day.followers / maxDailyValue) * 150}px`}}></div>
                </div>
                <div style={styles.chartDay}>{day.date}</div>
                <div style={styles.chartStats}>📝{day.posts} | 👥{day.followers}</div>
              </div>
            ))}
          </div>
          <div style={styles.chartLegend}>
            <span><span style={{...styles.legendDot, background: '#7c3aed'}}></span> Posts</span>
            <span><span style={{...styles.legendDot, background: '#ec4899'}}></span> New Followers</span>
          </div>
        </div>
      )}
      
      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💰 Earnings History</h3>
          {earningsList.length === 0 ? (
            <p style={styles.emptyState}>No earnings yet</p>
          ) : (
            <div>
              {earningsList.map(earning => (
                <div key={earning.id} style={styles.earningItem}>
                  <div>
                    <div style={styles.earningSource}>{earning.source}</div>
                    <div style={styles.earningDate}>{new Date(earning.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={styles.earningAmount}>
                    <div style={styles.earningPositive}>+{formatCurrency(earning.amount)}</div>
                    <div style={{
                      ...styles.earningStatus,
                      ...(earning.status === 'paid' ? styles.earningStatusPaid : styles.earningStatusPending)
                    }}>
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
        <div style={styles.topContentGrid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🔥 Top Posts</h3>
            {topPosts.length === 0 ? (
              <p style={styles.emptyState}>No posts yet</p>
            ) : (
              topPosts.map((post, index) => (
                <div key={post.id} style={styles.topItem}>
                  <div style={styles.topItemLeft}>
                    <div style={{
                      ...styles.topRank,
                      ...(index < 3 ? styles.topRankGold : styles.topRankDefault)
                    }}>{index + 1}</div>
                    <div>
                      <div style={styles.topContentTitle}>{post.content.substring(0, 40)}...</div>
                      <div style={styles.topContentDate}>{new Date(post.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={styles.topContentValue}>👏 {post.applause_count || 0}</div>
                </div>
              ))
            )}
          </div>
          
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🎬 Top Videos</h3>
            {topVideos.length === 0 ? (
              <p style={styles.emptyState}>No videos yet</p>
            ) : (
              topVideos.map((video, index) => (
                <div key={video.id} style={styles.topItem}>
                  <div style={styles.topItemLeft}>
                    <div style={{
                      ...styles.topRank,
                      ...(index < 3 ? styles.topRankGold : styles.topRankDefault)
                    }}>{index + 1}</div>
                    <div>
                      <div style={styles.topContentTitle}>{video.title.substring(0, 40)}</div>
                      <div style={styles.topContentDate}>{new Date(video.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={styles.topContentValue}>👁️ {video.views_count || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>⭐ Premium Subscription</h3>
          
          {subscription ? (
            <div>
              <div style={styles.subscriptionBox}>
                <p style={styles.subscriptionBoxText}>Current plan: <strong>{subscription.tier === 'pro' ? 'Pro' : 'Creator Pro'}</strong></p>
                <p style={styles.subscriptionExpires}>Expires: {new Date(subscription.expires_at).toLocaleDateString()}</p>
                {subscription.tier === 'creator_pro' && (
                  <p style={styles.subscriptionPerk}>✨ 0% transaction fees • Featured placement • Priority support</p>
                )}
              </div>
              <button style={styles.planBtn}>Manage Subscription</button>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '16px', color: '#6b7280', fontWeight: '700' }}>
                Upgrade to unlock premium features, advanced analytics, and lower transaction fees.
              </p>
              <div style={styles.plansContainer}>
                <div style={styles.planCard}>
                  <h4 style={styles.planName}>Pro Plan</h4>
                  <p style={styles.planPrice}>$8<span style={styles.planPriceSmall}>/mo</span></p>
                  <ul style={styles.planFeatures}>
                    <li>Unlimited posts</li>
                    <li>Advanced analytics</li>
                    <li>Priority support</li>
                    <li>Lower transaction fees</li>
                  </ul>
                  <button style={styles.planBtn} onClick={upgradeToPro}>
                    Upgrade to Pro
                  </button>
                </div>
                <div style={styles.planCardFeatured}>
                  <h4 style={styles.planName}>Creator Pro</h4>
                  <p style={styles.planPriceCreator}>$15<span style={styles.planPriceSmall}>/mo</span></p>
                  <ul style={styles.planFeatures}>
                    <li>Everything in Pro</li>
                    <li>0% transaction fees</li>
                    <li>Featured placement</li>
                    <li>Verified badge priority</li>
                  </ul>
                  <button style={styles.planBtnCreator} onClick={upgradeToCreatorPro}>
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