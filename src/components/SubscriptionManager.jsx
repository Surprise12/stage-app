import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SubscriptionManager({ creatorId, currentUser }) {
  const [subscription, setSubscription] = useState(null)
  const [tiers, setTiers] = useState([
    { name: 'Bronze', price: 2.99, color: '#cd7f32', perks: ['Early access to content', 'Badge on profile'] },
    { name: 'Silver', price: 4.99, color: '#c0c0c0', perks: ['All Bronze perks', 'Exclusive posts', 'Priority replies'] },
    { name: 'Gold', price: 9.99, color: '#ffd700', perks: ['All Silver perks', 'Monthly Q&A session', 'Exclusive videos'] },
    { name: 'Platinum', price: 19.99, color: '#e5e4e2', perks: ['All Gold perks', '1-on-1 call', 'Shoutout', 'Early access to music'] }
  ])

  useEffect(() => {
    checkSubscription()
  }, [])

  async function checkSubscription() {
    const { data } = await supabase
      .from('creator_subscriptions')
      .select('*')
      .eq('subscriber_id', currentUser.id)
      .eq('creator_id', creatorId)
      .single()

    if (data) setSubscription(data)
  }

  async function subscribe(tier, price) {
    const { error } = await supabase
      .from('creator_subscriptions')
      .insert({
        subscriber_id: currentUser.id,
        creator_id: creatorId,
        tier: tier.toLowerCase(),
        price: price,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Subscribed to ${tier} tier!`)
      checkSubscription()
    }
  }

  async function cancelSubscription() {
    await supabase
      .from('creator_subscriptions')
      .update({ status: 'cancelled', auto_renew: false })
      .eq('id', subscription.id)
    
    alert('Subscription cancelled')
    setSubscription(null)
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>Support This Creator</h3>
      
      {subscription ? (
        <div>
          <p>You are subscribed to <strong>{subscription.tier}</strong> tier</p>
          <p>Price: ${subscription.price}/month</p>
          <p>Expires: {new Date(subscription.expires_at).toLocaleDateString()}</p>
          <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={cancelSubscription}>
            Cancel Subscription
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {tiers.map(tier => (
            <div key={tier.name} style={{ padding: '16px', border: `1px solid ${tier.color}`, borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ color: tier.color }}>{tier.name}</h4>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${tier.price}<span style={{ fontSize: '0.8rem' }}>/mo</span></span>
              </div>
              <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
                {tier.perks.map(perk => <li key={perk} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>✓ {perk}</li>)}
              </ul>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => subscribe(tier.name, tier.price)}>
                Subscribe to {tier.name}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}