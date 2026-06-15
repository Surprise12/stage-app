// src/pages/Settings.jsx
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
    youtube: '',
    spotify: '',
    location: '',
    birthday: '',
    relationship: '',
    education: '',
    work: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [notifications, setNotifications] = useState({
    email_likes: true,
    email_comments: true,
    email_follows: true,
    push_likes: true,
    push_comments: true,
    push_follows: true
  })
  const [privacy, setPrivacy] = useState({
    profile_visibility: 'public',
    post_privacy: 'public',
    message_privacy: 'everyone'
  })

  useEffect(() => {
    loadProfile()
    loadSettings()
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
        youtube: data.youtube || '',
        spotify: data.spotify || '',
        location: data.location || '',
        birthday: data.birthday || '',
        relationship: data.relationship || '',
        education: data.education || '',
        work: data.work || ''
      })
    }
  }

  async function loadSettings() {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    
    if (data) {
      if (data.notifications) setNotifications(data.notifications)
      if (data.privacy) setPrivacy(data.privacy)
    }
  }

  async function saveSettings() {
    await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        notifications: notifications,
        privacy: privacy,
        updated_at: new Date().toISOString()
      })
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
      await saveSettings()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => navigate('/profile'), 1500)
    }
    setLoading(false)
  }

  async function changePassword(e) {
    e.preventDefault()
    if (passwordData.new !== passwordData.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ 
      password: passwordData.new 
    })
    
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setPasswordData({ current: '', new: '', confirm: '' })
    }
    setLoading(false)
  }

  async function submitVerificationRequest(e) {
    e.preventDefault()
    const role = document.getElementById('verificationRole').value
    const messageText = document.getElementById('verificationMessage').value

    const { error } = await supabase
      .from('verification_requests')
      .insert({
        user_id: session.user.id,
        role_requested: role,
        message: messageText,
        status: 'pending'
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Verification request submitted! Admins will review it.')
      document.getElementById('verificationMessage').value = ''
    }
  }

  async function requestDataExport() {
    alert('Your data export request has been submitted. You will receive an email within 24 hours.')
  }

  async function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      const confirmText = prompt('Type "DELETE" to confirm account deletion:')
      if (confirmText === 'DELETE') {
        await supabase.from('profiles').delete().eq('id', session.user.id)
        await supabase.auth.signOut()
        navigate('/login')
      }
    }
  }

  return (
    <div className="container" style={{ maxWidth: '700px', marginTop: '30px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '8px' }}>⚙️ Settings</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>Manage your account preferences</p>
      
      {/* Settings Tabs */}
      <div className="tabs" style={{ marginBottom: '24px', borderBottom: '2px solid #eee' }}>
        <div className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          Profile
        </div>
        <div className={`tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
          Account
        </div>
        <div className={`tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
          Notifications
        </div>
        <div className={`tab ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
          Privacy
        </div>
        <div className={`tab ${activeTab === 'verification' ? 'active' : ''}`} onClick={() => setActiveTab('verification')}>
          Verification
        </div>
      </div>
      
      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="card">
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
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Instagram</label>
              <input
                type="text"
                className="input"
                value={profile.instagram}
                onChange={(e) => setProfile({ ...profile, instagram: e.target.value.replace('@', '') })}
                placeholder="@username"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Twitter/X</label>
              <input
                type="text"
                className="input"
                value={profile.twitter}
                onChange={(e) => setProfile({ ...profile, twitter: e.target.value.replace('@', '') })}
                placeholder="@username"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>YouTube</label>
              <input
                type="text"
                className="input"
                value={profile.youtube}
                onChange={(e) => setProfile({ ...profile, youtube: e.target.value })}
                placeholder="YouTube channel URL or handle"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Spotify</label>
              <input
                type="text"
                className="input"
                value={profile.spotify}
                onChange={(e) => setProfile({ ...profile, spotify: e.target.value })}
                placeholder="Spotify artist ID or URL"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Location</label>
              <input
                type="text"
                className="input"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Birthday</label>
              <input
                type="date"
                className="input"
                value={profile.birthday}
                onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Relationship Status</label>
              <select
                className="input"
                value={profile.relationship}
                onChange={(e) => setProfile({ ...profile, relationship: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="single">Single</option>
                <option value="in_relationship">In a Relationship</option>
                <option value="married">Married</option>
                <option value="complicated">It's Complicated</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Education</label>
              <input
                type="text"
                className="input"
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                placeholder="School, University"
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Work</label>
              <input
                type="text"
                className="input"
                value={profile.work}
                onChange={(e) => setProfile({ ...profile, work: e.target.value })}
                placeholder="Job title, Company"
              />
            </div>
            
            {message && (
              <div style={{ 
                padding: '12px', 
                borderRadius: '12px', 
                marginBottom: '16px',
                background: message.type === 'error' ? '#fee' : '#efe',
                color: message.type === 'error' ? '#c00' : '#0a0'
              }}>
                {message.text}
              </div>
            )}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
      
      {/* Account Settings Tab */}
      {activeTab === 'account' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Change Password</h3>
          <form onSubmit={changePassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Current Password</label>
              <input
                type="password"
                className="input"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                required
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>New Password</label>
              <input
                type="password"
                className="input"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                required
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Confirm New Password</label>
              <input
                type="password"
                className="input"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              Update Password
            </button>
          </form>
          
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
            <h3 style={{ marginBottom: '16px' }}>Data & Storage</h3>
            <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '12px' }} onClick={requestDataExport}>
              <i className="fas fa-download"></i> Download Your Data
            </button>
            <button className="btn btn-outline" style={{ width: '100%', color: '#ff4444', borderColor: '#ff4444' }} onClick={deleteAccount}>
              <i className="fas fa-trash"></i> Delete Account
            </button>
          </div>
        </div>
      )}
      
      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Email Notifications</h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifications.email_likes} onChange={(e) => setNotifications({...notifications, email_likes: e.target.checked})} />
              <span>Someone likes my post</span>
            </label>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifications.email_comments} onChange={(e) => setNotifications({...notifications, email_comments: e.target.checked})} />
              <span>Someone comments on my post</span>
            </label>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifications.email_follows} onChange={(e) => setNotifications({...notifications, email_follows: e.target.checked})} />
              <span>Someone follows me</span>
            </label>
          </div>
          
          <h3 style={{ marginBottom: '16px' }}>Push Notifications</h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifications.push_likes} onChange={(e) => setNotifications({...notifications, push_likes: e.target.checked})} />
              <span>Likes</span>
            </label>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifications.push_comments} onChange={(e) => setNotifications({...notifications, push_comments: e.target.checked})} />
              <span>Comments</span>
            </label>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifications.push_follows} onChange={(e) => setNotifications({...notifications, push_follows: e.target.checked})} />
              <span>New followers</span>
            </label>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveSettings}>
            Save Notification Settings
          </button>
        </div>
      )}
      
      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Privacy Settings</h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Profile Visibility</label>
            <select className="input" value={privacy.profile_visibility} onChange={(e) => setPrivacy({...privacy, profile_visibility: e.target.value})}>
              <option value="public">🌍 Public - Anyone can see your profile</option>
              <option value="friends">👥 Friends Only</option>
              <option value="private">🔒 Private - Only you</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Post Privacy</label>
            <select className="input" value={privacy.post_privacy} onChange={(e) => setPrivacy({...privacy, post_privacy: e.target.value})}>
              <option value="public">🌍 Public</option>
              <option value="friends">👥 Friends Only</option>
              <option value="private">🔒 Only Me</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Who can message you?</label>
            <select className="input" value={privacy.message_privacy} onChange={(e) => setPrivacy({...privacy, message_privacy: e.target.value})}>
              <option value="everyone">🌍 Everyone</option>
              <option value="friends">👥 Friends Only</option>
              <option value="none">🔒 No one</option>
            </select>
          </div>
          
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveSettings}>
            Save Privacy Settings
          </button>
        </div>
      )}
      
      {/* Verification Tab */}
      {activeTab === 'verification' && (
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
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Music Platform Links</label>
              <input type="url" className="input" placeholder="Spotify Profile URL" style={{ marginBottom: '8px' }} />
              <input type="url" className="input" placeholder="Apple Music Artist URL" style={{ marginBottom: '8px' }} />
              <input type="url" className="input" placeholder="YouTube Channel URL" />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Why should you be verified?</label>
              <textarea
                id="verificationMessage"
                className="input"
                rows="4"
                placeholder="Tell us about your work, links to your music, following, achievements, etc..."
              ></textarea>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Submit Request
            </button>
          </form>
        </div>
      )}
    </div>
  )
}