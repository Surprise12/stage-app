// src/components/RoyaltySplit.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function RoyaltySplit({ trackId, onSave }) {
  const [contributors, setContributors] = useState([])
  const [newContributor, setNewContributor] = useState({ email: '', role: 'producer', percentage: 0 })
  const [totalPercentage, setTotalPercentage] = useState(0)
  const [suggestedContributors, setSuggestedContributors] = useState([])

  const roles = [
    { value: 'producer', label: 'Producer', icon: '🎹' },
    { value: 'vocalist', label: 'Vocalist', icon: '🎤' },
    { value: 'songwriter', label: 'Songwriter', icon: '✍️' },
    { value: 'mix_engineer', label: 'Mix Engineer', icon: '🎛️' },
    { value: 'mastering', label: 'Mastering Engineer', icon: '🔊' },
    { value: 'featured', label: 'Featured Artist', icon: '⭐' }
  ]

  useEffect(() => {
    const total = contributors.reduce((sum, c) => sum + c.percentage, 0)
    setTotalPercentage(total)
  }, [contributors])

  async function searchContributor(email) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, email, avatar_url')
      .eq('email', email)
      .single()
    
    if (data) {
      setSuggestedContributors([data])
    } else {
      setSuggestedContributors([])
    }
  }

  function addContributor(contributor) {
    if (newContributor.percentage <= 0) {
      alert('Please enter a valid percentage')
      return
    }

    if (totalPercentage + newContributor.percentage > 100) {
      alert(`Total percentage cannot exceed 100%. Currently at ${totalPercentage}%`)
      return
    }

    setContributors([...contributors, {
      id: Date.now(),
      ...newContributor,
      name: contributor?.display_name || contributor?.username || newContributor.email
    }])
    setNewContributor({ email: '', role: 'producer', percentage: 0 })
    setSuggestedContributors([])
  }

  function removeContributor(id) {
    setContributors(contributors.filter(c => c.id !== id))
  }

  async function saveRoyaltySplit() {
    if (totalPercentage !== 100) {
      alert(`Total percentage must equal 100%. Currently at ${totalPercentage}%`)
      return
    }

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
      alert('Royalty split saved! Payments will be automatically distributed.')
      if (onSave) onSave()
    }
  }

  return (
    <div className="card">
      <h3>💰 Royalty Split Agreement</h3>
      <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>
        Set how revenue from this track will be distributed among contributors
      </p>

      {/* Contributors List */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '12px' }}>Contributors</h4>
        {contributors.length === 0 ? (
          <p style={{ color: '#888', fontSize: '13px' }}>No contributors added yet</p>
        ) : (
          contributors.map(contributor => (
            <div key={contributor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '8px' }}>
              <div>
                <strong>{contributor.name}</strong>
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                  {roles.find(r => r.value === contributor.role)?.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>{contributor.percentage}%</span>
                <button className="request-btn decline" onClick={() => removeContributor(contributor.id)}>✗</button>
              </div>
            </div>
          ))
        )}
        
        <div style={{ marginTop: '12px', textAlign: 'right', fontWeight: 'bold' }}>
          Total: {totalPercentage}% / 100%
        </div>
      </div>

      {/* Add Contributor */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
        <h4 style={{ marginBottom: '12px' }}>Add Contributor</h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          <input 
            type="email" 
            className="input" 
            placeholder="Contributor Email" 
            value={newContributor.email}
            onChange={(e) => {
              setNewContributor({...newContributor, email: e.target.value})
              if (e.target.value.includes('@')) {
                searchContributor(e.target.value)
              }
            }}
          />
          
          {suggestedContributors.length > 0 && (
            <div style={{ background: '#f0f2f5', borderRadius: '8px', padding: '8px' }}>
              {suggestedContributors.map(user => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', cursor: 'pointer' }} onClick={() => addContributor(user)}>
                  <div className="suggestion-avatar" style={{ width: '32px', height: '32px' }}>
                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username[0]}&background=7c3aed&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%' }} alt="" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{user.display_name || user.username}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <select 
              className="input" 
              value={newContributor.role}
              onChange={(e) => setNewContributor({...newContributor, role: e.target.value})}
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.icon} {role.label}</option>
              ))}
            </select>
            <input 
              type="number" 
              className="input" 
              placeholder="Percentage %" 
              step="0.01"
              value={newContributor.percentage}
              onChange={(e) => setNewContributor({...newContributor, percentage: parseFloat(e.target.value) || 0})}
            />
          </div>
          
          <button className="btn btn-secondary" onClick={() => addContributor()}>
            Add Contributor
          </button>
        </div>
      </div>

      <button 
        className="btn btn-primary" 
        style={{ width: '100%', marginTop: '20px' }}
        onClick={saveRoyaltySplit}
        disabled={totalPercentage !== 100}
      >
        Save Royalty Split Agreement
      </button>
    </div>
  )
}