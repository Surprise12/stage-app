// src/components/BeatLicensing.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function BeatLicensing({ beat, onPurchase, onClose }) {
  const [selectedLicense, setSelectedLicense] = useState('basic')
  const [contract, setContract] = useState(null)
  const [showContract, setShowContract] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')

  const licenses = [
    { 
      id: 'basic', 
      name: 'Basic License', 
      price: 29.99,
      popular: false,
      rights: [
        '🎵 Non-exclusive rights',
        '📱 Up to 5,000 streams',
        '📱 Social media use (Instagram, TikTok, YouTube Shorts)',
        '🚫 No sync to film/TV',
        '🎤 Credit required: "Prod. by"'
      ],
      royalty: 'Producer retains 50% publishing',
      color: '#10b981'
    },
    { 
      id: 'premium', 
      name: 'Premium License', 
      price: 99.99,
      popular: true,
      rights: [
        '🎵 Non-exclusive rights',
        '📱 Unlimited streams',
        '💰 YouTube monetization allowed',
        '🎬 Sync to indie film/TV allowed',
        '📻 Radio play allowed',
        '🎤 Credit required'
      ],
      royalty: 'Producer retains 25% publishing',
      color: '#3b82f6'
    },
    { 
      id: 'exclusive', 
      name: 'Exclusive License', 
      price: 499.99,
      popular: false,
      rights: [
        '🎵 Full exclusive rights',
        '📱 Unlimited everything',
        '💰 You keep 100% royalties',
        '❌ Beat removed from marketplace after purchase',
        '🎧 Includes stems + trackouts',
        '✍️ Full ownership transfer'
      ],
      royalty: 'Producer retains 0% publishing',
      color: '#f59e0b'
    }
  ]

  const generateContract = () => {
    const selected = licenses.find(l => l.id === selectedLicense)
    const contractTemplate = `SOCIALVIBE BEAT LICENSE AGREEMENT

Agreement Date: ${new Date().toLocaleDateString()}
License ID: SV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}

BETWEEN:
Producer: ${beat.profiles?.display_name || beat.profiles?.username} ("Licensor")
Licensee: ${(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Licensee'
})()}

BEAT DETAILS:
Title: ${beat.title}
Genre: ${beat.genre}
BPM: ${beat.bpm}
Key: ${beat.key}

LICENSE TYPE: ${selected.name}
LICENSE FEE: $${selected.price}

RIGHTS GRANTED:
${selected.rights.map(r => `- ${r}`).join('\n')}

ROYALTY SPLIT:
${selected.royalty}

TERMS & CONDITIONS:
1. This license is non-transferable and non-assignable.
2. Licensor retains original copyright of the beat.
3. Licensee may not resell or distribute the beat as-is.
4. Credit must be given to Licensor in all releases: "Prod. by ${beat.profiles?.display_name || beat.profiles?.username}"
5. Licensor is not liable for any claims arising from use of the beat.
6. This agreement is governed by the laws of the jurisdiction.

PAYMENT TERMS:
Full payment of $${selected.price} is required before download access is granted.

By signing below, both parties agree to the terms outlined in this agreement.

_________________________________
Licensor Signature

_________________________________
Licensee Signature

Date: ${new Date().toLocaleDateString()}

For questions regarding this license, contact: legal@socialvibe.com`

    setContract(contractTemplate)
    setShowContract(true)
  }

  const downloadContract = () => {
    const blob = new Blob([contract], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Beat_License_${beat.title.replace(/\s/g, '_')}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePurchase = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions')
      return
    }

    setPurchasing(true)
    
    const selected = licenses.find(l => l.id === selectedLicense)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('beat_purchases')
      .insert({
        beat_id: beat.id,
        buyer_id: user?.id,
        license_type: selectedLicense,
        amount_paid: selected.price,
        contract_signed: true,
        payment_method: paymentMethod,
        purchased_at: new Date().toISOString()
      })

    if (error) {
      alert('Purchase failed: ' + error.message)
    } else {
      // Update beat purchase count
      await supabase
        .from('beats')
        .update({ purchases_count: (beat.purchases_count || 0) + 1 })
        .eq('id', beat.id)
      
      // Create notification for producer
      await supabase
        .from('notifications')
        .insert({
          user_id: beat.user_id,
          actor_id: user?.id,
          type: 'beat_purchase',
          target_id: beat.id
        })
      
      alert(`✓ License purchased successfully!\n\nCheck your email for:\n- License agreement\n- Download link for ${beat.title}\n- Receipt for $${selected.price}`)
      
      if (onPurchase) onPurchase()
      if (onClose) onClose()
    }
    setPurchasing(false)
  }

  const getLicenseIcon = (licenseId) => {
    switch(licenseId) {
      case 'basic': return '🎵'
      case 'premium': return '💎'
      case 'exclusive': return '👑'
      default: return '📜'
    }
  }

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>📝 License This Beat</h3>
        {onClose && (
          <button className="btn btn-outline btn-small" onClick={onClose}>✕ Close</button>
        )}
      </div>
      
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px' }}>
        Choose a license that fits your needs. All licenses include high-quality WAV files.
      </p>
      
      <div className="licenses-grid" style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
        {licenses.map(license => (
          <div 
            key={license.id} 
            className={`license-card ${selectedLicense === license.id ? 'selected' : ''}`}
            style={{ 
              padding: '20px', 
              border: selectedLicense === license.id ? `2px solid ${license.color}` : '1px solid #2a2a2a',
              borderRadius: '16px',
              cursor: 'pointer',
              background: selectedLicense === license.id ? `rgba(${license.color === '#10b981' ? '16,185,129' : license.color === '#3b82f6' ? '59,130,246' : '245,158,11'}, 0.05)` : 'rgba(255,255,255,0.02)',
              position: 'relative',
              transition: 'all 0.2s'
            }}
            onClick={() => setSelectedLicense(license.id)}
          >
            {license.popular && (
              <div style={{ 
                position: 'absolute', 
                top: '-10px', 
                right: '20px', 
                background: '#f59e0b', 
                color: 'white', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '11px', 
                fontWeight: 'bold' 
              }}>
                Most Popular
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '28px' }}>{getLicenseIcon(license.id)}</span>
                <strong style={{ fontSize: '18px' }}>{license.name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: license.color }}>${license.price}</span>
                {selectedLicense === license.id && (
                  <span style={{ marginLeft: '8px', color: '#10b981' }}>✓ Selected</span>
                )}
              </div>
            </div>
            <ul style={{ marginLeft: '20px', fontSize: '13px', color: '#aaa', marginBottom: '12px' }}>
              {license.rights.map((right, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{right}</li>
              ))}
            </ul>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#ffc371' }}>💰 {license.royalty}</p>
          </div>
        ))}
      </div>
      
      {/* Payment Method */}
      <div style={{ marginTop: '24px', padding: '16px', background: '#1a1a1a', borderRadius: '12px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>Payment Method</label>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="card" 
              checked={paymentMethod === 'card'} 
              onChange={() => setPaymentMethod('card')}
            />
            💳 Credit/Debit Card
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="paypal" 
              checked={paymentMethod === 'paypal'} 
              onChange={() => setPaymentMethod('paypal')}
            />
            <i className="fab fa-paypal"></i> PayPal
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="paymentMethod" 
              value="crypto" 
              checked={paymentMethod === 'crypto'} 
              onChange={() => setPaymentMethod('crypto')}
            />
            ₿ Cryptocurrency
          </label>
        </div>
      </div>
      
      {/* Terms Agreement */}
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={agreedToTerms} 
            onChange={(e) => setAgreedToTerms(e.target.checked)}
          />
          <span>I agree to the <a href="#" onClick={(e) => { e.preventDefault(); generateContract() }} style={{ color: '#7c3aed' }}>License Terms</a> and Conditions</span>
        </label>
      </div>
      
      {/* Action Buttons */}
      <div className="profile-action-buttons" style={{ marginTop: '20px', gap: '12px' }}>
        <button className="btn btn-secondary" onClick={generateContract}>
          <i className="fas fa-file-alt"></i> Preview Contract
        </button>
        <button 
          className="btn btn-primary" 
          onClick={handlePurchase} 
          disabled={purchasing || !agreedToTerms}
          style={{ flex: 2 }}
        >
          {purchasing ? 'Processing...' : `Purchase ${licenses.find(l => l.id === selectedLicense)?.name} - $${licenses.find(l => l.id === selectedLicense)?.price}`}
        </button>
      </div>

      {/* Contract Modal */}
      {showContract && (
        <div className="modal active" onClick={() => setShowContract(false)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📄 License Agreement</div>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '12px', 
              maxHeight: '500px', 
              overflowY: 'auto', 
              background: '#f5f5f5', 
              padding: '20px', 
              borderRadius: '12px',
              color: '#333',
              fontFamily: 'monospace'
            }}>
              {contract}
            </pre>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={downloadContract}>
                <i className="fas fa-download"></i> Download Contract
              </button>
              <button className="btn btn-secondary" onClick={() => setShowContract(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Secure Payment Note */}
      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
        <i className="fas fa-lock"></i> Secure payment powered by Stripe • 100% money-back guarantee within 7 days
      </div>
    </div>
  )
}