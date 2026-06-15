// src/components/FanSubscriptions.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function FanSubscriptions({ session, creatorId }) {
  const [tiers, setTiers] = useState([])
  const [mySubscription, setMySubscription] = useState(null)
  const [subscribers, setSubscribers] = useState([])
  const [isCreator, setIsCreator] = useState(false)
  const [showCreateTier, setShowCreateTier] = useState(false)
  const [newTier, setNewTier] = useState({
    name: '',
    price: '',
    benefits: [''],
    color: '#7c3aed'
  })

  useEffect(() => {
    loadTiers()
    checkSubscription()
    if (session?.user?.id === creatorId) {
      setIsCreator(true)
      loadSubscribers()
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
    if (data) setSubscribers(data)
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
        color: newTier.color
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Tier created!')
      setShowCreateTier(false)
      setNewTier({ name: '', price: '', benefits: [''], color: '#7c3aed' })
      loadTiers()
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
      alert(`Subscribed! You now have access to exclusive content.`)
      checkSubscription()
      if (isCreator) loadSubscribers()
    }
  }

  async function cancelSubscription() {
    await supabase
      .from('fan_memberships')
      .update({ status: 'cancelled' })
      .eq('id', mySubscription.id)
    
    alert('Subscription cancelled')
    setMySubscription(null)
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

  return (
    <div className="card">
      <h3>⭐ Support This Creator</h3>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
        Subscribe to get exclusive content, behind-the-scenes access, and direct support your favorite creator
      </p>

      {/* Existing Subscription */}
      {mySubscription && (
        <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,73,153,0.1))' }}>
          <h4>Your Current Plan: {mySubscription.tier?.tier_name}</h4>
          <p>Price: ${mySubscription.tier?.price}/month</p>
          <p>Expires: {new Date(mySubscription.expires_at).toLocaleDateString()}</p>
          <button className="btn btn-outline btn-small" style={{ marginTop: '12px' }} onClick={cancelSubscription}>
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Subscription Tiers */}
      {!mySubscription && (
        <div className="subscription-tiers" style={{ display: 'grid', gap: '16px' }}>
          {tiers.map(tier => (
            <div key={tier.id} style={{ border: `2px solid ${tier.color}`, borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '0', right: '0', background: tier.color, color: 'white', padding: '4px 16px', fontSize: '12px', fontWeight: 'bold' }}>
                {tier.tier_name}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>${tier.price}<span style={{ fontSize: '14px', fontWeight: 'normal' }}>/month</span></div>
              <ul style={{ margin: '16px 0', paddingLeft: '20px' }}>
                {tier.benefits.map((benefit, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>✓ {benefit}</li>
                ))}
              </ul>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => subscribe(tier.id, tier.price)}>
                Subscribe - ${tier.price}/mo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Tier Form (Creator Only) */}
      {isCreator && (
        <div style={{ marginTop: '24px' }}>
          <button className="btn btn-secondary" onClick={() => setShowCreateTier(!showCreateTier)} style={{ width: '100%' }}>
            {showCreateTier ? 'Cancel' : '+ Create New Tier'}
          </button>
          
          {showCreateTier && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '16px' }}>
              <h4>Create Subscription Tier</h4>
              <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                <input type="text" className="input" placeholder="Tier Name (e.g., Bronze, Silver, Gold)" value={newTier.name} onChange={(e) => setNewTier({...newTier, name: e.target.value})} />
                <input type="number" className="input" placeholder="Monthly Price ($)" step="0.01" value={newTier.price} onChange={(e) => setNewTier({...newTier, price: e.target.value})} />
                <input type="color" className="input" value={newTier.color} onChange={(e) => setNewTier({...newTier, color: e.target.value})} />
                
                <div>
                  <label>Benefits:</label>
                  {newTier.benefits.map((benefit, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input type="text" className="input" placeholder={`Benefit ${i + 1}`} value={benefit} onChange={(e) => updateBenefit(i, e.target.value)} />
                      {i > 0 && <button className="request-btn decline" onClick={() => removeBenefit(i)}>✗</button>}
                    </div>
                  ))}
                  <button className="btn btn-secondary btn-small" style={{ marginTop: '8px' }} onClick={addBenefit}>+ Add Benefit</button>
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
          <h4>Your Subscribers ({subscribers.length})</h4>
          <div style={{ marginTop: '12px' }}>
            {subscribers.map(sub => (
              <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '8px' }}>
                <div className="suggestion-avatar" style={{ width: '40px', height: '40px' }}>
                  <img src={sub.fan?.avatar_url || `https://ui-avatars.com/api/?name=${sub.fan?.username[0]}&background=7c3aed&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt="" />
                </div>
                <div style={{ flex: 1 }}>
                  <div><strong>{sub.fan?.display_name || sub.fan?.username}</strong></div>
                  <div style={{ fontSize: '11px', color: '#888' }}>Since {new Date(sub.started_at).toLocaleDateString()}</div>
                </div>
                <button className="btn btn-outline btn-small">Message</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}