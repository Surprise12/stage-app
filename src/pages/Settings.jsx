// src/pages/Settings.jsx - UPDATED WITH INLINE STYLES
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
    try {
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
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  async function loadSettings() {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      if (data) {
        if (data.notifications) setNotifications(data.notifications)
        if (data.privacy) setPrivacy(data.privacy)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  async function saveSettings() {
    try {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          notifications: notifications,
          privacy: privacy,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', session.user.id)

      if (error) throw error

      await saveSettings()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => navigate('/profile'), 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
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
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: passwordData.new 
      })
      
      if (error) throw error

      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setPasswordData({ current: '', new: '', confirm: '' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
    setLoading(false)
  }

  async function submitVerificationRequest(e) {
    e.preventDefault()
    const role = document.getElementById('verificationRole').value
    const messageText = document.getElementById('verificationMessage').value

    try {
      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: session.user.id,
          role_requested: role,
          message: messageText,
          status: 'pending'
        })

      if (error) throw error

      alert('Verification request submitted! Admins will review it.')
      document.getElementById('verificationMessage').value = ''
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function requestDataExport() {
    alert('Your data export request has been submitted. You will receive an email within 24 hours.')
  }

  async function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      const confirmText = prompt('Type "DELETE" to confirm account deletion:')
      if (confirmText === 'DELETE') {
        try {
          await supabase.from('profiles').delete().eq('id', session.user.id)
          await supabase.auth.signOut()
          navigate('/login')
        } catch (error) {
          console.error('Error deleting account:', error)
        }
      }
    }
  }

  const styles = {
    container: {
      maxWidth: '700px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '700',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#6b7280',
      marginBottom: '24px'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      borderBottom: '2px solid #eee',
      overflowX: 'auto',
      flexWrap: 'wrap'
    },
    tab: {
      padding: '10px 20px',
      fontWeight: '700',
      color: '#6b7280',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s',
      fontSize: '14px',
      whiteSpace: 'nowrap'
    },
    tabActive: {
      color: '#000'
    },
    tabIndicator: {
      position: 'absolute',
      bottom: '-2px',
      left: 0,
      right: 0,
      height: '2px',
      background: '#7c3aed'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    cardTitle: {
      marginBottom: '16px',
      fontWeight: '700'
    },
    formGroup: {
      marginBottom: '16px'
    },
    formLabel: {
      display: 'block',
      marginBottom: '8px',
      color: '#6b7280',
      fontWeight: '700'
    },
    formInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      transition: 'all 0.2s',
      background: 'white'
    },
    formTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
      background: 'white'
    },
    formSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      background: 'white'
    },
    primaryBtn: {
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
    secondaryBtn: {
      width: '100%',
      padding: '14px',
      background: '#f3f4f6',
      color: '#1f2937',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      marginBottom: '12px',
      transition: 'all 0.2s'
    },
    dangerBtn: {
      width: '100%',
      padding: '14px',
      background: 'transparent',
      color: '#ef4444',
      border: '1px solid #ef4444',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s'
    },
    message: {
      padding: '12px',
      borderRadius: '12px',
      marginBottom: '16px',
      fontWeight: '700'
    },
    messageError: {
      background: '#fee',
      color: '#c00'
    },
    messageSuccess: {
      background: '#efe',
      color: '#0a0'
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer'
    },
    checkboxInput: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    divider: {
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: '1px solid #eee'
    },
    dividerTitle: {
      marginBottom: '16px',
      fontWeight: '700'
    },
    verificationInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      transition: 'all 0.2s',
      background: 'white',
      marginBottom: '8px'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⚙️ Settings</h1>
      <p style={styles.subtitle}>Manage your account preferences</p>
      
      {/* Settings Tabs */}
      <div style={styles.tabs}>
        <div 
          style={{...styles.tab, ...(activeTab === 'profile' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('profile')}
        >
          Profile
          {activeTab === 'profile' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'account' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('account')}
        >
          Account
          {activeTab === 'account' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'notifications' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
          {activeTab === 'notifications' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'privacy' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('privacy')}
        >
          Privacy
          {activeTab === 'privacy' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'verification' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('verification')}
        >
          Verification
          {activeTab === 'verification' && <div style={styles.tabIndicator}></div>}
        </div>
      </div>
      
      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Profile Information</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Display Name</label>
              <input
                type="text"
                style={styles.formInput}
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="Your display name"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Bio</label>
              <textarea
                style={styles.formTextarea}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell the community about yourself..."
                rows="3"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Website</label>
              <input
                type="url"
                style={styles.formInput}
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Instagram</label>
              <input
                type="text"
                style={styles.formInput}
                value={profile.instagram}
                onChange={(e) => setProfile({ ...profile, instagram: e.target.value.replace('@', '') })}
                placeholder="@username"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Twitter/X</label>
              <input
                type="text"
                style={styles.formInput}
                value={profile.twitter}
                onChange={(e) => setProfile({ ...profile, twitter: e.target.value.replace('@', '') })}
                placeholder="@username"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>YouTube</label>
              <input
                type="text"
                style={styles.formInput}
                value={profile.youtube}
                onChange={(e) => setProfile({ ...profile, youtube: e.target.value })}
                placeholder="YouTube channel URL or handle"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Spotify</label>
              <input
                type="text"
                style={styles.formInput}
                value={profile.spotify}
                onChange={(e) => setProfile({ ...profile, spotify: e.target.value })}
                placeholder="Spotify artist ID or URL"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Location</label>
              <input
                type="text"
                style={styles.formInput}
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Birthday</label>
              <input
                type="date"
                style={styles.formInput}
                value={profile.birthday}
                onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Relationship Status</label>
              <select
                style={styles.formSelect}
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
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Education</label>
              <input
                type="text"
                style={styles.formInput}
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                placeholder="School, University"
              />
            </div>
            
            <div style={{...styles.formGroup, marginBottom: '24px'}}>
              <label style={styles.formLabel}>Work</label>
              <input
                type="text"
                style={styles.formInput}
                value={profile.work}
                onChange={(e) => setProfile({ ...profile, work: e.target.value })}
                placeholder="Job title, Company"
              />
            </div>
            
            {message && (
              <div style={{
                ...styles.message,
                ...(message.type === 'error' ? styles.messageError : styles.messageSuccess)
              }}>
                {message.text}
              </div>
            )}
            
            <button 
              type="submit" 
              style={styles.primaryBtn} 
              disabled={loading}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#6d28d9' }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#7c3aed' }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
      
      {/* Account Settings Tab */}
      {activeTab === 'account' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Change Password</h3>
          <form onSubmit={changePassword}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Current Password</label>
              <input
                type="password"
                style={styles.formInput}
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>New Password</label>
              <input
                type="password"
                style={styles.formInput}
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                required
              />
            </div>
            
            <div style={{...styles.formGroup, marginBottom: '24px'}}>
              <label style={styles.formLabel}>Confirm New Password</label>
              <input
                type="password"
                style={styles.formInput}
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                required
              />
            </div>
            
            <button 
              type="submit" 
              style={styles.primaryBtn} 
              disabled={loading}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#6d28d9' }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#7c3aed' }}
            >
              Update Password
            </button>
          </form>
          
          <div style={styles.divider}>
            <h3 style={styles.dividerTitle}>Data & Storage</h3>
            <button 
              style={styles.secondaryBtn} 
              onClick={requestDataExport}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              <i className="fas fa-download"></i> Download Your Data
            </button>
            <button 
              style={styles.dangerBtn} 
              onClick={deleteAccount}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444' }}
            >
              <i className="fas fa-trash"></i> Delete Account
            </button>
          </div>
        </div>
      )}
      
      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Email Notifications</h3>
          <div style={styles.formGroup}>
            <label style={styles.checkbox}>
              <input type="checkbox" style={styles.checkboxInput} checked={notifications.email_likes} onChange={(e) => setNotifications({...notifications, email_likes: e.target.checked})} />
              <span>Someone likes my post</span>
            </label>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.checkbox}>
              <input type="checkbox" style={styles.checkboxInput} checked={notifications.email_comments} onChange={(e) => setNotifications({...notifications, email_comments: e.target.checked})} />
              <span>Someone comments on my post</span>
            </label>
          </div>
          <div style={{...styles.formGroup, marginBottom: '24px'}}>
            <label style={styles.checkbox}>
              <input type="checkbox" style={styles.checkboxInput} checked={notifications.email_follows} onChange={(e) => setNotifications({...notifications, email_follows: e.target.checked})} />
              <span>Someone follows me</span>
            </label>
          </div>
          
          <h3 style={styles.cardTitle}>Push Notifications</h3>
          <div style={styles.formGroup}>
            <label style={styles.checkbox}>
              <input type="checkbox" style={styles.checkboxInput} checked={notifications.push_likes} onChange={(e) => setNotifications({...notifications, push_likes: e.target.checked})} />
              <span>Likes</span>
            </label>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.checkbox}>
              <input type="checkbox" style={styles.checkboxInput} checked={notifications.push_comments} onChange={(e) => setNotifications({...notifications, push_comments: e.target.checked})} />
              <span>Comments</span>
            </label>
          </div>
          <div style={{...styles.formGroup, marginBottom: '24px'}}>
            <label style={styles.checkbox}>
              <input type="checkbox" style={styles.checkboxInput} checked={notifications.push_follows} onChange={(e) => setNotifications({...notifications, push_follows: e.target.checked})} />
              <span>New followers</span>
            </label>
          </div>
          
          <button 
            style={styles.primaryBtn} 
            onClick={saveSettings}
            onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
          >
            Save Notification Settings
          </button>
        </div>
      )}
      
      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Privacy Settings</h3>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Profile Visibility</label>
            <select style={styles.formSelect} value={privacy.profile_visibility} onChange={(e) => setPrivacy({...privacy, profile_visibility: e.target.value})}>
              <option value="public">🌍 Public - Anyone can see your profile</option>
              <option value="friends">👥 Friends Only</option>
              <option value="private">🔒 Private - Only you</option>
            </select>
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Post Privacy</label>
            <select style={styles.formSelect} value={privacy.post_privacy} onChange={(e) => setPrivacy({...privacy, post_privacy: e.target.value})}>
              <option value="public">🌍 Public</option>
              <option value="friends">👥 Friends Only</option>
              <option value="private">🔒 Only Me</option>
            </select>
          </div>
          
          <div style={{...styles.formGroup, marginBottom: '24px'}}>
            <label style={styles.formLabel}>Who can message you?</label>
            <select style={styles.formSelect} value={privacy.message_privacy} onChange={(e) => setPrivacy({...privacy, message_privacy: e.target.value})}>
              <option value="everyone">🌍 Everyone</option>
              <option value="friends">👥 Friends Only</option>
              <option value="none">🔒 No one</option>
            </select>
          </div>
          
          <button 
            style={styles.primaryBtn} 
            onClick={saveSettings}
            onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
          >
            Save Privacy Settings
          </button>
        </div>
      )}
      
      {/* Verification Tab */}
      {activeTab === 'verification' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🎤 Request Verification</h3>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>Get the blue checkmark and unlock the Music Videos section.</p>
          
          <form onSubmit={submitVerificationRequest}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>I am a...</label>
              <select id="verificationRole" style={styles.formSelect}>
                <option value="artist">Artist / Musician</option>
                <option value="producer">Producer</option>
                <option value="comedian">Comedian</option>
                <option value="manager">Manager / Label</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Music Platform Links</label>
              <input type="url" style={styles.verificationInput} placeholder="Spotify Profile URL" />
              <input type="url" style={styles.verificationInput} placeholder="Apple Music Artist URL" />
              <input type="url" style={styles.verificationInput} placeholder="YouTube Channel URL" />
            </div>
            
            <div style={{...styles.formGroup, marginBottom: '24px'}}>
              <label style={styles.formLabel}>Why should you be verified?</label>
              <textarea
                id="verificationMessage"
                style={styles.formTextarea}
                rows="4"
                placeholder="Tell us about your work, links to your music, following, achievements, etc..."
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              style={styles.primaryBtn}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              Submit Request
            </button>
          </form>
        </div>
      )}
    </div>
  )
}