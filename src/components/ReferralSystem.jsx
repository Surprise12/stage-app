import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ReferralSystem({ session }) {
  const [referrals, setReferrals] = useState([])
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })

  useEffect(() => {
    generateReferralCode()
    loadReferrals()
  }, [])

  function generateReferralCode() {
    const code = session.user.id.substring(0, 8)
    setReferralCode(code)
  }

  async function loadReferrals() {
    const { data } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:referred_id (id, username, display_name, avatar_url)
      `)
      .eq('referrer_id', session.user.id)

    if (data) {
      setReferrals(data)
      setStats({
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        completed: data.filter(r => r.status === 'completed').length
      })
    }
  }

  async function claimReward(referralId) {
    await supabase
      .from('referrals')
      .update({ reward_claimed: true, status: 'completed' })
      .eq('id', referralId)
    
    alert('Reward claimed! +50 points added to your account')
    loadReferrals()
  }

  const referralLink = `https://stage-app.com/signup?ref=${referralCode}`

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>🎁 Referral Program</h3>
      <p style={{ color: '#888', marginBottom: '16px' }}>Invite friends and earn rewards!</p>

      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span>Your referral link:</span>
          <button className="btn btn-small btn-secondary" onClick={() => navigator.clipboard.writeText(referralLink)}>Copy</button>
        </div>
        <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{referralLink}</code>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>Total Referrals</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pending}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>Pending</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.completed}</div>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>Rewards Earned</div>
        </div>
      </div>

      {referrals.map(ref => (
        <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={ref.referred?.avatar_url || `https://ui-avatars.com/api/?name=${ref.referred?.username[0] || 'U'}&background=7c3aed&color=fff`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="avatar" />
            <div>
              <div>{ref.referred?.display_name || ref.referred?.username}</div>
              <div style={{ fontSize: '0.7rem', color: '#888' }}>{ref.status}</div>
            </div>
          </div>
          {ref.status === 'pending' && !ref.reward_claimed && (
            <button className="btn btn-primary btn-small" onClick={() => claimReward(ref.id)}>Claim Reward</button>
          )}
        </div>
      ))}
    </div>
  )
}