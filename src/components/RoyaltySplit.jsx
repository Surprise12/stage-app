// src/components/RoyaltySplit.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function RoyaltySplit({ trackId, trackTitle, onSave, onClose }) {
  const [contributors, setContributors] = useState([])
  const [newContributor, setNewContributor] = useState({ 
    email: '', 
    role: 'producer', 
    percentage: 0,
    name: ''
  })
  const [totalPercentage, setTotalPercentage] = useState(0)
  const [suggestedContributors, setSuggestedContributors] = useState([])
  const [showContract, setShowContract] = useState(false)
  const [contractText, setContractText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const roles = [
    { value: 'producer', label: 'Producer', icon: '🎹' },
    { value: 'vocalist', label: 'Vocalist', icon: '🎤' },
    { value: 'songwriter', label: 'Songwriter', icon: '✍️' },
    { value: 'mix_engineer', label: 'Mix Engineer', icon: '🎛️' },
    { value: 'mastering', label: 'Mastering Engineer', icon: '🔊' },
    { value: 'featured', label: 'Featured Artist', icon: '⭐' },
    { value: 'lyricist', label: 'Lyricist', icon: '📝' },
    { value: 'composer', label: 'Composer', icon: '🎼' }
  ]

  useEffect(() => {
    const total = contributors.reduce((sum, c) => sum + c.percentage, 0)
    setTotalPercentage(total)
  }, [contributors])

  async function searchContributor(query) {
    if (!query.trim()) {
      setSuggestedContributors([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, email, avatar_url, is_verified')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', (await supabase.auth.getUser()).data.user?.id)
      .limit(5)
    
    if (data) setSuggestedContributors(data)
  }

  function addContributor(contributor) {
    if (newContributor.percentage <= 0 || !newContributor.percentage) {
      alert('Please enter a valid percentage (greater than 0)')
      return
    }

    if (totalPercentage + newContributor.percentage > 100) {
      alert(`Total percentage cannot exceed 100%. Currently at ${totalPercentage}%`)
      return
    }

    const user = contributor || suggestedContributors[0]
    if (!user && !newContributor.name) {
      alert('Please select or enter a contributor name')
      return
    }

    setContributors([...contributors, {
      id: Date.now(),
      user_id: user?.id || null,
      name: user?.display_name || user?.username || newContributor.name || newContributor.email,
      email: user?.email || newContributor.email,
      avatar_url: user?.avatar_url || null,
      role: newContributor.role,
      percentage: parseFloat(newContributor.percentage),
      is_verified: user?.is_verified || false
    }])
    
    setNewContributor({ email: '', role: 'producer', percentage: 0, name: '' })
    setSuggestedContributors([])
    setSearchQuery('')
  }

  function removeContributor(id) {
    setContributors(contributors.filter(c => c.id !== id))
  }

  function updatePercentage(id, newPercentage) {
    const value = parseFloat(newPercentage) || 0
    setContributors(contributors.map(c => 
      c.id === id ? { ...c, percentage: value } : c
    ))
  }

  function updateRole(id, newRole) {
    setContributors(contributors.map(c => 
      c.id === id ? { ...c, role: newRole } : c
    ))
  }

  async function saveRoyaltySplit() {
    if (totalPercentage !== 100) {
      alert(`Total percentage must equal 100%. Currently at ${totalPercentage}%`)
      return
    }

    if (contributors.length === 0) {
      alert('Please add at least one contributor')
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase
      .from('track_contributors')
      .insert(
        contributors.map(c => ({
          track_id: trackId,
          user_id: c.user_id,
          role: c.role,
          percentage: c.percentage
        }))
      )

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Royalty split saved! Payments will be automatically distributed.')
      if (onSave) onSave()
      if (onClose) onClose()
    }
    setIsSubmitting(false)
  }

  function generateContract() {
    const contract = `ROYALTY SPLIT AGREEMENT

Track: ${trackTitle || 'Untitled Track'}
Date: ${new Date().toLocaleDateString()}

CONTRIBUTORS:
${contributors.map(c => 
  `- ${c.name || c.email} (${roles.find(r => r.value === c.role)?.label || c.role}): ${c.percentage}%`
).join('\n')}

TOTAL: 100%

TERMS:
1. All contributors agree to the percentage split above.
2. Payments will be distributed automatically based on this agreement.
3. Each contributor retains their share of royalties.
4. This agreement is binding and can only be amended with mutual consent.

Signatures:
${contributors.map(c => `${c.name || c.email}:\n`).join('\n')}

Date: ${new Date().toLocaleDateString()}`

    setContractText(contract)
    setShowContract(true)
  }

  function downloadContract() {
    const blob = new Blob([contractText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Royalty_Split_${trackTitle || 'Track'}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const progressColor = totalPercentage === 100 ? '#10b981' : totalPercentage > 100 ? '#ef4444' : '#f59e0b'

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>💰 Royalty Split Agreement</h3>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#999' }}>✕</button>
        )}
      </div>
      
      {trackTitle && (
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
          Track: <strong>{trackTitle}</strong>
        </p>
      )}
      
      <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>
        Set how revenue from this track will be distributed among contributors. Total must equal 100%.
      </p>

      {/* Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
          <span>Progress</span>
          <span style={{ fontWeight: 'bold', color: progressColor }}>{totalPercentage}% / 100%</span>
        </div>
        <div style={{ background: '#2a2a2a', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${Math.min(totalPercentage, 100)}%`, 
            height: '100%', 
            background: progressColor,
            borderRadius: '10px',
            transition: 'width 0.3s'
          }}></div>
        </div>
        {totalPercentage > 100 && (
          <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>⚠️ Total exceeds 100%</p>
        )}
      </div>

      {/* Contributors List */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Contributors</h4>
        {contributors.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            background: '#f5f5f5', 
            borderRadius: '12px',
            color: '#888'
          }}>
            <i className="fas fa-user-plus" style={{ fontSize: '24px', display: 'block', marginBottom: '8px', color: '#ccc' }}></i>
            <p>No contributors added yet</p>
            <p style={{ fontSize: '12px' }}>Add contributors below</p>
          </div>
        ) : (
          contributors.map(contributor => (
            <div key={contributor.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px', 
              background: '#f5f5f5', 
              borderRadius: '8px', 
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={contributor.avatar_url || `https://ui-avatars.com/api/?name=${(contributor.name?.[0] || 'U')}&background=7c3aed&color=fff`} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                  alt="avatar" 
                />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {contributor.name || contributor.email}
                    {contributor.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select 
                      className="input" 
                      value={contributor.role}
                      onChange={(e) => updateRole(contributor.id, e.target.value)}
                      style={{ padding: '2px 8px', fontSize: '11px', width: 'auto', minWidth: '100px', height: '28px' }}
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.icon} {role.label}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      className="input" 
                      value={contributor.percentage}
                      onChange={(e) => updatePercentage(contributor.id, e.target.value)}
                      style={{ padding: '2px 8px', fontSize: '11px', width: '70px', height: '28px' }}
                      step="0.01"
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>%</span>
                  </div>
                </div>
              </div>
              <button 
                className="request-btn decline" 
                onClick={() => removeContributor(contributor.id)}
                style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✗
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Contributor */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
        <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Add Contributor</h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Search by name, email, or username" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                searchContributor(e.target.value)
              }}
            />
            
            {suggestedContributors.length > 0 && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                background: 'white', 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {suggestedContributors.map(user => (
                  <div 
                    key={user.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '10px 12px', 
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f2f5',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    onClick={() => {
                      setNewContributor({ 
                        ...newContributor, 
                        email: user.email,
                        name: user.display_name || user.username,
                        percentage: 10
                      })
                      setSuggestedContributors([])
                      setSearchQuery('')
                    }}
                  >
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                      alt="avatar" 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{user.display_name || user.username}</div>
                      <div style={{ fontSize: '11px', color: '#888' }}>{user.email}</div>
                    </div>
                    {user.is_verified && <span style={{ color: '#1da1f2', fontSize: '12px' }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px' }}>
            <select 
              className="input" 
              value={newContributor.role}
              onChange={(e) => setNewContributor({...newContributor, role: e.target.value})}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.icon} {role.label}</option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input 
                type="number" 
                className="input" 
                placeholder="%" 
                step="0.01"
                value={newContributor.percentage}
                onChange={(e) => setNewContributor({...newContributor, percentage: parseFloat(e.target.value) || 0})}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '12px', color: '#888' }}>%</span>
            </div>
            <button 
              className="btn btn-primary btn-small" 
              onClick={() => addContributor()}
              disabled={!newContributor.percentage || newContributor.percentage <= 0}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button 
          className="btn btn-secondary" 
          style={{ flex: 1 }}
          onClick={generateContract}
          disabled={contributors.length === 0}
        >
          📄 Preview Contract
        </button>
        <button 
          className="btn btn-primary" 
          style={{ flex: 2 }}
          onClick={saveRoyaltySplit}
          disabled={totalPercentage !== 100 || contributors.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : '💾 Save Royalty Split'}
        </button>
      </div>

      {/* Contract Modal */}
      {showContract && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowContract(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">📄 Royalty Split Contract</div>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '12px', 
              maxHeight: '400px', 
              overflowY: 'auto', 
              background: '#f5f5f5', 
              padding: '20px', 
              borderRadius: '12px',
              fontFamily: 'monospace',
              color: '#333',
              marginBottom: '16px'
            }}>
              {contractText}
            </pre>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={downloadContract}>
                <i className="fas fa-download"></i> Download
              </button>
              <button className="btn btn-secondary" onClick={() => setShowContract(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}