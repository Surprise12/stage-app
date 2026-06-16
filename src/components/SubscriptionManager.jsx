// src/components/SubscriptionManager.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SubscriptionManager({ creatorId, creatorName, currentUser }) {
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [subscribers, setSubscribers] = useState([])
  const [isCreator, setIsCreator] = useState(false)
  const [tiers] = useState([
    { 
      name: 'Bronze', 
      price: 2.99, 
      color: '#cd7f32', 
      icon: '🥉',
      perks: ['🎯 Early access to content', '🏷️ Badge on profile', '📱 Exclusive updates'],
      description: 'For casual fans who want to show support'
    },
    { 
      name: 'Silver', 
      price: 4.99, 
      color: '#c0c0c0', 
      icon: '🥈',
      perks: ['All Bronze perks', '📝 Exclusive posts', '⚡ Priority replies', '🎁 Monthly exclusive content'],
      description: 'For dedicated fans who want more access'
    },
    { 
      name: 'Gold', 
      price: 9.99, 
      color: '#ffd700', 
      icon: '🥇',
      perks: ['All Silver perks', '💬 Monthly Q&A session', '🎬 Exclusive videos', '📦 Merch discounts', '🔔 Early notifications'],
      description: 'For super fans who want the full experience'
    },
    { 
      name: 'Platinum', 
      price: 19.99, 
      color: '#e5e4e2', 
      icon: '💎',
      perks: ['All Gold perks', '📞 1-on-1 call', '📢 Shoutout', '🎵 Early access to music', '🎟️ Event priority', '🤝 Exclusive community'],
      description: 'For ultimate supporters who want VIP treatment'
    }
  ])

  useEffect(() => {
    checkSubscription()
    loadSubscribers()
    checkIfCreator()
  }, [])

  async function checkSubscription() {
    setLoading(true)
    const { data } = await supabase
      .from('creator_subscriptions')
      .select('*')
      .eq('subscriber_id', currentUser.id)
      .eq('creator_id', creatorId)
      .single()

    if (data) setSubscription(data)
    setLoading(false)
  }

  async function loadSubscribers() {
    const { data } = await supabase
      .from('creator_subscriptions')
      .select(`
        *,
        subscriber:subscriber_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
    
    if (data) setSubscribers(data)
  }

  async function checkIfCreator() {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', currentUser.id)
      .eq('role', 'artist')
      .single()
    
    setIsCreator(!!data)
  }

  async function subscribe(tier, price) {
    const { error } = await supabase
      .from('creator_subscriptions')
      .insert({
        subscriber_id: currentUser.id,
        creator_id: creatorId,
        tier: tier.toLowerCase(),
        price: price,
        status: 'active',
        auto_renew: true,
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`🎉 Subscribed to ${tier} tier! Thank you for supporting ${creatorName || 'this creator'}!`)
      setShowPaymentModal(false)
      checkSubscription()
      loadSubscribers()
    }
  }

  async function cancelSubscription() {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access to exclusive content.')) {
      await supabase
        .from('creator_subscriptions')
        .update({ status: 'cancelled', auto_renew: false })
        .eq('id', subscription.id)
      
      alert('Subscription cancelled')
      setSubscription(null)
    }
  }

  async function updatePaymentMethod() {
    alert('Payment method update coming soon!')
  }

  function getTotalSubscribers() {
    return subscribers.length
  }

  function getMonthlyRevenue() {
    return subscribers.reduce((sum, sub) => sum + sub.price, 0)
  }

  const tierColors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0', 
    gold: '#ffd700',
    platinum: '#e5e4e2'
  }

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>⭐ Support {creatorName || 'This Creator'}</h3>
        {isCreator && (
          <span className="badge-small" style={{ background: '#10b981', color: 'white' }}>
            {getTotalSubscribers()} supporters
          </span>
        )}
      </div>
      
      <p style={{ color: '#888', marginBottom: '20px' }}>
        Join the community and get exclusive access to content, behind-the-scenes updates, and special perks.
      </p>

      {/* Current Subscription */}
      {subscription && subscription.status === 'active' && (
        <div className="card" style={{ 
          marginBottom: '20px', 
          background: `linear-gradient(135deg, ${tierColors[subscription.tier?.toLowerCase()] || '#7c3aed'}15, ${tierColors[subscription.tier?.toLowerCase()] || '#7c3aed'}05)`,
          border: `1px solid ${tierColors[subscription.tier?.toLowerCase()] || '#7c3aed'}30`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ marginBottom: '4px' }}>Your Plan: {subscription.tier}</h4>
              <p style={{ fontSize: '13px', color: '#888' }}>${subscription.price}/month</p>
              <p style={{ fontSize: '12px', color: '#888' }}>Next billing: {new Date(subscription.expires_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="badge-small" style={{ background: '#4caf50', color: 'white' }}>Active ✓</span>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-small" onClick={cancelSubscription}>
              Cancel
            </button>
            <button className="btn btn-secondary btn-small" onClick={updatePaymentMethod}>
              Update Payment
            </button>
          </div>
        </div>
      )}

      {/* Subscription Tiers */}
      {!subscription && !loading && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {tiers.map(tier => (
            <div 
              key={tier.name} 
              className="card" 
              style={{ 
                border: `2px solid ${tier.color}30`,
                background: 'rgba(255,255,255,0.02)',
                transition: 'transform 0.2s, border-color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = tier.color
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${tier.color}30`
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>{tier.icon}</span>
                  <div>
                    <h4 style={{ color: tier.color, margin: 0 }}>{tier.name}</h4>
                    <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>{tier.description}</p>
                  </div>
                </div>
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: tier.color }}>
                  ${tier.price}
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>/mo</span>
                </span>
              </div>
              <ul style={{ margin: '12px 0 16px 0', paddingLeft: '20px' }}>
                {tier.perks.map(perk => (
                  <li key={perk} style={{ fontSize: '0.85rem', marginBottom: '6px', color: '#aaa' }}>
                    {perk}
                  </li>
                ))}
              </ul>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={() => {
                  setSelectedTier(tier)
                  setShowPaymentModal(true)
                }}
              >
                Subscribe to {tier.name} - ${tier.price}/mo
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="spinner"></div>}

      {/* Creator Stats (if user is creator) */}
      {isCreator && subscribers.length > 0 && (
        <div style={{ marginTop: '24px', padding: '16px', background: '#1a1a1a', borderRadius: '12px' }}>
          <h4 style={{ marginBottom: '12px' }}>Your Supporters</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{getTotalSubscribers()}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>Total Supporters</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>${getMonthlyRevenue().toFixed(2)}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>Monthly Revenue</div>
            </div>
          </div>
          {subscribers.slice(0, 5).map(sub => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid #2a2a2a' }}>
              <img 
                src={sub.subscriber?.avatar_url || `https://ui-avatars.com/api/?name=${(sub.subscriber?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                alt="avatar" 
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{sub.subscriber?.display_name || sub.subscriber?.username}</div>
                <div style={{ fontSize: '10px', color: '#888' }}>{sub.tier} tier • {new Date(sub.started_at).toLocaleDateString()}</div>
              </div>
              <span style={{ fontSize: '12px', color: '#7c3aed' }}>${sub.price}/mo</span>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTier && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Confirm Subscription</div>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>{selectedTier.icon}</span>
              <h3 style={{ color: selectedTier.color, marginTop: '8px' }}>{selectedTier.name} - ${selectedTier.price}/mo</h3>
              <p style={{ color: '#888', fontSize: '13px' }}>{selectedTier.description}</p>
            </div>
            
            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <strong>You'll get:</strong>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                {selectedTier.perks.map(perk => (
                  <li key={perk} style={{ fontSize: '13px', marginBottom: '4px' }}>{perk}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Payment Method</label>
              <select className="input">
                <option>💳 Credit Card (****4242)</option>
                <option>🔄 Add New Card</option>
                <option>💰 PayPal</option>
              </select>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => subscribe(selectedTier.name, selectedTier.price)}
            >
              Confirm - ${selectedTier.price}/month
            </button>
            <button 
              className="secondary-btn" 
              style={{ marginTop: '8px', width: '100%' }} 
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}