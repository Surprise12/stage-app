// src/pages/Advertise.jsx
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Advertise({ session }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_audience: 'all',
    budget: '',
    duration: '7',
    link: '',
    image_url: ''
  })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.title || !formData.link) {
      alert('Please fill in title and link')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('advertisements')
        .insert({
          user_id: session.user.id,
          title: formData.title,
          description: formData.description,
          target_audience: formData.target_audience,
          budget: parseFloat(formData.budget) || 0,
          duration: parseInt(formData.duration),
          link: formData.link,
          image_url: formData.image_url || null,
          status: 'pending'
        })

      if (error) throw error

      alert('📢 Advertisement submitted for review!\n\nYou will be notified when it\'s approved.')
      setFormData({
        title: '',
        description: '',
        target_audience: 'all',
        budget: '',
        duration: '7',
        link: '',
        image_url: ''
      })
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setLoading(false)
  }

  const styles = {
    container: {
      maxWidth: '600px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#6b7280',
      marginBottom: '24px'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    formGroup: { marginBottom: '16px' },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: '#6b7280',
      fontWeight: '700'
    },
    input: {
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
    textarea: {
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
    select: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      background: 'white'
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s',
      marginTop: '8px'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📢 Advertise</h1>
      <p style={styles.subtitle}>Reach more people and grow your audience</p>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Ad Title *</label>
            <input
              type="text"
              style={styles.input}
              placeholder="Your ad title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              placeholder="Describe what you're promoting"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Target Audience</label>
            <select
              style={styles.select}
              value={formData.target_audience}
              onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
            >
              <option value="all">🌍 Everyone</option>
              <option value="artists">🎵 Artists</option>
              <option value="fans">👥 Fans</option>
              <option value="producers">🎹 Producers</option>
              <option value="labels">🏷️ Labels</option>
            </select>
          </div>

          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Budget ($)</label>
              <input
                type="number"
                style={styles.input}
                placeholder="10"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Duration (days)</label>
              <select
                style={styles.select}
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Link *</label>
            <input
              type="url"
              style={styles.input}
              placeholder="https://yourlink.com"
              value={formData.link}
              onChange={(e) => setFormData({...formData, link: e.target.value})}
              required
            />
          </div>

          <div style={{...styles.formGroup, marginBottom: '24px'}}>
            <label style={styles.label}>Image URL (optional)</label>
            <input
              type="url"
              style={styles.input}
              placeholder="https://example.com/ad-image.png"
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            />
          </div>

          <button
            type="submit"
            style={styles.submitBtn}
            disabled={loading}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#6d28d9' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#7c3aed' }}
          >
            {loading ? 'Submitting...' : 'Submit Advertisement'}
          </button>
        </form>
      </div>
    </div>
  )
}