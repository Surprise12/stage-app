// src/components/FanSubscriptions.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function FanSubscriptions({ session, creatorId, creatorName }) {
  const [tiers, setTiers] = useState([])
  const [mySubscription, setMySubscription] = useState(null)
  const [subscribers, setSubscribers] = useState([])
  const [isCreator, setIsCreator] = useState(false)
  const [showCreateTier, setShowCreateTier] = useState(false)
  const [showSubscribeModal, setShowSubscribeModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [newTier, setNewTier] = useState({
    name: '',
    price: '',
    benefits: [''],
    color: '#7c3aed',
    description: ''
  })
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    loadTiers()
    checkSubscription()
    if (session?.user?.id === creatorId) {
      setIsCreator(true)
      loadSubscribers()
      calculateRevenue()
    }
  }, [creatorId])

  async function loadTiers() {
    const { data } = await supabase
      .from('creator_tiers')
      .select('*')
      .eq('creator_id', creatorId)
      .order('price', { ascending: true })
    if (data) setTiers(data)
  }

  async function checkSubscription() {
    const { data } = await supabase
      .from('fan_memberships')
      .select('*, tier: tier_id(*)')
      .eq('fan_id', session?.user?.id)
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .single()
    if (data) setMySubscription(data)
  }

  async function loadSubscribers() {
    const { data } = await supabase
      .from('fan_memberships')
      .select('*, fan: fan_id(*)')
      .eq('creator_id', creatorId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
    if (data) setSubscribers(data)
  }

  async function calculateRevenue() {
    let revenue = 0
    for (const tier of tiers) {
      const { count } = await supabase
        .from('fan_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)
        .eq('tier_id', tier.id)
        .eq('status', 'active')
      
      revenue += (count || 0) * tier.price
    }
    setTotalRevenue(revenue)
  }

  async function createTier() {
    if (!newTier.name || !newTier.price) {
      alert('Please fill in tier name and price')
      return
    }

    const { error } = await supabase
      .from('creator_tiers')
      .insert({
        creator_id: creatorId,
        tier_name: newTier.name,
        price: parseFloat(newTier.price),
        benefits: newTier.benefits.filter(b => b.trim()),
        color: newTier.color,
        description: newTier.description
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Tier created!')
      setShowCreateTier(false)
      setNewTier({ name: '', price: '', benefits: [''], color: '#7c3aed', description: '' })
      loadTiers()
      calculateRevenue()
    }
  }

  async function subscribe(tierId, price) {
    const { error } = await supabase
      .from('fan_memberships')
      .insert({
        fan_id: session.user.id,
        creator_id: creatorId,
        tier_id: tierId,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`🎉 Subscribed to ${tiers.find(t => t.id === tierId)?.tier_name} tier! You now have access to exclusive content.`)
      setShowSubscribeModal(false)
      checkSubscription()
      if (isCreator) loadSubscribers()
      calculateRevenue()
    }
  }

  async function cancelSubscription() {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access to exclusive content.')) {
      await supabase
        .from('fan_memberships')
        .update({ status: 'cancelled' })
        .eq('id', mySubscription.id)
      
      alert('Subscription cancelled')
      setMySubscription(null)
    }
  }

  async function sendMessageToSubscriber(subscriberId) {
    alert(`Messaging feature coming soon! You'll be able to send exclusive updates to your subscribers.`)
  }

  function addBenefit() {
    setNewTier({ ...newTier, benefits: [...newTier.benefits, ''] })
  }

  function updateBenefit(index, value) {
    const newBenefits = [...newTier.benefits]
    newBenefits[index] = value
    setNewTier({ ...newTier, benefits: newBenefits })
  }

  function removeBenefit(index) {
    const newBenefits = newTier.benefits.filter((_, i) => i !== index)
    setNewTier({ ...newTier, benefits: newBenefits })
  }

  const tierIcons = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  }

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>⭐ Support {creatorName || 'This Creator'}</h3>
        {isCreator && (
          <span className="badge-small" style={{ background: '#4caf50', color: 'white' }}>
            💰 ${totalRevenue.toFixed(2)} MRR
          </span>
        )}
      </div>
      
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
        Subscribe to get exclusive content, behind-the-scenes access, and directly support your favorite creator.
      </p>

      {/* Existing Subscription */}
      {mySubscription && (
        <div className="card" style={{ 
          marginBottom: '20px', 
          background: `linear-gradient(135deg, ${mySubscription.tier?.color}15, ${mySubscription.tier?.color}05)`,
          border: `1px solid ${mySubscription.tier?.color}30`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4>Your Current Plan: {mySubscription.tier?.tier_name}</h4>
              <p style={{ fontSize: '13px', color: '#888' }}>Price: <strong>${mySubscription.tier?.price}/month</strong></p>
              <p style={{ fontSize: '12px', color: '#888' }}>Next billing: {new Date(mySubscription.expires_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="badge-small" style={{ background: '#4caf50', color: 'white' }}>Active ✓</span>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline btn-small" onClick={cancelSubscription}>
              Cancel Subscription
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => alert('Update payment method coming soon')}>
              Update Payment
            </button>
          </div>
        </div>
      )}

      {/* Subscription Tiers */}
      {!mySubscription && tiers.length > 0 && (
        <div className="subscription-tiers" style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
          {tiers.map(tier => (
            <div 
              key={tier.id} 
              className="card" 
              style={{ 
                border: `2px solid ${tier.color}30`,
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onClick={() => {
                setSelectedTier(tier)
                setShowSubscribeModal(true)
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '28px', marginRight: '8px' }}>
                    {tier.tier_name.toLowerCase().includes('bronze') ? '🥉' : 
                     tier.tier_name.toLowerCase().includes('silver') ? '🥈' :
                     tier.tier_name.toLowerCase().includes('gold') ? '🥇' :
                     tier.tier_name.toLowerCase().includes('platinum') ? '💎' : '⭐'}
                  </span>
                  <strong style={{ fontSize: '18px' }}>{tier.tier_name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: tier.color }}>${tier.price}</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>/month</span>
                </div>
              </div>
              
              {tier.description && (
                <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>{tier.description}</p>
              )}
              
              <ul style={{ margin: '12px 0', paddingLeft: '20px' }}>
                {tier.benefits.map((benefit, i) => (
                  <li key={i} style={{ marginBottom: '6px', fontSize: '13px' }}>✓ {benefit}</li>
                ))}
              </ul>
              
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '8px' }}
                onClick={(e) => { e.stopPropagation(); subscribe(tier.id, tier.price) }}
              >
                Subscribe - ${tier.price}/mo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No Tiers Message */}
      {!mySubscription && tiers.length === 0 && !isCreator && (
        <div className="card" style={{ textAlign: 'center', padding: '30px', background: '#1a1a1a' }}>
          <p style={{ color: '#888' }}>No subscription tiers available yet.</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Check back later for exclusive content!</p>
        </div>
      )}

      {/* Create Tier Form (Creator Only) */}
      {isCreator && (
        <div style={{ marginTop: '24px' }}>
          <button className="btn btn-secondary" onClick={() => setShowCreateTier(!showCreateTier)} style={{ width: '100%' }}>
            {showCreateTier ? 'Cancel' : '+ Create New Tier'}
          </button>
          
          {showCreateTier && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#1a1a1a', borderRadius: '16px' }}>
              <h4 style={{ marginBottom: '16px' }}>Create Subscription Tier</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Tier Name (e.g., Bronze, Silver, Gold)" 
                  value={newTier.name} 
                  onChange={(e) => setNewTier({...newTier, name: e.target.value})} 
                />
                <textarea 
                  className="input" 
                  placeholder="Tier Description (optional)" 
                  rows="2"
                  value={newTier.description}
                  onChange={(e) => setNewTier({...newTier, description: e.target.value})}
                />
                <input 
                  type="number" 
                  className="input" 
                  placeholder="Monthly Price ($)" 
                  step="0.01" 
                  value={newTier.price} 
                  onChange={(e) => setNewTier({...newTier, price: e.target.value})} 
                />
                <input 
                  type="color" 
                  className="input" 
                  value={newTier.color} 
                  onChange={(e) => setNewTier({...newTier, color: e.target.value})} 
                />
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Benefits:</label>
                  {newTier.benefits.map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input 
                        type="text" 
                        className="input" 
                        placeholder={`Benefit ${i + 1}`} 
                        value={benefit} 
                        onChange={(e) => updateBenefit(i, e.target.value)} 
                      />
                      {i > 0 && (
                        <button className="btn btn-outline btn-small" onClick={() => removeBenefit(i)}>✗</button>
                      )}
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-small" style={{ marginTop: '8px' }} onClick={addBenefit}>
                    + Add Benefit
                  </button>
                </div>
                
                <button className="btn btn-primary" onClick={createTier}>Create Tier</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscribers List (Creator Only) */}
      {isCreator && subscribers.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h4>Your Supporters ({subscribers.length})</h4>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
            💰 Monthly Recurring Revenue: <strong>${totalRevenue.toFixed(2)}</strong>
          </p>
          <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {subscribers.map(sub => (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#1a1a1a', borderRadius: '12px', marginBottom: '8px' }}>
                <div className="suggestion-avatar" style={{ width: '40px', height: '40px' }}>
                  <img 
                    src={sub.fan?.avatar_url || `https://ui-avatars.com/api/?name=${sub.fan?.username?.[0] || 'U'}&background=7c3aed&color=fff`} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                    alt="" 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div><strong>{sub.fan?.display_name || sub.fan?.username}</strong></div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    Since {new Date(sub.started_at).toLocaleDateString()} • ${sub.tier?.price}/month
                  </div>
                </div>
                <button 
                  className="btn btn-outline btn-small" 
                  onClick={() => sendMessageToSubscriber(sub.fan?.id)}
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && selectedTier && (
        <div className="modal active" onClick={() => setShowSubscribeModal(false)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Subscribe to {selectedTier.tier_name}</div>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '48px' }}>
                {selectedTier.tier_name.toLowerCase().includes('bronze') ? '🥉' : 
                 selectedTier.tier_name.toLowerCase().includes('silver') ? '🥈' :
                 selectedTier.tier_name.toLowerCase().includes('gold') ? '🥇' :
                 selectedTier.tier_name.toLowerCase().includes('platinum') ? '💎' : '⭐'}
              </span>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: selectedTier.color, marginTop: '8px' }}>
                ${selectedTier.price}<span style={{ fontSize: '14px', color: '#888' }}>/month</span>
              </div>
            </div>
            
            <div style={{ background: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <strong>Benefits you'll get:</strong>
              <ul style={{ marginTop: '12px', paddingLeft: '20px' }}>
                {selectedTier.benefits.map((benefit, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>✓ {benefit}</li>
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
              onClick={() => subscribe(selectedTier.id, selectedTier.price)}
            >
              Confirm Subscription - ${selectedTier.price}/month
            </button>
            <button 
              className="secondary-btn" 
              style={{ marginTop: '8px', width: '100%' }} 
              onClick={() => setShowSubscribeModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}