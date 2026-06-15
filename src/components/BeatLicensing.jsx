// src/components/BeatLicensing.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function BeatLicensing({ beat, onPurchase }) {
  const [selectedLicense, setSelectedLicense] = useState('basic')
  const [contract, setContract] = useState(null)
  const [showContract, setShowContract] = useState(false)

  const licenses = [
    { 
      id: 'basic', 
      name: 'Basic License', 
      price: 29.99,
      rights: [
        'Non-exclusive rights',
        'Up to 5,000 streams',
        'Social media use',
        'No sync to film/TV'
      ],
      royalty: '50% publishing'
    },
    { 
      id: 'premium', 
      name: 'Premium License', 
      price: 99.99,
      rights: [
        'Non-exclusive rights',
        'Unlimited streams',
        'Social media + YouTube monetization',
        'Sync to indie film/TV allowed',
        'Radio play allowed'
      ],
      royalty: '25% publishing'
    },
    { 
      id: 'exclusive', 
      name: 'Exclusive License', 
      price: 499.99,
      rights: [
        'Full exclusive rights',
        'Unlimited everything',
        'You keep 100% royalties',
        'Beat removed from marketplace',
        'Includes stems + trackouts'
      ],
      royalty: '0% publishing'
    }
  ]

  const generateContract = () => {
    const contractTemplate = `
BEAT LICENSE AGREEMENT

This agreement is made between ${beat.profiles?.display_name} ("Producer") and Licensee.

BEAT TITLE: ${beat.title}
LICENSE TYPE: ${licenses.find(l => l.id === selectedLicense)?.name}
PRICE: $${licenses.find(l => l.id === selectedLicense)?.price}

RIGHTS GRANTED:
${licenses.find(l => l.id === selectedLicense)?.rights.map(r => `- ${r}`).join('\n')}

ROYALTY SPLIT:
${licenses.find(l => l.id === selectedLicense)?.royalty}

TERMS:
- This license is non-transferable
- Producer retains original copyright
- Licensee may not resell or distribute beat as-is
- Credit required: "Prod. by ${beat.profiles?.display_name}"

Date: ${new Date().toLocaleDateString()}
    `
    setContract(contractTemplate)
    setShowContract(true)
  }

  const handlePurchase = async () => {
    const selected = licenses.find(l => l.id === selectedLicense)
    
    const { error } = await supabase
      .from('beat_purchases')
      .insert({
        beat_id: beat.id,
        buyer_id: (await supabase.auth.getUser()).data.user?.id,
        license_type: selectedLicense,
        amount_paid: selected.price,
        contract_signed: true
      })

    if (error) {
      alert('Purchase failed: ' + error.message)
    } else {
      alert(`License purchased! Check your email for contract and download link.`)
      if (onPurchase) onPurchase()
    }
  }

  return (
    <div className="card">
      <h3>License This Beat</h3>
      <div className="licenses-grid" style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
        {licenses.map(license => (
          <label 
            key={license.id} 
            className={`license-card ${selectedLicense === license.id ? 'selected' : ''}`}
            style={{ 
              padding: '16px', 
              border: selectedLicense === license.id ? '2px solid #7c3aed' : '1px solid #ddd',
              borderRadius: '12px',
              cursor: 'pointer',
              background: selectedLicense === license.id ? 'rgba(124,58,237,0.05)' : 'white'
            }}
            onClick={() => setSelectedLicense(license.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ fontSize: '16px' }}>{license.name}</strong>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>${license.price}</span>
            </div>
            <ul style={{ marginLeft: '20px', fontSize: '13px', color: '#666' }}>
              {license.rights.map((right, i) => (
                <li key={i}>{right}</li>
              ))}
            </ul>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>Royalty: {license.royalty}</p>
          </label>
        ))}
      </div>
      
      <div className="profile-action-buttons" style={{ marginTop: '20px', gap: '12px' }}>
        <button className="btn btn-primary" onClick={generateContract}>Preview Contract</button>
        <button className="btn btn-primary" onClick={handlePurchase}>Purchase License</button>
      </div>

      {showContract && (
        <div className="modal active" onClick={() => setShowContract(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">License Agreement</div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', maxHeight: '400px', overflowY: 'auto', background: '#f5f5f5', padding: '16px', borderRadius: '8px' }}>
              {contract}
            </pre>
            <button className="apply-btn" onClick={() => setShowContract(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}