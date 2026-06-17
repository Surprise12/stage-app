// src/components/SubscriptionManager.jsx - UPDATED WITH INLINE STYLES
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
    try {
      const { data } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('subscriber_id', currentUser.id)
        .eq('creator_id', creatorId)
        .single()

      if (data) setSubscription(data)
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
    setLoading(false)
  }

  async function loadSubscribers() {
    try {
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
    } catch (error) {
      console.error('Error loading subscribers:', error)
    }
  }

  async function checkIfCreator() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .eq('role', 'artist')
        .single()
      
      setIsCreator(!!data)
    } catch (error) {
      console.error('Error checking creator status:', error)
    }
  }

  async function subscribe(tier, price) {
    try {
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

      if (error) throw error

      alert(`🎉 Subscribed to ${tier} tier! Thank you for supporting ${creatorName || 'this creator'}!`)
      setShowPaymentModal(false)
      checkSubscription()
      loadSubscribers()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function cancelSubscription() {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access to exclusive content.')) {
      try {
        await supabase
          .from('creator_subscriptions')
          .update({ status: 'cancelled', auto_renew: false })
          .eq('id', subscription.id)
        
        alert('Subscription cancelled')
        setSubscription(null)
      } catch (error) {
        console.error('Error cancelling subscription:', error)
      }
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

  const styles = {
    container: {
      padding: '24px',
      marginBottom: '20px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    headerTitle: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '700'
    },
    supporterBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      background: '#10b981',
      color: 'white'
    },
    description: {
      color: '#6b7280',
      marginBottom: '20px',
      fontWeight: '700'
    },
    currentSubscription: {
      padding: '20px',
      marginBottom: '20px',
      borderRadius: '16px',
      border: '1px solid',
      transition: 'all 0.2s'
    },
    subscriptionRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px'
    },
    subscriptionPlan: {
      marginBottom: '4px',
      fontWeight: '700'
    },
    subscriptionPrice: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    subscriptionDate: {
      fontSize: '12px',
      color: '#6b7280',
      fontWeight: '700'
    },
    subscriptionStatus: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      background: '#4caf50',
      color: 'white'
    },
    subscriptionActions: {
      marginTop: '16px',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    actionBtn: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    actionBtnOutline: {
      padding: '8px 16px',
      border: '1px solid #ddd',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      background: 'transparent',
      transition: 'all 0.2s'
    },
    tiersGrid: {
      display: 'grid',
      gap: '16px'
    },
    tierCard: {
      padding: '20px',
      borderRadius: '16px',
      border: '2px solid',
      background: 'rgba(255,255,255,0.02)',
      transition: 'transform 0.2s, border-color 0.2s',
      cursor: 'pointer'
    },
    tierHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    tierInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    tierIcon: {
      fontSize: '2rem'
    },
    tierName: {
      margin: 0,
      fontWeight: '700'
    },
    tierDescription: {
      fontSize: '11px',
      color: '#6b7280',
      margin: 0,
      fontWeight: '700'
    },
    tierPrice: {
      fontSize: '1.8rem',
      fontWeight: '700'
    },
    tierPriceSmall: {
      fontSize: '0.8rem',
      color: '#6b7280'
    },
    tierPerks: {
      margin: '12px 0 16px 0',
      paddingLeft: '20px'
    },
    tierPerkItem: {
      fontSize: '0.85rem',
      marginBottom: '6px',
      color: '#6b7280',
      fontWeight: '700'
    },
    subscribeBtn: {
      width: '100%',
      padding: '12px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(124,58,237,0.2)',
      borderTop: '4px solid #7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '20px auto'
    },
    statsContainer: {
      marginTop: '24px',
      padding: '16px',
      background: '#1a1a1a',
      borderRadius: '12px'
    },
    statsTitle: {
      marginBottom: '12px',
      fontWeight: '700',
      color: 'white'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      marginBottom: '12px'
    },
    statBox: {
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: '700',
      color: 'white'
    },
    statLabel: {
      fontSize: '11px',
      color: '#6b7280',
      fontWeight: '700'
    },
    statRevenue: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#10b981'
    },
    subscriberItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 0',
      borderBottom: '1px solid #2a2a2a'
    },
    subscriberAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    subscriberInfo: {
      flex: 1
    },
    subscriberName: {
      fontWeight: '700',
      fontSize: '13px',
      color: 'white'
    },
    subscriberDetail: {
      fontSize: '10px',
      color: '#6b7280',
      fontWeight: '700'
    },
    subscriberPrice: {
      fontSize: '12px',
      color: '#7c3aed',
      fontWeight: '700'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    modalContent: {
      background: 'white',
      borderRadius: '24px',
      padding: '24px',
      maxWidth: '450px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '20px'
    },
    modalCenter: {
      textAlign: 'center',
      marginBottom: '20px'
    },
    modalIcon: {
      fontSize: '3rem'
    },
    modalTierName: {
      marginTop: '8px',
      fontWeight: '700'
    },
    modalTierDesc: {
      color: '#6b7280',
      fontSize: '13px',
      fontWeight: '700'
    },
    modalPerksBox: {
      background: '#f5f5f5',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '20px'
    },
    modalPerksTitle: {
      fontWeight: '700'
    },
    modalPerksList: {
      marginTop: '8px',
      paddingLeft: '20px'
    },
    modalPerkItem: {
      fontSize: '13px',
      marginBottom: '4px',
      fontWeight: '700'
    },
    modalPayment: {
      marginBottom: '20px'
    },
    modalPaymentLabel: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '700'
    },
    modalSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      background: 'white'
    },
    modalConfirmBtn: {
      width: '100%',
      padding: '14px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s'
    },
    modalCancelBtn: {
      width: '100%',
      padding: '14px',
      background: 'transparent',
      color: '#666',
      border: '1px solid #ddd',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      marginTop: '8px',
      transition: 'all 0.2s'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>⭐ Support {creatorName || 'This Creator'}</h3>
        {isCreator && (
          <span style={styles.supporterBadge}>
            {getTotalSubscribers()} supporters
          </span>
        )}
      </div>
      
      <p style={styles.description}>
        Join the community and get exclusive access to content, behind-the-scenes updates, and special perks.
      </p>

      {/* Current Subscription */}
      {subscription && subscription.status === 'active' && (
        <div style={{
          ...styles.currentSubscription,
          background: `linear-gradient(135deg, ${tierColors[subscription.tier?.toLowerCase()] || '#7c3aed'}15, ${tierColors[subscription.tier?.toLowerCase()] || '#7c3aed'}05)`,
          borderColor: `${tierColors[subscription.tier?.toLowerCase()] || '#7c3aed'}30`
        }}>
          <div style={styles.subscriptionRow}>
            <div>
              <h4 style={styles.subscriptionPlan}>Your Plan: {subscription.tier}</h4>
              <p style={styles.subscriptionPrice}>${subscription.price}/month</p>
              <p style={styles.subscriptionDate}>Next billing: {new Date(subscription.expires_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span style={styles.subscriptionStatus}>Active ✓</span>
            </div>
          </div>
          <div style={styles.subscriptionActions}>
            <button 
              style={styles.actionBtnOutline}
              onClick={cancelSubscription}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              Cancel
            </button>
            <button 
              style={styles.actionBtn}
              onClick={updatePaymentMethod}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              Update Payment
            </button>
          </div>
        </div>
      )}

      {/* Subscription Tiers */}
      {!subscription && !loading && (
        <div style={styles.tiersGrid}>
          {tiers.map(tier => (
            <div 
              key={tier.name} 
              style={{
                ...styles.tierCard,
                borderColor: `${tier.color}30`
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
              <div style={styles.tierHeader}>
                <div style={styles.tierInfo}>
                  <span style={styles.tierIcon}>{tier.icon}</span>
                  <div>
                    <h4 style={{...styles.tierName, color: tier.color}}>{tier.name}</h4>
                    <p style={styles.tierDescription}>{tier.description}</p>
                  </div>
                </div>
                <span style={{...styles.tierPrice, color: tier.color}}>
                  ${tier.price}
                  <span style={styles.tierPriceSmall}>/mo</span>
                </span>
              </div>
              <ul style={styles.tierPerks}>
                {tier.perks.map(perk => (
                  <li key={perk} style={styles.tierPerkItem}>
                    {perk}
                  </li>
                ))}
              </ul>
              <button 
                style={styles.subscribeBtn}
                onClick={() => {
                  setSelectedTier(tier)
                  setShowPaymentModal(true)
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
              >
                Subscribe to {tier.name} - ${tier.price}/mo
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={styles.spinner}></div>}

      {/* Creator Stats (if user is creator) */}
      {isCreator && subscribers.length > 0 && (
        <div style={styles.statsContainer}>
          <h4 style={styles.statsTitle}>Your Supporters</h4>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statNumber}>{getTotalSubscribers()}</div>
              <div style={styles.statLabel}>Total Supporters</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statRevenue}>${getMonthlyRevenue().toFixed(2)}</div>
              <div style={styles.statLabel}>Monthly Revenue</div>
            </div>
          </div>
          {subscribers.slice(0, 5).map(sub => (
            <div key={sub.id} style={styles.subscriberItem}>
              <img 
                src={sub.subscriber?.avatar_url || `https://ui-avatars.com/api/?name=${(sub.subscriber?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                style={styles.subscriberAvatar} 
                alt="avatar" 
              />
              <div style={styles.subscriberInfo}>
                <div style={styles.subscriberName}>{sub.subscriber?.display_name || sub.subscriber?.username}</div>
                <div style={styles.subscriberDetail}>{sub.tier} tier • {new Date(sub.started_at).toLocaleDateString()}</div>
              </div>
              <span style={styles.subscriberPrice}>${sub.price}/mo</span>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTier && (
        <div style={styles.modal} onClick={() => setShowPaymentModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Confirm Subscription</div>
            
            <div style={styles.modalCenter}>
              <span style={styles.modalIcon}>{selectedTier.icon}</span>
              <h3 style={{...styles.modalTierName, color: selectedTier.color}}>{selectedTier.name} - ${selectedTier.price}/mo</h3>
              <p style={styles.modalTierDesc}>{selectedTier.description}</p>
            </div>
            
            <div style={styles.modalPerksBox}>
              <strong style={styles.modalPerksTitle}>You'll get:</strong>
              <ul style={styles.modalPerksList}>
                {selectedTier.perks.map(perk => (
                  <li key={perk} style={styles.modalPerkItem}>{perk}</li>
                ))}
              </ul>
            </div>
            
            <div style={styles.modalPayment}>
              <label style={styles.modalPaymentLabel}>Payment Method</label>
              <select style={styles.modalSelect}>
                <option>💳 Credit Card (****4242)</option>
                <option>🔄 Add New Card</option>
                <option>💰 PayPal</option>
              </select>
            </div>
            
            <button 
              style={styles.modalConfirmBtn}
              onClick={() => subscribe(selectedTier.name, selectedTier.price)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              Confirm - ${selectedTier.price}/month
            </button>
            <button 
              style={styles.modalCancelBtn}
              onClick={() => setShowPaymentModal(false)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}