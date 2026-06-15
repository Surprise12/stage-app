import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Settings({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    website: '',
    instagram: '',
    twitter: '',
    location: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (data) {
      setProfile({
        display_name: data.display_name || '',
        bio: data.bio || '',
        website: data.website || '',
        instagram: data.instagram || '',
        twitter: data.twitter || '',
        location: data.location || ''
      })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', session.user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => navigate('/profile'), 1500)
    }
    setLoading(false)
  }

  async function submitVerificationRequest(e) {
    e.preventDefault()
    const role = document.getElementById('verificationRole').value
    const message = document.getElementById('verificationMessage').value

    const { error } = await supabase
      .from('verification_requests')
      .insert({
        user_id: session.user.id,
        role_requested: role,
        message: message,
        status: 'pending'
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Verification request submitted! Admins will review it.')
    }
  }

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '30px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px' }}>⚙️ Profile Settings</h1>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px' }}>Profile Information</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Display Name</label>
            <input
              type="text"
              className="input"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Your display name"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Bio</label>
            <textarea
              className="input"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell the community about yourself..."
              rows="3"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Website</label>
            <input
              type="url"
              className="input"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              placeholder="https://yourwebsite.com"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Instagram Username</label>
            <input
              type="text"
              className="input"
              value={profile.instagram}
              onChange={(e) => setProfile({ ...profile, instagram: e.target.value.replace('@', '') })}
              placeholder="@username"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Twitter Username</label>
            <input
              type="text"
              className="input"
              value={profile.twitter}
              onChange={(e) => setProfile({ ...profile, twitter: e.target.value.replace('@', '') })}
              placeholder="@username"
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Location</label>
            <input
              type="text"
              className="input"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              placeholder="City, Country"
            />
          </div>
          
          {message && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '12px', 
              marginBottom: '16px',
              background: message.type === 'error' ? '#5d1a1a' : '#1a5d1a',
              color: message.type === 'error' ? '#d6a5a5' : '#a5d6a5'
            }}>
              {message.text}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
      
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>🎤 Request Verification</h3>
        <p style={{ color: '#888', marginBottom: '16px' }}>Get the blue checkmark and unlock the Music Videos section.</p>
        <form onSubmit={submitVerificationRequest}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>I am a...</label>
            <select id="verificationRole" className="input">
              <option value="artist">Artist / Musician</option>
              <option value="producer">Producer</option>
              <option value="comedian">Comedian</option>
              <option value="manager">Manager / Label</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Why should you be verified?</label>
            <textarea
              id="verificationMessage"
              className="input"
              rows="3"
              placeholder="Tell us about your work, links to your music, following, etc..."
            ></textarea>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Submit Request
          </button>
        </form>
      </div>
    </div>
  )
}