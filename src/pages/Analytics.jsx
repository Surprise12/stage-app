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
    views: 0
  })
  const [earningsList, setEarningsList] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    setLoading(true)
    
    // Get user's posts count and applause
    const { data: posts } = await supabase
      .from('posts')
      .select('applause_count')
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
      views: totalViews
    })
    setEarningsList(earnings || [])
    setSubscription(sub)
    setLoading(false)
  }

  async function upgradeToPro() {
    // In production, integrate Stripe here
    alert('Stripe payment would open here.\n\nPro Plan: $8/month\n- Unlimited posts\n- Advanced analytics\n- Priority support\n- Lower transaction fees')
    
    // For demo, create a subscription record
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

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return <div className="spinner"></div>
  }

  return (
    <div className="container" style={{ marginTop: '30px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '20px' }}>📊 Analytics Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid-2" style={{ marginBottom: '30px' }}>
        <div className="analytics-card">
          <div className="analytics-number">{stats.posts}</div>
          <div className="analytics-label">Total Posts</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{stats.applause}</div>
          <div className="analytics-label">Total Applause</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{stats.followers}</div>
          <div className="analytics-label">Followers</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{stats.views}</div>
          <div className="analytics-label">Video Views</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{formatCurrency(stats.earnings)}</div>
          <div className="analytics-label">Total Earnings</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{formatCurrency(stats.pendingEarnings)}</div>
          <div className="analytics-label">Pending Payout</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{formatCurrency(stats.tips)}</div>
          <div className="analytics-label">Tips Received</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-number">{stats.following}</div>
          <div className="analytics-label">Following</div>
        </div>
      </div>
      
      {/* Earnings History */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '16px' }}>💰 Earnings History</h3>
        {earningsList.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No earnings yet</p>
        ) : (
          <div>
            {earningsList.map(earning => (
              <div key={earning.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #2a2a2a' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{earning.source}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>{new Date(earning.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#ffc371' }}>+{formatCurrency(earning.amount)}</div>
                  <div style={{ fontSize: '0.7rem', color: earning.status === 'paid' ? '#4caf50' : '#ffc371' }}>
                    {earning.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Subscription Section */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>⭐ Premium Subscription</h3>
        
        {subscription ? (
          <div>
            <p>Current plan: <strong>{subscription.tier === 'pro' ? 'Pro' : 'Creator Pro'}</strong></p>
            <p>Expires: {new Date(subscription.expires_at).toLocaleDateString()}</p>
            <button className="btn btn-secondary" style={{ marginTop: '16px' }}>Manage Subscription</button>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '16px', color: '#888' }}>
              Upgrade to unlock premium features, advanced analytics, and lower transaction fees.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={upgradeToPro}>
                Upgrade to Pro - $8/mo
              </button>
              <button className="btn btn-secondary" onClick={upgradeToCreatorPro}>
                Creator Pro - $15/mo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}