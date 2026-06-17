// src/pages/Upgrades.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Upgrades({ session }) {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState(null)

  const plans = [
    {
      name: 'Creator',
      price: 9.99,
      icon: '🎵',
      color: '#7c3aed',
      features: [
        'Verified badge on profile',
        'Upload unlimited music',
        'Priority support',
        'Analytics dashboard',
        'Custom profile URL'
      ]
    },
    {
      name: 'Pro',
      price: 19.99,
      icon: '⭐',
      color: '#f59e0b',
      features: [
        'All Creator features',
        'Monetization tools',
        'Fan subscriptions',
        'Live streaming',
        'Advanced analytics',
        'Promoted content',
        'Virtual concerts'
      ]
    },
    {
      name: 'Enterprise',
      price: 49.99,
      icon: '💎',
      color: '#10b981',
      features: [
        'All Pro features',
        'Team management',
        'Custom branding',
        'API access',
        'Dedicated support',
        'White-label options',
        'Multiple profiles',
        'Advanced security'
      ]
    }
  ]

  async function handleSubscribe(plan) {
    setSelectedPlan(plan)
    // In production, this would integrate with Stripe/PayPal
    alert(`🚀 You selected the ${plan.name} plan for $${plan.price}/month!\n\nIn production, this would redirect to payment.`)
    setSelectedPlan(null)
  }

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: '8px'
    },
    subtitle: {
      textAlign: 'center',
      color: '#6b7280',
      marginBottom: '40px',
      fontSize: '18px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      textAlign: 'center',
      transition: 'all 0.3s',
      position: 'relative'
    },
    popularBadge: {
      position: 'absolute',
      top: '-12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#7c3aed',
      color: 'white',
      padding: '4px 16px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700'
    },
    icon: {
      fontSize: '48px',
      marginBottom: '12px'
    },
    planName: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    price: {
      fontSize: '36px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    priceSub: {
      color: '#6b7280',
      fontSize: '14px',
      marginBottom: '16px'
    },
    features: {
      textAlign: 'left',
      marginBottom: '24px'
    },
    feature: {
      padding: '6px 0',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '14px',
      fontWeight: '700'
    },
    featureIcon: {
      color: '#10b981',
      marginRight: '8px'
    },
    subscribeBtn: {
      width: '100%',
      padding: '12px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚀 Upgrade Your Account</h1>
      <p style={styles.subtitle}>Unlock more features and grow your presence</p>

      <div style={styles.grid}>
        {plans.map((plan, index) => (
          <div
            key={plan.name}
            style={{
              ...styles.card,
              transform: index === 1 ? 'scale(1.02)' : 'scale(1)',
              borderColor: index === 1 ? plan.color : '#e5e7eb'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = index === 1 ? 'scale(1.05)' : 'scale(1.03)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = index === 1 ? 'scale(1.02)' : 'scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            {index === 1 && <div style={styles.popularBadge}>⭐ Most Popular</div>}
            <div style={styles.icon}>{plan.icon}</div>
            <div style={{...styles.planName, color: plan.color}}>{plan.name}</div>
            <div style={styles.price}>${plan.price}</div>
            <div style={styles.priceSub}>per month</div>

            <div style={styles.features}>
              {plan.features.map((feature, i) => (
                <div key={i} style={styles.feature}>
                  <span style={styles.featureIcon}>✓</span> {feature}
                </div>
              ))}
            </div>

            <button
              style={styles.subscribeBtn}
              onClick={() => handleSubscribe(plan)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
              disabled={selectedPlan === plan}
            >
              {selectedPlan === plan ? 'Processing...' : `Subscribe to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}