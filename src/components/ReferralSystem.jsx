// src/components/ReferralSystem.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ReferralSystem({ session }) {
  const [referrals, setReferrals] = useState([])
  const [referralCode, setReferralCode] = useState('')
  const [referralLink, setReferralLink] = useState('')
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, rewardsEarned: 0 })
  const [copied, setCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateReferralCode()
    loadReferrals()
    loadLeaderboard()
  }, [])

  function generateReferralCode() {
    const code = session.user.id.substring(0, 8).toUpperCase()
    setReferralCode(code)
    setReferralLink(`https://socialvibe.com/ref/${code}`)
  }

  async function loadReferrals() {
    const { data } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:referred_id (id, username, display_name, avatar_url)
      `)
      .eq('referrer_id', session.user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setReferrals(data)
      const completed = data.filter(r => r.status === 'completed').length
      setStats({
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        completed: completed,
        rewardsEarned: completed * 50 // 50 points per completed referral
      })
    }
    setLoading(false)
  }

  async function loadLeaderboard() {
    // Get top referrers
    const { data } = await supabase
      .from('referrals')
      .select('referrer_id, count, profiles:referrer_id(username, display_name, avatar_url)')
      .eq('status', 'completed')
      .group('referrer_id')
      .order('count', { ascending: false })
      .limit(10)
    
    if (data) setLeaderboard(data)
  }

  async function claimReward(referralId) {
    await supabase
      .from('referrals')
      .update({ reward_claimed: true, status: 'completed' })
      .eq('id', referralId)
    
    // Add points to user
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', session.user.id)
      .single()
    
    if (userPoints) {
      await supabase
        .from('user_points')
        .update({ points: userPoints.points + 50 })
        .eq('user_id', session.user.id)
    } else {
      await supabase
        .from('user_points')
        .insert({ user_id: session.user.id, points: 50 })
    }
    
    alert('🎉 Reward claimed! +50 points added to your account!')
    loadReferrals()
  }

  async function shareReferral(platform) {
    const text = `🎵 Join me on SocialVibe! Use my referral link: ${referralLink}`
    
    switch(platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
        break
      case 'messenger':
        window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(referralLink)}&app_id=YOUR_APP_ID`, '_blank')
        break
      case 'sms':
        window.location.href = `sms:?body=${encodeURIComponent(text)}`
        break
      case 'email':
        window.location.href = `mailto:?subject=Join me on SocialVibe&body=${encodeURIComponent(text)}`
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
        break
    }
    setShowShareModal(false)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  if (loading) {
    return <div className="card" style={{ padding: '20px' }}><div className="spinner"></div></div>
  }

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>🎁 Referral Program</h3>
        <span className="badge-small" style={{ background: '#4caf50', color: 'white' }}>
          {stats.rewardsEarned} points earned
        </span>
      </div>
      
      <p style={{ color: '#888', marginBottom: '16px' }}>
        Invite friends to join SocialVibe and earn rewards! You get <strong>50 points</strong> for each friend who signs up using your link.
      </p>

      {/* Referral Link Section */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '16px', 
        borderRadius: '12px', 
        marginBottom: '20px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>Your referral link:</span>
          <button 
            className="btn btn-primary btn-small" 
            onClick={handleCopyLink}
            style={{ padding: '6px 16px' }}
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
        <div style={{ 
          background: 'white', 
          padding: '10px 14px', 
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '13px',
          wordBreak: 'break-all',
          border: '1px solid #ddd'
        }}>
          {referralLink}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-small" onClick={() => setShowShareModal(true)}>
            <i className="fas fa-share-alt"></i> Share
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join me on SocialVibe! ${referralLink}`)}`, '_blank')}>
            <i className="fab fa-whatsapp" style={{ color: '#25d366' }}></i> WhatsApp
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on SocialVibe! ${referralLink}`)}`, '_blank')}>
            <i className="fab fa-twitter"></i> Twitter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>Total</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pending}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>Pending</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>{stats.completed}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>Completed</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,73,153,0.1))', borderRadius: '12px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#7c3aed' }}>{stats.rewardsEarned}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>Points Earned</div>
        </div>
      </div>

      {/* Referral List */}
      {referrals.length > 0 ? (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Your Referrals</h4>
          {referrals.map(ref => (
            <div key={ref.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px', 
              borderBottom: '1px solid #f0f2f5',
              background: ref.status === 'completed' ? 'rgba(16,185,129,0.05)' : 'transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={ref.referred?.avatar_url || `https://ui-avatars.com/api/?name=${(ref.referred?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                  alt="avatar" 
                />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{ref.referred?.display_name || ref.referred?.username || 'Anonymous'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>
                    {ref.status === 'pending' ? '⏳ Awaiting verification' : '✅ Verified'}
                  </div>
                </div>
              </div>
              {ref.status === 'pending' && !ref.reward_claimed && (
                <button 
                  className="btn btn-primary btn-small" 
                  onClick={() => claimReward(ref.id)}
                >
                  Claim 🎁
                </button>
              )}
              {ref.status === 'completed' && (
                <span style={{ color: '#10b981', fontSize: '13px' }}>✅ +50 pts</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '30px', 
          background: '#f5f5f5', 
          borderRadius: '12px',
          marginBottom: '16px'
        }}>
          <i className="fas fa-users" style={{ fontSize: '32px', color: '#ccc', marginBottom: '8px' }}></i>
          <p style={{ color: '#888' }}>No referrals yet. Share your link!</p>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>🏆 Top Referrers</h4>
          {leaderboard.slice(0, 5).map((entry, index) => (
            <div key={entry.referrer_id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '8px 12px',
              background: index < 3 ? 'rgba(245,158,11,0.1)' : 'transparent',
              borderRadius: '8px',
              marginBottom: '4px'
            }}>
              <span style={{ 
                fontWeight: 'bold', 
                width: '24px',
                color: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7f32' : '#888'
              }}>
                #{index + 1}
              </span>
              <img 
                src={entry.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(entry.profiles?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
                alt="avatar" 
              />
              <span style={{ flex: 1 }}>{entry.profiles?.display_name || entry.profiles?.username}</span>
              <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>{entry.count} referrals</span>
            </div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowShareModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📤 Share Referral Link</div>
            <div className="dropdown-item" onClick={() => shareReferral('whatsapp')}>
              <i className="fab fa-whatsapp" style={{ color: '#25d366', width: '24px' }}></i> WhatsApp
            </div>
            <div className="dropdown-item" onClick={() => shareReferral('messenger')}>
              <i className="fab fa-facebook-messenger" style={{ color: '#0084ff', width: '24px' }}></i> Messenger
            </div>
            <div className="dropdown-item" onClick={() => shareReferral('twitter')}>
              <i className="fab fa-twitter" style={{ color: '#000', width: '24px' }}></i> Twitter
            </div>
            <div className="dropdown-item" onClick={() => shareReferral('email')}>
              <i className="fas fa-envelope" style={{ width: '24px' }}></i> Email
            </div>
            <div className="dropdown-item" onClick={() => shareReferral('sms')}>
              <i className="fas fa-sms" style={{ width: '24px' }}></i> SMS
            </div>
            <button className="secondary-btn" style={{ marginTop: '16px', width: '100%' }} onClick={() => setShowShareModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}