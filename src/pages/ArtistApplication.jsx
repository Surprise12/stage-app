// src/pages/ArtistApplication.jsx
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ArtistApplication({ session }) {
  const [formData, setFormData] = useState({
    artistName: '',
    genre: '',
    bio: '',
    website: '',
    socialLinks: '',
    experience: '',
    samples: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await supabase
        .from('artist_applications')
        .insert({
          user_id: session.user.id,
          ...formData,
          status: 'pending'
        })
      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Error submitting application. Please try again.')
    }
    setLoading(false)
  }

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px',
      color: '#1f2937'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      fontWeight: '700',
      marginBottom: '24px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    label: {
      fontWeight: '700',
      fontSize: '14px',
      color: '#1f2937',
      marginBottom: '4px'
    },
    input: {
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      transition: 'all 0.2s'
    },
    textarea: {
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    submitBtn: {
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
    successContainer: {
      textAlign: 'center',
      padding: '40px 20px'
    },
    successIcon: {
      fontSize: '64px',
      marginBottom: '16px'
    },
    successTitle: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    successText: {
      fontSize: '16px',
      color: '#6b7280',
      fontWeight: '700'
    }
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>✅</div>
          <div style={styles.successTitle}>Application Submitted!</div>
          <div style={styles.successText}>Your application is being reviewed. We'll get back to you soon!</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>🎤 Apply as Artist</div>
      <div style={styles.subtitle}>Join our verified artist community</div>
      
      <form style={styles.form} onSubmit={handleSubmit}>
        <div>
          <div style={styles.label}>Artist Name *</div>
          <input 
            style={styles.input}
            placeholder="Your stage name"
            value={formData.artistName}
            onChange={(e) => setFormData({...formData, artistName: e.target.value})}
            required
          />
        </div>
        
        <div>
          <div style={styles.label}>Genre *</div>
          <input 
            style={styles.input}
            placeholder="e.g., Hip Hop, R&B, Electronic"
            value={formData.genre}
            onChange={(e) => setFormData({...formData, genre: e.target.value})}
            required
          />
        </div>
        
        <div>
          <div style={styles.label}>Bio *</div>
          <textarea 
            style={styles.textarea}
            placeholder="Tell us about yourself and your music"
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            required
          />
        </div>
        
        <div>
          <div style={styles.label}>Website</div>
          <input 
            style={styles.input}
            placeholder="https://yourwebsite.com"
            value={formData.website}
            onChange={(e) => setFormData({...formData, website: e.target.value})}
          />
        </div>
        
        <div>
          <div style={styles.label}>Social Links</div>
          <input 
            style={styles.input}
            placeholder="Instagram, Twitter, Spotify links"
            value={formData.socialLinks}
            onChange={(e) => setFormData({...formData, socialLinks: e.target.value})}
          />
        </div>
        
        <div>
          <div style={styles.label}>Experience</div>
          <textarea 
            style={styles.textarea}
            placeholder="Tell us about your experience..."
            value={formData.experience}
            onChange={(e) => setFormData({...formData, experience: e.target.value})}
          />
        </div>
        
        <div>
          <div style={styles.label}>Sample Links</div>
          <input 
            style={styles.input}
            placeholder="SoundCloud, YouTube, or other links"
            value={formData.samples}
            onChange={(e) => setFormData({...formData, samples: e.target.value})}
          />
        </div>
        
        <button 
          style={styles.submitBtn} 
          type="submit" 
          disabled={loading}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}